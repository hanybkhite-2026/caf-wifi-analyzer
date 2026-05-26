'use client';
import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// ── THEME ────────────────────────────────────────────────────────────────────
const DARK={bg:'#0d1117',sidebar:'#161b22',card:'#21262d',card2:'#30363d',border:'#30363d',blue:'#58a6ff',cyan:'#39d353',green:'#3fb950',yellow:'#e3b341',red:'#f85149',purple:'#a371f7',text:'#c9d1d9',muted:'#8b949e',topbar:'#161b22'};
const LIGHT={bg:'#f6f8fa',sidebar:'#ffffff',card:'#ffffff',card2:'#f6f8fa',border:'#d0d7de',blue:'#0969da',cyan:'#1a7f37',green:'#1a7f37',yellow:'#9a6700',red:'#cf222e',purple:'#8250df',text:'#24292f',muted:'#57606a',topbar:'#ffffff'};

// ── AP DATA ─────────────────────────────────────────────────────────────────
const INIT_APS = [
  {id:1,ssid:'CAF-WIFI-5G', mac:'00:0B:86:12:34:56',signal:-45,ch:36,  chWide:42, freq:5180,freqLow:5170,freqHigh:5250,bw:80, vendor:'ARUBA NETWORKS',      security:['WPA2','WPA3'],clients:4, dist:5.2,  band:'5',  color:'#3b82f6'},
  {id:2,ssid:'CAF-WIFI-2G', mac:'00:0B:86:78:90:AB',signal:-67,ch:6,   chWide:null,freq:2437,freqLow:2417,freqHigh:2447,bw:20, vendor:'ARUBA NETWORKS',      security:['WPS','WPA','WPA2'],clients:12,dist:22.1, band:'2.4',color:'#22c55e'},
  {id:3,ssid:'CAF-GUEST',   mac:'00:0B:86:CD:EF:01',signal:-79,ch:52,  chWide:48, freq:5260,freqLow:5735,freqHigh:5815,bw:80, vendor:'ARUBA NETWORKS',      security:['WPA2'],clients:5, dist:37.0, band:'5',  color:'#a855f7'},
  {id:4,ssid:'VTEL-Fiber',  mac:'7c:1c:f1:25:19:2c',signal:-85,ch:1,   chWide:null,freq:2412,freqLow:2402,freqHigh:2422,bw:20, vendor:'HUAWEI TECHNOLOGIES', security:['WPA','WPA2'],clients:4, dist:175.8,band:'2.4',color:'#f59e0b'},
  {id:5,ssid:'Mamon2_5G',   mac:'98:da:c4:26:21:87',signal:-86,ch:36,  chWide:42, freq:5180,freqLow:5170,freqHigh:5250,bw:80, vendor:'TP-LINK TECHNOLOGIES', security:['WPS','WPA','WPA2'],clients:5, dist:91.9, band:'5',  color:'#ef4444'},
  {id:6,ssid:'*hidden*',    mac:'9e:da:c4:26:21:87',signal:-87,ch:36,  chWide:42, freq:5180,freqLow:5170,freqHigh:5250,bw:80, vendor:'GENERIC VENDOR',      security:['WPA2'],clients:5, dist:103.1,band:'5',  color:'#f59e0b'},
];

const SPEED_HIST=[{t:'10:00',dl:420,ul:180,scan:8},{t:'11:00',dl:395,ul:165,scan:12},{t:'12:00',dl:460,ul:195,scan:10},{t:'13:00',dl:510,ul:210,scan:15},{t:'14:00',dl:480,ul:200,scan:9},{t:'15:00',dl:445,ul:185,scan:11},{t:'16:00',dl:470,ul:190,scan:14},{t:'17:00',dl:490,ul:205,scan:10},{t:'18:00',dl:500,ul:215,scan:13},{t:'19:00',dl:475,ul:195,scan:12},{t:'20:00',dl:455,ul:188,scan:9},{t:'22:00',dl:450,ul:190,scan:8}];
const WEEKLY=[{d:'Mon',v:35,e:12},{d:'Tue',v:42,e:15},{d:'Wed',v:55,e:18},{d:'Thu',v:68,e:25},{d:'Fri',v:45,e:14},{d:'Sat',v:30,e:10},{d:'Sun',v:25,e:8}];
const NET_TYPES=[{name:'Main',value:40},{name:'Guest',value:25},{name:'IoT',value:20},{name:'Admin',value:15}];
const PIE_COLORS=['#3b82f6','#06b6d4','#a855f7','#f59e0b'];
const CHANNEL_RATINGS={'2.4 GHz':[{ch:2,stars:10,nets:0},{ch:3,stars:10,nets:0},{ch:4,stars:10,nets:0},{ch:5,stars:10,nets:0},{ch:7,stars:10,nets:0},{ch:8,stars:10,nets:0},{ch:9,stars:10,nets:0},{ch:10,stars:10,nets:0},{ch:11,stars:10,nets:0},{ch:1,stars:9,nets:1},{ch:6,stars:8,nets:1}],'5 GHz':[{ch:36,stars:10,nets:2},{ch:40,stars:10,nets:0},{ch:44,stars:10,nets:0},{ch:48,stars:10,nets:0},{ch:52,stars:9,nets:1},{ch:149,stars:10,nets:0}],'6 GHz':[{ch:1,stars:10,nets:0},{ch:5,stars:10,nets:0},{ch:9,stars:10,nets:0}]};
const REPORTS=[{id:'REP-001',loc:'Main Campus - Wing A',date:'2024-05-15',nets:12,signal:'-52 dBm',sigColor:'#22c55e',networks:[{name:'CAF-WIFI-5G',sig:-45},{name:'CAF-WIFI-2G',sig:-67}]},{id:'REP-002',loc:'Basement Storage',date:'2024-05-18',nets:8,signal:'-68 dBm',sigColor:'#f59e0b',networks:[{name:'VTEL-Fiber',sig:-85}]},{id:'REP-003',loc:'Executive Suite',date:'2024-05-20',nets:15,signal:'-45 dBm',sigColor:'#22c55e',networks:[{name:'CAF-WIFI-5G',sig:-45}]}];
const INIT_MEMBERS=[{id:1,name:'Hany Bkhite',role:'Super Admin',status:'Active',scans:512,perf:100,avatar:'👑',email:'hanybkhite@gmail.com'},{id:2,name:'Alex Johnson',role:'Senior Tech',status:'Active',scans:145,perf:58,avatar:'👨‍💻',email:'alex@caf.com'},{id:3,name:'Maria Garcia',role:'Network Admin',status:'Active',scans:89,perf:38,avatar:'👩‍💻',email:'maria@caf.com'},{id:4,name:'Sam Wilson',role:'Support Specialist',status:'On Leave',scans:212,perf:85,avatar:'👨‍🔧',email:'sam@caf.com'}];
const NAV=[{id:'access-points',label:'Access Points',emoji:'📡'},{id:'channel-rating',label:'Channel Rating',emoji:'⭐'},{id:'channel-graph',label:'Channel Graph',emoji:'📊'},{id:'time-graph',label:'Time Graph',emoji:'📈'},{id:'export',label:'Export',emoji:'📄'},{id:'vendors',label:'Vendors',emoji:'👥'},{id:'settings',label:'Settings',emoji:'⚙️'},{id:'about',label:'About',emoji:'ℹ️'}];

