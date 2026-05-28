#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
//  CAF-WIFI Local Agent v1.0
//  Standalone WiFi scanner — no installation required
//  
//  Usage:
//    node caf-wifi-agent.js
//
//  Then open https://caf-wifi-new.vercel.app on any device
//  on the same network and tap "Connect Agent"
//  Enter: http://YOUR-IP:7788/api/scan
// ═══════════════════════════════════════════════════════════════

const http  = require('http');
const https = require('https');
const { execFile, exec } = require('child_process');
const os    = require('os');

const PORT = 7788;

// ── Get local IP addresses ─────────────────────────────────────
function getLocalIPs() {
  const ips = [];
  const nets = os.networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        ips.push(addr.address);
      }
    }
  }
  return ips;
}

// ── OUI vendor lookup ──────────────────────────────────────────
const OUI = {
  '00:0b:86':'ARUBA NETWORKS','7c:1c:f1':'HUAWEI TECHNOLOGIES',
  '98:da:c4':'TP-LINK TECHNOLOGIES','9e:da:c4':'GENERIC VENDOR',
  'a8:5b:f7':'TP-LINK TECHNOLOGIES','44:e9:68':'HUAWEI TECHNOLOGIES',
  'bc:14:01':'HITRON TECHNOLOGIES','c8:b3:73':'UBIQUITI NETWORKS',
  'fc:ec:da':'UBIQUITI NETWORKS','d4:ae:52':'NETGEAR','a0:40:a0':'NETGEAR',
  '4c:5e:0c':'TP-LINK','50:c7:bf':'TP-LINK','b0:4e:26':'TP-LINK',
  '00:17:f2':'APPLE','b8:27:eb':'RASPBERRY PI','00:50:f2':'MICROSOFT',
  'f8:ff:c2':'CISCO SYSTEMS','00:1a:1e':'CISCO MERAKI',
};
const vendor = mac => {
  if (!mac) return 'UNKNOWN';
  const k = mac.slice(0,8).toLowerCase().replace(/-/g,':');
  return OUI[k] || 'UNKNOWN VENDOR';
};

// ── Distance formula (WiFiAnalyzer exact) ─────────────────────
const dist = (rssi, freq) =>
  +(Math.pow(10,(27.55-(20*Math.log10(freq))+Math.abs(rssi))/20)).toFixed(1);

// ── Security string ────────────────────────────────────────────
const secStr = secs => {
  const p=[];
  if(secs.includes('WPA3'))p.push('[WPA3-SAE-CCMP]');
  if(secs.includes('WPA2')&&secs.includes('WPA'))p.push('[WPA2-PSK-CCMP+TKIP]');
  else if(secs.includes('WPA2'))p.push('[WPA2-PSK-CCMP]');
  if(secs.includes('WPA')&&!secs.includes('WPA2'))p.push('[WPA-PSK-CCMP+TKIP]');
  if(secs.includes('WPS'))p.push('[WPS]');
  if(secs.includes('WEP'))p.push('[WEP]');
  p.push('[ESS]');
  return p.join('');
};

// ── Parsers ────────────────────────────────────────────────────
function parseLinux(raw) {
  return raw.split('\n')
    .filter(l => l.trim() && !l.startsWith('IN-USE') && !l.startsWith('SSID'))
    .map(line => {
      const mac = line.match(/([0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5})/);
      const bssid = mac ? mac[1] : '';
      const parts = line.split(':');
      const ssid = (parts[0]||'').replace(/\\:/g,':').trim();
      if (!ssid || ssid==='--' || ssid==='SSID') return null;
      const sigRaw = parts.find(p=>/^-\d{2,3}$/.test(p.trim()));
      const sig = sigRaw ? parseInt(sigRaw) : -70;
      const chRaw = parts.find(p=>/^\d{1,3}$/.test(p.trim())&&parseInt(p)<200);
      const ch = chRaw ? parseInt(chRaw) : 0;
      const freqRaw = parts.find(p=>p.includes('GHz')||p.includes('MHz'));
      let freq = ch<=13 ? 2412+(ch-1)*5 : ch>13 ? 5000+ch*5 : 2412;
      if(freqRaw){const f=parseFloat(freqRaw);freq=f>100?f:f*1000;}
      const secPart = parts.find(p=>/WPA|WEP|Open/i.test(p));
      const security = secPart ? secPart.trim().split(/\s+/).filter(Boolean) : ['OPEN'];
      return {
        ssid, bssid, signal:sig, primaryCh:ch, freq, bw:20, security,
        band: freq>=5945?'6':freq>=5180?'5':'2.4',
        vendor:vendor(bssid), dist:dist(sig,freq), secStr:secStr(security),
        freqStart:freq-10, freqEnd:freq+10,
        chLabel:String(ch), std: freq>=5180?'5':'4',
      };
    }).filter(Boolean);
}

