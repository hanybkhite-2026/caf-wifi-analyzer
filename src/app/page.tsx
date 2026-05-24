'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart 
} from 'recharts';
import { 
  Wifi, Sun, Moon, Settings, BarChart3, Network, TrendingUp, Activity, 
  Zap, Volume2, VolumeX, LogOut, Mail, Lock, Globe, Gauge, Loader2, 
  Eye, EyeOff, Signal, FileText, CheckCircle2, Clock, Trash2, 
  UserPlus, MoreVertical, Crosshair, MapPin, Play, X, Info, 
  Router, ShieldCheck, AlertCircle, RefreshCw, ChevronRight
} from 'lucide-react';

// Custom Radio icon fallback
function RadioIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>
    </svg>
  );
}

export default function CAFWiFiAnalyzer() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
    loading: true
  });

  // Speed Test State
  const [speedTest, setSpeedTest] = useState({
    download: 520,
    upload: 210,
    ping: 8,
    timestamp: '',
    testing: false
  });

  // App State
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBand, setSelectedBand] = useState('2.4GHz');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Define tabs configuration inside component to avoid closure issues
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'spectrum', label: 'Spectrum', icon: TrendingUp },
    { id: 'scanner', label: 'Scanner', icon: Network },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'admin', label: 'Admin', icon: Settings },
    { id: 'settings', label: 'Settings', icon: Zap }
  ];

  // Hydration Safety: Set values that differ between server/client in useEffect
  useEffect(() => {
    setSpeedTest(prev => ({ ...prev, timestamp: new Date().toLocaleString() }));
  }, []);

  // Fetch Network Info
  useEffect(() => {
    if (isAuthenticated) {
      const fetchIP = async () => {
        try {
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();
          setNetworkInfo({
            ip: data.ip || '192.168.1.100',
            isp: data.org || 'ISP Provider',
            country: data.country_name || 'Global',
            dns1: '8.8.8.8',
            dns2: '1.1.1.1',
            loading: false
          });
        } catch (err) {
          setNetworkInfo(prev => ({ ...prev, ip: '192.168.1.105', isp: 'Local Mesh', loading: false }));
        }
      };
      fetchIP();
    }
  }, [isAuthenticated]);

  // Audio Logic
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playBeep = (freq = 800, dur = 100, vol = 0.2) => {
    if (!audioEnabled) return;
    try {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur / 1000);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur / 1000);
    } catch (e) {}
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (email === 'admin@caf.com' && password === 'admin123') {
      setAdminName('Admin');
      setIsAuthenticated(true);
      playBeep(1000, 100);
    } else {
      setLoginError('Invalid credentials. Use: admin@caf.com / admin123');
      playBeep(400, 200, 0.5);
    }
  };

  // Mock Data
  const signalData = [
    { network: 'CAF-WIFI-5G', strength: 85 },
    { network: 'CAF-WIFI-2G', strength: 72 },
    { network: 'CAF-GUEST', strength: 68 },
    { network: 'CAF-IoT', strength: 55 },
    { network: 'CAF-ADMIN', strength: 92 },
  ];

  const radarData = [
    { metric: 'Coverage', value: 85 },
    { metric: 'Speed', value: 92 },
    { metric: 'Security', value: 88 },
    { metric: 'Stability', value: 90 },
    { metric: 'Reliability', value: 86 }
  ];

  const currentSpectrum = useMemo(() => {
    const is2G = selectedBand === '2.4GHz';
    return Array.from({ length: is2G ? 13 : 16 }, (_, i) => {
      const channel = is2G ? i + 1 : 36 + (i * 4);
      return {
        channel,
        'Main': Math.max(0, 80 - Math.abs(channel - (is2G ? 6 : 44)) * 10),
        'Guest': Math.max(0, 60 - Math.abs(channel - (is2G ? 1 : 149)) * 8),
        congestion: Math.floor(Math.random() * 40) + 20
      };
    });
  }, [selectedBand]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1e293b] rounded-3xl shadow-2xl p-8 border border-white/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Wifi className="w-32 h-32 text-blue-500" />
          </div>
          
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Wifi className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-center mb-2 text-white font-headline">NetPulse CAF</h1>
          <p className="text-center text-slate-400 mb-8 text-sm">Enterprise Infrastructure Analysis v3.6.0</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Terminal ID (Email)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Security Key (Password)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {loginError}
              </div>
            )}

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono leading-relaxed">
              ACCESS PROTOCOL: Use admin@caf.com / admin123 for authorized terminal bypass.
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 mt-4 active:scale-[0.98]"
            >
              INITIALIZE CONNECTION
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-300 pb-20`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-[#1e293b]/80 border-slate-800' : 'bg-white/80 border-slate-200'} border-b sticky top-0 z-50 backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-headline tracking-tight">NetPulse CAF</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Terminal Operational</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setAudioEnabled(!audioEnabled)} className="p-2 rounded-xl hover:bg-slate-500/10 transition-all">
              {audioEnabled ? <Volume2 className="w-5 h-5 text-green-500" /> : <VolumeX className="w-5 h-5 text-red-500" />}
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl hover:bg-slate-500/10 transition-all">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-400" />}
            </button>
            <div className="h-8 w-[1px] bg-slate-700 mx-2" />
            <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all text-xs font-bold uppercase tracking-wider">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="border-t border-slate-800/50 bg-slate-900/10 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-6 flex">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'border-blue-500 text-blue-500 bg-blue-500/5' 
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'CAF Networks', value: '6', change: '+2.5%', icon: RadioIcon, color: 'text-blue-500' },
                { label: 'Active APs', value: '18', change: 'Stable', icon: Router, color: 'text-cyan-500' },
                { label: 'Avg Signal', value: '-52 dBm', change: '+1.2%', icon: Signal, color: 'text-purple-500' },
                { label: 'Health', value: '98%', change: 'Normal', icon: ShieldCheck, color: 'text-green-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-slate-800/40 p-6 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                  <div className={`absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform ${stat.color}`}>
                    <stat.icon className="w-12 h-12" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{stat.label}</div>
                  <div className="text-3xl font-black font-headline mb-2">{stat.value}</div>
                  <div className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {stat.change}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-800/30 p-8 rounded-3xl border border-white/5 shadow-xl">
                <h3 className="text-lg font-bold font-headline mb-8 flex items-center gap-2">
                  <Signal className="w-5 h-5 text-blue-500" /> SSID Spectrum Strength
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={signalData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                      <XAxis dataKey="network" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="strength" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-800/30 p-8 rounded-3xl border border-white/5 shadow-xl">
                <h3 className="text-lg font-bold font-headline mb-8 text-center">Performance Signature</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <Radar name="Performance" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'spectrum' && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="bg-slate-800/30 p-8 rounded-3xl border border-white/5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                  <h3 className="text-2xl font-bold font-headline mb-2 flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-blue-500" /> Channel Spectral Graph
                  </h3>
                  <p className="text-slate-400 text-sm">Visualizing Gaussian signal overlap and congestion patterns.</p>
                </div>
                <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-700">
                  {['2.4GHz', '5GHz'].map(band => (
                    <button
                      key={band}
                      onClick={() => setSelectedBand(band)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedBand === band ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {band}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={currentSpectrum}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={true} horizontal={true} />
                    <XAxis dataKey="channel" label={{ value: 'WiFi Channels', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 10 }} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis label={{ value: 'Signal (dBm Equiv)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Area type="monotone" dataKey="Main" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                    <Area type="monotone" dataKey="Guest" fill="#10b981" stroke="#10b981" fillOpacity={0.2} strokeWidth={2} />
                    <Line type="step" dataKey="congestion" stroke="#ef4444" strokeWidth={1} dot={false} strokeDasharray="5 5" name="Interference" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Other modules fallback */}
        {['scanner', 'analytics', 'reports', 'admin', 'settings'].includes(activeTab) && (
          <div className="py-20 text-center animate-in fade-in duration-1000">
            <Activity className="w-12 h-12 text-slate-800 mx-auto mb-6 opacity-20" />
            <h2 className="text-2xl font-black font-headline text-slate-700 uppercase tracking-[0.3em]">{activeTab} MODULE</h2>
            <p className="text-slate-500 max-w-md mx-auto mt-4 text-sm leading-relaxed">Enterprise access initialized. Specialized tools for network forensic audit are being calibrated for this terminal session.</p>
            <div className="mt-10 flex justify-center gap-4">
              <button onClick={() => setActiveTab('dashboard')} className="px-8 py-3 bg-blue-600/10 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all">Return to Dashboard</button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} border-t fixed bottom-0 left-0 right-0 z-40 px-6 py-2`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] font-mono tracking-widest uppercase">
          <div className="flex gap-8">
            <span className="text-slate-500">BUILD: <span className="text-blue-500">v3.6.0-FIXED</span></span>
            <span className="hidden sm:inline text-slate-500">ENGINE: <span className="text-slate-400">NEXTJS-GENKIT</span></span>
          </div>
          <div className="flex gap-8">
            <span className="text-slate-500">REGION: <span className="text-slate-400">{networkInfo.country}</span></span>
            <span className="text-slate-500">COORD: <span className="text-green-500">SECURE</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
