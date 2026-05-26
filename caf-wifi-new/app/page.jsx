'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

// ══════════════════════════════════════════════════════════════════
// NetPulse CAF — WiFiAnalyzer-accurate implementation
// Interface matches: github.com/VREMSoftwareDevelopment/WiFiAnalyzer
// ══════════════════════════════════════════════════════════════════

// ── IEEE 802.11 Channel → Frequency (exact) ────────────────────────────────
const CH_24={1:2412,2:2417,3:2422,4:2427,5:2432,6:2437,7:2442,8:2447,9:2452,10:2457,11:2462,12:2467,13:2472};
const CH_5={36:5180,40:5200,44:5220,48:5240,52:5260,56:5280,60:5300,64:5320,100:5500,104:5520,108:5540,112:5560,116:5580,120:5600,124:5620,128:5640,132:5660,136:5680,140:5700,149:5745,153:5765,157:5785,161:5805,165:5825};

// ── Distance: Free-space path loss (exact WiFiAnalyzer formula) ────────────
const calcDist=(rssi,freq)=>{
  const exp=(27.55-(20*Math.log10(freq))+Math.abs(rssi))/20;
  return+(Math.pow(10,exp)).toFixed(1);
};

// ── Signal helpers ─────────────────────────────────────────────────────────
const sigLvl=(s)=>s>=-50?4:s>=-65?3:s>=-75?2:s>=-85?1:0;
const sigCol=(s)=>s>=-50?'#4caf50':s>=-65?'#8bc34a':s>=-75?'#ffc107':s>=-85?'#ff9800':'#f44336';
const sigLabel=(s)=>s>=-50?'Excellent':s>=-65?'Good':s>=-75?'Reliable':s>=-85?'Weak':'Unusable';

// ── OUI Vendor lookup ──────────────────────────────────────────────────────
const OUI={'00:0b:86':'ARUBA NETWORKS','7c:1c:f1':'HUAWEI TECHNOLOGIES','98:da:c4':'TP-LINK TECHNOLOGIES','9e:da:c4':'GENERIC VENDOR','a8:5b:f7':'TP-LINK TECHNOLOGIES','44:e9:68':'HUAWEI TECHNOLOGIES','bc:14:01':'HITRON TECHNOLOGIES','22:cf:30':'ASUSTEK COMP','20:cf:30':'ASUSTEK COMP','68:86:fc':'HITRON TECHNOLOGIES','be:14:01':'HITRON TECHNOLOGIES'};
const vendor=(mac)=>{const k=mac.slice(0,8).toLowerCase().replace(/-/g,':');return OUI[k]||'UNKNOWN VENDOR';};

// ── Security format (matches Android WifiInfo) ─────────────────────────────
const fmtSec=(secs)=>{
  const parts=[];
  if(secs.includes('WPA3'))parts.push('[WPA3-SAE-CCMP]');
  if(secs.includes('WPA2'))parts.push('[WPA2-PSK-CCMP]');
  if(secs.includes('WPA'))parts.push('[WPA-PSK-CCMP+TKIP]');
  if(secs.includes('WPS'))parts.push('[WPS]');
  if(secs.includes('WEP'))parts.push('[WEP]');
  parts.push('[ESS]');
  return parts.join('');
};

// ── Channel rating (congestion-based) ─────────────────────────────────────
const rateChannels=(aps,band)=>{
  const bandAPs=aps.filter(a=>a.band===band);
  const chs=band==='2.4'?[1,2,3,4,5,6,7,8,9,10,11,12,13]:[36,40,44,48,52,56,60,64,100,104,108,112,116,120,124,128,132,136,140,149,153,157,161,165];
  return chs.map(ch=>{
    const span=2; // 20MHz = ~2 channel overlap
    const over=bandAPs.filter(a=>Math.abs(a.primaryCh-ch)<=span);
    const pen=over.reduce((s,a)=>s+(a.signal>=-65?2:a.signal>=-75?1.5:1),0);
    const stars=Math.max(1,Math.min(10,Math.round(10-pen)));
    return {ch,stars,count:over.length};
  });
};

// ── AP DATA ────────────────────────────────────────────────────────────────
const INIT_APS=[
  {ssid:'CAF-WIFI-5G', mac:'00:0B:86:12:34:56',signal:-40,primaryCh:36,centerCh:38, freq:5180,bw:40, security:['WPA2','WPA3'],band:'5',  std:'6',mbps:850, ip:'192.168.100.15',connected:true},
  {ssid:'CAF-WIFI-2G', mac:'00:0B:86:78:90:AB',signal:-67,primaryCh:6, centerCh:null,freq:2437,bw:20, security:['WPS','WPA','WPA2'],band:'2.4',std:'5',mbps:57},
  {ssid:'CAF-GUEST',   mac:'00:0B:86:CD:EF:01',signal:-79,primaryCh:52,centerCh:48, freq:5260,bw:80, security:['WPA2'],band:'5',  std:'5',mbps:null},
  {ssid:'VTEL-Fiber',  mac:'7c:1c:f1:25:19:2c',signal:-85,primaryCh:1, centerCh:null,freq:2412,bw:20, security:['WPA','WPA2'],band:'2.4',std:'4',mbps:null},
  {ssid:'Mamon2_5G',   mac:'98:da:c4:26:21:87',signal:-86,primaryCh:36,centerCh:42, freq:5180,bw:80, security:['WPS','WPA','WPA2'],band:'5',std:'5',mbps:null},
  {ssid:'*hidden*',    mac:'9e:da:c4:26:21:87',signal:-87,primaryCh:6, centerCh:null,freq:2437,bw:20, security:['WPA2'],band:'2.4',std:'5',mbps:null},
];

const enrich=(ap)=>({
  ...ap,
  freqStart:ap.freq-ap.bw/2,
  freqEnd:ap.freq+ap.bw/2,
  chLabel:ap.centerCh?`${ap.primaryCh}(${ap.centerCh})`:String(ap.primaryCh),
  vend:vendor(ap.mac),
  dist:calcDist(ap.signal,ap.freq),
  secStr:fmtSec(ap.security),
});

// ── WIFI FAN SVG ───────────────────────────────────────────────────────────
function WifiFan({signal,size=36,connected=false}){
  const lvl=sigLvl(signal);
  const col=connected?'#00bcd4':sigCol(signal);
  const dim=connected?'#1a3a3a':'#424242';
  const cx=size/2,cy=size*0.8;
  const rings=[size*0.12,size*0.26,size*0.4,size*0.54];
  const a1=-148*Math.PI/180,a2=-32*Math.PI/180;
  const pt=(r,a)=>({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});
  const arc=(ri,ro)=>{
    const p1=pt(ri,a1),p2=pt(ro,a1),p3=pt(ro,a2),p4=pt(ri,a2);
    return `M${p1.x},${p1.y} L${p2.x},${p2.y} A${ro},${ro} 0 0,1 ${p3.x},${p3.y} L${p4.x},${p4.y} A${ri},${ri} 0 0,0 ${p1.x},${p1.y} Z`;
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={size*0.055} fill={col}/>
      {rings.map((r,i)=>i<3&&(
        <path key={i} d={arc(r+1,rings[i+1]-1)} fill={lvl>i?col:dim} opacity="0.95"/>
      ))}
    </svg>
  );
}

