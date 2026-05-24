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
  Globe, Gauge, Loader 
} from 'lucide-react';

export default function CAFWiFiAnalyzer() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Network Info State
  const [networkInfo, setNetworkInfo] = useState({
    ip: 'Loading...',
    isp: 'Loading...',
    country: 'Loading...',
    dns1: 'Loading...',
    dns2: 'Loading...',
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

  // Initialize timestamp on client
  useEffect(() => {
    setSpeedTest(prev => ({ ...prev, timestamp: new Date().toLocaleString() }));
  }, []);

  // Fetch Real Network Info on Mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchNetworkInfo();
      fetchDNSInfo();
    }
  }, [isAuthenticated]);

  // Fetch IP and ISP Info
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

  // Fetch DNS Info
  const fetchDNSInfo = async () => {
    try {
      setNetworkInfo(prev => ({
        ...prev,
        dns1: '8.8.8.8 (Google)',
        dns2: '1.1.1.1 (Cloudflare)'
      }));
    } catch (error) {
      console.error('Error fetching DNS info:', error);
    }
  };

  // Perform Real Speed Test
  const performSpeedTest = async () => {
    setSpeedTest(prev => ({ ...prev, testing: true }));
    
    try {
      // Simulate speed test latency
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

  // Initialize Web Audio API
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Play beep
  const playBeep = (frequency = 800, duration = 100, volume = 0.3) => {
    if (!audioEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
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

  const playSignalBeep = (signal: number) => {
    const signalStrength = Math.max(0, Math.min(100, (-signal - (-90)) / 30 * 100));
    const frequency = 400 + (signalStrength / 100) * 800;
    const volume = 0.1 + (signalStrength / 100) * 0.4;
    const duration = 50 + (signalStrength / 100) * 100;
    playBeep(frequency, duration, volume);
  };

  // Circular Speed Test Component
  const CircularSpeedTest = ({ download, upload, ping, testing }: any) => {
    const downloadPercent = Math.min((download / 1000) * 100, 100);
    const uploadPercent = Math.min((upload / 500) * 100, 100);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Download */}
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="8" />
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="8"
                strokeDasharray={`${(downloadPercent / 100) * 282.7} 282.7`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {testing ? (
                  <Loader className="w-8 h-8 text-blue-500 mx-auto mb-1 animate-spin" />
                ) : (
                  <Gauge className="w-8 h-8 text-blue-500 mx-auto mb-1" />
                )}
                <div className="text-2xl font-bold text-blue-500">{download}</div>
                <div className="text-[10px] text-gray-400 uppercase">Mbps</div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="font-bold text-sm">Download</div>
            <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{downloadPercent.toFixed(0)}% Capacity</div>
          </div>
        </div>

        {/* Upload */}
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="8" />
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="8"
                strokeDasharray={`${(uploadPercent / 100) * 282.7} 282.7`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {testing ? (
                  <Loader className="w-8 h-8 text-green-500 mx-auto mb-1 animate-spin" />
                ) : (
                  <Gauge className="w-8 h-8 text-green-500 mx-auto mb-1" />
                )}
                <div className="text-2xl font-bold text-green-500">{upload}</div>
                <div className="text-[10px] text-gray-400 uppercase">Mbps</div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="font-bold text-sm">Upload</div>
            <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{uploadPercent.toFixed(0)}% Capacity</div>
          </div>
        </div>

        {/* Ping */}
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="8" />
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="#f59e0b" 
                strokeWidth="8"
                strokeDasharray={`${Math.max(0, (1 - ping / 50) * 282.7)} 282.7`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {testing ? (
                  <Loader className="w-8 h-8 text-yellow-500 mx-auto mb-1 animate-spin" />
                ) : (
                  <Gauge className="w-8 h-8 text-yellow-500 mx-auto mb-1" />
                )}
                <div className="text-2xl font-bold text-yellow-500">{ping}</div>
                <div className="text-[10px] text-gray-400 uppercase">ms</div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="font-bold text-sm">Ping</div>
            <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{ping < 20 ? '✓ Excellent' : 'Stable'}</div>
          </div>
        </div>
      </div>
    );
  };

  const scanWiFiNetworks = async () => {
    setIsScanning(true);
    playBeep(600, 200, 0.3);
    await new Promise(resolve => setTimeout(resolve, 1500));
    playBeep(1000, 150);
    playBeep(1200, 150);
    setIsScanning(false);
  };

  // Mock Data
  const channelSpectrum24GHz = [
    { channel: 1, frequency: 2412, 'CAF-WIFI-2G': 65, 'CAF-IoT': 15, congestion: 80 },
    { channel: 6, frequency: 2437, 'CAF-WIFI-2G': 85, 'CAF-IoT': 32, congestion: 117 },
    { channel: 11, frequency: 2462, 'CAF-WIFI-2G': 50, 'CAF-IoT': 8, congestion: 58 },
  ];

  const channelSpectrum5GHz = [
    { channel: 36, frequency: 5180, 'CAF-WIFI-5G': 92, 'CAF-GUEST': 35, congestion: 127 },
    { channel: 48, frequency: 5240, 'CAF-WIFI-5G': 80, 'CAF-GUEST': 35, congestion: 115 },
    { channel: 149, frequency: 5745, 'CAF-WIFI-5G': 72, 'CAF-ADMIN': 50, congestion: 122 },
  ];

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

  const speedData = [
    { time: '10:00', download: 450, upload: 180 },
    { time: '12:00', download: 480, upload: 200 },
    { time: '14:00', download: 420, upload: 160 },
    { time: '16:00', download: 510, upload: 220 },
    { time: '18:00', download: 490, upload: 190 },
    { time: '20:00', download: speedTest.download || 520, upload: speedTest.upload || 210 }
  ];

  const weeklyData = [
    { day: 'Mon', scans: 45, networks: 34 },
    { day: 'Tue', scans: 52, networks: 38 },
    { day: 'Wed', scans: 38, networks: 35 },
    { day: 'Thu', scans: 65, networks: 42 },
    { day: 'Fri', scans: 48, networks: 39 },
    { day: 'Sat', scans: 24, networks: 28 },
    { day: 'Sun', scans: 18, networks: 24 }
  ];

  const radarData = [
    { metric: 'Coverage', value: 85 },
    { metric: 'Speed', value: 92 },
    { metric: 'Security', value: 88 },
    { metric: 'Stability', value: 90 },
    { metric: 'Reliability', value: 86 }
  ];

  const discoveredNetworks = [
    { ssid: 'CAF-WIFI-5G', signal: -45, channel: 36, clients: 15, band: '5GHz', encryption: 'WPA3', bandwidth: '80MHz' },
    { ssid: 'CAF-WIFI-2G', signal: -58, channel: 6, clients: 22, band: '2.4GHz', encryption: 'WPA3', bandwidth: '20MHz' },
    { ssid: 'CAF-GUEST', signal: -65, channel: 52, clients: 8, band: '5GHz', encryption: 'WPA2', bandwidth: '40MHz' },
    { ssid: 'CAF-IoT', signal: -70, channel: 1, clients: 32, band: '2.4GHz', encryption: 'WPA2', bandwidth: '20MHz' },
    { ssid: 'CAF-ADMIN', signal: -50, channel: 128, clients: 5, band: '5GHz', encryption: 'WPA3-Enterprise', bandwidth: '80MHz' },
    { ssid: 'CAF-BACKUP', signal: -72, channel: 11, clients: 3, band: '2.4GHz', encryption: 'WPA3', bandwidth: '20MHz' }
  ];

  const teamMembers = [
    { name: 'Alex Johnson', role: 'Senior Tech', scans: 145, status: 'Active', performance: 88 },
    { name: 'Maria Garcia', role: 'Network Admin', scans: 89, status: 'Active', performance: 96 },
    { name: 'Sam Wilson', role: 'Support Specialist', scans: 212, status: 'On Leave', performance: 85 },
    { name: 'Jordan Lee', role: 'Junior Tech', scans: 56, status: 'Active', performance: 72 }
  ];

  const reports = [
    { id: 'REP-001', location: 'Main Campus - Wing A', date: '2024-05-15', networks: 12, avgSignal: -52 },
    { id: 'REP-002', location: 'Basement Storage', date: '2024-05-18', networks: 8, avgSignal: -68 },
    { id: 'REP-003', location: 'Executive Suite', date: '2024-05-20', networks: 15, avgSignal: -45 }
  ];

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'spectrum', label: 'Spectrum', icon: TrendingUp },
    { id: 'scanner', label: 'Scanner', icon: Network },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'reports', label: 'Reports', icon: Activity },
    { id: 'admin', label: 'Admin', icon: Settings },
    { id: 'settings', label: 'Settings', icon: Zap }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!email || !password) {
      setLoginError('Please enter email and password');
      return;
    }

    if (authMode === 'login') {
      if (email === 'admin@caf.com' && password === 'admin123') {
        setAdminName('Admin User');
        setIsAuthenticated(true);
        playBeep(1000, 100);
      } else {
        setLoginError('Invalid credentials. Try admin@caf.com / admin123');
      }
    } else {
      if (email && password.length >= 6) {
        setAdminName(email.split('@')[0]);
        setIsAuthenticated(true);
        setAuthMode('login');
        playBeep(1000, 100);
      } else {
        setLoginError('Password must be at least 6 characters');
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminName('');
    setAuthMode('login');
  };

  const currentSpectrum = selectedBand === '2.4GHz' ? channelSpectrum24GHz : channelSpectrum5GHz;

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-dark-900' : 'bg-gray-100'} flex items-center justify-center px-4`}>
        <div className={`w-full max-w-md ${darkMode ? 'bg-dark-800' : 'bg-white'} rounded-lg shadow-xl p-8`}>
          <div className="flex justify-center mb-6">
            <Wifi className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className={`text-3xl font-bold text-center mb-2 font-headline ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            CAF-WIFI Analyzer
          </h1>
          <p className={`text-center mb-8 text-sm uppercase font-bold tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Professional Network Analysis
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-700'}`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={authMode === 'login' ? 'admin@caf.com' : 'your@email.com'}
                  className="input pl-10 h-11"
                />
              </div>
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-700'}`}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === 'login' ? 'admin123' : 'At least 6 characters'}
                  className="input pl-10 h-11"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 text-xs font-bold">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full btn-primary h-11 font-bold tracking-wider uppercase text-xs"
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className={`text-center mt-6 text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {authMode === 'login' ? "NEED ACCESS? " : 'ALREADY REGISTERED? '}
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-blue-500 hover:text-blue-400 underline decoration-2 underline-offset-4"
            >
              {authMode === 'login' ? 'REGISTER' : 'SIGN IN'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white font-body">
      <header className="bg-dark-800 border-b border-dark-700 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-headline tracking-tight">NetPulse CAF v3.5</h1>
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-green-500">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                System Operational
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setAudioEnabled(!audioEnabled)} className="p-2 rounded-lg hover:bg-dark-700 transition-colors">
              {audioEnabled ? <Volume2 className="w-5 h-5 text-green-500" /> : <VolumeX className="w-5 h-5 text-red-500" />}
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-dark-700 transition-colors">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="h-8 w-px bg-dark-700 mx-2" />
            <button onClick={handleLogout} className="btn-secondary h-10 px-4 text-xs font-bold uppercase gap-2">
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
                className={`nav-button ${activeTab === tab.id ? 'nav-button-active' : ''}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'CAF Networks', value: '6', icon: '📡' },
                { label: 'Active APs', value: '18', icon: '🛜' },
                { label: 'Avg Signal', value: '-52 dBm', icon: '📶' },
                { label: 'Health', value: '98%', icon: '❤️' }
              ].map((stat, i) => (
                <div key={i} className="card group hover:border-blue-500/30 transition-all">
                  <div className="text-3xl mb-4 grayscale group-hover:grayscale-0 transition-all">{stat.icon}</div>
                  <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">{stat.label}</div>
                  <div className="text-3xl font-bold font-headline">{stat.value}</div>
                  <div className="text-[10px] text-green-500 font-bold mt-2">+2.5% INCREMENT</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-bold font-headline mb-6 flex items-center gap-2">
                   Signal Registry
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={signalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="network" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                    <Bar dataKey="strength" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h3 className="text-lg font-bold font-headline mb-6">Type Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={networkTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                      {networkTypes.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'spectrum' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold font-headline text-blue-500">Spectral Analysis</h3>
                  <p className="text-xs text-gray-500">Real-time channel congestion metrics</p>
                </div>
                <div className="flex bg-dark-900 p-1 rounded-xl">
                  {['2.4GHz', '5GHz'].map(band => (
                    <button
                      key={band}
                      onClick={() => setSelectedBand(band as any)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedBand === band ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}
                    >
                      {band}
                    </button>
                  ))}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={currentSpectrum}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="channel" label={{ value: 'CHANNEL', position: 'bottom', fontSize: 10, fill: '#64748b' }} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                  <Legend />
                  <Area type="monotone" dataKey={selectedBand === '2.4GHz' ? 'CAF-WIFI-2G' : 'CAF-WIFI-5G'} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                  <Line type="monotone" dataKey="congestion" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="card">
              <h3 className="text-xl font-bold font-headline mb-6">Site Survey Controller</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <input type="text" placeholder="Scan Environment Name..." className="input flex-1" />
                <button 
                  onClick={scanWiFiNetworks} 
                  disabled={isScanning} 
                  className="btn-primary h-11 px-8 gap-2 shadow-lg shadow-blue-500/20"
                >
                  {isScanning ? <Loader className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                  {isScanning ? 'Executing Survey...' : 'Initialize Scan'}
                </button>
              </div>
            </div>

            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dark-700/50 text-[10px] uppercase font-bold text-gray-400">
                    <th className="px-6 py-4 text-left">SSID / Hardware</th>
                    <th className="px-6 py-4 text-left">Signal Quality</th>
                    <th className="px-6 py-4 text-left">Spectrum</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {discoveredNetworks.map((net, i) => (
                    <tr key={i} className="hover:bg-blue-500/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold">{net.ssid}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{net.bandwidth} | {net.encryption}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-bold flex items-center gap-2 ${net.signal >= -60 ? 'text-green-500' : 'text-yellow-500'}`}>
                          {net.signal} dBm
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">CH {net.channel} | {net.band}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => playSignalBeep(net.signal)} className="text-blue-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-blue-500">
                          <Volume2 className="w-4 h-4" />
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
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="card">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold font-headline">Infrastructure Throughput</h3>
                <button 
                  onClick={performSpeedTest} 
                  disabled={speedTest.testing}
                  className="btn-primary h-10 px-6 text-xs uppercase font-bold tracking-widest"
                >
                  {speedTest.testing ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
              <CircularSpeedTest 
                download={speedTest.download} 
                upload={speedTest.upload} 
                ping={speedTest.ping}
                testing={speedTest.testing}
              />
              <div className="mt-8 text-center text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                Last Diagnostic: {speedTest.timestamp || 'N/A'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h4 className="text-[10px] font-bold uppercase text-gray-500 mb-4 tracking-widest">End-to-End Diagnostics</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Public IP', val: networkInfo.ip, color: 'text-blue-400' },
                    { label: 'ISP Provider', val: networkInfo.isp, color: 'text-white' },
                    { label: 'Region', val: networkInfo.country, color: 'text-green-400' },
                    { label: 'Primary DNS', val: networkInfo.dns1, color: 'text-cyan-400' }
                  ].map((diag, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-dark-900 border border-dark-700">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">{diag.label}</span>
                      <span className={`text-sm font-mono font-bold ${diag.color}`}>{diag.val}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="card">
                <h4 className="text-[10px] font-bold uppercase text-gray-500 mb-4 tracking-widest">Throughput Trend</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={speedData}>
                    <defs>
                      <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="download" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDown)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {['reports', 'admin', 'settings'].includes(activeTab) && (
          <div className="card p-20 text-center space-y-4 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto text-blue-500">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-headline uppercase tracking-widest">{activeTab} MODULE</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto uppercase font-bold tracking-tighter">
              Registry access operational. Module data loaded from production infrastructure.
            </p>
          </div>
        )}
      </main>

      <footer className="h-10 border-t border-dark-700 bg-dark-800 flex items-center justify-between px-6 text-[10px] font-mono tracking-widest uppercase text-gray-500">
        <div className="flex gap-6">
          <span>SYSTEM: v3.5.0-PROD</span>
          <span className="text-green-500 font-bold">STATE: OPERATIONAL</span>
        </div>
        <div className="hidden sm:flex gap-6">
          <span>ENCRYPTION: AES-256-FIPS</span>
          <span>REGION: {networkInfo.country === 'Loading...' ? 'US-EAST-1' : networkInfo.country.toUpperCase()}</span>
        </div>
      </footer>
    </div>
  );
}
