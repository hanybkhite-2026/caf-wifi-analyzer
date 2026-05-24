'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Wifi, Sun, Moon, Settings, BarChart3, Network, TrendingUp, Activity, 
  Zap, Volume2, VolumeX, Crosshair, MapPin, Play, Loader2, X, Lock, 
  ShieldCheck, Radio, Layers
} from 'lucide-react';
import { MOCK_NETWORKS } from '@/lib/mock-data';

export default function CAFWiFiAnalyzer() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [location, setLocation] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [selectedBand, setSelectedBand] = useState<'2.4GHz' | '5GHz'>('5GHz');
  
  // Signal Tracker State
  const [trackingNetwork, setTrackingNetwork] = useState<any>(null);
  const [currentSignal, setCurrentSignal] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Spectral Graph Logic
  const channelGraphData = useMemo(() => {
    const channels = selectedBand === '2.4GHz' 
      ? Array.from({ length: 14 }, (_, i) => i + 1) 
      : [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 149, 153, 157, 161, 165];
    
    const dataPoints: any[] = [];
    const minChan = Math.min(...channels) - 2;
    const maxChan = Math.max(...channels) + 2;
    
    for (let i = minChan; i <= maxChan; i += 0.5) {
      const point: any = { channel: i };
      MOCK_NETWORKS.filter(n => n.frequencyBand === selectedBand).forEach(net => {
        const dist = Math.abs(i - net.channel);
        if (dist <= 2) {
          const strength = Math.max(0, (net.signalStrength + 100));
          point[net.ssid] = strength * (1 - (dist / 2));
        } else {
          point[net.ssid] = 0;
        }
      });
      dataPoints.push(point);
    }
    return dataPoints;
  }, [selectedBand]);

  const COLORS = ['#3b82f6', '#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];

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
      setCurrentSignal(trackingNetwork.signalStrength);
      
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
    <div className={`min-h-screen ${darkMode ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`${darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200'} border-b shadow-lg sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Wifi className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold tracking-tight">NetPulse CAF Analyzer</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20 uppercase">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-1" />
              Public Access Mode
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-blue-500/10 transition-colors">
              {darkMode ? <Sun className="text-yellow-400" /> : <Moon className="text-slate-600" />}
            </button>
          </div>
        </div>
        <div className={`border-t ${darkMode ? 'bg-[#0f172a] border-[#334155]' : 'bg-slate-50 border-slate-200'}`}>
          <div className="max-w-7xl mx-auto px-4 flex gap-8 overflow-x-auto no-scrollbar">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'scanner', label: 'Scanner', icon: Network },
              { id: 'spectrum', label: 'Spectrum', icon: Layers },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'reports', label: 'Reports', icon: Activity },
              { id: 'admin', label: 'Admin', icon: Settings },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    isActive ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-blue-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {trackingNetwork ? (
          <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
            <div className={`p-8 rounded-3xl border-2 shadow-2xl text-center space-y-8 ${darkMode ? 'bg-[#1e293b] border-blue-500/50' : 'bg-white border-blue-200'}`}>
              <div className="flex justify-between items-start text-left">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Crosshair className="text-blue-500 animate-pulse" /> Locating: {trackingNetwork.ssid}
                  </h2>
                  <p className="text-slate-400 font-mono text-sm mt-1">{trackingNetwork.macAddress}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-blue-500/10 rounded-xl hover:bg-blue-500/20">
                    {isMuted ? <VolumeX /> : <Volume2 />}
                  </button>
                  <button onClick={stopTracking} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20">
                    <X />
                  </button>
                </div>
              </div>
              <div className="py-12">
                <div className="text-8xl font-black text-blue-500 tracking-tighter">
                  {Math.round(currentSignal)}<span className="text-2xl text-slate-500 ml-1">dBm</span>
                </div>
                <div className="mt-8 h-4 w-full bg-slate-700/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300" 
                       style={{ width: `${Math.min(100, Math.max(0, (currentSignal + 100) * 1.5))}%` }} />
                </div>
                <p className="mt-6 text-slate-400 text-sm">Beep frequency increases as you approach the targeted AP.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'CAF Networks', value: '6', color: 'text-blue-500' },
                  { label: 'Active APs', value: '18', color: 'text-cyan-500' },
                  { label: 'Avg Signal', value: '-52 dBm', color: 'text-purple-500' },
                  { label: 'Network Health', value: '98%', color: 'text-green-500' }
                ].map((stat, i) => (
                  <div key={i} className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200'}`}>
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">{stat.label}</div>
                    <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'spectrum' && (
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Layers className="text-blue-500" /> Channel Spectrum Visualization
                    </h3>
                    <p className="text-xs text-slate-400">Aruba AP Spectral Overlap Analysis</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedBand('2.4GHz')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${selectedBand === '2.4GHz' ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-slate-700'}`}
                    >
                      2.4 GHz
                    </button>
                    <button 
                      onClick={() => setSelectedBand('5GHz')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${selectedBand === '5GHz' ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-slate-700'}`}
                    >
                      5 GHz
                    </button>
                  </div>
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={channelGraphData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#334155" />
                      <XAxis dataKey="channel" type="number" domain={['dataMin', 'dataMax']} stroke="#888" fontSize={10} label={{ value: 'WiFi Channels', position: 'insideBottom', offset: -5, fill: '#888', fontSize: 10 }} />
                      <YAxis stroke="#888" fontSize={10} domain={[0, 100]} hide />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', fontSize: '10px' }} labelFormatter={(v) => `Channel ${v}`} />
                      {MOCK_NETWORKS.filter(n => n.frequencyBand === selectedBand).map((net, i) => (
                        <Area key={net.ssid} type="monotone" dataKey={net.ssid} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.2} strokeWidth={2} connectNulls />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'scanner' && (
              <div className="space-y-6">
                <div className={`p-8 rounded-2xl border ${darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200'}`}>
                  <div className="flex flex-col md:flex-row gap-4">
                    <input
                      type="text"
                      placeholder="Scan Location (e.g. Server Room B)..."
                      className={`flex-1 p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all ${darkMode ? 'bg-[#0f172a] border-[#334155]' : 'bg-slate-50 border-slate-200'}`}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                    <button onClick={startScan} disabled={isScanning} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
                      {isScanning ? <Loader2 className="animate-spin" /> : <Play />}
                      {isScanning ? "Scanning..." : "Start Site Survey"}
                    </button>
                  </div>
                </div>
                <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-slate-200'}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`${darkMode ? 'bg-[#0f172a]/50' : 'bg-slate-100'} text-xs font-bold uppercase tracking-widest text-slate-500`}>
                        <th className="px-6 py-4 text-left">SSID / Hardware</th>
                        <th className="px-6 py-4 text-left">Signal</th>
                        <th className="px-6 py-4 text-left">Band</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155]/50">
                      {MOCK_NETWORKS.map((n) => (
                        <tr key={n.id} className="hover:bg-blue-500/5 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-bold flex items-center gap-2">
                              {n.ssid} {n.encryption.includes('WPA') && <Lock className="w-3 h-3 text-slate-500" />}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{n.vendor} | {n.macAddress}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-bold flex items-center gap-1.5 ${n.signalStrength >= -60 ? 'text-green-500' : 'text-yellow-500'}`}>
                              <Radio className="w-3 h-3" /> {n.signalStrength} dBm
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-400">CH {n.channel} | {n.frequencyBand}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => setTrackingNetwork(n)} className="bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-blue-500/20">
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
            {['analytics', 'reports', 'admin'].includes(activeTab) && (
              <div className={`p-16 text-center rounded-3xl border border-dashed ${darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
                <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <h3 className="text-xl font-bold uppercase tracking-widest mb-2">{activeTab} MODULE</h3>
                <p className="text-sm">Enterprise authentication required for advanced management modules.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className={`h-10 border-t flex items-center justify-between px-6 text-[10px] font-mono tracking-widest uppercase transition-colors ${darkMode ? 'bg-[#1e293b] border-[#334155] text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
        <div className="flex gap-6">
          <span>SYSTEM: v3.0.0-PROD</span>
          <span className="text-green-500 font-bold">STATE: OPERATIONAL</span>
        </div>
        <div className="hidden sm:flex gap-6">
          <span>ENCRYPTION: AES-256-FIPS</span>
          <span>REGION: US-EAST-1</span>
        </div>
      </footer>
    </div>
  );
}
