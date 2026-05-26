'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// ── STYLES (Custom High-Density Theme) ──────────────────────────────────────
const c = {
  bg: '#0a0f1e', sidebar: '#0d1526', card: '#111827', card2: '#1a2235',
  border: '#1e2d45', blue: '#3b82f6', cyan: '#06b6d4', green: '#22c55e',
  yellow: '#f59e0b', red: '#ef4444', purple: '#a855f7', text: '#e2e8f0',
  muted: '#64748b', dim: '#94a3b8',
};

const S = {
  app: { display:'flex', minHeight:'100vh', background:c.bg, color:c.text, fontFamily:"'Inter','Segoe UI',sans-serif" },
  sidebar: { width:'185px', minHeight:'100vh', background:c.sidebar, borderRight:`1px solid ${c.border}`, display:'flex', flexDirection:'column', padding:'20px 12px', position:'sticky', top:0, height:'100vh', overflowY:'auto', flexShrink:0 },
  main: { flex:1, display:'flex', flexDirection:'column', overflow:'auto' },
  topbar: { background:c.sidebar, borderBottom:`1px solid ${c.border}`, padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10 },
  content: { padding:'28px', flex:1 },
  logoWrap: { display:'flex', alignItems:'center', gap:'10px', marginBottom:'32px', padding:'0 4px' },
  logoIcon: { width:'34px', height:'34px', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 },
  logoText: { fontSize:'14px', fontWeight:'700', color:c.text },
  nav: { display:'flex', flexDirection:'column', gap:'2px', flex:1 },
  navItem: (a: boolean) => ({ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', borderRadius:'8px', cursor:'pointer', border:'none', textAlign:'left' as const, width:'100%', background: a ? 'linear-gradient(135deg,#1e40af,#1d4ed8)' : 'transparent', color: a ? '#fff' : c.muted, fontSize:'11px', fontWeight:'700', letterSpacing:'0.06em', transition:'all 0.15s' }),
  logoutBtn: { display:'flex', alignItems:'center', gap:'8px', background:'transparent', border:'none', color:'#ef4444', padding:'9px 12px', borderRadius:'8px', cursor:'pointer', fontSize:'11px', fontWeight:'700', marginTop:'8px', width:'100%' },
  topTitle: { fontSize:'13px', fontWeight:'700', letterSpacing:'0.12em', color:c.dim },
  arubaTag: { background:'#1e3a5f', border:'1px solid #3b82f6', color:c.blue, fontSize:'10px', fontWeight:'700', padding:'4px 10px', borderRadius:'20px', letterSpacing:'0.05em', display:'flex', alignItems:'center', gap:'6px' },
  card: { background:c.card, border:`1px solid ${c.border}`, borderRadius:'12px', padding:'20px' },
  cardSm: { background:c.card2, border:`1px solid ${c.border}`, borderRadius:'10px', padding:'16px' },
  sectionTitle: { fontSize:'11px', fontWeight:'700', letterSpacing:'0.12em', color:c.muted, marginBottom:'12px', textTransform:'uppercase' as const },
  statCard: { background:c.card, border:`1px solid ${c.border}`, borderRadius:'12px', padding:'20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' },
  apCard: { background:c.card2, border:`1px solid ${c.border}`, borderRadius:'10px', padding:'14px 18px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'16px' },
  apSignalBox: { width:'44px', height:'44px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'800', flexShrink:0 },
  locateBtn: { background:'transparent', border:`1px solid ${c.border}`, color:c.dim, padding:'6px 14px', borderRadius:'8px', cursor:'pointer', fontSize:'11px', fontWeight:'700', display:'flex', alignItems:'center', gap:'6px', marginLeft:'auto' },
  table: { width:'100%', borderCollapse:'collapse' as const },
  th: { textAlign:'left' as const, padding:'10px 12px', borderBottom:`1px solid ${c.border}`, color:c.muted, fontSize:'10px', letterSpacing:'0.08em', textTransform:'uppercase' as const },
  td: { padding:'12px 12px', borderBottom:`1px solid ${c.border}`, fontSize:'13px' },
  input: { background:c.card2, border:`1px solid ${c.border}`, color:c.text, padding:'10px 14px', borderRadius:'8px', fontSize:'13px', outline:'none', width:'100%', boxSizing:'border-box' as const },
  btn: (bg?: string) => ({ background:bg||c.blue, color:'#fff', border:'none', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', fontSize:'12px', fontWeight:'700', display:'flex', alignItems:'center', gap:'8px' }),
  footer: { background:c.sidebar, borderTop:`1px solid ${c.border}`, padding:'8px 24px', display:'flex', justifyContent:'space-between', fontSize:'10px', color:c.border, letterSpacing:'0.08em' },
  overlay: { position:'fixed' as const, inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 },
  modal: { background:c.card, border:`1px solid ${c.border}`, borderRadius:'14px', padding:'28px', maxWidth:'420px', width:'90%' },
};

// ── DATA ─────────────────────────────────────────────────────────────────────
const INITIAL_APS = [
  { id: '1', ssid:'CAF-WIFI-5G', signal:-45, ch:36, bw:'850 MHz', freq:'5170 · 5250 80 MHz', mac:'00:0B:86:12:34:56', vendor:'ARUBA NETWORKS', color:c.green },
  { id: '2', ssid:'CAF-WIFI-2G', signal:-67, ch:6,  bw:'2447 MHz', freq:'2417 · 2447 20 MHz', mac:'00:0B:86:78:90:AB', vendor:'ARUBA NETWORKS', color:c.yellow },
  { id: '3', ssid:'CAF-GUEST',   signal:-79, ch:52, bw:'5815 MHz', freq:'5735 · 5815 80 MHz', mac:'00:0B:86:CD:EF:01', vendor:'ARUBA NETWORKS', color:c.red },
  { id: '4', ssid:'VTEL-Fiber',  signal:-85, ch:1,  bw:'2402 MHz', freq:'2402 · 2422 20 MHz', mac:'7c:1c:f1:25:19:2c', vendor:'HUAWEI TECHNOLOGIES', color:c.red },
  { id: '5', ssid:'Mamon2_5G',   signal:-86, ch:128,bw:'5170 MHz', freq:'5170 · 5250 80 MHz', mac:'98:da:c4:26:21:87', vendor:'TP-LINK TECHNOLOGIES', color:c.red },
  { id: '6', ssid:'*hidden*',    signal:-87, ch:6,  bw:'5170 MHz', freq:'5170 · 5250 80 MHz', mac:'9e:da:c4:26:21:87', vendor:'GENERIC VENDOR', color:c.red },
];

const speedHistory = [
  {t:'10:00',dl:420,ul:180},{t:'11:00',dl:395,ul:165},{t:'12:00',dl:460,ul:195},{t:'13:00',dl:510,ul:210},
  {t:'14:00',dl:480,ul:200},{t:'15:00',dl:445,ul:185},{t:'16:00',dl:470,ul:190},{t:'17:00',dl:490,ul:205},
  {t:'18:00',dl:500,ul:215},{t:'19:00',dl:475,ul:195},{t:'20:00',dl:455,ul:188},{t:'22:00',dl:450,ul:190},
];

const weeklyTrends = [
  {d:'Mon',v:35,e:12},{d:'Tue',v:42,e:15},{d:'Wed',v:55,e:18},{d:'Thu',v:68,e:25},
  {d:'Fri',v:45,e:14},{d:'Sat',v:30,e:10},{d:'Sun',v:25,e:8},
];

const ssidBandwidth = [
  {name:'CAF-WIFI-5G',v:850},{name:'CAF-WIFI-2G',v:300},{name:'CAF-GUEST',v:450},
  {name:'VTEL-Fiber',v:120},{name:'Mamon2_5G',v:680},{name:'*hidden*',v:200},
];

const interference = [
  {name:'CAF-WIFI-5G',v:15},{name:'CAF-WIFI-2G',v:40},{name:'CAF-GUEST',v:25},
  {name:'VTEL-Fiber',v:80},{name:'Mamon2_5G',v:10},{name:'*hidden*',v:50},
];

const signalStrengthData = [
  {name:'CAF-WIFI-5G',v:45},{name:'CAF-WIFI-2G',v:67},{name:'CAF-GUEST',v:79},
  {name:'VTEL-Fiber',v:85},{name:'Mamon2_5G',v:86},{name:'*hidden*',v:87},
];

const networkTypes = [
  {name:'Main',value:40},{name:'Guest',value:25},{name:'IoT',value:20},{name:'Admin',value:15},
];
const PIE_COLORS = [c.blue, c.cyan, c.purple, c.yellow];

const channelRatings = [
  {ch:2,mhz:'20',stars:10,nets:0},{ch:3,mhz:'20',stars:10,nets:0},{ch:4,mhz:'20',stars:10,nets:0},
  {ch:5,mhz:'20',stars:10,nets:0},{ch:7,mhz:'20',stars:10,nets:0},{ch:8,mhz:'20',stars:10,nets:0},
  {ch:9,mhz:'20',stars:10,nets:0},{ch:10,mhz:'20',stars:10,nets:0},{ch:11,mhz:'20',stars:10,nets:0},
  {ch:1,mhz:'20',stars:9,nets:1},{ch:6,mhz:'20',stars:8,nets:1},
];

const teamMembers = [
  {id:1,name:'Alex Johnson',role:'Senior Tech',status:'Active',scans:145,perf:58,avatar:'👨‍💻'},
  {id:2,name:'Maria Garcia',role:'Network Admin',status:'Active',scans:89,perf:38,avatar:'👩‍💻'},
  {id:3,name:'Sam Wilson',role:'Support Specialist',status:'On Leave',scans:212,perf:85,avatar:'👨‍🔧'},
  {id:4,name:'Jordan Lee',role:'Junior Tech',status:'Active',scans:56,perf:22,avatar:'👩‍🔧'},
];

// ── ICONS (SVG inline) ────────────────────────────────────────────────────────
const Icon = ({ path, size=14, color='currentColor' }: { path: string, size?: number, color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(true);
  const [user, setUser] = useState('admin');
  const [pass, setPass] = useState('');
  const [tab, setTab] = useState('access-points');
  const [band, setBand] = useState('2.4');
  const [speedRunning, setSpeedRunning] = useState(false);
  const [speedResult, setSpeedResult] = useState<{dl:number, ul:number, ping:number} | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [members, setMembers] = useState(teamMembers);
  const [accordion, setAccordion] = useState<Record<number, boolean>>({});
  const [auditEnv, setAuditEnv] = useState('');
  const [bandDropdown, setBandDropdown] = useState(false);
  const [selectedBandRating, setSelectedBandRating] = useState('2.4 GHz');
  
  // Geiger Tracker State
  const [trackingNetwork, setTrackingNetwork] = useState<any | null>(null);
  const [currentSignal, setCurrentSignal] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const login = (e: React.FormEvent) => { e.preventDefault(); if(user==='admin'&&pass==='admin123') setLoggedIn(true); else alert('Use: admin / admin123'); };
  
  const runSpeed = async () => {
    setSpeedRunning(true); setSpeedResult(null);
    await new Promise(r=>setTimeout(r,3000));
    setSpeedResult({dl:Math.round(Math.random()*300+200),ul:Math.round(Math.random()*100+50),ping:Math.round(Math.random()*15+3)});
    setSpeedRunning(false);
  };

  const removeMember = (id: number) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const navItems = [
    {id:'access-points',label:'ACCESS POINTS',icon:'M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 14 0M2 8.82a15 15 0 0 1 20 0M12 20h.01'},
    {id:'channel-rating',label:'CHANNEL RATING',icon:'M3 3v18h18M9 9h1v9H9zM13 5h1v13h-1zM17 11h1v7h-1z'},
    {id:'channel-graph',label:'CHANNEL GRAPH',icon:'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18'},
    {id:'time-graph',label:'TIME GRAPH',icon:'M3 3v18h18M7 16l4-4 4 4 4-8'},
    {id:'export',label:'EXPORT',icon:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8'},
    {id:'vendors',label:'VENDORS',icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'},
    {id:'settings',label:'SETTINGS',icon:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'},
    {id:'about',label:'ABOUT',icon:'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01'},
  ];

  if (!isMounted) return null;

  if (!loggedIn) return (
    <div style={S.loginWrap}>
      <div style={S.loginCard}>
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{width:'56px',height:'56px',background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',margin:'0 auto 16px'}}>📡</div>
          <h1 style={{fontSize:'22px',fontWeight:'800',marginBottom:'4px'}}>NetPulse CAF</h1>
          <p style={{fontSize:'13px',color:c.muted}}>Enterprise WiFi Analyzer v3.0.0</p>
        </div>
        <form onSubmit={login} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <input style={S.input} type="text" placeholder="Username" value={user} onChange={e=>setUser(e.target.value)} />
          <input style={S.input} type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} />
          <button style={{...S.btn(),justifyContent:'center',padding:'12px'}} type="submit">Sign In</button>
        </form>
        <p style={{fontSize:'12px',textAlign:'center',color:c.muted,marginTop:'16px'}}>Demo: admin / admin123</p>
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <div style={S.logoWrap}>
          <div style={S.logoIcon}>📡</div>
          <span style={S.logoText}>NetPulse CAF</span>
        </div>
        <nav style={S.nav}>
          {navItems.map(n=>(
            <button key={n.id} style={S.navItem(tab===n.id)} onClick={()=>setTab(n.id)}>
              <Icon path={n.icon} size={14} color={tab===n.id?'#fff':c.muted} />
              {n.label}
            </button>
          ))}
        </nav>
        <button style={S.logoutBtn} onClick={()=>setLoggedIn(false)}>
          <Icon path="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={14} color="#ef4444" />
          LOGOUT
        </button>
      </aside>

      {/* MAIN */}
      <main style={S.main}>
        {/* TOPBAR */}
        <div style={S.topbar}>
          <span style={S.topTitle}>{navItems.find(n=>n.id===tab)?.label}</span>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={S.arubaTag}>
              <div style={{width:'6px',height:'6px',borderRadius:'50%',background:c.blue}} />
              ARUBA ANALYSIS MODE
            </div>
            <button style={{background:'transparent',border:'none',cursor:'pointer',fontSize:'18px'}} title="Toggle theme">☀️</button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={S.content}>

          {/* ── ACCESS POINTS ── */}
          {tab==='access-points' && !trackingNetwork && (
            <div>
              {/* Live Connection */}
              <div style={{...S.card, marginBottom:'16px', borderColor:c.blue+'44'}}>
                <div style={S.sectionTitle}>LIVE CONNECTION DIAGNOSTICS</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'16px'}}>
                  <div>
                    <div style={{fontSize:'22px',fontWeight:'800',marginBottom:'4px'}}>CAF-WIFI-5G</div>
                    <div style={{fontSize:'11px',color:c.muted}}>ARUBA NETWORKS | MAC: 00:0B:86:12:34:56</div>
                  </div>
                  <div style={{fontSize:'12px',color:c.muted}}>IP: 192.168.100.15</div>
                </div>
                <div style={{display:'flex',gap:'32px',marginTop:'16px',flexWrap:'wrap'}}>
                  {[{v:'-45 dBm',l:'SIGNAL',c:c.green},{v:'CH 36',l:'5180 MHz',c:c.cyan},{v:'850 Mbps',l:'THROUGHPUT',c:c.blue}].map(x=>(
                    <div key={x.l}><div style={{fontSize:'18px',fontWeight:'800',color:x.c}}>{x.v}</div><div style={{fontSize:'10px',color:c.muted,marginTop:'2px'}}>{x.l}</div></div>
                  ))}
                </div>
              </div>

              {/* Throttle Warning */}
              <div style={{background:'#2d1515',border:`1px solid ${c.red}55`,borderRadius:'8px',padding:'10px 16px',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px',color:c.yellow,fontSize:'12px'}}>
                ⚠️ WI-FI SCAN THROTTLING IS ACTIVE. ACCURACY MAY VARY.
              </div>

              {/* Audit */}
              <div style={{...S.card, marginBottom:'16px'}}>
                <div style={S.sectionTitle}>⊙ AUDIT ENVIRONMENT</div>
                <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
                  <input style={{...S.input,flex:1,minWidth:'200px'}} placeholder="e.g., Data Center Rack B-12" value={auditEnv} onChange={e=>setAuditEnv(e.target.value)} />
                  <button style={{...S.btn(),padding:'10px 24px'}}>▶ START SITE AUDIT</button>
                </div>
              </div>

              {/* Discovery Registry */}
              <div style={S.card}>
                <div style={S.sectionTitle}>⊙ DISCOVERY REGISTRY</div>
                {INITIAL_APS.map((ap,i)=>(
                  <div key={i} style={S.apCard}>
                    <div style={{...S.apSignalBox,background:ap.color+'22',color:ap.color}}>
                      {ap.ch}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:'700',fontSize:'14px',display:'flex',alignItems:'center',gap:'8px'}}>
                        {ap.ssid}
                        {ap.vendor==='ARUBA NETWORKS'&&<span style={{fontSize:'9px',background:c.blue+'22',color:c.blue,padding:'1px 6px',borderRadius:'4px'}}>ARUBA</span>}
                      </div>
                      <div style={{fontSize:'11px',color:c.muted,marginTop:'2px'}}>{ap.vendor} · {ap.mac}</div>
                      <div style={{fontSize:'11px',color:c.muted,marginTop:'2px'}}>
                        <span style={{color:ap.color,fontWeight:'700'}}>{ap.signal} dBm</span>
                        {' · '}{ap.freq}
                      </div>
                    </div>
                    <button style={S.locateBtn} onClick={() => setTrackingNetwork(ap)}>📍 LOCATE AP</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Geiger Tracker View */}
          {trackingNetwork && (
            <div style={{...S.card, textAlign:'center', py:'60px', background:c.card2, position:'relative'}}>
               <button 
                style={{position:'absolute', top:'20px', right:'20px', background:c.card, border:'none', color:c.dim, cursor:'pointer'}}
                onClick={() => setTrackingNetwork(null)}
               >✕ Close Tracker</button>
               
               <div style={{fontSize:'14px', color:c.blue, fontWeight:'700', marginBottom:'10px'}}>LOCATING HARDWARE: {trackingNetwork.ssid}</div>
               <div style={{fontSize:'80px', fontWeight:'800', color: trackingNetwork.color, marginBottom:'20px'}}>
                  {Math.round(currentSignal)} <span style={{fontSize:'20px', color:c.muted}}>dBm</span>
               </div>
               <div style={{width:'100%', height:'20px', background:c.sidebar, borderRadius:'10px', overflow:'hidden', marginBottom:'20px'}}>
                  <div style={{width:`${Math.min(100, Math.max(0, (currentSignal + 100) * 1.5))}%`, height:'100%', background:trackingNetwork.color, transition:'width 0.1s'}} />
               </div>
               <div style={{fontSize:'12px', color:c.muted}}>
                  Geiger feedback rate increases as proximity to <span style={{color:c.blue}}>Aruba Radio</span> improves.
               </div>
               <button 
                  style={{marginTop:'30px', ...S.btn(c.card), color:c.dim, border:`1px solid ${c.border}`}} 
                  onClick={() => setIsMuted(!isMuted)}
               >
                 {isMuted ? '🔇 Audio Muted' : '🔊 Audio Active'}
               </button>
            </div>
          )}

          {/* ── CHANNEL RATING ── */}
          {tab==='channel-rating' && (
            <div>
              <div style={{display:'flex',gap:'16px',alignItems:'flex-start',flexWrap:'wrap',marginBottom:'16px'}}>
                <div style={{...S.card,flex:1,minWidth:'240px',borderColor:c.blue+'44'}}>
                  <div style={{fontSize:'11px',color:c.blue,fontWeight:'700',marginBottom:'8px'}}>Current connection</div>
                  <div style={{fontWeight:'700',marginBottom:'4px'}}>CAF-WIFI-5G – 5G (00:0B:86:12:34:56)</div>
                  <div style={{color:c.green,fontWeight:'700',fontSize:'13px'}}>-45dBm · CH 36 · S180</div>
                  <div style={{color:c.cyan,fontSize:'12px',marginTop:'2px'}}>850Mbps · 192.168.100.15</div>
                  <div style={{background:'#2d1a1a',border:`1px solid ${c.red}44`,borderRadius:'6px',padding:'6px 10px',marginTop:'10px',color:c.red,fontSize:'11px',display:'flex',alignItems:'center',gap:'6px'}}>
                    ⊘ Wi-Fi scan throttling is enabled
                  </div>
                </div>
                {/* Band selector */}
                <div style={{position:'relative'}}>
                  <button onClick={()=>setBandDropdown(!bandDropdown)} style={{...S.btn(c.card2),border:`1px solid ${c.border}`,color:c.text,padding:'10px 16px',display:'flex',alignItems:'center',gap:'8px',minWidth:'120px',justifyContent:'space-between'}}>
                    {selectedBandRating} <span>▾</span>
                  </button>
                  {bandDropdown&&(
                    <div style={{position:'absolute',top:'44px',left:0,background:c.card,border:`1px solid ${c.border}`,borderRadius:'8px',overflow:'hidden',zIndex:20,minWidth:'120px'}}>
                      {['2.4 GHz','5 GHz','6 GHz'].map(b=>(
                        <div key={b} onClick={()=>{setSelectedBandRating(b);setBandDropdown(false);}} style={{padding:'10px 16px',cursor:'pointer',fontSize:'13px',background:selectedBandRating===b?c.card2:'transparent'}}>
                          {b}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={S.card}>
                <div style={{display:'flex',gap:'8px',marginBottom:'12px',flexWrap:'wrap'}}>
                  <span style={{fontSize:'13px',fontWeight:'700',color:c.cyan}}>BEST CHANNELS:</span>
                  <span style={{fontSize:'13px',color:c.blue}}>20 MHz 2, 3, 4, 5, 7, 8, 9, 10, 11, 1</span>
                </div>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>CHANNEL RATING</th>
                      <th style={S.th}>CHANNEL NUMBER</th>
                      <th style={S.th}>ACCESS POINT COUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelRatings.map((r,i)=>(
                      <tr key={i}>
                        <td style={S.td}><span style={{color:c.yellow,letterSpacing:'2px'}}>{'★'.repeat(r.stars)}{'☆'.repeat(10-r.stars)}</span></td>
                        <td style={{...S.td,color:c.cyan,fontWeight:'700'}}>{r.ch} <span style={{color:c.muted,fontSize:'11px'}}>{r.mhz} MHz</span></td>
                        <td style={{...S.td,color:r.nets>0?c.yellow:c.muted}}>{r.nets}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CHANNEL GRAPH ── */}
          {tab==='channel-graph' && (
            <div>
              <div style={S.statGrid4}>
                {[
                  {l:'CAF NETWORKS',v:'6',icon:'📡',trend:'+2.5% from last scan'},
                  {l:'ACTIVE APS',v:'18',icon:'🔗',trend:'+2.6% from last scan'},
                  {l:'AVG SIGNAL',v:'-52 dBm',icon:'📶',trend:'+2.5% from last scan'},
                  {l:'NETWORK HEALTH',v:'98%',icon:'🛡️',trend:'+2.5% from last scan'},
                ].map((s,i)=>(
                  <div key={i} style={S.statCard}>
                    <div>
                      <div style={S.statLabel}>{s.l}</div>
                      <div style={{...S.statVal,color:c.blue}}>{s.v}</div>
                      <div style={{fontSize:'11px', color:c.green}}>↑ {s.trend}</div>
                    </div>
                    <div style={{fontSize:'24px',opacity:0.5}}>{s.icon}</div>
                  </div>
                ))}
              </div>

              <div style={{...S.card,marginBottom:'16px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px'}}>
                  <div>
                    <div style={{fontWeight:'700',fontSize:'15px',marginBottom:'4px'}}>≈ Channel Spectrum Graph</div>
                    <div style={{fontSize:'12px',color:c.muted}}>Visualizing signal overlap and channel congestion</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={band==='2.4'?spectrumData24:spectrumData5}>
                    <CartesianGrid stroke={c.border} strokeDasharray="3 3" />
                    <XAxis dataKey="ch" tick={{fill:c.muted,fontSize:11}} />
                    <YAxis tick={{fill:c.muted,fontSize:11}} />
                    <Tooltip contentStyle={{background:c.card,border:`1px solid ${c.border}`,borderRadius:'8px',color:c.text}} />
                    <Area type="monotone" dataKey="v" stroke={c.cyan} fill={c.cyan} fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'16px'}}>
                <div style={S.card}>
                  <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'4px'}}>≋ SSID Bandwidth Distribution</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={ssidBandwidth} layout="vertical" margin={{left:20}}>
                      <XAxis type="number" tick={{fill:c.muted,fontSize:10}} />
                      <YAxis dataKey="name" type="category" width={80} tick={{fill:c.muted,fontSize:10}} />
                      <Bar dataKey="v" fill={c.blue} radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'4px'}}>⚠ Interference Analysis</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={interference}>
                      <XAxis dataKey="name" tick={{fill:c.muted,fontSize:9}} />
                      <YAxis tick={{fill:c.muted,fontSize:10}} domain={[0,100]} />
                      <Bar dataKey="v" fill={c.yellow} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── TIME GRAPH ── */}
          {tab==='time-graph' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:'20px',alignItems:'start'}}>
              <div>
                <div style={{...S.card,marginBottom:'20px'}}>
                  <div style={{fontWeight:'700',fontSize:'15px',marginBottom:'16px'}}>Speed Test History</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={speedHistory}>
                      <CartesianGrid stroke={c.border} strokeDasharray="3 3" />
                      <XAxis dataKey="t" tick={{fill:c.muted,fontSize:11}} />
                      <YAxis tick={{fill:c.muted,fontSize:11}} unit=" Mbps" />
                      <Tooltip contentStyle={{background:c.card,border:`1px solid ${c.border}`,borderRadius:'8px',color:c.text}} />
                      <Line type="monotone" dataKey="dl" stroke={c.blue} strokeWidth={2} name="Download" />
                      <Line type="monotone" dataKey="ul" stroke={c.cyan} strokeWidth={2} name="Upload" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={S.card}>
                  <div style={{fontWeight:'700',fontSize:'15px',marginBottom:'16px'}}>Weekly Activity Trends</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={weeklyTrends}>
                      <XAxis dataKey="d" tick={{fill:c.muted,fontSize:11}} />
                      <YAxis tick={{fill:c.muted,fontSize:11}} />
                      <Area type="monotone" dataKey="v" stroke={c.blue} fill={c.blue} fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Speed Test Panel */}
              <div style={{...S.card,position:'sticky',top:'72px'}}>
                <div style={{fontWeight:'700',fontSize:'15px',marginBottom:'20px'}}>⚡ Active Speed Test</div>
                {!speedResult ? (
                  <div style={{textAlign:'center',padding:'20px 0'}}>
                    <div style={{fontSize:'32px',marginBottom:'16px',opacity:speedRunning?1:0.4}}>
                      {speedRunning ? '⏳' : '〜'}
                    </div>
                    <button style={{...S.btn(c.card2), border:`1px solid ${c.border}`, color:c.text, width:'100%', justifyContent:'center'}} onClick={runSpeed} disabled={speedRunning}>
                      {speedRunning ? '⏳ Running...' : '▶ Start Speed Test'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{background:'#0d2040',borderRadius:'10px',padding:'16px',textAlign:'center',marginBottom:'12px',border:`1px solid ${c.blue}44`}}>
                      <div style={{fontSize:'32px',fontWeight:'800',color:c.blue}}>{speedResult.dl}</div>
                      <div style={{fontSize:'14px',color:c.blue}}>Mbps DOWNLOAD</div>
                    </div>
                    <button style={{...S.btn(c.card2),border:`1px solid ${c.border}`,color:c.text,width:'100%',justifyContent:'center'}} onClick={()=>setSpeedResult(null)}>Run Again</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── EXPORT ── */}
          {tab==='export' && (
            <div style={S.card}>
              <div style={{fontWeight:'700',fontSize:'18px',marginBottom:'24px'}}>Audit Reports Registry</div>
              <table style={S.table}>
                <thead>
                  <tr>
                    {['Report ID','Location','Date','Networks','Action'].map(h=>(
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r,i)=>(
                    <tr key={i}>
                      <td style={{...S.td,color:c.blue,fontWeight:'700'}}>{r.id}</td>
                      <td style={S.td}>{r.loc}</td>
                      <td style={{...S.td,color:c.muted}}>{r.date}</td>
                      <td style={S.td}>{r.nets} detected</td>
                      <td style={S.td}><button style={{background:'transparent',border:'none',color:c.blue,cursor:'pointer'}}>👁 View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── VENDORS (Team Management) ── */}
          {tab==='vendors' && (
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
                <div style={{fontWeight:'700',fontSize:'18px'}}>Organization Management</div>
                <button style={{...S.btn(c.card2),border:`1px solid ${c.border}`,color:c.text}} onClick={()=>setShowInvite(true)}>
                   Invite Member
                </button>
              </div>

              <div style={S.card}>
                <div style={{fontWeight:'700',fontSize:'15px',marginBottom:'16px'}}>Team Members</div>
                <table style={S.table}>
                  <thead>
                    <tr>{['Member','Role','Status','Lifetime Scans',''].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {members.map((m,i)=>(
                      <tr key={i}>
                        <td style={S.td}>
                          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                            <span style={{fontSize:'18px'}}>{m.avatar}</span>
                            <span style={{fontWeight:'600'}}>{m.name}</span>
                          </div>
                        </td>
                        <td style={{...S.td,color:c.muted}}>{m.role}</td>
                        <td style={S.td}>{m.status}</td>
                        <td style={S.td}>{m.scans}</td>
                        <td style={S.td}>
                          <button 
                            style={{background:'transparent',border:'none',color:c.red,cursor:'pointer', fontSize:'11px', fontWeight:'700'}}
                            onClick={() => removeMember(m.id)}
                          >REMOVE</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ABOUT ── */}
          {tab==='about' && (
            <div style={{maxWidth:'760px',margin:'0 auto',textAlign:'center'}}>
              <div style={{width:'72px',height:'72px',background:'linear-gradient(135deg,#1e3a5f,#1e40af)',border:`2px solid ${c.blue}`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',margin:'0 auto 20px'}}>📡</div>
              <div style={{fontSize:'32px',fontWeight:'800',marginBottom:'8px'}}>NetPulse CAF Analyzer</div>
              <div style={{fontSize:'14px',color:c.muted,marginBottom:'40px'}}>v3.0.0 Enterprise Infrastructure Monitoring</div>
              <div style={{...S.card,textAlign:'center'}}>
                <div style={{fontSize:'24px',marginBottom:'10px'}}>🌐</div>
                <div style={{fontWeight:'700',fontSize:'16px',marginBottom:'8px'}}>Global Deployment</div>
                <div style={{fontSize:'13px',color:c.muted,lineHeight:'1.7',maxWidth:'480px',margin:'0 auto'}}>
                  Used by field technicians across multiple continents to ensure reliable connectivity for the modern mobile workforce. Developed and maintained by the GDIT Engineering Team.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div style={S.footer}>
          <span>SYSTEM: v3.0.0-ENTERPRISE-PROD &nbsp;|&nbsp; STATE: <span style={{color:c.green}}>SECUREOPS</span></span>
          <span>ENCRYPTION: AES-256-FIPS &nbsp;|&nbsp; ENGINE: NETPULSE-X-ARUBA</span>
        </div>
      </main>
    </div>
  );
}

const spectrumData24 = Array.from({length:14},(_,i)=>({ch:i+1,v: i===0?55:i===5?75:i===10?45:Math.random()*15}));
const spectrumData5  = Array.from({length:20},(_,i)=>({ch:36+i*4,v: i===0?50:i===4?65:i===12?40:Math.random()*10}));

const reports = [
  {id:'REP-001',loc:'Main Campus - Wing A',date:'2024-05-15',nets:12,signal:'-52 dBm',sigColor:c.green},
  {id:'REP-002',loc:'Basement Storage',date:'2024-05-18',nets:8,signal:'-68 dBm',sigColor:c.yellow},
  {id:'REP-003',loc:'Executive Suite',date:'2024-05-20',nets:15,signal:'-45 dBm',sigColor:c.green},
];
