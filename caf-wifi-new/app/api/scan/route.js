export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function parseLinux(raw) {
  return raw.split('\n').filter(l => l.trim() && !l.startsWith('IN-USE') && !l.startsWith('SSID')).map(line => {
    const mac = line.match(/([0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5})/);
    const bssid = mac ? mac[1] : '';
    const parts = line.split(':');
    const ssid = (parts[0] || '').replace(/\\:/g, ':').trim();
    if (!ssid || ssid === '--') return null;
    const sigRaw = parts.find(p => /^-\d{2,3}$/.test(p.trim()));
    const sig = sigRaw ? parseInt(sigRaw) : -70;
    const chRaw = parts.find(p => /^\d{1,3}$/.test(p.trim()) && parseInt(p) < 200);
    const ch = chRaw ? parseInt(chRaw) : 0;
    const freqRaw = parts.find(p => p.includes('GHz') || p.includes('MHz'));
    let freq = ch <= 13 ? 2412 + (ch-1)*5 : ch > 13 ? 5000 + ch*5 : 2412;
    if (freqRaw) { const f = parseFloat(freqRaw); freq = f > 100 ? f : f*1000; }
    const secPart = parts.find(p => /WPA|WEP|Open/i.test(p));
    const security = secPart ? secPart.trim().split(/\s+/).filter(Boolean) : ['OPEN'];
    return { ssid, bssid, signal: sig, primaryCh: ch, freq, bw: 20, security,
      band: freq >= 5945 ? '6' : freq >= 5180 ? '5' : '2.4' };
  }).filter(Boolean);
}

function parseMac(raw) {
  return raw.split('\n').slice(1).filter(l => l.trim()).map(line => {
    const p = line.trim().split(/\s+/);
    const ch = p[3] ? parseInt(p[3]) : 0;
    const sig = p[2] ? parseInt(p[2]) : -70;
    const freq = ch <= 13 ? 2412 + (ch-1)*5 : 5000 + ch*5;
    return { ssid: p[0]||'', bssid: p[1]||'', signal: sig, primaryCh: ch,
      freq, bw: 20, security: [p[6]||'OPEN'], band: ch > 13 ? '5' : '2.4' };
  }).filter(n => n.ssid);
}

function parseWin(raw) {
  const nets = [];
  for (const b of raw.split(/\r?\nSSID \d+/)) {
    const ssid = (b.match(/:\s*(.+)/) || [])[1]?.trim();
    if (!ssid) continue;
    const bssid = (b.match(/BSSID\s+\d+\s*:\s*(.+)/) || [])[1]?.trim() || '';
    const sig = (b.match(/Signal\s*:\s*(\d+)%/) || [])[1];
    const ch = (b.match(/Channel\s*:\s*(\d+)/) || [])[1];
    const sec = (b.match(/Authentication\s*:\s*(.+)/) || [])[1]?.trim() || 'OPEN';
    const chN = ch ? parseInt(ch) : 0;
    nets.push({ ssid, bssid, signal: sig ? Math.round(parseInt(sig)/2-100) : -70,
      primaryCh: chN, freq: chN <= 13 ? 2412+(chN-1)*5 : 5000+chN*5,
      bw: 20, security: [sec.replace(/-Personal|-Enterprise/g,'')],
      band: chN > 13 ? '5' : '2.4' });
  }
  return nets;
}

export async function GET() {
  try {
    const cp = require('child_process');
    const os = require('os');
    const platform = os.platform();
    let cmd, args, parse;
    if (platform === 'win32') {
      cmd = 'netsh'; args = ['wlan','show','networks','mode=bssid']; parse = parseWin;
    } else if (platform === 'darwin') {
      cmd = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport';
      args = ['-s']; parse = parseMac;
    } else {
      cmd = 'nmcli';
      args = ['-t','-f','SSID,BSSID,CHAN,FREQ,SIGNAL,SECURITY','dev','wifi','list','--rescan','yes'];
      parse = parseLinux;
    }
    const stdout = await new Promise((resolve, reject) => {
      cp.execFile(cmd, args, { timeout: 12000 }, (err, out) => {
        if (err) reject(err); else resolve(out);
      });
    });
    const nets = parse(stdout);
    const seen = new Set();
    const unique = nets.filter(n => {
      const k = (n.bssid||n.ssid) + n.primaryCh;
      if (seen.has(k)) return false; seen.add(k); return true;
    });
    return Response.json({ networks: unique, method: platform, count: unique.length, error: null });
  } catch(err) {
    return Response.json({ networks: [], error: 'WiFi scanning unavailable. Run locally or use the agent.', method: 'unavailable' });
  }
}
