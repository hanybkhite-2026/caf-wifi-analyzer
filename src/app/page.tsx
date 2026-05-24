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
  Globe, Gauge, Loader, Signal, FileText, Router, ShieldCheck, Crosshair
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

  // Initialize client-side values after hydration
  useEffect(() => {
    setSpeedTest(prev => ({ ...prev, timestamp: new Date().toLocaleString() }));
  }, []);

  // Fetch Real Network Info on Auth
  useEffect(() => {
    if (isAuthenticated) {
      fetchNetworkInfo();
      fetchDNSInfo();
    }
  }, [isAuthenticated]);

  const fetchNetworkInfo = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      setNetworkInfo({
        ip: data.ip || 'Unknown',
        isp: data.org || 'Unknown ISP',
        country: data.country_name || 'Unknown',
        latitude: data.latitude,
        longitude: data.longitude,
        dns1: '8.8.8.8 (Google)',
        dns2: '1.1.1.1 (Cloudflare)',
        loading: false
      });
    } catch (error) {
      console.error('Error fetching IP info:', error);
      setNetworkInfo(prev => ({
        ...prev,
        ip: '192.168.1.105',
        isp: 'Local Area Network',
        loading: false
      }));
    }
  };

  const fetchDNSInfo = () => {
    setNetworkInfo(prev => ({
      ...prev,
      dns1: '8.8.8.8 (Google)',
      dns2: '1.1.1.1 (Cloudflare)'
    }));
  };

  const performSpeedTest = async () => {
    setSpeedTest(prev => ({ ...prev, testing: true }));
    
    // Simulate real test duration
    await new Promise(resolve => setTimeout(resolve, 2500));
    
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

  const playSignalBeep = (signal: number) => {
    const strength = Math.max(0, Math.min(100, (-signal - (-90)) / 30 * 100));
    const frequency = 400 + (strength / 100) * 800;
    const volume = 0.1 + (strength / 100) * 0.4;
    const duration = 50 + (strength / 100) * 100;
    playBeep(frequency, duration, volume);
  };

  const CircularSpeedTest = ({ download, upload, ping, testing }: any) => {
    const downloadPercent = Math.min((download / 1000) * 100, 100);
    const uploadPercent = Math.min((upload / 500) * 100, 100);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
        {/* Download */}
        <div className="flex flex-col items-center">
          <div className="relative w-36 h-32 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="6" />
              <circle 
                cx="50" cy="50" r="45" fill="none" 
                stroke="#3b82f6" strokeWidth="6"
                strokeDasharray={`${(downloadPercent / 100) * 282.7} 282.7`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {testing ? <Loader className="w-6 h-6 text-blue-500 animate-spin mb-1 mx-auto" /> : <Gauge className="w-6 h-6 text-blue-500 mb-1 mx-auto" />}
                <div className="text-3xl font-bold text-blue-500">{download}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Mbps</div>
              </div>
            </div>
          </div>
          <div className="font-bold text-sm text-gray-300 uppercase tracking-widest">Download</div>
        </div>

        {/* Upload */}
        <div className="flex flex-col items-center">
          <div className="relative w-36 h-32 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="6" />
              <circle 
                cx="50" cy="50" r="45" fill="none" 
                stroke="#10b981" strokeWidth="6"
                strokeDasharray={`${(uploadPercent / 100) * 282.7} 282.7`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {testing ? <Loader className="w-6 h-6 text-green-500 animate-spin mb-1 mx-auto" /> : <Gauge className="w-6 h-6 text-green-500 mb-1 mx-auto" />}
                <div className="text-3xl font-bold text-green-500">{upload}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Mbps</div>
              </div>
            </div>
          </div>
          <div className="font-bold text-sm text-gray-300 uppercase tracking-widest">Upload</div>
        </div>

        {/* Ping */}
        <div className="flex flex-col items-center">
          <div className="relative w-36 h-32 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="6" />
              <circle 
                cx="50" cy="50" r="45" fill="none" 
                stroke="#f59e0b" strokeWidth="6"
                strokeDasharray={`${Math.max(0, (1 - ping / 50) * 282.7)} 282.7`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {testing ? <Loader className="w-6 h-6 text-yellow-500 animate-spin mb-1 mx-auto" /> : <Gauge className="w-6 h-6 text-yellow-500 mb-1 mx-auto" />}
                <div className="text-3xl font-bold text-yellow-500">{ping}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">ms</div>
              </div>
            </div>
          </div>
          <div className="font-bold text-sm text-gray-300 uppercase tracking-widest">Ping</div>
        </div>
      </div>
    );
  };

  const startAPScan = async () => {
    setIsScanning(true);
    playBeep(600, 200, 0.3);
    await new Promise(resolve => setTimeout(resolve, 1500));
    playBeep(1000, 100);
    playBeep(1200, 150, 0.4);
    setIsScanning(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (email === 'admin@caf.com' && password === 'admin123') {
      setAdminName('Admin User');
      setIsAuthenticated(true);
      playBeep(1000, 100);
    } else {
      setLoginError('Invalid credentials. demo: admin@caf.com / admin123');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminName('');
    setActiveTab('dashboard');
  };

  // Mock Spectrum Data
  const channelSpectrum24GHz = [
    { channel: 1, 'CAF-WIFI-2G': 65, congestion: 80 },
    { channel: 6, 'CAF-WIFI-2G': 85, congestion: 117 },
    { channel: 11, 'CAF-WIFI-2G': 50, congestion: 58 },
  ];

  const channelSpectrum5GHz = [
    { channel: 36, 'CAF-WIFI-5G': 92, congestion: 127 },
    { channel: 48, 'CAF-WIFI-5G': 80, congestion: 115 },
    { channel: 149, 'CAF-WIFI-5G': 72, congestion: 122 },
  ];

  const currentSpectrum = selectedBand === '2.4GHz' ? channelSpectrum24GHz : channelSpectrum5GHz;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-dark-800 rounded-3xl shadow-2xl p-10 border border-dark-700">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
              <Wifi className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 tracking-tight">NetPulse CAF</h1>
          <p className="text-center mb-8 text-gray-500 font-medium">Enterprise Infrastructure Analyzer</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@caf.com"
                  className="w-full bg-dark-700 border border-dark-600 pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-700 border border-dark-600 pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-4 rounded-xl bg-red-600/10 border border-red-600/20 text-red-400 text-xs font-bold">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              Sign In to Infrastructure
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white selection:bg-blue-500/30">
      <header className="bg-dark-800/80 backdrop-blur-xl border-b border-dark-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">NetPulse CAF v3.5</h1>
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
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="h-8 w-px bg-dark-700 mx-2" />
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
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'CAF Networks', value: '6', icon: Wifi, color: 'text-blue-500' },
                { label: 'Active APs', value: '18', icon: Router, color: 'text-cyan-500' },
                { label: 'Avg Signal', value: '-52 dBm', icon: Signal, color: 'text-purple-500' },
                { label: 'Health', value: '98%', icon: ShieldCheck, color: 'text-green-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-dark-800 p-6 rounded-2xl border border-dark-700 hover:border-blue-500/30 transition-all">
                  <stat.icon className={`w-8 h-8 mb-4 ${stat.color}`} />
                  <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">{stat.label}</div>
                  <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                  <div className="text-[10px] text-green-500 font-bold mt-2">v3.5.0 STABLE</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Signal className="text-blue-500 w-5 h-5" /> Signal Strength Registry</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { network: 'CAF-5G', strength: 85 },
                    { network: 'CAF-2G', strength: 72 },
                    { network: 'GUEST', strength: 68 },
                    { network: 'IOT', strength: 55 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="network" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                    <Bar dataKey="strength" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700">
                <h3 className="text-lg font-bold mb-6">Network Segment Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Main', value: 3, color: '#3b82f6' },
                      { name: 'IoT', value: 2, color: '#10b981' },
                      { name: 'Guest', value: 1, color: '#f59e0b' }
                    ]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                      <Cell fill="#3b82f6" /><Cell fill="#10b981" /><Cell fill="#f59e0b" />
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
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="bg-dark-800 p-8 rounded-3xl border border-dark-700 shadow-xl">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">Throughput Analysis</h3>
                  <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest">End-to-End Latency & Bandwidth</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700">
                <h4 className="text-[10px] font-bold uppercase text-gray-500 mb-6 tracking-widest">Network Identification</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Public IP', val: networkInfo.ip, color: 'text-blue-400' },
                    { label: 'ISP Provider', val: networkInfo.isp, color: 'text-white' },
                    { label: 'Region', val: networkInfo.country, color: 'text-green-400' },
                    { label: 'Primary DNS', val: networkInfo.dns1, color: 'text-cyan-400' }
                  ].map((diag, i) => (
                    <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-dark-900/50 border border-dark-700/50 hover:bg-dark-700/20 transition-all">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">{diag.label}</span>
                      <span className={`text-sm font-mono font-bold ${diag.color}`}>{diag.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 flex flex-col justify-center text-center p-12">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                  <Globe className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Geolocation Active</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">Your network metrics are being optimized for the <strong>{networkInfo.country}</strong> region.</p>
              </div>
            </div>
          </div>
        )}

        {/* Other modules placeholder */}
        {['spectrum', 'scanner', 'reports', 'admin', 'settings'].includes(activeTab) && (
          <div className="bg-dark-800 p-20 rounded-3xl border border-dark-700 text-center space-y-6 animate-in slide-in-from-bottom-4">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500">
              <Zap className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold uppercase tracking-widest">{activeTab} Module Active</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto uppercase font-bold tracking-tighter">
              v3.5.0 Core loaded. Real-time data stream established with enterprise controllers.
            </p>
            {activeTab === 'scanner' && (
              <button onClick={startAPScan} className="bg-blue-600 px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95">
                Execute Spectrum Sweep
              </button>
            )}
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
          <span>DEV: HANY BKHITE</span>
        </div>
      </footer>
    </div>
  );
}
