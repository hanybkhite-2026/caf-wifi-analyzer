'use client';
import { useState, useRef } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DARK={bg:'#0a0f1e',sidebar:'#0d1526',card:'#111827',card2:'#1a2235',border:'#1e2d45',blue:'#3b82f6',cyan:'#06b6d4',green:'#22c55e',yellow:'#f59e0b',red:'#ef4444',purple:'#a855f7',text:'#e2e8f0',muted:'#64748b'};
const LIGHT={bg:'#f1f5f9',sidebar:'#ffffff',card:'#ffffff',card2:'#f8fafc',border:'#e2e8f0',blue:'#2563eb',cyan:'#0891b2',green:'#16a34a',yellow:'#d97706',red:'#dc2626',purple:'#9333ea',text:'#0f172a',muted:'#64748b'};

const APS=[
  {ssid:'CAF-WIFI-5G', signal:-45,ch:36, bw:80, mac:'00:0B:86:12:34:56',vendor:'ARUBA NETWORKS',   color:'#3b82f6',band:'5'},
  {ssid:'CAF-WIFI-2G', signal:-67,ch:6,  bw:20, mac:'00:0B:86:78:90:AB',vendor:'ARUBA NETWORKS',   color:'#22c55e',band:'2.4'},
  {ssid:'CAF-GUEST',   signal:-79,ch:52, bw:80, mac:'00:0B:86:CD:EF:01',vendor:'ARUBA NETWORKS',   color:'#a855f7',band:'5'},
  {ssid:'VTEL-Fiber',  signal:-85,ch:1,  bw:20, mac:'7c:1c:f1:25:19:2c',vendor:'HUAWEI TECHNOLOGIES',color:'#f59e0b',band:'2.4'},
  {ssid:'Mamon2_5G',   signal:-86,ch:128,bw:80, mac:'98:da:c4:26:21:87',vendor:'TP-LINK TECHNOLOGIES',color:'#ef4444',band:'5'},
  {ssid:'*hidden*',    signal:-87,ch:6,  bw:20, mac:'9e:da:c4:26:21:87',vendor:'GENERIC VENDOR',   color:'#f59e0b',band:'2.4'},
];

const SPEED_HIST=[{t:'10:00',dl:420,ul:180},{t:'12:00',dl:460,ul:195},{t:'14:00',dl:480,ul:200},{t:'16:00',dl:470,ul:190},{t:'18:00',dl:500,ul:215},{t:'20:00',dl:455,ul:188},{t:'22:00',dl:450,ul:190}];
const WEEKLY=[{d:'Mon',v:35,e:12},{d:'Tue',v:42,e:15},{d:'Wed',v:55,e:18},{d:'Thu',v:68,e:25},{d:'Fri',v:45,e:14},{d:'Sat',v:30,e:10},{d:'Sun',v:25,e:8}];
const SSID_BW=[{name:'CAF-WIFI-5G',v:850},{name:'CAF-WIFI-2G',v:300},{name:'CAF-GUEST',v:450},{name:'VTEL-Fiber',v:120},{name:'Mamon2_5G',v:680},{name:'*hidden*',v:200}];
const INTERFERENCE=[{name:'CAF-WIFI-5G',v:15},{name:'CAF-WIFI-2G',v:40},{name:'CAF-GUEST',v:25},{name:'VTEL-Fiber',v:80},{name:'Mamon2_5G',v:10},{name:'*hidden*',v:50}];
const NET_TYPES=[{name:'Main',value:40},{name:'Guest',value:25},{name:'IoT',value:20},{name:'Admin',value:15}];
const PIE_COLORS=['#3b82f6','#06b6d4','#a855f7','#f59e0b'];
const CHANNEL_RATINGS={'2.4 GHz':[{ch:2,stars:10,nets:0},{ch:3,stars:10,nets:0},{ch:4,stars:10,nets:0},{ch:5,stars:10,nets:0},{ch:7,stars:10,nets:0},{ch:8,stars:10,nets:0},{ch:9,stars:10,nets:0},{ch:10,stars:10,nets:0},{ch:11,stars:10,nets:0},{ch:1,stars:9,nets:1},{ch:6,stars:8,nets:1}],'5 GHz':[{ch:36,stars:10,nets:1},{ch:40,stars:10,nets:0},{ch:44,stars:10,nets:0},{ch:48,stars:10,nets:0},{ch:52,stars:9,nets:1},{ch:149,stars:10,nets:0}],'6 GHz':[{ch:1,stars:10,nets:0},{ch:5,stars:10,nets:0},{ch:9,stars:10,nets:0}]};
const REPORTS=[{id:'REP-001',loc:'Main Campus - Wing A',date:'2024-05-15',nets:12,signal:'-52 dBm',sigColor:'#22c55e',networks:[{name:'CAF-WIFI-5G',sig:-45},{name:'CAF-WIFI-2G',sig:-67}]},{id:'REP-002',loc:'Basement Storage',date:'2024-05-18',nets:8,signal:'-68 dBm',sigColor:'#f59e0b',networks:[{name:'VTEL-Fiber',sig:-85}]},{id:'REP-003',loc:'Executive Suite',date:'2024-05-20',nets:15,signal:'-45 dBm',sigColor:'#22c55e',networks:[{name:'CAF-WIFI-5G',sig:-45}]}];
const INIT_MEMBERS=[{id:1,name:'Alex Johnson',role:'Senior Tech',status:'Active',scans:145,perf:58,avatar:'👨‍💻',email:'alex@caf.com'},{id:2,name:'Maria Garcia',role:'Network Admin',status:'Active',scans:89,perf:38,avatar:'👩‍💻',email:'maria@caf.com'},{id:3,name:'Sam Wilson',role:'Support Specialist',status:'On Leave',scans:212,perf:85,avatar:'👨‍🔧',email:'sam@caf.com'},{id:4,name:'Jordan Lee',role:'Junior Tech',status:'Active',scans:56,perf:22,avatar:'👩‍🔧',email:'jordan@caf.com'}];
const NAV=[{id:'access-points',label:'Access Points',emoji:'📡'},{id:'channel-rating',label:'Channel Rating',emoji:'⭐'},{id:'channel-graph',label:'Channel Graph',emoji:'📊'},{id:'time-graph',label:'Time Graph',emoji:'📈'},{id:'export',label:'Export',emoji:'📄'},{id:'vendors',label:'Vendors',emoji:'👥'},{id:'settings',label:'Settings',emoji:'⚙️'},{id:'about',label:'About',emoji:'ℹ️'}];

