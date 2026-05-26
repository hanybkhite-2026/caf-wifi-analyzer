'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Wifi, Radio, Signal, LayoutDashboard, LineChart as LineIcon, 
  FileUp, Users, Settings, Info, Menu, X, Moon, Sun, 
  Bell, ShieldCheck, Zap, Activity, AlertTriangle, Layers,
  Volume2, VolumeX, Crosshair, MapPin, Play, Download, Upload, Trash2, MoreVertical
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

// ── DATA ─────────────────────────────────────────────────────────────────────
const MOCK_APS = [
  { id: '1', ssid:'CAF-WIFI-5G', signal:-45, ch:36, freq:'5170-5250 80MHz', mac:'00:0B:86:12:34:56', vendor:'ARUBA NETWORKS', color:'#22c55e', bw: 850 },
  { id: '2', ssid:'CAF-WIFI-2G', signal:-67, ch:6,  freq:'2417-2447 20MHz', mac:'00:0B:86:78:90:AB', vendor:'ARUBA NETWORKS', color:'#f59e0b', bw: 300 },
  { id: '3', ssid:'CAF-GUEST',   signal:-79, ch:52, freq:'5735-5815 80MHz', mac:'00:0B:86:CD:EF:01', vendor:'ARUBA NETWORKS', color:'#ef4444', bw: 450 },
  { id: '4', ssid:'VTEL-Fiber',  signal:-85, ch:1,  freq:'2402-2422 20MHz', mac:'7c:1c:f1:25:19:2c', vendor:'HUAWEI TECHNOLOGIES', color:'#ef4444', bw: 120 },
  { id: '5', ssid:'Mamon2_5G',   signal:-86, ch:128,freq:'5170-5250 80MHz', mac:'98:da:c4:26:21:87', vendor:'TP-LINK', color:'#ef4444', bw: 680 },
  { id: '6', ssid:'*hidden*',    signal:-87, ch:6,  freq:'5170-5250 80MHz', mac:'9e:da:c4:26:21:87', vendor:'GENERIC', color:'#ef4444', bw: 200 },
];

const SPEED_HISTORY = [
  {t:'10:00',dl:420,ul:180},{t:'12:00',dl:460,ul:195},{t:'14:00',dl:480,ul:200},{t:'16:00',dl:470,ul:190},
  {t:'18:00',dl:500,ul:215},{t:'20:00',dl:455,ul:188},{t:'22:00',dl:450,ul:190},
];

const TEAM = [
  {id:1,name:'Alex Johnson',role:'Senior Tech',status:'Active',scans:145,perf:58,avatar:'AJ'},
  {id:2,name:'Maria Garcia',role:'Network Admin',status:'Active',scans:89,perf:38,avatar:'MG'},
  {id:3,name:'Sam Wilson',role:'Support Specialist',status:'On Leave',scans:212,perf:85,avatar:'SW'},
];