function parseMac(raw) {
  return raw.split('\n').slice(1).filter(l=>l.trim()).map(line => {
    const p = line.trim().split(/\s+/);
    const ch = p[3]?parseInt(p[3]):0;
    const sig = p[2]?parseInt(p[2]):-70;
    const freq = ch<=13 ? 2412+(ch-1)*5 : 5000+ch*5;
    const security = [p[6]||'OPEN'];
    return {
      ssid:p[0]||'', bssid:p[1]||'', signal:sig, primaryCh:ch, freq,
      bw:20, security, band:ch>13?'5':'2.4',
      vendor:vendor(p[1]||''), dist:dist(sig,freq), secStr:secStr(security),
      freqStart:freq-10, freqEnd:freq+10, chLabel:String(ch), std:ch>13?'5':'4',
    };
  }).filter(n=>n.ssid);
}

function parseWin(raw) {
  const nets = [];
  for (const b of raw.split(/\r?\nSSID \d+/)) {
    const ssid = (b.match(/:\s*(.+)/)||[])[1]?.trim();
    if(!ssid) continue;
    const bssid = (b.match(/BSSID\s+\d+\s*:\s*(.+)/)||[])[1]?.trim()||'';
    const sigPct = (b.match(/Signal\s*:\s*(\d+)%/)||[])[1];
    const ch = (b.match(/Channel\s*:\s*(\d+)/)||[])[1];
    const sec = (b.match(/Authentication\s*:\s*(.+)/)||[])[1]?.trim()||'OPEN';
    const chN = ch?parseInt(ch):0;
    const sig = sigPct?Math.round(parseInt(sigPct)/2-100):-70;
    const freq = chN<=13?2412+(chN-1)*5:5000+chN*5;
    const security = [sec.replace(/-Personal|-Enterprise/g,'')];
    nets.push({
      ssid, bssid, signal:sig, primaryCh:chN, freq, bw:20, security,
      band:chN>13?'5':'2.4', vendor:vendor(bssid), dist:dist(sig,freq),
      secStr:secStr(security), freqStart:freq-10, freqEnd:freq+10,
      chLabel:String(chN), std:chN>13?'5':'4',
    });
  }
  return nets;
}

