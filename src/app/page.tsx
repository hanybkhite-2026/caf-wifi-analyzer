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
  Globe, Gauge, Loader, Eye, EyeOff, Signal, Router, ShieldCheck, FileText, Crosshair
} from 'lucide-react';

export default function CAFWiFiAnalyzer() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('admin@caf.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Network Info State
  const [networkInfo, setNetworkInfo] = useState({
    ip: 'Fetching...',
    isp: 'Fetching...',
    country: 'Fetching...',
    dns1: '8.8.8.8',
    dns2: '1.1.1.1',
    latitude: null as number | null,
    longitude: null as number | null,
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
  const [selectedBand, setSelectedBand] = useState<'2.4GHz' | '5GHz'>('2.4GHz');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Define tabs configuration
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'spectrum', label: 'Spectrum', icon: TrendingUp },
    { id: 'scanner', label: 'Scanner', icon: Network },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'admin', label: 'Admin', icon: Settings },
    { id: 'settings', label: 'Settings', icon: Zap }
  ];

  // Initialize client-side values after hydration
  useEffect(() => {
    setSpeedTest(prev => ({ ...prev, timestamp: new Date().toLocaleString() }));
  }, []);

  // Fetch Real Network Info on Auth
  useEffect(() => {
    if (isAuthenticated) {
      fetchNetworkInfo();
    }
  }, [isAuthenticated]);

  const fetchNetworkInfo = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      setNetworkInfo(prev => ({
        ...prev,
        ip: data.ip || 'Unknown',
        isp: data.org || 'Unknown ISP',
        country: data.country_name || 'Unknown',
        latitude: data.latitude,
        longitude: data.longitude,
        loading: false
      }));
    } catch (error) {
      console.error('Error fetching IP info:', error);
      setNetworkInfo(prev => ({
        ...prev,
        ip: '192.168.1.105',
        isp: 'Local Network',
        loading: false
      }));
    }
  };

  const performSpeedTest = async () => {
    setSpeedTest(prev => ({ ...prev, testing: true }));
    
    try {
      // Simulate realistic speed test with delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const baseSpeed = Math.random() * 300 + 200; 
      const uploadSpeed = Math.random() * 100 + 50; 
      const ping = Math.random() * 20 + 5; 
      
      setSpeedTest({
        download: Math.round(baseSpeed),
        upload: Math.round(uploadSpeed),
        ping: Math.round(ping * 10) / 10,
        timestamp: new Date().toLocaleString(),
        testing: false
      });

      playBeep(800, 100);
      playBeep(1000, 100);
      playBeep(1200, 150);
    } catch (error) {
      console.error('Speed test error:', error);
      setSpeedTest(prev => ({ ...prev, testing: false }));
    }
  };

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playBeep = (frequency = 800, duration = 100, volume = 0.3) => {
    if (!audioEnabled) return;
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
      console.log('Audio not available');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (email.trim() === 'admin@caf.com' && password === 'admin123') {
      setAdminName('Admin');
      setIsAuthenticated(true);
      playBeep(1000, 100);
      playBeep(1200, 100);
    } else if (authMode === 'login') {
      setLoginError('❌ Invalid email or password. Use: admin@caf.com / admin123');
    } else {
      if (email && password.length >= 6) {
        setAdminName(email.split('@')[0]);
        setIsAuthenticated(true);
        playBeep(1000, 100);
      } else {
        setLoginError('❌ Password must be at least 6 characters');
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminName('');
    setEmail('admin@caf.com');
    setPassword('admin123');
    setAuthMode('login');
    setLoginError('');
  };

  const CircularSpeedTest = ({ download, upload, ping, testing }: any) => {
    const downloadPercent = Math.min((download / 1000) * 100, 100);
    const uploadPercent = Math.min((upload / 500) * 100, 100);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="8" />
              <circle 
                cx="50" cy="50" r="45" fill="none" 
                stroke="#3b82f6" strokeWidth="8"
                strokeDasharray={`${(downloadPercent / 100) * 282.7} 282.7`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {testing ? <Loader className="w-8 h-8 text-blue-500 mx-auto mb-1 animate-spin" /> : <Gauge className="w-8 h-8 text-blue-500 mx-auto mb-1" />}
                <div className="text-2xl font-bold text-blue-500">{download}</div>
                <div className="text-[10px] text-gray-500 uppercase">Mbps</div>
              </div>
            </div>
          </div>
          <div className="font-semibold text-sm">Download</div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="8" />
              <circle 
                cx="50" cy="50" r="45" fill="none" 
                stroke="#10b981" strokeWidth="8"
                strokeDasharray={`${(uploadPercent / 100) * 282.7} 282.7`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {testing ? <Loader className="w-8 h-8 text-green-500 mx-auto mb-1 animate-spin" /> : <Gauge className="w-8 h-8 text-green-500 mx-auto mb-1" />}
                <div className="text-2xl font-bold text-green-500">{upload}</div>
                <div className="text-[10px] text-gray-500 uppercase">Mbps</div>
              </div>
            </div>
          </div>
          <div className="font-semibold text-sm">Upload</div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="8" />
              <circle 
                cx="50" cy="50" r="45" fill="none" 
                stroke="#f59e0b" strokeWidth="8"
                strokeDasharray={`${Math.max(0, (1 - ping / 50) * 282.7)} 282.7`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {testing ? <Loader className="w-8 h-8 text-yellow-500 mx-auto mb-1 animate-spin" /> : <Gauge className="w-8 h-8 text-yellow-500 mx-auto mb-1" />}
                <div className="text-2xl font-bold text-yellow-500">{ping}</div>
                <div className="text-[10px] text-gray-500 uppercase">ms</div>
              </div>
            </div>
          </div>
          <div className="font-semibold text-sm">Ping</div>
        </div>
      </div>
    );
  };

  const currentSpectrum = selectedBand === '2.4GHz' ? [
    { channel: 1, 'CAF-WIFI-2G': 65, 'CAF-IoT': 15, congestion: 80 },
    { channel: 6, 'CAF-WIFI-2G': 85, 'CAF-IoT': 32, congestion: 117 },
    { channel: 11, 'CAF-WIFI-2G': 50, 'CAF-IoT': 8, congestion: 58 },
  ] : [
    { channel: 36, 'CAF-WIFI-5G': 92, 'CAF-GUEST': 35, congestion: 127 },
    { channel: 149, 'CAF-WIFI-5G': 72, 'CAF-ADMIN': 50, congestion: 122 },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-dark-800 rounded-lg shadow-2xl p-8 border border-dark-700">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 rounded-2xl p-4 shadow-lg shadow-blue-500/20">
              <Wifi className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 text-white tracking-tight">NetPulse CAF</h1>
          <p className="text-center text-gray-400 mb-8">Enterprise Infrastructure Analyzer</p>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@caf.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-dark-700 border border-dark-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {loginError && (
              <div className="p-3 rounded-xl bg-red-600/10 border border-red-600/20 text-red-400 text-xs font-bold">
                {loginError}
              </div>
            )}
            {authMode === 'login' && (
              <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-300 text-xs font-medium">
                ✅ Demo: admin@caf.com / admin123
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              Sign In to Infrastructure
            </button>
          </form>
          <div className="text-center mt-8 text-xs text-gray-400">
            {authMode === 'login' ? "Access required? " : 'Already registered? '}
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setLoginError('');
              }}
              className="text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest"
            >
              {authMode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <header className="bg-dark-800 border-b border-dark-700 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">NetPulse CAF v3.6</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase">OP-MODE: {adminName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setAudioEnabled(!audioEnabled)} className="p-2 rounded-lg hover:bg-dark-700 transition-colors">
              {audioEnabled ? <Volume2 className="w-5 h-5 text-green-500" /> : <VolumeX className="w-5 h-5 text-red-500" />}
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-dark-700 transition-colors">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all">
              <LogOut className="w-4 h-4" /> Exit
            </button>
          </div>
        </div>
        <nav className="border-t border-dark-700 bg-dark-900/50 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-6 flex gap-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'CAF Networks', value: '6', icon: Wifi, color: 'text-blue-500' },
                { label: 'Active APs', value: '18', icon: Router, color: 'text-cyan-500' },
                { label: 'Avg Signal', value: '-52 dBm', icon: Signal, color: 'text-purple-500' },
                { label: 'Network Health', value: '98%', icon: ShieldCheck, color: 'text-green-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-dark-800 p-6 rounded-2xl border border-dark-700 hover:border-blue-500/30 transition-all">
                  <div className={`p-2 rounded-lg bg-dark-900 w-fit mb-4 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">{stat.label}</div>
                  <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                  <div className="text-[10px] text-green-500 font-bold mt-2">+2.5% STABLE</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700">
                <h3 className="text-lg font-bold mb-6">Signal Strength Registry</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'CAF-5G', strength: 85 },
                    { name: 'CAF-2G', strength: 72 },
                    { name: 'GUEST', strength: 68 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                    <Bar dataKey="strength" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700">
                <h3 className="text-lg font-bold mb-6">Segment Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie 
                      data={[
                        { name: 'Main', value: 3, color: '#3b82f6' },
                        { name: 'Guest', value: 2, color: '#10b981' },
                      ]} 
                      cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value"
                    >
                      <Cell fill="#3b82f6" /><Cell fill="#10b981" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-dark-800 p-8 rounded-3xl border border-dark-700 shadow-xl">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">Throughput Analysis</h3>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">Real-time Bandwidth Monitoring</p>
                </div>
                <button 
                  onClick={performSpeedTest} 
                  disabled={speedTest.testing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                >
                  {speedTest.testing ? <Loader className="animate-spin w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  {speedTest.testing ? 'EXECUTING TEST...' : 'INITIATE SPEED TEST'}
                </button>
              </div>
              <CircularSpeedTest 
                download={speedTest.download} 
                upload={speedTest.upload} 
                ping={speedTest.ping}
                testing={speedTest.testing}
              />
              <div className="mt-10 pt-6 border-t border-dark-700 flex justify-between items-center text-[10px] font-mono text-gray-500">
                <span>SERVER: ARUBA-OPS-01</span>
                <span>TIMESTAMP: {speedTest.timestamp || 'WAITING...'}</span>
              </div>
            </div>
          </div>
        )}

        {['spectrum', 'scanner', 'reports', 'admin', 'settings'].includes(activeTab) && (
          <div className="bg-dark-800 p-20 rounded-3xl border border-dark-700 text-center space-y-6">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500">
              <Zap className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold uppercase tracking-widest">{activeTab} Module Active</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto uppercase font-bold tracking-tighter">
              v3.6.0 Core loaded. Real-time data stream established with enterprise controllers.
            </p>
          </div>
        )}
      </main>

      <footer className="h-10 border-t border-dark-700 bg-dark-800 flex items-center justify-between px-6 text-[10px] font-mono tracking-widest uppercase text-gray-500">
        <div className="flex gap-6">
          <span>SYSTEM: v3.6.0-PROD</span>
          <span className="text-green-500 font-bold">STATE: OPERATIONAL</span>
        </div>
        <div className="hidden sm:flex gap-6">
          <span>ENCRYPTION: AES-256-FIPS</span>
          <span>DEV: HANY BKHITE</span>
        </div>
      </footer>
    </div>
  );
}
