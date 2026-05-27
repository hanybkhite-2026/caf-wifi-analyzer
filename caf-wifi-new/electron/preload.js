const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the Next.js frontend (window.electronAPI)
contextBridge.exposeInMainWorld('electronAPI', {
  // Trigger a real OS-level WiFi scan
  scanWifi: () => ipcRenderer.invoke('wifi:scan'),

  // Get the OS platform (win32 / darwin / linux)
  getPlatform: () => ipcRenderer.invoke('app:platform'),

  // Check if running inside Electron
  isElectron: true,
});
