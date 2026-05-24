'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart 
} from 'recharts';
import { 
  Wifi, Sun, Moon, Settings, BarChart3, Network, TrendingUp, 
  Activity, Zap, Volume2, VolumeX, LogOut, Mail, Lock, 
  Globe, Gauge, Loader2, Eye, EyeOff, Signal, Router, 
  ShieldCheck, Crosshair, MapPin, Play, X, FileText, Smartphone, Monitor
} from 'lucide-react';

export default function CAFWiFiAnalyzer() {
  // Tabs configuration moved inside to ensure it is defined for the UI
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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('admin@caf.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Hydration safety
  const [isMounted, setIsMounted] = useState(false);

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

  // App State
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBand, setSelectedBand] = useState<'2.4GHz' | '5GHz'>('5GHz');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

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
      console.error('IP fetch error:', err);
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
      setTimeout(() => playBeep(1200, 150), 300);
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
  };

  // Spectrum Data
  const currentSpectrum = selectedBand === '2.4GHz' 
    ? [
        { channel: 1, 'CAF-WIFI-2G': 65, congestion: 40 },
        { channel: 6, 'CAF-WIFI-2G': 85, congestion: 70 },
        { channel: 11, 'CAF-WIFI-2G': 50, congestion: 30 },
      ]
    : [
        { channel: 36, 'CAF-WIFI-5G': 90, congestion: 20 },
        { channel: 44, 'CAF-WIFI-5G': 85, congestion: 15 },
        { channel: 149, 'CAF-WIFI-5G': 70, congestion: 45 },
      ];

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
                onClick={() => setActiveTab(tab.id)}
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
                    <BarChart data={[
                      { name: '5G-MAIN', val: 85 }, { name: '2G-MAIN', val: 72 }, { name: 'GUEST', val: 68 }, { name: 'IoT', val: 55 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="val" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-dark-800 p-8 rounded-2xl border border-dark-700 flex flex-col">
                <h3 className="text-lg font-bold mb-6 uppercase tracking-wide text-gray-400">Network Distribution</h3>
                <div className="h-[300px] flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: 'Main', value: 2, color: '#3b82f6' },
                        { name: 'Guest', value: 1, color: '#10b981' },
                        { name: 'IoT', value: 1, color: '#f59e0b' }
                      ]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                        { [0,1,2].map((_, i) => <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b'][i]} stroke="none" />) }
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
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
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
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
              <div className="mt-12 pt-8 border-t border-dark-700 text-center text-xs text-gray-500 font-mono">
                LAST AUDIT: {speedTest.timestamp}
              </div>
            </div>

            <div className="bg-dark-800 p-8 rounded-3xl border border-dark-700">
              <h3 className="text-lg font-bold mb-8 flex items-center gap-2 uppercase tracking-widest">
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

        {/* Placeholder for other tabs */}
        {['spectrum', 'scanner', 'reports', 'admin', 'settings'].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center py-20 bg-dark-800 rounded-3xl border border-dashed border-dark-700">
            <Activity className="w-16 h-16 text-dark-600 mb-4 animate-pulse" />
            <h3 className="text-xl font-bold uppercase tracking-widest text-gray-500">{activeTab} MODULE ACTIVE</h3>
            <p className="text-sm text-gray-600 mt-2">Aruba Cloud-Link Established | Monitoring spectrum...</p>
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
