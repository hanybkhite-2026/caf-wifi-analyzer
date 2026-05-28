'use client';
import { useState, useCallback } from 'react';

/**
 * useWifiScan — works on all platforms:
 *   • Capacitor Android APK  → WifiManager native API
 *   • Electron desktop        → IPC + netsh/nmcli/airport
 *   • Browser + local agent   → fetch agent URL
 *   • Vercel/cloud            → returns empty (no WiFi card)
 */
export function useWifiScan() {
  const [networks, setNetworks] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError]       = useState(null);

  const scan = useCallback(async () => {
    setScanning(true); setError(null);
    try {
      let result;

      // 1. Capacitor (Android APK)
      if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
        const { WifiPlugin } = await import('@capacitor/wifi').catch(() => ({ WifiPlugin: null }));
        if (WifiPlugin) {
          const r = await WifiPlugin.scan();
          result = { networks: (r.networks || []).map(n => ({
            ssid:      n.SSID || '*hidden*',
            bssid:     n.BSSID || '',
            signal:    n.level || -70,
            primaryCh: freqToChannel(n.frequency || 2412),
            freq:      n.frequency || 2412,
            bw:        20,
            security:  capSecurityToArray(n.capabilities || ''),
            band:      (n.frequency || 2412) > 5000 ? '5' : '2.4',
          })), method: 'capacitor-android', count: r.networks?.length || 0 };
        }
      }

      // 2. Electron desktop
      if (!result && typeof window !== 'undefined' && window.electronAPI?.isElectron) {
        result = await window.electronAPI.scanWifi();
      }

      // 3. Local agent or Next.js API
      if (!result) {
        const agentUrl = typeof window !== 'undefined'
          ? localStorage.getItem('caf_agent_url') || '/api/scan'
          : '/api/scan';
        const res = await fetch(agentUrl, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        result = await res.json();
      }

      if (result.error || !result.networks?.length) {
        setError(result.error || 'No networks found');
        setNetworks([]);
      } else {
        setNetworks(result.networks);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
      setNetworks([]);
    } finally {
      setScanning(false);
    }
  }, []);

  return { networks, scanning, error, scan };
}

// Android WifiManager frequency → channel
function freqToChannel(freq) {
  if (freq === 2484) return 14;
  if (freq >= 2412 && freq <= 2472) return Math.round((freq - 2412) / 5) + 1;
  if (freq >= 5180 && freq <= 5825) return Math.round((freq - 5000) / 5);
  if (freq >= 5955) return Math.round((freq - 5955) / 5) + 1;
  return 0;
}

// Android capabilities string → security array
// e.g. "[WPA2-PSK-CCMP][WPS][ESS]" → ['WPA2', 'WPS']
function capSecurityToArray(cap) {
  const s = [];
  if (cap.includes('WPA3') || cap.includes('SAE')) s.push('WPA3');
  if (cap.includes('WPA2') || cap.includes('RSN'))  s.push('WPA2');
  else if (cap.includes('WPA')) s.push('WPA');
  if (cap.includes('WPS'))  s.push('WPS');
  if (cap.includes('WEP'))  s.push('WEP');
  return s.length ? s : ['OPEN'];
}