// ── CHANNEL SPECTRUM GRAPH (exact WiFiAnalyzer style) ──────────────────────
function ChannelSpectrum({aps,band,dark}){
  const W=360,H=280,pL=42,pR=8,pT=26,pB=42;
  const cW=W-pL-pR,cH=H-pT-pB;
  const dbMin=-100,dbMax=-10;
  const chMap=band==='2.4'?CH_24:CH_5;
  const chs=Object.keys(chMap).map(Number).sort((a,b)=>a-b);
  const chMin=chs[0],chMax=chs[chs.length-1];
  const chX=ch=>pL+((ch-chMin)/(chMax-chMin||1))*cW;
  const dbY=db=>pT+((dbMax-db)/(dbMax-dbMin))*cH;
  const filtAps=aps.filter(a=>a.band===band);
  const yGrid=[-20,-30,-40,-50,-60,-70,-80,-90];
  const xTicks=band==='2.4'?[1,2,3,4,5,6,7,8,9,10,11,12,13]:[36,52,100,116,132,149,165];
  // BW in channels: 20MHz≈4ch, 40MHz≈8ch, 80MHz≈16ch
  const bwCh={20:2,40:4,80:8,160:16};
  const trap=(ap)=>{
    const half=(bwCh[ap.bw]||2);
    const flat=Math.max(0.3,half*0.35);
    const bot=dbY(dbMin),top=dbY(ap.signal);
    return `M${chX(ap.primaryCh-half-0.5)},${bot} L${chX(ap.primaryCh-flat)},${top} L${chX(ap.primaryCh+flat)},${top} L${chX(ap.primaryCh+half+0.5)},${bot} Z`;
  };
  const COLS=['#2196f3','#4caf50','#9c27b0','#ff9800','#f44336','#00bcd4','#8bc34a','#e91e63'];
  const bg=dark?'#1a1a2e':'#f0f4f8';
  const gridCol=dark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)';
  const textCol=dark?'#757575':'#9e9e9e';
  const axisCol=dark?'#424242':'#bdbdbd';
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block',background:bg,borderRadius:'4px'}}>
      {yGrid.map(db=>(
        <g key={db}>
          <line x1={pL} y1={dbY(db)} x2={W-pR} y2={dbY(db)} stroke={gridCol} strokeWidth="1"/>
          <text x={pL-3} y={dbY(db)+3.5} fill={textCol} fontSize="8.5" textAnchor="end">{db}</text>
        </g>
      ))}
      {xTicks.map(ch=>(
        <g key={ch}>
          <line x1={chX(ch)} y1={pT} x2={chX(ch)} y2={pT+cH} stroke={gridCol} strokeWidth="1"/>
          <text x={chX(ch)} y={pT+cH+12} fill={textCol} fontSize="8.5" textAnchor="middle">{ch}</text>
        </g>
      ))}
      <line x1={pL} y1={pT} x2={pL} y2={pT+cH} stroke={axisCol} strokeWidth="1"/>
      <line x1={pL} y1={pT+cH} x2={W-pR} y2={pT+cH} stroke={axisCol} strokeWidth="1"/>
      <text x={12} y={pT+cH/2} fill={textCol} fontSize="8" textAnchor="middle" transform={`rotate(-90,12,${pT+cH/2})`}>Signal (dBm)</text>
      <text x={pL+cW/2} y={H-3} fill={textCol} fontSize="8" textAnchor="middle">Wi-Fi Channels</text>
      {filtAps.map((ap,i)=>{
        const col=ap.connected?'#00bcd4':COLS[i%COLS.length];
        return(
          <g key={ap.mac}>
            <path d={trap(ap)} fill={col+'4a'} stroke={col} strokeWidth="1.5"/>
            <text x={chX(ap.primaryCh)} y={dbY(ap.signal)-5} fill={col} fontSize="8" textAnchor="middle" fontWeight="bold">
              {ap.ssid.length>8?ap.ssid.slice(0,7)+'…':ap.ssid} {ap.primaryCh}
            </text>
          </g>
        );
      })}
      {/* Legend */}
      {filtAps.slice(0,5).map((ap,i)=>{
        const col=ap.connected?'#00bcd4':COLS[i%COLS.length];
        return(
          <g key={i}>
            <rect x={pL+i*70} y={pT-17} width="7" height="7" fill={col} rx="1"/>
            <text x={pL+i*70+10} y={pT-11} fill={textCol} fontSize="7">
              {ap.ssid.length>7?ap.ssid.slice(0,6)+'…':ap.ssid}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── TIME GRAPH ─────────────────────────────────────────────────────────────
function TimeGraphSVG({histories,dark}){
  const W=360,H=240,pL=42,pR=8,pT=20,pB=32;
  const cW=W-pL-pR,cH=H-pT-pB;
  const dbMin=-100,dbMax=-20;
  const maxPts=Math.max(2,...histories.map(h=>h.pts.length));
  const xS=(i)=>pL+(i/(maxPts-1||1))*cW;
  const yS=(db)=>pT+((dbMax-db)/(dbMax-dbMin))*cH;
  const yGrid=[-30,-40,-50,-60,-70,-80,-90];
  const bg=dark?'#1a1a2e':'#f0f4f8';
  const gridCol=dark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)';
  const textCol=dark?'#757575':'#9e9e9e';
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block',background:bg,borderRadius:'4px'}}>
      {yGrid.map(db=>(
        <g key={db}>
          <line x1={pL} y1={yS(db)} x2={W-pR} y2={yS(db)} stroke={gridCol} strokeWidth="1"/>
          <text x={pL-3} y={yS(db)+3.5} fill={textCol} fontSize="8.5" textAnchor="end">{db}</text>
        </g>
      ))}
      <line x1={pL} y1={pT} x2={pL} y2={pT+cH} stroke={dark?'#424242':'#bdbdbd'} strokeWidth="1"/>
      <line x1={pL} y1={pT+cH} x2={W-pR} y2={pT+cH} stroke={dark?'#424242':'#bdbdbd'} strokeWidth="1"/>
      <text x={12} y={pT+cH/2} fill={textCol} fontSize="7.5" textAnchor="middle" transform={`rotate(-90,12,${pT+cH/2})`}>Signal (dBm)</text>
      <text x={pL+cW/2} y={H-2} fill={textCol} fontSize="7.5" textAnchor="middle">Time</text>
      {histories.map((h,i)=>{
        if(h.pts.length<1) return null;
        const pts=h.pts.map((v,j)=>`${xS(j)},${yS(v)}`).join(' ');
        const last=h.pts[h.pts.length-1];
        return(
          <g key={i}>
            {h.pts.length>1&&<polyline points={pts} fill="none" stroke={h.color} strokeWidth="1.8" strokeLinejoin="round"/>}
            {h.pts.map((v,j)=>(
              <circle key={j} cx={xS(j)} cy={yS(v)} r={j===h.pts.length-1?3.5:2} fill={h.color}/>
            ))}
            {h.pts.length>0&&(
              <text x={xS(h.pts.length-1)+6} y={yS(last)+3.5} fill={h.color} fontSize="8" fontWeight="bold">
                {h.ssid.length>7?h.ssid.slice(0,6)+'…':h.ssid}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────
export default function App(){
  const [loggedIn,setLoggedIn]=useState(true);
  const [loginUser,setLoginUser]=useState('hanybkhite@gmail.com');
  const [loginPass,setLoginPass]=useState('');
  const [loginErr,setLoginErr]=useState('');
  const [dark,setDark]=useState(true);
  const [tab,setTab]=useState('ap');
  const [band,setBand]=useState('2.4');
  const [paused,setPaused]=useState(false);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [aps,setAps]=useState(INIT_APS.map(enrich));
  const [histories,setHistories]=useState(()=>INIT_APS.map((ap,i)=>({
    ssid:ap.ssid,mac:ap.mac,
    color:['#2196f3','#4caf50','#9c27b0','#ff9800','#f44336','#00bcd4'][i%6],
    pts:[ap.signal],
  })));
  const [scanN,setScanN]=useState(1);
  const [selectedAP,setSelectedAP]=useState(null);
  const [showFilter,setShowFilter]=useState(false);
  const [fSSID,setFSSID]=useState('');
  const [fBands,setFBands]=useState(['2.4','5','6']);
  const [fSig,setFSig]=useState(null);
  const [fSec,setFSec]=useState([]);
  const [applied,setApplied]=useState({ssid:'',bands:['2.4','5','6'],sig:null,sec:[]});
  const [sortBy,setSortBy]=useState('signal');
  const [compactView,setCompactView]=useState(false);
  const [members,setMembers]=useState([
    {id:1,name:'Hany Bkhite',role:'Super Admin',email:'hanybkhite@gmail.com',avatar:'👑',status:'Active',scans:512},
    {id:2,name:'Alex Johnson',role:'Senior Tech',email:'alex@caf.com',avatar:'👨‍💻',status:'Active',scans:145},
    {id:3,name:'Maria Garcia',role:'Network Admin',email:'maria@caf.com',avatar:'👩‍💻',status:'Active',scans:89},
  ]);
  const [showInvite,setShowInvite]=useState(false);
  const [iForm,setIForm]=useState({name:'',email:'',role:'Junior Tech'});
  const [reports,setReports]=useState([]);
  const [auditEnv,setAuditEnv]=useState('');
  const [auditPct,setAuditPct]=useState(0);
  const [auditRunning,setAuditRunning]=useState(false);
  const [selReport,setSelReport]=useState(null);
  const [accOpen,setAccOpen]=useState({});
  const [scanInterval,setScanInterval]=useState(3);
  const [toasts,setToasts]=useState([]);

  const T={
    bg:dark?'#121212':'#f5f5f5',
    bar:dark?'#1e1e1e':'#ffffff',
    card:dark?'#1e1e1e':'#ffffff',
    card2:dark?'#2a2a2a':'#f9f9f9',
    border:dark?'#333333':'#e0e0e0',
    text:dark?'#e0e0e0':'#212121',
    sub:dark?'#9e9e9e':'#757575',
    blue:dark?'#42a5f5':'#1976d2',
    cyan:dark?'#26c6da':'#00838f',
    green:dark?'#66bb6a':'#388e3c',
    red:dark?'#ef5350':'#d32f2f',
    sidebar:dark?'#1a1a2e':'#263238',
    sideText:'#b0bec5',
    sideActive:'#00bcd4',
  };

  const toast=(msg,type='info')=>{const id=Date.now();setToasts(p=>[...p,{id,msg,type}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3000);};

  // Auto-scan
  const doScan=useCallback(()=>{
    if(paused)return;
    setAps(prev=>{
      const next=prev.map(ap=>enrich({...ap,signal:Math.max(-98,Math.min(-28,ap.signal+(Math.random()*3-1.5)))}));
      setHistories(h=>h.map(hist=>{
        const ap=next.find(a=>a.mac===hist.mac);
        return ap?{...hist,pts:[...hist.pts.slice(-39),Math.round(ap.signal)]}:hist;
      }));
      setScanN(n=>n+1);
      return next;
    });
  },[paused]);

  useEffect(()=>{
    const t=setInterval(doScan,(scanInterval||3)*1000);
    return()=>clearInterval(t);
  },[doScan,scanInterval]);

  const doLogin=(e)=>{
    e.preventDefault();
    if((loginUser==='hanybkhite@gmail.com'&&loginPass==='1234!@#$Hany')||(loginUser==='admin'&&loginPass==='admin123')){
      setLoggedIn(true);toast('Welcome back! ✅','success');
    }else setLoginErr('Invalid credentials.');
  };

  const startAudit=async()=>{
    if(!auditEnv.trim()){toast('Enter environment name','error');return;}
    setAuditRunning(true);setAuditPct(0);
    for(let i=1;i<=20;i++){await new Promise(r=>setTimeout(r,100));setAuditPct(i*5);}
    const r={id:`REP-${String(reports.length+1).padStart(3,'0')}`,loc:auditEnv,date:new Date().toISOString().slice(0,10),aps:[...aps]};
    setReports(p=>[...p,r]);
    setAuditRunning(false);setAuditEnv('');
    toast(`✅ Audit saved: ${r.id}`,'success');
  };

  // Displayed APs
  const displayAPs=aps.filter(ap=>{
    if(!applied.bands.includes(ap.band))return false;
    if(applied.ssid&&!ap.ssid.toLowerCase().includes(applied.ssid.toLowerCase()))return false;
    if(applied.sig!==null&&sigLvl(ap.signal)!==applied.sig)return false;
    if(applied.sec.length>0&&!applied.sec.some(s=>ap.security.includes(s)))return false;
    return true;
  }).sort((a,b)=>{
    if(sortBy==='signal')return b.signal-a.signal; // stronger first
    if(sortBy==='ssid')return a.ssid.localeCompare(b.ssid);
    return a.primaryCh-b.primaryCh;
  });

  const connectedAP=aps.find(a=>a.connected);
  const ratings=rateChannels(aps,band);
  const bestChs=ratings.filter(r=>r.count===0).slice(0,3).map(r=>r.ch);

  // CSS vars
  const css={
    app:{display:'flex',height:'100vh',overflow:'hidden',background:T.bg,color:T.text,fontFamily:"'Roboto','Noto Sans',sans-serif",position:'relative'},
    sidebar:{width:'220px',background:T.sidebar,display:'flex',flexDirection:'column',height:'100vh',flexShrink:0,zIndex:40,transition:'transform 0.3s'},
    main:{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'},
    topbar:{background:T.bar,borderBottom:`1px solid ${T.border}`,padding:'0 12px',height:'52px',display:'flex',alignItems:'center',gap:'8px',flexShrink:0},
    scrollArea:{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch'},
    connBanner:{background:dark?'#0d2137':'#e3f2fd',borderBottom:`1px solid ${T.cyan}55`,padding:'10px 14px'},
    throttle:{background:dark?'#1a0a0a':'#ffebee',padding:'5px 14px',fontSize:'12px',color:T.red,borderBottom:`1px solid ${T.red}33`},
    apRow:{borderBottom:`1px solid ${T.border}`,padding:compactView?'8px 14px':'11px 14px',cursor:'pointer'},
    card:{background:T.card,borderRadius:'4px',marginBottom:'2px'},
    input:{background:T.card2,border:`1px solid ${T.border}`,color:T.text,padding:'9px 12px',borderRadius:'4px',fontSize:'13px',outline:'none',width:'100%',boxSizing:'border-box'},
    btn:(bg,tc,py)=>({background:bg||T.blue,color:tc||'#fff',border:'none',padding:py||'8px 16px',borderRadius:'4px',cursor:'pointer',fontSize:'13px',fontWeight:'500',display:'inline-flex',alignItems:'center',gap:'6px'}),
    chip:(active)=>({background:'transparent',border:`1px solid ${active?T.cyan:T.border}`,color:active?T.cyan:T.sub,padding:'5px 12px',borderRadius:'20px',cursor:'pointer',fontSize:'12px',fontWeight:'500'}),
    table:{width:'100%',borderCollapse:'collapse'},
    th:{textAlign:'left',padding:'9px 14px',borderBottom:`2px solid ${T.border}`,color:T.sub,fontSize:'11px',fontWeight:'600',letterSpacing:'0.06em',textTransform:'uppercase'},
    td:{padding:'10px 14px',borderBottom:`1px solid ${T.border}`,fontSize:'13px'},
    bottomNav:{background:T.bar,borderTop:`1px solid ${T.border}`,display:'flex',height:'56px',flexShrink:0},
    navBtn:(a)=>({flex:1,background:'transparent',border:'none',color:a?T.cyan:T.sub,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'2px',fontSize:'9px',fontWeight:a?'700':'400',borderTop:a?`2px solid ${T.cyan}`:'2px solid transparent',transition:'all 0.2s'}),
    overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center'},
    sheet:{background:T.card,borderRadius:'16px 16px 0 0',padding:'20px 16px',width:'100%',maxWidth:'500px',maxHeight:'90vh',overflowY:'auto'},
    toggle:(on)=>({width:'42px',height:'22px',borderRadius:'11px',background:on?T.cyan:T.border,cursor:'pointer',border:'none',position:'relative',transition:'background 0.2s',flexShrink:0}),
    dot:(on)=>({position:'absolute',top:'2px',left:on?'22px':'2px',width:'18px',height:'18px',borderRadius:'50%',background:'#fff',transition:'left 0.2s'}),
  };

  // ── SIDEBAR NAV ──────────────────────────────────────────────────────────
  const SIDEBAR_ITEMS=[
    {id:'ap',label:'Access Points',icon:'📡'},
    {id:'cr',label:'Channel Rating',icon:'⭐'},
    {id:'cg',label:'Channel Graph',icon:'📊'},
    {id:'tg',label:'Time Graph',icon:'📈'},
    {id:'ex',label:'Export',icon:'📤'},
    {id:'av',label:'Available Channels',icon:'📻'},
    {id:'ve',label:'Vendors',icon:'👥'},
    {id:'se',label:'Settings',icon:'⚙️'},
    {id:'ab',label:'About',icon:'ℹ️'},
  ];
  const BOTTOM_NAV=[
    {id:'ap',label:'Access Points',icon:'📡'},
    {id:'cr',label:'Channel Rating',icon:'⭐'},
    {id:'cg',label:'Channel Graph',icon:'📊'},
    {id:'tg',label:'Time Graph',icon:'📈'},
  ];

  // ── LOGIN ────────────────────────────────────────────────────────────────
  if(!loggedIn) return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#121212',padding:'20px'}}>
      <div style={{background:'#1e1e1e',borderRadius:'8px',padding:'32px',maxWidth:'360px',width:'100%',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'28px'}}>
          <div style={{width:'44px',height:'44px',background:'#00bcd4',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>📡</div>
          <div>
            <div style={{fontSize:'16px',fontWeight:'700',color:'#e0e0e0'}}>NetPulse CAF</div>
            <div style={{fontSize:'11px',color:'#757575'}}>WiFi Analyzer v3.0.0</div>
          </div>
        </div>
        <form onSubmit={doLogin} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          {loginErr&&<div style={{background:'#b71c1c22',border:'1px solid #ef5350',color:'#ef9a9a',padding:'9px 12px',borderRadius:'4px',fontSize:'12px'}}>{loginErr}</div>}
          <input style={{background:'#2a2a2a',border:'1px solid #424242',color:'#e0e0e0',padding:'11px 14px',borderRadius:'4px',fontSize:'14px',outline:'none'}} type="text" value={loginUser} onChange={e=>setLoginUser(e.target.value)} placeholder="Email / Username"/>
          <input style={{background:'#2a2a2a',border:'1px solid #424242',color:'#e0e0e0',padding:'11px 14px',borderRadius:'4px',fontSize:'14px',outline:'none'}} type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} placeholder="Password"/>
          <button style={{background:'#00838f',color:'#fff',border:'none',padding:'12px',borderRadius:'4px',fontSize:'15px',fontWeight:'600',cursor:'pointer'}} type="submit">SIGN IN</button>
        </form>
        <div style={{marginTop:'16px',padding:'10px 12px',background:'#00838f22',border:'1px solid #00838f55',borderRadius:'4px',fontSize:'11px',color:'#4dd0e1',textAlign:'center'}}>
          hanybkhite@gmail.com · 1234!@#$Hany
        </div>
      </div>
    </div>
  );

  return(
    <div style={css.app}>
      {/* TOASTS */}
      <div style={{position:'fixed',bottom:'64px',left:'50%',transform:'translateX(-50%)',zIndex:200,display:'flex',flexDirection:'column',gap:'6px',pointerEvents:'none',width:'90%',maxWidth:'340px'}}>
        {toasts.map(t=>(
          <div key={t.id} style={{background:t.type==='error'?'#c62828':t.type==='success'?'#2e7d32':'#1565c0',color:'#fff',padding:'10px 14px',borderRadius:'4px',fontSize:'13px',fontWeight:'500',boxShadow:'0 4px 12px rgba(0,0,0,0.4)',textAlign:'center'}}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* SIDEBAR OVERLAY */}
      {sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:35}}/>}

      {/* SIDEBAR */}
      <aside style={{...css.sidebar,position:'fixed',top:0,left:0,transform:sidebarOpen?'translateX(0)':'translateX(-220px)'}}>
        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'16px 14px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{width:'38px',height:'38px',background:'#00bcd4',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>📡</div>
          <div>
            <div style={{fontWeight:'700',fontSize:'14px',color:'#e0e0e0'}}>WiFiAnalyzer</div>
            <div style={{fontSize:'10px',color:'#78909c'}}>(open-source)</div>
          </div>
          <button onClick={()=>setSidebarOpen(false)} style={{marginLeft:'auto',background:'transparent',border:'none',color:'#78909c',cursor:'pointer',fontSize:'20px',lineHeight:1}}>✕</button>
        </div>
        {/* Nav */}
        <nav style={{flex:1,paddingTop:'8px',overflowY:'auto'}}>
          {SIDEBAR_ITEMS.map(item=>(
            <button key={item.id} onClick={()=>{setTab(item.id);setSidebarOpen(false);}} style={{display:'flex',alignItems:'center',gap:'14px',width:'100%',background:tab===item.id?'rgba(0,188,212,0.15)':'transparent',border:'none',borderLeft:`3px solid ${tab===item.id?T.cyan:'transparent'}`,color:tab===item.id?T.cyan:css.sidebar.sideText||'#b0bec5',padding:'13px 14px',cursor:'pointer',fontSize:'13px',fontWeight:tab===item.id?'600':'400',textAlign:'left',transition:'all 0.15s'}}>
              <span style={{fontSize:'16px',width:'20px',textAlign:'center'}}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        {/* Signed in as */}
        <div style={{padding:'12px 14px',borderTop:'1px solid rgba(255,255,255,0.08)',fontSize:'11px',color:'#546e7a'}}>
          <div>Signed in as</div>
          <div style={{color:'#b0bec5',fontWeight:'500',marginTop:'2px'}}>hanybkhite@gmail.com</div>
          <button onClick={()=>setLoggedIn(false)} style={{marginTop:'8px',background:'transparent',border:'1px solid #c6282844',color:'#ef9a9a',padding:'5px 10px',borderRadius:'3px',cursor:'pointer',fontSize:'11px',width:'100%'}}>Sign Out</button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={css.main}>
        {/* TOPBAR */}
        <div style={css.topbar}>
          <button onClick={()=>setSidebarOpen(true)} style={{background:'transparent',border:'none',color:T.sub,cursor:'pointer',fontSize:'22px',lineHeight:1,padding:'4px',marginRight:'4px'}}>☰</button>
          <span style={{fontWeight:'600',fontSize:'15px',color:T.text,flex:1}}>{SIDEBAR_ITEMS.find(s=>s.id===tab)?.label||'NetPulse CAF'}</span>
          {/* Band switcher */}
          {['ap','cr','cg','tg'].includes(tab)&&(
            <button onClick={()=>setBand(b=>b==='2.4'?'5':'2.4')} style={{background:T.card2,border:'none',color:T.cyan,padding:'5px 10px',borderRadius:'4px',cursor:'pointer',fontSize:'12px',fontWeight:'700',letterSpacing:'0.05em'}}>
              {band} GHz
            </button>
          )}
          {/* Filter */}
          {['ap','cg','tg'].includes(tab)&&(
            <button onClick={()=>setShowFilter(true)} style={{background:'transparent',border:'none',color:T.sub,cursor:'pointer',fontSize:'19px',padding:'4px'}}>⚙️</button>
          )}
          {/* Pause */}
          {['ap','cg','tg'].includes(tab)&&(
            <button onClick={()=>{setPaused(p=>!p);toast(paused?'▶ Resumed':'⏸ Paused');}} style={{background:'transparent',border:'none',color:T.sub,cursor:'pointer',fontSize:'19px',padding:'4px'}}>{paused?'▶':'⏸'}</button>
          )}
          {/* Theme */}
          <button onClick={()=>setDark(d=>!d)} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:'17px',padding:'4px'}}>{dark?'☀️':'🌙'}</button>
        </div>

        {/* CONNECTION BANNER (always shown on main tabs) */}
        {['ap','cr','cg','tg'].includes(tab)&&connectedAP&&(
          <div style={css.connBanner}>
            <div style={{fontSize:'11px',color:T.cyan,fontWeight:'600',marginBottom:'2px'}}>Current connection</div>
            <div style={{fontWeight:'700',fontSize:'13px',color:T.text}}>{connectedAP.ssid} ({connectedAP.mac})</div>
            <div style={{fontSize:'12px',marginTop:'1px',fontFamily:'monospace'}}>
              <span style={{color:'#00bcd4',fontWeight:'700'}}>{Math.round(connectedAP.signal)}dBm</span>
              <span style={{color:T.sub}}> CH </span>
              <span style={{color:T.cyan,fontWeight:'700'}}>{connectedAP.chLabel}</span>
              <span style={{color:T.sub}}> {connectedAP.freq}MHz</span>
              <span style={{color:T.cyan,fontWeight:'600'}}> ~{connectedAP.dist}m</span>
            </div>
            <div style={{fontSize:'12px',color:T.cyan,fontWeight:'500',marginTop:'1px'}}>{connectedAP.mbps}Mbps {connectedAP.ip}</div>
          </div>
        )}

        {/* THROTTLE NOTICE */}
        {['ap','cr','cg','tg'].includes(tab)&&(
          <div style={css.throttle}>✕ Wi-Fi scan throttling is enabled · Scan #{scanN} · {paused?'Paused':'Live'}</div>
        )}

        {/* ── PAGE CONTENT ── */}
        <div style={css.scrollArea}>

          {/* ════ ACCESS POINTS ════ */}
          {tab==='ap'&&(
            <div>
              {/* Sort + compact toggle */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 14px',background:T.card,borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                  <span style={{fontSize:'11px',color:T.sub}}>Sort:</span>
                  {['signal','ssid','channel'].map(s=>(
                    <button key={s} onClick={()=>setSortBy(s)} style={{...css.chip(sortBy===s),padding:'3px 8px',fontSize:'10px',textTransform:'capitalize'}}>{s}</button>
                  ))}
                </div>
                <button onClick={()=>setCompactView(v=>!v)} style={{background:'transparent',border:'none',color:T.sub,cursor:'pointer',fontSize:'11px'}}>{compactView?'▤ Complete':'▦ Compact'}</button>
              </div>

              {/* AP List */}
              {displayAPs.map((ap,i)=>(
                <div key={ap.mac} style={{...css.apRow,background:ap.connected?dark?'#0d2137':'#e3f2fd':i%2===0?T.card:T.card2}} onClick={()=>setSelectedAP(s=>s?.mac===ap.mac?null:ap)}>
                  {/* Row 1: SSID + MAC */}
                  <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'2px',color:T.text}}>
                    {ap.ssid} <span style={{color:T.sub,fontWeight:'400',fontSize:'11px'}}>({ap.mac})</span>
                  </div>
                  {/* Row 2: Signal + CH + Freq + Distance */}
                  <div style={{fontSize:'12px',marginBottom:'6px',fontFamily:'monospace'}}>
                    <span style={{color:sigCol(ap.signal),fontWeight:'700'}}>{Math.round(ap.signal)}dBm</span>
                    <span style={{color:T.sub}}> CH </span>
                    <span style={{color:T.cyan,fontWeight:'700'}}>{ap.chLabel}</span>
                    <span style={{color:T.sub}}> {ap.freq}MHz</span>
                    {ap.dist&&<span style={{color:T.cyan,fontWeight:'600'}}> {ap.dist}m</span>}
                  </div>
                  {/* Row 3: Fan + Freq range + Vendor + Security */}
                  <div style={{display:'flex',alignItems:'flex-start',gap:'10px'}}>
                    <WifiFan signal={Math.round(ap.signal)} size={40} connected={ap.connected}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'11px',color:T.cyan,fontFamily:'monospace'}}>
                        {ap.freqStart} - {ap.freqEnd} ({ap.bw}MHz)
                        <span style={{color:T.sub,marginLeft:'6px'}}>{ap.vend.length>16?ap.vend.slice(0,15)+'…':ap.vend}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'5px',marginTop:'4px',flexWrap:'wrap'}}>
                        {/* Signal bars */}
                        <div style={{display:'flex',gap:'2px',alignItems:'flex-end',marginRight:'3px'}}>
                          {[1,2,3,4].map(b=>(
                            <div key={b} style={{width:'4px',height:`${b*4+1}px`,background:sigLvl(ap.signal)>=b?sigCol(ap.signal):T.border,borderRadius:'1px'}}/>
                          ))}
                        </div>
                        {/* Lock */}
                        <span style={{fontSize:'11px',color:T.sub}}>{ap.security.some(s=>['WPA2','WPA3','WPA'].includes(s))?'🔒':'🔓'}</span>
                        {/* Security string */}
                        <span style={{fontSize:'10px',color:T.sub,fontFamily:'monospace'}}>{ap.secStr}</span>
                        {/* WiFi std */}
                        {ap.std&&<span style={{background:T.cyan+'22',color:T.cyan,fontSize:'9px',fontWeight:'700',padding:'1px 5px',borderRadius:'3px'}}>{ap.std}</span>}
                      </div>
                      {/* Connected AP extra line */}
                      {ap.connected&&!compactView&&(
                        <div style={{fontSize:'12px',color:T.cyan,fontWeight:'600',marginTop:'3px'}}>
                          {ap.mbps&&`${ap.mbps}Mbps`}{ap.ip&&` ${ap.ip}`}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Expanded detail */}
                  {selectedAP?.mac===ap.mac&&(
                    <div style={{marginTop:'12px',paddingTop:'12px',borderTop:`1px solid ${T.border}`,display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                      {[
                        {l:'Signal',v:`${Math.round(ap.signal)} dBm · ${sigLabel(ap.signal)}`},
                        {l:'Distance',v:`~${ap.dist} m`},
                        {l:'Channel',v:`${ap.chLabel} (${ap.bw} MHz)`},
                        {l:'Frequency',v:`${ap.freqStart}–${ap.freqEnd} MHz`},
                        {l:'Vendor',v:ap.vend},
                        {l:'MAC',v:ap.mac},
                        {l:'Security',v:ap.secStr},
                        {l:'WiFi Std',v:`802.11${ap.std==='6'?'ax':ap.std==='5'?'ac':'n'} (WiFi ${ap.std})`},
                        {l:'Band',v:`${ap.band} GHz`},
                        {l:'Bandwidth',v:`${ap.bw} MHz`},
                      ].map(x=>(
                        <div key={x.l} style={{fontSize:'11px'}}>
                          <div style={{color:T.sub,marginBottom:'1px'}}>{x.l}</div>
                          <div style={{fontWeight:'600',color:T.text,wordBreak:'break-all'}}>{x.v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Site Audit */}
              <div style={{background:T.card,padding:'14px',marginTop:'4px'}}>
                <div style={{fontSize:'11px',color:T.sub,fontWeight:'600',letterSpacing:'0.08em',marginBottom:'8px'}}>SITE AUDIT</div>
                <input style={css.input} placeholder="Environment name (e.g., Data Center Rack B-12)" value={auditEnv} onChange={e=>setAuditEnv(e.target.value)}/>
                <button style={{...css.btn(auditRunning?'#424242':T.cyan),marginTop:'8px',width:'100%',justifyContent:'center',opacity:auditRunning?0.6:1}} onClick={startAudit} disabled={auditRunning}>
                  {auditRunning?`⏳ Scanning ${auditPct}%...`:'▶ Start Site Audit'}
                </button>
                {auditRunning&&<div style={{background:T.border,borderRadius:'2px',height:'3px',marginTop:'6px',overflow:'hidden'}}><div style={{width:`${auditPct}%`,height:'100%',background:T.cyan,transition:'width 0.1s'}}/></div>}
              </div>
            </div>
          )}

          {/* ════ CHANNEL RATING ════ */}
          {tab==='cr'&&(
            <div style={{padding:'12px 14px'}}>
              <div style={{background:T.card,borderRadius:'4px',padding:'12px',marginBottom:'10px'}}>
                <div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'12px',flexWrap:'wrap'}}>
                  <span style={{fontSize:'12px',fontWeight:'700',color:'#4dd0e1'}}>Best Channels:</span>
                  <span style={{fontSize:'12px',color:T.blue,fontWeight:'700'}}>{bestChs.length>0?bestChs.join(', '):'None clear'}</span>
                  {band==='2.4'&&<span style={{fontSize:'11px',color:T.sub}}>– Non-overlapping: 1, 6, 11</span>}
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={css.table}>
                    <thead>
                      <tr>
                        <th style={css.th}>Channel Rating</th>
                        <th style={{...css.th,textAlign:'center'}}>Channel Number</th>
                        <th style={{...css.th,textAlign:'center'}}>Access Point Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ratings.map((r,i)=>(
                        <tr key={i} style={{background:i%2===0?T.card2:'transparent'}}>
                          <td style={css.td}>
                            <span style={{letterSpacing:'1px',fontSize:'14px'}}>
                              {Array.from({length:10},(_,j)=>(
                                <span key={j} style={{color:j<r.stars?'#ffc107':'#424242'}}>★</span>
                              ))}
                            </span>
                          </td>
                          <td style={{...css.td,textAlign:'center',color:T.cyan,fontWeight:'700',fontFamily:'monospace'}}>{r.ch}</td>
                          <td style={{...css.td,textAlign:'center',color:r.count>0?T.red:T.green,fontWeight:'700'}}>{r.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{background:dark?'#0d1b2a':'#e8f4f8',borderRadius:'4px',padding:'12px',border:`1px solid ${T.cyan}33`}}>
                <div style={{fontSize:'11px',fontWeight:'700',color:T.cyan,marginBottom:'5px'}}>ℹ System Recommendation</div>
                <div style={{fontSize:'12px',color:T.sub,lineHeight:'1.7'}}>
                  {band==='2.4'
                    ?`Channels with 0 APs are best. For 2.4 GHz use non-overlapping channels 1, 6, or 11 for maximum performance. Currently best: ${bestChs.slice(0,3).join(', ')||'none clear'}.`
                    :`5 GHz channels provide less interference. Best available: ${bestChs.slice(0,4).join(', ')||'none clear'}. Avoid DFS channels (52-144) if possible.`
                  }
                </div>
              </div>
            </div>
          )}

          {/* ════ CHANNEL GRAPH ════ */}
          {tab==='cg'&&(
            <div>
              {/* Stats */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',padding:'10px 14px'}}>
                {[
                  {l:'APs Found',v:aps.filter(a=>a.band===band).length},
                  {l:'Best Channel',v:bestChs[0]||'—'},
                  {l:'Avg Signal',v:Math.round(aps.filter(a=>a.band===band).reduce((s,a)=>s+a.signal,0)/Math.max(1,aps.filter(a=>a.band===band).length))+' dBm'},
                  {l:'Congested',v:ratings.filter(r=>r.count>1).length+' ch'},
                ].map((x,i)=>(
                  <div key={i} style={{background:T.card,padding:'10px 12px',borderRadius:'4px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:'11px',color:T.sub}}>{x.l}</span>
                    <span style={{fontSize:'16px',fontWeight:'700',color:T.cyan}}>{x.v}</span>
                  </div>
                ))}
              </div>
              {/* Spectrum */}
              <div style={{padding:'0 14px 12px'}}>
                <div style={{background:T.card,borderRadius:'4px',padding:'10px'}}>
                  <div style={{fontWeight:'600',fontSize:'12px',marginBottom:'2px',color:T.text}}>Channel Spectrum — {band} GHz</div>
                  <div style={{fontSize:'11px',color:T.sub,marginBottom:'8px'}}>Trapezoid = channel bandwidth · Y-axis = signal strength dBm</div>
                  <div style={{overflowX:'auto'}}>
                    <ChannelSpectrum aps={aps} band={band} dark={dark}/>
                  </div>
                </div>
              </div>
              {/* Signal comparison */}
              <div style={{padding:'0 14px 12px'}}>
                <div style={{background:T.card,borderRadius:'4px',padding:'12px'}}>
                  <div style={{fontWeight:'600',fontSize:'12px',marginBottom:'12px',color:T.text}}>Signal Strength per AP</div>
                  {aps.filter(a=>a.band===band).map((ap,i)=>{
                    const pct=Math.round(((ap.signal+100)/70)*100);
                    return(
                      <div key={i} style={{marginBottom:'10px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',marginBottom:'3px'}}>
                          <span style={{color:T.text,fontWeight:'500'}}>{ap.ssid} <span style={{color:T.sub,fontFamily:'monospace'}}>CH{ap.chLabel}</span></span>
                          <span style={{color:sigCol(ap.signal),fontWeight:'700',fontFamily:'monospace'}}>{Math.round(ap.signal)} dBm</span>
                        </div>
                        <div style={{background:T.border,borderRadius:'2px',height:'7px',overflow:'hidden'}}>
                          <div style={{width:`${Math.max(2,pct)}%`,height:'100%',background:sigCol(ap.signal),borderRadius:'2px',transition:'width 0.5s'}}/>
                        </div>
                        <div style={{fontSize:'10px',color:T.sub,marginTop:'1px'}}>{ap.vend} · {ap.bw}MHz · {ap.secStr.slice(0,25)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ════ TIME GRAPH ════ */}
          {tab==='tg'&&(
            <div style={{padding:'12px 14px'}}>
              <div style={{background:T.card,borderRadius:'4px',padding:'10px',marginBottom:'10px'}}>
                <div style={{fontWeight:'600',fontSize:'12px',marginBottom:'2px',color:T.text}}>Signal Strength Over Time — {band} GHz</div>
                <div style={{fontSize:'11px',color:T.sub,marginBottom:'8px'}}>Live scan #{scanN} · {paused?'Paused':'Scanning every '+scanInterval+'s'}</div>
                <div style={{overflowX:'auto'}}>
                  <TimeGraphSVG histories={histories.filter(h=>aps.find(a=>a.mac===h.mac&&a.band===band))} dark={dark}/>
                </div>
              </div>
              {/* Current readings table */}
              <div style={{background:T.card,borderRadius:'4px',padding:'12px'}}>
                <div style={{fontWeight:'600',fontSize:'12px',marginBottom:'10px',color:T.text}}>Current Readings</div>
                <table style={css.table}>
                  <thead><tr><th style={css.th}>SSID</th><th style={css.th}>Signal</th><th style={css.th}>Trend</th><th style={css.th}>CH</th></tr></thead>
                  <tbody>
                    {aps.filter(a=>a.band===band).map((ap,i)=>{
                      const hist=histories.find(h=>h.mac===ap.mac);
                      const prev=hist?.pts.at(-2)||ap.signal;
                      const d=Math.round(ap.signal-prev);
                      return(
                        <tr key={i} style={{background:i%2===0?T.card2:'transparent'}}>
                          <td style={{...css.td,fontWeight:'600'}}>{ap.ssid}</td>
                          <td style={{...css.td,color:sigCol(ap.signal),fontWeight:'700',fontFamily:'monospace'}}>{Math.round(ap.signal)} dBm</td>
                          <td style={{...css.td,color:d>0?T.green:d<0?T.red:T.sub,fontFamily:'monospace',fontWeight:'700'}}>{d>0?'↑':d<0?'↓':'→'} {d>0?'+':''}{d}</td>
                          <td style={{...css.td,color:T.cyan,fontFamily:'monospace'}}>{ap.chLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ EXPORT ════ */}
          {tab==='ex'&&(
            <div style={{padding:'12px 14px'}}>
              {selReport?(
                <div>
                  <button style={{...css.btn(T.card2,T.text),marginBottom:'12px',border:`1px solid ${T.border}`}} onClick={()=>setSelReport(null)}>← Back</button>
                  <div style={{background:T.card,borderRadius:'4px',padding:'14px'}}>
                    <div style={{fontSize:'10px',color:T.cyan,fontWeight:'700',marginBottom:'3px'}}>{selReport.id}</div>
                    <div style={{fontSize:'17px',fontWeight:'700',marginBottom:'3px',color:T.text}}>{selReport.loc}</div>
                    <div style={{fontSize:'12px',color:T.sub,marginBottom:'14px'}}>{selReport.date} · {selReport.aps.length} networks</div>
                    <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
                      <button style={css.btn(T.blue)} onClick={()=>toast('📄 PDF exported','success')}>📄 PDF</button>
                      <button style={css.btn('#2e7d32')} onClick={()=>{
                        const h='Time Stamp|SSID|BSSID|Strength|Primary Channel|Center Channel|Width (Range)|Distance|Security';
                        const rows=selReport.aps.map(ap=>`${selReport.date}|${ap.ssid}|${ap.mac}|${Math.round(ap.signal)}dBm|${ap.primaryCh}|${ap.centerCh||ap.primaryCh}|${ap.bw}MHz (${ap.freqStart}-${ap.freqEnd})|${ap.dist}m|${ap.secStr}`);
                        const blob=new Blob([[h,...rows].join('\n')],{type:'text/csv'});
                        const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${selReport.id}.csv`;a.click();
                        toast('✅ CSV downloaded','success');
                      }}>📊 CSV</button>
                    </div>
                    <table style={css.table}>
                      <thead><tr><th style={css.th}>SSID</th><th style={css.th}>Signal</th><th style={css.th}>CH</th><th style={css.th}>Security</th></tr></thead>
                      <tbody>{selReport.aps.map((ap,i)=>(
                        <tr key={i} style={{background:i%2===0?T.card2:'transparent'}}>
                          <td style={{...css.td,fontWeight:'600'}}>{ap.ssid}</td>
                          <td style={{...css.td,color:sigCol(ap.signal),fontFamily:'monospace',fontWeight:'700'}}>{Math.round(ap.signal)} dBm</td>
                          <td style={{...css.td,color:T.cyan,fontFamily:'monospace'}}>{ap.chLabel}</td>
                          <td style={{...css.td,fontSize:'10px',fontFamily:'monospace'}}>{ap.secStr}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              ):(
                <div>
                  <div style={{fontSize:'11px',color:T.sub,fontWeight:'600',letterSpacing:'0.08em',marginBottom:'10px'}}>SAVED REPORTS ({reports.length})</div>
                  {reports.length===0&&<div style={{background:T.card,borderRadius:'4px',padding:'24px',textAlign:'center',color:T.sub}}>No reports yet.<br/>Start a Site Audit from Access Points tab.</div>}
                  {reports.map((r,i)=>(
                    <div key={i} style={{background:T.card,borderRadius:'4px',padding:'12px',marginBottom:'8px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                        <div><div style={{fontSize:'10px',color:T.cyan,fontWeight:'700'}}>{r.id}</div><div style={{fontWeight:'700',fontSize:'13px',color:T.text}}>{r.loc}</div><div style={{fontSize:'11px',color:T.sub}}>{r.date} · {r.aps.length} APs</div></div>
                        <span style={{background:T.green+'22',color:T.green,fontSize:'10px',padding:'2px 8px',borderRadius:'3px',fontWeight:'700'}}>{Math.round(r.aps.reduce((s,a)=>s+a.signal,0)/r.aps.length)} dBm avg</span>
                      </div>
                      <button style={{...css.btn(T.card2,T.text,'6px 12px'),border:`1px solid ${T.border}`,fontSize:'12px'}} onClick={()=>setSelReport(r)}>👁 View & Export</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ AVAILABLE CHANNELS ════ */}
          {tab==='av'&&(
            <div style={{padding:'12px 14px'}}>
              {['2.4','5'].map(b=>(
                <div key={b} style={{background:T.card,borderRadius:'4px',padding:'14px',marginBottom:'10px'}}>
                  <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'10px',color:T.text}}>{b} GHz Band</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                    {(b==='2.4'?[1,2,3,4,5,6,7,8,9,10,11,12,13]:[36,40,44,48,52,56,60,64,100,104,108,112,116,120,124,128,132,136,140,149,153,157,161,165]).map(ch=>{
                      const used=aps.some(a=>a.band===b&&Math.abs(a.primaryCh-ch)<=1);
                      return(
                        <div key={ch} style={{background:used?T.red+'22':T.green+'22',border:`1px solid ${used?T.red:T.green}`,color:used?T.red:T.green,padding:'5px 10px',borderRadius:'4px',fontSize:'12px',fontWeight:'700',minWidth:'36px',textAlign:'center'}}>
                          {ch}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{display:'flex',gap:'14px',marginTop:'10px',fontSize:'11px'}}>
                    <span style={{color:T.green}}>■ Available</span>
                    <span style={{color:T.red}}>■ In Use</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ════ VENDORS ════ */}
          {tab==='ve'&&(
            <div style={{padding:'12px 14px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                <div><div style={{fontSize:'15px',fontWeight:'700',color:T.text}}>Team Management</div><div style={{fontSize:'11px',color:T.sub}}>{members.length} members</div></div>
                <button style={css.btn(T.cyan,'#fff')} onClick={()=>setShowInvite(true)}>+ Invite</button>
              </div>

              {showInvite&&(
                <div style={css.overlay} onClick={e=>{if(e.target===e.currentTarget)setShowInvite(false);}}>
                  <div style={css.sheet}>
                    <div style={{fontSize:'16px',fontWeight:'700',marginBottom:'18px',color:T.text}}>Invite Team Member</div>
                    <form onSubmit={e=>{e.preventDefault();if(!iForm.name||!iForm.email){toast('Fill all fields','error');return;}setMembers(m=>[...m,{id:Date.now(),...iForm,status:'Active',scans:0,avatar:'👤'}]);setShowInvite(false);setIForm({name:'',email:'',role:'Junior Tech'});toast(`✅ Invite sent to ${iForm.email}`,'success');}} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                      <div><label style={{fontSize:'11px',color:T.sub,display:'block',marginBottom:'4px'}}>FULL NAME</label><input style={css.input} placeholder="John Smith" value={iForm.name} onChange={e=>setIForm(f=>({...f,name:e.target.value}))}/></div>
                      <div><label style={{fontSize:'11px',color:T.sub,display:'block',marginBottom:'4px'}}>EMAIL</label><input style={css.input} type="email" placeholder="user@company.com" value={iForm.email} onChange={e=>setIForm(f=>({...f,email:e.target.value}))}/></div>
                      <div><label style={{fontSize:'11px',color:T.sub,display:'block',marginBottom:'4px'}}>ROLE</label><select style={{...css.input,cursor:'pointer'}} value={iForm.role} onChange={e=>setIForm(f=>({...f,role:e.target.value}))}>{['Junior Tech','Senior Tech','Network Admin','Support Specialist','Manager'].map(r=><option key={r}>{r}</option>)}</select></div>
                      <div style={{display:'flex',gap:'8px',paddingTop:'6px'}}>
                        <button type="submit" style={{...css.btn(T.cyan),flex:1,justifyContent:'center'}}>Send Invite</button>
                        <button type="button" style={{...css.btn(T.card2,T.text),border:`1px solid ${T.border}`,flex:1,justifyContent:'center'}} onClick={()=>setShowInvite(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div style={{background:T.card,borderRadius:'4px'}}>
                {members.map((m,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',borderBottom:`1px solid ${T.border}`}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'50%',background:T.card2,border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>{m.avatar}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:'700',fontSize:'13px',color:T.text}}>{m.name}</div>
                      <div style={{fontSize:'11px',color:T.sub}}>{m.email}</div>
                      <div style={{fontSize:'11px',color:T.cyan,marginTop:'2px'}}>{m.role} · {m.scans} scans</div>
                    </div>
                    <div style={{flexShrink:0}}>
                      <span style={{background:m.status==='Active'?T.green+'22':T.red+'22',color:m.status==='Active'?T.green:T.red,fontSize:'9px',fontWeight:'700',padding:'2px 7px',borderRadius:'3px'}}>{m.status}</span>
                      {m.email!=='hanybkhite@gmail.com'&&<button onClick={()=>setMembers(p=>p.filter(x=>x.id!==m.id))} style={{display:'block',background:'transparent',border:'none',color:T.red,cursor:'pointer',fontSize:'11px',fontWeight:'500',marginTop:'4px'}}>Remove</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ SETTINGS ════ */}
          {tab==='se'&&(
            <div style={{padding:'12px 14px'}}>
              {/* Scan Interval */}
              <div style={{background:T.card,borderRadius:'4px',marginBottom:'8px'}}>
                <div style={{padding:'12px 14px',borderBottom:`1px solid ${T.border}`,fontSize:'11px',fontWeight:'700',color:T.sub,letterSpacing:'0.08em'}}>SCANNING</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',borderBottom:`1px solid ${T.border}`}}>
                  <div><div style={{fontSize:'13px',fontWeight:'600',color:T.text}}>Scan Interval</div><div style={{fontSize:'11px',color:T.sub}}>{scanInterval} seconds between each scan</div></div>
                  <select style={{...css.input,width:'80px'}} value={scanInterval} onChange={e=>setScanInterval(Number(e.target.value))}>
                    {[1,2,3,5,10,15,30].map(v=><option key={v} value={v}>{v}s</option>)}
                  </select>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px'}}>
                  <div><div style={{fontSize:'13px',fontWeight:'600',color:T.text}}>Sort Access Points By</div><div style={{fontSize:'11px',color:T.sub}}>Default sort order</div></div>
                  <select style={{...css.input,width:'120px'}} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                    <option value="signal">Signal Strength</option>
                    <option value="ssid">SSID</option>
                    <option value="channel">Channel</option>
                  </select>
                </div>
              </div>

              {/* Display */}
              <div style={{background:T.card,borderRadius:'4px',marginBottom:'8px'}}>
                <div style={{padding:'12px 14px',borderBottom:`1px solid ${T.border}`,fontSize:'11px',fontWeight:'700',color:T.sub,letterSpacing:'0.08em'}}>DISPLAY</div>
                {[
                  {label:'Dark Theme',sub:'Dark background (Material You)',state:dark,fn:()=>setDark(d=>!d)},
                  {label:'Access Point Display',sub:compactView?'Compact view':'Complete view',state:compactView,fn:()=>setCompactView(v=>!v)},
                ].map((x,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',borderBottom:`1px solid ${T.border}`}}>
                    <div><div style={{fontSize:'13px',fontWeight:'600',color:T.text}}>{x.label}</div><div style={{fontSize:'11px',color:T.sub}}>{x.sub}</div></div>
                    <button style={css.toggle(x.state)} onClick={x.fn}><div style={css.dot(x.state)}/></button>
                  </div>
                ))}
              </div>

              {/* Graph */}
              <div style={{background:T.card,borderRadius:'4px',marginBottom:'8px'}}>
                <div style={{padding:'12px 14px',borderBottom:`1px solid ${T.border}`,fontSize:'11px',fontWeight:'700',color:T.sub,letterSpacing:'0.08em'}}>GRAPH SETTINGS</div>
                <div style={{padding:'12px 14px',borderBottom:`1px solid ${T.border}`}}>
                  <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'6px'}}>Graph Maximum Signal</div>
                  <div style={{fontSize:'11px',color:T.sub}}>Y-axis max: -20 dBm (default)</div>
                </div>
              </div>

              {/* Help */}
              <div style={{background:T.card,borderRadius:'4px',marginBottom:'8px'}}>
                <div style={{padding:'12px 14px',borderBottom:`1px solid ${T.border}`,fontSize:'11px',fontWeight:'700',color:T.sub,letterSpacing:'0.08em'}}>HELP & INFORMATION</div>
                {[
                  {l:'Signal Strength Guide',c:'-30 dBm: Excellent\n-50 dBm: Good\n-67 dBm: Reliable\n-70 dBm: Weak\n-80 dBm: Very weak\n-90 dBm: Unusable'},
                  {l:'Channel Graph',c:'Each trapezoid = one AP. Width = channel bandwidth (20/40/80/160 MHz). Overlapping shapes = interference. Find channels with no overlaps.'},
                  {l:'Channel Rating',c:'Based on congestion and signal strength. Higher stars = better channel. Use for choosing your router channel.'},
                  {l:'Distance Calculation',c:'Free-space path loss model. distance = 10^((27.55 - 20×log₁₀(freq) + |RSSI|) / 20). Estimate only — affected by walls and obstacles.'},
                  {l:'Wi-Fi Scan Throttling',c:'Android limits scan frequency. Disable: Settings → Developer Options → Networking → Wi-Fi scan throttling.'},
                ].map((item,i)=>(
                  <div key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                    <button style={{width:'100%',background:'transparent',border:'none',color:T.text,padding:'12px 14px',display:'flex',justifyContent:'space-between',cursor:'pointer',fontSize:'13px',fontWeight:'500',textAlign:'left'}} onClick={()=>setAccOpen(a=>({...a,[i]:!a[i]}))}>
                      {item.l}<span style={{color:T.sub,fontSize:'12px'}}>{accOpen[i]?'▲':'▼'}</span>
                    </button>
                    {accOpen[i]&&<div style={{fontSize:'12px',color:T.sub,padding:'0 14px 12px',lineHeight:'1.7',whiteSpace:'pre-line'}}>{item.c}</div>}
                  </div>
                ))}
              </div>

              {/* System info */}
              <div style={{background:T.card,borderRadius:'4px',padding:'14px'}}>
                <div style={{fontSize:'11px',fontWeight:'700',color:T.sub,letterSpacing:'0.08em',marginBottom:'10px'}}>SYSTEM INFORMATION</div>
                {[{l:'App Version',v:'v3.0.0 Enterprise'},{l:'Admin',v:'hanybkhite@gmail.com'},{l:'Vendor DB',v:'OUI (IEEE 802.11)'},{l:'Distance Formula',v:'Free-space path loss'},{l:'Scan Engine',v:'Auto · every '+scanInterval+'s'},{l:'Status',v:'✅ Operational'}].map((r,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${T.border}`}}>
                    <span style={{fontSize:'12px',color:T.sub}}>{r.l}</span>
                    <span style={{fontSize:'12px',fontWeight:'600',color:T.text}}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ ABOUT ════ */}
          {tab==='ab'&&(
            <div style={{padding:'24px 16px',textAlign:'center'}}>
              <div style={{width:'64px',height:'64px',background:'#00838f',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',margin:'0 auto 16px'}}>📡</div>
              <div style={{fontSize:'22px',fontWeight:'700',marginBottom:'4px',color:T.text}}>NetPulse CAF</div>
              <div style={{fontSize:'14px',color:T.cyan,marginBottom:'4px'}}>WiFi Analyzer v3.0.0</div>
              <div style={{fontSize:'12px',color:T.sub,marginBottom:'4px'}}>Based on WiFiAnalyzer (open-source)</div>
              <div style={{fontSize:'11px',color:T.sub,marginBottom:'28px'}}>github.com/VREMSoftwareDevelopment/WiFiAnalyzer</div>
              {[
                {i:'📡',t:'Access Points','d':'Identify nearby APs with signal strength, channel, frequency range, vendor (OUI), estimated distance, and security type.'},
                {i:'📊',t:'Channel Graph','d':'Graph channel signal strength. Trapezoid width = bandwidth. Overlapping shapes = interference.'},
                {i:'📈',t:'Time Graph','d':'Graph AP signal strength over time. Detect interference and dead spots as you move.'},
                {i:'⭐',t:'Channel Rating','d':'Rate channels 1–10 based on congestion and interference. HT/VHT detection (40/80/160/320 MHz).'},
                {i:'🔍',t:'Filters','d':'Filter by WiFi band, signal strength, security type and SSID. Works across all views.'},
                {i:'🏷️',t:'Vendor OUI Lookup','d':'Identify AP manufacturer from MAC address using IEEE OUI database.'},
              ].map((x,i)=>(
                <div key={i} style={{background:T.card,borderRadius:'4px',padding:'12px',marginBottom:'8px',textAlign:'left'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'5px'}}>
                    <span style={{fontSize:'18px'}}>{x.i}</span>
                    <span style={{fontWeight:'700',fontSize:'13px',color:T.text}}>{x.t}</span>
                  </div>
                  <div style={{fontSize:'12px',color:T.sub,lineHeight:'1.6'}}>{x.d}</div>
                </div>
              ))}
              <div style={{fontSize:'12px',color:T.sub,marginTop:'16px'}}>
                © 2024 CAF-WIFI Operations · All Rights Reserved<br/>
                Admin: hanybkhite@gmail.com<br/>
                GDIT-CAF-NETPULSE-v3-PROD · GPL-3.0
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAV (4 items like real WiFiAnalyzer) */}
        <div style={css.bottomNav}>
          {BOTTOM_NAV.map(n=>(
            <button key={n.id} style={css.navBtn(tab===n.id)} onClick={()=>setTab(n.id)}>
              <span style={{fontSize:'20px',lineHeight:1}}>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── FILTER BOTTOM SHEET ── */}
      {showFilter&&(
        <div style={css.overlay} onClick={e=>{if(e.target===e.currentTarget)setShowFilter(false);}}>
          <div style={css.sheet}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px',paddingBottom:'14px',borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:'20px'}}>⚙️</span>
              <span style={{fontSize:'17px',fontWeight:'700',color:T.text}}>Filter</span>
            </div>

            {/* SSID */}
            <div style={{marginBottom:'20px'}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'8px'}}>SSID <span style={{color:T.sub,fontWeight:'400'}}>(case sensitive)</span></div>
              <input style={{...css.input,background:'transparent',borderTop:'none',borderLeft:'none',borderRight:'none',borderBottom:`2px solid ${T.cyan}`,borderRadius:0}} placeholder="ssid SSID" value={fSSID} onChange={e=>setFSSID(e.target.value)}/>
            </div>

            {/* WiFi Band */}
            <div style={{marginBottom:'20px',paddingBottom:'20px',borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'10px'}}>WiFi Band</div>
              <div style={{display:'flex',gap:'8px'}}>
                {['2.4','5','6'].map(b=>(
                  <button key={b} onClick={()=>setFBands(p=>p.includes(b)?p.filter(x=>x!==b):[...p,b])} style={css.chip(fBands.includes(b))}>{b} GHz</button>
                ))}
              </div>
            </div>

            {/* Signal strength — 5 fan icons like real app */}
            <div style={{marginBottom:'20px',paddingBottom:'20px',borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'12px'}}>Signal Strength</div>
              <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
                {[0,1,2,3,4].map(lvl=>{
                  const cols=['#f44336','#ff9800','#ffc107','#8bc34a','#4caf50'];
                  const sz=44;
                  const col=cols[lvl];
                  const dim='#424242';
                  const cx=sz/2,cy=sz*0.8;
                  const rings=[sz*0.12,sz*0.26,sz*0.4,sz*0.54];
                  const a1=-148*Math.PI/180,a2=-32*Math.PI/180;
                  const pt=(r,a)=>({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});
                  const arc=(ri,ro)=>{const p1=pt(ri,a1),p2=pt(ro,a1),p3=pt(ro,a2),p4=pt(ri,a2);return `M${p1.x},${p1.y} L${p2.x},${p2.y} A${ro},${ro} 0 0,1 ${p3.x},${p3.y} L${p4.x},${p4.y} A${ri},${ri} 0 0,0 ${p1.x},${p1.y} Z`;};
                  return(
                    <button key={lvl} onClick={()=>setFSig(fSig===lvl?null:lvl)} style={{background:fSig===lvl?col+'22':'transparent',border:`2px solid ${fSig===lvl?col:'transparent'}`,borderRadius:'8px',cursor:'pointer',padding:'5px',opacity:fSig===null||fSig===lvl?1:0.45,transition:'all 0.15s'}}>
                      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
                        <circle cx={cx} cy={cy} r={sz*0.055} fill={col}/>
                        {rings.map((r,i)=>i<3&&<path key={i} d={arc(r+1,rings[i+1]-1)} fill={lvl>i?col:dim} opacity="0.95"/>)}
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Security */}
            <div style={{marginBottom:'24px'}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'10px'}}>Security</div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                {['None','WPS','WEP','WPA','WPA2','WPA3'].map(sec=>(
                  <button key={sec} onClick={()=>setFSec(p=>p.includes(sec)?p.filter(x=>x!==sec):[...p,sec])} style={css.chip(fSec.includes(sec))}>{sec}</button>
                ))}
              </div>
            </div>

            <div style={{display:'flex',justifyContent:'space-between',paddingTop:'12px',borderTop:`1px solid ${T.border}`}}>
              <button onClick={()=>setShowFilter(false)} style={{background:'transparent',border:'none',color:T.cyan,cursor:'pointer',fontSize:'14px',fontWeight:'700',padding:'8px'}}>CLOSE</button>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={()=>{setFSSID('');setFBands(['2.4','5','6']);setFSig(null);setFSec([]);}} style={{background:'transparent',border:'none',color:T.cyan,cursor:'pointer',fontSize:'14px',fontWeight:'700',padding:'8px'}}>RESET</button>
                <button onClick={()=>{setApplied({ssid:fSSID,bands:fBands,sig:fSig,sec:fSec});setShowFilter(false);toast('Filter applied','success');}} style={{background:'transparent',border:'none',color:T.cyan,cursor:'pointer',fontSize:'14px',fontWeight:'700',padding:'8px'}}>APPLY</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
