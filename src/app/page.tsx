'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Wifi, Sun, Moon, Settings, BarChart3, Network, TrendingUp, 
  Activity, Zap, Volume2, VolumeX, LogOut, Mail, Lock, 
  Globe, Gauge, Loader2, Eye, EyeOff, Signal, Router, 
  ShieldCheck, Crosshair, MapPin, Play, X, FileText, Smartphone, Monitor, 
  Layers, AlertTriangle, UserPlus, CheckCircle2, Clock, MoreVertical, 
  Trash2, Filter, Sparkles, ChevronRight, Download, Search, BadgeAlert, User
} from 'lucide-react';
import { reportIssueRecommendations, type ReportIssueRecommendationsOutput } from "@/ai/flows/report-issue-recommendations";
import { aiNetworkOptimizer, type AiNetworkOptimizerOutput } from "@/ai/flows/ai-network-optimizer";

// --- Mock Data ---
const MOCK_NETWORKS = [
  { id: '1', ssid: 'CAF-WIFI-5G', signalStrength: -45, channel: 36, clientsConnected: 15, frequencyBand: '5GHz', encryption: 'WPA3', vendor: 'ARUBA', macAddress: '00:0B:86:12:34:56', bandwidthMbps: 850, interferenceScore: 1 },
  { id: '2', ssid: 'CAF-WIFI-2G', signalStrength: -58, channel: 6, clientsConnected: 22, frequencyBand: '2.4GHz', encryption: 'WPA3', vendor: 'ARUBA', macAddress: '00:0B:86:78:90:AB', bandwidthMbps: 150, interferenceScore: 4 },
  { id: '3', ssid: 'CAF-GUEST', signalStrength: -65, channel: 52, clientsConnected: 8, frequencyBand: '5GHz', encryption: 'WPA2', vendor: 'ARUBA', macAddress: '00:0B:86:CD:EF:01', bandwidthMbps: 300, interferenceScore: 2 },
  { id: '4', ssid: 'CAF-IoT', signalStrength: -70, channel: 1, clientsConnected: 32, frequencyBand: '2.4GHz', encryption: 'WPA2', vendor: 'HUAWEI', macAddress: '7c:1c:f1:25:19:2c', bandwidthMbps: 50, interferenceScore: 8 },
  { id: '5', ssid: 'CAF-ADMIN', signalStrength: -50, channel: 128, clientsConnected: 5, frequencyBand: '5GHz', encryption: 'WPA3-Enterprise', vendor: 'TP-LINK', macAddress: '98:da:c4:26:21:87', bandwidthMbps: 900, interferenceScore: 1 },
  { id: '6', ssid: 'CAF-BACKUP', signalStrength: -72, channel: 11, clientsConnected: 3, frequencyBand: '2.4GHz', encryption: 'WPA3', vendor: 'GENERIC', macAddress: '9e:da:c4:26:21:87', bandwidthMbps: 100, interferenceScore: 5 }
];

const TEAM_MEMBERS = [
  { id: '1', name: 'Hany Bkhite', role: 'Senior Tech', scans: 245, status: 'Active', performance: 98 },
  { id: '2', name: 'Maria Garcia', scans: 89, status: 'Active', role: 'Network Admin', performance: 92 },
  { id: '3', name: 'Sam Wilson', scans: 212, status: 'On Leave', role: 'Support Specialist', performance: 85 },
  { id: '4', name: 'Jordan Lee', scans: 56, status: 'Active', role: 'Junior Tech', performance: 78 },
];

const REPORTS_LIST = [
  { id: 'REP-001', location: 'Main Campus - Wing A', date: '2024-05-15', networks: 12, cafAps: 5, avgSignal: -52 },
  { id: 'REP-002', location: 'Basement Storage', date: '2024-05-18', networks: 8, cafAps: 2, avgSignal: -68 },
  { id: 'REP-003', location: 'Executive Suite', date: '2024-05-20', networks: 15, cafAps: 8, avgSignal: -45 },
];

