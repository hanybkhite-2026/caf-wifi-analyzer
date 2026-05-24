'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart 
} from 'recharts';
import { 
  Wifi, Sun, Moon, Settings, BarChart3, Network, TrendingUp, 
  Activity, Zap, Volume2, VolumeX, LogOut, Mail, Lock, 
  Globe, Gauge, Loader2, Eye, EyeOff, Signal, Router, 
  ShieldCheck, Crosshair, MapPin, Play, X, FileText, Smartphone, Monitor, Layers, AlertTriangle
} from 'lucide-react';

export default function CAFWiFiAnalyzer() {
  // Hydration safety
  const [isMounted, setIsMounted] = useState(false);

  // Tabs configuration
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'spectrum', label: 'Spectrum', icon: TrendingUp },
    { id: 'scanner', label: 'Scanner', icon: Network },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'admin', label: 'Admin', icon: Settings },
    { id: 'settings', label: 'Settings', icon: Zap }
  ];

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('admin@caf.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // App State
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBand, setSelectedBand] = useState<'2.4GHz' | '5GHz'>('5GHz');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [location, setLocation] = useState("");

  // Tracking / Locator State
  const [trackingNetwork, setTrackingNetwork] = useState<any>(null);
  const [currentSignal, setCurrentSignal] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Network Info State
  const [networkInfo, setNetworkInfo] = useState({
    ip: '192.168.1.105',
    isp: 'Local Network',
    country: 'Detection Pending',
    dns1: '8.8.8.8',
    dns2: '1.1.1.1',
    loading: true
  });

  // Speed Test State
  const [speedTest, setSpeedTest] = useState({
    download: 0,
    upload: 0,
    ping: 0,
    timestamp: '',
    testing: false
  });

  // Mock Data for Graphs
  const discoveredNetworks = [
    { id: '1', ssid: 'CAF-WIFI-5G', signalStrength: -45, channel: 36, clientsConnected: 15, frequencyBand: '5GHz', encryption: 'WPA3', vendor: 'ARUBA', macAddress: '00:0B:86:12:34:56', bandwidthMbps: 850, interferenceScore: 1 },
    { id: '2', ssid: 'CAF-WIFI-2G', signalStrength: -58, channel: 6, clientsConnected: 22, frequencyBand: '2.4GHz', encryption: 'WPA3', vendor: 'ARUBA', macAddress: '00:0B:86:78:90:AB', bandwidthMbps: 150, interferenceScore: 4 },
    { id: '3', ssid: 'CAF-GUEST', signalStrength: -65, channel: 52, clientsConnected: 8, frequencyBand: '5GHz', encryption: 'WPA2', vendor: 'ARUBA', macAddress: '00:0B:86:CD:EF:01', bandwidthMbps: 300, interferenceScore: 2 },
    { id: '4', ssid: 'CAF-IoT', signalStrength: -70, channel: 1, clientsConnected: 32, frequencyBand: '2.4GHz', encryption: 'WPA2', vendor: 'HUAWEI', macAddress: '7c:1c:f1:25:19:2c', bandwidthMbps: 50, interferenceScore: 8 },
    { id: '5', ssid: 'CAF-ADMIN', signalStrength: -50, channel: 128, clientsConnected: 5, frequencyBand: '5GHz', encryption: 'WPA3-Enterprise', vendor: 'TP-LINK', macAddress: '98:da:c4:26:21:87', bandwidthMbps: 900, interferenceScore: 1 },
    { id: '6', ssid: 'CAF-BACKUP', signalStrength: -72, channel: 11, clientsConnected: 3, frequencyBand: '2.4GHz', encryption: 'WPA3', vendor: 'GENERIC', macAddress: '9e:da:c4:26:21:87', bandwidthMbps: 100, interferenceScore: 5 }
  ];

  const performanceData = discoveredNetworks.map(n => ({
    name: n.ssid,
    signal: Math.abs(n.signalStrength),
    bandwidth: n.bandwidthMbps,
    interference: n.interferenceScore * 10,
  }));

  const typeData = [
    { name: 'Main', value: 2, color: '#3b82f6' },
    { name: 'Guest', value: 1, color: '#10b981' },
    { name: 'IoT', value: 1, color: '#f59e0b' }
  ];

  const COLORS = ['#3b82f6', '#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];

  // Initialize
  useEffect(() => {
    setIsMounted(true);
    setSpeedTest(prev => ({ ...prev, timestamp: new Date().toLocaleString() }));
    
    if (isAuthenticated) {
      fetchNetworkInfo();
    }
  }, [isAuthenticated]);

  const fetchNetworkInfo = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      setNetworkInfo({
        ip: data.ip || '192.168.1.105',
        isp: data.org || 'Unknown ISP',
        country: data.country_name || 'Unknown',
        dns1: '8.8.8.8',
        dns2: '1.1.1.1',
        loading: false
      });
    } catch (err) {
      setNetworkInfo(prev => ({ ...prev, loading: false }));
    }
  };

  const performSpeedTest = async () => {
    setSpeedTest(prev => ({ ...prev, testing: true }));
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const dl = Math.round(Math.random() * 300 + 200);
    const ul = Math.round(Math.random() * 100 + 50);
    const p = Math.round((Math.random() * 15 + 5) * 10) / 10;
    
    setSpeedTest({
      download: dl,
      upload: ul,
      ping: p,
      timestamp: new Date().toLocaleString(),
      testing: false
    });

    if (audioEnabled) {
      playBeep(800, 100);
      setTimeout(() => playBeep(1000, 100), 150);
    }
  };

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playBeep = (frequency = 800, duration = 100, volume = 0.3) => {
    if (!audioEnabled || !isMounted) return;
    try {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration / 1000);
    } catch (err) {
      console.log('Audio blocked');
    }
  };

  // Signal Tracker / Locator Effect
  useEffect(() => {
    if (trackingNetwork) {
      setCurrentSignal(trackingNetwork.signalStrength);
      
      const locatorBeep = () => {
        if (isMuted || !isMounted) return;
        const ctx = initAudio();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        // Frequency shifts higher as signal gets closer to 0
        const freq = 400 + (Math.abs(currentSignal) < 50 ? 400 : 0) + (Math.abs(currentSignal + 95) * 3);
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      };

      const updateInterval = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Delay shortens as signal strength increases
        const delay = Math.max(80, (Math.abs(currentSignal) - 30) * 18);
        intervalRef.current = setInterval(() => {
          locatorBeep();
          setCurrentSignal(prev => {
            const fluctuation = (Math.random() - 0.5) * 6;
            const newVal = prev + fluctuation;
            return Math.min(-30, Math.max(-95, newVal));
          });
        }, delay);
      };

      updateInterval();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [trackingNetwork, currentSignal, isMuted, isMounted]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (email.trim() === 'admin@caf.com' && password === 'admin123') {
      setAdminName('Admin');
      setIsAuthenticated(true);
      playBeep(1000, 100);
    } else {
      setLoginError('Invalid credentials. Use demo account.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    setTrackingNetwork(null);
  };

  // Channel Spectrum Gaussian Logic
  const channelGraphData = useMemo(() => {
    const is2G = selectedBand === '2.4GHz';
    const channels = is2G ? Array.from({ length: 14 }, (_, i) => i + 1) : [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 149, 153, 157, 161, 165];
    
    const dataPoints: any[] = [];
    const minChan = Math.min(...channels) - 2;
    const maxChan = Math.max(...channels) + 2;
    
    for (let i = minChan; i <= maxChan; i += 0.5) {
      const point: any = { channel: i };
      discoveredNetworks.filter(n => n.frequencyBand === selectedBand).forEach(net => {
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

  if (!isMounted) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-dark-800 rounded-2xl shadow-2xl p-8 border border-dark-700">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 rounded-2xl p-4 shadow-lg shadow-blue-500/20">
              <Wifi className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-1 text-white">NetPulse CAF</h1>
          <p className="text-center text-gray-400 mb-8 text-sm">Enterprise Infrastructure Analyzer</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-700 border border-dark-600 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-dark-700 border border-dark-600 text-white focus:outline-none focus:border-blue-500"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-500 hover:text-white">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {loginError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{loginError}</div>}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">✅ Demo: admin@caf.com / admin123</div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20">Sign In to Infrastructure</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans">
      <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Wifi className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">NetPulse CAF</h1>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                SESSION: {adminName.toUpperCase()}@INFRA-V3
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAudioEnabled(!audioEnabled)} className={`p-2 rounded-lg transition-colors ${audioEnabled ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-dark-700 text-yellow-500">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={handleLogout} className="px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-xs font-bold flex items-center gap-2 border border-dark-600">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
        <nav className="border-t border-dark-700 bg-dark-900/50 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-6 flex gap-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setTrackingNetwork(null); }}
                className={`py-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === tab.id ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-white'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 animate-in fade-in duration-500">
        {trackingNetwork ? (
          /* LOCATE AP MODE - Enterprise Locator Interface */
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
                  <button onClick={() => setIsMuted(!isMuted)} className="p-3 rounded-xl bg-dark-700 hover:bg-dark-600">
                    {isMuted ? <VolumeX /> : <Volume2 />}
                  </button>
                  <button onClick={() => setTrackingNetwork(null)} className="p-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 bg-dark-700">
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
          /* STANDARD TABS */
          <div className="space-y-8">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'CAF Networks', value: '6', change: '+2.5%', icon: Wifi, color: 'text-blue-500' },
                    { label: 'Active APs', value: '18', change: 'STABLE', icon: Router, color: 'text-cyan-500' },
                    { label: 'Avg Signal', value: '-52 dBm', change: 'EXCELLENT', icon: Signal, color: 'text-purple-500' },
                    { label: 'Network Health', value: '98%', change: 'OPTIMAL', icon: ShieldCheck, color: 'text-green-500' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-dark-800 p-6 rounded-2xl border border-dark-700 hover:border-dark-600 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl bg-dark-700 ${stat.color} group-hover:scale-110 transition-transform`}>
                          <stat.icon className="w-6 h-6" />
                        </div>
                        <div className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">{stat.change}</div>
                      </div>
                      <div className="text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">{stat.label}</div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-dark-800 p-8 rounded-2xl border border-dark-700">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-wide text-gray-400">
                      <Signal className="w-5 h-5 text-blue-500" /> Spectral Strength Index
                    </h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={signalData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis dataKey="network" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                          <YAxis stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px' }} />
                          <Bar dataKey="strength" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-dark-800 p-8 rounded-2xl border border-dark-700 flex flex-col">
                    <h3 className="text-lg font-bold mb-6 uppercase tracking-wide text-gray-400">Network Distribution</h3>
                    <div className="h-[300px] flex-1">
                      <ResponsiveContainer width="100%" height={100}>
                        <PieChart>
                          <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                            {typeData.map((entry, index) => <Cell key={index} fill={entry.color} stroke="none" />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'spectrum' && (
              <div className="space-y-6">
                <div className="bg-dark-800 p-8 rounded-2xl border border-dark-700">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Layers className="w-5 h-5 text-primary" /> Channel Spectrum Graph
                      </h3>
                      <p className="text-sm text-gray-500">Gaussian signal modeling of existing CAF infrastructure</p>
                    </div>
                    <div className="flex gap-2">
                      {['2.4GHz', '5GHz'].map((b) => (
                        <button
                          key={b}
                          onClick={() => setSelectedBand(b as any)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            selectedBand === b ? 'bg-blue-600 text-white' : 'bg-dark-700 text-gray-400'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={channelGraphData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#333" />
                        <XAxis dataKey="channel" type="number" domain={['dataMin', 'dataMax']} stroke="#888" fontSize={12} />
                        <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', border: 'none', borderRadius: '12px' }} />
                        {discoveredNetworks.filter(n => n.frequencyBand === selectedBand).map((net, i) => (
                          <Area
                            key={net.ssid}
                            type="monotone"
                            dataKey={net.ssid}
                            stroke={COLORS[i % COLORS.length]}
                            fill={COLORS[i % COLORS.length]}
                            fillOpacity={0.3}
                            strokeWidth={2}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700">
                    <h3 className="text-md font-bold mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> Bandwidth Distribution</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData} layout="vertical">
                          <XAxis type="number" stroke="#888" fontSize={10} unit="M" />
                          <YAxis dataKey="name" type="category" stroke="#888" fontSize={10} width={80} />
                          <Bar dataKey="bandwidth" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700">
                    <h3 className="text-md font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Interference Impact</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData}>
                          <XAxis dataKey="name" stroke="#888" fontSize={10} />
                          <YAxis stroke="#888" fontSize={10} />
                          <Bar dataKey="interference" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'scanner' && (
              <div className="space-y-6">
                <div className="bg-dark-800 p-8 rounded-2xl border border-dark-700">
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
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-700 border border-dark-600 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => { setIsScanning(true); setTimeout(() => setIsScanning(false), 2000); }} 
                      disabled={isScanning}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isScanning ? <Loader2 className="animate-spin" /> : <Play />}
                      {isScanning ? "Initializing Scan..." : "Start Site Survey"}
                    </button>
                  </div>
                </div>

                <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-dark-700/50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-6 py-4">SSID / Hardware</th>
                        <th className="px-6 py-4">Signal Quality</th>
                        <th className="px-6 py-4">Spectrum</th>
                        <th className="px-6 py-4">Encryption</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700/50">
                      {discoveredNetworks.map((net) => (
                        <tr key={net.id} className="hover:bg-blue-500/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold">{net.ssid}</div>
                            <div className="text-[10px] text-gray-500 font-mono mt-1">{net.vendor} | {net.macAddress}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`font-bold flex items-center gap-2 ${net.signalStrength >= -60 ? 'text-green-500' : 'text-yellow-500'}`}>
                              <Signal className="w-4 h-4" /> {net.signalStrength} dBm
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs">CH {net.channel} | {net.frequencyBand}</td>
                          <td className="px-6 py-4 text-xs text-gray-400"><Lock className="w-3 h-3 inline mr-1" /> {net.encryption}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setTrackingNetwork(net)}
                              className="bg-blue-500/10 text-blue-500 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold border border-blue-500/20"
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

            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div className="bg-dark-800 p-8 rounded-3xl border border-dark-700 shadow-2xl">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                      <h3 className="text-2xl font-bold">Throughput Analysis</h3>
                      <p className="text-sm text-gray-400">Real-time WAN performance monitoring</p>
                    </div>
                    <button
                      onClick={performSpeedTest}
                      disabled={speedTest.testing}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center gap-3 transition-all disabled:opacity-50"
                    >
                      {speedTest.testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                      {speedTest.testing ? 'RUNNING TEST...' : 'START SPEED TEST'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                      { label: 'Download', val: speedTest.download, unit: 'Mbps', color: 'text-blue-500', max: 1000 },
                      { label: 'Upload', val: speedTest.upload, unit: 'Mbps', color: 'text-green-500', max: 500 },
                      { label: 'Latency', val: speedTest.ping, unit: 'ms', color: 'text-yellow-500', max: 100 }
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="relative w-48 h-48 mb-6">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#222" strokeWidth="6" />
                            <circle 
                              cx="50" cy="50" r="45" fill="none" 
                              stroke="currentColor" strokeWidth="6"
                              strokeDasharray={`${(item.val / item.max) * 282.7} 282.7`}
                              className={item.color}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-3xl font-black">{item.val}</div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase">{item.unit}</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold uppercase tracking-widest text-gray-400">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-dark-800 p-8 rounded-3xl border border-dark-700">
                  <h3 className="text-lg font-bold mb-8 flex items-center gap-2 uppercase tracking-widest text-gray-500">
                    <Globe className="w-5 h-5 text-blue-500" /> Network Footprint
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Public IP', value: networkInfo.ip, icon: Wifi },
                      { label: 'Provider', value: networkInfo.isp, icon: Activity },
                      { label: 'Region', value: networkInfo.country, icon: Globe },
                      { label: 'Primary DNS', value: networkInfo.dns1, icon: Router }
                    ].map((info, i) => (
                      <div key={i} className="bg-dark-700/50 p-6 rounded-2xl border border-dark-600">
                        <div className="text-[10px] font-black text-gray-500 uppercase mb-2 tracking-tighter">{info.label}</div>
                        <div className="text-sm font-bold text-blue-400 truncate">{info.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder for remaining modules */}
            {['reports', 'admin', 'settings'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center py-20 bg-dark-800 rounded-3xl border border-dashed border-dark-700">
                <Activity className="w-16 h-16 text-dark-600 mb-4 animate-pulse" />
                <h3 className="text-xl font-bold uppercase tracking-widest text-gray-500">{activeTab} MODULE ACTIVE</h3>
                <p className="text-sm text-gray-600 mt-2">Enterprise Access Confirmed | Monitoring System...</p>
                <div className="mt-8 flex gap-4">
                   <div className="px-4 py-2 bg-dark-700 rounded-lg text-xs">v3.6.0-ENTERPRISE</div>
                   <div className="px-4 py-2 bg-dark-700 rounded-lg text-xs text-green-500">OPERATIONAL</div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-dark-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <div className="text-lg font-bold text-gray-400 mb-1">Hany Bkhite</div>
            <a href="mailto:hany.bkhite@gmail.com" className="text-sm text-blue-500 hover:underline">hany.bkhite@gmail.com</a>
          </div>
          <div className="text-center md:text-right">
            <p className="text-xs text-gray-500 uppercase font-black tracking-tighter">NetPulse CAF Infrastructure</p>
            <p className="text-[10px] text-gray-600 mt-1">v3.6.0-ENTERPRISE-PROD | NO SECURITY VIOLATIONS DETECTED</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
