'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Wifi, Sun, Moon, Settings, BarChart3, Network, TrendingUp, 
  Activity, Zap, Volume2, VolumeX, Crosshair, MapPin, Play, 
  Loader2, X, Lock, Signal, ShieldCheck, Router, FileText
} from 'lucide-react';

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

  // Tabs configuration defined inside the component to avoid reference errors
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'scanner', label: 'Scanner', icon: Network },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'admin', label: 'Admin', icon: Settings },
    { id: 'settings', label: 'Settings', icon: Zap }
  ];

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

  const radarData = [
    { metric: 'Coverage', value: 85 },
    { metric: 'Speed', value: 92 },
    { metric: 'Security', value: 88 },
    { metric: 'Stability', value: 90 },
    { metric: 'Reliability', value: 86 }
  ];

  const discoveredNetworks = [
    { id: '1', ssid: 'CAF-WIFI-5G', signal: -45, channel: 36, clients: 15, band: '5GHz', encryption: 'WPA3', vendor: 'ARUBA NETWORKS', macAddress: '00:0B:86:12:34:56' },
    { id: '2', ssid: 'CAF-WIFI-2G', signal: -58, channel: 6, clients: 22, band: '2.4GHz', encryption: 'WPA3', vendor: 'ARUBA NETWORKS', macAddress: '00:0B:86:78:90:AB' },
    { id: '3', ssid: 'CAF-GUEST', signal: -65, channel: 52, clients: 8, band: '5GHz', encryption: 'WPA2', vendor: 'ARUBA NETWORKS', macAddress: '00:0B:86:CD:EF:01' },
    { id: '4', ssid: 'CAF-IoT', signal: -70, channel: 1, clients: 32, band: '2.4GHz', encryption: 'WPA2', vendor: 'HUAWEI', macAddress: '7c:1c:f1:25:19:2c' },
    { id: '5', ssid: 'CAF-ADMIN', signal: -50, channel: 128, clients: 5, band: '5GHz', encryption: 'WPA3-Enterprise', vendor: 'TP-LINK', macAddress: '98:da:c4:26:21:87' },
    { id: '6', ssid: 'CAF-BACKUP', signal: -72, channel: 11, clients: 3, band: '2.4GHz', encryption: 'WPA3', vendor: 'GENERIC', macAddress: '9e:da:c4:26:21:87' }
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
      {/* Header */}
      <header className={`${darkMode ? 'bg-dark-800 border-dark-700' : 'bg-white border-slate-200'} border-b shadow-lg sticky top-0 z-50 transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Wifi className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">NetPulse CAF</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-dark-700 text-yellow-400' : 'hover:bg-slate-100 text-slate-600'}`}
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold border border-blue-500/20 uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Aruba Ops Mode
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className={`border-t transition-colors ${darkMode ? 'bg-dark-900 border-dark-700' : 'bg-slate-50 border-slate-200'}`}>
          <div className="max-w-7xl mx-auto px-4 flex gap-8 overflow-x-auto no-scrollbar">
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
                    isActive 
                      ? 'border-blue-500 text-blue-500' 
                      : `border-transparent ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span className="text-sm font-semibold uppercase tracking-wider">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {trackingNetwork ? (
          /* LOCATE AP MODE */
          <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
            <div className={`p-8 rounded-3xl border-2 shadow-2xl text-center space-y-8 ${darkMode ? 'bg-dark-800 border-blue-500/50' : 'bg-white border-blue-200'}`}>
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Crosshair className="text-blue-500 animate-pulse" /> Locating: {trackingNetwork.ssid}
                  </h2>
                  <p className="text-slate-400 font-mono text-sm mt-1">{trackingNetwork.macAddress}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsMuted(!isMuted)} className={`p-3 rounded-xl ${darkMode ? 'bg-dark-700' : 'bg-slate-100'}`}>
                    {isMuted ? <VolumeX /> : <Volume2 />}
                  </button>
                  <button onClick={stopTracking} className={`p-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 ${darkMode ? 'bg-dark-700' : 'bg-slate-100'}`}>
                    <X />
                  </button>
                </div>
              </div>

              <div className="py-12">
                <div className="text-8xl font-black tracking-tighter text-blue-500">
                  {Math.round(currentSignal)}<span className="text-2xl text-slate-500 ml-1">dBm</span>
                </div>
                <div className="mt-8 h-4 w-full bg-slate-700/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300" 
                    style={{ width: `${Math.min(100, Math.max(0, (currentSignal + 100) * 1.5))}%` }} 
                  />
                </div>
                <p className="mt-6 text-slate-400 text-sm font-medium">Beep frequency increases as you approach the targeted AP.</p>
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD DASHBOARD TABS */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'CAF Networks', value: '6', change: '+2.5%', icon: Wifi, color: 'text-blue-500' },
                    { label: 'Active APs', value: '18', change: 'Stable', icon: Router, color: 'text-cyan-500' },
                    { label: 'Avg Signal', value: '-52 dBm', change: '+1.2%', icon: Signal, color: 'text-purple-500' },
                    { label: 'Health', value: '98%', change: 'Normal', icon: ShieldCheck, color: 'text-green-500' }
                  ].map((stat, i) => (
                    <div key={i} className={`p-6 rounded-2xl border transition-all hover:scale-105 ${darkMode ? 'bg-dark-800 border-dark-700' : 'bg-white border-slate-200'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</div>
                        <stat.icon className={`w-5 h-5 ${stat.color} opacity-50`} />
                      </div>
                      <div className={`text-3xl font-bold mb-2`}>{stat.value}</div>
                      <div className="text-xs text-slate-500 font-medium">{stat.change} since last scan</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-dark-800 border-dark-700' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Signal className="text-blue-500" /> Signal Strength Comparison
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={signalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} vertical={false} />
                        <XAxis dataKey="network" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip 
                          cursor={{fill: 'rgba(59, 130, 246, 0.1)'}} 
                          contentStyle={{ 
                            backgroundColor: darkMode ? '#0f172a' : '#fff', 
                            border: 'none', 
                            borderRadius: '12px', 
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                          }} 
                        />
                        <Bar dataKey="strength" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-dark-800 border-dark-700' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-lg font-bold mb-6">Performance Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={networkTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                          {networkTypes.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-dark-800 border-dark-700' : 'bg-white border-slate-200'}`}>
                  <h3 className="text-lg font-bold mb-6">System Health Matrix</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={darkMode ? "#334155" : "#e2e8f0"} />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Radar name="System" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'scanner' && (
              <div className="space-y-6">
                <div className={`p-8 rounded-2xl border ${darkMode ? 'bg-dark-800 border-dark-700' : 'bg-white border-slate-200'}`}>
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Crosshair className="text-blue-500" /> Professional Site Survey
                  </h3>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Scan Environment Name</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. B-Wing Server Room"
                          className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${darkMode ? 'bg-dark-700 border-dark-600' : 'bg-slate-50 border-slate-200'}`}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={startScan} 
                      disabled={isScanning}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isScanning ? <Loader2 className="animate-spin" /> : <Play />}
                      {isScanning ? "Initializing Scan..." : "Start Site Survey"}
                    </button>
                  </div>
                </div>

                <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-dark-800 border-dark-700' : 'bg-white border-slate-200'}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`${darkMode ? 'bg-dark-700/50' : 'bg-slate-100'} text-xs font-bold uppercase tracking-widest text-slate-500`}>
                        <th className="px-6 py-4 text-left">SSID / Hardware</th>
                        <th className="px-6 py-4 text-left">Signal Quality</th>
                        <th className="px-6 py-4 text-left">Spectrum</th>
                        <th className="px-6 py-4 text-left">Encryption</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700/50">
                      {discoveredNetworks.map((network) => (
                        <tr key={network.id} className={`hover:bg-blue-500/5 transition-colors group`}>
                          <td className="px-6 py-4">
                            <div className="font-bold">{network.ssid}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-1">{network.vendor} | {network.macAddress}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`font-bold flex items-center gap-2 ${network.signal >= -60 ? 'text-green-500' : 'text-yellow-500'}`}>
                              <Signal className="w-4 h-4" /> {network.signal} dBm
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs">CH {network.channel} | {network.band}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Lock className="w-3 h-3" /> {network.encryption}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setTrackingNetwork(network)}
                              className="bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-blue-500/20"
                            >
                              LOCATE AP
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Default for other tabs */}
            {['analytics', 'reports', 'admin', 'settings'].includes(activeTab) && (
              <div className={`p-12 text-center rounded-3xl border border-dashed ${darkMode ? 'border-dark-700 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold uppercase tracking-widest mb-2">{activeTab} MODULE</h3>
                <p>Enterprise access required for specialized monitoring tools.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Status Bar */}
      <footer className={`h-10 border-t flex items-center justify-between px-6 text-[10px] font-mono tracking-widest uppercase transition-colors ${darkMode ? 'bg-dark-800 border-dark-700 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
        <div className="flex gap-6">
          <span>SYSTEM: v3.0.0-PROD</span>
          <span className="text-green-500 font-bold">STATE: OPERATIONAL</span>
        </div>
        <div className="hidden sm:flex gap-6">
          <span>ENCRYPTION: AES-256-FIPS</span>
          <span>REGION: GLOBAL-OPS</span>
        </div>
      </footer>
    </div>
  );
}
