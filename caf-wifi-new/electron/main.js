const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { execFile } = require('child_process');
const os = require('os');

const PORT = 3579;
const isDev = !app.isPackaged;

let mainWindow = null;
let tray = null;
let nextServer = null;

async function startNextServer() {
  const nextApp = next({
    dev: isDev,
    dir: isDev ? path.join(__dirname, '..') : path.join(process.resourcesPath, 'app'),
    hostname: '127.0.0.1',
    port: PORT,
  });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();
  nextServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });
  await new Promise((resolve, reject) =>
    nextServer.listen(PORT, '127.0.0.1', err => err ? reject(err) : resolve())
  );
  console.log(`Next.js running on http://127.0.0.1:${PORT}`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 820, minWidth: 900, minHeight: 600,
    title: 'CAF-WiFi Analyzer',
    backgroundColor: '#0d1117',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
  if (isDev) mainWindow.webContents.openDevTools();
  mainWindow.on('close', e => { e.preventDefault(); mainWindow.hide(); });
}

function createTray() {
  tray = new Tray(nativeImage.createEmpty());
  tray.setToolTip('CAF-WiFi Analyzer');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open CAF-WiFi', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => { mainWindow.destroy(); app.quit(); } },
  ]));
  tray.on('double-click', () => mainWindow.show());
}

// ── WiFi Scanners ─────────────────────────────────────────────────────────
function parseWindows(raw) {
  const nets = [];
  const blocks = raw.split(/\r?\nSSID \d+/);
  for (const b of blocks) {
    const ssid     = (b.match(/:\s*(.+)/)                          || [])[1]?.trim();
    const bssid    = (b.match(/BSSID\s+\d+\s*:\s*(.+)/)           || [])[1]?.trim();
    const sigPct   = (b.match(/Signal\s*:\s*(\d+)%/)               || [])[1];
    const channel  = (b.match(/Channel\s*:\s*(\d+)/)              || [])[1];
    const security = (b.match(/Authentication\s*:\s*(.+)/)         || [])[1]?.trim();
    const freq     = (b.match(/Radio type\s*:\s*802\.11(\S+)/)     || [])[1];
    if (!ssid) continue;
    const rssi = sigPct ? Math.round(parseInt(sigPct) / 2 - 100) : -70;
    nets.push({
      ssid, bssid: bssid || '',
      signal: rssi,
      primaryCh: channel ? parseInt(channel) : 0,
      freq: channel ? (parseInt(channel) <= 13 ? 2412 + (parseInt(channel)-1)*5 : 5000 + parseInt(channel)*5) : 2412,
      bw: 20,
      security: security ? [security.replace('-Personal','').replace('-Enterprise','')] : ['OPEN'],
      band: channel && parseInt(channel) > 13 ? '5' : '2.4',
    });
  }
  return nets;
}

function parseMacOS(raw) {
  return raw.split('\n').slice(1).filter(l => l.trim()).map(line => {
    const p = line.trim().split(/\s+/);
    const ch = p[3] ? parseInt(p[3]) : 0;
    return {
      ssid: p[0]||'', bssid: p[1]||'',
      signal: p[2] ? parseInt(p[2]) : -70,
      primaryCh: ch,
      freq: ch <= 13 ? 2412+(ch-1)*5 : 5000+ch*5,
      bw: 20, security: [p[6]||'OPEN'],
      band: ch > 13 ? '5' : '2.4',
    };
  }).filter(n => n.ssid);
}

function parseLinux(raw) {
  return raw.split('\n').filter(l => l.trim()).map(line => {
    const parts = line.split(':');
    const ssid = parts[0]?.replace(/\\:/g,':') || '';
    // Rebuild BSSID (6 hex groups)
    let bssid = '', rest = parts.slice(1);
    // Try to find MAC pattern
    const macMatch = line.match(/([0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5})/);
    if (macMatch) bssid = macMatch[1];
    const sigRaw = parts.find(p => /^-?\d+$/.test(p.trim()));
    const sig = sigRaw ? parseInt(sigRaw) : -70;
    const ch = parts.find(p => /^\d{1,3}$/.test(p.trim()) && parseInt(p)<200);
    const chNum = ch ? parseInt(ch) : 0;
    const freqRaw = parts.find(p => p.includes('GHz')||p.includes('MHz'));
    let freqMhz = chNum <= 13 ? 2412+(chNum-1)*5 : 5000+chNum*5;
    if (freqRaw) {
      const fNum = parseFloat(freqRaw);
      freqMhz = fNum > 100 ? fNum : fNum * 1000;
    }
    const secPart = parts.find(p => /WPA|WEP|WPS|Open/i.test(p));
    const security = secPart ? secPart.trim().split(/\s+/).filter(Boolean) : ['OPEN'];
    if (!ssid || ssid.startsWith('IN-USE')) return null;
    return {
      ssid, bssid, signal: sig < 0 ? sig : Math.round(sig/2-100),
      primaryCh: chNum,
      freq: freqMhz, bw: 20, security,
      band: freqMhz >= 5945 ? '6' : freqMhz >= 5180 ? '5' : '2.4',
    };
  }).filter(Boolean).filter(n => n.ssid);
}

function scanWifi() {
  return new Promise(resolve => {
    const platform = os.platform();
    let cmd, args;
    if (platform === 'win32') {
      cmd = 'netsh'; args = ['wlan', 'show', 'networks', 'mode=bssid'];
    } else if (platform === 'darwin') {
      cmd = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport';
      args = ['-s'];
    } else {
      cmd = 'nmcli';
      args = ['-t', '-f', 'SSID,BSSID,MODE,CHAN,FREQ,RATE,SIGNAL,SECURITY', 'dev', 'wifi', 'list', '--rescan', 'yes'];
    }
    execFile(cmd, args, { timeout: 15000 }, (err, stdout) => {
      if (err) return resolve({ error: err.message, networks: [] });
      try {
        const nets = platform === 'win32' ? parseWindows(stdout)
          : platform === 'darwin' ? parseMacOS(stdout)
          : parseLinux(stdout);
        // Deduplicate by bssid+channel
        const seen = new Set();
        const unique = nets.filter(n => {
          const k = (n.bssid||n.ssid) + n.primaryCh;
          if (seen.has(k)) return false;
          seen.add(k); return true;
        });
        resolve({ networks: unique, method: platform, count: unique.length });
      } catch(e) { resolve({ error: e.message, networks: [] }); }
    });
  });
}

ipcMain.handle('wifi:scan', async () => scanWifi());
ipcMain.handle('app:platform', () => os.platform());

app.whenReady().then(async () => {
  try {
    await startNextServer();
    createWindow();
    createTray();
  } catch(err) {
    console.error('Startup failed:', err);
    app.quit();
  }
});

app.on('window-all-closed', e => e.preventDefault());
app.on('before-quit', () => { if (nextServer) nextServer.close(); });
app.on('activate', () => { if (mainWindow) mainWindow.show(); });
