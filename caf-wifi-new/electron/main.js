const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { execFile } = require('child_process');
const os = require('os');

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT = 3579; // internal port Next.js will listen on
const isDev = !app.isPackaged;

let mainWindow = null;
let tray = null;
let nextServer = null;

// ─── Start the embedded Next.js server ────────────────────────────────────────
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

  await new Promise((resolve, reject) => {
    nextServer.listen(PORT, '127.0.0.1', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  console.log(`Next.js server running on http://127.0.0.1:${PORT}`);
}

// ─── Create the browser window ────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'CAF-WiFi Analyzer',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // Remove default menu bar
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  // Open devtools in dev mode
  if (isDev) mainWindow.webContents.openDevTools();

  mainWindow.on('close', (e) => {
    // Minimize to tray instead of closing
    e.preventDefault();
    mainWindow.hide();
  });
}

// ─── System Tray ─────────────────────────────────────────────────────────────
function createTray() {
  // Use a blank icon if no icon file provided
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open CAF-WiFi Analyzer', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => { mainWindow.destroy(); app.quit(); } },
  ]);

  tray.setToolTip('CAF-WiFi Analyzer');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow.show());
}

// ─── WiFi Scanning via IPC ───────────────────────────────────────────────────
// The renderer calls window.electronAPI.scanWifi() via preload
// This runs OS-level commands and returns results

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
      // Linux
      cmd  = 'nmcli';
      args = ['-t', '-f', 'SSID,SIGNAL,CHAN,SECURITY,BSSID,FREQ', 'dev', 'wifi', 'list'];
    }

    execFile(cmd, args, { timeout: 10000 }, (err, stdout) => {
      if (err) {
        console.error('WiFi scan error:', err.message);
        return resolve({ error: err.message, networks: [] });
      }

      try {
        const networks = platform === 'win32'
          ? parseWindows(stdout)
          : platform === 'darwin'
          ? parseMacOS(stdout)
          : parseLinux(stdout);

        resolve({ networks });
      } catch (parseErr) {
        resolve({ error: parseErr.message, networks: [] });
      }
    });
  });
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseWindows(raw) {
  const networks = [];
  const blocks = raw.split(/\r?\nSSID \d+/);
  for (const block of blocks) {
    const ssid     = (block.match(/:\s*(.+)/) || [])[1]?.trim();
    const bssid    = (block.match(/BSSID\s+\d+\s*:\s*(.+)/) || [])[1]?.trim();
    const signal   = (block.match(/Signal\s*:\s*(\d+)%/) || [])[1];
    const channel  = (block.match(/Channel\s*:\s*(\d+)/) || [])[1];
    const security = (block.match(/Authentication\s*:\s*(.+)/) || [])[1]?.trim();
    if (ssid) {
      networks.push({
        ssid,
        bssid:    bssid    || '',
        signal:   signal   ? Math.round(parseInt(signal) / 2 - 100) : -70,
        channel:  channel  ? parseInt(channel) : 0,
        security: security || 'Unknown',
        frequency: 0,
      });
    }
  }
  return networks;
}

function parseMacOS(raw) {
  const lines = raw.split('\n').slice(1); // skip header
  return lines
    .filter(l => l.trim())
    .map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        ssid:      parts[0] || '',
        bssid:     parts[1] || '',
        signal:    parts[2] ? parseInt(parts[2]) : -70,
        channel:   parts[3] ? parseInt(parts[3]) : 0,
        security:  parts[6] || 'Unknown',
        frequency: 0,
      };
    })
    .filter(n => n.ssid);
}

function parseLinux(raw) {
  return raw
    .split('\n')
    .filter(l => l.trim())
    .map(line => {
      const [ssid, signal, channel, security, bssid, freq] = line.split(':');
      return {
        ssid:      ssid     || '',
        bssid:     bssid    || '',
        signal:    signal   ? parseInt(signal) : -70,
        channel:   channel  ? parseInt(channel) : 0,
        security:  security || 'Unknown',
        frequency: freq     ? parseFloat(freq) : 0,
      };
    })
    .filter(n => n.ssid);
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('wifi:scan', async () => {
  return await scanWifi();
});

ipcMain.handle('app:platform', () => os.platform());

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  try {
    await startNextServer();
    createWindow();
    createTray();
  } catch (err) {
    console.error('Failed to start:', err);
    app.quit();
  }
});

app.on('window-all-closed', (e) => {
  e.preventDefault(); // keep running in tray
});

app.on('before-quit', () => {
  if (nextServer) nextServer.close();
});

app.on('activate', () => {
  if (mainWindow) mainWindow.show();
});
