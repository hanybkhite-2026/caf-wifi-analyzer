'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart 
} from 'recharts';
import { 
  Wifi, Sun, Moon, Settings, BarChart3, Network, TrendingUp, 
  Activity, Zap, Volume2, VolumeX, LogOut, Mail, Lock, 
  Globe, Gauge, ShieldCheck, Search, Filter, Info, ChevronRight, Play, Loader2, Crosshair, X
} from 'lucide-react';

export default function CAFWiFiAnalyzer() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // App State
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBand, setSelectedBand] = useState<'2.4GHz' | '5GHz'>('5GHz');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

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

  const speedData = [
    { time: '10:00', download: 450, upload: 180 },
    { time: '12:00', download: 480, upload: 200 },
    { time: '14:00', download: 420, upload: 160 },
    { time: '16:00', download: 510, upload: 220 },
    { time: '18:00', download: 490, upload: 190 },
    { time: '20:00', download: 520, upload: 210 }
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

  const channelSpectrum24GHz = [
    { channel: 1, frequency: 2412, 'CAF-WIFI-2G': 65, 'CAF-IoT': 15, congestion: 80 },
    { channel: 6, frequency: 2437, 'CAF-WIFI-2G': 85, 'CAF-IoT': 32, congestion: 117 },
    { channel: 11, frequency: 2462, 'CAF-WIFI-2G': 50, 'CAF-IoT': 8, congestion: 58 },
  ];

  const channelSpectrum5GHz = [
    { channel: 36, frequency: 5180, 'CAF-WIFI-5G': 92, 'CAF-GUEST': 35, congestion: 127 },
    { channel: 48, frequency: 5240, 'CAF-WIFI-5G': 80, 'CAF-GUEST': 35, congestion: 115 },
    { channel: 60, frequency: 5300, 'CAF-WIFI-5G': 72, 'CAF-ADMIN': 50, congestion: 122 },
  ];

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
      setAdminName(email.split('@')[0]);
      setIsAuthenticated(true);
      playBeep(1200, 200);
    }
  };

  const currentSpectrum = selectedBand === '2.4GHz' ? channelSpectrum24GHz : channelSpectrum5GHz;

  const CircularSpeedTest = ({ download, upload, ping }: { download: number; upload: number; ping: number }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { label: 'Download', value: download, unit: 'Mbps', color: '#3b82f6', icon: Gauge },
        { label: 'Upload', value: upload, unit: 'Mbps', color: '#10b981', icon: Gauge },
        { label: 'Ping', value: ping, unit: 'ms', color: '#f59e0b', icon: Activity },
      ].map((item, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="8" />
              <circle 
                cx="50" cy="50" r="45" fill="none" stroke={item.color} strokeWidth="8"
                strokeDasharray={`${(item.value / (i === 2 ? 50 : 1000)) * 282.7} 282.7`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
              <div className="text-[10px] text-gray-400 uppercase">{item.unit}</div>
            </div>
          </div>
          <span className="font-bold text-sm">{item.label}</span>
        </div>
      ))}
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="card w-full max-w-md shadow-2xl border-none">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
              <Wifi className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 font-headline">NetPulse CAF</h1>
          <p className="text-center text-gray-400 mb-8">Enterprise Infrastructure Analyzer</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@caf.com" className="input pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123" className="input pl-10"
                />
              </div>
            </div>
            {loginError && <p className="text-red-500 text-xs font-bold bg-red-500/10 p-2 rounded border border-red-500/20">{loginError}</p>}
            <button type="submit" className="w-full btn-primary h-11">
              {authMode === 'login' ? 'Access Infrastructure' : 'Create Admin Account'}
            </button>
          </form>
          <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full text-xs text-gray-500 mt-6 hover:text-white transition-colors">
            {authMode === 'login' ? "Need admin credentials? Request Access" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white font-body selection:bg-blue-500/30">
      <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-headline tracking-tight">NetPulse CAF v3</h1>
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-green-500">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                System Operational
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAudioEnabled(!audioEnabled)} className="p-2.5 rounded-xl hover:bg-dark-700 transition-colors">
              {audioEnabled ? <Volume2 className="w-5 h-5 text-green-500" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl hover:bg-dark-700 transition-colors">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="h-8 w-px bg-dark-700 mx-2" />
            <button onClick={() => setIsAuthenticated(false)} className="btn-secondary h-10 px-4 gap-2 text-xs font-bold uppercase tracking-wider">
              <LogOut className="w-4 h-4" /> Exit
            </button>
          </div>
        </div>
        <nav className="border-t border-dark-700 bg-dark-900/50 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-6 flex gap-6">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'spectrum', label: 'Spectrum', icon: TrendingUp },
              { id: 'scanner', label: 'Scanner', icon: Network },
              { id: 'analytics', label: 'Analytics', icon: Activity },
              { id: 'reports', label: 'Reports', icon: FileUp },
              { id: 'admin', label: 'Admin', icon: Settings },
              { id: 'settings', label: 'Settings', icon: Zap }
            ].map(tab => (
              <button
                key={tab.id} onClick={() => setActiveTab(tab.id)}
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
                { label: 'CAF Networks', value: '6', icon: Radio, color: 'text-blue-500' },
                { label: 'Active APs', value: '18', icon: Signal, color: 'text-cyan-500' },
                { label: 'Avg Signal', value: '-52 dBm', icon: Activity, color: 'text-purple-500' },
                { label: 'Health', value: '98%', icon: ShieldCheck, color: 'text-green-500' }
              ].map((stat, i) => (
                <div key={i} className="card group hover:border-blue-500/30 transition-all">
                  <stat.icon className={`w-8 h-8 mb-4 ${stat.color}`} />
                  <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">{stat.label}</div>
                  <div className="text-3xl font-bold font-headline">{stat.value}</div>
                  <div className="text-[10px] text-green-500 font-bold mt-2">+2.5% INCREMENT</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-bold font-headline mb-6 flex items-center gap-2">
                  <Signal className="w-5 h-5 text-blue-500" /> Signal Registry
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={signalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="network" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} />
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
                  <h3 className="text-xl font-bold font-headline">Spectral Analysis</h3>
                  <p className="text-xs text-gray-500">Real-time channel congestion metrics</p>
                </div>
                <div className="flex bg-dark-900 p-1 rounded-xl">
                  {['2.4GHz', '5GHz'].map(band => (
                    <button
                      key={band} onClick={() => setSelectedBand(band as any)}
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
                  <XAxis dataKey="channel" label={{ value: 'CHANNEL', position: 'bottom', offset: 0, fontSize: 10, fill: '#64748b' }} tick={{ fill: '#64748b', fontSize: 11 }} />
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
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Target Environment
                  </label>
                  <input type="text" placeholder="e.g. Floor 1, Conference Wing" className="input" />
                </div>
                <button 
                  onClick={() => { setIsScanning(true); setTimeout(() => setIsScanning(false), 2000); playBeep(800, 200); }} 
                  className="btn-primary h-11 px-8 gap-2 shadow-lg shadow-blue-500/20"
                >
                  {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {isScanning ? 'Executing Site Survey...' : 'Initialize Survey'}
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
                  {discoveredNetworks.map(net => (
                    <tr key={net.id} className="hover:bg-blue-500/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold">{net.ssid}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{net.vendor} | {net.macAddress}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-bold flex items-center gap-2 ${net.signal >= -60 ? 'text-green-500' : 'text-yellow-500'}`}>
                          <Signal className="w-4 h-4" /> {net.signal} dBm
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">CH {net.channel} | {net.band}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => playBeep(600 + (Math.abs(net.signal) * 5), 150)} className="text-blue-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-blue-500">
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
              <h3 className="text-xl font-bold font-headline mb-10 text-center">Infrastructure Throughput Registry</h3>
              <CircularSpeedTest download={520} upload={210} ping={8} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h4 className="text-xs font-bold uppercase text-gray-500 mb-4 flex items-center gap-2">
                  <Globe className="w-3 h-3" /> End-to-End Diagnostics
                </h4>
                <div className="space-y-3">
                  {[
                    { label: 'External IP', val: '192.168.1.105', color: 'text-blue-400' },
                    { label: 'ISP Provider', val: 'Zain - Jordan', color: 'text-foreground' },
                    { label: 'Primary DNS', val: '8.8.8.8', color: 'text-green-400' }
                  ].map((diag, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-dark-900 border border-dark-700">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">{diag.label}</span>
                      <span className={`text-sm font-mono font-bold ${diag.color}`}>{diag.val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h4 className="text-xs font-bold uppercase text-gray-500 mb-4">Throughput Trend</h4>
                <ResponsiveContainer width="100%" height={160}>
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

        {/* Other tabs follow similar enterprise styling */}
        {['reports', 'admin', 'settings'].includes(activeTab) && (
          <div className="card p-20 text-center space-y-4 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold font-headline uppercase tracking-widest">{activeTab} MODULE</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto uppercase font-bold tracking-tighter">
              Enterprise analysis operational. Module data loaded from production registry.
            </p>
          </div>
        )}
      </main>

      <footer className="h-10 border-t border-dark-700 bg-dark-800 flex items-center justify-between px-6 text-[10px] font-mono tracking-widest uppercase text-gray-500">
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

function Radio(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>
    </svg>
  );
}

function FileUp(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 12v6"/><path d="m15 15-3-3-3 3"/>
    </svg>
  );
}
