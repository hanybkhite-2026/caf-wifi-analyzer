import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import os from 'os';

export const dynamic = 'force-dynamic';

function scanWifi() {
  return new Promise((resolve) => {
    const platform = os.platform();
    let cmd, args;

    if (platform === 'win32') {
      cmd = 'netsh';
      args = ['wlan', 'show', 'networks', 'mode=bssid'];
    } else if (platform === 'darwin') {
      cmd = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport';
      args = ['-s'];
    } else {
      cmd = 'nmcli';
      args = ['-t', '-f', 'SSID,BSSID,CHAN,FREQ,SIGNAL,SECURITY', 'dev', 'wifi', 'list', '--rescan', 'yes'];
    }

    execFile(cmd, args, { timeout: 12000 }, (err, stdout) => {
      if (err) {
        return resolve({
          networks: [],
          error: 'WiFi scan unavailable in this environment. Run the app locally or as a desktop app for real scanning.',
          method: 'none'
        });
      }
      try {
        const nets = platform === 'linux' ? parseLinux(stdout)
          : platform === 'darwin' ? parseMac(stdout)
          : parseWin(stdout);
        resolve({ networks: nets, method: platform, count: nets.length });
      } catch(e) {
        resolve({ networks: [], error: e.message, method: 'parse-error' });
      }
    });
  });
}

function parseLinux(raw) {
  return raw.split('\n').filter(l => l.trim()).map(line => {
    const parts = line.split(':');
    const ssid = (parts[0]||'').replace(/\\:/g,':').trim();
    const macMatch = line.match(/([0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5})/);
    const bssid = macMatch ? macMatch[1] : '';
    const ch = parseInt(parts.find(p => /^\d{1,3}$/.test(p.trim()) && parseInt(p)<200) || '0');
    const sigRaw = parts.find(p => /^-?\d{2,3}$/.test(p.trim()));
    let sig = sigRaw ? parseInt(sigRaw) : -70;
    if (sig > 0) sig = Math.round(sig/2 - 100);
    const freqRaw = parts.find(p => p.includes('GHz')||p.includes('MHz'));
    let freq = ch <= 13 ? 2412+(ch-1)*5 : ch > 13 ? 5000+ch*5 : 2412;
    if (freqRaw) { const f = parseFloat(freqRaw); freq = f > 100 ? f : f*1000; }
    const secPart = parts.find(p => /WPA|WEP|WPS|Open/i.test(p));
    const security = secPart ? secPart.trim().split(/\s+/).filter(Boolean) : ['OPEN'];
    if (!ssid || ssid.length < 1) return null;
    return { ssid, bssid, signal: sig, primaryCh: ch, freq, bw: 20, security,
      band: freq>=5945?'6': freq>=5180?'5':'2.4' };
  }).filter(Boolean);
}

function parseMac(raw) {
  return raw.split('\n').slice(1).filter(l=>l.trim()).map(line=>{
    const p = line.trim().split(/\s+/);
    const ch = p[3]?parseInt(p[3]):0;
    return { ssid:p[0]||'', bssid:p[1]||'', signal:p[2]?parseInt(p[2]):-70,
      primaryCh:ch, freq:ch<=13?2412+(ch-1)*5:5000+ch*5, bw:20,
      security:[p[6]||'OPEN'], band:ch>13?'5':'2.4' };
  }).filter(n=>n.ssid);
}

function parseWin(raw) {
  const nets=[];
  for(const b of raw.split(/\r?\nSSID \d+/)){
    const ssid=(b.match(/:\s*(.+)/)||[])[1]?.trim();
    const bssid=(b.match(/BSSID\s+\d+\s*:\s*(.+)/)||[])[1]?.trim();
    const sig=(b.match(/Signal\s*:\s*(\d+)%/)||[])[1];
    const ch=(b.match(/Channel\s*:\s*(\d+)/)||[])[1];
    const sec=(b.match(/Authentication\s*:\s*(.+)/)||[])[1]?.trim();
    if(!ssid)continue;
    const chN=ch?parseInt(ch):0;
    nets.push({ssid,bssid:bssid||'',signal:sig?Math.round(parseInt(sig)/2-100):-70,
      primaryCh:chN,freq:chN<=13?2412+(chN-1)*5:5000+chN*5,bw:20,
      security:[sec||'OPEN'],band:chN>13?'5':'2.4'});
  }
  return nets;
}

export async function GET() {
  const result = await scanWifi();
  return NextResponse.json(result);
}