// ── WIFI SIGNAL FAN ICON ──────────────────────────────────────────────────────
function WifiFan({ signal, size=40 }) {
  const level = signal >= -50 ? 4 : signal >= -60 ? 3 : signal >= -70 ? 2 : signal >= -80 ? 1 : 0;
  const color = signal >= -55 ? '#22c55e' : signal >= -65 ? '#84cc16' : signal >= -75 ? '#eab308' : signal >= -85 ? '#f97316' : '#ef4444';
  const cx=size/2, cy=size*0.82, r1=size*0.15, r2=size*0.32, r3=size*0.52, r4=size*0.72, a1=-140, a2=-40;
  const toRad=d=>d*Math.PI/180;
  const arc=(r,a1,a2)=>{
    const x1=cx+r*Math.cos(toRad(a1)), y1=cy+r*Math.sin(toRad(a1));
    const x2=cx+r*Math.cos(toRad(a2)), y2=cy+r*Math.sin(toRad(a2));
    return {x1,y1,x2,y2};
  };
  const fanPath=(r1,r2)=>{
    const {x1:ox1,y1:oy1,x2:ox2,y2:oy2}=arc(r1,a1,a2);
    const {x1:ix1,y1:iy1,x2:ix2,y2:iy2}=arc(r2,a1,a2);
    return `M${ox1},${oy1} A${r1},${r1} 0 0,1 ${ox2},${oy2} L${ix2},${iy2} A${r2},${r2} 0 0,0 ${ix1},${iy1} Z`;
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Dot */}
      <circle cx={cx} cy={cy} r={r1*0.5} fill={level>=0?color:'#444'} />
      {/* Arc 1 */}
      <path d={fanPath(r1*1.2,r2)} fill={level>=1?color:'#333'} opacity="0.9" />
      {/* Arc 2 */}
      <path d={fanPath(r2*1.05,r3)} fill={level>=2?color:'#333'} opacity="0.9" />
      {/* Arc 3 */}
      <path d={fanPath(r3*1.03,r4)} fill={level>=3?color:'#333'} opacity="0.9" />
      {/* Arc 4 */}
      <path d={fanPath(r4*1.02,size*0.48)} fill={level>=4?color:'#333'} opacity="0.9" />
    </svg>
  );
}

// ── WIFI SPECTRUM CHART ────────────────────────────────────────────────────
function WifiSpectrum({ band, T, aps }) {
  const W=340,H=260,pL=45,pR=10,pT=30,pB=40;
  const cW=W-pL-pR, cH=H-pT-pB;
  const dbMin=-100,dbMax=-20;
  const chMin=band==='2.4'?1:34, chMax=band==='2.4'?13:177;
  const chX=(ch)=>pL+((ch-chMin)/(chMax-chMin))*cW;
  const dbY=(db)=>pT+((dbMax-db)/(dbMax-dbMin))*cH;
  const filtAps=aps.filter(a=>a.band===band);
  const yLines=[-20,-30,-40,-50,-60,-70,-80,-90];
  const xChs=band==='2.4'?[1,2,3,4,5,6,7,8,9,10,11,12,13]:[34,50,66,82,98,114,130,147,163,179];
  const trapPath=(ap)=>{
    const bwCh=band==='2.4'?ap.bw/5:ap.bw/5;
    const half=bwCh/2+1, flat=bwCh/4;
    const cx=chX(ap.ch);
    return `M${chX(ap.ch-half-1)},${dbY(dbMin)} L${chX(ap.ch-flat)},${dbY(ap.signal)} L${chX(ap.ch+flat)},${dbY(ap.signal)} L${chX(ap.ch+half+1)},${dbY(dbMin)} Z`;
  };
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}>
      {yLines.map(db=>(
        <g key={db}>
          <line x1={pL} y1={dbY(db)} x2={W-pR} y2={dbY(db)} stroke={T.border} strokeWidth="0.5"/>
          <text x={pL-4} y={dbY(db)+4} fill={T.muted} fontSize="9" textAnchor="end">{db}</text>
        </g>
      ))}
      {xChs.map(ch=>(
        <g key={ch}>
          <line x1={chX(ch)} y1={pT} x2={chX(ch)} y2={pT+cH} stroke={T.border} strokeWidth="0.5"/>
          <text x={chX(ch)} y={pT+cH+13} fill={T.muted} fontSize="8" textAnchor="middle">{ch}</text>
        </g>
      ))}
      <line x1={pL} y1={pT} x2={pL} y2={pT+cH} stroke={T.muted} strokeWidth="1"/>
      <line x1={pL} y1={pT+cH} x2={W-pR} y2={pT+cH} stroke={T.muted} strokeWidth="1"/>
      <text x={11} y={pT+cH/2} fill={T.muted} fontSize="8" textAnchor="middle" transform={`rotate(-90,11,${pT+cH/2})`}>Signal Strength (dBm)</text>
      <text x={pL+cW/2} y={H-2} fill={T.muted} fontSize="8" textAnchor="middle">Wi-Fi Channels</text>
      {filtAps.map((ap,i)=>(
        <g key={i}>
          <path d={trapPath(ap)} fill={ap.color+'55'} stroke={ap.color} strokeWidth="1.5"/>
          <text x={chX(ap.ch)} y={dbY(ap.signal)-5} fill={ap.color} fontSize="8" textAnchor="middle" fontWeight="bold">
            {ap.ssid.length>9?ap.ssid.slice(0,8)+'…':ap.ssid} {ap.ch}
          </text>
        </g>
      ))}
      {/* Legend top */}
      {filtAps.slice(0,3).map((ap,i)=>(
        <g key={i}>
          <rect x={pL+4+i*100} y={pT-20} width="8" height="8" fill={ap.color} rx="2"/>
          <text x={pL+14+i*100} y={pT-13} fill={T.muted} fontSize="7">{ap.ssid} {ap.ch}</text>
        </g>
      ))}
    </svg>
  );
}

