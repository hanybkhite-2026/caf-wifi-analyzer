#!/usr/bin/env node
// CAF-WIFI Local Agent v1.0 — Run: node caf-wifi-agent.js
const http = require('http');
const { execFile } = require('child_process');
const os = require('os');
const PORT = 7788;

const OUI = {
  '08:d2:3e':'INTEL CORP','00:0b:86':'ARUBA NETWORKS','7c:1c:f1':'HUAWEI',
  '98:da:c4':'TP-LINK','9e:da:c4':'GENERIC','d4:ae:52':'NETGEAR',
  '4c:5e:0c':'TP-LINK','b0:4e:26':'TP-LINK','00:17:f2':'APPLE',
  'f8:ff:c2':'CISCO','08:92:04':'INTEL','a0:40:a0':'NETGEAR',
  'c8:b3:73':'UBIQUITI','fc:ec:da':'UBIQUITI'
};
const vend = m => { if(!m) return 'UNKNOWN'; const k = m.slice(0,8).toLowerCase().replace(/-/g,':'); return OUI[k] || 'UNKNOWN VENDOR'; };
const dst  = (r,f) => +(Math.pow(10,(27.55-(20*Math.log10(f))+Math.abs(r))/20)).toFixed(1);
const ss   = s => {
  const p = [];
  if(s.includes('WPA3')) p.push('[WPA3-SAE-CCMP]');
  if(s.includes('WPA2') && s.includes('WPA')) p.push('[WPA2-PSK-CCMP+TKIP]');
  else if(s.includes('WPA2')) p.push('[WPA2-PSK-CCMP]');
  if(s.includes('WPA') && !s.includes('WPA2')) p.push('[WPA-PSK-CCMP+TKIP]');
  if(s.includes('WPS')) p.push('[WPS]');
  p.push('[ESS]');
  return p.join('');
};

function getIPs() {
  const ips = [];
  for (const iface of Object.values(os.networkInterfaces()))
    for (const a of iface)
      if (a.family === 'IPv4' && !a.internal) ips.push(a.address);
  return ips;
}

// ── Windows: parse netsh wlan show networks mode=bssid ───────────────────
function parseWindows(raw) {
  const nets = [];
  let cur = null;
  for (const line of raw.split(/\r?\n/)) {
    const l = line.trim();
    // New SSID block — "SSID 1 : MyNetwork"
    if (/^SSID \d+\s*:/.test(l) && !/^BSSID/.test(l)) {
      if (cur && cur.ssid && cur.bssid) nets.push(cur);
      cur = { ssid: l.replace(/^SSID \d+\s*:\s*/, '').trim(),
              bssid:'', signal:-70, primaryCh:0, freq:2412, bw:20,
              security:['OPEN'], band:'2.4' };
    } else if (cur) {
      if (/^BSSID \d+\s*:/.test(l)) {
        cur.bssid = l.replace(/^BSSID \d+\s*:\s*/, '').trim();
      } else if (/^Signal\s*:/.test(l)) {
        const m = l.match(/(\d+)\s*%/);
        if (m) cur.signal = Math.round(parseInt(m[1]) / 2 - 100);
      } else if (/^Channel\s*:/.test(l)) {
        const m = l.match(/:\s*(\d+)/);
        if (m) {
          cur.primaryCh = parseInt(m[1]);
          cur.freq = cur.primaryCh <= 13 ? 2412 + (cur.primaryCh-1)*5 : 5000 + cur.primaryCh*5;
          cur.band = cur.primaryCh > 13 ? '5' : '2.4';
        }
      } else if (/^Authentication\s*:/.test(l)) {
        const m = l.match(/:\s*(.+)/);
        if (m) {
          const a = m[1].trim();
          cur.security = a.includes('WPA3') ? ['WPA3','WPA2'] :
                         a.includes('WPA2') ? ['WPA2'] :
                         a.includes('WPA')  ? ['WPA']  : ['OPEN'];
        }
      } else if (/^Radio type\s*:/.test(l)) {
        if (l.includes('802.11ac') || l.includes('802.11ax')) {
          cur.band = '5'; cur.freq = 5180;
        }
      }
    }
  }
  if (cur && cur.ssid && cur.bssid) nets.push(cur);
  const seen = new Set();
  return nets
    .filter(n => { const k = (n.bssid||n.ssid)+n.primaryCh; if(seen.has(k)) return false; seen.add(k); return true; })
    .map(n => ({ ...n, vendor:vend(n.bssid), dist:dst(n.signal,n.freq),
                 secStr:ss(n.security), freqStart:n.freq-10, freqEnd:n.freq+10,
                 chLabel: n.primaryCh ? String(n.primaryCh) : '?',
                 std: n.primaryCh > 13 ? '5' : '4', centerCh: null }));
}