// ── WIFI SPECTRUM CHART (real hump visualization) ─────────────────────────
function WifiSpectrum({ band, T }) {
  const width = 340, height = 260;
  const padL = 50, padR = 10, padT = 30, padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const dbmMin = -100, dbmMax = -20;
  const aps = APS.filter(a => a.band === band);

  // Channel range
  const chMin = band === '2.4' ? 1 : 34;
  const chMax = band === '2.4' ? 13 : 177;
  const chRange = chMax - chMin;

  const chToX = (ch) => padL + ((ch - chMin) / chRange) * chartW;
  const dbmToY = (dbm) => padT + ((dbmMax - dbm) / (dbmMax - dbmMin)) * chartH;

  // Y-axis grid lines
  const yLines = [-20, -30, -40, -50, -60, -70, -80, -90];
  // X-axis channels
  const xChannels = band === '2.4' ? [1,2,3,4,5,6,7,8,9,10,11,12,13] : [34,50,66,82,98,114,130,147,163,179];

  // Build trapezoid path for each AP
  const getTrapPath = (ap) => {
    const bwChannels = band === '2.4' ? (ap.bw / 5) : (ap.bw / 5);
    const halfBw = bwChannels / 2;
    const flatHalf = halfBw * 0.3;

    const cx = chToX(ap.ch);
    const topY = dbmToY(ap.signal);
    const bottomY = dbmToY(dbmMin);

    const x1 = chToX(ap.ch - halfBw - 2); // bottom left
    const x2 = chToX(ap.ch - flatHalf);    // top left
    const x3 = chToX(ap.ch + flatHalf);    // top right
    const x4 = chToX(ap.ch + halfBw + 2); // bottom right

    return `M${x1},${bottomY} L${x2},${topY} L${x3},${topY} L${x4},${bottomY} Z`;
  };

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{overflow:'visible'}}>
      {/* Grid lines */}
      {yLines.map(dbm => (
        <g key={dbm}>
          <line x1={padL} y1={dbmToY(dbm)} x2={width-padR} y2={dbmToY(dbm)} stroke={T.border} strokeWidth="0.5" />
          <text x={padL-5} y={dbmToY(dbm)+4} fill={T.muted} fontSize="9" textAnchor="end">{dbm}</text>
        </g>
      ))}
      {/* X grid */}
      {xChannels.map(ch => (
        <g key={ch}>
          <line x1={chToX(ch)} y1={padT} x2={chToX(ch)} y2={padT+chartH} stroke={T.border} strokeWidth="0.5" />
          <text x={chToX(ch)} y={padT+chartH+14} fill={T.muted} fontSize="9" textAnchor="middle">{ch}</text>
        </g>
      ))}
      {/* Axes */}
      <line x1={padL} y1={padT} x2={padL} y2={padT+chartH} stroke={T.muted} strokeWidth="1" />
      <line x1={padL} y1={padT+chartH} x2={width-padR} y2={padT+chartH} stroke={T.muted} strokeWidth="1" />
      {/* Y axis label */}
      <text x={12} y={padT+chartH/2} fill={T.muted} fontSize="9" textAnchor="middle" transform={`rotate(-90,12,${padT+chartH/2})`}>Signal Strength (dBm)</text>
      {/* X axis label */}
      <text x={padL+chartW/2} y={height-2} fill={T.muted} fontSize="9" textAnchor="middle">Wi-Fi Channels</text>

      {/* AP humps */}
      {aps.map((ap, i) => (
        <g key={i}>
          <path d={getTrapPath(ap)} fill={ap.color+'44'} stroke={ap.color} strokeWidth="1.5" />
          {/* Label */}
          <text
            x={chToX(ap.ch)}
            y={dbmToY(ap.signal) - 5}
            fill={ap.color}
            fontSize="9"
            textAnchor="middle"
            fontWeight="bold"
          >{ap.ssid.length > 10 ? ap.ssid.substring(0,9)+'…' : ap.ssid}</text>
        </g>
      ))}

      {/* Legend */}
      {aps.map((ap, i) => (
        <g key={i}>
          <rect x={padL + 5 + i * 90} y={padT - 22} width="8" height="8" fill={ap.color} rx="2" />
          <text x={padL + 15 + i * 90} y={padT - 15} fill={T.muted} fontSize="8">{ap.ssid} {ap.ch}</text>
        </g>
      ))}
    </svg>
  );
}