// ── TIME GRAPH (like real app) ────────────────────────────────────────────────
function TimeSpectrumGraph({ aps, T, band }) {
  const W=360, H=300, pL=50, pR=10, pT=30, pB=50;
  const cW=W-pL-pR, cH=H-pT-pB;
  const dbMin=-100, dbMax=-20;
  const scanData = aps.filter(a=>a.band===band).map((ap,i)=>{
    const scanCount = Math.abs(ap.signal) - 20;
    return {ap, scanCount};
  });
  const maxScan = Math.max(...scanData.map(d=>d.scanCount));
  const scanToX=(s)=>pL+(s/maxScan)*cW;
  const dbToY=(db)=>pT+((dbMax-db)/(dbMax-dbMin))*cH;
  const yLines=[-20,-30,-40,-50,-60,-70,-80,-90];
  const xLines=[0,Math.round(maxScan*0.25),Math.round(maxScan*0.5),Math.round(maxScan*0.75),maxScan];
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}>
      {yLines.map(db=>(
        <g key={db}>
          <line x1={pL} y1={dbToY(db)} x2={W-pR} y2={dbToY(db)} stroke={T.border} strokeWidth="0.5"/>
          <text x={pL-4} y={dbToY(db)+4} fill={T.muted} fontSize="9" textAnchor="end">{db}</text>
        </g>
      ))}
      {xLines.map(s=>(
        <g key={s}>
          <line x1={scanToX(s)} y1={pT} x2={scanToX(s)} y2={pT+cH} stroke={T.border} strokeWidth="0.5"/>
          <text x={scanToX(s)} y={pT+cH+14} fill={T.muted} fontSize="8" textAnchor="middle">{s}</text>
        </g>
      ))}
      <line x1={pL} y1={pT} x2={pL} y2={pT+cH} stroke={T.muted} strokeWidth="1"/>
      <line x1={pL} y1={pT+cH} x2={W-pR} y2={pT+cH} stroke={T.muted} strokeWidth="1"/>
      <text x={11} y={pT+cH/2} fill={T.muted} fontSize="8" textAnchor="middle" transform={`rotate(-90,11,${pT+cH/2})`}>Signal Strength (dBm)</text>
      <text x={pL+cW/2} y={H-4} fill={T.muted} fontSize="8" textAnchor="middle">Scan Count</text>
      {scanData.map(({ap,scanCount},i)=>(
        <g key={i}>
          <circle cx={scanToX(scanCount)} cy={dbToY(ap.signal)} r="5" fill={ap.color} opacity="0.9"/>
          <line x1={scanToX(0)} y1={dbToY(ap.signal)} x2={scanToX(scanCount)} y2={dbToY(ap.signal)} stroke={ap.color} strokeWidth="1.5" strokeDasharray="3,2" opacity="0.6"/>
          <text x={scanToX(scanCount)+8} y={dbToY(ap.signal)+4} fill={ap.color} fontSize="8">{ap.ssid}</text>
        </g>
      ))}
    </svg>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn,setLoggedIn]=useState(true);
  const [loginUser,setLoginUser]=useState('hanybkhite@gmail.com');
  const [loginPass,setLoginPass]=useState('');
  const [loginErr,setLoginErr]=useState('');
  const [dark,setDark]=useState(true);
  const [tab,setTab]=useState('access-points');
  const [aps,setAps]=useState(INIT_APS);
  const [scanning,setScanning]=useState(false);
  const [scanCount,setScanCount]=useState(2);
  const [auditEnv,setAuditEnv]=useState('');
  const [auditRunning,setAuditRunning]=useState(false);
  const [auditProgress,setAuditProgress]=useState(0);
  const [auditDone,setAuditDone]=useState(false);
  const [ratingBand,setRatingBand]=useState('2.4 GHz');
  const [bandDrop,setBandDrop]=useState(false);
  const [graphBand,setGraphBand]=useState('2.4');
  const [timeBand,setTimeBand]=useState('2.4');
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
  const [showFilter,setShowFilter]=useState(false);
  const [filterSSID,setFilterSSID]=useState('');
  const [filterSig,setFilterSig]=useState(null);
  const [filterSec,setFilterSec]=useState([]);
  const [appliedFilter,setAppliedFilter]=useState({ssid:'',sig:null,sec:[]});
  const [selectedAP,setSelectedAP]=useState(null);
  const [timeMode,setTimeMode]=useState('history'); // 'history' or 'live'

  const T=dark?DARK:LIGHT;

  const toast=(msg,type='info')=>{
    const id=Date.now();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500);
  };

  const doLogin=(e)=>{
    e.preventDefault();
    const validUsers=[
      {email:'hanybkhite@gmail.com',pass:'1234!@#$Hany',role:'Super Admin'},
      {email:'admin',pass:'admin123',role:'Admin'},
    ];
    const u=validUsers.find(x=>x.email===loginUser&&x.pass===loginPass);
    if(u){setLoggedIn(true);setLoginErr('');toast(`Welcome back! 🎉 Logged in as ${u.role}`,'success');}
    else setLoginErr('Invalid credentials.');
  };

  // Simulate real scan
  const doScan=useCallback(async()=>{
    setScanning(true);
    toast('📡 Scanning for networks...','info');
    await new Promise(r=>setTimeout(r,2500));
    // Simulate signal fluctuation
    setAps(prev=>prev.map(ap=>({
      ...ap,
      signal: Math.min(-30, ap.signal + (Math.random()*6-3)),
      dist: +(ap.dist*(0.9+Math.random()*0.2)).toFixed(1),
    })));
    setScanCount(c=>c+1);
    setScanning(false);
    toast(`✅ Scan #${scanCount+1} complete — ${INIT_APS.length} networks found`,'success');
  },[scanCount]);

  const startAudit=async()=>{
    if(!auditEnv.trim()){toast('Please enter an environment name','error');return;}
    setAuditRunning(true);setAuditDone(false);setAuditProgress(0);
    for(let i=1;i<=20;i++){await new Promise(r=>setTimeout(r,150));setAuditProgress(i*5);}
    setAuditRunning(false);setAuditDone(true);
    toast(`✅ Audit complete for "${auditEnv}"! Found ${aps.length} networks.`,'success');
  };

  const runSpeed=async()=>{
    setSpeedRunning(true);setSpeedResult(null);setSpeedProgress(0);
    for(let i=1;i<=20;i++){await new Promise(r=>setTimeout(r,150));setSpeedProgress(i*5);}
    const result={dl:Math.round(Math.random()*300+200),ul:Math.round(Math.random()*100+50),ping:Math.round(Math.random()*15+3)};
    setSpeedResult(result);setSpeedRunning(false);
    toast(`⚡ Speed test: ${result.dl} Mbps ↓ ${result.ul} Mbps ↑`,'success');
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
  const sigColor=(s)=>s>=-55?T.green:s>=-65?'#84cc16':s>=-75?T.yellow:s>=-85?'#f97316':T.red;

  const applyFilter=()=>{setAppliedFilter({ssid:filterSSID,sig:filterSig,sec:filterSec});setShowFilter(false);toast('✅ Filter applied','success');};
  const resetFilter=()=>{setFilterSSID('');setFilterSig(null);setFilterSec([]);};

  const filteredAPs=aps.filter(ap=>{
    if(appliedFilter.ssid&&!ap.ssid.toLowerCase().includes(appliedFilter.ssid.toLowerCase()))return false;
    if(appliedFilter.sig!==null){
      const levels=[[-100,-85],[-85,-75],[-75,-65],[-65,-55],[-55,0]];
      const [lo,hi]=levels[appliedFilter.sig];
      if(ap.signal<lo||ap.signal>=hi)return false;
    }
    if(appliedFilter.sec.length>0){
      const hasSec=appliedFilter.sec.some(s=>ap.security.includes(s));
      if(!hasSec)return false;
    }
    return true;
  });

  const filteredReports=REPORTS.filter(r=>r.loc.toLowerCase().includes(reportSearch.toLowerCase())||r.id.toLowerCase().includes(reportSearch.toLowerCase()));

  // Base styles
  const s={
    app:{display:'flex',flexDirection:'column',minHeight:'100vh',background:T.bg,color:T.text,fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",paddingBottom:'64px'},
    topbar:{background:T.topbar,borderBottom:`1px solid ${T.border}`,padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:20},
    content:{padding:'0 0 16px 0',flex:1},
    connBanner:{background:'#0d1f35',borderBottom:`1px solid ${T.border}`,padding:'10px 16px'},
    card:{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'14px',marginBottom:'12px',marginLeft:'16px',marginRight:'16px'},
    card2:{background:T.card2,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'12px'},
    apItem:{borderBottom:`1px solid ${T.border}`,padding:'12px 16px',cursor:'pointer'},
    input:{background:T.card2,border:`1px solid ${T.border}`,color:T.text,padding:'10px 14px',borderRadius:'8px',fontSize:'14px',outline:'none',width:'100%',boxSizing:'border-box'},
    select:{background:T.card2,border:`1px solid ${T.border}`,color:T.text,padding:'10px 14px',borderRadius:'8px',fontSize:'14px',outline:'none',width:'100%',cursor:'pointer'},
    btn:(bg,tc)=>({background:bg||T.blue,color:tc||'#fff',border:'none',padding:'9px 16px',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:'700',display:'inline-flex',alignItems:'center',gap:'6px'}),
    btnText:(c)=>({background:'transparent',border:'none',color:c||T.blue,cursor:'pointer',fontSize:'13px',fontWeight:'700',padding:'8px 4px'}),
    table:{width:'100%',borderCollapse:'collapse'},
    th:{textAlign:'left',padding:'9px 12px',borderBottom:`1px solid ${T.border}`,color:T.muted,fontSize:'10px',letterSpacing:'0.08em',textTransform:'uppercase'},
    td:{padding:'11px 12px',borderBottom:`1px solid ${T.border}`,fontSize:'13px'},
    badge:(bg,tc)=>({background:bg,color:tc,fontSize:'10px',fontWeight:'700',padding:'2px 7px',borderRadius:'4px',display:'inline-block',marginRight:'4px'}),
    label:{fontSize:'10px',color:T.muted,letterSpacing:'0.08em',textTransform:'uppercase',display:'block',marginBottom:'4px'},
    overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:100},
    modal:{background:T.card,borderRadius:'16px 16px 0 0',padding:'24px',width:'100%',maxWidth:'480px',maxHeight:'90vh',overflowY:'auto'},
    progressTrack:{background:T.border,borderRadius:'4px',height:'6px',overflow:'hidden',marginTop:'8px'},
    progressFill:(pct,c)=>({width:`${pct}%`,height:'100%',background:c||T.blue,borderRadius:'4px',transition:'width 0.2s'}),
    toggle:(on)=>({width:'44px',height:'24px',borderRadius:'12px',background:on?T.blue:T.border,cursor:'pointer',border:'none',position:'relative',transition:'background 0.2s',flexShrink:0}),
    toggleDot:(on)=>({position:'absolute',top:'3px',left:on?'23px':'3px',width:'18px',height:'18px',borderRadius:'50%',background:'#fff',transition:'left 0.2s'}),
    bottomNav:{position:'fixed',bottom:0,left:0,right:0,background:T.topbar,borderTop:`1px solid ${T.border}`,display:'flex',zIndex:30,height:'64px'},
    bottomNavBtn:(a)=>({flex:1,background:'transparent',border:'none',color:a?T.blue:T.muted,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'2px',fontSize:'9px',fontWeight:'700',letterSpacing:'0.03em',padding:'6px 2px'}),
    secBadge:(active)=>({background:'transparent',border:`1px solid ${active?T.blue:T.border}`,color:active?T.blue:T.muted,padding:'6px 14px',borderRadius:'20px',cursor:'pointer',fontSize:'13px',fontWeight:'700'}),
  };

  // ── LOGIN ────────────────────────────────────────────────────────────────
  if(!loggedIn) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:T.bg,padding:'16px'}}>
      <div style={{...s.card,maxWidth:'400px',width:'100%',margin:0}}>
        <div style={{textAlign:'center',marginBottom:'24px'}}>
          <div style={{width:'56px',height:'56px',background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',margin:'0 auto 14px'}}>📡</div>
          <h1 style={{fontSize:'22px',fontWeight:'800',marginBottom:'4px',color:T.text}}>NetPulse CAF</h1>
          <p style={{fontSize:'13px',color:T.muted}}>Enterprise WiFi Analyzer v3.0.0</p>
        </div>
        <form onSubmit={doLogin} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          {loginErr&&<div style={{background:'#7f1d1d',border:'1px solid #ef4444',color:'#fca5a5',padding:'10px',borderRadius:'8px',fontSize:'12px'}}>{loginErr}</div>}
          <div><label style={s.label}>Email / Username</label><input style={s.input} type="text" value={loginUser} onChange={e=>setLoginUser(e.target.value)} placeholder="hanybkhite@gmail.com" /></div>
          <div><label style={s.label}>Password</label><input style={s.input} type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} placeholder="••••••••" /></div>
          <button style={{...s.btn(),justifyContent:'center',padding:'12px'}} type="submit">Sign In →</button>
        </form>
        <div style={{background:'#1e3a5f33',border:`1px solid ${T.blue}44`,borderRadius:'8px',padding:'10px',marginTop:'12px',fontSize:'11px',color:T.blue,textAlign:'center'}}>
          Admin: hanybkhite@gmail.com / 1234!@#$Hany
        </div>
      </div>
    </div>
  );

  const currentLabel=NAV.find(n=>n.id===tab)?.label||'';

  return (
    <div style={s.app}>
      {/* TOASTS */}
      <div style={{position:'fixed',top:'16px',right:'16px',zIndex:200,display:'flex',flexDirection:'column',gap:'6px',pointerEvents:'none',maxWidth:'280px'}}>
        {toasts.map(t=>(
          <div key={t.id} style={{background:t.type==='error'?'#7f1d1d':t.type==='success'?'#14532d':'#1e3a5f',border:`1px solid ${t.type==='error'?'#ef4444':t.type==='success'?'#22c55e':'#3b82f6'}`,color:'#fff',padding:'9px 12px',borderRadius:'10px',fontSize:'12px',fontWeight:'600',boxShadow:'0 4px 16px rgba(0,0,0,0.4)'}}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* SIDEBAR DRAWER */}
      {sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:39}}/>}
      {sidebarOpen&&(
        <div style={{position:'fixed',top:0,left:0,width:'240px',height:'100vh',background:T.topbar,borderRight:`1px solid ${T.border}`,zIndex:40,display:'flex',flexDirection:'column',padding:'20px 12px',overflowY:'auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'24px'}}>
            <div style={{width:'32px',height:'32px',background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>📡</div>
            <span style={{fontSize:'14px',fontWeight:'700'}}>NetPulse CAF</span>
            <button onClick={()=>setSidebarOpen(false)} style={{marginLeft:'auto',background:'transparent',border:'none',color:T.muted,cursor:'pointer',fontSize:'20px'}}>✕</button>
          </div>
          <nav style={{flex:1}}>
            {NAV.map(n=>(
              <button key={n.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'8px',cursor:'pointer',border:'none',textAlign:'left',width:'100%',background:tab===n.id?T.blue+'22':'transparent',color:tab===n.id?T.blue:T.muted,fontSize:'13px',fontWeight:'700',marginBottom:'2px'}} onClick={()=>{setTab(n.id);setSidebarOpen(false);}}>
                <span>{n.emoji}</span>{n.label}
              </button>
            ))}
          </nav>
          <div style={{borderTop:`1px solid ${T.border}`,paddingTop:'16px',marginTop:'8px'}}>
            <div style={{fontSize:'11px',color:T.muted,marginBottom:'4px'}}>Signed in as</div>
            <div style={{fontSize:'12px',fontWeight:'700',marginBottom:'12px',color:T.text}}>hanybkhite@gmail.com</div>
            <button style={{background:'transparent',border:`1px solid ${T.red}44`,color:T.red,padding:'8px 12px',borderRadius:'8px',cursor:'pointer',fontSize:'12px',fontWeight:'700',width:'100%'}} onClick={()=>setLoggedIn(false)}>🔓 Logout</button>
          </div>
        </div>
      )}

      {/* TOPBAR */}
      <div style={s.topbar}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <button onClick={()=>setSidebarOpen(true)} style={{background:'transparent',border:'none',color:T.text,cursor:'pointer',fontSize:'22px',lineHeight:1,padding:'2px'}}>☰</button>
          <span style={{fontSize:'15px',fontWeight:'700',color:T.text}}>{currentLabel}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          {/* Band selector shown on relevant tabs */}
          {(tab==='channel-graph'||tab==='time-graph'||tab==='channel-rating')&&(
            <div style={{display:'flex',gap:'4px'}}>
              {['2.4','5'].map(b=>(
                <button key={b} onClick={()=>{setGraphBand(b);setTimeBand(b);}} style={{background:(graphBand===b)?T.blue:'transparent',border:`1px solid ${T.border}`,color:(graphBand===b)?'#fff':T.blue,padding:'4px 8px',borderRadius:'6px',cursor:'pointer',fontSize:'11px',fontWeight:'800'}}>
                  {b} GHz
                </button>
              ))}
            </div>
          )}
          {/* Filter button for AP and time tabs */}
          {(tab==='access-points'||tab==='time-graph')&&(
            <button onClick={()=>setShowFilter(true)} style={{background:'transparent',border:'none',color:T.muted,cursor:'pointer',fontSize:'18px'}}>⚙️</button>
          )}
          {/* Scan button */}
          {tab==='access-points'&&(
            <button onClick={doScan} disabled={scanning} style={{background:scanning?T.muted:T.blue,border:'none',color:'#fff',padding:'6px 12px',borderRadius:'6px',cursor:'pointer',fontSize:'11px',fontWeight:'700'}}>
              {scanning?'⏳':'▶'} {scanning?'Scanning...':'Scan'}
            </button>
          )}
          <button onClick={()=>setDark(d=>!d)} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:'16px'}}>{dark?'☀️':'🌙'}</button>
        </div>
      </div>

      {/* CURRENT CONNECTION BANNER (on relevant tabs) */}
      {(tab==='access-points'||tab==='channel-graph'||tab==='channel-rating'||tab==='time-graph')&&(
        <div style={s.connBanner}>
          <div style={{fontSize:'11px',color:T.blue,fontWeight:'700',marginBottom:'3px'}}>Current connection</div>
          <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'2px'}}>CAF-WIFI-5G (00:0B:86:12:34:56)</div>
          <div style={{fontSize:'12px'}}>
            <span style={{color:T.green,fontWeight:'700'}}>-45dBm</span>
            <span style={{color:T.muted}}> CH </span><span style={{color:T.blue,fontWeight:'700'}}>36</span>
            <span style={{color:T.muted}}> 5180MHz</span>
            <span style={{color:T.cyan,fontWeight:'700'}}> ~5.2m</span>
          </div>
          <div style={{color:T.blue,fontSize:'12px',fontWeight:'600'}}>850Mbps 192.168.100.15</div>
        </div>
      )}

      {/* THROTTLE WARNING */}
      {(tab==='access-points'||tab==='channel-graph'||tab==='channel-rating'||tab==='time-graph')&&(
        <div style={{background:dark?'#1a0a0a':'#fff1f0',borderBottom:`1px solid ${T.red}33`,padding:'8px 16px',color:T.red,fontSize:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
          ✕ Wi-Fi scan throttling is enabled
        </div>
      )}

      {/* CONTENT */}
      <div style={s.content}>

        {/* ══ ACCESS POINTS ══ */}
        {tab==='access-points'&&(
          <div>
            {/* Scan count & filter info */}
            <div style={{padding:'8px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'11px',color:T.muted}}>
              <span>📡 {filteredAPs.length} networks found · Scan #{scanCount}</span>
              {(appliedFilter.ssid||appliedFilter.sig!==null||appliedFilter.sec.length>0)&&(
                <span style={{color:T.blue,fontWeight:'700',cursor:'pointer'}} onClick={()=>setAppliedFilter({ssid:'',sig:null,sec:[]})}>✕ Clear Filter</span>
              )}
            </div>

            {/* AP List */}
            {filteredAPs.map((ap,i)=>(
              <div key={i} style={{...s.apItem,background:selectedAP?.id===ap.id?T.card2:'transparent'}} onClick={()=>setSelectedAP(selectedAP?.id===ap.id?null:ap)}>
                {/* Row 1: SSID + MAC */}
                <div style={{fontWeight:'800',fontSize:'14px',marginBottom:'2px'}}>{ap.ssid} <span style={{color:T.muted,fontWeight:'400',fontSize:'12px'}}>({ap.mac})</span></div>
                {/* Row 2: Signal + Channel + Freq + Distance */}
                <div style={{fontSize:'12px',marginBottom:'6px'}}>
                  <span style={{color:sigColor(ap.signal),fontWeight:'700'}}>{Math.round(ap.signal)}dBm</span>
                  <span style={{color:T.muted}}> CH </span>
                  <span style={{color:T.blue,fontWeight:'700'}}>{ap.ch}{ap.chWide?`(${ap.chWide})`:''}</span>
                  <span style={{color:T.muted}}> {ap.freq}MHz</span>
                  {ap.dist&&<span style={{color:T.cyan,fontWeight:'700'}}> ~{ap.dist}m</span>}
                </div>
                {/* Row 3: Fan icon + Freq range + Vendor */}
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <WifiFan signal={Math.round(ap.signal)} size={40}/>
                  <div>
                    <div style={{fontSize:'11px',color:T.blue}}>{ap.freqLow} - {ap.freqHigh} {ap.bw} MHz <span style={{color:T.muted}}>{ap.vendor.length>16?ap.vendor.slice(0,15)+'…':ap.vendor}</span></div>
                    <div style={{marginTop:'3px',display:'flex',alignItems:'center',gap:'4px',flexWrap:'wrap'}}>
                      {/* Signal bars */}
                      <div style={{display:'flex',gap:'1px',alignItems:'flex-end',marginRight:'4px'}}>
                        {[1,2,3,4].map(bar=>{
                          const filled=bar<=Math.round((Math.min(0,Math.max(-90,ap.signal))+90)/22.5);
                          return <div key={bar} style={{width:'4px',height:`${bar*3+4}px`,background:filled?sigColor(ap.signal):T.border,borderRadius:'1px'}}/>;
                        })}
                      </div>
                      <span style={{fontSize:'10px',color:T.muted}}>🔒</span>
                      {ap.security.map(sec=>(
                        <span key={sec} style={{...s.badge(T.card2,T.blue),fontSize:'10px',padding:'1px 5px'}}>{sec}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Expanded detail */}
                {selectedAP?.id===ap.id&&(
                  <div style={{marginTop:'10px',paddingTop:'10px',borderTop:`1px solid ${T.border}`,display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',fontSize:'11px'}}>
                    {[{l:'Band',v:ap.band+' GHz'},{l:'Bandwidth',v:ap.bw+' MHz'},{l:'MAC Address',v:ap.mac},{l:'Vendor',v:ap.vendor},{l:'Security',v:ap.security.join(', ')},{l:'Clients',v:ap.clients||'?'},{l:'Distance',v:ap.dist?ap.dist+'m':'?'},{l:'Signal',v:Math.round(ap.signal)+' dBm'}].map(x=>(
                      <div key={x.l}><div style={{color:T.muted,marginBottom:'1px'}}>{x.l}</div><div style={{fontWeight:'700',color:T.text}}>{x.v}</div></div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Audit section */}
            <div style={{...s.card,marginTop:'16px'}}>
              <div style={{fontSize:'11px',letterSpacing:'0.1em',color:T.muted,marginBottom:'10px'}}>⊙ SITE AUDIT</div>
              <input style={{...s.input,marginBottom:'10px'}} placeholder="e.g., Data Center Rack B-12" value={auditEnv} onChange={e=>{setAuditEnv(e.target.value);setAuditDone(false);}}/>
              <button style={{...s.btn(auditRunning?T.muted:T.blue),width:'100%',justifyContent:'center',opacity:auditRunning?0.6:1}} onClick={startAudit} disabled={auditRunning}>
                {auditRunning?'⏳ SCANNING...':'▶ START SITE AUDIT'}
              </button>
              {auditRunning&&<div style={s.progressTrack}><div style={s.progressFill(auditProgress,T.blue)}/></div>}
              {auditRunning&&<div style={{fontSize:'11px',color:T.muted,textAlign:'right',marginTop:'4px'}}>{auditProgress}%</div>}
              {auditDone&&<div style={{background:'#14532d22',border:`1px solid ${T.green}44`,borderRadius:'8px',padding:'10px',marginTop:'10px',color:T.green,fontSize:'12px'}}>✅ Audit complete for <strong>"{auditEnv}"</strong> — {aps.length} networks</div>}
            </div>
          </div>
        )}

        {/* ══ CHANNEL RATING ══ */}
        {tab==='channel-rating'&&(
          <div style={{padding:'0 16px'}}>
            <div style={{position:'relative',margin:'12px 0'}}>
              <button onClick={()=>setBandDrop(d=>!d)} style={{...s.btn(T.card2,T.text),border:`1px solid ${T.border}`,width:'100%',justifyContent:'space-between'}}>
                {ratingBand} <span>▾</span>
              </button>
              {bandDrop&&(
                <div style={{position:'absolute',top:'44px',left:0,right:0,background:T.card,border:`1px solid ${T.border}`,borderRadius:'10px',overflow:'hidden',zIndex:30}}>
                  {['2.4 GHz','5 GHz','6 GHz'].map(b=>(
                    <div key={b} onClick={()=>{setRatingBand(b);setBandDrop(false);}} style={{padding:'12px 16px',cursor:'pointer',fontSize:'14px',color:ratingBand===b?T.blue:T.text,fontWeight:ratingBand===b?'700':'400',background:ratingBand===b?T.card2:'transparent'}}>
                      {b}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={s.card2}>
              <div style={{marginBottom:'10px',display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'}}>
                <span style={{fontSize:'12px',fontWeight:'700',color:T.cyan}}>BEST CHANNELS:</span>
                <span style={{fontSize:'12px',color:T.blue}}>{ratingBand==='2.4 GHz'?'20 MHz 2,3,4,5,7,8,9,10,11,1':ratingBand==='5 GHz'?'40 MHz 36,40,44,48,56,60,64':'80 MHz 1,5,9,13,17,21'}</span>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>CHANNEL RATING</th><th style={s.th}>CHANNEL #</th><th style={s.th}>AP COUNT</th></tr></thead>
                  <tbody>
                    {(CHANNEL_RATINGS[ratingBand]||[]).map((r,i)=>(
                      <tr key={i}>
                        <td style={s.td}><span style={{color:T.yellow,letterSpacing:'1px'}}>{'★'.repeat(r.stars)}{'☆'.repeat(10-r.stars)}</span></td>
                        <td style={{...s.td,color:T.blue,fontWeight:'700'}}>{r.ch} <span style={{color:T.muted,fontSize:'11px'}}>20 MHz</span></td>
                        <td style={{...s.td,color:r.nets>0?T.yellow:T.muted}}>{r.nets}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{background:dark?'#0d1f35':'#eff6ff',borderRadius:'8px',padding:'12px',marginTop:'12px',border:`1px solid ${T.blue}33`}}>
                <div style={{fontSize:'11px',fontWeight:'700',color:T.blue,marginBottom:'4px'}}>⊙ System Recommendation:</div>
                <div style={{fontSize:'12px',color:T.muted,lineHeight:'1.6'}}>{ratingBand==='2.4 GHz'?'Avoid overlapping channels (2,3,4,5). Best non-overlapping: channels 1, 6, and 11.':ratingBand==='5 GHz'?'5GHz offers higher throughput. Channels 36-48 avoid DFS restrictions in most regions.':'6GHz offers best performance with lowest interference for WiFi 6E devices.'}</div>
              </div>
            </div>
          </div>
        )}

        {/* ══ CHANNEL GRAPH ══ */}
        {tab==='channel-graph'&&(
          <div>
            {/* Stats */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',padding:'12px 16px'}}>
              {[{l:'CAF Networks',v:aps.length.toString()},{l:'Active APs',v:'18'},{l:'Avg Signal',v:Math.round(aps.reduce((a,b)=>a+b.signal,0)/aps.length)+' dBm'},{l:'Health',v:'98%'}].map((x,i)=>(
                <div key={i} style={{...s.card2,textAlign:'center',margin:0}}>
                  <div style={{fontSize:'20px',fontWeight:'800',color:T.blue}}>{x.v}</div>
                  <div style={{fontSize:'10px',color:T.muted,marginTop:'2px'}}>{x.l}</div>
                </div>
              ))}
            </div>

            {/* Real Spectrum */}
            <div style={{...s.card}}>
              <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'2px'}}>≈ Channel Spectrum</div>
              <div style={{fontSize:'11px',color:T.muted,marginBottom:'10px'}}>Signal overlap visualization</div>
              <div style={{background:dark?'#0d1526':'#f8fafc',borderRadius:'8px',padding:'6px',overflowX:'auto'}}>
                <WifiSpectrum band={graphBand} T={T} aps={aps}/>
              </div>
            </div>

            {/* Bandwidth */}
            <div style={s.card}>
              <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'8px'}}>≋ SSID Bandwidth (Mbps)</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={aps.map(a=>({name:a.ssid.length>8?a.ssid.slice(0,7)+'…':a.ssid,v:Math.abs(a.signal)*10}))} layout="vertical">
                  <CartesianGrid stroke={T.border} strokeDasharray="3 3"/>
                  <XAxis type="number" tick={{fill:T.muted,fontSize:9}}/>
                  <YAxis dataKey="name" type="category" width={70} tick={{fill:T.muted,fontSize:9}}/>
                  <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}}/>
                  <Bar dataKey="v" fill={T.blue} radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Interference */}
            <div style={s.card}>
              <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'8px'}}>⚠ Interference (0–100)</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={aps.map(a=>({name:a.ssid.length>6?a.ssid.slice(0,5)+'…':a.ssid,v:Math.round((a.signal+100)/0.9)}))}>
                  <CartesianGrid stroke={T.border} strokeDasharray="3 3"/>
                  <XAxis dataKey="name" tick={{fill:T.muted,fontSize:9}}/>
                  <YAxis tick={{fill:T.muted,fontSize:9}} domain={[0,100]}/>
                  <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}}/>
                  <Bar dataKey="v" fill={T.yellow} radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie */}
            <div style={s.card}>
              <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'8px'}}>Network Distribution</div>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={NET_TYPES} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} fontSize={10}>
                    {NET_TYPES.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══ TIME GRAPH ══ */}
        {tab==='time-graph'&&(
          <div>
            {/* Mode toggle */}
            <div style={{display:'flex',gap:'8px',padding:'12px 16px',borderBottom:`1px solid ${T.border}`}}>
              {['history','live'].map(m=>(
                <button key={m} onClick={()=>setTimeMode(m)} style={{background:timeMode===m?T.blue:'transparent',border:`1px solid ${T.border}`,color:timeMode===m?'#fff':T.muted,padding:'6px 14px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'700',textTransform:'capitalize'}}>
                  {m==='history'?'📊 History':'📡 Live Scan'}
                </button>
              ))}
            </div>

            {timeMode==='history'?(
              <div style={{padding:'12px 16px'}}>
                <div style={s.card2}>
                  <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'2px'}}>Speed Test History</div>
                  <div style={{fontSize:'11px',color:T.muted,marginBottom:'10px'}}>Last 24 hours</div>
                  <div style={{display:'flex',gap:'12px',fontSize:'11px',marginBottom:'8px'}}>
                    {[{c:T.blue,l:'Download'},{c:T.cyan,l:'Upload'}].map(x=>(
                      <span key={x.l} style={{display:'flex',alignItems:'center',gap:'4px',color:x.c}}>
                        <span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:x.c}}/>{x.l}
                      </span>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={SPEED_HIST}>
                      <CartesianGrid stroke={T.border} strokeDasharray="3 3"/>
                      <XAxis dataKey="t" tick={{fill:T.muted,fontSize:9}}/>
                      <YAxis tick={{fill:T.muted,fontSize:9}} unit="M"/>
                      <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}} formatter={(v,n)=>[`${v} Mbps`,n]}/>
                      <Line type="monotone" dataKey="dl" stroke={T.blue} strokeWidth={2} dot={{r:2,fill:T.blue}} name="Download"/>
                      <Line type="monotone" dataKey="ul" stroke={T.cyan} strokeWidth={2} dot={{r:2,fill:T.cyan}} name="Upload"/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Speed test */}
                <div style={{...s.card2,marginTop:'12px'}}>
                  <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'4px'}}>⚡ Speed Test</div>
                  {!speedResult&&!speedRunning&&(
                    <button style={{...s.btn(T.card,T.text),border:`1px solid ${T.border}`,width:'100%',justifyContent:'center'}} onClick={runSpeed}>▶ Start Speed Test</button>
                  )}
                  {speedRunning&&(
                    <div>
                      <div style={s.progressTrack}><div style={s.progressFill(speedProgress,T.blue)}/></div>
                      <div style={{fontSize:'11px',color:T.muted,marginTop:'4px',textAlign:'right'}}>{speedProgress}%</div>
                    </div>
                  )}
                  {speedResult&&(
                    <div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'10px'}}>
                        {[{l:'DOWNLOAD',v:speedResult.dl,u:'Mbps',c:T.blue},{l:'UPLOAD',v:speedResult.ul,u:'Mbps',c:T.cyan},{l:'PING',v:speedResult.ping,u:'ms',c:T.yellow}].map(x=>(
                          <div key={x.l} style={{background:T.card,borderRadius:'8px',padding:'10px',textAlign:'center',border:`1px solid ${T.border}`}}>
                            <div style={{fontSize:'9px',color:T.muted,marginBottom:'2px'}}>{x.l}</div>
                            <div style={{fontSize:'18px',fontWeight:'800',color:x.c}}>{x.v}</div>
                            <div style={{fontSize:'10px',color:T.muted}}>{x.u}</div>
                          </div>
                        ))}
                      </div>
                      <button style={{...s.btn(T.card,T.text),border:`1px solid ${T.border}`,width:'100%',justifyContent:'center',fontSize:'12px'}} onClick={()=>setSpeedResult(null)}>Run Again</button>
                    </div>
                  )}
                </div>

                {/* Weekly trends */}
                <div style={{...s.card2,marginTop:'12px'}}>
                  <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'8px'}}>Weekly Activity Trends</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={WEEKLY}>
                      <defs>
                        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.blue} stopOpacity={0.5}/><stop offset="95%" stopColor={T.blue} stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid stroke={T.border} strokeDasharray="3 3"/>
                      <XAxis dataKey="d" tick={{fill:T.muted,fontSize:10}}/>
                      <YAxis tick={{fill:T.muted,fontSize:10}}/>
                      <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text}}/>
                      <Area type="monotone" dataKey="v" stroke={T.blue} fill="url(#wg)" strokeWidth={2}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ):(
              /* LIVE SCAN MODE - like the real app */
              <div style={{padding:'12px 16px'}}>
                <div style={s.card2}>
                  <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'2px'}}>Signal Strength vs Scan Count</div>
                  <div style={{fontSize:'11px',color:T.muted,marginBottom:'10px'}}>{timeBand} GHz band · Scan #{scanCount}</div>
                  <div style={{background:dark?'#0d1526':'#f8fafc',borderRadius:'8px',padding:'6px',overflowX:'auto'}}>
                    <TimeSpectrumGraph aps={aps} T={T} band={timeBand}/>
                  </div>
                </div>
                <button style={{...s.btn(T.blue),width:'100%',justifyContent:'center',marginTop:'12px'}} onClick={doScan} disabled={scanning}>
                  {scanning?'⏳ Scanning...':'▶ Scan Now'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ EXPORT ══ */}
        {tab==='export'&&(
          <div style={{padding:'12px 16px'}}>
            {selectedReport?(
              <div>
                <button style={{...s.btnText(),marginBottom:'12px'}} onClick={()=>setSelectedReport(null)}>← Back to Reports</button>
                <div style={s.card2}>
                  <div style={{fontSize:'10px',color:T.blue,fontWeight:'700',marginBottom:'4px'}}>{selectedReport.id}</div>
                  <div style={{fontSize:'18px',fontWeight:'800',marginBottom:'4px'}}>{selectedReport.loc}</div>
                  <div style={{fontSize:'12px',color:T.muted,marginBottom:'14px'}}>{selectedReport.date} · {selectedReport.nets} networks</div>
                  <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap'}}>
                    <button style={s.btn(T.blue)} onClick={()=>exportReport('PDF',selectedReport.id)}>📄 PDF</button>
                    <button style={s.btn(T.green)} onClick={()=>exportReport('CSV',selectedReport.id)}>📊 CSV</button>
                  </div>
                  {selectedReport.networks.map((n,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:`1px solid ${T.border}`}}>
                      <span style={{fontWeight:'600'}}>{n.name}</span>
                      <span style={{color:sigColor(n.sig),fontWeight:'700'}}>{n.sig} dBm</span>
                    </div>
                  ))}
                </div>
              </div>
            ):(
              <div>
                <input style={{...s.input,marginBottom:'12px'}} placeholder="🔍 Search reports..." value={reportSearch} onChange={e=>setReportSearch(e.target.value)}/>
                {filteredReports.map((r,i)=>(
                  <div key={i} style={{...s.card2,marginBottom:'10px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                      <div>
                        <div style={{fontSize:'10px',color:T.blue,fontWeight:'700'}}>{r.id}</div>
                        <div style={{fontWeight:'700',fontSize:'13px'}}>{r.loc}</div>
                        <div style={{fontSize:'11px',color:T.muted}}>{r.date} · {r.nets} networks</div>
                      </div>
                      <span style={{background:r.sigColor+'22',color:r.sigColor,fontSize:'11px',fontWeight:'700',padding:'3px 8px',borderRadius:'20px'}}>{r.signal}</span>
                    </div>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button style={{...s.btnText(T.blue),border:`1px solid ${T.border}`,borderRadius:'6px',padding:'6px 10px',fontSize:'11px'}} onClick={()=>setSelectedReport(r)}>👁 View</button>
                      <button style={{...s.btnText(T.green),border:`1px solid ${T.border}`,borderRadius:'6px',padding:'6px 10px',fontSize:'11px'}} onClick={()=>exportReport('PDF',r.id)}>📄 PDF</button>
                      <button style={{...s.btnText(T.yellow),border:`1px solid ${T.border}`,borderRadius:'6px',padding:'6px 10px',fontSize:'11px'}} onClick={()=>exportReport('CSV',r.id)}>📊 CSV</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ VENDORS ══ */}
        {tab==='vendors'&&(
          <div style={{padding:'12px 16px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
              <div><div style={{fontSize:'16px',fontWeight:'800'}}>Organization Management</div><div style={{fontSize:'12px',color:T.muted}}>Team performance & access</div></div>
              <button style={s.btn()} onClick={()=>setShowInvite(true)}>+ Invite</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'14px'}}>
              {[{l:'SECURITY',v:'0',c:T.green},{l:'SCANS/MO',v:'1,248',c:T.green},{l:'UPTIME',v:'99.98%',c:T.muted}].map((x,i)=>(
                <div key={i} style={s.card2}><div style={{fontSize:'9px',color:T.muted,marginBottom:'3px'}}>{x.l}</div><div style={{fontSize:'16px',fontWeight:'800',marginBottom:'2px'}}>{x.v}</div></div>
              ))}
            </div>

            {showInvite&&(
              <div style={s.overlay}>
                <div style={s.modal}>
                  <div style={{fontSize:'16px',fontWeight:'700',marginBottom:'16px'}}>Invite Team Member</div>
                  <form onSubmit={inviteMember} style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                    <div><label style={s.label}>Full Name</label><input style={s.input} placeholder="John Smith" value={inviteName} onChange={e=>setInviteName(e.target.value)}/></div>
                    <div><label style={s.label}>Email</label><input style={s.input} type="email" placeholder="user@company.com" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}/></div>
                    <div><label style={s.label}>Role</label><select style={s.select} value={inviteRole} onChange={e=>setInviteRole(e.target.value)}>{['Junior Tech','Senior Tech','Network Admin','Support Specialist','Manager'].map(r=><option key={r}>{r}</option>)}</select></div>
                    <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                      <button type="submit" style={{...s.btn(),flex:1,justifyContent:'center'}}>Send Invite</button>
                      <button type="button" style={{...s.btn(T.card2,T.text),border:`1px solid ${T.border}`,flex:1,justifyContent:'center'}} onClick={()=>setShowInvite(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div style={s.card2}>
              {members.map((m,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 0',borderBottom:i<members.length-1?`1px solid ${T.border}`:'none'}}>
                  <div style={{width:'36px',height:'36px',borderRadius:'50%',background:T.card,border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',flexShrink:0}}>{m.avatar}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:'700',fontSize:'13px'}}>{m.name}</div>
                    <div style={{fontSize:'11px',color:T.muted}}>{m.email}</div>
                    <div style={{display:'flex',alignItems:'center',gap:'6px',marginTop:'3px'}}>
                      <span style={{background:m.status==='Active'?T.green+'22':T.yellow+'22',color:m.status==='Active'?T.green:T.yellow,fontSize:'9px',fontWeight:'700',padding:'1px 6px',borderRadius:'20px'}}>{m.status}</span>
                      <span style={{fontSize:'10px',color:T.muted}}>{m.role}</span>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'11px',fontWeight:'700',color:T.blue}}>{m.scans} scans</div>
                    <div style={{display:'flex',alignItems:'center',gap:'4px',marginTop:'4px'}}>
                      <div style={{width:'50px',background:T.border,borderRadius:'4px',height:'4px',overflow:'hidden'}}><div style={{width:`${m.perf}%`,height:'100%',background:T.blue,borderRadius:'4px'}}/></div>
                      <span style={{fontSize:'9px',color:T.muted}}>{m.perf}%</span>
                    </div>
                    {m.email!=='hanybkhite@gmail.com'&&<button style={{background:'transparent',border:'none',color:T.red,cursor:'pointer',fontSize:'11px',fontWeight:'700',marginTop:'4px'}} onClick={()=>removeMember(m.id,m.name)}>Remove</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {tab==='settings'&&(
          <div style={{padding:'12px 16px'}}>
            <div style={s.card2}>
              <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'14px'}}>Appearance & Preferences</div>
              {[{icon:'🌙',l:'Dark Mode',sub:'Low-light display',state:dark,toggle:()=>setDark(d=>!d)},{icon:'🔔',l:'Real-time Notifications',sub:'Critical signal alerts',state:notifs,toggle:()=>setNotifs(n=>!n)}].map((item,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px',border:`1px solid ${T.border}`,borderRadius:'10px',marginBottom:'8px'}}>
                  <div style={{width:'36px',height:'36px',background:T.card,borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>{item.icon}</div>
                  <div style={{flex:1}}><div style={{fontWeight:'600',fontSize:'13px'}}>{item.l}</div><div style={{fontSize:'11px',color:T.muted}}>{item.sub}</div></div>
                  <button style={s.toggle(item.state)} onClick={item.toggle}><div style={s.toggleDot(item.state)}/></button>
                </div>
              ))}
            </div>
            <div style={{...s.card2,marginTop:'12px'}}>
              <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'14px'}}>❓ Help</div>
              {[{l:'Getting Started',c:'Enter environment → Start Site Audit → Review networks in registry.'},{l:'How to Scan',c:'Stay within range of APs. Walk slowly. Multiple scans = more accuracy.'},{l:'Multi-Platform',c:'Chrome, Firefox, Safari. Mobile responsive for iOS and Android.'}].map((item,i)=>(
                <div key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                  <button style={{width:'100%',background:'transparent',border:'none',color:T.text,padding:'12px 0',display:'flex',justifyContent:'space-between',cursor:'pointer',fontSize:'13px',fontWeight:'600',textAlign:'left'}} onClick={()=>setAccordion(a=>({...a,[i]:!a[i]}))}>
                    {item.l}<span style={{color:T.muted}}>{accordion[i]?'▲':'▼'}</span>
                  </button>
                  {accordion[i]&&<div style={{fontSize:'12px',color:T.muted,paddingBottom:'12px',lineHeight:'1.6'}}>{item.c}</div>}
                </div>
              ))}
            </div>
            <div style={{...s.card2,marginTop:'12px'}}>
              <div style={{fontSize:'14px',fontWeight:'700',marginBottom:'12px'}}>System Information</div>
              {[{l:'App Version',v:'v3.0.0 Enterprise'},{l:'Database',v:'Firebase Firestore'},{l:'Admin',v:'hanybkhite@gmail.com'},{l:'Status',v:'✅ Operational'}].map((r,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontSize:'12px',color:T.muted}}>{r.l}</span>
                  <span style={{fontSize:'12px',fontWeight:'700'}}>{r.v}</span>
                </div>
              ))}
              <div style={{marginTop:'10px',display:'flex',gap:'6px',flexWrap:'wrap'}}>
                {['WiFi 6E','WiFi 6','WPA3','802.11ax'].map(x=>(
                  <span key={x} style={{background:T.blue+'22',color:T.blue,fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'4px'}}>{x}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ ABOUT ══ */}
        {tab==='about'&&(
          <div style={{padding:'24px 16px',textAlign:'center'}}>
            <div style={{width:'64px',height:'64px',background:'linear-gradient(135deg,#1e3a5f,#1e40af)',border:`2px solid ${T.blue}`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',margin:'0 auto 16px'}}>📡</div>
            <div style={{fontSize:'24px',fontWeight:'800',marginBottom:'6px'}}>NetPulse CAF Analyzer</div>
            <div style={{fontSize:'13px',color:T.muted,marginBottom:'28px'}}>v3.0.0 Enterprise Infrastructure Monitoring</div>
            {[{i:'🛡️',l:'Secure Analysis',t:'Real-time spectral analysis without compromising endpoint security.'},{i:'📡',l:'Aruba Optimized',t:'Deep integration with Aruba AP hardware for hidden AP tracking and channel optimization.'},{i:'🌐',l:'Global Deployment',t:'Used by field technicians across multiple continents. Maintained by GDIT Engineering Team.'}].map((x,i)=>(
              <div key={i} style={{...s.card2,textAlign:'left',marginBottom:'10px'}}>
                <div style={{fontSize:'20px',marginBottom:'8px'}}>{x.i}</div>
                <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'5px'}}>{x.l}</div>
                <div style={{fontSize:'12px',color:T.muted,lineHeight:'1.6'}}>{x.t}</div>
              </div>
            ))}
            <div style={{fontSize:'12px',color:T.muted,marginTop:'20px'}}>© 2024 CAF-WIFI Operations | All Rights Reserved</div>
            <div style={{fontSize:'11px',color:T.border,marginTop:'4px'}}>GDIT-CAF-NETPULSE-v3-PROD</div>
          </div>
        )}
      </div>

      {/* FILTER MODAL */}
      {showFilter&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:100}}>
          <div style={{background:'#2a2a2a',borderRadius:'16px 16px 0 0',padding:'24px',width:'100%',maxWidth:'480px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px',paddingBottom:'16px',borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:'18px'}}>⚙️</span>
              <span style={{fontSize:'18px',fontWeight:'700',color:'#fff'}}>Filter</span>
            </div>

            <div style={{marginBottom:'20px'}}>
              <div style={{fontSize:'14px',fontWeight:'600',color:'#fff',marginBottom:'10px'}}>SSID (case sensitive)</div>
              <input style={{...s.input,background:'#1a1a1a',borderBottom:`2px solid ${T.blue}`,borderTop:'none',borderLeft:'none',borderRight:'none',borderRadius:0,color:'#fff'}} placeholder="ssid SSID" value={filterSSID} onChange={e=>setFilterSSID(e.target.value)}/>
            </div>

            <div style={{marginBottom:'20px',paddingBottom:'20px',borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:'14px',fontWeight:'600',color:'#fff',marginBottom:'12px'}}>Signal Strength</div>
              <div style={{display:'flex',gap:'16px',justifyContent:'center'}}>
                {[0,1,2,3,4].map(level=>{
                  const colors=['#ef4444','#f97316','#eab308','#84cc16','#22c55e'];
                  return (
                    <button key={level} onClick={()=>setFilterSig(filterSig===level?null:level)} style={{background:'transparent',border:'none',cursor:'pointer',opacity:filterSig===null||filterSig===level?1:0.4}}>
                      <svg width="36" height="36" viewBox="0 0 40 40">
                        <circle cx="20" cy="32" r="3" fill={colors[level]}/>
                        {level>=1&&<path d="M12,28 A10,10 0 0,1 28,28" fill={colors[level]} stroke="none" opacity="0.9"/>}
                        {level>=2&&<path d="M8,23 A15,15 0 0,1 32,23" fill="none" stroke={colors[level]} strokeWidth="3" strokeLinecap="round"/>}
                        {level>=3&&<path d="M4,18 A20,20 0 0,1 36,18" fill="none" stroke={colors[level]} strokeWidth="3" strokeLinecap="round"/>}
                        {level>=4&&<path d="M1,12 A24,24 0 0,1 39,12" fill="none" stroke={colors[level]} strokeWidth="3" strokeLinecap="round"/>}
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{marginBottom:'24px'}}>
              <div style={{fontSize:'14px',fontWeight:'600',color:'#fff',marginBottom:'12px'}}>Security</div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                {['None','WPS','WEP','WPA','WPA2','WPA3'].map(sec=>(
                  <button key={sec} onClick={()=>setFilterSec(prev=>prev.includes(sec)?prev.filter(x=>x!==sec):[...prev,sec])} style={{...s.secBadge(filterSec.includes(sec)),color:filterSec.includes(sec)?T.blue:'#aaa'}}>
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <button onClick={()=>setShowFilter(false)} style={{...s.btnText(T.blue),fontSize:'14px'}}>CLOSE</button>
              <div style={{display:'flex',gap:'16px'}}>
                <button onClick={resetFilter} style={{...s.btnText(T.blue),fontSize:'14px'}}>RESET</button>
                <button onClick={applyFilter} style={{...s.btnText(T.blue),fontSize:'14px'}}>APPLY</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{background:T.topbar,borderTop:`1px solid ${T.border}`,padding:'6px 16px',fontSize:'9px',color:T.border,textAlign:'center',letterSpacing:'0.06em'}}>
        SYSTEM: v3.0.0 | STATE: <span style={{color:T.green}}>SECUREOPS</span> | ENCRYPTION: AES-256-FIPS
      </div>

      {/* BOTTOM NAV */}
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
