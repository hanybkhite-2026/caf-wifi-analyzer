'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ── THEME ────────────────────────────────────────────────────────────────────
const DARK = {
  bg:'#0a0f1e', sidebar:'#0d1526', card:'#111827', card2:'#1a2235',
  border:'#1e2d45', blue:'#3b82f6', cyan:'#06b6d4', green:'#22c55e',
  yellow:'#f59e0b', red:'#ef4444', purple:'#a855f7', text:'#e2e8f0',
  muted:'#64748b', dim:'#94a3b8',
};
const LIGHT = {
  bg:'#f1f5f9', sidebar:'#ffffff', card:'#ffffff', card2:'#f8fafc',
  border:'#e2e8f0', blue:'#2563eb', cyan:'#0891b2', green:'#16a34a',
  yellow:'#d97706', red:'#dc2626', purple:'#9333ea', text:'#0f172a',
  muted:'#64748b', dim:'#475569',
};

// ── STATIC DATA ──────────────────────────────────────────────────────────────
const APS_DATA = [
  { ssid:'CAF-WIFI-5G',  signal:-45, ch:36,  freq:'5170·5250 80MHz',  mac:'00:0B:86:12:34:56', vendor:'ARUBA NETWORKS',      quality:'Excellent' },
  { ssid:'CAF-WIFI-2G',  signal:-67, ch:6,   freq:'2417·2447 20MHz',  mac:'00:0B:86:78:90:AB', vendor:'ARUBA NETWORKS',      quality:'Good' },
  { ssid:'CAF-GUEST',    signal:-79, ch:52,  freq:'5735·5815 80MHz',  mac:'00:0B:86:CD:EF:01', vendor:'ARUBA NETWORKS',      quality:'Fair' },
  { ssid:'VTEL-Fiber',   signal:-85, ch:1,   freq:'2402·2422 20MHz',  mac:'7c:1c:f1:25:19:2c', vendor:'HUAWEI TECHNOLOGIES', quality:'Poor' },
  { ssid:'Mamon2_5G',    signal:-86, ch:128, freq:'5170·5250 80MHz',  mac:'98:da:c4:26:21:87', vendor:'TP-LINK TECHNOLOGIES',quality:'Poor' },
  { ssid:'*hidden*',     signal:-87, ch:6,   freq:'5170·5250 80MHz',  mac:'9e:da:c4:26:21:87', vendor:'GENERIC VENDOR',      quality:'Poor' },
];

const SPEED_HISTORY = [
  {t:'10:00',dl:420,ul:180},{t:'11:00',dl:395,ul:165},{t:'12:00',dl:460,ul:195},
  {t:'13:00',dl:510,ul:210},{t:'14:00',dl:480,ul:200},{t:'15:00',dl:445,ul:185},
  {t:'16:00',dl:470,ul:190},{t:'17:00',dl:490,ul:205},{t:'18:00',dl:500,ul:215},
  {t:'19:00',dl:475,ul:195},{t:'20:00',dl:455,ul:188},{t:'22:00',dl:450,ul:190},
];
const WEEKLY = [
  {d:'Mon',v:35,e:12},{d:'Tue',v:42,e:15},{d:'Wed',v:55,e:18},
  {d:'Thu',v:68,e:25},{d:'Fri',v:45,e:14},{d:'Sat',v:30,e:10},{d:'Sun',v:25,e:8},
];
const SSID_BW = [
  {name:'CAF-WIFI-5G',v:850},{name:'CAF-WIFI-2G',v:300},
  {name:'CAF-GUEST',v:450},{name:'VTEL-Fiber',v:120},
  {name:'Mamon2_5G',v:680},{name:'*hidden*',v:200},
];
const INTERFERENCE = [
  {name:'CAF-WIFI-5G',v:15},{name:'CAF-WIFI-2G',v:40},{name:'CAF-GUEST',v:25},
  {name:'VTEL-Fiber',v:80},{name:'Mamon2_5G',v:10},{name:'*hidden*',v:50},
];
const SIG_STRENGTH = [
  {name:'CAF-WIFI-5G',v:45},{name:'CAF-WIFI-2G',v:67},{name:'CAF-GUEST',v:79},
  {name:'VTEL-Fiber',v:85},{name:'Mamon2_5G',v:86},{name:'*hidden*',v:87},
];
const NET_TYPES = [
  {name:'Main',value:40},{name:'Guest',value:25},{name:'IoT',value:20},{name:'Admin',value:15},
];
const PIE_COLORS = ['#3b82f6','#06b6d4','#a855f7','#f59e0b'];

const SPECTRUM_24 = Array.from({length:13},(_,i)=>({
  ch:i+1, v: i===0?55: i===5?75: i===10?45: Math.round(Math.random()*15+2)
}));
const SPECTRUM_5 = [
  {ch:36,v:50},{ch:40,v:8},{ch:44,v:5},{ch:48,v:6},{ch:52,v:65},
  {ch:56,v:7},{ch:60,v:5},{ch:64,v:8},{ch:100,v:6},{ch:104,v:5},
  {ch:108,v:7},{ch:112,v:6},{ch:116,v:40},{ch:120,v:8},{ch:124,v:5},
  {ch:128,v:6},{ch:132,v:5},{ch:136,v:7},{ch:140,v:8},{ch:149,v:6},
];

const CHANNEL_RATINGS = {
  '2.4 GHz': [
    {ch:2,stars:10,nets:0},{ch:3,stars:10,nets:0},{ch:4,stars:10,nets:0},
    {ch:5,stars:10,nets:0},{ch:7,stars:10,nets:0},{ch:8,stars:10,nets:0},
    {ch:9,stars:10,nets:0},{ch:10,stars:10,nets:0},{ch:11,stars:10,nets:0},
    {ch:1,stars:9,nets:1},{ch:6,stars:8,nets:1},
  ],
  '5 GHz': [
    {ch:36,stars:10,nets:1},{ch:40,stars:10,nets:0},{ch:44,stars:10,nets:0},
    {ch:48,stars:10,nets:0},{ch:52,stars:9,nets:1},{ch:56,stars:10,nets:0},
    {ch:60,stars:10,nets:0},{ch:64,stars:10,nets:0},{ch:100,stars:10,nets:0},
    {ch:104,stars:10,nets:0},{ch:149,stars:10,nets:0},
  ],
  '6 GHz': [
    {ch:1,stars:10,nets:0},{ch:5,stars:10,nets:0},{ch:9,stars:10,nets:0},
    {ch:13,stars:10,nets:0},{ch:17,stars:10,nets:0},{ch:21,stars:10,nets:0},
  ],
};

const REPORTS = [
  {id:'REP-001',loc:'Main Campus - Wing A',date:'2024-05-15',nets:12,signal:'-52 dBm',sigColor:'#22c55e',networks:[{name:'CAF-WIFI-5G',sig:-45},{name:'CAF-WIFI-2G',sig:-67},{name:'CAF-GUEST',sig:-79}]},
  {id:'REP-002',loc:'Basement Storage',date:'2024-05-18',nets:8,signal:'-68 dBm',sigColor:'#f59e0b',networks:[{name:'VTEL-Fiber',sig:-85},{name:'Mamon2_5G',sig:-86}]},
  {id:'REP-003',loc:'Executive Suite',date:'2024-05-20',nets:15,signal:'-45 dBm',sigColor:'#22c55e',networks:[{name:'CAF-WIFI-5G',sig:-45},{name:'CAF-GUEST',sig:-65}]},
];