const REPORTS = [
  {id:'REP-001',loc:'Main Campus - Wing A',date:'2024-05-15',nets:12,signal:'-52 dBm',color:'text-green-500'},
  {id:'REP-002',loc:'Basement Storage',date:'2024-05-18',nets:8,signal:'-68 dBm',color:'text-yellow-500'},
  {id:'REP-003',loc:'Executive Suite',date:'2024-05-20',nets:15,signal:'-45 dBm',color:'text-green-500'},
];

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [tab, setTab] = useState('access-points');
  const [darkMode, setDark] = useState(true);
  const [auditEnv, setAuditEnv] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [members, setMembers] = useState(TEAM);
  
  // Speed Test State
  const [speedRunning, setSpeedRunning] = useState(false);
  const [speedProgress, setSpeedProgress] = useState(0);
  const [speedResult, setSpeedResult] = useState<any>(null);

  // Geiger Tracker State
  const [trackingNetwork, setTrackingNetwork] = useState<any | null>(null);
  const [currentSignal, setCurrentSignal] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Geiger Counter Audio Logic
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
        // Pitch increases with signal strength
        const freq = 400 + (Math.abs(currentSignal) < 40 ? 400 : 0) + (Math.abs(currentSignal + 90) * 2.5);
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
        // Delay decreases as signal increases (faster beeps)
        const delay = Math.max(60, (Math.abs(currentSignal) - 30) * 12);
        intervalRef.current = setInterval(() => {
          playBeep();
          setCurrentSignal(prev => {
            const fluctuation = (Math.random() - 0.5) * 5;
            return Math.min(-30, Math.max(-95, prev + fluctuation));
          });
        }, delay);
      };
      updateInterval();
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [trackingNetwork, currentSignal, isMuted]);

  const startScan = () => {
    if (!auditEnv) {
      toast({ title: "Error", description: "Enter location name.", variant: "destructive" });
      return;
    }
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      toast({ title: "Audit Complete", description: `Found ${MOCK_APS.length} infrastructure nodes.` });
    }, 2500);
  };

  const runSpeedTest = async () => {
    setSpeedRunning(true);
    setSpeedResult(null);
    setSpeedProgress(0);
    const interval = setInterval(() => setSpeedProgress(p => Math.min(95, p + 5)), 200);
    await new Promise(r => setTimeout(r, 3000));
    clearInterval(interval);
    setSpeedProgress(100);
    setSpeedResult({ dl: 452, ul: 215, ping: 11 });
    setSpeedRunning(false);
  };

  const removeMember = (id: number) => {
    setMembers(m => m.filter(x => x.id !== id));
    toast({ title: "Member Removed", description: "Technician credentials revoked." });
  };

  const chartData = useMemo(() => MOCK_APS.map(a => ({
    name: a.ssid,
    signal: Math.abs(a.signal),
    bw: a.bw,
    interference: Math.floor(Math.random() * 50) + 10
  })), []);

  const spectrumData = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    ch: i + 1,
    v: i === 0 ? 55 : i === 5 ? 75 : i === 10 ? 45 : Math.random() * 15
  })), []);

  const navItems = [
    { id: 'access-points', label: 'Access Points', icon: Radio },
    { id: 'channel-rating', label: 'Channel Rating', icon: Signal },
    { id: 'channel-graph', label: 'Channel Graph', icon: LayoutDashboard },
    { id: 'time-graph', label: 'Time Graph', icon: LineIcon },
    { id: 'export', label: 'Export', icon: FileUp },
    { id: 'vendors', label: 'Vendors', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: Info },
  ];

  if (!isMounted) return null;

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-[#0a0f1e] text-[#e2e8f0]' : 'bg-[#f1f5f9] text-[#0f172a]'}`}>
      {/* SIDEBAR */}
      <aside className={`w-20 lg:w-64 border-r ${darkMode ? 'bg-[#0d1526] border-[#1e2d45]' : 'bg-white border-[#e2e8f0]'} flex flex-col sticky top-0 h-screen`}>
        <div className="h-16 flex items-center px-6 border-b border-inherit">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Wifi className="text-white w-6 h-6" />
          </div>
          <span className="ml-3 font-bold text-lg hidden lg:block tracking-tight">NetPulse CAF</span>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setTrackingNetwork(null); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                tab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-500 hover:bg-slate-500/10'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="font-bold text-[11px] uppercase tracking-wider hidden lg:block">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 mt-auto">
          <button onClick={() => window.location.reload()} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-500/10 text-[11px] font-bold uppercase tracking-wider">
            <X className="w-5 h-5" />
            <span className="hidden lg:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className={`h-16 border-b ${darkMode ? 'bg-[#0d1526] border-[#1e2d45]' : 'bg-white border-[#e2e8f0]'} flex items-center justify-between px-6 sticky top-0 z-30`}>
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            {navItems.find(n => n.id === tab)?.label}
          </h1>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase border border-blue-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Aruba Analysis Mode
            </div>
            <button onClick={() => setDark(!darkMode)} className="p-2 rounded-full hover:bg-slate-500/10 transition-colors">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <div className="p-6 overflow-y-auto">
          {/* GEIGER TRACKER VIEW */}
          {trackingNetwork ? (
            <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
              <Card className={`${darkMode ? 'bg-[#111827] border-[#1e2d45]' : 'bg-white border-[#e2e8f0]'} shadow-2xl overflow-hidden`}>
                <CardHeader className="flex flex-row items-center justify-between pb-8">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <Crosshair className="w-8 h-8 text-blue-500 animate-pulse" />
                      Locating Hardware: {trackingNetwork.ssid}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs mt-1 uppercase">
                      {trackingNetwork.vendor} | HW: {trackingNetwork.macAddress}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setTrackingNetwork(null)} className="hover:text-red-500">
                    <X className="w-6 h-6" />
                  </Button>
                </CardHeader>
                <CardContent className="py-20 text-center space-y-12">
                  <div className="relative inline-block">
                    <div className="text-[120px] font-black tracking-tighter text-blue-500 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                      {Math.round(currentSignal)}
                      <span className="text-3xl ml-3 text-slate-500 font-bold">dBm</span>
                    </div>
                  </div>
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div className="h-6 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-100 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                        style={{ width: `${Math.min(100, Math.max(0, (currentSignal + 100) * 1.5))}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center px-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Geiger feedback rate increases near Aruba Radio
                      </p>
                      <button onClick={() => setIsMuted(!isMuted)} className="flex items-center gap-2 text-xs font-bold text-blue-500">
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        {isMuted ? 'UNMUTE AUDIO' : 'AUDIO ACTIVE'}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* ACCESS POINTS TAB */}
              {tab === 'access-points' && (
                <div className="space-y-6">
                  <Card className={`${darkMode ? 'bg-[#111827] border-[#1e2d45]' : 'bg-white border-[#e2e8f0]'} border-l-4 border-l-blue-600`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Live Connection Diagnostics</span>
                        <Badge variant="outline" className="font-mono text-[10px]">IP: 192.168.100.15</Badge>
                      </div>
                      <div className="flex flex-wrap justify-between items-end gap-6">
                        <div>
                          <h3 className="text-2xl font-bold">CAF-WIFI-5G</h3>
                          <p className="text-[11px] font-mono text-slate-500 mt-1">ARUBA NETWORKS | 00:0B:86:12:34:56</p>
                        </div>
                        <div className="flex gap-12 text-center">
                          <div>
                            <div className="text-lg font-bold text-green-500">-45 dBm</div>
                            <div className="text-[9px] text-slate-500 uppercase mt-1">Signal</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-blue-500">CH 36</div>
                            <div className="text-[9px] text-slate-500 uppercase mt-1">5180 MHz</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-cyan-400">850 Mbps</div>
                            <div className="text-[9px] text-slate-500 uppercase mt-1">Throughput</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-center gap-3 text-[10px] font-bold text-red-500 uppercase tracking-widest">
                    <AlertTriangle className="w-4 h-4" /> Wi-Fi scan throttling is active. Accuracy may vary.
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <Input 
                      placeholder="Audit Environment (e.g., Data Center Rack B-12)" 
                      value={auditEnv}
                      onChange={(e) => setAuditEnv(e.target.value)}
                      className={`${darkMode ? 'bg-[#0d1526] border-[#1e2d45]' : 'bg-white border-[#e2e8f0]'} h-11`}
                    />
                    <Button onClick={startScan} disabled={isScanning} className="h-11 px-8 bg-blue-600 hover:bg-blue-700 font-bold uppercase text-xs tracking-widest">
                      {isScanning ? 'Scanning...' : 'Start Site Audit'}
                    </Button>
                  </div>

                  <Card className={`${darkMode ? 'bg-[#111827] border-[#1e2d45]' : 'bg-white border-[#e2e8f0]'} overflow-hidden`}>
                    <CardHeader className="bg-slate-500/5 py-4 border-b border-inherit">
                      <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Infrastructure Discovery Registry</CardTitle>
                    </CardHeader>
                    <div className="divide-y border-inherit">
                      {MOCK_APS.map((ap) => (
                        <div key={ap.id} className="p-4 flex items-center justify-between hover:bg-blue-600/5 transition-colors group">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-slate-500/10 flex items-center justify-center relative">
                              <Wifi className={`w-6 h-6 ${Math.abs(ap.signal) < 60 ? 'text-green-500' : 'text-yellow-500'}`} />
                              <div className="absolute -top-1 -right-1 text-[8px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded-md border border-slate-700">{ap.ch}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{ap.ssid}</span>
                                {ap.vendor === 'ARUBA NETWORKS' && <Badge className="bg-blue-600/10 text-blue-500 hover:bg-blue-600/10 text-[8px] h-4">ARUBA</Badge>}
                              </div>
                              <div className="flex gap-4 text-[10px] font-mono text-slate-500">
                                <span className={Math.abs(ap.signal) < 60 ? 'text-green-500' : 'text-yellow-500'}>{ap.signal} dBm</span>
                                <span className="uppercase">{ap.vendor}</span>
                                <span className="text-blue-600/60">{ap.freq}</span>
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setTrackingNetwork(ap)}
                            className="text-[9px] font-bold uppercase tracking-widest border-blue-600/30 text-blue-500 hover:bg-blue-600 hover:text-white transition-all"
                          >
                            <Crosshair className="w-3 h-3 mr-2" /> Locate AP
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* CHANNEL RATING TAB */}
              {tab === 'channel-rating' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                   <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">Spectral Quality Index</h3>
                    <div className="flex gap-2">
                      {['2.4 GHz', '5 GHz', '6 GHz'].map(b => (
                        <Button key={b} variant="outline" size="sm" className="text-[10px] h-8 border-[#1e2d45]">{b}</Button>
                      ))}
                    </div>
                  </div>
                  <Card className={`${darkMode ? 'bg-[#111827] border-[#1e2d45]' : 'bg-white border-[#e2e8f0]'}`}>
                    <Table>
                      <TableHeader className="bg-slate-500/5">
                        <TableRow className="border-inherit">
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest">Channel Rating</TableHead>
                          <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest">Channel</TableHead>
                          <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">AP Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { ch: 2, stars: 10, count: 0 },
                          { ch: 6, stars: 8, count: 4 },
                          { ch: 11, stars: 9, count: 1 },
                          { ch: 1, stars: 7, count: 6 },
                        ].map((c) => (
                          <TableRow key={c.ch} className="border-inherit">
                            <TableCell>
                              <div className="flex gap-0.5 text-green-500">
                                {Array.from({ length: 10 }).map((_, i) => (
                                  <span key={i} className={i < c.stars ? "text-green-500" : "text-slate-800"}>★</span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-bold text-cyan-400">{c.ch} <span className="text-[10px] font-normal text-slate-500 ml-1">20 MHz</span></TableCell>
                            <TableCell className="text-right font-bold text-blue-500">{c.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              )}

              {/* CHANNEL GRAPH TAB */}
              {tab === 'channel-graph' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { l: 'Infrastructure', v: '6', i: Wifi },
                      { l: 'Radios Active', v: '18', i: Radio },
                      { l: 'Avg Signal', v: '-52 dBm', i: Signal },
                      { l: 'Health Score', v: '98%', i: ShieldCheck },
                    ].map((s, i) => (
                      <Card key={i} className={`${darkMode ? 'bg-[#111827] border-[#1e2d45]' : 'bg-white border-[#e2e8f0]'}`}>
                        <CardContent className="p-4 flex justify-between">
                          <div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">{s.l}</p>
                            <p className="text-2xl font-bold">{s.v}</p>
                          </div>
                          <s.i className="w-8 h-8 text-blue-500 opacity-20" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className={`${darkMode ? 'bg-[#111827] border-[#1e2d45]' : 'bg-white border-[#e2e8f0]'}`}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2"><Layers className="w-5 h-5 text-blue-500" /> Spectral Channel Analysis</CardTitle>
                      <CardDescription>Visualizing signal overlap and "hump" distributions</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={spectrumData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke={darkMode ? "#1e2d45" : "#e2e8f0"} />
                          <XAxis dataKey="ch" stroke="#555" fontSize={12} label={{ value: 'WiFi Channels', position: 'insideBottom', offset: -5, fill: '#555' }} />
                          <YAxis stroke="#555" fontSize={12} domain={[0, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px' }} />
                          <Area type="monotone" dataKey="v" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TIME GRAPH / SPEED TAB */}
              {tab === 'time-graph' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <Card className={`${darkMode ? 'bg-[#111827] border-[#1e2d45]' : 'bg-white border-[#e2e8f0]'}`}>
                      <CardHeader>
                        <CardTitle className="text-lg">Throughput History</CardTitle>
                        <CardDescription>Historical speed test performance (24h)</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={SPEED_HISTORY}>
                            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#1e2d45" : "#e2e8f0"} vertical={false} />
                            <XAxis dataKey="t" stroke="#555" fontSize={11} />
                            <YAxis stroke="#555" fontSize={11} unit="M" />
                            <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none' }} />
                            <Line type="monotone" dataKey="dl" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6' }} />
                            <Line type="monotone" dataKey="ul" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card className={`${darkMode ? 'bg-[#111827] border-[#1e2d45]' : 'bg-white border-[#e2e8f0]'}`}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Active Speed Test</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 py-10">
                      {speedResult ? (
                        <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
                          <div className="p-8 rounded-3xl bg-blue-600/10 border border-blue-600/20">
                            <p className="text-6xl font-black text-blue-500">{speedResult.dl}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Mbps Download</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-slate-500/5 border border-inherit text-center">
                              <p className="text-xl font-bold text-cyan-400">{speedResult.ul}</p>
                              <p className="text-[8px] text-slate-500 uppercase mt-1">Upload</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-500/5 border border-inherit text-center">
                              <p className="text-xl font-bold text-purple-400">{speedResult.ping}</p>
                              <p className="text-[8px] text-slate-500 uppercase mt-1">Ping ms</p>
                            </div>
                          </div>
                          <Button onClick={runSpeedTest} variant="outline" className="w-full">Retest Node</Button>
                        </div>
                      ) : (
                        <div className="text-center space-y-6">
                          <div className="w-24 h-24 rounded-full bg-blue-600/5 flex items-center justify-center mx-auto border-2 border-blue-600/20">
                            <Activity className={`w-10 h-10 text-blue-500 ${speedRunning ? 'animate-pulse' : ''}`} />
                          </div>
                          {speedRunning ? (
                            <div className="space-y-4">
                              <Progress value={speedProgress} className="h-2" />
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Benchmarking throughput...</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <p className="text-xs text-slate-500 leading-relaxed px-6">Measure point-to-point bandwidth capacity from this analyzer to the headend.</p>
                              <Button onClick={runSpeedTest} className="w-full bg-blue-600 hover:bg-blue-700 font-bold uppercase tracking-widest text-xs">Run Diagnostic</Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* EXPORT TAB */}
              {tab === 'export' && (
                <div className="space-y-6">
                  <Card className={`${darkMode ? 'bg-[#111827] border-[#1e2d45]' : 'bg-white border-[#e2e8f0]'}`}>
                    <Table>
                      <TableHeader className="bg-slate-500/5">
                        <TableRow className="border-inherit">
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest">Report ID</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest">Location</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest">Date</TableHead>
                          <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest">Nodes</TableHead>
                          <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {REPORTS.map((r) => (
                          <TableRow key={r.id} className="border-inherit group hover:bg-slate-500/5">
                            <TableCell className="font-mono text-blue-500 font-bold">{r.id}</TableCell>
                            <TableCell className="font-bold">{r.loc}</TableCell>
                            <TableCell className="text-slate-500">{r.date}</TableCell>
                            <TableCell className="text-center">{r.nets}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all text-blue-500">
                                Download PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              )}

              {/* VENDORS / ADMIN TAB */}
              {tab === 'vendors' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Team Operations</h2>
                      <p className="text-xs text-slate-500 mt-1">Manage field technician credentials and performance.</p>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px] tracking-widest">
                      Invite Member
                    </Button>
                  </div>
                  <Card className={`${darkMode ? 'bg-[#111827] border-[#1e2d45]' : 'bg-white border-[#e2e8f0]'}`}>
                    <Table>
                      <TableHeader className="bg-slate-500/5">
                        <TableRow className="border-inherit">
                          <TableHead>Technician</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((m) => (
                          <TableRow key={m.id} className="border-inherit">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold border border-slate-700">
                                  {m.avatar}
                                </div>
                                <span className="font-bold text-sm">{m.name}</span>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="secondary" className="text-[10px]">{m.role}</Badge></TableCell>
                            <TableCell>
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${m.status === 'Active' ? 'text-green-500' : 'text-slate-500'}`}>
                                {m.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#111827] border-[#1e2d45] text-white">
                                  <DropdownMenuItem onClick={() => removeMember(m.id)} className="text-red-500 focus:text-red-500 cursor-pointer font-bold text-xs">
                                    <Trash2 className="w-4 h-4 mr-2" /> Revoke Access
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              )}

              {/* ABOUT TAB */}
              {tab === 'about' && (
                <div className="max-w-3xl mx-auto space-y-12 py-10 text-center">
                  <div className="space-y-4">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/40 animate-bounce">
                      <Wifi className="text-white w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-bold tracking-tighter">NetPulse CAF Analyzer</h2>
                    <p className="text-slate-500 text-lg">v3.6.0 Enterprise Infrastructure Monitoring</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <Card className={`${darkMode ? 'bg-[#111827] border-[#1e2d45]' : 'bg-white border-[#e2e8f0]'}`}>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-500" /> FIPS-140-2 Compliant</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-slate-500 leading-relaxed">
                        Secure spectral analysis for high-clearance environments. NetPulse provides full visibility into CAF infrastructure without exposing endpoint metadata.
                      </CardContent>
                    </Card>
                    <Card className={`${darkMode ? 'bg-[#111827] border-[#1e2d45]' : 'bg-white border-[#e2e8f0]'}`}>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2"><Zap className="w-5 h-5 text-blue-500" /> Aruba Core Integration</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-slate-500 leading-relaxed">
                        Deep hooks into Aruba AirWave and Central APIs allow for real-time radio management and automated spectral optimization directly from the mobile edge.
                      </CardContent>
                    </Card>
                  </div>
                  <div className="pt-10 border-t border-inherit">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Developed by GDIT Engineering for the Mobile Workforce</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <footer className={`h-10 border-t ${darkMode ? 'bg-[#0d1526] border-[#1e2d45]' : 'bg-white border-[#e2e8f0]'} flex items-center justify-between px-6 text-[9px] font-bold text-slate-600 uppercase tracking-widest`}>
          <div className="flex gap-6">
            <span>System: v3.6.0-PROD</span>
            <span className="text-green-600">State: SecureOps</span>
          </div>
          <div className="flex gap-6">
            <span>Encryption: AES-256-FIPS</span>
            <span>Engine: NetPulse-X-Aruba</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