// ── macOS: airport -s ────────────────────────────────────────────────────
function parseMac(raw) {
  return raw.split('\n').slice(1).filter(l => l.trim()).map(line => {
    const p = line.trim().split(/\s+/);
    const ch = p[3] ? parseInt(p[3]) : 0;
    const sig = p[2] ? parseInt(p[2]) : -70;
    const freq = ch <= 13 ? 2412+(ch-1)*5 : 5000+ch*5;
    const security = [p[6] || 'OPEN'];
    return { ssid:p[0]||'', bssid:p[1]||'', signal:sig, primaryCh:ch, freq,
             bw:20, security, band:ch>13?'5':'2.4', vendor:vend(p[1]||''),
             dist:dst(sig,freq), secStr:ss(security),
             freqStart:freq-10, freqEnd:freq+10, chLabel:String(ch), std:ch>13?'5':'4', centerCh:null };
  }).filter(n => n.ssid);
}

// ── Linux: nmcli ─────────────────────────────────────────────────────────
function parseLinux(raw) {
  return raw.split('\n').filter(l => l.trim() && !l.startsWith('IN-USE') && !l.startsWith('SSID')).map(line => {
    const mac = line.match(/([0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5})/);
    const bssid = mac ? mac[1] : '';
    const parts = line.split(':');
    const ssid = (parts[0]||'').replace(/\\:/g,':').trim();
    if (!ssid || ssid==='--') return null;
    const sigRaw = parts.find(p => /^-\d{2,3}$/.test(p.trim()));
    const sig = sigRaw ? parseInt(sigRaw) : -70;
    const chRaw = parts.find(p => /^\d{1,3}$/.test(p.trim()) && parseInt(p)<200);
    const ch = chRaw ? parseInt(chRaw) : 0;
    const freqP = parts.find(p => p.includes('GHz')||p.includes('MHz'));
    let freq = ch<=13 ? 2412+(ch-1)*5 : ch>13 ? 5000+ch*5 : 2412;
    if (freqP) { const f=parseFloat(freqP); freq=f>100?f:f*1000; }
    const secPart = parts.find(p => /WPA|WEP|Open/i.test(p));
    const security = secPart ? secPart.trim().split(/\s+/).filter(Boolean) : ['OPEN'];
    return { ssid, bssid, signal:sig, primaryCh:ch, freq, bw:20, security,
             band:freq>=5945?'6':freq>=5180?'5':'2.4', vendor:vend(bssid),
             dist:dst(sig,freq), secStr:ss(security),
             freqStart:freq-10, freqEnd:freq+10, chLabel:String(ch), std:freq>=5180?'5':'4', centerCh:null };
  }).filter(Boolean);
}

// ── Main scan ─────────────────────────────────────────────────────────────
function scan() {
  return new Promise(resolve => {
    const platform = os.platform();
    let cmd, args, parse;
    if (platform === 'win32') {
      cmd = 'netsh'; args = ['wlan','show','networks','mode=bssid'];
      parse = parseWindows;
    } else if (platform === 'darwin') {
      cmd = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport';
      args = ['-s'];
      parse = parseMac;
    } else {
      cmd = 'nmcli'; parse = parseLinux;
      args = ['-t','-f','SSID,BSSID,CHAN,FREQ,SIGNAL,SECURITY','dev','wifi','list','--rescan','yes'];
    }
    execFile(cmd, args, {timeout:12000}, (err, out) => {
      if (err) return resolve({networks:[],error:'Scan failed: '+err.message,method:'none'});
      try {
        const nets = parse(out);
        const seen = new Set();
        const unique = nets.filter(n => { const k=(n.bssid||n.ssid)+n.primaryCh; if(seen.has(k))return false; seen.add(k);return true; });
        resolve({networks:unique, method:platform, count:unique.length, error:null});
      } catch(e) {
        resolve({networks:[], error:e.message, method:'parse-error'});
      }
    });
  });
}

// ── HTTP Server ────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  if (req.url === '/api/scan' || req.url === '/scan') {
    console.log('['+new Date().toLocaleTimeString()+'] Scanning WiFi...');
    const r = await scan();
    console.log('['+new Date().toLocaleTimeString()+'] '+r.networks.length+' networks found via '+r.method);
    res.writeHead(200);
    res.end(JSON.stringify({...r, timestamp:new Date().toISOString()}));
    return;
  }
  res.writeHead(200);
  res.end(JSON.stringify({status:'ok', agent:'CAF-WIFI v1.0', platform:os.platform()}));
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = getIPs();
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║       CAF-WIFI Local Agent v1.0           ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  console.log('✅ Agent running on port ' + PORT + '\n');
  console.log('📱 Enter one of these URLs in the app:\n');
  ips.forEach(ip => console.log('   http://' + ip + ':' + PORT + '/api/scan'));
  console.log('\n⚡ Make sure your phone is on the SAME WiFi!');
  console.log('⏹  Press Ctrl+C to stop\n');
  console.log('─'.repeat(47));
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error('\n❌ Port ' + PORT + ' is already in use.');
    console.error('   Close any other running agents and try again.\n');
  } else console.error(err);
  process.exit(1);
});