export default function App() {
  const [loggedIn,setLoggedIn]=useState(true);
  const [loginUser,setLoginUser]=useState('admin');
  const [loginPass,setLoginPass]=useState('');
  const [loginErr,setLoginErr]=useState('');
  const [dark,setDark]=useState(true);
  const [tab,setTab]=useState('access-points');
  const [auditEnv,setAuditEnv]=useState('');
  const [auditRunning,setAuditRunning]=useState(false);
  const [auditProgress,setAuditProgress]=useState(0);
  const [auditDone,setAuditDone]=useState(false);
  const [locating,setLocating]=useState(null);
  const [ratingBand,setRatingBand]=useState('2.4 GHz');
  const [bandDrop,setBandDrop]=useState(false);
  const [graphBand,setGraphBand]=useState('2.4');
  const [speedRunning,setSpeedRunning]=useState(false);
  const [speedResult,setSpeedResult]=useState(null);
  const [speedProgress,setSpeedProgress]=useState(0);
  const [selectedReport,setSelectedReport]=useState(null);
  const [reportSearch,setReportSearch]=useState('');
  const [members,setMembers]=useState(INIT_MEMBERS);
  const [showInvite,setShowInvite]=useState(false);
  const [inviteEmail,setInviteEmail]=useState('');
  const [inviteRole,setInviteRole]=useState('Junior Tech');
  const [inviteName,setInviteName]=useState('');
  const [accordion,setAccordion]=useState({});
  const [notifs,setNotifs]=useState(true);
  const [toasts,setToasts]=useState([]);
  const [sidebarOpen,setSidebarOpen]=useState(false);

  const T=dark?DARK:LIGHT;

  const toast=(msg,type='info')=>{
    const id=Date.now();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500);
  };

  const doLogin=(e)=>{
    e.preventDefault();
    if(loginUser==='admin'&&loginPass==='admin123'){setLoggedIn(true);setLoginErr('');}
    else setLoginErr('Invalid credentials. Use admin / admin123');
  };

  const startAudit=async()=>{
    if(!auditEnv.trim()){toast('Please enter an environment name','error');return;}
    setAuditRunning(true);setAuditDone(false);setAuditProgress(0);
    for(let i=1;i<=20;i++){
      await new Promise(r=>setTimeout(r,150));
      setAuditProgress(i*5);
    }
    setAuditRunning(false);setAuditDone(true);
    toast(`✅ Audit complete for "${auditEnv}"! Found ${APS.length} networks.`,'success');
  };

  const locateAP=async(ssid)=>{
    setLocating(ssid);
    await new Promise(r=>setTimeout(r,2000));
    setLocating(null);
    toast(`📍 AP "${ssid}" located!`,'success');
  };

  const runSpeed=async()=>{
    setSpeedRunning(true);setSpeedResult(null);setSpeedProgress(0);
    for(let i=1;i<=20;i++){
      await new Promise(r=>setTimeout(r,150));
      setSpeedProgress(i*5);
    }
    const result={dl:Math.round(Math.random()*300+200),ul:Math.round(Math.random()*100+50),ping:Math.round(Math.random()*15+3)};
    setSpeedResult(result);setSpeedRunning(false);
    toast(`⚡ Speed test complete! ${result.dl} Mbps download`,'success');
  };

  const inviteMember=(e)=>{
    e.preventDefault();
    if(!inviteEmail||!inviteName){toast('Please fill all fields','error');return;}
    setMembers(m=>[...m,{id:Date.now(),name:inviteName,role:inviteRole,status:'Active',scans:0,perf:0,avatar:'👤',email:inviteEmail}]);
    setShowInvite(false);setInviteEmail('');setInviteName('');
    toast(`✅ Invitation sent to ${inviteEmail}`,'success');
  };

  const removeMember=(id,name)=>{setMembers(m=>m.filter(x=>x.id!==id));toast(`🗑️ ${name} removed`,'info');};
  const exportReport=(format,id)=>{toast(`📥 Exporting ${id} as ${format}...`,'info');setTimeout(()=>toast(`✅ ${id}.${format.toLowerCase()} downloaded!`,'success'),1500);};
  const sigColor=(dbm)=>dbm>=-60?T.green:dbm>=-75?T.yellow:T.red;
  const filteredReports=REPORTS.filter(r=>r.loc.toLowerCase().includes(reportSearch.toLowerCase())||r.id.toLowerCase().includes(reportSearch.toLowerCase()));

  // ── BASE STYLES ──────────────────────────────────────────────────────────
  const s={
    app:{display:'flex',flexDirection:'column',minHeight:'100vh',background:T.bg,color:T.text,fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",position:'relative',paddingBottom:'64px'},
    topbar:{background:T.sidebar,borderBottom:`1px solid ${T.border}`,padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:20},
    content:{padding:'16px',flex:1,maxWidth:'100%',overflowX:'hidden'},
    card:{background:T.card,border:`1px solid ${T.border}`,borderRadius:'12px',padding:'16px',marginBottom:'14px'},
    card2:{background:T.card2,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px'},
    row:{background:T.card2,border:`1px solid ${T.border}`,borderRadius:'10px',padding:'12px 14px',marginBottom:'10px',display:'flex',alignItems:'center',gap:'12px'},
    input:{background:T.card2,border:`1px solid ${T.border}`,color:T.text,padding:'10px 14px',borderRadius:'8px',fontSize:'14px',outline:'none',width:'100%',boxSizing:'border-box'},
    select:{background:T.card2,border:`1px solid ${T.border}`,color:T.text,padding:'10px 14px',borderRadius:'8px',fontSize:'14px',outline:'none',width:'100%',cursor:'pointer'},
    btn:(bg,tc)=>({background:bg||T.blue,color:tc||'#fff',border:'none',padding:'10px 18px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:'700',display:'inline-flex',alignItems:'center',gap:'6px'}),
    btnGhost:{background:'transparent',border:`1px solid ${T.border}`,color:T.muted,padding:'8px 14px',borderRadius:'8px',cursor:'pointer',fontSize:'12px',fontWeight:'700'},
    table:{width:'100%',borderCollapse:'collapse'},
    th:{textAlign:'left',padding:'10px 12px',borderBottom:`1px solid ${T.border}`,color:T.muted,fontSize:'10px',letterSpacing:'0.08em',textTransform:'uppercase'},
    td:{padding:'11px 12px',borderBottom:`1px solid ${T.border}`,fontSize:'13px'},
    badge:(bg,tc)=>({background:bg,color:tc,fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'20px',display:'inline-block'}),
    label:{fontSize:'10px',color:T.muted,letterSpacing:'0.08em',textTransform:'uppercase',display:'block',marginBottom:'4px'},
    statCard:{background:T.card,border:`1px solid ${T.border}`,borderRadius:'12px',padding:'14px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'},
    overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:'16px'},
    modal:{background:T.card,border:`1px solid ${T.border}`,borderRadius:'14px',padding:'22px',maxWidth:'440px',width:'100%'},
    progressTrack:{background:T.border,borderRadius:'4px',height:'6px',overflow:'hidden',marginTop:'8px'},
    progressFill:(pct,color)=>({width:`${pct}%`,height:'100%',background:color||T.blue,borderRadius:'4px',transition:'width 0.2s'}),
    toggle:(on)=>({width:'44px',height:'24px',borderRadius:'12px',background:on?T.blue:T.border,cursor:'pointer',border:'none',position:'relative',transition:'background 0.2s',flexShrink:0}),
    toggleDot:(on)=>({position:'absolute',top:'3px',left:on?'23px':'3px',width:'18px',height:'18px',borderRadius:'50%',background:'#fff',transition:'left 0.2s'}),
    bottomNav:{position:'fixed',bottom:0,left:0,right:0,background:T.sidebar,borderTop:`1px solid ${T.border}`,display:'flex',zIndex:30,height:'64px'},
    bottomNavBtn:(a)=>({flex:1,background:a?T.blue+'22':'transparent',border:'none',color:a?T.blue:T.muted,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'2px',fontSize:'9px',fontWeight:'700',letterSpacing:'0.04em',padding:'6px 2px'}),
    footer:{background:T.sidebar,borderTop:`1px solid ${T.border}`,padding:'8px 16px',fontSize:'9px',color:T.border,letterSpacing:'0.06em',textAlign:'center'},
  };

  // ── DESKTOP SIDEBAR ──────────────────────────────────────────────────────
  const Sidebar=()=>(
    <aside style={{width:'185px',minHeight:'100vh',background:T.sidebar,borderRight:`1px solid ${T.border}`,display:'flex',flexDirection:'column',padding:'20px 12px',position:'fixed',top:0,left:sidebarOpen?0:'-200px',height:'100vh',overflowY:'auto',zIndex:40,transition:'left 0.3s'}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'28px'}}>
        <div style={{width:'34px',height:'34px',background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>📡</div>
        <span style={{fontSize:'14px',fontWeight:'700',color:T.text}}>NetPulse CAF</span>
        <button onClick={()=>setSidebarOpen(false)} style={{marginLeft:'auto',background:'transparent',border:'none',color:T.muted,cursor:'pointer',fontSize:'18px'}}>✕</button>
      </div>
      <nav style={{flex:1}}>
        {NAV.map(n=>(
          <button key={n.id} style={{display:'flex',alignItems:'center',gap:'9px',padding:'9px 12px',borderRadius:'8px',cursor:'pointer',border:'none',textAlign:'left',width:'100%',background:tab===n.id?'linear-gradient(135deg,#1e40af,#2563eb)':'transparent',color:tab===n.id?'#fff':T.muted,fontSize:'11px',fontWeight:'700',letterSpacing:'0.06em',marginBottom:'2px'}} onClick={()=>{setTab(n.id);setSidebarOpen(false);}}>
            <span>{n.emoji}</span>{n.label.toUpperCase()}
          </button>
        ))}
      </nav>
      <button style={{background:'transparent',border:'none',color:'#ef4444',padding:'9px 12px',borderRadius:'8px',cursor:'pointer',fontSize:'11px',fontWeight:'700',textAlign:'left'}} onClick={()=>setLoggedIn(false)}>🔓 LOGOUT</button>
    </aside>
  );

  // ── LOGIN ────────────────────────────────────────────────────────────────
  if(!loggedIn) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:T.bg,padding:'16px'}}>
      <div style={{...s.card,maxWidth:'400px',width:'100%'}}>
        <div style={{textAlign:'center',marginBottom:'24px'}}>
          <div style={{width:'56px',height:'56px',background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',margin:'0 auto 14px'}}>📡</div>
          <h1 style={{fontSize:'22px',fontWeight:'800',marginBottom:'4px',color:T.text}}>NetPulse CAF</h1>
          <p style={{fontSize:'13px',color:T.muted}}>Enterprise WiFi Analyzer v3.0.0</p>
        </div>
        <form onSubmit={doLogin} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          {loginErr&&<div style={{background:'#7f1d1d',border:'1px solid #ef4444',color:'#fca5a5',padding:'10px 14px',borderRadius:'8px',fontSize:'12px'}}>{loginErr}</div>}
          <div><label style={s.label}>Username</label><input style={s.input} type="text" value={loginUser} onChange={e=>setLoginUser(e.target.value)} placeholder="admin" /></div>
          <div><label style={s.label}>Password</label><input style={s.input} type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} placeholder="••••••••" /></div>
          <button style={{...s.btn(),justifyContent:'center',padding:'12px'}} type="submit">Sign In →</button>
        </form>
        <div style={{background:'#1e3a5f22',border:`1px solid ${T.blue}44`,borderRadius:'8px',padding:'10px',marginTop:'14px',fontSize:'12px',color:T.blue,textAlign:'center'}}>
          Demo: <strong>admin</strong> / <strong>admin123</strong>
        </div>
      </div>
    </div>
  );

  const currentTabLabel=NAV.find(n=>n.id===tab)?.label||'';

  return (
    <div style={s.app}>
      {/* TOASTS */}
      <div style={{position:'fixed',top:'16px',right:'16px',zIndex:200,display:'flex',flexDirection:'column',gap:'8px',pointerEvents:'none',maxWidth:'300px'}}>
        {toasts.map(t=>(
          <div key={t.id} style={{background:t.type==='error'?'#7f1d1d':t.type==='success'?'#14532d':'#1e3a5f',border:`1px solid ${t.type==='error'?'#ef4444':t.type==='success'?'#22c55e':'#3b82f6'}`,color:'#fff',padding:'10px 14px',borderRadius:'10px',fontSize:'13px',fontWeight:'600',boxShadow:'0 4px 20px rgba(0,0,0,0.4)'}}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* SIDEBAR OVERLAY */}
      {sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:35}} />}
      <Sidebar />

      {/* TOPBAR */}
      <div style={s.topbar}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <button onClick={()=>setSidebarOpen(true)} style={{background:'transparent',border:'none',color:T.text,cursor:'pointer',fontSize:'20px',padding:'4px',lineHeight:1}}>☰</button>
          <div style={{width:'28px',height:'28px',background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>📡</div>
          <span style={{fontSize:'13px',fontWeight:'700',color:T.text}}>NetPulse CAF</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <div style={{background:dark?'#1e3a5f':'#eff6ff',border:`1px solid ${T.blue}`,color:T.blue,fontSize:'9px',fontWeight:'700',padding:'3px 8px',borderRadius:'20px',display:'none'}}>
            ARUBA
          </div>
          <span style={{fontSize:'11px',fontWeight:'700',color:T.muted,display:'none',letterSpacing:'0.1em'}}>{currentTabLabel.toUpperCase()}</span>
          <button onClick={()=>setDark(d=>!d)} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:'18px'}}>{dark?'☀️':'🌙'}</button>
          <button onClick={()=>setLoggedIn(false)} style={{background:'transparent',border:`1px solid ${T.red}44`,color:T.red,borderRadius:'6px',cursor:'pointer',fontSize:'11px',fontWeight:'700',padding:'4px 10px'}}>Logout</button>
        </div>
      </div>

      {/* PAGE HEADER */}
      <div style={{background:T.sidebar,borderBottom:`1px solid ${T.border}`,padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontSize:'12px',fontWeight:'700',color:T.muted,letterSpacing:'0.1em'}}>{currentTabLabel.toUpperCase()}</span>
        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
          <div style={{width:'6px',height:'6px',borderRadius:'50%',background:T.blue}} />
          <span style={{fontSize:'10px',color:T.blue,fontWeight:'700'}}>ARUBA ANALYSIS MODE</span>
        </div>
      </div>

      {/* CONTENT */}
      <div style={s.content}>

        {/* ══ ACCESS POINTS ══ */}
        {tab==='access-points'&&(
          <div>
            <div style={{...s.card,borderColor:T.blue+'55'}}>
              <div style={{fontSize:'10px',letterSpacing:'0.12em',color:T.muted,marginBottom:'8px'}}>LIVE CONNECTION DIAGNOSTICS</div>
              <div style={{fontSize:'20px',fontWeight:'800',marginBottom:'2px'}}>CAF-WIFI-5G</div>
              <div style={{fontSize:'11px',color:T.muted,marginBottom:'10px'}}>ARUBA NETWORKS | 00:0B:86:12:34:56</div>
              <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
                {[{v:'-45 dBm',l:'SIGNAL',c:T.green},{v:'CH 36',l:'CHANNEL',c:T.cyan},{v:'850 Mbps',l:'THROUGHPUT',c:T.blue}].map(x=>(
                  <div key={x.l}><div style={{fontSize:'16px',fontWeight:'800',color:x.c}}>{x.v}</div><div style={{fontSize:'10px',color:T.muted}}>{x.l}</div></div>
                ))}
              </div>
            </div>

            <div style={{background:dark?'#2d1515':'#fef2f2',border:`1px solid ${T.red}55`,borderRadius:'8px',padding:'10px 14px',marginBottom:'14px',color:T.yellow,fontSize:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
              ⚠️ WI-FI SCAN THROTTLING IS ACTIVE. ACCURACY MAY VARY.
            </div>

            <div style={s.card}>
              <div style={{fontSize:'10px',letterSpacing:'0.12em',color:T.muted,marginBottom:'10px'}}>⊙ AUDIT ENVIRONMENT</div>
              <input style={{...s.input,marginBottom:'10px'}} placeholder="e.g., Data Center Rack B-12" value={auditEnv} onChange={e=>{setAuditEnv(e.target.value);setAuditDone(false);}} />
              <button style={{...s.btn(auditRunning?T.muted:T.blue),width:'100%',justifyContent:'center',opacity:auditRunning?0.6:1}} onClick={startAudit} disabled={auditRunning}>
                {auditRunning?'⏳ SCANNING...':'▶ START SITE AUDIT'}
              </button>
              {auditRunning&&(
                <div style={{marginTop:'10px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',color:T.muted,marginBottom:'4px'}}><span>Scanning networks...</span><span>{auditProgress}%</span></div>
                  <div style={s.progressTrack}><div style={s.progressFill(auditProgress,T.blue)} /></div>
                </div>
              )}
              {auditDone&&<div style={{background:'#14532d22',border:`1px solid ${T.green}44`,borderRadius:'8px',padding:'10px',marginTop:'10px',color:T.green,fontSize:'12px'}}>✅ Audit complete for <strong>"{auditEnv}"</strong> — {APS.length} networks found</div>}
            </div>

            <div style={s.card}>
              <div style={{fontSize:'10px',letterSpacing:'0.12em',color:T.muted,marginBottom:'12px'}}>⊙ DISCOVERY REGISTRY — {APS.length} NETWORKS</div>
              {APS.map((ap,i)=>(
                <div key={i} style={s.row}>
                  <div style={{width:'40px',height:'40px',borderRadius:'10px',background:ap.color+'22',color:ap.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'800',flexShrink:0}}>{ap.ch}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:'700',fontSize:'13px',display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                      {ap.ssid}
                      {ap.vendor==='ARUBA NETWORKS'&&<span style={{fontSize:'9px',background:T.blue+'22',color:T.blue,padding:'1px 5px',borderRadius:'4px'}}>ARUBA</span>}
                    </div>
                    <div style={{fontSize:'11px',color:T.muted,marginTop:'1px'}}>{ap.vendor}</div>
                    <div style={{fontSize:'11px',marginTop:'1px'}}><span style={{color:ap.color,fontWeight:'700'}}>{ap.signal} dBm</span><span style={{color:T.muted}}> · {ap.freq||ap.band+' GHz'}</span></div>
                  </div>
                  <button style={{background:locating===ap.ssid?T.muted:T.card2,border:`1px solid ${T.border}`,color:T.muted,padding:'6px 10px',borderRadius:'8px',cursor:'pointer',fontSize:'10px',fontWeight:'700',flexShrink:0}} onClick={()=>locateAP(ap.ssid)} disabled={!!locating}>
                    {locating===ap.ssid?'⏳':'📍'} LOCATE
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ CHANNEL RATING ══ */}
        {tab==='channel-rating'&&(
          <div>
            <div style={{...s.card,borderColor:T.blue+'44',marginBottom:'14px'}}>
              <div style={{fontSize:'11px',color:T.blue,fontWeight:'700',marginBottom:'6px'}}>Current connection</div>
              <div style={{fontWeight:'700',marginBottom:'3px'}}>CAF-WIFI-5G (00:0B:86:12:34:56)</div>
              <div style={{color:T.green,fontWeight:'700',fontSize:'13px'}}>-45dBm · CH 36 · 850Mbps</div>
              <div style={{background:dark?'#2d1a1a':'#fef2f2',border:`1px solid ${T.red}44`,borderRadius:'6px',padding:'6px 10px',marginTop:'8px',color:T.red,fontSize:'11px'}}>⊘ Wi-Fi scan throttling is enabled</div>
            </div>

            <div style={{position:'relative',marginBottom:'14px'}}>
              <button onClick={()=>setBandDrop(d=>!d)} style={{...s.btn(T.card2,T.text),border:`1px solid ${T.border}`,width:'100%',justifyContent:'space-between'}}>
                {ratingBand} <span>▾</span>
              </button>
              {bandDrop&&(
                <div style={{position:'absolute',top:'44px',left:0,right:0,background:T.card,border:`1px solid ${T.border}`,borderRadius:'10px',overflow:'hidden',zIndex:30}}>
                  {['2.4 GHz','5 GHz','6 GHz'].map(b=>(
                    <div key={b} onClick={()=>{setRatingBand(b);setBandDrop(false);}} style={{padding:'12px 16px',cursor:'pointer',fontSize:'14px',background:ratingBand===b?T.card2:'transparent',color:ratingBand===b?T.blue:T.text}}>
                      {b}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={s.card}>
              <div style={{marginBottom:'10px'}}>
                <span style={{fontSize:'12px',fontWeight:'700',color:T.cyan}}>BEST CHANNELS: </span>
                <span style={{fontSize:'12px',color:T.blue}}>{ratingBand==='2.4 GHz'?'20 MHz 2,3,4,5,7,8,9,10,11,1':ratingBand==='5 GHz'?'40 MHz 36,40,44,48,56,60,64':'80 MHz 1,5,9,13,17,21'}</span>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>CHANNEL RATING</th><th style={s.th}>CHANNEL</th><th style={s.th}>APs</th></tr></thead>
                  <tbody>
                    {(CHANNEL_RATINGS[ratingBand]||[]).map((r,i)=>(
                      <tr key={i}>
                        <td style={s.td}><span style={{color:T.yellow,letterSpacing:'1px'}}>{'★'.repeat(r.stars)}{'☆'.repeat(10-r.stars)}</span></td>
                        <td style={{...s.td,color:T.cyan,fontWeight:'700'}}>{r.ch} <span style={{color:T.muted,fontSize:'11px'}}>20 MHz</span></td>
                        <td style={{...s.td,color:r.nets>0?T.yellow:T.muted}}>{r.nets}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{background:dark?'#0d1f35':'#eff6ff',border:`1px solid ${T.blue}33`,borderRadius:'8px',padding:'12px',marginTop:'12px'}}>
                <div style={{fontSize:'11px',fontWeight:'700',color:T.blue,marginBottom:'4px'}}>⊙ System Recommendation:</div>
                <div style={{fontSize:'12px',color:T.muted,lineHeight:'1.6'}}>{ratingBand==='2.4 GHz'?'Avoid overlapping channels (2,3,4,5). Use channels 1, 6, or 11 for best non-overlapping coverage.':ratingBand==='5 GHz'?'5GHz provides higher throughput. Channels 36-48 avoid DFS restrictions.':'6GHz offers best performance with lowest interference for WiFi 6E devices.'}</div>
              </div>
            </div>
          </div>
        )}

        {/* ══ CHANNEL GRAPH ══ */}
        {tab==='channel-graph'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}>
              {[{l:'CAF NETWORKS',v:'6'},{l:'ACTIVE APS',v:'18'},{l:'AVG SIGNAL',v:'-52 dBm'},{l:'HEALTH',v:'98%'}].map((x,i)=>(
                <div key={i} style={s.statCard}>
                  <div><div style={{fontSize:'10px',color:T.muted,marginBottom:'4px'}}>{x.l}</div><div style={{fontSize:'20px',fontWeight:'800',color:T.blue}}>{x.v}</div><div style={{fontSize:'10px',color:T.green}}>↑ +2.5%</div></div>
                </div>
              ))}
            </div>

            {/* REAL WIFI SPECTRUM */}
            <div style={s.card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px',flexWrap:'wrap',gap:'8px'}}>
                <div>
                  <div style={{fontWeight:'700',fontSize:'14px'}}>≈ Channel Spectrum Graph</div>
                  <div style={{fontSize:'11px',color:T.muted}}>Visualizing signal overlap and channel congestion</div>
                </div>
                <div style={{display:'flex',gap:'6px'}}>
                  {['2.4','5'].map(b=>(
                    <button key={b} onClick={()=>setGraphBand(b)} style={{background:graphBand===b?T.blue:T.card2,border:`1px solid ${T.border}`,color:graphBand===b?'#fff':T.muted,padding:'5px 12px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'700'}}>
                      {b} GHz
                    </button>
                  ))}
                </div>
              </div>
              <div style={{background:dark?'#0d1526':'#f8fafc',borderRadius:'8px',padding:'8px',overflowX:'auto'}}>
                <WifiSpectrum band={graphBand} T={T} />
              </div>
            </div>

            {/* SSID Bandwidth */}
            <div style={s.card}>
              <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'3px'}}>≋ SSID Bandwidth Distribution</div>
              <div style={{fontSize:'11px',color:T.muted,marginBottom:'10px'}}>Throughput capacity (Mbps)</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={SSID_BW} layout="vertical">
                  <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                  <XAxis type="number" tick={{fill:T.muted,fontSize:10}} />
                  <YAxis dataKey="name" type="category" width={80} tick={{fill:T.muted,fontSize:10}} />
                  <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}} />
                  <Bar dataKey="v" fill={T.blue} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Interference */}
            <div style={s.card}>
              <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'10px'}}>⚠ Interference Analysis (0–100)</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={INTERFERENCE}>
                  <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{fill:T.muted,fontSize:9}} />
                  <YAxis tick={{fill:T.muted,fontSize:10}} domain={[0,100]} />
                  <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}} />
                  <Bar dataKey="v" fill={T.yellow} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Network types */}
            <div style={s.card}>
              <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'10px'}}>Network Type Distribution</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={NET_TYPES} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} fontSize={11}>
                    {NET_TYPES.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══ TIME GRAPH ══ */}
        {tab==='time-graph'&&(
          <div>
            <div style={s.card}>
              <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'3px'}}>Speed Test History</div>
              <div style={{fontSize:'11px',color:T.muted,marginBottom:'12px'}}>Network throughput over the last 24 hours</div>
              <div style={{display:'flex',gap:'12px',fontSize:'11px',marginBottom:'10px'}}>
                {[{c:T.blue,l:'Download'},{c:T.cyan,l:'Upload'}].map(x=>(
                  <span key={x.l} style={{display:'flex',alignItems:'center',gap:'4px',color:x.c}}>
                    <span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:x.c}} />{x.l}
                  </span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={SPEED_HIST}>
                  <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                  <XAxis dataKey="t" tick={{fill:T.muted,fontSize:10}} />
                  <YAxis tick={{fill:T.muted,fontSize:10}} unit="M" />
                  <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}} formatter={(v,n)=>[`${v} Mbps`,n]} />
                  <Line type="monotone" dataKey="dl" stroke={T.blue} strokeWidth={2} dot={{fill:T.blue,r:3}} name="Download" />
                  <Line type="monotone" dataKey="ul" stroke={T.cyan} strokeWidth={2} dot={{fill:T.cyan,r:3}} name="Upload" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Active Speed Test */}
            <div style={s.card}>
              <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'3px'}}>⚡ Active Speed Test</div>
              <div style={{fontSize:'11px',color:T.muted,marginBottom:'14px'}}>Measure real-time bandwidth</div>
              {!speedResult&&!speedRunning&&(
                <div style={{textAlign:'center',padding:'10px 0'}}>
                  <div style={{fontSize:'36px',marginBottom:'10px',opacity:0.3}}>〜</div>
                  <div style={{fontSize:'12px',color:T.muted,marginBottom:'16px'}}>Perform a throughput check on your CAF connection.</div>
                  <button style={{...s.btn(T.card2,T.text),border:`1px solid ${T.border}`,width:'100%',justifyContent:'center'}} onClick={runSpeed}>▶ Start Speed Test</button>
                </div>
              )}
              {speedRunning&&(
                <div style={{textAlign:'center',padding:'10px 0'}}>
                  <div style={{fontSize:'32px',marginBottom:'10px'}}>⏳</div>
                  <div style={{fontSize:'12px',color:T.muted,marginBottom:'10px'}}>Testing your connection...</div>
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
                        <div style={{fontSize:'9px',color:T.muted,marginBottom:'3px'}}>{x.l}</div>
                        <div style={{fontSize:'20px',fontWeight:'800',color:x.c}}>{x.v}</div>
                        <div style={{fontSize:'11px',color:T.muted}}>{x.u}</div>
                      </div>
                    ))}
                  </div>
                  <button style={{...s.btn(T.card2,T.text),border:`1px solid ${T.border}`,width:'100%',justifyContent:'center'}} onClick={()=>setSpeedResult(null)}>Run Again</button>
                </div>
              )}
            </div>

            <div style={s.card}>
              <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'10px'}}>Weekly Activity Trends</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={WEEKLY}>
                  <defs>
                    <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.blue} stopOpacity={0.5}/><stop offset="95%" stopColor={T.blue} stopOpacity={0}/></linearGradient>
                    <linearGradient id="we" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.yellow} stopOpacity={0.4}/><stop offset="95%" stopColor={T.yellow} stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                  <XAxis dataKey="d" tick={{fill:T.muted,fontSize:10}} />
                  <YAxis tick={{fill:T.muted,fontSize:10}} />
                  <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}} />
                  <Area type="monotone" dataKey="v" stroke={T.blue} fill="url(#wg)" strokeWidth={2} />
                  <Area type="monotone" dataKey="e" stroke={T.yellow} fill="url(#we)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'12px'}}>
                {[{l:'AVG DOWNLOAD',v:'452.4 Mbps',t:'+12%',c:T.green},{l:'AVG UPLOAD',v:'215.8 Mbps',t:'+5%',c:T.green},{l:'AVG LATENCY',v:'11.5 ms',t:'-2ms',c:T.red},{l:'STABILITY',v:'94.2%',t:'+0.5%',c:T.green}].map(x=>(
                  <div key={x.l} style={{background:T.card2,borderRadius:'8px',padding:'10px'}}>
                    <div style={{fontSize:'9px',color:T.muted,marginBottom:'3px'}}>{x.l}</div>
                    <div style={{fontSize:'14px',fontWeight:'800',marginBottom:'2px'}}>{x.v}</div>
                    <div style={{fontSize:'10px',color:x.c}}>{x.t} vs last week</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ EXPORT ══ */}
        {tab==='export'&&(
          <div>
            {selectedReport?(
              <div>
                <button style={{...s.btnGhost,marginBottom:'14px'}} onClick={()=>setSelectedReport(null)}>← Back</button>
                <div style={s.card}>
                  <div style={{fontSize:'10px',color:T.blue,fontWeight:'700',marginBottom:'4px'}}>{selectedReport.id}</div>
                  <div style={{fontSize:'18px',fontWeight:'800',marginBottom:'4px'}}>{selectedReport.loc}</div>
                  <div style={{fontSize:'12px',color:T.muted,marginBottom:'14px'}}>{selectedReport.date} · {selectedReport.nets} networks</div>
                  <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap'}}>
                    <button style={s.btn(T.blue)} onClick={()=>exportReport('PDF',selectedReport.id)}>📄 PDF</button>
                    <button style={s.btn(T.green)} onClick={()=>exportReport('CSV',selectedReport.id)}>📊 CSV</button>
                  </div>
                  {selectedReport.networks.map((n,i)=>(
                    <div key={i} style={s.row}>
                      <div style={{width:'8px',height:'8px',borderRadius:'50%',background:sigColor(n.sig),flexShrink:0}} />
                      <span style={{fontWeight:'600',flex:1}}>{n.name}</span>
                      <span style={{color:sigColor(n.sig),fontWeight:'700'}}>{n.sig} dBm</span>
                    </div>
                  ))}
                </div>
              </div>
            ):(
              <div style={s.card}>
                <div style={{fontSize:'16px',fontWeight:'800',marginBottom:'4px'}}>Audit Reports Registry</div>
                <div style={{fontSize:'12px',color:T.muted,marginBottom:'14px'}}>Manage and export your CAF scan history</div>
                <input style={{...s.input,marginBottom:'14px'}} placeholder="🔍 Search reports..." value={reportSearch} onChange={e=>setReportSearch(e.target.value)} />
                {filteredReports.map((r,i)=>(
                  <div key={i} style={{...s.card2,marginBottom:'10px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                      <div>
                        <div style={{fontSize:'10px',color:T.blue,fontWeight:'700',marginBottom:'2px'}}>{r.id}</div>
                        <div style={{fontWeight:'700',fontSize:'13px'}}>{r.loc}</div>
                        <div style={{fontSize:'11px',color:T.muted}}>{r.date} · {r.nets} networks</div>
                      </div>
                      <span style={{background:r.sigColor+'22',color:r.sigColor,fontSize:'11px',fontWeight:'700',padding:'3px 8px',borderRadius:'20px'}}>{r.signal}</span>
                    </div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button style={{background:'transparent',border:`1px solid ${T.border}`,color:T.blue,padding:'6px 12px',borderRadius:'6px',cursor:'pointer',fontSize:'11px',fontWeight:'700',flex:1}} onClick={()=>setSelectedReport(r)}>👁 View</button>
                      <button style={{background:'transparent',border:`1px solid ${T.border}`,color:T.green,padding:'6px 12px',borderRadius:'6px',cursor:'pointer',fontSize:'11px',fontWeight:'700',flex:1}} onClick={()=>exportReport('PDF',r.id)}>📄 PDF</button>
                      <button style={{background:'transparent',border:`1px solid ${T.border}`,color:T.yellow,padding:'6px 12px',borderRadius:'6px',cursor:'pointer',fontSize:'11px',fontWeight:'700',flex:1}} onClick={()=>exportReport('CSV',r.id)}>📊 CSV</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ VENDORS ══ */}
        {tab==='vendors'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}}>
              <div><div style={{fontSize:'18px',fontWeight:'800'}}>Organization Management</div><div style={{fontSize:'12px',color:T.muted}}>Monitor team performance</div></div>
              <button style={s.btn()} onClick={()=>setShowInvite(true)}>+ Invite</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'14px'}}>
              {[{l:'SECURITY',v:'0',sub:'All secured',c:T.green},{l:'SCANS/MO',v:'1,248',sub:'On target',c:T.green},{l:'UPTIME',v:'99.98%',sub:'24d ago',c:T.muted}].map((x,i)=>(
                <div key={i} style={s.card2}><div style={{fontSize:'9px',color:T.muted,marginBottom:'4px'}}>{x.l}</div><div style={{fontSize:'18px',fontWeight:'800',marginBottom:'2px'}}>{x.v}</div><div style={{fontSize:'10px',color:x.c}}>{x.sub}</div></div>
              ))}
            </div>

            {showInvite&&(
              <div style={s.overlay}>
                <div style={s.modal}>
                  <div style={{fontSize:'16px',fontWeight:'700',marginBottom:'16px'}}>Invite Team Member</div>
                  <form onSubmit={inviteMember} style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                    <div><label style={s.label}>Full Name</label><input style={s.input} placeholder="John Smith" value={inviteName} onChange={e=>setInviteName(e.target.value)} /></div>
                    <div><label style={s.label}>Email</label><input style={s.input} type="email" placeholder="user@company.com" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} /></div>
                    <div><label style={s.label}>Role</label><select style={s.select} value={inviteRole} onChange={e=>setInviteRole(e.target.value)}>{['Junior Tech','Senior Tech','Network Admin','Support Specialist','Manager'].map(r=><option key={r}>{r}</option>)}</select></div>
                    <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                      <button type="submit" style={{...s.btn(),flex:1,justifyContent:'center'}}>Send Invite</button>
                      <button type="button" style={{...s.btn(T.card2,T.text),border:`1px solid ${T.border}`,flex:1,justifyContent:'center'}} onClick={()=>setShowInvite(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div style={s.card}>
              <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'12px'}}>Team Members</div>
              {members.map((m,i)=>(
                <div key={i} style={{...s.row,flexWrap:'wrap',gap:'10px'}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'50%',background:T.card,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>{m.avatar}</div>
                  <div style={{flex:1,minWidth:'120px'}}>
                    <div style={{fontWeight:'700',fontSize:'13px'}}>{m.name}</div>
                    <div style={{fontSize:'11px',color:T.muted}}>{m.role}</div>
                    <div style={{display:'flex',alignItems:'center',gap:'6px',marginTop:'4px'}}>
                      <div style={{flex:1,background:T.border,borderRadius:'4px',height:'5px',overflow:'hidden',maxWidth:'80px'}}>
                        <div style={{width:`${m.perf}%`,height:'100%',background:T.blue,borderRadius:'4px'}} />
                      </div>
                      <span style={{fontSize:'10px',color:T.muted}}>{m.perf}%</span>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <span style={{background:m.status==='Active'?T.green+'22':T.yellow+'22',color:m.status==='Active'?T.green:T.yellow,fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'20px'}}>{m.status}</span>
                    <button style={{background:'transparent',border:'none',color:T.red,cursor:'pointer',fontSize:'11px',fontWeight:'700'}} onClick={()=>removeMember(m.id,m.name)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {tab==='settings'&&(
          <div>
            <div style={s.card}>
              <div style={{fontSize:'15px',fontWeight:'700',marginBottom:'4px'}}>Appearance & Preferences</div>
              <div style={{fontSize:'12px',color:T.muted,marginBottom:'16px'}}>Customize your analyzer workspace</div>
              {[{icon:'🌙',l:'Dark Mode',sub:'Low-light display',state:dark,toggle:()=>setDark(d=>!d)},{icon:'🔔',l:'Real-time Notifications',sub:'Critical signal alerts',state:notifs,toggle:()=>setNotifs(n=>!n)}].map((item,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px',border:`1px solid ${T.border}`,borderRadius:'10px',marginBottom:'8px'}}>
                  <div style={{width:'36px',height:'36px',background:T.card2,borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>{item.icon}</div>
                  <div style={{flex:1}}><div style={{fontWeight:'600',fontSize:'13px'}}>{item.l}</div><div style={{fontSize:'11px',color:T.muted}}>{item.sub}</div></div>
                  <button style={s.toggle(item.state)} onClick={item.toggle}><div style={s.toggleDot(item.state)} /></button>
                </div>
              ))}
            </div>
            <div style={s.card}>
              <div style={{fontSize:'15px',fontWeight:'700',marginBottom:'14px'}}>❓ Help & Instructions</div>
              {[{l:'Getting Started',c:'Enter environment name → Click Start Site Audit → Wait for scan → Review discovered networks.'},{l:'How to Scan Properly',c:'Stay within range of target APs. Walk slowly. Keep device at chest height. Run multiple scans for accuracy.'},{l:'Multi-Platform',c:'Optimized for Chrome, Firefox, Safari. Mobile responsive for iOS and Android.'}].map((item,i)=>(
                <div key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                  <button style={{width:'100%',background:'transparent',border:'none',color:T.text,padding:'14px 0',display:'flex',justifyContent:'space-between',cursor:'pointer',fontSize:'13px',fontWeight:'600',textAlign:'left'}} onClick={()=>setAccordion(a=>({...a,[i]:!a[i]}))}>
                    {item.l}<span style={{color:T.muted}}>{accordion[i]?'▲':'▼'}</span>
                  </button>
                  {accordion[i]&&<div style={{fontSize:'12px',color:T.muted,paddingBottom:'12px',lineHeight:'1.7'}}>{item.c}</div>}
                </div>
              ))}
            </div>
            <div style={s.card}>
              <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'12px'}}>System Information</div>
              {[{l:'APP VERSION',v:'v3.0.0 Enterprise'},{l:'DATABASE',v:'Firebase Firestore'},{l:'STATUS',v:'✅ All Systems Operational'},{l:'DEVELOPER',v:'Hany Bkhite'}].map((r,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 12px',background:T.card2,borderRadius:'8px',marginBottom:'6px'}}>
                  <span style={{fontSize:'12px',color:T.muted}}>{r.l}</span>
                  <span style={{fontSize:'12px',fontWeight:'700'}}>{r.v}</span>
                </div>
              ))}
              <div style={{background:T.card2,borderRadius:'8px',padding:'10px 12px',marginTop:'6px'}}>
                <div style={{fontSize:'10px',color:T.muted,marginBottom:'6px'}}>SUPPORTED STANDARDS</div>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                  {['WiFi 6E','WiFi 6','WPA3','802.11ax'].map(x=>(
                    <span key={x} style={{background:T.blue+'22',color:T.blue,fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'4px'}}>{x}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ ABOUT ══ */}
        {tab==='about'&&(
          <div style={{textAlign:'center',paddingTop:'10px'}}>
            <div style={{width:'68px',height:'68px',background:'linear-gradient(135deg,#1e3a5f,#1e40af)',border:`2px solid ${T.blue}`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',margin:'0 auto 16px'}}>📡</div>
            <div style={{fontSize:'26px',fontWeight:'800',marginBottom:'6px'}}>NetPulse CAF Analyzer</div>
            <div style={{fontSize:'13px',color:T.muted,marginBottom:'28px'}}>v3.0.0 Enterprise Infrastructure Monitoring</div>
            {[{i:'🛡️',l:'Secure Analysis',t:'Real-time spectral analysis of CAF-WIFI networks without compromising endpoint security.'},{i:'📡',l:'Aruba Optimized',t:'Deep integration with Aruba Access Point hardware for hidden AP tracking and automated channel optimization.'}].map((x,i)=>(
              <div key={i} style={{...s.card,textAlign:'left',marginBottom:'12px'}}>
                <div style={{fontSize:'22px',marginBottom:'8px'}}>{x.i}</div>
                <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'6px'}}>{x.l}</div>
                <div style={{fontSize:'12px',color:T.muted,lineHeight:'1.6'}}>{x.t}</div>
              </div>
            ))}
            <div style={{...s.card,textAlign:'center'}}>
              <div style={{fontSize:'22px',marginBottom:'8px'}}>🌐</div>
              <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'6px'}}>Global Deployment</div>
              <div style={{fontSize:'12px',color:T.muted,lineHeight:'1.6'}}>Used by field technicians across multiple continents. Developed and maintained by the GDIT Engineering Team.</div>
            </div>
            <div style={{fontSize:'12px',color:T.muted,marginTop:'20px'}}>© 2024 CAF-WIFI Operations | All Rights Reserved</div>
            <div style={{fontSize:'11px',color:T.border,marginTop:'4px'}}>GDIT-CAF-NETPULSE-v3-PROD</div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={s.footer}>SYSTEM: v3.0.0 | STATE: <span style={{color:T.green}}>SECUREOPS</span> | ENCRYPTION: AES-256-FIPS</div>

      {/* BOTTOM NAV (mobile) */}
      <div style={s.bottomNav}>
        {NAV.map(n=>(
          <button key={n.id} style={s.bottomNavBtn(tab===n.id)} onClick={()=>setTab(n.id)}>
            <span style={{fontSize:'16px'}}>{n.emoji}</span>
            <span>{n.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
