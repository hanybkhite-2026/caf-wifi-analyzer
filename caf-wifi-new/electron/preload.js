const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  scanWifi:    () => ipcRenderer.invoke('wifi:scan'),
  getPlatform: () => ipcRenderer.invoke('app:platform'),
  isElectron:  true,
});
