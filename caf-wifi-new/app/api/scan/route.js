import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import os from 'os';

// When running inside Electron, the actual scan is done via IPC (main.js).
// This API route is the fallback for when the frontend calls fetch('/api/scan')
// directly (e.g. during development without Electron, or from a local server).

function scanWifi() {
  return new Promise((resolve) => {
    const platform = os.platform();
    let cmd, args;

    if (platform === 'win32') {
      cmd  = 'netsh';
      args = ['wlan', 'show', 'networks', 'mode=bssid'];
    } else if (platform === 'darwin') {
      cmd  = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport';
      args = ['-s'];
    } else {
      cmd  = 'nmcli';
      args = ['-t', '-f', 'SSID,SIGNAL,CHAN,SECURITY,BSSID,FREQ', 'dev', 'wifi', 'list'];
    }

    execFile(cmd, args, { timeout: 10000 }, (err, stdout) => {
      if (err) return resolve({ error: err.message, networks: [] });

      try {
        let networks = [];

        if (platform === 'win32') {
          const blocks = stdout.split(/\r?\nSSID \d+/);
          for (const block of blocks) {
            const ssid     = (block.match(/:\s*(.+)/) || [])[1]?.trim();
            const bssid    = (block.match(/BSSID\s+\d+\s*:\s*(.+)/) || [])[1]?.trim();
            const signal   = (block.match(/Signal\s*:\s*(\d+)%/) || [])[1];
            const channel  = (block.match(/Channel\s*:\s*(\d+)/) || [])[1];
            const security = (block.match(/Authentication\s*:\s*(.+)/) || [])[1]?.trim();
            if (ssid) networks.push({
              ssid, bssid: bssid || '',
              signal:   signal ? Math.round(parseInt(signal) / 2 - 100) : -70,
              channel:  channel ? parseInt(channel) : 0,
              security: security || 'Unknown', frequency: 0,
            });
          }
        } else if (platform === 'darwin') {
          networks = stdout.split('\n').slice(1).filter(l => l.trim()).map(line => {
            const p = line.trim().split(/\s+/);
            return { ssid: p[0]||'', bssid: p[1]||'', signal: p[2]?parseInt(p[2]):-70,
              channel: p[3]?parseInt(p[3]):0, security: p[6]||'Unknown', frequency: 0 };
          }).filter(n => n.ssid);
        } else {
          networks = stdout.split('\n').filter(l => l.trim()).map(line => {
            const [ssid, signal, channel, security, bssid, freq] = line.split(':');
            return { ssid:ssid||'', bssid:bssid||'', signal:signal?parseInt(signal):-70,
              channel:channel?parseInt(channel):0, security:security||'Unknown',
              frequency:freq?parseFloat(freq):0 };
          }).filter(n => n.ssid);
        }

        resolve({ networks });
      } catch (e) {
        resolve({ error: e.message, networks: [] });
      }
    });
  });
}

export async function GET() {
  const result = await scanWifi();
  return NextResponse.json(result);
}

// Required for Next.js API routes running server-side
export const dynamic = 'force-dynamic';