export default function CAFWiFiAnalyzer() {
  const [isMounted, setIsMounted] = useState(false);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('admin@caf.com');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');

  // App State
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isScanning, setIsScanning] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Report Specific State
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);
  const [recs, setRecs] = useState<ReportIssueRecommendationsOutput | null>(null);

  // Scanner/AI State
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiResult, setAiResult] = useState<AiNetworkOptimizerOutput | null>(null);

  // Tracking / Locator State
  const [trackingNetwork, setTrackingNetwork] = useState<any>(null);
  const [currentSignal, setCurrentSignal] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Speed Test State
  const [speedTest, setSpeedTest] = useState({
    download: 0, upload: 0, ping: 0, testing: false
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'spectrum', label: 'Spectrum', icon: Layers },
    { id: 'scanner', label: 'Scanner', icon: Network },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'admin', label: 'Admin', icon: Settings },
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- Derived Chart Data ---
  const signalData = useMemo(() => MOCK_NETWORKS.map(n => ({
    network: n.ssid,
    strength: Math.abs(n.signalStrength)
  })), []);

  const performanceData = useMemo(() => MOCK_NETWORKS.map(n => ({
    name: n.ssid,
    signal: Math.abs(n.signalStrength),
    bandwidth: n.bandwidthMbps,
    interference: n.interferenceScore * 10,
  })), []);

  const typeData = [
    { name: 'Main', value: 2, color: '#3b82f6' },
    { name: 'Guest', value: 1, color: '#10b981' },
    { name: 'IoT', value: 1, color: '#f59e0b' }
  ];

  const COLORS = ['#3b82f6', '#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];

  // --- Functions ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@caf.com' && password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      setLoginError('Invalid credentials. Use demo: admin@caf.com / admin123');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  const performSpeedTest = async () => {
    setSpeedTest(prev => ({ ...prev, testing: true }));
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSpeedTest({
      download: Math.round(Math.random() * 300 + 200),
      upload: Math.round(Math.random() * 100 + 50),
      ping: Math.round((Math.random() * 15 + 5) * 10) / 10,
      testing: false
    });
  };

  const startSiteSurvey = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2500);
  };

  const handleAiOptimize = async () => {
    setIsOptimizing(true);
    try {
      const result = await aiNetworkOptimizer({ 
        networkScans: MOCK_NETWORKS.map(n => ({
          ssid: n.ssid,
          signalStrength: n.signalStrength,
          channel: n.channel,
          clientsConnected: n.clientsConnected,
          networkType: n.frequencyBand === '5GHz' ? 'Main' : 'IoT',
          frequencyBand: n.frequencyBand,
          interferenceScore: n.interferenceScore,
          location: "Current"
        }))
      });
      setAiResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateRecs = async (report: any) => {
    setIsGeneratingRecs(true);
    setSelectedReport(report);
    try {
      const result = await reportIssueRecommendations({
        location: report.location,
        networksFound: report.networks,
        cafAps: report.cafAps,
        avgSignal: report.avgSignal,
        identifiedIssues: ["Potential channel overlap in 2.4GHz spectrum"],
        scanDetails: MOCK_NETWORKS.map(n => ({
          ssid: n.ssid,
          networkType: 'Main',
          signalStrength: n.signalStrength,
          wifiChannel: n.channel,
          connectedClients: n.clientsConnected
        }))
      });
      setRecs(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingRecs(false);
    }
  };

  if (!isMounted) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-[#1e293b] rounded-2xl shadow-2xl p-8 border border-slate-700">
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
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            {loginError && <div className="text-red-400 text-xs text-center">{loginError}</div>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20">
              Sign In to Infrastructure
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Wifi className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">NetPulse CAF</h1>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                SYSTEM: STABLE@PROD
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAudioEnabled(!audioEnabled)} className={`p-2 rounded-lg ${audioEnabled ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button onClick={handleLogout} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 border border-slate-700">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
        <nav className="border-t border-slate-800 bg-slate-900 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-6 flex gap-6">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedReport(null); }}
                className={`py-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === tab.id ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-white'
                }`}>
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 animate-in fade-in duration-500">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'CAF Networks', value: '6', icon: Wifi, color: 'text-blue-500' },
                { label: 'Active APs', value: '18', icon: Router, color: 'text-cyan-500' },
                { label: 'Avg Signal', value: '-52 dBm', icon: Signal, color: 'text-purple-500' },
                { label: 'Network Health', value: '98%', icon: ShieldCheck, color: 'text-green-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 group hover:border-slate-700 transition-all">
                  <div className={`p-3 rounded-xl bg-slate-800 ${stat.color} w-fit mb-4`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase mb-1">{stat.label}</div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-bold mb-6 uppercase text-gray-400">Signal Strength Analysis</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={signalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="network" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="strength" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-bold mb-6 uppercase text-gray-400">Network Segment Distribution</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                        {typeData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Spectrum Tab (Gaussian Humps) */}
        {activeTab === 'spectrum' && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-500" /> Gaussian Spectrum Modeling
              </h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.from({length: 100}, (_, i) => ({
                    x: i,
                    ap1: 80 * Math.exp(-Math.pow(i - 30, 2) / 200),
                    ap2: 60 * Math.exp(-Math.pow(i - 60, 2) / 150),
                    ap3: 40 * Math.exp(-Math.pow(i - 80, 2) / 100)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="x" hide />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none' }} />
                    <Area type="monotone" dataKey="ap1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="ap2" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="ap3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Scanner Tab */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Crosshair className="text-blue-500" /> Professional Site Survey
              </h3>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input type="text" value={locationName} onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. B-Wing Server Room" className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 outline-none focus:border-blue-500" />
                </div>
                <button onClick={startSiteSurvey} disabled={isScanning} className="bg-blue-600 hover:bg-blue-700 px-8 rounded-xl font-bold flex items-center gap-2">
                  {isScanning ? <Loader2 className="animate-spin" /> : <Play />} Start Scan
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">SSID / HW</th>
                    <th className="px-6 py-4">Signal</th>
                    <th className="px-6 py-4">Spectrum</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {MOCK_NETWORKS.map((net) => (
                    <tr key={net.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{net.ssid} <br/><span className="text-[10px] text-slate-500">{net.macAddress}</span></td>
                      <td className={`px-6 py-4 font-bold ${net.signalStrength > -60 ? 'text-green-500' : 'text-yellow-500'}`}>{net.signalStrength} dBm</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">CH {net.channel} | {net.frequencyBand}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-blue-500 hover:text-white px-3 py-1.5 rounded-lg border border-blue-500/20 text-xs font-bold uppercase">Locate AP</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-indigo-900/10 border border-indigo-500/20 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-400" /> AI Network Optimizer</h3>
                <button onClick={handleAiOptimize} disabled={isOptimizing} className="text-xs bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-bold">
                  {isOptimizing ? 'Analyzing...' : 'Run Analysis'}
                </button>
              </div>
              {aiResult && (
                <div className="text-sm space-y-2 animate-in slide-in-from-top-2">
                  <p className="text-indigo-200">{aiResult.summary}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {aiResult.recommendations.map((rec, i) => (
                      <div key={i} className="bg-slate-900/50 p-3 rounded-lg border border-indigo-500/10">
                        <div className="font-bold text-xs text-indigo-400 mb-1">[{rec.priority}] {rec.category}</div>
                        <div className="text-xs text-slate-400">{rec.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab (Speed Gauges) */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
              <div className="flex justify-between items-center mb-12">
                <h3 className="text-2xl font-bold">Throughput Analysis</h3>
                <button onClick={performSpeedTest} disabled={speedTest.testing} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                  {speedTest.testing ? <Loader2 className="animate-spin" /> : <Play />} Start Test
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                  { label: 'Download', val: speedTest.download, unit: 'Mbps', color: '#3b82f6', max: 500 },
                  { label: 'Upload', val: speedTest.upload, unit: 'Mbps', color: '#10b981', max: 200 },
                  { label: 'Ping', val: speedTest.ping, unit: 'ms', color: '#f59e0b', max: 100 }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke={item.color} strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={`${(item.val / item.max) * 282.7} 282.7`} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-2xl font-black">{item.val}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">{item.unit}</div>
                      </div>
                    </div>
                    <div className="mt-4 font-bold text-slate-400 uppercase text-xs">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {!selectedReport ? (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-lg">Audit Reports Registry</h3>
                  <div className="flex gap-2">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs outline-none" /></div>
                    <button className="p-2 bg-slate-800 rounded-lg"><Filter className="w-4 h-4" /></button>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-6 py-4 text-left">Location</th>
                      <th className="px-6 py-4 text-left">Date</th>
                      <th className="px-6 py-4 text-left">Networks</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {REPORTS_LIST.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4 font-bold">{report.location}</td>
                        <td className="px-6 py-4 text-slate-400">{report.date}</td>
                        <td className="px-6 py-4">{report.networks} Detected</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleGenerateRecs(report)} className="text-blue-500 hover:underline font-bold text-xs uppercase flex items-center gap-1 ml-auto">
                            <Eye className="w-3 h-3" /> View Analysis
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <button onClick={() => setSelectedReport(null)} className="text-xs flex items-center gap-1 text-slate-400 hover:text-white">
                  <ChevronRight className="w-4 h-4 rotate-180" /> Back to Registry
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
                      <h2 className="text-2xl font-bold mb-2">{selectedReport.location}</h2>
                      <p className="text-slate-500 text-sm mb-8">Generated Registry Audit: {selectedReport.date}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Total Networks', val: selectedReport.networks, icon: Wifi },
                          { label: 'CAF APs', val: selectedReport.cafAps, icon: Router },
                          { label: 'Avg Signal', val: selectedReport.avgSignal + ' dBm', icon: Signal },
                          { label: 'Status', val: 'PASS', icon: ShieldCheck, color: 'text-green-500' }
                        ].map((s, i) => (
                          <div key={i} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                            <s.icon className="w-4 h-4 text-slate-500 mb-2" />
                            <div className="text-[10px] uppercase font-bold text-slate-500">{s.label}</div>
                            <div className={`text-lg font-bold ${s.color || ''}`}>{s.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-indigo-900/20 border border-indigo-500/30 p-8 rounded-2xl shadow-2xl">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" /> AI Report Insights
                    </h3>
                    {isGeneratingRecs ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <p className="text-xs font-bold">Analyzing scan data architecture...</p>
                      </div>
                    ) : recs && (
                      <div className="space-y-6 text-sm">
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-indigo-500/10">
                          <div className="text-[10px] uppercase font-bold text-indigo-400 mb-2">Summary</div>
                          <p className="text-slate-300 leading-relaxed">{recs.issueSummary}</p>
                        </div>
                        <div className="space-y-3">
                          <div className="text-[10px] uppercase font-bold text-indigo-400">Recommendations</div>
                          {recs.recommendations.map((r, i) => (
                            <div key={i} className="flex gap-3 text-xs text-slate-400">
                              <div className="w-4 h-4 shrink-0 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[8px] font-bold">{i+1}</div>
                              {r}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Organization & Security</h2>
                <p className="text-slate-500 text-sm">Monitor system integrity and technician field metrics</p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Add Technician
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Security Events', val: '0', icon: BadgeAlert, color: 'text-green-500', sub: 'Last 24 hours' },
                { label: 'System Uptime', val: '99.98%', icon: Clock, color: 'text-blue-500', sub: 'High Availability' },
                { label: 'Field Reliability', val: '94.2%', icon: ShieldCheck, color: 'text-indigo-500', sub: 'Signal Compliance' }
              ].map((s, i) => (
                <div key={i} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
                  <div className={`p-3 rounded-xl bg-slate-800 ${s.color} w-fit mb-4`}><s.icon className="w-5 h-5" /></div>
                  <div className="text-xs font-bold text-slate-500 uppercase">{s.label}</div>
                  <div className="text-2xl font-bold my-1">{s.val}</div>
                  <div className="text-[10px] text-slate-600 font-bold">{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800 font-bold uppercase tracking-widest text-xs text-slate-500">Technician Performance Registry</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800/30 text-[10px] font-bold uppercase text-slate-500">
                    <th className="px-6 py-4 text-left">Technician</th>
                    <th className="px-6 py-4 text-left">Role</th>
                    <th className="px-6 py-4 text-left">Lifetime Scans</th>
                    <th className="px-6 py-4 text-left">Performance</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {TEAM_MEMBERS.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center"><User className="w-4 h-4 text-slate-500" /></div>
                          <span className="font-bold">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{member.role}</span></td>
                      <td className="px-6 py-4 font-mono font-bold text-blue-500">{member.scans}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${member.performance}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{member.performance}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-500 hover:text-white"><MoreVertical className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-slate-900">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div>
            <div className="text-sm font-bold">Hany Bkhite</div>
            <div className="text-xs">Senior Infrastructure Developer</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-tighter">NetPulse CAF Operations</div>
            <div className="text-[9px] font-mono mt-1">v3.6.0-ENTERPRISE-PROD | FIPS-140-2 COMPLIANT</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
