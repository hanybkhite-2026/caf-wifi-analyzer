'use client';
import { useState, useCallback } from 'react';

/**
 * useWifiScan — works in Electron (native) and browser (API fetch)
 */
export function useWifiScan() {
  const [networks, setNetworks] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  const scan = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      let result;
      if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
        result = await window.electronAPI.scanWifi();
      } else {
        const res = await fetch('/api/scan');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        result = await res.json();
      }
      if (result.error) { setError(result.error); setNetworks([]); }
      else { setNetworks(result.networks || []); }
    } catch (err) {
      setError(err.message); setNetworks([]);
    } finally {
      setScanning(false);
    }
  }, []);

  return { networks, scanning, error, scan };
}
