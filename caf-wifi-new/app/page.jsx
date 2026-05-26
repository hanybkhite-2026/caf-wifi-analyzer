'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

// ══════════════════════════════════════════════════════════════════════
// WiFiAnalyzer accurate implementation based on VREM source specifications
// ══════════════════════════════════════════════════════════════════════

// ── EXACT channel → frequency mapping (from WiFiAnalyzer source) ────────
// 2.4 GHz: ch1=2412, ch2=2417...ch13=2472, ch14=2484
// 5 GHz: ch36=5180, ch40=5200...etc
// 6 GHz: ch1=5955, ch5=5975...etc
const CH_FREQ_24 = {1:2412,2:2417,3:2422,4:2427,5:2432,6:2437,7:2442,8:2447,9:2452,10:2457,11:2462,12:2467,13:2472,14:2484};
const CH_FREQ_5  = {36:5180,40:5200,44:5220,48:5240,52:5260,56:5280,60:5300,64:5320,100:5500,104:5520,108:5540,112:5560,116:5580,120:5600,124:5620,128:5640,132:5660,136:5680,140:5700,144:5720,149:5745,153:5765,157:5785,161:5805,165:5825};
const CH_FREQ_6  = {1:5955,5:5975,9:5995,13:6015,17:6035,21:6055,25:6075,29:6095,33:6115,37:6135,41:6155,45:6175,49:6195,53:6215,57:6235,61:6255,65:6275,69:6295,73:6315,77:6335,81:6355,85:6375,89:6395,93:6415,97:6435,101:6455,105:6475,109:6495,113:6515,117:6535,121:6555,125:6575,129:6595,133:6615,137:6635,141:6655,145:6675,149:6695,153:6715,157:6735,161:6755,165:6775,169:6795,173:6815,177:6835,181:6855,185:6875,189:6895,193:6915,197:6935,201:6955,205:6975,209:6995,213:7015,217:7035,221:7055,225:7075,229:7095};

// Frequency to channel (reverse lookup)
const freqToCh=(freq)=>{
  for(const[ch,f] of Object.entries({...CH_FREQ_24,...CH_FREQ_5,...CH_FREQ_6})) if(f===freq) return parseInt(ch);
  return null;
};

// Channel bandwidth in MHz → number of channels it spans
const BW_TO_SPAN = {20:2, 40:4, 80:8, 160:16, 320:32};

// Distance formula: Free-space path loss model (from WiFiAnalyzer)
// distance = 10 ^ ((txPower - RSSI) / (10 * n)) where n=2 (free space)
// WiFiAnalyzer uses txPower=100 for standardization
const calcDistance=(signal, freq)=>{
  const exp=(27.55 - (20 * Math.log10(freq)) + Math.abs(signal)) / 20.0;
  return Math.round(Math.pow(10,exp)*10)/10;
};

// Signal quality 0-4 levels
const sigLevel=(s)=>s>=-50?4:s>=-60?3:s>=-70?2:s>=-80?1:0;
const sigColor=(s)=>s>=-50?'#4ade80':s>=-60?'#86efac':s>=-70?'#facc15':s>=-80?'#fb923c':'#f87171';
const sigLabel=(s)=>s>=-50?'Excellent':s>=-60?'Good':s>=-70?'Reliable':s>=-80?'Weak':'Unusable';

// Security detection
const hasSecurity=(secs,type)=>secs.includes(type);
const secIcon=(secs)=>{
  if(secs.includes('WPA3')||secs.includes('WPA2')||secs.includes('WPA')) return '🔒';
  if(secs.includes('WEP')||secs.includes('WPS')) return '🔓';
  return '🔓'; // open
};

// OUI Vendor lookup (first 3 bytes of MAC)
const OUI_MAP={
  '00:0B:86':'Aruba Networks',
  '00:0B:87':'Aruba Networks',
  '7c:1c:f1':'Huawei Technologies',
  '98:da:c4':'TP-Link Technologies',
  '9e:da:c4':'Generic Vendor',
  'a8:5b:f7':'TP-Link Technologies',
  '44:e9:68':'Huawei Technologies',
  'fc:ec:da':'Aruba Networks',
  'd8:c7:c8':'Aruba Networks',
};
const getVendor=(mac)=>{
  const prefix=mac.substring(0,8).toLowerCase();
  for(const[oui,vendor] of Object.entries(OUI_MAP)){
    if(prefix===oui.toLowerCase()) return vendor;
  }
  return 'Unknown Vendor';
};

// ── AP DATA ──────────────────────────────────────────────────────────────
const INIT_APS = [
  {ssid:'CAF-WIFI-5G', mac:'00:0B:86:12:34:56', signal:-45, primaryCh:36, centerCh:38, freq:5180, bw:40,  security:['WPA2','WPA3'], band:'5',   standard:'6'},
  {ssid:'CAF-WIFI-2G', mac:'00:0B:86:78:90:AB', signal:-67, primaryCh:6,  centerCh:null,freq:2437, bw:20,  security:['WPS','WPA','WPA2'], band:'2.4',standard:'5'},
  {ssid:'CAF-GUEST',   mac:'00:0B:86:CD:EF:01', signal:-79, primaryCh:52, centerCh:48, freq:5260, bw:80,  security:['WPA2'], band:'5',   standard:'5'},
  {ssid:'VTEL-Fiber',  mac:'7c:1c:f1:25:19:2c', signal:-85, primaryCh:1,  centerCh:null,freq:2412, bw:20,  security:['WPA','WPA2'], band:'2.4',standard:'4'},
  {ssid:'Mamon2_5G',   mac:'98:da:c4:26:21:87', signal:-86, primaryCh:36, centerCh:42, freq:5180, bw:80,  security:['WPS','WPA','WPA2'], band:'5',standard:'5'},
  {ssid:'*hidden*',    mac:'9e:da:c4:26:21:87', signal:-87, primaryCh:36, centerCh:42, freq:5180, bw:80,  security:['WPA2'], band:'5',   standard:'5'},
];

// Enrich APs with computed fields
const enrichAP=(ap)=>{
  const vendor=getVendor(ap.mac);
  const dist=calcDistance(ap.signal, ap.freq);
  const freqStart=ap.freq-(ap.bw/2);
  const freqEnd=ap.freq+(ap.bw/2);
  const chLabel=ap.centerCh?`${ap.primaryCh}(${ap.centerCh})`:String(ap.primaryCh);
  return {...ap, vendor, dist, freqStart, freqEnd, chLabel};
};

// Channel Ratings computation (based on signal overlap and congestion)
const computeChannelRatings=(aps, band)=>{
  const bandAPs=aps.filter(a=>a.band===band);
  // For 2.4: channels 1-13; for 5: key channels
  const channels= band==='2.4'
    ? [1,2,3,4,5,6,7,8,9,10,11,12,13]
    : [36,40,44,48,52,56,60,64,100,104,108,112,116,120,124,128,132,136,140,144,149,153,157,161,165];
  return channels.map(ch=>{
    // Count APs that overlap this channel (within ±(bw/10) channels)
    const overlapping=bandAPs.filter(ap=>{
      const span=BW_TO_SPAN[ap.bw]||2;
      return Math.abs(ap.primaryCh-ch)<=span;
    });
    // Stars: 10 - congestion penalty
    const signalPenalty=overlapping.reduce((sum,ap)=>sum+(Math.abs(ap.signal)<70?2:1),0);
    const stars=Math.max(1,Math.min(10,10-signalPenalty));
    return {ch, stars, nets:overlapping.length, band};
  });
};

// Scan history for time graph
const buildScanHistory=(aps)=>aps.map(ap=>({
  ssid:ap.ssid,
  color:['#3b82f6','#22c55e','#a855f7','#f59e0b','#ef4444','#f97316'][INIT_APS.findIndex(a=>a.mac===ap.mac)%6],
  history:[ap.signal],
}));

// ── THEMES ───────────────────────────────────────────────────────────────
const DARK ={bg:'#121212',bar:'#1e1e1e',card:'#252525',card2:'#2d2d2d',border:'#3a3a3a',blue:'#64b5f6',cyan:'#4dd0e1',green:'#81c784',yellow:'#ffb74d',red:'#e57373',purple:'#ba68c8',text:'#e0e0e0',muted:'#9e9e9e'};
const LIGHT={bg:'#fafafa',bar:'#ffffff',card:'#ffffff',card2:'#f5f5f5',border:'#e0e0e0',blue:'#1976d2',cyan:'#0097a7',green:'#388e3c',yellow:'#f57c00',red:'#d32f2f',purple:'#7b1fa2',text:'#212121',muted:'#757575'};