// ── Try multiple scan commands ─────────────────────────────────
function tryNmcli() {
  return new Promise(resolve => {
    execFile('nmcli', ['-t','-f','SSID,BSSID,CHAN,FREQ,SIGNAL,SECURITY','dev','wifi','list','--rescan','yes'],
      {timeout:12000}, (err,out) => {
        if(err||!out.trim()) return resolve(null);
        const nets = parseLinux(out);
        resolve(nets.length>0?{networks:nets,method:'nmcli'}:null);
      });
  });
}
function tryIw() {
  return new Promise(resolve => {
    exec('iw dev 2>/dev/null | grep Interface | head -1', (err,out) => {
      const iface = out?.trim().replace('Interface ','');
      if(!iface) return resolve(null);
      execFile('iw',[iface,'scan'],{timeout:15000}, (err2,out2) => {
        if(err2||!out2.trim()) return resolve(null);
        // Basic iw parse
        const nets=[];
        const blocks=out2.split('BSS ').filter(b=>b.trim());
        for(const block of blocks){
          const mac=(block.match(/^([0-9a-f:]{17})/i)||[])[1]||'';
          const ssidM=block.match(/SSID:\s*(.+)/);
          const freqM=block.match(/freq:\s*(\d+)/);
          const sigM=block.match(/signal:\s*([-\d.]+)/);
          const chM=block.match(/DS Parameter set: channel\s*(\d+)/)||block.match(/\* primary channel:\s*(\d+)/);
          if(!ssidM) continue;
          const ssid=ssidM[1].trim();
          const freq=freqM?parseInt(freqM[1]):2412;
          const sig=sigM?Math.round(parseFloat(sigM[1])):-80;
          const ch=chM?parseInt(chM[1]):0;
          const security=[];
          if(block.includes('WPA2')||block.includes('RSN'))security.push('WPA2');
          if(block.includes('WPA'))security.push('WPA');
          if(block.includes('WPS'))security.push('WPS');
          if(!security.length)security.push('OPEN');
          nets.push({ssid,bssid:mac,signal:sig,primaryCh:ch,freq,bw:20,security,
            band:freq>=5180?'5':'2.4',vendor:vendor(mac),dist:dist(sig,freq),
            secStr:secStr(security),freqStart:freq-10,freqEnd:freq+10,
            chLabel:String(ch),std:freq>=5180?'5':'4'});
        }
        resolve(nets.length>0?{networks:nets,method:'iw'}:null);
      });
    });
  });
}
function tryIwlist() {
  return new Promise(resolve => {
    exec('iwlist scan 2>/dev/null', {timeout:12000}, (err,out) => {
      if(err||!out.includes('ESSID')) return resolve(null);
      const nets=[];
      for(const cell of out.split(/Cell \d+/).filter(c=>c.includes('ESSID'))){
        const ssid=(cell.match(/ESSID:"([^"]*)"/)||[])[1]||'';
        const mac=(cell.match(/Address:\s*([0-9A-Fa-f:]{17})/)||[])[1]||'';
        const freq=parseFloat((cell.match(/Frequency:(\d+\.\d+)/)||[])[1]||'2.412')*1000;
        const ch=parseInt((cell.match(/Channel:\s*(\d+)/)||[])[1]||'0');
        const sig=parseInt((cell.match(/Signal level=(-?\d+)/)||[])[1]||'-80');
        const enc=cell.includes('WPA2')?['WPA2']:cell.includes('WPA')?['WPA']:cell.includes('WEP')?['WEP']:['OPEN'];
        nets.push({ssid,bssid:mac,signal:sig,primaryCh:ch,freq,bw:20,security:enc,
          band:freq>=5180?'5':'2.4',vendor:vendor(mac),dist:dist(sig,freq),
          secStr:secStr(enc),freqStart:freq-10,freqEnd:freq+10,
          chLabel:String(ch),std:freq>=5180?'5':'4'});
      }
      resolve(nets.length>0?{networks:nets,method:'iwlist'}:null);
    });
  });
}
function tryNetsh() {
  return new Promise(resolve => {
    if(os.platform()!=='win32') return resolve(null);
    execFile('netsh',['wlan','show','networks','mode=bssid'],{timeout:10000},(err,out)=>{
      if(err||!out) return resolve(null);
      const nets=parseWin(out);
      resolve(nets.length>0?{networks:nets,method:'netsh'}:null);
    });
  });
}
function tryAirport() {
  return new Promise(resolve => {
    if(os.platform()!=='darwin') return resolve(null);
    const airport='/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport';
    execFile(airport,['-s'],{timeout:10000},(err,out)=>{
      if(err||!out) return resolve(null);
      const nets=parseMac(out);
      resolve(nets.length>0?{networks:nets,method:'airport'}:null);
    });
  });
}

async function scan() {
  const methods = os.platform()==='win32'
    ? [tryNetsh]
    : os.platform()==='darwin'
      ? [tryAirport]
      : [tryNmcli, tryIw, tryIwlist];

  for (const method of methods) {
    const result = await method();
    if (result) {
      // Deduplicate
      const seen = new Set();
      result.networks = result.networks.filter(n=>{
        const k=(n.bssid||n.ssid)+n.primaryCh;
        if(seen.has(k)) return false; seen.add(k); return true;
      });
      return result;
    }
  }
  return {
    networks:[],
    error:'No WiFi scanner found. Install nmcli: sudo apt install network-manager',
    method:'none'
  };
}

// ── HTTP Server ────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS — allow requests from any origin (Vercel, local, etc.)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({status:'ok',agent:'CAF-WIFI Agent v1.0',platform:os.platform()}));
    return;
  }

  if (req.url === '/api/scan' || req.url === '/scan') {
    console.log(`[${new Date().toLocaleTimeString()}] Scan requested...`);
    try {
      const result = await scan();
      console.log(`[${new Date().toLocaleTimeString()}] Found ${result.networks.length} networks via ${result.method}`);
      res.writeHead(200);
      res.end(JSON.stringify({...result, timestamp:new Date().toISOString(), count:result.networks.length}));
    } catch(e) {
      res.writeHead(500);
      res.end(JSON.stringify({error:e.message,networks:[]}));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({error:'Not found'}));
});

// ── Start ──────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║       CAF-WIFI Local Agent v1.0              ║');
  console.log('╚══════════════════════════════════════════════╝\n');
  console.log('✅ Agent is running!\n');
  console.log('📱 To use on your phone/tablet:');
  console.log('   1. Make sure your device is on the same WiFi');
  console.log('   2. Open: https://caf-wifi-new.vercel.app');
  console.log('   3. Tap "Connect Agent" and enter one of these URLs:\n');
  ips.forEach(ip => {
    console.log(`      http://${ip}:${PORT}/api/scan`);
  });
  console.log(`\n🖥️  Local browser: http://localhost:${PORT}/api/scan`);
  console.log('\n⏹️  Press Ctrl+C to stop\n');
  console.log('─'.repeat(50));
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Kill the existing process or change PORT at top of file.\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
