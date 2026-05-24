'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Wifi, Sun, Moon, Settings, BarChart3, Network, TrendingUp, Activity, Zap, Volume2, VolumeX, Crosshair, MapPin, Play, Loader2, X, Lock } from 'lucide-react';

export default function CAFWiFiAnalyzer() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [location, setLocation] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  
  // Signal Tracker State
  const [trackingNetwork, setTrackingNetwork] = useState<any>(null);
  const [currentSignal, setCurrentSignal] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock Data
  const signalData = [
    { network: 'CAF-WIFI-5G', strength: 85 },
    { network: 'CAF-WIFI-2G', strength: 72 },
    { network: 'CAF-GUEST', strength: 68 },
    { network: 'CAF-IoT', strength: 55 },
    { network: 'CAF-ADMIN', strength: 92 },
    { network: 'CAF-BACKUP', strength: 48 }
  ];

  const networkTypes = [
    { name: 'Main', value: 2, color: '#3b82f6' },
    { name: 'Guest', value: 1, color: '#10b981' },
    { name: 'IoT', value: 1, color: '#f59e0b' }
  ];

  const weeklyData = [
    { day: 'Mon', scans: 45, networks: 34 },
    { day: 'Tue', scans: 52, networks: 38 },
    { day: 'Wed', scans: 48, networks: 35 },
    { day: 'Thu', scans: 61, networks: 42 },
    { day: 'Fri', scans: 55, networks: 39 },
    { day: 'Sat', scans: 38, networks: 28 },
    { day: 'Sun', scans: 32, networks: 24 }
  ];

  const discoveredNetworks = [
    { id: '1', ssid: 'CAF-WIFI-5G', signal: -45, channel: 36, clients: 15, band: '5GHz', encryption: 'WPA3', vendor: 'ARUBA NETWORKS', macAddress: '00:0B:86:12:34:56' },
    { id: '2', ssid: 'CAF-WIFI-2G', signal: -58, channel: 6, clients: 22, band: '2.4GHz', encryption: 'WPA3', vendor: 'ARUBA NETWORKS', macAddress: '00:0B:86:78:90:AB' },
    { id: '3', ssid: 'CAF-GUEST', signal: -65, channel: 52, clients: 8, band: '5GHz', encryption: 'WPA2', vendor: 'ARUBA NETWORKS', macAddress: '00:0B:86:CD:EF:01' },
    { id: '4', ssid: 'CAF-IoT', signal: -70, channel: 1, clients: 32, band: '2.4GHz', encryption: 'WPA2', vendor: 'HUAWEI', macAddress: '7c:1c:f1:25:19:2c' },
    { id: '5', ssid: 'CAF-ADMIN', signal: -50, channel: 128, clients: 5, band: '5GHz', encryption: 'WPA3-Enterprise', vendor: 'TP-LINK', macAddress: '98:da:c4:26:21:87' },
    { id: '6', ssid: 'CAF-BACKUP', signal: -72, channel: 11, clients: 3, band: '2.4GHz', encryption: 'WPA3', vendor: 'GENERIC', macAddress: '9e:da:c4:26:21:87' }
  ];

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'scanner', label: 'Scanner', icon: Network },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: Activity },
    { id: 'admin', label: 'Admin', icon: Settings },
    { id: 'settings', label: 'Settings', icon: Zap }
  ];

  const startScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2000);
  };

  const stopTracking = () => {
    setTrackingNetwork(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (trackingNetwork) {
      setCurrentSignal(trackingNetwork.signal);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const playBeep = () => {
        if (isMuted || !audioContextRef.current) return;
        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();
        osc.type = 'sine';
        const freq = 400 + (Math.abs(currentSignal) < 50 ? 400 : 0) + (Math.abs(currentSignal + 90) * 3);
        osc.frequency.setValueAtTime(freq, audioContextRef.current.currentTime);
        gain.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioContextRef.current.destination);
        osc.start();
        osc.stop(audioContextRef.current.currentTime + 0.1);
      };

      const updateInterval = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const delay = Math.max(80, (Math.abs(currentSignal) - 30) * 18);
        intervalRef.current = setInterval(() => {
          playBeep();
          setCurrentSignal(prev => {
            const fluctuation = (Math.random() - 0.5) * 6;
            const newVal = prev + fluctuation;
            return Math.min(-30, Math.max(-95, newVal));
          });
        }, delay);
      };

      updateInterval();
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [trackingNetwork, currentSignal, isMuted]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`${darkMode ? 'bg-dark-800 border-dark-700' : 'bg-white border-slate-200'} border-b shadow-lg sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Wifi className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold">NetPulse CAF</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-blue-500/10">
              {darkMode ? <Sun className="text-yellow-400" /> : <Moon />}
            </button>
            <div className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20 uppercase">
              Operational Mode
            </div>
          </div>
        </div>
        <div className={`border-t ${darkMode ? 'bg-dark-900 border-dark-700' : 'bg-slate-50 border-slate-200'}`}>
          <div className="max-w-7xl mx-auto px-4 flex gap-8 overflow-x-auto no-scrollbar">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 transition-all ${
                    isActive ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-widest">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {trackingNetwork ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className={`p-8 rounded-3xl border-2 shadow-2xl text-center space-y-8 ${darkMode ? 'bg-dark-800 border-blue-500/50' : 'bg-white border-blue-200'}`}>
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <h2 className="text-2xl font-bold flex items-center gap-2">Locating: {trackingNetwork.ssid}</h2>
                  <p className="text-slate-400 font-mono text-sm">{trackingNetwork.macAddress}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-blue-500/10 rounded-xl">
                    {isMuted ? <VolumeX /> : <Volume2 />}
                  </button>
                  <button onClick={stopTracking} className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                    <X />
                  </button>
                </div>
              </div>
              <div className="py-12">
                <div className="text-8xl font-black text-blue-500">
                  {Math.round(currentSignal)}<span className="text-2xl text-slate-500">dBm</span>
                </div>
                <div className="mt-8 h-4 w-full bg-slate-700/30 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, (currentSignal + 100) * 1.5))}%` }} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'CAF Networks', value: '6', color: 'text-blue-500' },
                  { label: 'Active APs', value: '18', color: 'text-cyan-500' },
                  { label: 'Avg Signal', value: '-52 dBm', color: 'text-purple-500' },
                  { label: 'Network Health', value: '98%', color: 'text-green-500' }
                ].map((stat, i) => (
                  <div key={i} className={`p-6 rounded-2xl border ${darkMode ? 'bg-dark-800 border-dark-700' : 'bg-white border-slate-200'}`}>
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">{stat.label}</div>
                    <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'scanner' && (
              <div className="space-y-6">
                <div className={`p-8 rounded-2xl border ${darkMode ? 'bg-dark-800 border-dark-700' : 'bg-white border-slate-200'}`}>
                  <div className="flex flex-col md:flex-row gap-4">
                    <input
                      type="text"
                      placeholder="Scan Location..."
                      className={`flex-1 p-3 rounded-xl border ${darkMode ? 'bg-dark-700 border-dark-600' : 'bg-slate-50 border-slate-200'}`}
                    />
                    <button onClick={startScan} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl">
                      {isScanning ? "Scanning..." : "Start Survey"}
                    </button>
                  </div>
                </div>
                <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-dark-800 border-dark-700' : 'bg-white border-slate-200'}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`${darkMode ? 'bg-dark-700/50' : 'bg-slate-100'} text-xs font-bold uppercase text-slate-500`}>
                        <th className="px-6 py-4 text-left">SSID / Hardware</th>
                        <th className="px-6 py-4 text-left">Signal</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700/50">
                      {discoveredNetworks.map((n) => (
                        <tr key={n.id} className="hover:bg-blue-500/5">
                          <td className="px-6 py-4">
                            <div className="font-bold">{n.ssid}</div>
                            <div className="text-[10px] text-slate-500">{n.vendor}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-green-500">{n.signal} dBm</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => setTrackingNetwork(n)} className="bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-bold">LOCATE</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}