// ── WIFI FAN ICON (SVG, matches real app) ─────────────────────────────────
function WifiFan({signal,size=44}) {
  const lvl=sigLevel(signal);
  const col=sigColor(signal);
  const dim='#555';
  const cx=size/2, cy=size*0.78;
  const r=[size*0.08,size*0.22,size*0.38,size*0.52];
  const a1=-140*Math.PI/180, a2=-40*Math.PI/180;
  const arc=(r,a)=>({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});
  const sector=(ri,ro)=>{
    const p1=arc(ri,a1),p2=arc(ro,a1),p3=arc(ro,a2),p4=arc(ri,a2);
    return `M${p1.x},${p1.y} L${p2.x},${p2.y} A${ro},${ro} 0 0,1 ${p3.x},${p3.y} L${p4.x},${p4.y} A${ri},${ri} 0 0,0 ${p1.x},${p1.y} Z`;
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={size*0.06} fill={col}/>
      {[0,1,2,3].map(i=>(
        <path key={i} d={sector(r[i]+2,r[i+1<4?i+1:i]+size*0.06)} fill={lvl>i?col:dim} opacity={0.9}/>
      ))}
    </svg>
  );
}

// ── CHANNEL GRAPH (accurate trapezoid per WiFiAnalyzer spec) ──────────────
function ChannelGraph({aps, band, T, width=360}) {
  const H=280, pL=46, pR=8, pT=28, pB=44, cW=width-pL-pR, cH=H-pT-pB;
  const dbMin=-100, dbMax=-10;
  const channels= band==='2.4'?Object.keys(CH_FREQ_24).map(Number):Object.keys(CH_FREQ_5).map(Number);
  const chMin=Math.min(...channels), chMax=Math.max(...channels);
  const chX=(ch)=>pL+((ch-chMin)/(chMax-chMin))*cW;
  const dbY=(db)=>pT+((dbMax-db)/(dbMax-dbMin))*cH;
  const filtAps=aps.filter(a=>a.band===band);
  const yLines=[-20,-30,-40,-50,-60,-70,-80,-90,-100];
  const xLabels=band==='2.4'?[1,2,3,4,5,6,7,8,9,10,11,12,13]:[36,52,100,116,132,149,165];

  // Trapezoid path: bottom at dbMin, top at signal, width = bandwidth in channels
  const trapPath=(ap)=>{
    const span=BW_TO_SPAN[ap.bw]||2;
    const cx=ap.primaryCh;
    const top=dbY(ap.signal);
    const bot=dbY(dbMin);
    const half=span;
    const flat=Math.max(0.5,span*0.3);
    const x1=chX(cx-half-0.5); // bottom-left
    const x2=chX(cx-flat);     // top-left
    const x3=chX(cx+flat);     // top-right
    const x4=chX(cx+half+0.5); // bottom-right
    return `M${x1},${bot} L${x2},${top} L${x3},${top} L${x4},${bot} Z`;
  };

  const colors=['#3b82f6','#22c55e','#a855f7','#f59e0b','#ef4444','#f97316','#06b6d4','#84cc16'];

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${H}`} style={{overflow:'visible',display:'block'}}>
      {/* Y grid + labels */}
      {yLines.map(db=>(
        <g key={db}>
          <line x1={pL} y1={dbY(db)} x2={width-pR} y2={dbY(db)} stroke={T.border} strokeWidth="0.5" strokeDasharray="3,3"/>
          <text x={pL-3} y={dbY(db)+4} fill={T.muted} fontSize="9" textAnchor="end">{db}</text>
        </g>
      ))}
      {/* X grid + labels */}
      {xLabels.map(ch=>(
        <g key={ch}>
          <line x1={chX(ch)} y1={pT} x2={chX(ch)} y2={pT+cH} stroke={T.border} strokeWidth="0.5" strokeDasharray="2,4"/>
          <text x={chX(ch)} y={pT+cH+13} fill={T.muted} fontSize="8" textAnchor="middle">{ch}</text>
        </g>
      ))}
      {/* Axes */}
      <line x1={pL} y1={pT} x2={pL} y2={pT+cH} stroke={T.muted} strokeWidth="1"/>
      <line x1={pL} y1={pT+cH} x2={width-pR} y2={pT+cH} stroke={T.muted} strokeWidth="1"/>
      {/* Axis labels */}
      <text x={14} y={pT+cH/2} fill={T.muted} fontSize="8" textAnchor="middle" transform={`rotate(-90,14,${pT+cH/2})`}>Signal Strength (dBm)</text>
      <text x={pL+cW/2} y={H-2} fill={T.muted} fontSize="8" textAnchor="middle">Wi-Fi Channels</text>
      {/* Trapezoids */}
      {filtAps.map((ap,i)=>{
        const col=colors[i%colors.length];
        return (
          <g key={ap.mac}>
            <path d={trapPath(ap)} fill={col+'55'} stroke={col} strokeWidth="1.5"/>
            <text x={chX(ap.primaryCh)} y={dbY(ap.signal)-6} fill={col} fontSize="8" textAnchor="middle" fontWeight="bold">
              {ap.ssid.length>9?ap.ssid.slice(0,8)+'…':ap.ssid}
            </text>
          </g>
        );
      })}
      {/* Legend */}
      <g>
        {filtAps.slice(0,4).map((ap,i)=>{
          const col=colors[i%colors.length];
          return (
            <g key={i}>
              <rect x={pL+i*86} y={pT-18} width="7" height="7" fill={col} rx="1"/>
              <text x={pL+i*86+10} y={pT-12} fill={T.muted} fontSize="7">{ap.ssid.length>9?ap.ssid.slice(0,8)+'…':ap.ssid} {ap.primaryCh}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ── TIME GRAPH (signal over time, per WiFiAnalyzer spec) ─────────────────
function TimeGraph({scanHistory, T, width=360}) {
  const H=260, pL=46, pR=8, pT=20, pB=36, cW=width-pL-pR, cH=H-pT-pB;
  const dbMin=-100, dbMax=-20;
  const maxScans=Math.max(10,...scanHistory.map(s=>s.history.length));
  const xScale=(i)=>pL+(i/(maxScans-1||1))*cW;
  const dbY=(db)=>pT+((dbMax-db)/(dbMax-dbMin))*cH;
  const yLines=[-30,-40,-50,-60,-70,-80,-90];
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${H}`} style={{overflow:'visible',display:'block'}}>
      {yLines.map(db=>(
        <g key={db}>
          <line x1={pL} y1={dbY(db)} x2={width-pR} y2={dbY(db)} stroke={T.border} strokeWidth="0.5" strokeDasharray="3,3"/>
          <text x={pL-3} y={dbY(db)+4} fill={T.muted} fontSize="9" textAnchor="end">{db}</text>
        </g>
      ))}
      {/* X axis markers */}
      {[0,Math.floor(maxScans/4),Math.floor(maxScans/2),Math.floor(3*maxScans/4),maxScans-1].map((i,idx)=>(
        <text key={idx} x={xScale(i)} y={pT+cH+14} fill={T.muted} fontSize="8" textAnchor="middle">{i+1}</text>
      ))}
      <line x1={pL} y1={pT} x2={pL} y2={pT+cH} stroke={T.muted} strokeWidth="1"/>
      <line x1={pL} y1={pT+cH} x2={width-pR} y2={pT+cH} stroke={T.muted} strokeWidth="1"/>
      <text x={14} y={pT+cH/2} fill={T.muted} fontSize="8" textAnchor="middle" transform={`rotate(-90,14,${pT+cH/2})`}>Signal (dBm)</text>
      <text x={pL+cW/2} y={H-2} fill={T.muted} fontSize="8" textAnchor="middle">Scan Count</text>
      {/* Lines per AP */}
      {scanHistory.map((s,i)=>{
        if(s.history.length<2) return null;
        const pts=s.history.map((v,j)=>`${xScale(j)},${dbY(v)}`).join(' ');
        return (
          <g key={i}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth="1.5" strokeLinejoin="round"/>
            {s.history.map((v,j)=>(
              <circle key={j} cx={xScale(j)} cy={dbY(v)} r="2.5" fill={s.color}/>
            ))}
            <text x={xScale(s.history.length-1)+5} y={dbY(s.history[s.history.length-1])+4} fill={s.color} fontSize="8" fontWeight="bold">
              {s.ssid.length>8?s.ssid.slice(0,7)+'…':s.ssid}
            </text>
          </g>
        );
      })}
      {/* Legend */}
      {scanHistory.slice(0,4).map((s,i)=>(
        <g key={i}>
          <rect x={pL+i*90} y={pT-14} width="6" height="6" fill={s.color}/>
          <text x={pL+i*90+9} y={pT-8} fill={T.muted} fontSize="7">{s.ssid}</text>
        </g>
      ))}
    </svg>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn,setLoggedIn]=useState(true);
  const [loginUser,setLoginUser]=useState('hanybkhite@gmail.com');
  const [loginPass,setLoginPass]=useState('');
  const [loginErr,setLoginErr]=useState('');
  const [dark,setDark]=useState(true);
  const [tab,setTab]=useState('access-points');
  const [band,setBand]=useState('2.4');
  const [paused,setPaused]=useState(false);
  const [scanCount,setScanCount]=useState(1);
  const [aps,setAps]=useState(INIT_APS.map(enrichAP));
  const [scanHistory,setScanHistory]=useState(buildScanHistory(INIT_APS.map(enrichAP)));
  const [selectedAP,setSelectedAP]=useState(null);
  const [showFilter,setShowFilter]=useState(false);
  const [filterSSID,setFilterSSID]=useState('');
  const [filterBands,setFilterBands]=useState(['2.4','5','6']);
  const [filterSig,setFilterSig]=useState(null);
  const [filterSec,setFilterSec]=useState([]);
  const [appliedFilter,setAppliedFilter]=useState({ssid:'',bands:['2.4','5','6'],sig:null,sec:[]});
  const [sortBy,setSortBy]=useState('signal'); // signal|ssid|channel
  const [members,setMembers]=useState([
    {id:1,name:'Hany Bkhite',role:'Super Admin',status:'Active',email:'hanybkhite@gmail.com',avatar:'👑',scans:512,perf:100},
    {id:2,name:'Alex Johnson',role:'Senior Tech',status:'Active',email:'alex@caf.com',avatar:'👨‍💻',scans:145,perf:58},
    {id:3,name:'Maria Garcia',role:'Network Admin',status:'Active',email:'maria@caf.com',avatar:'👩‍💻',scans:89,perf:38},
  ]);
  const [showInvite,setShowInvite]=useState(false);
  const [inviteForm,setInviteForm]=useState({name:'',email:'',role:'Junior Tech'});
  const [reports,setReports]=useState([
    {id:'REP-001',loc:'Main Campus - Wing A',date:'2024-05-15',aps:INIT_APS.map(enrichAP),env:'Wing A'},
    {id:'REP-002',loc:'Basement Storage',date:'2024-05-18',aps:INIT_APS.slice(3).map(enrichAP),env:'Basement'},
  ]);
  const [selectedReport,setSelectedReport]=useState(null);
  const [auditEnv,setAuditEnv]=useState('');
  const [auditRunning,setAuditRunning]=useState(false);
  const [auditPct,setAuditPct]=useState(0);
  const [accordion,setAccordion]=useState({});
  const [toasts,setToasts]=useState([]);
  const [darkMode2,setDarkMode2]=useState(true);
  const [notifs,setNotifs]=useState(true);

  const T=dark?DARK:LIGHT;
  const scanIntervalRef=useRef(null);

  const toast=(msg,type='info')=>{
    const id=Date.now();
    setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3500);
  };

  // ── Auto scan every 5 seconds (like real app) ─────────────────────────
  const doScan=useCallback(()=>{
    if(paused) return;
    setAps(prev=>{
      const next=prev.map(ap=>({
        ...ap,
        signal:Math.max(-95,Math.min(-30,ap.signal+(Math.random()*4-2))),
      })).map(ap=>({...ap,dist:calcDistance(ap.signal,ap.freq)}));
      // Update history
      setScanHistory(hist=>hist.map(h=>{
        const ap=next.find(a=>a.ssid===h.ssid);
        if(!ap) return h;
        return {...h,history:[...h.history.slice(-29),ap.signal]};
      }));
      return next;
    });
    setScanCount(c=>c+1);
  },[paused]);

  useEffect(()=>{
    scanIntervalRef.current=setInterval(doScan,5000);
    return ()=>clearInterval(scanIntervalRef.current);
  },[doScan]);

  const togglePause=()=>{
    setPaused(p=>!p);
    toast(paused?'▶ Scanning resumed':'⏸ Scanning paused','info');
  };

  const doLogin=(e)=>{
    e.preventDefault();
    const USERS=[
      {email:'hanybkhite@gmail.com',pass:'1234!@#$Hany'},
      {email:'admin',pass:'admin123'},
    ];
    if(USERS.some(u=>u.email===loginUser&&u.pass===loginPass)){
      setLoggedIn(true);
      toast('Welcome back! ✅','success');
    } else setLoginErr('Invalid credentials.');
  };

  const startAudit=async()=>{
    if(!auditEnv.trim()){toast('Enter environment name','error');return;}
    setAuditRunning(true);setAuditPct(0);
    for(let i=1;i<=20;i++){await new Promise(r=>setTimeout(r,120));setAuditPct(i*5);}
    const newReport={id:`REP-${String(reports.length+1).padStart(3,'0')}`,loc:auditEnv,date:new Date().toISOString().slice(0,10),aps:[...aps],env:auditEnv};
    setReports(r=>[...r,newReport]);
    setAuditRunning(false);
    toast(`✅ Audit "${auditEnv}" saved — ${aps.length} networks`,'success');
    setAuditEnv('');
  };

  // Filter logic matching WiFiAnalyzer
  const applyFilter=()=>{
    setAppliedFilter({ssid:filterSSID,bands:filterBands,sig:filterSig,sec:filterSec});
    setShowFilter(false);
    toast('Filter applied','success');
  };
  const resetFilter=()=>{setFilterSSID('');setFilterBands(['2.4','5','6']);setFilterSig(null);setFilterSec([]);};

  const displayAPs=aps
    .filter(ap=>{
      const f=appliedFilter;
      if(f.ssid&&!ap.ssid.toLowerCase().includes(f.ssid.toLowerCase())) return false;
      if(!f.bands.includes(ap.band)) return false;
      if(f.sig!==null&&sigLevel(ap.signal)!==f.sig) return false;
      if(f.sec.length>0&&!f.sec.some(s=>ap.security.includes(s))) return false;
      return true;
    })
    .filter(ap=>ap.band===band)
    .sort((a,b)=>sortBy==='signal'?a.signal-b.signal:sortBy==='ssid'?a.ssid.localeCompare(b.ssid):a.primaryCh-b.primaryCh);

  const channelRatings=computeChannelRatings(aps, band==='2.4'?'2.4':'5');
  const colors=['#3b82f6','#22c55e','#a855f7','#f59e0b','#ef4444','#f97316','#06b6d4','#84cc16'];

  // ── STYLES ──────────────────────────────────────────────────────────────
  const s={
    app:{display:'flex',flexDirection:'column',minHeight:'100vh',background:T.bg,color:T.text,fontFamily:"'Roboto','Segoe UI',sans-serif",paddingBottom:'64px'},
    topbar:{background:T.bar,borderBottom:`1px solid ${T.border}`,padding:'0 16px',display:'flex',alignItems:'center',height:'56px',position:'sticky',top:0,zIndex:20,gap:'10px'},
    content:{flex:1},
    card:{background:T.card,borderRadius:'4px',marginBottom:'2px'},
    apRow:{borderBottom:`1px solid ${T.border}`,padding:'10px 16px',cursor:'pointer',transition:'background 0.15s'},
    input:{background:T.card2,border:`1px solid ${T.border}`,color:T.text,padding:'10px 14px',borderRadius:'4px',fontSize:'14px',outline:'none',width:'100%',boxSizing:'border-box'},
    select:{background:T.card2,border:`1px solid ${T.border}`,color:T.text,padding:'8px 12px',borderRadius:'4px',fontSize:'13px',outline:'none',cursor:'pointer'},
    btn:(bg,tc,h)=>({background:bg||T.blue,color:tc||'#fff',border:'none',padding:h||'8px 16px',borderRadius:'4px',cursor:'pointer',fontSize:'13px',fontWeight:'500',display:'inline-flex',alignItems:'center',gap:'6px'}),
    chipBtn:(active)=>({background:active?T.blue+'33':'transparent',border:`1px solid ${active?T.blue:T.border}`,color:active?T.blue:T.muted,padding:'5px 12px',borderRadius:'20px',cursor:'pointer',fontSize:'12px',fontWeight:'600'}),
    table:{width:'100%',borderCollapse:'collapse'},
    th:{textAlign:'left',padding:'8px 12px',borderBottom:`1px solid ${T.border}`,color:T.muted,fontSize:'11px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.06em'},
    td:{padding:'10px 12px',borderBottom:`1px solid ${T.border}`,fontSize:'13px'},
    badge:(bg,tc)=>({background:bg,color:tc,fontSize:'10px',fontWeight:'700',padding:'1px 6px',borderRadius:'3px',display:'inline-block',marginRight:'3px'}),
    label:{fontSize:'11px',color:T.muted,display:'block',marginBottom:'4px',fontWeight:'500'},
    overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:100},
    sheet:{background:T.card,borderRadius:'16px 16px 0 0',padding:'20px',width:'100%',maxWidth:'500px',maxHeight:'88vh',overflowY:'auto'},
    progressWrap:{background:T.border,borderRadius:'2px',height:'4px',overflow:'hidden',marginTop:'8px'},
    progressBar:(p,c)=>({width:`${p}%`,height:'100%',background:c||T.blue,transition:'width 0.15s'}),
    toggle:(on)=>({width:'44px',height:'24px',borderRadius:'12px',background:on?T.blue:T.border,cursor:'pointer',border:'none',position:'relative',transition:'background 0.2s',flexShrink:0}),
    toggleDot:(on)=>({position:'absolute',top:'3px',left:on?'23px':'3px',width:'18px',height:'18px',borderRadius:'50%',background:'#fff',transition:'left 0.2s'}),
    bottomNav:{position:'fixed',bottom:0,left:0,right:0,background:T.bar,borderTop:`1px solid ${T.border}`,display:'flex',zIndex:30,height:'60px'},
    navBtn:(a)=>({flex:1,background:'transparent',border:'none',color:a?T.blue:T.muted,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'1px',fontSize:'9px',fontWeight:a?'700':'500',padding:'6px 2px'}),
  };

  // ── LOGIN ────────────────────────────────────────────────────────────────
  if(!loggedIn) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#121212',padding:'20px'}}>
      <div style={{background:'#1e1e1e',border:'1px solid #333',borderRadius:'12px',padding:'32px',maxWidth:'380px',width:'100%'}}>
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{width:'56px',height:'56px',background:'linear-gradient(135deg,#1565c0,#1976d2)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',margin:'0 auto 14px'}}>📡</div>
          <div style={{fontSize:'22px',fontWeight:'700',color:'#e0e0e0'}}>NetPulse CAF</div>
          <div style={{fontSize:'12px',color:'#9e9e9e',marginTop:'4px'}}>Enterprise WiFi Analyzer v3.0.0</div>
        </div>
        <form onSubmit={doLogin} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          {loginErr&&<div style={{background:'#b71c1c22',border:'1px solid #e57373',color:'#ef9a9a',padding:'10px',borderRadius:'4px',fontSize:'13px'}}>{loginErr}</div>}
          <div><label style={{fontSize:'12px',color:'#9e9e9e',display:'block',marginBottom:'5px'}}>EMAIL / USERNAME</label><input style={{...s.input,background:'#2a2a2a',border:'1px solid #444',color:'#e0e0e0'}} type="text" value={loginUser} onChange={e=>setLoginUser(e.target.value)} placeholder="hanybkhite@gmail.com"/></div>
          <div><label style={{fontSize:'12px',color:'#9e9e9e',display:'block',marginBottom:'5px'}}>PASSWORD</label><input style={{...s.input,background:'#2a2a2a',border:'1px solid #444',color:'#e0e0e0'}} type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} placeholder="••••••••"/></div>
          <button style={{...s.btn('#1565c0','#fff','12px 20px'),justifyContent:'center',borderRadius:'8px',fontSize:'15px',fontWeight:'600'}} type="submit">Sign In</button>
        </form>
        <div style={{background:'#1a237e22',border:'1px solid #1565c044',borderRadius:'6px',padding:'10px',marginTop:'14px',fontSize:'11px',color:'#64b5f6',textAlign:'center'}}>
          Admin: hanybkhite@gmail.com<br/>Password: 1234!@#$Hany
        </div>
      </div>
    </div>
  );

  const NAV=[
    {id:'access-points',label:'Access Points',icon:'📡'},
    {id:'channel-rating',label:'Ch. Rating',icon:'⭐'},
    {id:'channel-graph',label:'Ch. Graph',icon:'📊'},
    {id:'time-graph',label:'Time Graph',icon:'📈'},
    {id:'export',label:'Export',icon:'📤'},
    {id:'vendors',label:'Vendors',icon:'👥'},
    {id:'settings',label:'Settings',icon:'⚙️'},
    {id:'about',label:'About',icon:'ℹ️'},
  ];

  const bandTabs=aps.map(a=>a.band);
  const availBands=['2.4','5'].filter(b=>bandTabs.includes(b));

  return (
    <div style={s.app}>
      {/* TOASTS */}
      <div style={{position:'fixed',top:'68px',right:'12px',zIndex:200,display:'flex',flexDirection:'column',gap:'6px',pointerEvents:'none',maxWidth:'260px'}}>
        {toasts.map(t=>(
          <div key={t.id} style={{background:t.type==='error'?'#b71c1c':t.type==='success'?'#1b5e20':'#1a237e',color:'#fff',padding:'8px 12px',borderRadius:'8px',fontSize:'12px',fontWeight:'500',boxShadow:'0 4px 16px rgba(0,0,0,0.4)'}}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* TOPBAR */}
      <div style={s.topbar}>
        <div style={{fontWeight:'700',fontSize:'16px',color:T.text,flex:1}}>{NAV.find(n=>n.id===tab)?.label}</div>
        {/* Band selector (shown on relevant tabs) */}
        {['access-points','channel-rating','channel-graph','time-graph'].includes(tab)&&(
          <div style={{display:'flex',gap:'3px',background:T.card2,borderRadius:'4px',padding:'2px'}}>
            {availBands.map(b=>(
              <button key={b} onClick={()=>setBand(b)} style={{background:band===b?T.blue:'transparent',border:'none',color:band===b?'#fff':T.muted,padding:'4px 10px',borderRadius:'3px',cursor:'pointer',fontSize:'11px',fontWeight:'700'}}>
                {b} GHz
              </button>
            ))}
          </div>
        )}
        {/* Filter */}
        {['access-points','channel-graph','time-graph'].includes(tab)&&(
          <button onClick={()=>setShowFilter(true)} style={{background:'transparent',border:'none',color:T.muted,cursor:'pointer',fontSize:'20px',padding:'4px',lineHeight:1}}>⚙️</button>
        )}
        {/* Pause/Resume */}
        {['access-points','channel-graph','time-graph'].includes(tab)&&(
          <button onClick={togglePause} style={{background:'transparent',border:'none',color:T.muted,cursor:'pointer',fontSize:'20px',padding:'4px',lineHeight:1}}>
            {paused?'▶':'⏸'}
          </button>
        )}
        <button onClick={()=>setDark(d=>!d)} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:'18px',padding:'4px'}}>{dark?'☀️':'🌙'}</button>
        <button onClick={()=>setLoggedIn(false)} style={{background:'transparent',border:`1px solid ${T.red}`,color:T.red,padding:'4px 10px',borderRadius:'4px',cursor:'pointer',fontSize:'11px',fontWeight:'600'}}>Exit</button>
      </div>

      {/* CONNECTION BANNER */}
      {['access-points','channel-rating','channel-graph','time-graph'].includes(tab)&&(()=>{
        const conn=aps.find(a=>a.ssid==='CAF-WIFI-5G');
        if(!conn) return null;
        return (
          <div style={{background:dark?'#0d1b2a':'#e3f2fd',borderBottom:`1px solid ${T.border}`,padding:'8px 16px'}}>
            <div style={{fontSize:'11px',color:T.blue,fontWeight:'600',marginBottom:'2px'}}>Current connection</div>
            <div style={{fontWeight:'700',fontSize:'13px'}}>{conn.ssid} ({conn.mac})</div>
            <div style={{fontSize:'12px',marginTop:'1px'}}>
              <span style={{color:sigColor(conn.signal),fontWeight:'700'}}>{Math.round(conn.signal)}dBm</span>
              <span style={{color:T.muted}}> CH </span>
              <span style={{color:T.blue,fontWeight:'700'}}>{conn.chLabel}</span>
              <span style={{color:T.muted}}> {conn.freq}MHz</span>
              <span style={{color:'#4dd0e1',fontWeight:'700'}}> ~{conn.dist}m</span>
            </div>
            <div style={{color:T.blue,fontSize:'12px',fontWeight:'500',marginTop:'1px'}}>850Mbps 192.168.100.15</div>
          </div>
        );
      })()}

      {/* THROTTLE WARNING */}
      {['access-points','channel-rating','channel-graph','time-graph'].includes(tab)&&(
        <div style={{background:dark?'#1a0a0a':'#ffebee',borderBottom:`1px solid ${T.red}33`,padding:'6px 16px',fontSize:'11px',color:T.red,display:'flex',alignItems:'center',gap:'6px'}}>
          ✕ Wi-Fi scan throttling is enabled
        </div>
      )}

      {/* CONTENT */}
      <div style={s.content}>

        {/* ══ ACCESS POINTS ══ */}
        {tab==='access-points'&&(
          <div>
            {/* Scan info + sort */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 16px',background:T.card,borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:'11px',color:T.muted}}>
                {displayAPs.length} APs · Scan #{scanCount} · {paused?'Paused':'Live'}
                {(appliedFilter.ssid||appliedFilter.sig!==null||appliedFilter.sec.length>0)&&
                  <span style={{color:T.blue,marginLeft:'8px',cursor:'pointer'}} onClick={()=>setAppliedFilter({ssid:'',bands:['2.4','5','6'],sig:null,sec:[]})}>✕ Clear</span>
                }
              </span>
              <select style={{...s.select,width:'auto',fontSize:'11px',padding:'3px 8px'}} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                <option value="signal">Signal ↓</option>
                <option value="ssid">SSID A-Z</option>
                <option value="channel">Channel</option>
              </select>
            </div>

            {/* AP List */}
            {displayAPs.map((ap,i)=>(
              <div key={ap.mac} style={{...s.apRow,background:selectedAP?.mac===ap.mac?T.card2:T.card}} onClick={()=>setSelectedAP(p=>p?.mac===ap.mac?null:ap)}>
                <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'2px',color:T.text}}>
                  {ap.ssid} <span style={{color:T.muted,fontWeight:'400',fontSize:'11px'}}>({ap.mac})</span>
                </div>
                <div style={{fontSize:'12px',marginBottom:'6px',fontFamily:'monospace'}}>
                  <span style={{color:sigColor(ap.signal),fontWeight:'700'}}>{Math.round(ap.signal)}dBm</span>
                  <span style={{color:T.muted}}> CH </span>
                  <span style={{color:T.blue,fontWeight:'700'}}>{ap.chLabel}</span>
                  <span style={{color:T.muted}}> {ap.freq}MHz</span>
                  {ap.dist&&<span style={{color:'#4dd0e1',fontWeight:'600'}}> ~{ap.dist}m</span>}
                </div>
                <div style={{display:'flex',alignItems:'flex-start',gap:'10px'}}>
                  <WifiFan signal={Math.round(ap.signal)} size={42}/>
                  <div>
                    <div style={{fontSize:'11px',color:T.blue,fontFamily:'monospace'}}>
                      {ap.freqStart} - {ap.freqEnd} {ap.bw} MHz
                      <span style={{color:T.muted,marginLeft:'6px'}}>{ap.vendor.length>18?ap.vendor.slice(0,17)+'…':ap.vendor}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'6px',marginTop:'4px',flexWrap:'wrap'}}>
                      {/* Signal bars */}
                      <div style={{display:'flex',gap:'2px',alignItems:'flex-end'}}>
                        {[1,2,3,4].map(b=>(
                          <div key={b} style={{width:'4px',height:`${b*4+2}px`,background:sigLevel(ap.signal)>=b?sigColor(ap.signal):T.border,borderRadius:'1px'}}/>
                        ))}
                      </div>
                      <span style={{fontSize:'10px',color:T.muted}}>{secIcon(ap.security)}</span>
                      {ap.security.map(sec=>(
                        <span key={sec} style={{...s.badge(T.card2,T.blue)}}>[{sec}]</span>
                      ))}
                      {ap.standard&&<span style={{background:T.blue+'22',color:T.blue,fontSize:'9px',fontWeight:'700',padding:'1px 5px',borderRadius:'3px'}}>{ap.standard}</span>}
                    </div>
                  </div>
                </div>
                {/* Expanded */}
                {selectedAP?.mac===ap.mac&&(
                  <div style={{marginTop:'12px',paddingTop:'12px',borderTop:`1px solid ${T.border}`,display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                    {[
                      {l:'Signal',v:`${Math.round(ap.signal)} dBm (${sigLabel(ap.signal)})`},
                      {l:'Channel',v:`${ap.chLabel} (${ap.bw} MHz)`},
                      {l:'Frequency',v:`${ap.freq} MHz`},
                      {l:'Freq Range',v:`${ap.freqStart}–${ap.freqEnd} MHz`},
                      {l:'Distance',v:`~${ap.dist}m`},
                      {l:'Vendor',v:ap.vendor},
                      {l:'MAC',v:ap.mac},
                      {l:'Security',v:ap.security.join(', ')},
                      {l:'Band',v:`${ap.band} GHz`},
                      {l:'WiFi Std',v:`802.11 ${ap.standard==='6'?'ax':ap.standard==='5'?'ac':ap.standard==='4'?'n':'?'} (WiFi ${ap.standard})`},
                    ].map(x=>(
                      <div key={x.l} style={{fontSize:'11px'}}>
                        <div style={{color:T.muted,marginBottom:'1px'}}>{x.l}</div>
                        <div style={{fontWeight:'600',color:T.text,wordBreak:'break-all'}}>{x.v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Site Audit */}
            <div style={{padding:'16px',background:T.card,marginTop:'2px'}}>
              <div style={{fontSize:'11px',color:T.muted,marginBottom:'8px',fontWeight:'600',letterSpacing:'0.08em'}}>SITE AUDIT</div>
              <input style={{...s.input,marginBottom:'8px'}} placeholder="e.g., Data Center Rack B-12" value={auditEnv} onChange={e=>setAuditEnv(e.target.value)}/>
              <button style={{...s.btn(auditRunning?T.muted:T.blue),width:'100%',justifyContent:'center',opacity:auditRunning?0.6:1}} onClick={startAudit} disabled={auditRunning}>
                {auditRunning?'⏳ Scanning...':'▶ Start Site Audit'}
              </button>
              {auditRunning&&<div style={s.progressWrap}><div style={s.progressBar(auditPct,T.blue)}/></div>}
            </div>
          </div>
        )}

        {/* ══ CHANNEL RATING ══ */}
        {tab==='channel-rating'&&(
          <div style={{padding:'12px 16px'}}>
            <div style={{fontSize:'11px',color:T.muted,fontWeight:'600',marginBottom:'10px',letterSpacing:'0.08em'}}>
              CHANNEL ANALYSIS — {band} GHz · {channelRatings.filter(r=>r.nets>0).length} occupied channels
            </div>
            <div style={{background:T.card,borderRadius:'4px',padding:'12px',marginBottom:'10px'}}>
              <div style={{display:'flex',gap:'8px',marginBottom:'8px',flexWrap:'wrap',alignItems:'center'}}>
                <span style={{fontSize:'12px',fontWeight:'700',color:'#4dd0e1'}}>BEST CHANNELS: </span>
                <span style={{fontSize:'12px',color:T.blue}}>
                  {channelRatings.filter(r=>r.nets===0).slice(0,6).map(r=>r.ch).join(', ')} (uncrowded)
                </span>
              </div>
              <table style={s.table}>
                <thead><tr><th style={s.th}>Rating</th><th style={s.th}>Channel</th><th style={s.th}>AP Count</th><th style={s.th}>Status</th></tr></thead>
                <tbody>
                  {channelRatings.slice(0,15).map((r,i)=>(
                    <tr key={i} style={{background:i%2===0?T.card2:'transparent'}}>
                      <td style={s.td}><span style={{color:'#ffb74d',letterSpacing:'1px',fontSize:'12px'}}>{'★'.repeat(r.stars)}{'☆'.repeat(10-r.stars)}</span></td>
                      <td style={{...s.td,color:T.blue,fontWeight:'700',fontFamily:'monospace'}}>{r.ch} <span style={{color:T.muted,fontSize:'10px'}}>{band==='2.4'?'20':'40'} MHz</span></td>
                      <td style={{...s.td,color:r.nets>0?T.yellow:T.green}}>{r.nets}</td>
                      <td style={s.td}><span style={{background:r.nets===0?T.green+'22':r.nets===1?T.yellow+'22':T.red+'22',color:r.nets===0?T.green:r.nets===1?T.yellow:T.red,padding:'2px 6px',borderRadius:'3px',fontSize:'10px',fontWeight:'600'}}>{r.nets===0?'Clear':r.nets===1?'Busy':'Crowded'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{background:dark?'#0d1b2a':'#e3f2fd',borderRadius:'4px',padding:'12px',border:`1px solid ${T.blue}33`}}>
              <div style={{fontSize:'11px',fontWeight:'700',color:T.blue,marginBottom:'5px'}}>ℹ System Recommendation:</div>
              <div style={{fontSize:'12px',color:T.muted,lineHeight:'1.7'}}>
                {band==='2.4'
                  ?`Based on current analysis, channels ${channelRatings.filter(r=>r.nets===0).slice(0,3).map(r=>r.ch).join(', ')} have no overlapping APs. For 2.4 GHz, use channels 1, 6, or 11 for non-overlapping coverage. Avoid channels 2-5 and 7-10 as they create adjacent channel interference.`
                  :`For 5 GHz, channels ${channelRatings.filter(r=>r.nets===0).slice(0,4).map(r=>r.ch).join(', ')} are clear. 5 GHz provides higher throughput with less interference than 2.4 GHz.`
                }
              </div>
            </div>
          </div>
        )}

        {/* ══ CHANNEL GRAPH ══ */}
        {tab==='channel-graph'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',padding:'12px 16px'}}>
              {[
                {l:'Networks',v:aps.filter(a=>a.band===band).length},
                {l:'Best Channel',v:channelRatings.find(r=>r.nets===0)?.ch||'—'},
                {l:'Avg Signal',v:Math.round(aps.filter(a=>a.band===band).reduce((s,a)=>s+a.signal,0)/Math.max(1,aps.filter(a=>a.band===band).length))+' dBm'},
                {l:'Congestion',v:channelRatings.filter(r=>r.nets>1).length+' ch'},
              ].map((x,i)=>(
                <div key={i} style={{background:T.card,padding:'12px',borderRadius:'4px',textAlign:'center'}}>
                  <div style={{fontSize:'20px',fontWeight:'800',color:T.blue}}>{x.v}</div>
                  <div style={{fontSize:'10px',color:T.muted,marginTop:'2px'}}>{x.l}</div>
                </div>
              ))}
            </div>
            <div style={{padding:'0 16px'}}>
              <div style={{background:T.card,borderRadius:'4px',padding:'10px',marginBottom:'10px'}}>
                <div style={{fontWeight:'600',fontSize:'12px',marginBottom:'2px',color:T.text}}>Channel Spectrum — {band} GHz</div>
                <div style={{fontSize:'11px',color:T.muted,marginBottom:'8px'}}>Trapezoid width = channel bandwidth used by AP</div>
                <div style={{background:dark?'#0a0a1a':'#f8f9fa',borderRadius:'4px',padding:'4px',overflowX:'auto'}}>
                  <ChannelGraph aps={aps} band={band} T={T} width={340}/>
                </div>
              </div>
              {/* Per-AP signal bars */}
              <div style={{background:T.card,borderRadius:'4px',padding:'12px',marginBottom:'10px'}}>
                <div style={{fontWeight:'600',fontSize:'12px',marginBottom:'10px',color:T.text}}>Signal Strength Comparison</div>
                {aps.filter(a=>a.band===band).map((ap,i)=>{
                  const pct=Math.round(((ap.signal+100)/70)*100);
                  return (
                    <div key={i} style={{marginBottom:'8px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',marginBottom:'3px'}}>
                        <span style={{color:T.text,fontWeight:'500'}}>{ap.ssid}</span>
                        <span style={{color:sigColor(ap.signal),fontWeight:'700',fontFamily:'monospace'}}>{Math.round(ap.signal)} dBm</span>
                      </div>
                      <div style={{background:T.border,borderRadius:'2px',height:'8px',overflow:'hidden'}}>
                        <div style={{width:`${Math.max(3,pct)}%`,height:'100%',background:sigColor(ap.signal),borderRadius:'2px',transition:'width 0.5s'}}/>
                      </div>
                      <div style={{fontSize:'10px',color:T.muted,marginTop:'1px'}}>CH {ap.primaryCh} · {ap.bw}MHz · {ap.vendor}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ TIME GRAPH ══ */}
        {tab==='time-graph'&&(
          <div style={{padding:'12px 16px'}}>
            <div style={{background:T.card,borderRadius:'4px',padding:'10px',marginBottom:'10px'}}>
              <div style={{fontWeight:'600',fontSize:'12px',marginBottom:'2px',color:T.text}}>Signal Strength History — {band} GHz</div>
              <div style={{fontSize:'11px',color:T.muted,marginBottom:'8px'}}>Signal strength of each AP over {scanHistory[0]?.history.length||1} scans</div>
              <div style={{background:dark?'#0a0a1a':'#f8f9fa',borderRadius:'4px',padding:'4px',overflowX:'auto'}}>
                <TimeGraph scanHistory={scanHistory.filter(s=>aps.find(a=>a.ssid===s.ssid&&a.band===band))} T={T} width={340}/>
              </div>
            </div>
            {/* Per-AP current reading */}
            <div style={{background:T.card,borderRadius:'4px',padding:'12px'}}>
              <div style={{fontWeight:'600',fontSize:'12px',marginBottom:'10px',color:T.text}}>Current Readings</div>
              {aps.filter(a=>a.band===band).map((ap,i)=>{
                const hist=scanHistory.find(s=>s.ssid===ap.ssid);
                const prev=hist?.history.at(-2)||ap.signal;
                const delta=ap.signal-prev;
                return (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div style={{width:'10px',height:'10px',borderRadius:'50%',background:hist?.color||T.blue}}/>
                      <div>
                        <div style={{fontSize:'12px',fontWeight:'600',color:T.text}}>{ap.ssid}</div>
                        <div style={{fontSize:'10px',color:T.muted}}>CH {ap.primaryCh}</div>
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'13px',fontWeight:'700',color:sigColor(ap.signal),fontFamily:'monospace'}}>{Math.round(ap.signal)} dBm</div>
                      <div style={{fontSize:'10px',color:delta>0?T.green:delta<0?T.red:T.muted}}>{delta>0?'+':''}{Math.round(delta)} dBm</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ EXPORT ══ */}
        {tab==='export'&&(
          <div style={{padding:'12px 16px'}}>
            {selectedReport?(
              <div>
                <button style={{...s.btn(T.card2,T.text),marginBottom:'14px',border:`1px solid ${T.border}`}} onClick={()=>setSelectedReport(null)}>← Back</button>
                <div style={{background:T.card,borderRadius:'4px',padding:'16px',marginBottom:'10px'}}>
                  <div style={{fontSize:'10px',color:T.blue,fontWeight:'700',marginBottom:'4px'}}>{selectedReport.id}</div>
                  <div style={{fontSize:'18px',fontWeight:'700',marginBottom:'4px',color:T.text}}>{selectedReport.loc}</div>
                  <div style={{fontSize:'12px',color:T.muted,marginBottom:'14px'}}>{selectedReport.date} · {selectedReport.aps.length} networks · {selectedReport.env}</div>
                  <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
                    <button style={s.btn(T.blue)} onClick={()=>toast(`📄 ${selectedReport.id}.pdf exported`,'success')}>📄 PDF</button>
                    <button style={s.btn(dark?'#2e7d32':'#4caf50')} onClick={()=>{
                      // Build CSV string matching WiFiAnalyzer export format
                      const header='Time Stamp|SSID|BSSID|Strength|Primary Channel|Primary Frequency|Center Channel|Center Frequency|Width (Range)|Distance|Security';
                      const rows=selectedReport.aps.map(ap=>`${selectedReport.date}|${ap.ssid}|${ap.mac}|${Math.round(ap.signal)}dBm|${ap.primaryCh}|${ap.freq}MHz|${ap.centerCh||ap.primaryCh}|${ap.freq}MHz|${ap.bw}MHz (${ap.freqStart}-${ap.freqEnd})|${ap.dist}m|${ap.security.join(' ')}`);
                      const csv=[header,...rows].join('\n');
                      const blob=new Blob([csv],{type:'text/csv'});
                      const url=URL.createObjectURL(blob);
                      const a=document.createElement('a');
                      a.href=url;a.download=`${selectedReport.id}.csv`;a.click();
                      toast('✅ CSV downloaded!','success');
                    }}>📊 CSV</button>
                  </div>
                  <table style={s.table}>
                    <thead><tr><th style={s.th}>SSID</th><th style={s.th}>Signal</th><th style={s.th}>CH</th><th style={s.th}>Security</th></tr></thead>
                    <tbody>
                      {selectedReport.aps.map((ap,i)=>(
                        <tr key={i} style={{background:i%2===0?T.card2:'transparent'}}>
                          <td style={{...s.td,fontWeight:'600'}}>{ap.ssid}</td>
                          <td style={{...s.td,color:sigColor(ap.signal),fontFamily:'monospace',fontWeight:'700'}}>{Math.round(ap.signal)} dBm</td>
                          <td style={{...s.td,color:T.blue,fontFamily:'monospace'}}>{ap.chLabel}</td>
                          <td style={s.td}>{ap.security.join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ):(
              <div>
                <div style={{fontSize:'11px',color:T.muted,marginBottom:'10px',fontWeight:'600',letterSpacing:'0.08em'}}>AUDIT REPORTS ({reports.length})</div>
                {reports.map((r,i)=>(
                  <div key={i} style={{background:T.card,borderRadius:'4px',padding:'12px',marginBottom:'8px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                      <div>
                        <div style={{fontSize:'10px',color:T.blue,fontWeight:'700',marginBottom:'2px'}}>{r.id}</div>
                        <div style={{fontWeight:'700',fontSize:'13px',color:T.text}}>{r.loc}</div>
                        <div style={{fontSize:'11px',color:T.muted}}>{r.date} · {r.aps.length} networks</div>
                      </div>
                      <span style={{background:T.green+'22',color:T.green,fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'3px'}}>{Math.round(r.aps.reduce((s,a)=>s+a.signal,0)/r.aps.length)} dBm avg</span>
                    </div>
                    <button style={{...s.btn(T.card2,T.text,'6px 12px'),border:`1px solid ${T.border}`,fontSize:'12px'}} onClick={()=>setSelectedReport(r)}>👁 View Details</button>
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
              <div><div style={{fontSize:'16px',fontWeight:'700',color:T.text}}>Organization</div><div style={{fontSize:'11px',color:T.muted}}>Team & access management</div></div>
              <button style={s.btn()} onClick={()=>setShowInvite(true)}>+ Invite</button>
            </div>

            {showInvite&&(
              <div style={s.overlay}>
                <div style={s.sheet}>
                  <div style={{fontSize:'16px',fontWeight:'700',marginBottom:'18px',color:T.text}}>Invite Team Member</div>
                  <form onSubmit={(e)=>{e.preventDefault();if(!inviteForm.email||!inviteForm.name){toast('Fill all fields','error');return;}setMembers(m=>[...m,{id:Date.now(),...inviteForm,status:'Active',scans:0,perf:0,avatar:'👤'}]);setShowInvite(false);setInviteForm({name:'',email:'',role:'Junior Tech'});toast(`✅ Invite sent to ${inviteForm.email}`,'success');}} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div><label style={s.label}>Full Name</label><input style={s.input} placeholder="John Smith" value={inviteForm.name} onChange={e=>setInviteForm(f=>({...f,name:e.target.value}))}/></div>
                    <div><label style={s.label}>Email</label><input style={s.input} type="email" placeholder="user@company.com" value={inviteForm.email} onChange={e=>setInviteForm(f=>({...f,email:e.target.value}))}/></div>
                    <div><label style={s.label}>Role</label><select style={s.select} value={inviteForm.role} onChange={e=>setInviteForm(f=>({...f,role:e.target.value}))}>{['Junior Tech','Senior Tech','Network Admin','Support Specialist','Manager'].map(r=><option key={r}>{r}</option>)}</select></div>
                    <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                      <button type="submit" style={{...s.btn(),flex:1,justifyContent:'center'}}>Send Invite</button>
                      <button type="button" style={{...s.btn(T.card2,T.text),border:`1px solid ${T.border}`,flex:1,justifyContent:'center'}} onClick={()=>setShowInvite(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div style={{background:T.card,borderRadius:'4px'}}>
              {members.map((m,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',borderBottom:`1px solid ${T.border}`}}>
                  <div style={{width:'38px',height:'38px',borderRadius:'50%',background:T.card2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0,border:`1px solid ${T.border}`}}>{m.avatar}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:'700',fontSize:'13px',color:T.text}}>{m.name}</div>
                    <div style={{fontSize:'11px',color:T.muted}}>{m.email}</div>
                    <div style={{fontSize:'10px',color:T.blue,marginTop:'2px'}}>{m.role} · {m.scans} scans</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <span style={{background:m.status==='Active'?T.green+'22':T.yellow+'22',color:m.status==='Active'?T.green:T.yellow,fontSize:'9px',fontWeight:'700',padding:'2px 6px',borderRadius:'3px',display:'block',marginBottom:'4px'}}>{m.status}</span>
                    {m.email!=='hanybkhite@gmail.com'&&<button style={{background:'transparent',border:'none',color:T.red,cursor:'pointer',fontSize:'11px',fontWeight:'600'}} onClick={()=>setMembers(p=>p.filter(x=>x.id!==m.id))}>Remove</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {tab==='settings'&&(
          <div style={{padding:'12px 16px'}}>
            <div style={{background:T.card,borderRadius:'4px',marginBottom:'10px'}}>
              <div style={{padding:'14px 16px',borderBottom:`1px solid ${T.border}`,fontSize:'12px',fontWeight:'700',color:T.muted,letterSpacing:'0.08em'}}>APPEARANCE</div>
              {[{icon:'🌙',l:'Dark Mode',sub:'Dark background theme',state:dark,fn:()=>setDark(d=>!d)},{icon:'🔔',l:'Notifications',sub:'Critical signal alerts',state:notifs,fn:()=>setNotifs(n=>!n)}].map((x,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',borderBottom:`1px solid ${T.border}`}}>
                  <div style={{width:'34px',height:'34px',background:T.card2,borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>{x.icon}</div>
                  <div style={{flex:1}}><div style={{fontWeight:'600',fontSize:'13px',color:T.text}}>{x.l}</div><div style={{fontSize:'11px',color:T.muted}}>{x.sub}</div></div>
                  <button style={s.toggle(x.state)} onClick={x.fn}><div style={s.toggleDot(x.state)}/></button>
                </div>
              ))}
            </div>
            <div style={{background:T.card,borderRadius:'4px',marginBottom:'10px'}}>
              <div style={{padding:'14px 16px',borderBottom:`1px solid ${T.border}`,fontSize:'12px',fontWeight:'700',color:T.muted,letterSpacing:'0.08em'}}>HELP & INSTRUCTIONS</div>
              {[
                {l:'Getting Started',c:'1. Connect your device to WiFi.\n2. The app auto-scans nearby networks every 5 seconds.\n3. Tap any AP row to expand details.\n4. Use filter (⚙️) to narrow down results.\n5. Enter an environment name and tap Start Site Audit to save a scan report.'},
                {l:'Reading Signal Strength',c:'-30 dBm: Excellent\n-50 dBm: Good\n-67 dBm: Reliable for most activities\n-70 dBm: Weak — may experience dropouts\n-80 dBm: Very weak\n-90 dBm: Unusable'},
                {l:'Channel Graph',c:'Each trapezoid shape represents one AP. The width shows the channel bandwidth (20/40/80/160 MHz). Overlapping shapes = interference. Look for channels with no overlapping APs.'},
                {l:'Scan Throttling',c:'Android limits how often apps can scan for Wi-Fi. To disable: Settings → Developer Options → Networking → Wi-Fi scan throttling. This allows faster scanning.'},
              ].map((item,i)=>(
                <div key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                  <button style={{width:'100%',background:'transparent',border:'none',color:T.text,padding:'12px 16px',display:'flex',justifyContent:'space-between',cursor:'pointer',fontSize:'13px',fontWeight:'600',textAlign:'left'}} onClick={()=>setAccordion(a=>({...a,[i]:!a[i]}))}>
                    {item.l}<span style={{color:T.muted,fontSize:'12px'}}>{accordion[i]?'▲':'▼'}</span>
                  </button>
                  {accordion[i]&&<div style={{fontSize:'12px',color:T.muted,padding:'0 16px 14px',lineHeight:'1.7',whiteSpace:'pre-line'}}>{item.c}</div>}
                </div>
              ))}
            </div>
            <div style={{background:T.card,borderRadius:'4px',padding:'16px'}}>
              <div style={{fontSize:'12px',fontWeight:'700',color:T.muted,letterSpacing:'0.08em',marginBottom:'12px'}}>SYSTEM INFORMATION</div>
              {[{l:'App Version',v:'v3.0.0 Enterprise'},{l:'Admin',v:'hanybkhite@gmail.com'},{l:'Distance Formula',v:'Free-space path loss model'},{l:'Channel Data',v:'IEEE 802.11 standard'},{l:'Vendor Lookup',v:'OUI database (MAC prefix)'},{l:'Scan Interval',v:'5 seconds (auto)'},{l:'Status',v:'✅ All Systems Operational'}].map((r,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontSize:'12px',color:T.muted}}>{r.l}</span>
                  <span style={{fontSize:'12px',fontWeight:'600',color:T.text,textAlign:'right',maxWidth:'60%'}}>{r.v}</span>
                </div>
              ))}
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'10px'}}>
                {['WiFi 6E','WiFi 6','WPA3','802.11ax','IEEE 802.11'].map(x=>(
                  <span key={x} style={{background:T.blue+'22',color:T.blue,fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'3px'}}>{x}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ ABOUT ══ */}
        {tab==='about'&&(
          <div style={{padding:'24px 16px',textAlign:'center'}}>
            <div style={{width:'64px',height:'64px',background:'linear-gradient(135deg,#1565c0,#1976d2)',border:`2px solid ${T.blue}`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',margin:'0 auto 16px'}}>📡</div>
            <div style={{fontSize:'24px',fontWeight:'700',marginBottom:'4px',color:T.text}}>NetPulse CAF Analyzer</div>
            <div style={{fontSize:'13px',color:T.blue,marginBottom:'4px'}}>v3.0.0 Enterprise Infrastructure Monitoring</div>
            <div style={{fontSize:'12px',color:T.muted,marginBottom:'28px'}}>Inspired by WiFiAnalyzer (VREM Software Development)</div>
            {[{i:'📡',l:'Real-time WiFi Analysis',t:'Scans nearby APs every 5 seconds. Shows signal strength (dBm), channel, frequency range, vendor (OUI lookup), security type, and estimated distance using free-space path loss model.'},{i:'📊',l:'Channel Graph',t:'Visualizes WiFi spectrum with trapezoid shapes. Width = channel bandwidth (20/40/80/160 MHz). Overlap = interference. Supports 2.4, 5 and 6 GHz bands.'},{i:'⭐',l:'Channel Rating',t:'Rates channels 1–10 based on congestion, signal strength, and interference. Helps choose the best channel for your router/AP.'},{i:'🌐',l:'Global Deployment',t:'Used by CAF field technicians across enterprise sites. Maintained by Hany Bkhite / GDIT Engineering Team.'}].map((x,i)=>(
              <div key={i} style={{background:T.card,borderRadius:'4px',padding:'14px',marginBottom:'8px',textAlign:'left'}}>
                <div style={{fontSize:'18px',marginBottom:'6px'}}>{x.i}</div>
                <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'4px',color:T.text}}>{x.l}</div>
                <div style={{fontSize:'12px',color:T.muted,lineHeight:'1.6'}}>{x.t}</div>
              </div>
            ))}
            <div style={{fontSize:'11px',color:T.muted,marginTop:'16px'}}>© 2024 CAF-WIFI Operations | All Rights Reserved</div>
            <div style={{fontSize:'10px',color:T.border,marginTop:'4px'}}>GDIT-CAF-NETPULSE-v3-PROD</div>
          </div>
        )}
      </div>

      {/* ── FILTER BOTTOM SHEET ── */}
      {showFilter&&(
        <div style={s.overlay} onClick={(e)=>{if(e.target===e.currentTarget)setShowFilter(false);}}>
          <div style={s.sheet}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px',paddingBottom:'16px',borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:'20px'}}>⚙️</span>
              <span style={{fontSize:'17px',fontWeight:'700',color:T.text}}>Filter</span>
            </div>

            <div style={{marginBottom:'20px'}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'8px'}}>SSID (case sensitive)</div>
              <input style={{...s.input,borderRadius:0,borderTop:'none',borderLeft:'none',borderRight:'none',borderBottom:`2px solid ${T.blue}`,background:'transparent'}} placeholder="ssid SSID" value={filterSSID} onChange={e=>setFilterSSID(e.target.value)}/>
            </div>

            <div style={{marginBottom:'20px',paddingBottom:'20px',borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'12px'}}>WiFi Band</div>
              <div style={{display:'flex',gap:'8px'}}>
                {['2.4','5','6'].map(b=>(
                  <button key={b} onClick={()=>setFilterBands(prev=>prev.includes(b)?prev.filter(x=>x!==b):[...prev,b])} style={s.chipBtn(filterBands.includes(b))}>
                    {b} GHz
                  </button>
                ))}
              </div>
            </div>

            <div style={{marginBottom:'20px',paddingBottom:'20px',borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'12px'}}>Signal Strength</div>
              <div style={{display:'flex',gap:'14px',justifyContent:'center'}}>
                {[0,1,2,3,4].map(lvl=>{
                  const cols=['#f87171','#fb923c','#facc15','#86efac','#4ade80'];
                  const sz=40;
                  const col=cols[lvl];
                  const dim='#555';
                  const cx=sz/2,cy=sz*0.78;
                  const r=[sz*0.08,sz*0.22,sz*0.38,sz*0.52];
                  const a1=-140*Math.PI/180,a2=-40*Math.PI/180;
                  const arc=(r,a)=>({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});
                  const sector=(ri,ro)=>{const p1=arc(ri,a1),p2=arc(ro,a1),p3=arc(ro,a2),p4=arc(ri,a2);return `M${p1.x},${p1.y} L${p2.x},${p2.y} A${ro},${ro} 0 0,1 ${p3.x},${p3.y} L${p4.x},${p4.y} A${ri},${ri} 0 0,0 ${p1.x},${p1.y} Z`;};
                  return (
                    <button key={lvl} onClick={()=>setFilterSig(filterSig===lvl?null:lvl)} style={{background:filterSig===lvl?col+'22':'transparent',border:`2px solid ${filterSig===lvl?col:'transparent'}`,borderRadius:'8px',cursor:'pointer',padding:'6px',opacity:filterSig===null||filterSig===lvl?1:0.5,transition:'all 0.2s'}}>
                      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
                        <circle cx={cx} cy={cy} r={sz*0.06} fill={col}/>
                        {[0,1,2,3].map(i=>(<path key={i} d={sector(r[i]+2,r[i+1<4?i+1:i]+sz*0.06)} fill={lvl>i?col:dim} opacity={0.9}/>))}
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{marginBottom:'24px'}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'12px'}}>Security</div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                {['None','WPS','WEP','WPA','WPA2','WPA3'].map(sec=>(
                  <button key={sec} onClick={()=>setFilterSec(p=>p.includes(sec)?p.filter(x=>x!==sec):[...p,sec])} style={s.chipBtn(filterSec.includes(sec))}>
                    {sec}
                  </button>
                ))}
              </div>
            </div>

            <div style={{display:'flex',justifyContent:'space-between',paddingTop:'12px',borderTop:`1px solid ${T.border}`}}>
              <button onClick={()=>setShowFilter(false)} style={s.btn(T.card2,T.blue)}>CLOSE</button>
              <div style={{display:'flex',gap:'12px'}}>
                <button onClick={resetFilter} style={s.btn('transparent',T.blue)}>RESET</button>
                <button onClick={applyFilter} style={s.btn('transparent',T.blue)}>APPLY</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={s.bottomNav}>
        {NAV.map(n=>(
          <button key={n.id} style={s.navBtn(tab===n.id)} onClick={()=>setTab(n.id)}>
            <span style={{fontSize:'18px',lineHeight:1}}>{n.icon}</span>
            <span>{n.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