const INIT_MEMBERS = [
  {id:1,name:'Alex Johnson', role:'Senior Tech',      status:'Active',   scans:145,perf:58, avatar:'👨‍💻', email:'alex@caf.com'},
  {id:2,name:'Maria Garcia', role:'Network Admin',    status:'Active',   scans:89, perf:38, avatar:'👩‍💻', email:'maria@caf.com'},
  {id:3,name:'Sam Wilson',   role:'Support Specialist',status:'On Leave',scans:212,perf:85, avatar:'👨‍🔧', email:'sam@caf.com'},
  {id:4,name:'Jordan Lee',   role:'Junior Tech',      status:'Active',   scans:56, perf:22, avatar:'👩‍🔧', email:'jordan@caf.com'},
];

// ── NAV ITEMS ─────────────────────────────────────────────────────────────────
const NAV = [
  {id:'access-points',  label:'ACCESS POINTS',  emoji:'📡'},
  {id:'channel-rating', label:'CHANNEL RATING', emoji:'⭐'},
  {id:'channel-graph',  label:'CHANNEL GRAPH',  emoji:'📊'},
  {id:'time-graph',     label:'TIME GRAPH',     emoji:'📈'},
  {id:'export',         label:'EXPORT',         emoji:'📄'},
  {id:'vendors',        label:'VENDORS',        emoji:'👥'},
  {id:'settings',       label:'SETTINGS',       emoji:'⚙️'},
  {id:'about',          label:'ABOUT',          emoji:'ℹ️'},
];

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn]     = useState(true);
  const [loginUser, setLoginUser]   = useState('admin');
  const [loginPass, setLoginPass]   = useState('');
  const [loginErr, setLoginErr]     = useState('');
  const [dark, setDark]             = useState(true);
  const [tab, setTab]               = useState('access-points');
  // Access Points
  const [auditEnv, setAuditEnv]     = useState('');
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditDone, setAuditDone]   = useState(false);
  const [locating, setLocating]     = useState(null);
  // Channel Rating
  const [ratingBand, setRatingBand] = useState('2.4 GHz');
  const [bandDrop, setBandDrop]     = useState(false);
  // Channel Graph
  const [graphBand, setGraphBand]   = useState('2.4');
  // Speed Test
  const [speedRunning, setSpeedRunning] = useState(false);
  const [speedResult, setSpeedResult]   = useState(null);
  const [speedProgress, setSpeedProgress] = useState(0);
  // Export
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportSearch, setReportSearch]     = useState('');
  // Vendors
  const [members, setMembers]       = useState(INIT_MEMBERS);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Junior Tech');
  const [inviteName, setInviteName] = useState('');
  // Settings
  const [accordion, setAccordion]   = useState({});
  const [notifs, setNotifs]         = useState(true);
  // Notifications
  const [toasts, setToasts]         = useState([]);

  const T = dark ? DARK : LIGHT;

  const toast = (msg, type='info') => {
    const id = Date.now();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500);
  };

  const doLogin = (e) => {
    e.preventDefault();
    if(loginUser==='admin' && loginPass==='admin123') { setLoggedIn(true); setLoginErr(''); }
    else setLoginErr('Invalid credentials. Use admin / admin123');
  };

  const startAudit = async () => {
    if(!auditEnv.trim()){ toast('Please enter an environment name','error'); return; }
    setAuditRunning(true); setAuditDone(false); setAuditProgress(0);
    for(let i=1;i<=20;i++){
      await new Promise(r=>setTimeout(r,150));
      setAuditProgress(i*5);
    }
    setAuditRunning(false); setAuditDone(true);
    toast(`✅ Audit complete for "${auditEnv}"! Found ${APS_DATA.length} networks.`,'success');
  };

  const locateAP = async (ssid) => {
    setLocating(ssid);
    await new Promise(r=>setTimeout(r,2000));
    setLocating(null);
    toast(`📍 AP "${ssid}" located successfully!`,'success');
  };

  const runSpeed = async () => {
    setSpeedRunning(true); setSpeedResult(null); setSpeedProgress(0);
    for(let i=1;i<=20;i++){
      await new Promise(r=>setTimeout(r,150));
      setSpeedProgress(i*5);
    }
    const result = { dl:Math.round(Math.random()*300+200), ul:Math.round(Math.random()*100+50), ping:Math.round(Math.random()*15+3) };
    setSpeedResult(result);
    setSpeedRunning(false);
    toast(`⚡ Speed test complete! ${result.dl} Mbps download`,'success');
  };

  const inviteMember = (e) => {
    e.preventDefault();
    if(!inviteEmail||!inviteName){ toast('Please fill all fields','error'); return; }
    const newMember = { id:Date.now(), name:inviteName, role:inviteRole, status:'Active', scans:0, perf:0, avatar:'👤', email:inviteEmail };
    setMembers(m=>[...m,newMember]);
    setShowInvite(false); setInviteEmail(''); setInviteName(''); setInviteRole('Junior Tech');
    toast(`✅ Invitation sent to ${inviteEmail}`,'success');
  };

  const removeMember = (id,name) => {
    setMembers(m=>m.filter(x=>x.id!==id));
    toast(`🗑️ ${name} removed from team`,'info');
  };

  const exportReport = (format, reportId) => {
    toast(`📥 Exporting ${reportId} as ${format}...`,'info');
    setTimeout(()=>toast(`✅ ${reportId}.${format.toLowerCase()} downloaded!`,'success'),1500);
  };

  const sigColor = (dbm) => dbm>=-60?T.green:dbm>=-75?T.yellow:T.red;
  const filteredReports = REPORTS.filter(r=>r.loc.toLowerCase().includes(reportSearch.toLowerCase())||r.id.toLowerCase().includes(reportSearch.toLowerCase()));

  // ── STYLES (theme-aware) ─────────────────────────────────────────────────
  const s = {
    app: { display:'flex', minHeight:'100vh', background:T.bg, color:T.text, fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", position:'relative' },
    sidebar: { width:'185px', minHeight:'100vh', background:T.sidebar, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', padding:'20px 12px', position:'sticky', top:0, height:'100vh', overflowY:'auto', flexShrink:0 },
    main: { flex:1, display:'flex', flexDirection:'column', overflow:'auto', minWidth:0 },
    topbar: { background:T.sidebar, borderBottom:`1px solid ${T.border}`, padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10 },
    content: { padding:'24px', flex:1 },
    logoWrap: { display:'flex', alignItems:'center', gap:'10px', marginBottom:'28px', padding:'0 4px' },
    navBtn: (a) => ({ display:'flex', alignItems:'center', gap:'9px', padding:'9px 12px', borderRadius:'8px', cursor:'pointer', border:'none', textAlign:'left', width:'100%', background: a?'linear-gradient(135deg,#1e40af,#2563eb)':'transparent', color: a?'#fff':T.muted, fontSize:'11px', fontWeight:'700', letterSpacing:'0.06em', transition:'all 0.15s', marginBottom:'2px' }),
    card: { background:T.card, border:`1px solid ${T.border}`, borderRadius:'12px', padding:'20px', marginBottom:'16px' },
    card2: { background:T.card2, border:`1px solid ${T.border}`, borderRadius:'10px', padding:'14px' },
    row: { background:T.card2, border:`1px solid ${T.border}`, borderRadius:'10px', padding:'14px 16px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'14px' },
    input: { background:T.card2, border:`1px solid ${T.border}`, color:T.text, padding:'10px 14px', borderRadius:'8px', fontSize:'13px', outline:'none', width:'100%', boxSizing:'border-box' },
    select: { background:T.card2, border:`1px solid ${T.border}`, color:T.text, padding:'10px 14px', borderRadius:'8px', fontSize:'13px', outline:'none', width:'100%', cursor:'pointer' },
    btn: (bg,tc) => ({ background:bg||T.blue, color:tc||'#fff', border:'none', padding:'9px 18px', borderRadius:'8px', cursor:'pointer', fontSize:'12px', fontWeight:'700', display:'inline-flex', alignItems:'center', gap:'6px', transition:'opacity 0.2s' }),
    btnGhost: { background:'transparent', border:`1px solid ${T.border}`, color:T.dim, padding:'8px 14px', borderRadius:'8px', cursor:'pointer', fontSize:'12px', fontWeight:'700', display:'inline-flex', alignItems:'center', gap:'6px' },
    table: { width:'100%', borderCollapse:'collapse' },
    th: { textAlign:'left', padding:'10px 14px', borderBottom:`1px solid ${T.border}`, color:T.muted, fontSize:'10px', letterSpacing:'0.08em', textTransform:'uppercase' },
    td: { padding:'12px 14px', borderBottom:`1px solid ${T.border}`, fontSize:'13px' },
    badge: (bg,tc) => ({ background:bg, color:tc, fontSize:'10px', fontWeight:'700', padding:'2px 9px', borderRadius:'20px', display:'inline-block' }),
    label: { fontSize:'10px', color:T.muted, letterSpacing:'0.08em', textTransform:'uppercase', display:'block', marginBottom:'4px' },
    statCard: { background:T.card, border:`1px solid ${T.border}`, borderRadius:'12px', padding:'18px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' },
    footer: { background:T.sidebar, borderTop:`1px solid ${T.border}`, padding:'8px 24px', display:'flex', justifyContent:'space-between', fontSize:'10px', color:T.border, letterSpacing:'0.06em', flexWrap:'wrap', gap:'4px' },
    overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:'16px' },
    modal: { background:T.card, border:`1px solid ${T.border}`, borderRadius:'14px', padding:'28px', maxWidth:'460px', width:'100%' },
    progressTrack: { background:T.border, borderRadius:'4px', height:'6px', overflow:'hidden', marginTop:'8px' },
    progressFill: (pct,color) => ({ width:`${pct}%`, height:'100%', background:color||T.blue, borderRadius:'4px', transition:'width 0.2s' }),
    accordion: { borderBottom:`1px solid ${T.border}` },
    accBtn: { width:'100%', background:'transparent', border:'none', color:T.text, padding:'15px 0', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', fontSize:'14px', fontWeight:'600', textAlign:'left' },
    toggle: (on) => ({ width:'44px', height:'24px', borderRadius:'12px', background:on?T.blue:T.border, cursor:'pointer', border:'none', position:'relative', transition:'background 0.2s', flexShrink:0 }),
    toggleDot: (on) => ({ position:'absolute', top:'3px', left:on?'23px':'3px', width:'18px', height:'18px', borderRadius:'50%', background:'#fff', transition:'left 0.2s' }),
  };

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  if(!loggedIn) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:T.bg}}>
      <div style={{...s.card,maxWidth:'400px',width:'90%',margin:'0 20px'}}>
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{width:'60px',height:'60px',background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',margin:'0 auto 16px'}}>📡</div>
          <h1 style={{fontSize:'22px',fontWeight:'800',marginBottom:'4px',color:T.text}}>NetPulse CAF</h1>
          <p style={{fontSize:'13px',color:T.muted}}>Enterprise WiFi Analyzer v3.0.0</p>
        </div>
        <form onSubmit={doLogin} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          {loginErr&&<div style={{background:'#7f1d1d',border:'1px solid #ef4444',color:'#fca5a5',padding:'10px 14px',borderRadius:'8px',fontSize:'12px'}}>{loginErr}</div>}
          <div>
            <label style={s.label}>Username</label>
            <input style={s.input} type="text" value={loginUser} onChange={e=>setLoginUser(e.target.value)} placeholder="admin" />
          </div>
          <div>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} placeholder="••••••••" />
          </div>
          <button style={{...s.btn(),justifyContent:'center',padding:'12px'}} type="submit">Sign In →</button>
        </form>
        <div style={{background:dark?'#1e3a5f22':'#eff6ff',border:`1px solid ${T.blue}44`,borderRadius:'8px',padding:'10px 14px',marginTop:'16px',fontSize:'12px',color:T.blue,textAlign:'center'}}>
          Demo credentials: <strong>admin</strong> / <strong>admin123</strong>
        </div>
      </div>
    </div>
  );

  // ── MAIN ──────────────────────────────────────────────────────────────────
  return (
    <div style={s.app}>
      {/* TOASTS */}
      <div style={{position:'fixed',top:'16px',right:'16px',zIndex:200,display:'flex',flexDirection:'column',gap:'8px',pointerEvents:'none'}}>
        {toasts.map(t=>(
          <div key={t.id} style={{background:t.type==='error'?'#7f1d1d':t.type==='success'?'#14532d':'#1e3a5f',border:`1px solid ${t.type==='error'?'#ef4444':t.type==='success'?'#22c55e':'#3b82f6'}`,color:'#fff',padding:'10px 16px',borderRadius:'10px',fontSize:'13px',fontWeight:'600',boxShadow:'0 4px 20px rgba(0,0,0,0.4)',maxWidth:'320px'}}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={s.logoWrap}>
          <div style={{width:'34px',height:'34px',background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>📡</div>
          <span style={{fontSize:'14px',fontWeight:'700',color:T.text}}>NetPulse CAF</span>
        </div>
        <nav style={{flex:1}}>
          {NAV.map(n=>(
            <button key={n.id} style={s.navBtn(tab===n.id)} onClick={()=>setTab(n.id)}>
              <span style={{fontSize:'13px'}}>{n.emoji}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <button style={{display:'flex',alignItems:'center',gap:'8px',background:'transparent',border:'none',color:'#ef4444',padding:'9px 12px',borderRadius:'8px',cursor:'pointer',fontSize:'11px',fontWeight:'700',width:'100%',marginTop:'8px'}} onClick={()=>setLoggedIn(false)}>
          🔓 LOGOUT
        </button>
      </aside>

      {/* MAIN */}
      <main style={s.main}>
        {/* TOPBAR */}
        <div style={s.topbar}>
          <span style={{fontSize:'12px',fontWeight:'700',letterSpacing:'0.1em',color:T.muted}}>
            {NAV.find(n=>n.id===tab)?.label}
          </span>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{background:dark?'#1e3a5f':'#eff6ff',border:`1px solid ${T.blue}`,color:T.blue,fontSize:'10px',fontWeight:'700',padding:'4px 10px',borderRadius:'20px',display:'flex',alignItems:'center',gap:'6px'}}>
              <div style={{width:'6px',height:'6px',borderRadius:'50%',background:T.blue}} />
              ARUBA ANALYSIS MODE
            </div>
            <button onClick={()=>setDark(d=>!d)} title="Toggle theme" style={{background:'transparent',border:'none',cursor:'pointer',fontSize:'18px',padding:'4px'}}>
              {dark?'☀️':'🌙'}
            </button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={s.content}>

          {/* ══ ACCESS POINTS ══ */}
          {tab==='access-points'&&(
            <div>
              {/* Live Connection */}
              <div style={{...s.card,borderColor:T.blue+'55'}}>
                <div style={{fontSize:'10px',letterSpacing:'0.12em',color:T.muted,marginBottom:'10px'}}>LIVE CONNECTION DIAGNOSTICS</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'8px',marginBottom:'12px'}}>
                  <div>
                    <div style={{fontSize:'22px',fontWeight:'800',marginBottom:'2px'}}>CAF-WIFI-5G</div>
                    <div style={{fontSize:'11px',color:T.muted}}>ARUBA NETWORKS | MAC: 00:0B:86:12:34:56</div>
                  </div>
                  <div style={{fontSize:'11px',color:T.muted,background:T.card2,padding:'4px 10px',borderRadius:'6px'}}>IP: 192.168.100.15</div>
                </div>
                <div style={{display:'flex',gap:'24px',flexWrap:'wrap'}}>
                  {[{v:'-45 dBm',l:'SIGNAL',c:T.green},{v:'CH 36',l:'5180 MHz',c:T.cyan},{v:'850 Mbps',l:'THROUGHPUT',c:T.blue},{v:'WPA3',l:'SECURITY',c:T.purple}].map(x=>(
                    <div key={x.l}><div style={{fontSize:'17px',fontWeight:'800',color:x.c}}>{x.v}</div><div style={{fontSize:'10px',color:T.muted,marginTop:'2px'}}>{x.l}</div></div>
                  ))}
                </div>
              </div>

              {/* Throttle Warning */}
              <div style={{background:dark?'#2d1515':'#fef2f2',border:`1px solid ${T.red}55`,borderRadius:'8px',padding:'10px 16px',marginBottom:'16px',color:T.yellow,fontSize:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
                ⚠️ WI-FI SCAN THROTTLING IS ACTIVE. ACCURACY MAY VARY.
              </div>

              {/* Audit */}
              <div style={s.card}>
                <div style={{fontSize:'10px',letterSpacing:'0.12em',color:T.muted,marginBottom:'10px'}}>⊙ AUDIT ENVIRONMENT</div>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                  <input style={{...s.input,flex:1,minWidth:'180px'}} placeholder="e.g., Data Center Rack B-12" value={auditEnv} onChange={e=>{setAuditEnv(e.target.value);setAuditDone(false);}} />
                  <button style={{...s.btn(auditRunning?T.muted:T.blue),opacity:auditRunning?0.6:1}} onClick={startAudit} disabled={auditRunning}>
                    {auditRunning?'⏳ SCANNING...':'▶ START SITE AUDIT'}
                  </button>
                </div>
                {auditRunning&&(
                  <div style={{marginTop:'12px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',color:T.muted,marginBottom:'4px'}}>
                      <span>Scanning networks...</span><span>{auditProgress}%</span>
                    </div>
                    <div style={s.progressTrack}><div style={s.progressFill(auditProgress,T.blue)} /></div>
                  </div>
                )}
                {auditDone&&(
                  <div style={{background:dark?'#14532d22':'#f0fdf4',border:`1px solid ${T.green}44`,borderRadius:'8px',padding:'10px 14px',marginTop:'12px',color:T.green,fontSize:'12px'}}>
                    ✅ Audit complete for <strong>"{auditEnv}"</strong> — {APS_DATA.length} networks discovered
                  </div>
                )}
              </div>

              {/* Discovery Registry */}
              <div style={s.card}>
                <div style={{fontSize:'10px',letterSpacing:'0.12em',color:T.muted,marginBottom:'14px'}}>⊙ DISCOVERY REGISTRY — {APS_DATA.length} NETWORKS FOUND</div>
                {APS_DATA.map((ap,i)=>(
                  <div key={i} style={s.row}>
                    <div style={{width:'42px',height:'42px',borderRadius:'10px',background:sigColor(ap.signal)+'22',color:sigColor(ap.signal),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'800',flexShrink:0}}>
                      {ap.ch}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:'700',fontSize:'14px',display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                        {ap.ssid}
                        {ap.vendor==='ARUBA NETWORKS'&&<span style={{fontSize:'9px',background:T.blue+'22',color:T.blue,padding:'1px 6px',borderRadius:'4px',fontWeight:'700'}}>ARUBA</span>}
                        <span style={{...s.badge(sigColor(ap.signal)+'22',sigColor(ap.signal)),fontSize:'9px'}}>{ap.quality}</span>
                      </div>
                      <div style={{fontSize:'11px',color:T.muted,marginTop:'2px'}}>{ap.vendor} · {ap.mac}</div>
                      <div style={{fontSize:'11px',marginTop:'2px'}}>
                        <span style={{color:sigColor(ap.signal),fontWeight:'700'}}>{ap.signal} dBm</span>
                        <span style={{color:T.muted}}> · {ap.freq}</span>
                      </div>
                    </div>
                    <button
                      style={{background:locating===ap.ssid?T.muted:T.card2,border:`1px solid ${T.border}`,color:T.dim,padding:'7px 14px',borderRadius:'8px',cursor:'pointer',fontSize:'11px',fontWeight:'700',flexShrink:0,opacity:locating&&locating!==ap.ssid?0.5:1}}
                      onClick={()=>locateAP(ap.ssid)}
                      disabled={!!locating}
                    >
                      {locating===ap.ssid?'⏳ Locating...':'📍 LOCATE AP'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ CHANNEL RATING ══ */}
          {tab==='channel-rating'&&(
            <div>
              <div style={{display:'flex',gap:'14px',flexWrap:'wrap',marginBottom:'16px',alignItems:'flex-start'}}>
                <div style={{...s.card,flex:1,minWidth:'220px',marginBottom:0,borderColor:T.blue+'44'}}>
                  <div style={{fontSize:'11px',color:T.blue,fontWeight:'700',marginBottom:'8px'}}>Current connection</div>
                  <div style={{fontWeight:'700',marginBottom:'4px'}}>CAF-WIFI-5G – 5G (00:0B:86:12:34:56)</div>
                  <div style={{color:T.green,fontWeight:'700',fontSize:'13px'}}>-45dBm · CH 36 · S180</div>
                  <div style={{color:T.cyan,fontSize:'12px',marginTop:'2px'}}>850Mbps · 192.168.100.15</div>
                  <div style={{background:dark?'#2d1a1a':'#fef2f2',border:`1px solid ${T.red}44`,borderRadius:'6px',padding:'6px 10px',marginTop:'10px',color:T.red,fontSize:'11px'}}>
                    ⊘ Wi-Fi scan throttling is enabled
                  </div>
                </div>
                {/* Band dropdown */}
                <div style={{position:'relative'}}>
                  <button onClick={()=>setBandDrop(d=>!d)} style={{...s.btn(T.card2,T.text),border:`1px solid ${T.border}`,padding:'10px 16px',minWidth:'130px',justifyContent:'space-between'}}>
                    {ratingBand} <span style={{marginLeft:'8px'}}>▾</span>
                  </button>
                  {bandDrop&&(
                    <div style={{position:'absolute',top:'44px',left:0,background:T.card,border:`1px solid ${T.border}`,borderRadius:'10px',overflow:'hidden',zIndex:30,minWidth:'140px',boxShadow:'0 8px 24px rgba(0,0,0,0.3)'}}>
                      {['2.4 GHz','5 GHz','6 GHz'].map(b=>(
                        <div key={b} onClick={()=>{setRatingBand(b);setBandDrop(false);}} style={{padding:'11px 16px',cursor:'pointer',fontSize:'13px',background:ratingBand===b?T.card2:'transparent',color:ratingBand===b?T.blue:T.text,fontWeight:ratingBand===b?'700':'400'}}>
                          {b}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={s.card}>
                <div style={{display:'flex',gap:'8px',marginBottom:'14px',flexWrap:'wrap',alignItems:'center'}}>
                  <span style={{fontSize:'12px',fontWeight:'700',color:T.cyan}}>BEST CHANNELS:</span>
                  <span style={{fontSize:'12px',color:T.blue}}>
                    {ratingBand==='2.4 GHz'?'20 MHz 2, 3, 4, 5, 7, 8, 9, 10, 11, 1':
                     ratingBand==='5 GHz'?'40 MHz 36, 40, 44, 48, 56, 60, 64, 100':
                     '80 MHz 1, 5, 9, 13, 17, 21'}
                  </span>
                </div>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>CHANNEL RATING</th>
                      <th style={s.th}>CHANNEL NUMBER</th>
                      <th style={s.th}>ACCESS POINT COUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(CHANNEL_RATINGS[ratingBand]||[]).map((r,i)=>(
                      <tr key={i}>
                        <td style={s.td}><span style={{color:T.yellow,letterSpacing:'2px'}}>{'★'.repeat(r.stars)}{'☆'.repeat(10-r.stars)}</span></td>
                        <td style={{...s.td,color:T.cyan,fontWeight:'700'}}>{r.ch} <span style={{color:T.muted,fontSize:'11px'}}>20 MHz</span></td>
                        <td style={{...s.td,color:r.nets>0?T.yellow:T.muted}}>{r.nets}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{background:dark?'#0d1f35':'#eff6ff',border:`1px solid ${T.blue}33`,borderRadius:'8px',padding:'14px',marginTop:'16px'}}>
                  <div style={{fontSize:'11px',fontWeight:'700',color:T.blue,marginBottom:'6px'}}>⊙ System Recommendation:</div>
                  <div style={{fontSize:'12px',color:T.dim,lineHeight:'1.6'}}>
                    {ratingBand==='2.4 GHz'?'Channels with fewer than 2 APs are prioritized. Avoid overlapping channels (2,3,4,5) in the 2.4GHz spectrum for stability.':
                     ratingBand==='5 GHz'?'5GHz provides higher throughput with less congestion. Channels 36-48 and 149-165 avoid DFS restrictions in most regions.':
                     '6GHz band offers the best performance with the lowest interference. Recommended for high-density deployments with Wi-Fi 6E devices.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ CHANNEL GRAPH ══ */}
          {tab==='channel-graph'&&(
            <div>
              {/* Stat cards */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'14px',marginBottom:'20px'}}>
                {[{l:'CAF NETWORKS',v:'6',i:'📡',t:'+2.5% from last scan'},{l:'ACTIVE APS',v:'18',i:'🔗',t:'+2.6% from last scan'},{l:'AVG SIGNAL',v:'-52 dBm',i:'📶',t:'+2.5% from last scan'},{l:'NETWORK HEALTH',v:'98%',i:'🛡️',t:'+2.5% from last scan'}].map((x,i)=>(
                  <div key={i} style={s.statCard}>
                    <div>
                      <div style={{fontSize:'10px',color:T.muted,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'6px'}}>{x.l}</div>
                      <div style={{fontSize:'24px',fontWeight:'800',color:T.blue,marginBottom:'2px'}}>{x.v}</div>
                      <div style={{fontSize:'11px',color:T.green}}>↑ {x.t}</div>
                    </div>
                    <div style={{fontSize:'22px',opacity:0.5}}>{x.i}</div>
                  </div>
                ))}
              </div>

              {/* Spectrum */}
              <div style={s.card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'14px',flexWrap:'wrap',gap:'10px'}}>
                  <div>
                    <div style={{fontWeight:'700',fontSize:'15px',marginBottom:'3px'}}>≈ Channel Spectrum Graph</div>
                    <div style={{fontSize:'12px',color:T.muted}}>Visualizing signal overlap and channel congestion</div>
                  </div>
                  <div style={{display:'flex',gap:'8px'}}>
                    {['2.4','5'].map(b=>(
                      <button key={b} onClick={()=>setGraphBand(b)} style={{background:graphBand===b?T.blue:T.card2,border:`1px solid ${T.border}`,color:graphBand===b?'#fff':T.muted,padding:'5px 14px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'700'}}>
                        {b} GHz
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={graphBand==='2.4'?SPECTRUM_24:SPECTRUM_5} margin={{top:10,right:10,left:0,bottom:20}}>
                    <defs>
                      <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={T.cyan} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={T.cyan} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                    <XAxis dataKey="ch" tick={{fill:T.muted,fontSize:11}} label={{value:'WiFi Channels',position:'insideBottom',offset:-10,fill:T.muted,fontSize:11}} />
                    <YAxis tick={{fill:T.muted,fontSize:11}} label={{value:'Signal Strength (dBm)',angle:-90,position:'insideLeft',fill:T.muted,fontSize:10}} />
                    <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}} />
                    <Area type="monotone" dataKey="v" stroke={T.cyan} fill="url(#sg)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'16px'}}>
                <div style={{...s.card,marginBottom:0}}>
                  <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'3px'}}>≋ SSID Bandwidth Distribution</div>
                  <div style={{fontSize:'11px',color:T.muted,marginBottom:'12px'}}>Throughput capacity (Mbps)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={SSID_BW} layout="vertical" margin={{left:10}}>
                      <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                      <XAxis type="number" tick={{fill:T.muted,fontSize:10}} />
                      <YAxis dataKey="name" type="category" width={85} tick={{fill:T.muted,fontSize:10}} />
                      <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}} />
                      <Bar dataKey="v" fill={T.blue} radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{...s.card,marginBottom:0}}>
                  <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'3px'}}>⚠ Interference Analysis</div>
                  <div style={{fontSize:'11px',color:T.muted,marginBottom:'12px'}}>Estimated interference (0–100)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={INTERFERENCE}>
                      <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{fill:T.muted,fontSize:9}} />
                      <YAxis tick={{fill:T.muted,fontSize:10}} domain={[0,100]} />
                      <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}} />
                      <Bar dataKey="v" fill={T.yellow} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                <div style={{...s.card,marginBottom:0}}>
                  <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'12px'}}>Signal Strength Comparison</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={SIG_STRENGTH}>
                      <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{fill:T.muted,fontSize:9}} />
                      <YAxis tick={{fill:T.muted,fontSize:10}} />
                      <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}} />
                      <Bar dataKey="v" fill={T.purple} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{...s.card,marginBottom:0}}>
                  <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'12px'}}>Network Type Distribution</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={NET_TYPES} cx="50%" cy="50%" outerRadius={72} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:T.muted}} fontSize={11}>
                        {NET_TYPES.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ══ TIME GRAPH ══ */}
          {tab==='time-graph'&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:'20px',alignItems:'start'}}>
              <div>
                <div style={s.card}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'14px',flexWrap:'wrap',gap:'10px'}}>
                    <div>
                      <div style={{fontWeight:'700',fontSize:'15px',marginBottom:'3px'}}>Speed Test History</div>
                      <div style={{fontSize:'12px',color:T.muted}}>Network throughput over the last 24 hours</div>
                    </div>
                    <div style={{display:'flex',gap:'12px',fontSize:'12px'}}>
                      {[{c:T.blue,l:'Download'},{c:T.cyan,l:'Upload'}].map(x=>(
                        <span key={x.l} style={{display:'flex',alignItems:'center',gap:'4px',color:x.c}}>
                          <span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:x.c}} />{x.l}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={SPEED_HISTORY}>
                      <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                      <XAxis dataKey="t" tick={{fill:T.muted,fontSize:11}} />
                      <YAxis tick={{fill:T.muted,fontSize:11}} unit="Mbps" />
                      <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}} formatter={(v,n)=>[`${v} Mbps`,n]} />
                      <Line type="monotone" dataKey="dl" stroke={T.blue} strokeWidth={2} dot={{fill:T.blue,r:3}} name="Download" />
                      <Line type="monotone" dataKey="ul" stroke={T.cyan} strokeWidth={2} dot={{fill:T.cyan,r:3}} name="Upload" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={s.card}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'14px'}}>
                    <div>
                      <div style={{fontWeight:'700',fontSize:'15px',marginBottom:'3px'}}>Weekly Activity Trends</div>
                      <div style={{fontSize:'12px',color:T.muted}}>Network scan volume and identified events</div>
                    </div>
                    <span style={{color:T.green,fontSize:'20px'}}>↗</span>
                  </div>
                  <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
                    <div style={{flex:1,minWidth:'200px'}}>
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={WEEKLY}>
                          <defs>
                            <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={T.blue} stopOpacity={0.5}/><stop offset="95%" stopColor={T.blue} stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="we" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={T.yellow} stopOpacity={0.4}/><stop offset="95%" stopColor={T.yellow} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                          <XAxis dataKey="d" tick={{fill:T.muted,fontSize:11}} />
                          <YAxis tick={{fill:T.muted,fontSize:11}} />
                          <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}} />
                          <Area type="monotone" dataKey="v" stroke={T.blue} fill="url(#wg)" strokeWidth={2} />
                          <Area type="monotone" dataKey="e" stroke={T.yellow} fill="url(#we)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',minWidth:'260px'}}>
                      {[{l:'AVG DOWNLOAD',v:'452.4 Mbps',t:'+12% vs last week',c:T.green,i:'📥'},{l:'AVG UPLOAD',v:'215.8 Mbps',t:'+5% vs last week',c:T.green,i:'📤'},{l:'AVG LATENCY',v:'11.5 ms',t:'-2ms vs last week',c:T.red,i:'⚡'},{l:'STABILITY',v:'94.2%',t:'+0.5% vs last week',c:T.green,i:'🔋'}].map(x=>(
                        <div key={x.l} style={{background:T.card2,borderRadius:'8px',padding:'10px 12px'}}>
                          <div style={{fontSize:'9px',color:T.muted,marginBottom:'4px',letterSpacing:'0.08em'}}>{x.l}</div>
                          <div style={{fontSize:'15px',fontWeight:'800',marginBottom:'2px'}}>{x.v}</div>
                          <div style={{fontSize:'10px',color:x.c}}>{x.t}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Speed Test Panel */}
              <div style={{...s.card,position:'sticky',top:'60px'}}>
                <div style={{fontWeight:'700',fontSize:'15px',marginBottom:'3px'}}>⚡ Active Speed Test</div>
                <div style={{fontSize:'12px',color:T.muted,marginBottom:'20px'}}>Measure real-time bandwidth</div>

                {!speedResult&&!speedRunning&&(
                  <div style={{textAlign:'center',padding:'20px 0'}}>
                    <div style={{fontSize:'40px',marginBottom:'12px',opacity:0.3}}>〜</div>
                    <div style={{fontSize:'12px',color:T.muted,marginBottom:'20px',lineHeight:'1.6'}}>Perform a throughput check on your current CAF connection.</div>
                    <button style={{...s.btn(T.card2,T.text),border:`1px solid ${T.border}`,width:'100%',justifyContent:'center',padding:'11px'}} onClick={runSpeed}>
                      ▶ Start Speed Test
                    </button>
                  </div>
                )}

                {speedRunning&&(
                  <div style={{textAlign:'center',padding:'10px 0'}}>
                    <div style={{fontSize:'32px',marginBottom:'12px'}}>⏳</div>
                    <div style={{fontSize:'12px',color:T.muted,marginBottom:'12px'}}>Testing your connection...</div>
                    <div style={s.progressTrack}><div style={s.progressFill(speedProgress,T.blue)} /></div>
                    <div style={{fontSize:'11px',color:T.muted,marginTop:'6px'}}>{speedProgress}%</div>
                  </div>
                )}

                {speedResult&&(
                  <div>
                    <div style={{background:dark?'#0d2040':'#eff6ff',border:`1px solid ${T.blue}44`,borderRadius:'10px',padding:'16px',textAlign:'center',marginBottom:'12px'}}>
                      <div style={{fontSize:'10px',color:T.muted,marginBottom:'4px',letterSpacing:'0.1em'}}>DOWNLOAD SPEED</div>
                      <div style={{fontSize:'32px',fontWeight:'800',color:T.blue}}>{speedResult.dl}</div>
                      <div style={{fontSize:'14px',color:T.blue}}>Mbps</div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                      {[{l:'UPLOAD',v:speedResult.ul,u:'Mbps',c:T.cyan},{l:'LATENCY',v:speedResult.ping,u:'ms',c:T.yellow}].map(x=>(
                        <div key={x.l} style={{background:T.card2,borderRadius:'8px',padding:'12px',textAlign:'center'}}>
                          <div style={{fontSize:'9px',color:T.muted,marginBottom:'4px'}}>{x.l}</div>
                          <div style={{fontSize:'20px',fontWeight:'800',color:x.c}}>{x.v}</div>
                          <div style={{fontSize:'11px',color:T.muted}}>{x.u}</div>
                        </div>
                      ))}
                    </div>
                    <button style={{...s.btn(T.card2,T.text),border:`1px solid ${T.border}`,width:'100%',justifyContent:'center'}} onClick={()=>setSpeedResult(null)}>
                      Run Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ EXPORT ══ */}
          {tab==='export'&&(
            <div>
              {selectedReport ? (
                <div>
                  <button style={{...s.btnGhost,marginBottom:'16px'}} onClick={()=>setSelectedReport(null)}>← Back to Reports</button>
                  <div style={s.card}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
                      <div>
                        <div style={{fontSize:'10px',color:T.blue,fontWeight:'700',marginBottom:'4px'}}>{selectedReport.id}</div>
                        <div style={{fontSize:'20px',fontWeight:'800',marginBottom:'4px'}}>{selectedReport.loc}</div>
                        <div style={{fontSize:'12px',color:T.muted}}>{selectedReport.date} · {selectedReport.nets} networks detected</div>
                      </div>
                      <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                        <button style={s.btn(T.blue)} onClick={()=>exportReport('PDF',selectedReport.id)}>📄 Export PDF</button>
                        <button style={s.btn(T.green)} onClick={()=>exportReport('CSV',selectedReport.id)}>📊 Export CSV</button>
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:'12px',marginBottom:'20px'}}>
                      {[{l:'Networks',v:selectedReport.nets},{l:'Avg Signal',v:selectedReport.signal},{l:'Date',v:selectedReport.date},{l:'Status',v:'Complete'}].map(x=>(
                        <div key={x.l} style={{background:T.card2,borderRadius:'8px',padding:'12px',textAlign:'center'}}>
                          <div style={{fontSize:'16px',fontWeight:'800',color:T.blue}}>{x.v}</div>
                          <div style={{fontSize:'10px',color:T.muted,marginTop:'2px'}}>{x.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:'12px',fontWeight:'700',color:T.muted,marginBottom:'10px'}}>NETWORKS FOUND</div>
                    {selectedReport.networks.map((n,i)=>(
                      <div key={i} style={s.row}>
                        <div style={{width:'8px',height:'8px',borderRadius:'50%',background:sigColor(n.sig),flexShrink:0}} />
                        <span style={{fontWeight:'600'}}>{n.name}</span>
                        <span style={{marginLeft:'auto',color:sigColor(n.sig),fontWeight:'700'}}>{n.sig} dBm</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={s.card}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
                    <div>
                      <div style={{fontSize:'18px',fontWeight:'800',marginBottom:'4px'}}>Audit Reports Registry</div>
                      <div style={{fontSize:'12px',color:T.muted}}>Manage and export your CAF network scan history</div>
                    </div>
                    <input style={{...s.input,width:'220px'}} placeholder="🔍 Search reports..." value={reportSearch} onChange={e=>setReportSearch(e.target.value)} />
                  </div>
                  <table style={s.table}>
                    <thead>
                      <tr>{['Report ID','Location','Date','Networks','Avg Signal','Action'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredReports.length===0
                        ? <tr><td colSpan={6} style={{...s.td,textAlign:'center',color:T.muted}}>No reports found</td></tr>
                        : filteredReports.map((r,i)=>(
                          <tr key={i}>
                            <td style={{...s.td,color:T.blue,fontWeight:'700'}}>{r.id}</td>
                            <td style={s.td}>{r.loc}</td>
                            <td style={{...s.td,color:T.muted}}>{r.date}</td>
                            <td style={s.td}>{r.nets} detected</td>
                            <td style={s.td}><span style={{background:r.sigColor+'22',color:r.sigColor,padding:'3px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'700'}}>{r.signal}</span></td>
                            <td style={s.td}>
                              <div style={{display:'flex',gap:'6px'}}>
                                <button style={{background:'transparent',border:'none',color:T.blue,cursor:'pointer',fontSize:'12px',fontWeight:'700'}} onClick={()=>setSelectedReport(r)}>👁 View</button>
                                <button style={{background:'transparent',border:'none',color:T.green,cursor:'pointer',fontSize:'12px',fontWeight:'700'}} onClick={()=>exportReport('PDF',r.id)}>📄 PDF</button>
                                <button style={{background:'transparent',border:'none',color:T.yellow,cursor:'pointer',fontSize:'12px',fontWeight:'700'}} onClick={()=>exportReport('CSV',r.id)}>📊 CSV</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══ VENDORS ══ */}
          {tab==='vendors'&&(
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
                <div>
                  <div style={{fontSize:'20px',fontWeight:'800',marginBottom:'4px'}}>Organization Management</div>
                  <div style={{fontSize:'12px',color:T.muted}}>Monitor team performance and system access</div>
                </div>
                <button style={s.btn()} onClick={()=>setShowInvite(true)}>👥 Invite Member</button>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'14px',marginBottom:'20px'}}>
                {[{l:'SECURITY EVENTS',v:'0',sub:'All systems secured',c:T.green},{l:'ORG MONTHLY SCANS',v:'1,248',sub:'On track for target',c:T.green},{l:'SYS UPTIME',v:'99.98%',sub:'Last incident: 24 days ago',c:T.muted}].map((x,i)=>(
                  <div key={i} style={s.card2}>
                    <div style={{fontSize:'10px',color:T.muted,letterSpacing:'0.1em',marginBottom:'6px'}}>{x.l}</div>
                    <div style={{fontSize:'22px',fontWeight:'800',marginBottom:'4px'}}>{x.v}</div>
                    <div style={{fontSize:'11px',color:x.c}}>{x.sub}</div>
                  </div>
                ))}
              </div>

              {showInvite&&(
                <div style={s.overlay}>
                  <div style={s.modal}>
                    <div style={{fontSize:'18px',fontWeight:'700',marginBottom:'20px'}}>Invite Team Member</div>
                    <form onSubmit={inviteMember} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                      <div><label style={s.label}>Full Name</label><input style={s.input} placeholder="e.g. John Smith" value={inviteName} onChange={e=>setInviteName(e.target.value)} /></div>
                      <div><label style={s.label}>Email Address</label><input style={s.input} type="email" placeholder="user@company.com" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} /></div>
                      <div>
                        <label style={s.label}>Role</label>
                        <select style={s.select} value={inviteRole} onChange={e=>setInviteRole(e.target.value)}>
                          {['Junior Tech','Senior Tech','Network Admin','Support Specialist','Manager'].map(r=><option key={r}>{r}</option>)}
                        </select>
                      </div>
                      <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                        <button type="submit" style={{...s.btn(),flex:1,justifyContent:'center'}}>Send Invite</button>
                        <button type="button" style={{...s.btn(T.card2,T.text),border:`1px solid ${T.border}`,flex:1,justifyContent:'center'}} onClick={()=>setShowInvite(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div style={s.card}>
                <div style={{fontSize:'15px',fontWeight:'700',marginBottom:'4px'}}>Team Members</div>
                <div style={{fontSize:'12px',color:T.muted,marginBottom:'14px'}}>Performance tracking for field technicians</div>
                <table style={s.table}>
                  <thead>
                    <tr>{['Member','Role','Status','Lifetime Scans','Performance','Actions'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {members.map((m,i)=>(
                      <tr key={i}>
                        <td style={s.td}>
                          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                            <div style={{width:'34px',height:'34px',borderRadius:'50%',background:T.card2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>{m.avatar}</div>
                            <div><div style={{fontWeight:'600'}}>{m.name}</div><div style={{fontSize:'11px',color:T.muted}}>{m.email}</div></div>
                          </div>
                        </td>
                        <td style={{...s.td,color:T.muted}}>{m.role}</td>
                        <td style={s.td}><span style={s.badge(m.status==='Active'?T.green+'22':T.yellow+'22',m.status==='Active'?T.green:T.yellow)}>{m.status}</span></td>
                        <td style={s.td}>{m.scans}</td>
                        <td style={{...s.td,minWidth:'130px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                            <div style={{flex:1,background:T.card2,borderRadius:'4px',height:'6px',overflow:'hidden'}}>
                              <div style={{width:`${m.perf}%`,height:'100%',background:T.blue,borderRadius:'4px'}} />
                            </div>
                            <span style={{fontSize:'11px',color:T.muted,minWidth:'28px'}}>{m.perf}%</span>
                          </div>
                        </td>
                        <td style={s.td}>
                          <button style={{background:'transparent',border:'none',color:T.red,cursor:'pointer',fontSize:'12px',fontWeight:'700'}} onClick={()=>removeMember(m.id,m.name)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ SETTINGS ══ */}
          {tab==='settings'&&(
            <div style={{maxWidth:'720px'}}>
              <div style={{...s.card}}>
                <div style={{fontSize:'16px',fontWeight:'700',marginBottom:'4px'}}>Appearance & Preferences</div>
                <div style={{fontSize:'12px',color:T.muted,marginBottom:'18px'}}>Customize your analyzer workspace</div>
                {[
                  {icon:'🌙',l:'Dark Mode',sub:'Adjust display for low-light environments',state:dark,toggle:()=>setDark(d=>!d)},
                  {icon:'🔔',l:'Real-time Notifications',sub:'Alerts for critical signal interference',state:notifs,toggle:()=>setNotifs(n=>!n)},
                ].map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'14px',padding:'14px',border:`1px solid ${T.border}`,borderRadius:'10px',marginBottom:'10px'}}>
                    <div style={{width:'40px',height:'40px',background:T.card2,borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>{item.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:'600',fontSize:'14px'}}>{item.l}</div>
                      <div style={{fontSize:'12px',color:T.muted}}>{item.sub}</div>
                    </div>
                    <button style={s.toggle(item.state)} onClick={item.toggle}>
                      <div style={s.toggleDot(item.state)} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={s.card}>
                <div style={{fontSize:'16px',fontWeight:'700',marginBottom:'18px'}}>❓ Help & Instructions</div>
                {[
                  {l:'Getting Started',c:'1. Connect to WiFi  2. Enter environment name  3. Click "Start Site Audit"  4. Wait for scan to complete  5. Review discovered networks in the registry.'},
                  {l:'How to Scan Properly',c:'Ensure you are within range of target APs. Walk slowly across the area. Keep the device at chest height. Avoid metal obstructions. Run multiple scans for accuracy.'},
                  {l:'Multi-Platform Compatibility',c:'Optimized for Chrome 90+, Firefox 88+, Safari 14+, and Edge 90+. Mobile responsive for iOS 14+ and Android 10+. Minimum 1024×768 resolution recommended.'},
                ].map((item,i)=>(
                  <div key={i} style={s.accordion}>
                    <button style={s.accBtn} onClick={()=>setAccordion(a=>({...a,[i]:!a[i]}))}>
                      {item.l}
                      <span style={{color:T.muted,fontSize:'12px'}}>{accordion[i]?'▲':'▼'}</span>
                    </button>
                    {accordion[i]&&<div style={{fontSize:'13px',color:T.muted,paddingBottom:'14px',lineHeight:'1.8'}}>{item.c}</div>}
                  </div>
                ))}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                <div style={s.card}>
                  <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'14px'}}>System Information</div>
                  {[{l:'APP VERSION',v:'v3.0.0 Enterprise'},{l:'DATABASE',v:'Firebase Firestore'}].map((r,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
                      <div style={{width:'32px',height:'32px',background:T.card2,borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>📋</div>
                      <div><div style={{fontSize:'9px',color:T.muted,letterSpacing:'0.1em'}}>{r.l}</div><div style={{fontWeight:'700',fontSize:'13px'}}>{r.v}</div></div>
                    </div>
                  ))}
                  <div style={{background:T.card2,borderRadius:'8px',padding:'12px',marginTop:'4px'}}>
                    <div style={{fontSize:'10px',color:T.muted,marginBottom:'6px',letterSpacing:'0.08em'}}>SUPPORTED STANDARDS</div>
                    <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                      {['WiFi 6E','WiFi 6','WPA3','802.11ax'].map(x=>(
                        <span key={x} style={s.badge(T.blue+'22',T.blue)}>{x}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={s.card}>
                  <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'14px'}}>Development Support</div>
                  <div style={{fontSize:'12px',color:T.muted,marginBottom:'12px'}}>Contact for technical inquiries</div>
                  {[{icon:'👤',l:'Hany Bkhite',sub:'Senior Developer'},{icon:'✉️',l:'EMAIL SUPPORT',sub:'hany.bkhite@gdit.com'}].map((x,i)=>(
                    <div key={i} style={{border:`1px solid ${T.border}`,borderRadius:'8px',padding:'12px',marginBottom:'8px',display:'flex',gap:'10px',alignItems:'center'}}>
                      <span style={{fontSize:'20px'}}>{x.icon}</span>
                      <div><div style={{fontWeight:'600',fontSize:'13px'}}>{x.l}</div><div style={{fontSize:'11px',color:T.muted}}>{x.sub}</div></div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{textAlign:'center',fontSize:'12px',color:T.muted,marginTop:'16px'}}>© 2024 CAF-WIFI Operations | NetPulse Infrastructure</div>
            </div>
          )}

          {/* ══ ABOUT ══ */}
          {tab==='about'&&(
            <div style={{maxWidth:'760px',margin:'0 auto',textAlign:'center'}}>
              <div style={{width:'72px',height:'72px',background:'linear-gradient(135deg,#1e3a5f,#1e40af)',border:`2px solid ${T.blue}`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',margin:'0 auto 20px'}}>📡</div>
              <div style={{fontSize:'30px',fontWeight:'800',marginBottom:'8px'}}>NetPulse CAF Analyzer</div>
              <div style={{fontSize:'14px',color:T.muted,marginBottom:'40px'}}>v3.0.0 Enterprise Infrastructure Monitoring</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
                {[{i:'🛡️',l:'Secure Analysis',t:'Designed specifically for high-security environments, NetPulse provides real-time spectral analysis of CAF-WIFI networks without compromising endpoint security.'},{i:'📡',l:'Aruba Optimized',t:'Deep integration with Aruba Access Point hardware enables specialized features like hidden AP tracking and automated channel optimization.'}].map((x,i)=>(
                  <div key={i} style={{...s.card,textAlign:'left',marginBottom:0}}>
                    <div style={{fontSize:'24px',marginBottom:'10px'}}>{x.i}</div>
                    <div style={{fontWeight:'700',fontSize:'15px',marginBottom:'8px'}}>{x.l}</div>
                    <div style={{fontSize:'13px',color:T.muted,lineHeight:'1.6'}}>{x.t}</div>
                  </div>
                ))}
              </div>
              <div style={{...s.card,textAlign:'center',marginBottom:'24px'}}>
                <div style={{fontSize:'24px',marginBottom:'10px'}}>🌐</div>
                <div style={{fontWeight:'700',fontSize:'16px',marginBottom:'8px'}}>Global Deployment</div>
                <div style={{fontSize:'13px',color:T.muted,lineHeight:'1.7',maxWidth:'480px',margin:'0 auto'}}>Used by field technicians across multiple continents to ensure reliable connectivity for the modern mobile workforce. Developed and maintained by the GDIT Engineering Team.</div>
              </div>
              <div style={{fontSize:'12px',color:T.muted}}>© 2024 CAF-WIFI Operations | All Rights Reserved</div>
              <div style={{fontSize:'11px',color:T.border,marginTop:'4px'}}>GDIT-CAF-NETPULSE-v3-PROD</div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div style={s.footer}>
          <span>SYSTEM: v3.0.0-ENTERPRISE-PROD &nbsp;|&nbsp; STATE: <span style={{color:T.green}}>SECUREOPS</span></span>
          <span>ENCRYPTION: AES-256-FIPS &nbsp;|&nbsp; ENGINE: NETPULSE-X-ARUBA</span>
        </div>
      </main>
    </div>
  );
}
