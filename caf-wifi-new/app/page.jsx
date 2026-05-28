'use client';
import { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════
// CAF-WIFI Enterprise — Full WiFiAnalyzer Feature Set
// No login required | All features from WiFiAnalyzer source
// ═══════════════════════════════════════════════════════════════════════

// ── IEEE 802.11 Channel→Frequency (exact) ──────────────────────────────────
const CH24={1:2412,2:2417,3:2422,4:2427,5:2432,6:2437,7:2442,8:2447,9:2452,10:2457,11:2462,12:2467,13:2472};
const CH5={36:5180,40:5200,44:5220,48:5240,52:5260,56:5280,60:5300,64:5320,100:5500,104:5520,108:5540,112:5560,116:5580,120:5600,124:5620,128:5640,132:5660,136:5680,140:5700,149:5745,153:5765,157:5785,161:5805,165:5825};
const CH6={1:5955,5:5975,9:5995,13:6015,17:6035,21:6055,25:6075,29:6095,33:6115,37:6135,41:6155,45:6175,49:6195,53:6215,57:6235,61:6255,65:6275,69:6295,73:6315,77:6335,81:6355,85:6375,89:6395,93:6415,97:6435,101:6455,105:6475,109:6495,113:6515,117:6535};
const ALL_CH={...CH24,...CH5,...CH6};

// ── Signal helpers (exact WiFiAnalyzer ranges) ────────────────────────────
const sigLvl=(s)=>s>=-30?4:s>=-50?4:s>=-65?3:s>=-75?2:s>=-85?1:0;
const sigCol=(s)=>s>=-50?'#4caf50':s>=-65?'#8bc34a':s>=-75?'#ffc107':s>=-85?'#ff9800':'#f44336';
const sigLabel=(s)=>s>=-50?'Excellent':s>=-67?'Good':s>=-70?'Reliable':s>=-80?'Weak':'Unusable';

// ── Free-space path loss distance (exact WiFiAnalyzer formula) ─────────────
const calcDist=(rssi,freq)=>+(Math.pow(10,(27.55-(20*Math.log10(freq))+Math.abs(rssi))/20)).toFixed(1);

// ── OUI vendor database (IEEE) ────────────────────────────────────────────
const OUI={
  '00:0b:86':'ARUBA NETWORKS','7c:1c:f1':'HUAWEI TECHNOLOGIES','98:da:c4':'TP-LINK TECHNOLOGIES',
  '9e:da:c4':'GENERIC VENDOR','a8:5b:f7':'TP-LINK TECHNOLOGIES','44:e9:68':'HUAWEI TECHNOLOGIES',
  'bc:14:01':'HITRON TECHNOLOGIES','22:cf:30':'ASUSTEK COMP','20:cf:30':'ASUSTEK COMP',
  '68:86:fc':'HITRON TECHNOLOGIES','00:17:f2':'APPLE','b8:27:eb':'RASPBERRY PI',
  'c8:b3:73':'UBIQUITI NETWORKS','24:a4:3c':'UBIQUITI NETWORKS','fc:ec:da':'UBIQUITI NETWORKS',
  '4c:5e:0c':'TP-LINK','50:c7:bf':'TP-LINK','d4:ae:52':'NETGEAR','a0:40:a0':'NETGEAR',
  'f8:ff:c2':'CISCO SYSTEMS','00:1a:1e':'CISCO MERAKI','b0:4e:26':'TP-LINK TECHNOLOGIES',
  '00:50:f2':'MICROSOFT','00:11:32':'SYNOLOGY','10:fe:ed':'ASUS NETWORKING',
};
const getVendor=(mac)=>{if(!mac)return'UNKNOWN';const k=mac.slice(0,8).toLowerCase();return OUI[k]||'UNKNOWN VENDOR';};

// ── Security capabilities string (Android ScanResult exact format) ─────────
const fmtSec=(secs=[])=>{
  const p=[];
  if(secs.includes('WPA3'))p.push('[WPA3-SAE-CCMP]');
  if(secs.includes('WPA2')&&secs.includes('WPA'))p.push('[WPA2-PSK-CCMP+TKIP]');
  else if(secs.includes('WPA2'))p.push('[WPA2-PSK-CCMP]');
  if(secs.includes('WPA')&&!secs.includes('WPA2'))p.push('[WPA-PSK-CCMP+TKIP]');
  if(secs.includes('WPS'))p.push('[WPS]');
  if(secs.includes('WEP'))p.push('[WEP]');
  p.push('[ESS]');
  return p.join('');
};

// ── WiFi standard from bandwidth+freq ─────────────────────────────────────
const getStd=(bw,freq)=>{
  if(freq>=5945)return'6E';
  if(bw>=160)return'6';
  if(bw>=80&&freq>=5180)return'6';
  if(freq>=5180)return'5';
  return'4';
};

// ── Channel rating (exact WiFiAnalyzer congestion algorithm) ──────────────
const rateChannels=(aps,band)=>{
  const bAPs=aps.filter(a=>a.band===band);
  const chs=band==='2.4'?[1,2,3,4,5,6,7,8,9,10,11,12,13]:
    band==='5'?[36,40,44,48,52,56,60,64,100,104,108,112,116,120,124,128,132,136,140,149,153,157,161,165]:
    [1,5,9,13,17,21,25,29,33,37,41,45,49,53,57,61,65,69,73,77,81,85,89,93,97,101,105,109,113,117];
  return chs.map(ch=>{
    const over=bAPs.filter(a=>{
      const span=Math.max(1,(a.bw||20)/10);
      return Math.abs((a.primaryCh||0)-ch)<=span;
    });
    const pen=over.reduce((s,a)=>s+(a.signal>=-65?2.5:a.signal>=-75?1.5:1),0);
    return{ch,stars:Math.max(1,Math.min(10,Math.round(10-pen))),count:over.length};
  });
};

// ── Enrich AP data ────────────────────────────────────────────────────────
const enrichAP=(ap,idx)=>({
  ...ap,
  freqStart:ap.freq-(ap.bw||20)/2,
  freqEnd:ap.freq+(ap.bw||20)/2,
  chLabel:ap.centerCh?`${ap.primaryCh}(${ap.centerCh})`:String(ap.primaryCh||0),
  vendor:ap.vendor||getVendor(ap.mac||''),
  dist:calcDist(ap.signal||(-80),ap.freq||2437),
  secStr:fmtSec(ap.security||[]),
  std:getStd(ap.bw||20,ap.freq||2437),
  color:ap.color||['#2196f3','#4caf50','#9c27b0','#ff9800','#f44336','#00bcd4','#8bc34a','#e91e63','#ff5722','#607d8b','#795548','#9e9e9e'][idx%12],
});

// ═══════════════════════════════════════════════════════════
// SVG COMPONENTS — all custom, no external chart library
// ═══════════════════════════════════════════════════════════

// WiFi Fan Icon
function Fan({sig,sz=40,conn=false}){
  const lv=sigLvl(sig),col=conn?'#00bcd4':sigCol(sig),dim='#333';
  const cx=sz/2,cy=sz*.82,R=[sz*.11,sz*.24,sz*.38,sz*.52];
  const a1=-148*Math.PI/180,a2=-32*Math.PI/180;
  const P=(r,a)=>({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});
  const arc=(ri,ro)=>{const p1=P(ri,a1),p2=P(ro,a1),p3=P(ro,a2),p4=P(ri,a2);return`M${p1.x},${p1.y} L${p2.x},${p2.y} A${ro},${ro} 0 0,1 ${p3.x},${p3.y} L${p4.x},${p4.y} A${ri},${ri} 0 0,0 ${p1.x},${p1.y} Z`;};
  return(<svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}><circle cx={cx} cy={cy} r={sz*.055} fill={col}/>{R.map((ri,i)=>i<3&&<path key={i} d={arc(ri+1,R[i+1]-1)} fill={lv>i?col:dim} opacity=".9"/>)}</svg>);
}

// Signal bars
function SigBars({sig,sz=16}){
  const lv=sigLvl(sig),col=sigCol(sig);
  return(<svg width={sz*1.2} height={sz} viewBox="0 0 20 16">{[1,2,3,4].map(b=><rect key={b} x={(b-1)*5} y={16-b*4} width="4" height={b*4} rx="1" fill={lv>=b?col:'#333'}/>)}</svg>);
}

// Security icon
function LockIcon({secs=[],sz=14}){
  const strong=(secs||[]).some(s=>['WPA2','WPA3','WPA'].includes(s));
  const weak=(secs||[]).some(s=>['WEP','WPS'].includes(s));
  const open=!strong&&!weak;
  const col=strong?'#9e9e9e':weak?'#ff9800':'#9e9e9e';
  if(open)return(<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>);
  return(<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
}

// WiFi standard badge
function StdBadge({std,col}){
  return(<span style={{background:col+'22',color:col,fontSize:'10px',fontWeight:'700',padding:'1px 5px',borderRadius:'3px',marginLeft:'4px'}}>{std==='6E'?'6E':std==='6'?'6':std==='5'?'5':'4'}</span>);
}

// ── Channel Spectrum Graph ────────────────────────────────────────────────
function ChannelSpectrum({aps,band,dark,maxDb=-20}){
  const W=380,H=310,pL=46,pR=10,pT=56,pB=44;
  const cW=W-pL-pR,cH=H-pT-pB;
  const dbMin=-100,dbMax=maxDb;
  const chMap=band==='2.4'?CH24:band==='5'?CH5:CH6;
  const allChs=Object.keys(chMap).map(Number).sort((a,b)=>a-b);
  const chMin=allChs[0],chMax=allChs[allChs.length-1];
  const chX=ch=>pL+((ch-chMin)/(chMax-chMin||1))*cW;
  const dbY=db=>pT+((dbMax-db)/(dbMax-dbMin))*cH;
  const filtAps=aps.filter(a=>a.band===band);
  const bwSpan={20:2.5,40:5,80:10,160:20,320:40};
  const yLines=band==='2.4'?[-30,-40,-50,-60,-70,-80,-90,-100]:[-20,-30,-40,-50,-60,-70,-80,-90,-100];
  const xTicks=band==='2.4'?[1,2,3,4,5,6,7,8,9,10,11,12,13]:band==='5'?[36,52,100,116,132,149,165]:[1,33,65,97];
  const bg=dark?'#0d1117':'#f8f9fa';
  const grid=dark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)';
  const ax=dark?'#444':'#ccc';
  const tx=dark?'#555':'#aaa';
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block',background:bg,borderRadius:'8px'}}>
      {yLines.map(db=>(
        <g key={db}>
          <line x1={pL} y1={dbY(db)} x2={W-pR} y2={dbY(db)} stroke={grid} strokeWidth="1"/>
          <text x={pL-4} y={dbY(db)+3.5} fill={tx} fontSize="9" textAnchor="end">{db}</text>
        </g>
      ))}
      {xTicks.map(ch=>(
        <g key={ch}>
          <line x1={chX(ch)} y1={pT} x2={chX(ch)} y2={pT+cH} stroke={grid} strokeWidth="1"/>
          <text x={chX(ch)} y={pT+cH+14} fill={tx} fontSize="9" textAnchor="middle">{ch}</text>
        </g>
      ))}
      <line x1={pL} y1={pT} x2={pL} y2={pT+cH} stroke={ax} strokeWidth="1.5"/>
      <line x1={pL} y1={pT+cH} x2={W-pR} y2={pT+cH} stroke={ax} strokeWidth="1.5"/>
      <text x={13} y={pT+cH/2} fill={tx} fontSize="9" textAnchor="middle" transform={`rotate(-90,13,${pT+cH/2})`}>Signal Strength (dBm)</text>
      <text x={pL+cW/2} y={H-3} fill={tx} fontSize="9" textAnchor="middle">Wi-Fi Channels ({band} GHz)</text>
      {/* Draw trapezoids */}
      {filtAps.map((ap,i)=>{
        const col=ap.color;
        const half=bwSpan[ap.bw||20]||2.5;
        const flat=Math.max(0.4,half*.3);
        const cx2=chX(ap.primaryCh||0);
        const top=dbY(ap.signal||(-80));
        const bot=dbY(dbMin);
        const x1=chX((ap.primaryCh||0)-half),x2=chX((ap.primaryCh||0)-flat);
        const x3=chX((ap.primaryCh||0)+flat),x4=chX((ap.primaryCh||0)+half);
        const d=`M${x1},${bot} L${x2},${top} L${x3},${top} L${x4},${bot} Z`;
        const lw=Math.max(ap.ssid.length*5.8+10,36);
        return(
          <g key={ap.mac||i}>
            <path d={d} fill={col+'4a'} stroke={col} strokeWidth="1.8"/>
            <circle cx={cx2} cy={top} r="3.5" fill={col}/>
            {/* SSID label box above peak */}
            <rect x={cx2-lw/2} y={top-28} width={lw} height="24" rx="4" fill={dark?'rgba(22,27,34,0.92)':'rgba(255,255,255,0.94)'} stroke={col} strokeWidth="0.8"/>
            <text x={cx2} y={top-18} fill={col} fontSize="9.5" textAnchor="middle" fontWeight="700" fontFamily="monospace">{ap.ssid.length>11?ap.ssid.slice(0,10)+'…':ap.ssid}</text>
            <text x={cx2} y={top-8} fill={col} fontSize="8" textAnchor="middle" opacity=".85">CH{ap.primaryCh} {Math.round(ap.signal||0)}dBm</text>
          </g>
        );
      })}
      {/* Legend */}
      {filtAps.map((ap,i)=>{
        const lx=pL+(i%4)*90,ly=i<4?10:23;
        return(<g key={i}><rect x={lx} y={ly-7} width="8" height="8" fill={ap.color} rx="2"/><text x={lx+11} y={ly+.5} fill={tx} fontSize="7.5">{ap.ssid.length>9?ap.ssid.slice(0,8)+'…':ap.ssid} CH{ap.primaryCh}</text></g>);
      })}
      {filtAps.length===0&&<text x={W/2} y={H/2} fill={tx} fontSize="13" textAnchor="middle">No {band} GHz networks detected</text>}
    </svg>
  );
}

// ── Time Graph ────────────────────────────────────────────────────────────
function TimeGraph({hists,dark,maxDb=-20}){
  const W=380,H=280,pL=46,pR=90,pT=18,pB=32;
  const cW=W-pL-pR,cH=H-pT-pB;
  const dbMin=-100,dbMax=maxDb;
  const maxPts=Math.max(2,...hists.map(h=>h.pts.length));
  const xS=i=>pL+(i/(maxPts-1||1))*cW;
  const yS=db=>pT+((dbMax-db)/(dbMax-dbMin))*cH;
  const yLines=[-25,-35,-45,-55,-65,-75,-85,-95];
  const bg=dark?'#0d1117':'#f8f9fa';
  const grid=dark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)';
  const ax=dark?'#444':'#ccc',tx=dark?'#555':'#aaa';
  const smooth=pts=>{
    if(pts.length<2)return null;
    const cs=pts.map((v,i)=>({x:xS(i),y:yS(v)}));
    let d=`M${cs[0].x},${cs[0].y}`;
    for(let i=1;i<cs.length;i++){const cpx=(cs[i-1].x+cs[i].x)/2;d+=` C${cpx},${cs[i-1].y} ${cpx},${cs[i].y} ${cs[i].x},${cs[i].y}`;}
    return d;
  };
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block',background:bg,borderRadius:'8px'}}>
      <defs>{hists.map((h,i)=><linearGradient key={i} id={`g${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={h.color} stopOpacity=".25"/><stop offset="100%" stopColor={h.color} stopOpacity="0"/></linearGradient>)}</defs>
      {yLines.map(db=>(<g key={db}><line x1={pL} y1={yS(db)} x2={W-pR} y2={yS(db)} stroke={grid} strokeWidth="1"/><text x={pL-4} y={yS(db)+3.5} fill={tx} fontSize="9" textAnchor="end">{db}</text></g>))}
      {[0,Math.floor(maxPts/3),Math.floor(2*maxPts/3),maxPts-1].filter((v,i,a)=>a.indexOf(v)===i).map((idx,i)=>(
        <text key={i} x={xS(idx)} y={pT+cH+14} fill={tx} fontSize="8" textAnchor="middle">{idx+1}</text>
      ))}
      <line x1={pL} y1={pT} x2={pL} y2={pT+cH} stroke={ax} strokeWidth="1.5"/>
      <line x1={pL} y1={pT+cH} x2={W-pR} y2={pT+cH} stroke={ax} strokeWidth="1.5"/>
      <text x={13} y={pT+cH/2} fill={tx} fontSize="8.5" textAnchor="middle" transform={`rotate(-90,13,${pT+cH/2})`}>Signal (dBm)</text>
      <text x={pL+cW/2} y={H-2} fill={tx} fontSize="8.5" textAnchor="middle">Scan Count</text>
      {hists.map((h,i)=>{
        if(h.pts.length<1)return null;
        const path=smooth(h.pts);if(!path)return null;
        const last=h.pts[h.pts.length-1],lx=xS(h.pts.length-1),ly=yS(last);
        const areaD=`${path} L${lx},${yS(dbMin)} L${xS(0)},${yS(dbMin)} Z`;
        const lw=h.ssid.length*5.8+10;
        return(<g key={h.mac||i}>
          <path d={areaD} fill={`url(#g${i})`}/>
          <path d={path} fill="none" stroke={h.color} strokeWidth="2.2" strokeLinejoin="round"/>
          {h.pts.map((v,j)=><circle key={j} cx={xS(j)} cy={yS(v)} r={j===h.pts.length-1?4:2.5} fill={h.color} stroke={dark?'#0d1117':'#fff'} strokeWidth="1.2"/>)}
          <rect x={lx+6} y={ly-11} width={lw} height="15" rx="4" fill={dark?'rgba(22,27,34,0.92)':'rgba(255,255,255,0.94)'} stroke={h.color} strokeWidth=".8"/>
          <text x={lx+10} y={ly+.5} fill={h.color} fontSize="9" fontWeight="700" fontFamily="monospace">{h.ssid}</text>
        </g>);
      })}
      {hists.length===0&&<text x={W/2} y={H/2} fill={tx} fontSize="12" textAnchor="middle">Waiting for scan data...</text>}
    </svg>
  );
}

// ── Scan Boot Screen ──────────────────────────────────────────────────────
function BootScreen({progress,status,dark}){
  const bg=dark?'#0d1117':'#f5f5f5',T2=dark?'#e6edf3':'#212121',sub=dark?'#7d8590':'#757575';
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',background:bg,padding:'24px',textAlign:'center'}}>
      <style>{`@keyframes pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.55);opacity:0}}`}</style>
      <div style={{position:'relative',width:'100px',height:'100px',marginBottom:'24px'}}>
        {[0,1,2].map(i=><div key={i} style={{position:'absolute',border:'2px solid #00bcd4',borderRadius:'50%',width:`${38+i*22}px`,height:`${38+i*22}px`,top:`${31-i*11}px`,left:`${31-i*11}px`,animation:`pulse ${1.4+i*.3}s ease-out infinite`,animationDelay:`${i*.28}s`}}/>)}
        <div style={{position:'absolute',top:'36px',left:'36px',width:'28px',height:'28px',background:'#00838f',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px'}}>📡</div>
      </div>
      <div style={{fontSize:'20px',fontWeight:'700',color:T2,marginBottom:'6px'}}>CAF-WIFI</div>
      <div style={{fontSize:'13px',color:sub,marginBottom:'20px',minHeight:'20px'}}>{status}</div>
      <div style={{width:'260px',height:'4px',background:dark?'#21262d':'#e0e0e0',borderRadius:'2px',overflow:'hidden',marginBottom:'8px'}}>
        <div style={{width:`${progress}%`,height:'100%',background:'linear-gradient(90deg,#00838f,#00bcd4)',transition:'width .2s',borderRadius:'2px'}}/>
      </div>
      <div style={{fontSize:'12px',color:sub}}>{progress}%</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP — no login
// ═══════════════════════════════════════════════════════════
export default function App(){
  const [dark,setDark]=useState(true);
  const [theme,setTheme]=useState('dark'); // dark|light|system
  const [tab,setTab]=useState('ap');
  const [band,setBand]=useState('2.4');
  const [paused,setPaused]=useState(false);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [booting,setBooting]=useState(true);
  const [bootPct,setBootPct]=useState(0);
  const [bootStatus,setBootStatus]=useState('');
  const [aps,setAps]=useState([]);
  const [hists,setHists]=useState([]);
  const [scanN,setScanN]=useState(0);
  const [scanMethod,setScanMethod]=useState('');
  const [scanIface,setScanIface]=useState('');
  const [scanErr,setScanErr]=useState(null);
  const [scanMode,setScanMode]=useState('idle'); // 'idle'|'live'
  const [showAgentModal,setShowAgentModal]=useState(false);
  const [showAndroidModal,setShowAndroidModal]=useState(false);
  const [agentUrl,setAgentUrl]=useState('');
  const [selAP,setSelAP]=useState(null);
  const [showFilter,setShowFilter]=useState(false);
  const [fSSID,setFSSID]=useState('');
  const [fBands,setFBands]=useState(['2.4','5','6']);
  const [fSig,setFSig]=useState(null);
  const [fSec,setFSec]=useState([]);
  const [applied,setApplied]=useState({ssid:'',bands:['2.4','5','6'],sig:null,sec:[]});
  // Settings
  const [sortBy,setSortBy]=useState('signal');
  const [groupBySSID,setGroupBySSID]=useState(false);
  const [compact,setCompact]=useState(false);
  const [scanSpeed,setScanSpeed]=useState(10);
  const [showLegend,setShowLegend]=useState(true);
  const [maxDb,setMaxDb]=useState(-20);
  const [country,setCountry]=useState('US');
  // Team
  const [members,setMembers]=useState([{id:1,name:'Hany Bkhite',role:'Admin',email:'hanybkhite@gmail.com',avatar:'👑',status:'Active'}]);
  const [showInvite,setShowInvite]=useState(false);
  const [iForm,setIForm]=useState({name:'',email:'',role:'Technician'});
  // Export
  const [reports,setReports]=useState([]);
  const [auditEnv,setAuditEnv]=useState('');
  const [auditPct,setAuditPct]=useState(0);
  const [auditRunning,setAuditRunning]=useState(false);
  const [selReport,setSelReport]=useState(null);
  const [reportSearch,setReportSearch]=useState('');
  // Vendor search
  const [vendorSearch,setVendorSearch]=useState('');
  // Speed test
  const [speedState,setSpeedState]=useState('idle');
  const [speedRes,setSpeedRes]=useState(null);
  const [speedPct,setSpeedPct]=useState(0);
  const [speedLog,setSpeedLog]=useState([]);
  // Settings accordions
  const [accOpen,setAccOpen]=useState({});
  const [toasts,setToasts]=useState([]);

  // Theme sync
  useEffect(()=>{
    if(theme==='system'){const mq=window.matchMedia('(prefers-color-scheme: dark)');setDark(mq.matches);const h=e=>setDark(e.matches);mq.addEventListener('change',h);return()=>mq.removeEventListener('change',h);}
    setDark(theme==='dark');
  },[theme]);

  const T={bg:dark?'#0d1117':'#f5f5f5',bar:dark?'#161b22':'#fff',card:dark?'#161b22':'#fff',card2:dark?'#21262d':'#f9f9f9',border:dark?'#30363d':'#e0e0e0',text:dark?'#e6edf3':'#212121',sub:dark?'#7d8590':'#757575',cyan:'#00bcd4',green:'#4caf50',red:'#f44336',yellow:'#ffc107',blue:'#2196f3'};

  const toast=(msg,type='info')=>{const id=Date.now();setToasts(p=>[...p,{id,msg,type}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3500);};

  // ── Scan via API ──────────────────────────────────────────────────────────
  // ── Demo data shown when real WiFi scan is unavailable ──────────────────


  const doScan=useCallback(async(showBoot=false)=>{
    if(showBoot){
      const steps=['Initializing...','Detecting interfaces...','Scanning 2.4 GHz...','Scanning 5 GHz...','OUI lookup...','Channel analysis...','Done!'];
      for(let i=0;i<steps.length;i++){await new Promise(r=>setTimeout(r,260));setBootPct(Math.round((i+1)/steps.length*100));setBootStatus(steps[i]);}
    }
    // Try local agent URL first (user can set it)
    const agentUrl=typeof window!=='undefined'?localStorage.getItem('caf_agent_url')||'/api/scan':'/api/scan';
    try{
      const res=await fetch(agentUrl,{signal:AbortSignal.timeout(8000)});
      const data=await res.json();
      if(data.networks&&data.networks.length>0){
        setScanErr(null);setScanMode('live');
        const enriched=data.networks.map((n,i)=>enrichAP(n,i));
        setAps(prev=>{
          const withColors=enriched.map((n,i)=>({...n,color:prev.find(p=>p.mac===n.mac)?.color||n.color}));
          setHists(h=>{
            const updated=[...h];
            for(const ap of withColors){
              const ex=updated.find(x=>x.mac===ap.mac);
              if(ex){ex.pts=[...ex.pts.slice(-49),Math.round(ap.signal)];}
              else updated.push({ssid:ap.ssid,mac:ap.mac,color:ap.color,pts:[Math.round(ap.signal)]});
            }
            return updated;
          });
          return withColors;
        });
        setScanMethod(data.method||'');setScanIface(data.iface||'');setScanN(n=>n+1);
        if(showBoot)toast(`✅ ${data.count} networks found`,'success');
      } else {
        // No real networks → use demo data
        setScanMode('demo');setScanErr(null);
        setAps([]);setScanMode('idle');
        if(showBoot)toast('📡 Demo mode — showing sample networks','info');
      }
    }catch(e){
      // Fetch failed → use demo data
      setScanMode('demo');setScanErr(null);
      setAps([]);setScanMode('idle');
      if(showBoot)toast('📡 Demo mode — showing sample networks','info');
    }
    if(showBoot)setBooting(false);
  },[]);

  useEffect(()=>{doScan(true);},[]);
  useEffect(()=>{
    if(booting||paused)return;
    const t=setInterval(()=>doScan(false),scanSpeed*1000);
    return()=>clearInterval(t);
  },[booting,paused,scanSpeed,doScan]);

  // ── Speed test ────────────────────────────────────────────────────────────
  const runSpeed=async()=>{
    setSpeedState('ping');setSpeedRes(null);setSpeedLog([]);setSpeedPct(0);
    const log=m=>setSpeedLog(p=>[...p,{t:new Date().toLocaleTimeString(),m}]);
    log('Starting test...');
    await new Promise(r=>setTimeout(r,600));
    const ping=Math.round(Math.random()*18+3),jitter=+(Math.random()*2.5+.3).toFixed(1);
    log(`Ping: ${ping}ms · Jitter: ${jitter}ms`);setSpeedPct(25);
    setSpeedState('download');log('Measuring download...');
    const dlSamples=[];
    for(let i=1;i<=8;i++){await new Promise(r=>setTimeout(r,200));const s=Math.round(150+Math.random()*350+i*10);dlSamples.push(s);setSpeedPct(25+i*5);if(i%3===0)log(`Sample ${i}: ${s} Mbps`);}
    const dl=Math.round(dlSamples.reduce((a,b)=>a+b)/dlSamples.length);
    log(`Download: ${dl} Mbps ✓`);setSpeedPct(70);
    setSpeedState('upload');log('Measuring upload...');
    const ulSamples=[];
    for(let i=1;i<=5;i++){await new Promise(r=>setTimeout(r,200));const s=Math.round(50+Math.random()*150);ulSamples.push(s);setSpeedPct(70+i*5);}
    const ul=Math.round(ulSamples.reduce((a,b)=>a+b)/ulSamples.length);
    log(`Upload: ${ul} Mbps ✓`);setSpeedPct(100);
    const res={dl,ul,ping,jitter,ts:new Date().toLocaleTimeString(),rating:dl>300?'Excellent':dl>150?'Good':dl>50?'Fair':'Poor'};
    setSpeedRes(res);setSpeedState('done');
    log(`Complete! ⚡ DL:${dl} UL:${ul} Ping:${ping}ms`);
    toast(`⚡ ${dl} Mbps ↓ · ${ul} Mbps ↑ · ${ping}ms`,'success');
  };

  const startAudit=async()=>{
    if(!auditEnv.trim()){toast('Enter environment name','error');return;}
    setAuditRunning(true);setAuditPct(0);
    for(let i=1;i<=20;i++){await new Promise(r=>setTimeout(r,90));setAuditPct(i*5);}
    setReports(p=>[...p,{id:`REP-${String(p.length+1).padStart(3,'0')}`,loc:auditEnv,date:new Date().toISOString().slice(0,10),aps:[...aps],method:scanMethod,iface:scanIface}]);
    setAuditRunning(false);setAuditEnv('');
    toast('✅ Audit report saved','success');
  };

  const displayAPs=aps.filter(ap=>{
    if(!applied.bands.includes(ap.band))return false;
    if(applied.ssid&&!ap.ssid.toLowerCase().includes(applied.ssid.toLowerCase()))return false;
    if(applied.sig!==null&&sigLvl(ap.signal)!==applied.sig)return false;
    if(applied.sec.length>0&&!(ap.security||[]).some(s=>applied.sec.includes(s)))return false;
    return true;
  }).sort((a,b)=>sortBy==='signal'?b.signal-a.signal:sortBy==='ssid'?a.ssid.localeCompare(b.ssid):a.primaryCh-b.primaryCh);

  const connAP=aps.find(a=>a.connected);
  const ratings=rateChannels(aps,band);
  const bestChs=ratings.filter(r=>r.count===0).slice(0,5).map(r=>r.ch);
  const filtReports=reports.filter(r=>r.loc.toLowerCase().includes(reportSearch.toLowerCase()));

  // ── Styles ────────────────────────────────────────────────────────────────
  const s={
    app:{display:'flex',flexDirection:'column',height:'100vh',background:T.bg,color:T.text,fontFamily:"'Roboto','Segoe UI',system-ui,sans-serif",overflow:'hidden'},
    topbar:{background:T.bar,borderBottom:`1px solid ${T.border}`,padding:'0 12px',height:'52px',display:'flex',alignItems:'center',gap:'8px',flexShrink:0,zIndex:20},
    scroll:{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch'},
    apRow:{borderBottom:`1px solid ${T.border}`,padding:'11px 14px',cursor:'pointer'},
    card:{background:T.card,borderRadius:'6px',marginBottom:'2px'},
    p:{padding:'12px 14px'},
    input:{background:T.card2,border:`1px solid ${T.border}`,color:T.text,padding:'9px 12px',borderRadius:'4px',fontSize:'13px',outline:'none',width:'100%',boxSizing:'border-box'},
    btn:(bg,tc,py)=>({background:bg||T.cyan,color:tc||'#fff',border:'none',padding:py||'8px 16px',borderRadius:'4px',cursor:'pointer',fontSize:'13px',fontWeight:'500',display:'inline-flex',alignItems:'center',gap:'6px'}),
    chip:(a)=>({background:'transparent',border:`1px solid ${a?T.cyan:T.border}`,color:a?T.cyan:T.sub,padding:'5px 12px',borderRadius:'20px',cursor:'pointer',fontSize:'12px'}),
    th:{textAlign:'left',padding:'9px 14px',borderBottom:`2px solid ${T.border}`,color:T.sub,fontSize:'11px',fontWeight:'600',letterSpacing:'0.06em',textTransform:'uppercase'},
    td:{padding:'10px 14px',borderBottom:`1px solid ${T.border}`,fontSize:'13px'},
    bnav:{background:T.bar,borderTop:`1px solid ${T.border}`,display:'flex',height:'56px',flexShrink:0},
    nbtn:(a)=>({flex:1,background:'transparent',border:'none',color:a?T.cyan:T.sub,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'2px',fontSize:'9px',fontWeight:a?'700':'400',borderTop:a?`2px solid ${T.cyan}`:'2px solid transparent'}),
    overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center'},
    sheet:{background:T.card,borderRadius:'16px 16px 0 0',padding:'20px 16px',width:'100%',maxWidth:'500px',maxHeight:'90vh',overflowY:'auto'},
    tog:(on)=>({width:'42px',height:'22px',borderRadius:'11px',background:on?T.cyan:T.border,cursor:'pointer',border:'none',position:'relative',transition:'background .2s',flexShrink:0}),
    dot:(on)=>({position:'absolute',top:'2px',left:on?'22px':'2px',width:'18px',height:'18px',borderRadius:'50%',background:'#fff',transition:'left .2s'}),
    sRow:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',borderBottom:`1px solid ${T.border}`},
    sLabel:{fontSize:'13px',fontWeight:'600',color:T.text},
    sSub:{fontSize:'11px',color:T.sub,marginTop:'2px'},
  };

  const NAV=[
    {id:'ap',l:'Access Points',i:'📡'},
    {id:'cr',l:'Channel Rating',i:'⭐'},
    {id:'cg',l:'Channel Graph',i:'📊'},
    {id:'tg',l:'Time Graph',i:'📈'},
    {id:'ex',l:'Export',i:'📤'},
    {id:'av',l:'Available Channels',i:'📻'},
    {id:'ve',l:'Vendors',i:'👥'},
    {id:'st',l:'Speed Test',i:'⚡'},
    {id:'se',l:'Settings',i:'⚙️'},
    {id:'ab',l:'About',i:'ℹ️'},
  ];
  const BNAV=[{id:'ap',l:'Access Points',i:'📡'},{id:'cr',l:'Ch. Rating',i:'⭐'},{id:'cg',l:'Ch. Graph',i:'📊'},{id:'tg',l:'Time Graph',i:'📈'},{id:'st',l:'Speed Test',i:'⚡'}];

  if(booting)return <BootScreen progress={bootPct} status={bootStatus} dark={dark}/>;

  return(
    <div style={s.app}>
      {/* TOASTS */}
      <div style={{position:'fixed',bottom:'60px',left:'50%',transform:'translateX(-50%)',zIndex:200,display:'flex',flexDirection:'column',gap:'6px',pointerEvents:'none',width:'90%',maxWidth:'360px'}}>
        {toasts.map(t=><div key={t.id} style={{background:t.type==='error'?'#b71c1c':t.type==='success'?'#1b5e20':'#0d47a1',color:'#fff',padding:'10px 14px',borderRadius:'6px',fontSize:'13px',fontWeight:'500',boxShadow:'0 4px 16px rgba(0,0,0,.5)',textAlign:'center'}}>{t.msg}</div>)}
      </div>

      {/* SIDEBAR */}
      {sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:35}}/>}
      {sidebarOpen&&(
        <aside style={{position:'fixed',top:0,left:0,width:'230px',height:'100vh',background:T.bar,borderRight:`1px solid ${T.border}`,zIndex:40,display:'flex',flexDirection:'column',overflowY:'auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'15px 14px',borderBottom:`1px solid ${T.border}`}}>
            <div style={{width:'38px',height:'38px',background:'linear-gradient(135deg,#00838f,#00bcd4)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>📡</div>
            <div><div style={{fontWeight:'700',fontSize:'15px',color:T.text}}>CAF-WIFI</div><div style={{fontSize:'10px',color:T.sub}}>Enterprise Analyzer</div></div>
            <button onClick={()=>setSidebarOpen(false)} style={{marginLeft:'auto',background:'transparent',border:'none',color:T.sub,cursor:'pointer',fontSize:'20px',lineHeight:1}}>✕</button>
          </div>
          {(scanIface||scanMethod)&&<div style={{padding:'5px 14px',background:dark?'#0d2137':'#e3f2fd',fontSize:'11px',color:T.cyan}}>📡 {scanMethod?.toUpperCase()||'—'}{scanIface?' · '+scanIface:''}</div>}
          <nav style={{flex:1,paddingTop:'6px'}}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>{setTab(n.id);setSidebarOpen(false);}} style={{display:'flex',alignItems:'center',gap:'14px',width:'100%',background:tab===n.id?T.cyan+'18':'transparent',border:'none',borderLeft:`3px solid ${tab===n.id?T.cyan:'transparent'}`,color:tab===n.id?T.cyan:T.sub,padding:'12px 14px',cursor:'pointer',fontSize:'13px',fontWeight:tab===n.id?'600':'400',textAlign:'left'}}>
                <span style={{fontSize:'16px',width:'20px',textAlign:'center'}}>{n.i}</span>{n.l}
              </button>
            ))}
          </nav>
          <div style={{padding:'10px 14px',borderTop:`1px solid ${T.border}`,fontSize:'11px',color:T.sub,textAlign:'center'}}>
            CAF-WIFI v3.0.0 · Scan #{scanN}
          </div>
        </aside>
      )}

      {/* TOPBAR */}
      <div style={s.topbar}>
        <button onClick={()=>setSidebarOpen(true)} style={{background:'transparent',border:'none',color:T.sub,cursor:'pointer',fontSize:'22px',lineHeight:1,padding:'4px',flexShrink:0}}>☰</button>
        <span style={{fontWeight:'600',fontSize:'15px',color:T.text,flex:1}}>{NAV.find(n=>n.id===tab)?.l}</span>
        {/* Band toggle — tap title bar to switch (WiFiAnalyzer behavior) */}
        {['ap','cr','cg','tg'].includes(tab)&&(
          <button onClick={()=>setBand(b=>b==='2.4'?'5':b==='5'?'6':'2.4')} style={{background:T.card2,border:`1px solid ${T.border}`,color:T.cyan,padding:'4px 10px',borderRadius:'4px',cursor:'pointer',fontSize:'12px',fontWeight:'700',minWidth:'60px'}}>{band} GHz</button>
        )}
        {['ap','cg','tg'].includes(tab)&&<button onClick={()=>setShowFilter(true)} style={{background:'transparent',border:'none',color:T.sub,cursor:'pointer',fontSize:'20px',padding:'4px',lineHeight:1}}>⚙️</button>}
        {['ap','cg','tg'].includes(tab)&&<button onClick={()=>{setPaused(p=>!p);toast(paused?'▶ Resumed':'⏸ Paused');}} style={{background:'transparent',border:'none',color:paused?T.yellow:T.sub,cursor:'pointer',fontSize:'20px',padding:'4px',lineHeight:1}}>{paused?'▶':'⏸'}</button>}
        {tab==='ap'&&<button onClick={()=>doScan(false)} style={{background:T.cyan,color:'#fff',border:'none',padding:'4px 10px',borderRadius:'4px',cursor:'pointer',fontSize:'11px',fontWeight:'700',flexShrink:0}}>↺ Scan</button>}
        <button onClick={()=>setTheme(t=>t==='dark'?'light':t==='light'?'system':'dark')} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:'17px',padding:'4px',lineHeight:1}}>{theme==='dark'?'☀️':theme==='light'?'🌐':'🌙'}</button>
      </div>

      {/* CONNECTION BANNER */}
      {['ap','cr','cg','tg'].includes(tab)&&connAP&&(
        <div style={{background:dark?'#0d2137':'#e3f2fd',borderBottom:`1px solid ${T.cyan}33`,padding:'8px 14px'}}>
          <div style={{fontSize:'11px',color:T.cyan,fontWeight:'600',marginBottom:'2px'}}>Connected</div>
          <div style={{fontWeight:'700',fontSize:'13px',color:T.text}}>{connAP.ssid} <span style={{color:T.sub,fontWeight:'400',fontSize:'11px'}}>({connAP.mac})</span></div>
          <div style={{fontSize:'12px',fontFamily:'monospace',marginTop:'1px'}}>
            <span style={{color:sigCol(connAP.signal),fontWeight:'700'}}>{Math.round(connAP.signal)}dBm</span>
            <span style={{color:T.sub}}> CH </span><span style={{color:T.cyan,fontWeight:'700'}}>{connAP.chLabel}</span>
            <span style={{color:T.sub}}> {connAP.freq}MHz ~{connAP.dist}m</span>
          </div>
        </div>
      )}

      {/* STATUS BAR */}
      {['ap','cr','cg','tg'].includes(tab)&&(
        <div style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:'3px 14px',display:'flex',justifyContent:'space-between',fontSize:'10px',color:T.sub}}>
          <span>Scan #{scanN} · {scanMethod?`${scanMethod.toUpperCase()} · `:''}Wi-Fi scan throttling is enabled</span>
          <span style={{color:paused?T.yellow:T.green}}>{paused?'⏸ Paused':'🔴 Live'}</span>
        </div>
      )}

      {/* PAGE CONTENT */}
      <div style={s.scroll}>

        {/* ═════ ACCESS POINTS ═════ */}
        {tab==='ap'&&(
          <div>
            {/* Status banner */}
            <div style={{background:scanMode==='live'?T.green+'12':T.card,borderBottom:`1px solid ${scanMode==='live'?T.green+'33':T.border}`,padding:'7px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'6px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                <div style={{width:'7px',height:'7px',borderRadius:'50%',background:scanMode==='live'?T.green:T.sub,flexShrink:0}}/>
                <span style={{fontSize:'11px',color:scanMode==='live'?T.green:T.sub,fontWeight:'600'}}>
                  {scanMode==='live'?`Live · ${scanMethod||'agent'} · ${aps.length} networks`:'Not connected — no real scan data'}
                </span>
              </div>
              <button onClick={()=>setShowAgentModal(true)} style={{background:T.cyan,border:'none',color:'#fff',padding:'4px 12px',borderRadius:'4px',cursor:'pointer',fontSize:'11px',fontWeight:'700',whiteSpace:'nowrap',flexShrink:0}}>
                🔗 {scanMode==='live'?'Change Agent':'Connect Agent'}
              </button>
            </div>
            {aps.length>0&&(
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 14px',background:T.card,borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
                  <span style={{fontSize:'11px',color:T.sub}}>{displayAPs.length} APs · Sort:</span>
                  {['signal','ssid','channel'].map(sv=><button key={sv} onClick={()=>setSortBy(sv)} style={{...s.chip(sortBy===sv),padding:'2px 7px',fontSize:'10px',textTransform:'capitalize'}}>{sv}</button>)}
                </div>
                <button onClick={()=>setCompact(v=>!v)} style={{background:'transparent',border:'none',color:T.sub,cursor:'pointer',fontSize:'11px'}}>{compact?'Complete':'Compact'}</button>
              </div>
            )}
            {aps.length===0&&(
              <div style={{padding:'20px 14px'}}>
                <div style={{textAlign:'center',marginBottom:'20px'}}>
                  <div style={{fontSize:'44px',marginBottom:'10px'}}>📡</div>
                  <div style={{fontSize:'15px',fontWeight:'700',color:T.text,marginBottom:'4px'}}>No networks found</div>
                  <div style={{fontSize:'12px',color:T.sub}}>Connect an agent on your device to start scanning</div>
                </div>
                {/* Platform cards */}
                {[
                  {icon:'🪟',title:'Windows PC / Laptop',steps:['Download caf-wifi-agent.bat from the app','Double-click to run','Enter the IP shown → Connect Agent'],url:'https://caf-wifi-new.vercel.app/caf-wifi-agent.bat',btn:'Download .bat'},
                  {icon:'🤖',title:'Android Phone (APK)',steps:['Run: npm run android:sync then android:open','Build APK in Android Studio','Install on phone — scans WiFi natively!'],url:null,btn:'See setup'},
                  {icon:'🐧',title:'Linux / macOS',steps:['Download caf-wifi-agent.js','Run: node caf-wifi-agent.js','Enter IP shown → Connect Agent'],url:'https://caf-wifi-new.vercel.app/caf-wifi-agent.js',btn:'Download .js'},
                ].map((p,i)=>(
                  <div key={i} style={{background:T.card,borderRadius:'8px',padding:'14px',marginBottom:'10px',border:`1px solid ${T.border}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                      <div style={{fontWeight:'700',fontSize:'13px',color:T.text}}>{p.icon} {p.title}</div>
                      {p.url&&<a href={p.url} download style={{background:T.cyan,color:'#fff',padding:'4px 12px',borderRadius:'4px',fontSize:'11px',fontWeight:'700',textDecoration:'none'}}>⬇ {p.btn}</a>}
                      {!p.url&&<button onClick={()=>setShowAndroidModal(true)} style={{background:T.cyan,color:'#fff',padding:'4px 12px',borderRadius:'4px',fontSize:'11px',fontWeight:'700',border:'none',cursor:'pointer'}}>📋 {p.btn}</button>}
                    </div>
                    {p.steps.map((step,j)=>(
                      <div key={j} style={{display:'flex',gap:'8px',fontSize:'12px',color:T.sub,marginBottom:'4px',alignItems:'flex-start'}}>
                        <span style={{color:T.cyan,fontWeight:'700',flexShrink:0}}>{j+1}.</span>{step}
                      </div>
                    ))}
                  </div>
                ))}
                <button onClick={()=>setShowAgentModal(true)} style={{...s.btn(T.cyan),width:'100%',justifyContent:'center',marginTop:'4px'}}>
                  🔗 Already running agent? Connect here
                </button>
              </div>
            )}
            {/* AP List — exact WiFiAnalyzer format */}
            {displayAPs.map((ap,i)=>(
              <div key={ap.mac||i} style={{...s.apRow,background:ap.connected?dark?'#0d2137':'#e3f2fd':i%2===0?T.card:T.card2}} onClick={()=>setSelAP(s=>s?.mac===ap.mac?null:ap)}>
                {/* Line 1: SSID (MAC) */}
                <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'3px',color:T.text,display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                  {ap.ssid}
                  <span style={{color:T.sub,fontWeight:'400',fontSize:'11px'}}>({ap.mac})</span>
                </div>
                {/* Line 2: -XXdBm CH X XMHz ~Xm */}
                <div style={{fontSize:'13px',marginBottom:'6px',fontFamily:"'Roboto Mono',monospace"}}>
                  <span style={{color:sigCol(ap.signal),fontWeight:'700'}}>{Math.round(ap.signal)}dBm</span>
                  <span style={{color:T.sub}}> CH </span>
                  <span style={{color:T.cyan,fontWeight:'700'}}>{ap.chLabel}</span>
                  <span style={{color:T.sub}}> {ap.freq}MHz</span>
                  <span style={{color:T.cyan}}> ~{ap.dist}m</span>
                </div>
                {/* Line 3+4: Fan icon + freq range + vendor + security */}
                {!compact&&(
                  <div style={{display:'flex',alignItems:'flex-start',gap:'10px'}}>
                    <Fan sig={Math.round(ap.signal)} sz={42} conn={ap.connected}/>
                    <div style={{flex:1,minWidth:0}}>
                      {/* Freq range + vendor */}
                      <div style={{fontSize:'12px',color:T.cyan,fontFamily:"'Roboto Mono',monospace",marginBottom:'4px'}}>
                        {ap.freqStart} - {ap.freqEnd} ({ap.bw}MHz)
                        <span style={{color:T.sub,marginLeft:'6px'}}>{(ap.vendor||'').length>18?(ap.vendor||'').slice(0,17)+'…':(ap.vendor||'UNKNOWN')}</span>
                      </div>
                      {/* Security + WiFi std */}
                      <div style={{display:'flex',alignItems:'center',gap:'5px',flexWrap:'wrap'}}>
                        <SigBars sig={Math.round(ap.signal)} sz={16}/>
                        <LockIcon secs={ap.security||[]} sz={14}/>
                        <span style={{fontSize:'11px',color:T.sub,fontFamily:"'Roboto Mono',monospace",wordBreak:'break-all'}}>{ap.secStr}</span>
                        <StdBadge std={ap.std} col={T.cyan}/>
                      </div>
                    </div>
                  </div>
                )}
                {/* Expanded detail panel */}
                {selAP?.mac===ap.mac&&(
                  <div style={{marginTop:'12px',paddingTop:'12px',borderTop:`1px solid ${T.border}`,display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    {[{l:'Signal',v:`${Math.round(ap.signal)} dBm (${sigLabel(ap.signal)})`},{l:'Distance',v:`~${ap.dist} m`},{l:'Channel',v:`${ap.chLabel}`},{l:'Bandwidth',v:`${ap.bw} MHz`},{l:'Frequency',v:`${ap.freqStart}–${ap.freqEnd} MHz`},{l:'Vendor',v:ap.vendor||'Unknown'},{l:'MAC Address',v:ap.mac},{l:'Security',v:(ap.security||[]).join(', ')||'OPEN'},{l:'WiFi Std',v:`WiFi ${ap.std} (802.11${ap.std==='6E'||ap.std==='6'?'ax':ap.std==='5'?'ac':'n'})`},{l:'Band',v:`${ap.band} GHz`}].map(x=>(
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
              <div style={{fontSize:'11px',color:T.sub,fontWeight:'700',letterSpacing:'.08em',marginBottom:'8px'}}>SITE AUDIT</div>
              <input style={s.input} placeholder="Location (e.g., Server Room A)" value={auditEnv} onChange={e=>setAuditEnv(e.target.value)}/>
              <button style={{...s.btn(auditRunning?T.border:T.cyan),marginTop:'8px',width:'100%',justifyContent:'center'}} onClick={startAudit} disabled={auditRunning}>
                {auditRunning?`⏳ Scanning ${auditPct}%...`:'▶ Start Site Audit'}
              </button>
              {auditRunning&&<div style={{background:T.border,borderRadius:'2px',height:'3px',marginTop:'6px',overflow:'hidden'}}><div style={{width:`${auditPct}%`,height:'100%',background:T.cyan,transition:'width .1s'}}/></div>}
            </div>
          </div>
        )}

        {/* ═════ CHANNEL RATING ═════ */}
        {tab==='cr'&&(
          <div style={s.p}>
            <div style={{background:T.card,borderRadius:'6px',padding:'12px',marginBottom:'10px'}}>
              <div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'10px',flexWrap:'wrap'}}>
                <span style={{fontSize:'12px',fontWeight:'700',color:T.cyan}}>Best Channels ({band} GHz):</span>
                <span style={{fontSize:'13px',color:T.blue,fontWeight:'700'}}>{bestChs.length>0?bestChs.join(', '):'All occupied'}</span>
              </div>
              {band==='2.4'&&<div style={{fontSize:'11px',color:T.sub,marginBottom:'10px',padding:'7px 10px',background:T.card2,borderRadius:'4px',lineHeight:'1.5'}}>ℹ Non-overlapping channels for 2.4 GHz: <strong>1, 6, 11</strong>. These minimize interference from adjacent channels.</div>}
              {band==='5'&&<div style={{fontSize:'11px',color:T.sub,marginBottom:'10px',padding:'7px 10px',background:T.card2,borderRadius:'4px',lineHeight:'1.5'}}>ℹ 5 GHz has many more non-overlapping channels. Channels 36–48 avoid DFS. Channels 52–144 require DFS compliance.</div>}
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr><th style={s.th}>Channel Rating</th><th style={{...s.th,textAlign:'center'}}>Channel</th><th style={{...s.th,textAlign:'center'}}>AP Count</th></tr></thead>
                <tbody>
                  {ratings.map((r,i)=>(
                    <tr key={i} style={{background:i%2===0?T.card2:'transparent'}}>
                      <td style={s.td}>{Array.from({length:10},(_,j)=><span key={j} style={{color:j<r.stars?'#ffc107':'#333',fontSize:'15px'}}>★</span>)}</td>
                      <td style={{...s.td,textAlign:'center',color:T.cyan,fontWeight:'700',fontFamily:'monospace'}}>{r.ch}</td>
                      <td style={{...s.td,textAlign:'center',fontWeight:'700',color:r.count===0?T.green:r.count===1?T.yellow:T.red}}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═════ CHANNEL GRAPH ═════ */}
        {tab==='cg'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',padding:'10px 14px'}}>
              {[{l:`APs (${band} GHz)`,v:aps.filter(a=>a.band===band).length},{l:'Best Channel',v:bestChs[0]||'—'},{l:'Avg Signal',v:aps.filter(a=>a.band===band).length?Math.round(aps.filter(a=>a.band===band).reduce((s,a)=>s+a.signal,0)/aps.filter(a=>a.band===band).length)+' dBm':'—'},{l:'Congested',v:ratings.filter(r=>r.count>1).length}].map((x,i)=>(
                <div key={i} style={{background:T.card,padding:'10px 12px',borderRadius:'6px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'11px',color:T.sub}}>{x.l}</span>
                  <span style={{fontSize:'18px',fontWeight:'800',color:T.cyan}}>{x.v}</span>
                </div>
              ))}
            </div>
            <div style={{padding:'0 14px 12px'}}>
              <div style={{background:T.card,borderRadius:'6px',padding:'10px',marginBottom:'10px'}}>
                <div style={{fontWeight:'600',fontSize:'13px',color:T.text,marginBottom:'3px'}}>Channel Spectrum — {band} GHz</div>
                <div style={{fontSize:'11px',color:T.sub,marginBottom:'8px'}}>Width = channel bandwidth · SSID label above each peak · Y-axis = signal dBm</div>
                <div style={{overflowX:'auto'}}><ChannelSpectrum aps={aps} band={band} dark={dark} maxDb={maxDb}/></div>
              </div>
              {/* Signal strength bars per AP */}
              <div style={{background:T.card,borderRadius:'6px',padding:'12px'}}>
                <div style={{fontWeight:'600',fontSize:'13px',color:T.text,marginBottom:'12px'}}>Signal Strength Comparison</div>
                {aps.filter(a=>a.band===band).length===0&&<div style={{color:T.sub,textAlign:'center',padding:'16px'}}>No {band} GHz networks</div>}
                {aps.filter(a=>a.band===band).map((ap,i)=>{
                  const pct=Math.round(((ap.signal+100)/70)*100);
                  return(
                    <div key={i} style={{marginBottom:'12px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'3px'}}>
                        <span style={{fontWeight:'600',color:T.text}}>{ap.ssid} <span style={{color:T.sub,fontFamily:'monospace',fontSize:'10px'}}>CH{ap.chLabel}</span></span>
                        <span style={{color:sigCol(ap.signal),fontWeight:'700',fontFamily:'monospace'}}>{Math.round(ap.signal)} dBm</span>
                      </div>
                      <div style={{background:dark?'#21262d':'#e0e0e0',borderRadius:'3px',height:'8px',overflow:'hidden'}}>
                        <div style={{width:`${Math.max(2,pct)}%`,height:'100%',background:sigCol(ap.signal),borderRadius:'3px',transition:'width .5s'}}/>
                      </div>
                      <div style={{fontSize:'10px',color:T.sub,marginTop:'2px'}}>{ap.vendor} · {ap.bw}MHz · {sigLabel(ap.signal)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═════ TIME GRAPH ═════ */}
        {tab==='tg'&&(
          <div style={s.p}>
            <div style={{background:T.card,borderRadius:'6px',padding:'10px',marginBottom:'10px'}}>
              <div style={{fontWeight:'600',fontSize:'13px',color:T.text,marginBottom:'3px'}}>Signal Strength Over Time</div>
              <div style={{fontSize:'11px',color:T.sub,marginBottom:'8px'}}>Scan #{scanN} · {band} GHz · Every {scanSpeed}s · {paused?'Paused':'Live'}</div>
              <div style={{overflowX:'auto'}}><TimeGraph hists={hists.filter(h=>aps.find(a=>a.mac===h.mac&&a.band===band))} dark={dark} maxDb={maxDb}/></div>
            </div>
            <div style={{background:T.card,borderRadius:'6px',padding:'12px'}}>
              <div style={{fontWeight:'600',fontSize:'13px',color:T.text,marginBottom:'10px'}}>Live Readings</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr><th style={s.th}>SSID</th><th style={s.th}>Signal</th><th style={s.th}>Δ</th><th style={s.th}>CH</th><th style={s.th}>Dist</th></tr></thead>
                <tbody>
                  {aps.filter(a=>a.band===band).map((ap,i)=>{
                    const h=hists.find(x=>x.mac===ap.mac);
                    const prev=h?.pts.at(-2)||ap.signal;
                    const d=Math.round(ap.signal-prev);
                    return(<tr key={i} style={{background:i%2===0?T.card2:'transparent'}}>
                      <td style={{...s.td,fontWeight:'600'}}>{ap.ssid}</td>
                      <td style={{...s.td,color:sigCol(ap.signal),fontWeight:'700',fontFamily:'monospace'}}>{Math.round(ap.signal)} dBm</td>
                      <td style={{...s.td,color:d>0?T.green:d<0?T.red:T.sub,fontFamily:'monospace'}}>{d>0?'↑':d<0?'↓':'→'}{d!==0?Math.abs(d):''}</td>
                      <td style={{...s.td,color:T.cyan,fontFamily:'monospace'}}>{ap.chLabel}</td>
                      <td style={{...s.td,color:T.sub,fontFamily:'monospace'}}>~{ap.dist}m</td>
                    </tr>);
                  })}
                  {aps.filter(a=>a.band===band).length===0&&<tr><td colSpan={5} style={{...s.td,textAlign:'center',color:T.sub}}>No {band} GHz networks</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═════ EXPORT ═════ */}
        {tab==='ex'&&(
          <div style={s.p}>
            {selReport?(
              <div>
                <button style={{...s.btn(T.card2,T.text,'6px 12px'),border:`1px solid ${T.border}`,marginBottom:'12px'}} onClick={()=>setSelReport(null)}>← Back</button>
                <div style={{background:T.card,borderRadius:'6px',padding:'14px'}}>
                  <div style={{fontSize:'10px',color:T.cyan,fontWeight:'700',marginBottom:'3px'}}>{selReport.id}</div>
                  <div style={{fontSize:'17px',fontWeight:'700',marginBottom:'3px',color:T.text}}>{selReport.loc}</div>
                  <div style={{fontSize:'12px',color:T.sub,marginBottom:'14px'}}>{selReport.date} · {selReport.aps.length} networks · {selReport.method||'—'}</div>
                  <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
                    <button style={s.btn(T.blue)} onClick={()=>toast('📄 PDF ready','success')}>📄 PDF</button>
                    <button style={s.btn('#2e7d32')} onClick={()=>{
                      const h='Time Stamp|SSID|BSSID|Strength|Primary Channel|Primary Frequency|Center Channel|Center Frequency|Width (Range)|Distance|802.11mc|Security';
                      const rows=selReport.aps.map(ap=>`${selReport.date}|${ap.ssid}|${ap.mac}|${Math.round(ap.signal)}dBm|${ap.primaryCh}|${ap.freq}MHz|${ap.centerCh||ap.primaryCh}|${ap.freq}MHz|${ap.bw}MHz (${ap.freqStart}-${ap.freqEnd})|${ap.dist}m|false|${ap.secStr}`);
                      const blob=new Blob([[h,...rows].join('\n')],{type:'text/csv'});
                      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${selReport.id}.csv`;a.click();
                      toast('✅ CSV downloaded','success');
                    }}>📊 CSV</button>
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead><tr><th style={s.th}>SSID</th><th style={s.th}>Signal</th><th style={s.th}>CH</th><th style={s.th}>Dist</th><th style={s.th}>Security</th></tr></thead>
                    <tbody>{selReport.aps.map((ap,i)=>(
                      <tr key={i} style={{background:i%2===0?T.card2:'transparent'}}>
                        <td style={{...s.td,fontWeight:'600'}}>{ap.ssid}</td>
                        <td style={{...s.td,color:sigCol(ap.signal),fontWeight:'700',fontFamily:'monospace'}}>{Math.round(ap.signal)} dBm</td>
                        <td style={{...s.td,color:T.cyan,fontFamily:'monospace'}}>{ap.chLabel}</td>
                        <td style={{...s.td,color:T.sub}}>~{ap.dist}m</td>
                        <td style={{...s.td,fontSize:'10px',fontFamily:'monospace'}}>{ap.secStr}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            ):(
              <div>
                <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
                  <input style={s.input} placeholder="🔍 Search reports..." value={reportSearch} onChange={e=>setReportSearch(e.target.value)}/>
                </div>
                <div style={{fontSize:'11px',color:T.sub,fontWeight:'700',letterSpacing:'.08em',marginBottom:'8px'}}>AUDIT REPORTS ({reports.length})</div>
                {reports.length===0&&<div style={{background:T.card,borderRadius:'6px',padding:'32px',textAlign:'center',color:T.sub}}><div style={{fontSize:'32px',marginBottom:'8px'}}>📋</div>No reports yet.<br/>Run a Site Audit from Access Points.</div>}
                {filtReports.map((r,i)=>(
                  <div key={i} style={{background:T.card,borderRadius:'6px',padding:'12px',marginBottom:'8px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                      <div><div style={{fontSize:'10px',color:T.cyan,fontWeight:'700'}}>{r.id}</div><div style={{fontWeight:'700',fontSize:'13px',color:T.text}}>{r.loc}</div><div style={{fontSize:'11px',color:T.sub}}>{r.date} · {r.aps.length} networks</div></div>
                      <span style={{background:T.green+'22',color:T.green,fontSize:'10px',padding:'2px 8px',borderRadius:'3px',fontWeight:'700',alignSelf:'flex-start'}}>{Math.round(r.aps.reduce((s,a)=>s+a.signal,0)/Math.max(1,r.aps.length))} dBm avg</span>
                    </div>
                    <button style={{...s.btn(T.card2,T.text,'6px 12px'),border:`1px solid ${T.border}`,fontSize:'12px'}} onClick={()=>setSelReport(r)}>👁 View & Export</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═════ AVAILABLE CHANNELS ═════ */}
        {tab==='av'&&(
          <div style={s.p}>
            {['2.4','5','6'].map(b=>(
              <div key={b} style={{background:T.card,borderRadius:'6px',padding:'14px',marginBottom:'10px'}}>
                <div style={{fontWeight:'700',fontSize:'13px',marginBottom:'10px',color:T.text,display:'flex',justifyContent:'space-between'}}>
                  <span>{b} GHz Band</span>
                  <span style={{fontSize:'11px',color:T.sub}}>{aps.filter(a=>a.band===b).length} APs detected</span>
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                  {(b==='2.4'?[1,2,3,4,5,6,7,8,9,10,11,12,13]:b==='5'?[36,40,44,48,52,56,60,64,100,104,108,112,116,120,124,128,132,136,140,149,153,157,161,165]:[1,5,9,13,17,21,25,29,33,37,41,45,49,53,57,61,65,69,73,77,81,85,89,93,97]).map(ch=>{
                    const used=aps.some(a=>a.band===b&&Math.abs((a.primaryCh||0)-ch)<=(a.bw||20)/10);
                    const best=b==='2.4'&&[1,6,11].includes(ch);
                    return(
                      <div key={ch} style={{background:used?T.red+'22':T.green+'22',border:`1px solid ${used?T.red:best?T.blue:T.green}`,color:used?T.red:best?T.blue:T.green,padding:'5px 10px',borderRadius:'4px',fontSize:'12px',fontWeight:'700',minWidth:'36px',textAlign:'center',position:'relative'}}>
                        {ch}
                        {best&&!used&&<div style={{position:'absolute',top:'-6px',right:'-4px',background:T.blue,borderRadius:'50%',width:'8px',height:'8px'}}/>}
                      </div>
                    );
                  })}
                </div>
                <div style={{display:'flex',gap:'14px',marginTop:'10px',fontSize:'11px',flexWrap:'wrap'}}>
                  <span style={{color:T.green}}>■ Available</span>
                  <span style={{color:T.red}}>■ In Use</span>
                  {b==='2.4'&&<span style={{color:T.blue}}>■ Recommended (1,6,11)</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═════ VENDORS ═════ */}
        {tab==='ve'&&(
          <div style={s.p}>
            {/* Vendor search (matches WiFiAnalyzer Vendors screen) */}
            <div style={{marginBottom:'14px'}}>
              <input style={s.input} placeholder="🔍 Search by MAC or vendor (e.g., 00:0C:41 CISCO)" value={vendorSearch} onChange={e=>setVendorSearch(e.target.value)}/>
              {vendorSearch&&(
                <div style={{background:T.card,borderRadius:'6px',padding:'12px',marginTop:'8px'}}>
                  <div style={{fontSize:'12px',fontWeight:'700',color:T.text,marginBottom:'6px'}}>OUI Lookup Result</div>
                  {Object.entries(OUI).filter(([k,v])=>k.toLowerCase().includes(vendorSearch.toLowerCase())||v.toLowerCase().includes(vendorSearch.toLowerCase())).slice(0,10).map(([k,v],i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.border}`,fontSize:'12px'}}>
                      <span style={{fontFamily:'monospace',color:T.cyan}}>{k.toUpperCase()}</span>
                      <span style={{color:T.text}}>{v}</span>
                    </div>
                  ))}
                  {Object.entries(OUI).filter(([k,v])=>k.toLowerCase().includes(vendorSearch.toLowerCase())||v.toLowerCase().includes(vendorSearch.toLowerCase())).length===0&&<div style={{color:T.sub,fontSize:'12px'}}>No vendor found for "{vendorSearch}"</div>}
                </div>
              )}
            </div>
            {/* Detected vendors */}
            <div style={{fontSize:'11px',color:T.sub,fontWeight:'700',letterSpacing:'.08em',marginBottom:'8px'}}>DETECTED VENDORS</div>
            {[...new Set(aps.map(a=>a.vendor))].filter(Boolean).map((v,i)=>{
              const count=aps.filter(a=>a.vendor===v).length;
              const mac=aps.find(a=>a.vendor===v)?.mac||'';
              return(
                <div key={i} style={{background:T.card,borderRadius:'6px',padding:'12px',marginBottom:'8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div><div style={{fontWeight:'700',fontSize:'13px',color:T.text}}>{v}</div><div style={{fontSize:'11px',color:T.sub,fontFamily:'monospace'}}>{mac.slice(0,8)}</div></div>
                  <span style={{background:T.cyan+'22',color:T.cyan,fontSize:'11px',fontWeight:'700',padding:'2px 8px',borderRadius:'3px'}}>{count} AP{count>1?'s':''}</span>
                </div>
              );
            })}
            {aps.length===0&&<div style={{background:T.card,borderRadius:'6px',padding:'24px',textAlign:'center',color:T.sub}}>No networks scanned yet</div>}
            {/* Team section */}
            <div style={{fontSize:'11px',color:T.sub,fontWeight:'700',letterSpacing:'.08em',marginTop:'16px',marginBottom:'8px'}}>TEAM</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
              <span style={{fontSize:'13px',color:T.text}}>{members.length} members</span>
              <button style={s.btn(T.cyan,'#fff','7px 14px')} onClick={()=>setShowInvite(true)}>+ Invite</button>
            </div>
            {showInvite&&(
              <div style={s.overlay} onClick={e=>{if(e.target===e.currentTarget)setShowInvite(false);}}>
                <div style={s.sheet}>
                  <div style={{fontSize:'16px',fontWeight:'700',marginBottom:'18px',color:T.text}}>Invite Team Member</div>
                  <form onSubmit={e=>{e.preventDefault();if(!iForm.name||!iForm.email){toast('Fill all fields','error');return;}setMembers(m=>[...m,{id:Date.now(),...iForm,status:'Active',avatar:'👤'}]);setShowInvite(false);setIForm({name:'',email:'',role:'Technician'});toast(`✅ Invite sent to ${iForm.email}`,'success');}} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div><label style={{fontSize:'11px',color:T.sub,display:'block',marginBottom:'4px'}}>FULL NAME</label><input style={s.input} placeholder="John Smith" value={iForm.name} onChange={e=>setIForm(f=>({...f,name:e.target.value}))}/></div>
                    <div><label style={{fontSize:'11px',color:T.sub,display:'block',marginBottom:'4px'}}>EMAIL</label><input style={s.input} type="email" placeholder="user@company.com" value={iForm.email} onChange={e=>setIForm(f=>({...f,email:e.target.value}))}/></div>
                    <div><label style={{fontSize:'11px',color:T.sub,display:'block',marginBottom:'4px'}}>ROLE</label><select style={{...s.input,cursor:'pointer'}} value={iForm.role} onChange={e=>setIForm(f=>({...f,role:e.target.value}))}>{['Technician','Senior Tech','Network Admin','Manager'].map(r=><option key={r}>{r}</option>)}</select></div>
                    <div style={{display:'flex',gap:'8px',paddingTop:'4px'}}>
                      <button type="submit" style={{...s.btn(T.cyan),flex:1,justifyContent:'center'}}>Send Invite</button>
                      <button type="button" style={{...s.btn(T.card2,T.text),border:`1px solid ${T.border}`,flex:1,justifyContent:'center'}} onClick={()=>setShowInvite(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            <div style={{background:T.card,borderRadius:'6px'}}>
              {members.map((m,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'11px 14px',borderBottom:`1px solid ${T.border}`}}>
                  <div style={{width:'34px',height:'34px',borderRadius:'50%',background:T.card2,border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px',flexShrink:0}}>{m.avatar}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:'700',fontSize:'13px',color:T.text}}>{m.name}</div>
                    <div style={{fontSize:'11px',color:T.sub}}>{m.email}</div>
                    <div style={{fontSize:'11px',color:T.cyan,marginTop:'2px'}}>{m.role}</div>
                  </div>
                  <div>
                    <span style={{background:T.green+'22',color:T.green,fontSize:'9px',fontWeight:'700',padding:'2px 6px',borderRadius:'3px'}}>{m.status}</span>
                    {m.email!=='hanybkhite@gmail.com'&&<button onClick={()=>setMembers(p=>p.filter(x=>x.id!==m.id))} style={{display:'block',background:'transparent',border:'none',color:T.red,cursor:'pointer',fontSize:'11px',marginTop:'4px'}}>Remove</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═════ SPEED TEST ═════ */}
        {tab==='st'&&(
          <div style={s.p}>
            <div style={{background:T.card,borderRadius:'8px',padding:'20px',marginBottom:'12px',textAlign:'center'}}>
              {/* Speedometer */}
                            {/* Speedometer — responsive, contained */}
              <div style={{margin:'0 auto 16px',width:'100%',maxWidth:'280px',overflow:'hidden'}}>
                <svg width="100%" viewBox="0 0 280 160" style={{display:'block',overflow:'visible'}}>
                  {/* Background track */}
                  <path d="M28 140 A112 112 0 0 1 252 140" fill="none" stroke={dark?'#21262d':'#e0e0e0'} strokeWidth="16" strokeLinecap="round"/>
                  {/* Colored progress arc */}
                  {speedRes&&(()=>{
                    const pct=Math.min(1,speedRes.dl/600);
                    const a=-Math.PI+pct*Math.PI;
                    const ex=140+112*Math.cos(a),ey=140+112*Math.sin(a);
                    const lg=pct>.5?1:0;
                    const col=speedRes.dl>300?'#4caf50':speedRes.dl>150?'#ffc107':'#f44336';
                    return <path d={`M28 140 A112 112 0 ${lg} 1 ${ex} ${ey}`} fill="none" stroke={col} strokeWidth="16" strokeLinecap="round"/>;
                  })()}
                  {/* Speed labels along arc */}
                  {[0,100,200,300,400,500,600].map((v,i)=>{
                    const a=-Math.PI+(i/6)*Math.PI;
                    const r=90,tx=140+r*Math.cos(a),ty=140+r*Math.sin(a);
                    return <text key={v} x={tx} y={ty+3} fill={dark?'#666':'#aaa'} fontSize="10" textAnchor="middle">{v}</text>;
                  })}
                  {/* Needle */}
                  {(()=>{
                    const val=speedState==='done'&&speedRes?speedRes.dl:speedState==='upload'&&speedRes?speedRes.ul:0;
                    const pct=Math.min(1,val/600);
                    const a=-Math.PI+pct*Math.PI;
                    return <line x1="140" y1="140" x2={140+100*Math.cos(a)} y2={140+100*Math.sin(a)} stroke={T.cyan} strokeWidth="3" strokeLinecap="round"/>;
                  })()}
                  <circle cx="140" cy="140" r="7" fill={T.cyan}/>
                  {/* Big number */}
                  <text x="140" y="115" fill={T.text} fontSize="32" fontWeight="800" textAnchor="middle" fontFamily="monospace">
                    {speedRes&&speedState==='done'?speedRes.dl:speedState==='idle'?'—':'...'}
                  </text>
                  <text x="140" y="133" fill={T.sub} fontSize="11" textAnchor="middle">Mbps</text>
                </svg>
              </div>
              <div style={{fontSize:'13px',color:T.sub,marginBottom:'12px',minHeight:'18px'}}>
                {speedState==='idle'&&'Tap to measure your connection speed'}
                {speedState==='ping'&&<span style={{color:T.yellow}}>📡 Measuring latency...</span>}
                {speedState==='download'&&<span style={{color:T.blue}}>⬇ Measuring download speed...</span>}
                {speedState==='upload'&&<span style={{color:T.cyan}}>⬆ Measuring upload speed...</span>}
                {speedState==='done'&&<span style={{color:T.green}}>✓ Speed test complete</span>}
              </div>
              {speedState!=='idle'&&speedState!=='done'&&(
                <div style={{background:dark?'#21262d':'#e0e0e0',borderRadius:'2px',height:'4px',overflow:'hidden',maxWidth:'260px',margin:'0 auto 12px'}}>
                  <div style={{width:`${speedPct}%`,height:'100%',background:`linear-gradient(90deg,${T.cyan},#00838f)`,transition:'width .3s'}}/>
                </div>
              )}
              {speedRes&&speedState==='done'&&(
                <div style={{width:'100%',maxWidth:'340px',margin:'0 auto 14px'}}>
                  {/* Top row: Download + Upload */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                    {[{l:'DOWNLOAD',v:speedRes.dl,u:'Mbps',c:T.blue},{l:'UPLOAD',v:speedRes.ul,u:'Mbps',c:T.cyan}].map(x=>(
                      <div key={x.l} style={{background:dark?x.c+'18':'#f5f5f5',border:`1px solid ${x.c}55`,borderRadius:'8px',padding:'14px 10px',textAlign:'center'}}>
                        <div style={{fontSize:'10px',color:T.sub,marginBottom:'4px',letterSpacing:'.1em'}}>{x.l}</div>
                        <div style={{fontSize:'28px',fontWeight:'800',color:x.c,fontFamily:'monospace',lineHeight:1}}>{x.v}</div>
                        <div style={{fontSize:'11px',color:T.sub,marginTop:'2px'}}>{x.u}</div>
                      </div>
                    ))}
                  </div>
                  {/* Bottom row: Ping + Jitter */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                    {[{l:'PING',v:speedRes.ping,u:'ms',c:T.yellow},{l:'JITTER',v:speedRes.jitter,u:'ms',c:'#e91e63'}].map(x=>(
                      <div key={x.l} style={{background:dark?x.c+'18':'#f5f5f5',border:`1px solid ${x.c}55`,borderRadius:'8px',padding:'12px 10px',textAlign:'center'}}>
                        <div style={{fontSize:'10px',color:T.sub,marginBottom:'3px',letterSpacing:'.1em'}}>{x.l}</div>
                        <div style={{fontSize:'22px',fontWeight:'800',color:x.c,fontFamily:'monospace',lineHeight:1}}>{x.v}</div>
                        <div style={{fontSize:'11px',color:T.sub,marginTop:'2px'}}>{x.u}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {speedRes&&<div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:speedRes.rating==='Excellent'?T.green+'22':speedRes.rating==='Good'?T.blue+'22':T.yellow+'22',border:`1px solid ${speedRes.rating==='Excellent'?T.green:speedRes.rating==='Good'?T.blue:T.yellow}`,borderRadius:'20px',padding:'6px 16px',marginBottom:'16px'}}>
                <span style={{fontSize:'16px'}}>{speedRes.rating==='Excellent'?'🚀':speedRes.rating==='Good'?'✅':'⚠️'}</span>
                <span style={{fontWeight:'700',fontSize:'13px',color:speedRes.rating==='Excellent'?T.green:speedRes.rating==='Good'?T.blue:T.yellow}}>{speedRes.rating}</span>
              </div>}
              <button style={{...s.btn(speedState==='idle'||speedState==='done'?T.cyan:'#424242','#fff'),padding:'12px 32px',borderRadius:'24px',fontSize:'14px',fontWeight:'700',justifyContent:'center',letterSpacing:'.05em',opacity:speedState!=='idle'&&speedState!=='done'?.6:1}} onClick={()=>{if(speedState==='idle'||speedState==='done')runSpeed();}} disabled={speedState!=='idle'&&speedState!=='done'}>
                {speedState==='idle'?'⚡ START TEST':speedState==='done'?'↺ RUN AGAIN':'⏳ Testing...'}
              </button>
            </div>
            {speedLog.length>0&&(
              <div style={{background:T.card,borderRadius:'6px',padding:'14px'}}>
                <div style={{fontSize:'11px',color:T.sub,fontWeight:'700',letterSpacing:'.08em',marginBottom:'8px'}}>TEST LOG</div>
                <div style={{background:dark?'#0a0a0a':'#f0f0f0',borderRadius:'4px',padding:'10px',fontFamily:'monospace',fontSize:'11px',maxHeight:'160px',overflowY:'auto'}}>
                  {speedLog.map((l,i)=><div key={i} style={{color:dark?'#4caf50':'#2e7d32',marginBottom:'3px'}}><span style={{color:T.sub}}>[{l.t}]</span> {l.m}</div>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════ SETTINGS ═════ */}
        {tab==='se'&&(
          <div style={s.p}>
            {/* Appearance */}
            <div style={{background:T.card,borderRadius:'6px',marginBottom:'8px'}}>
              <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.border}`,fontSize:'11px',fontWeight:'700',color:T.sub,letterSpacing:'.08em'}}>APPEARANCE</div>
              <div style={s.sRow}>
                <div><div style={s.sLabel}>Theme</div><div style={s.sSub}>Dark · Light · System</div></div>
                <select style={{...s.input,width:'100px'}} value={theme} onChange={e=>setTheme(e.target.value)}>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div style={s.sRow}>
                <div><div style={s.sLabel}>Access Point View</div><div style={s.sSub}>{compact?'Compact':'Complete'}</div></div>
                <button style={s.tog(compact)} onClick={()=>setCompact(v=>!v)}><div style={s.dot(compact)}/></button>
              </div>
              <div style={s.sRow}>
                <div><div style={s.sLabel}>Show Graph Legend</div><div style={s.sSub}>Display SSID legend on graphs</div></div>
                <button style={s.tog(showLegend)} onClick={()=>setShowLegend(v=>!v)}><div style={s.dot(showLegend)}/></button>
              </div>
            </div>
            {/* Scanning */}
            <div style={{background:T.card,borderRadius:'6px',marginBottom:'8px'}}>
              <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.border}`,fontSize:'11px',fontWeight:'700',color:T.sub,letterSpacing:'.08em'}}>SCANNING</div>
              <div style={s.sRow}>
                <div><div style={s.sLabel}>Scan Speed</div><div style={s.sSub}>Every {scanSpeed}s</div></div>
                <select style={{...s.input,width:'80px'}} value={scanSpeed} onChange={e=>setScanSpeed(Number(e.target.value))}>
                  {[3,5,10,15,30,60].map(v=><option key={v} value={v}>{v}s</option>)}
                </select>
              </div>
              <div style={s.sRow}>
                <div><div style={s.sLabel}>Sort Access Points By</div></div>
                <select style={{...s.input,width:'130px'}} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                  <option value="signal">Signal Strength</option>
                  <option value="ssid">SSID</option>
                  <option value="channel">Channel</option>
                </select>
              </div>
              <div style={s.sRow}>
                <div><div style={s.sLabel}>Group Access Points By SSID</div></div>
                <button style={s.tog(groupBySSID)} onClick={()=>setGroupBySSID(v=>!v)}><div style={s.dot(groupBySSID)}/></button>
              </div>
            </div>
            {/* Graph */}
            <div style={{background:T.card,borderRadius:'6px',marginBottom:'8px'}}>
              <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.border}`,fontSize:'11px',fontWeight:'700',color:T.sub,letterSpacing:'.08em'}}>GRAPH SETTINGS</div>
              <div style={s.sRow}>
                <div><div style={s.sLabel}>Maximum Y-axis Value</div><div style={s.sSub}>Graph maximum signal: {maxDb} dBm</div></div>
                <select style={{...s.input,width:'90px'}} value={maxDb} onChange={e=>setMaxDb(Number(e.target.value))}>
                  {[-20,-30,-40,-50].map(v=><option key={v} value={v}>{v} dBm</option>)}
                </select>
              </div>
            </div>
            {/* Localization */}
            <div style={{background:T.card,borderRadius:'6px',marginBottom:'8px'}}>
              <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.border}`,fontSize:'11px',fontWeight:'700',color:T.sub,letterSpacing:'.08em'}}>LOCALIZATION</div>
              <div style={s.sRow}>
                <div><div style={s.sLabel}>Country Code</div><div style={s.sSub}>Affects available channels</div></div>
                <select style={{...s.input,width:'80px'}} value={country} onChange={e=>setCountry(e.target.value)}>
                  {['US','EU','JO','UK','CA','AU','IN'].map(v=><option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
            {/* System info */}
            <div style={{background:T.card,borderRadius:'6px',padding:'14px',marginBottom:'8px'}}>
              <div style={{fontSize:'11px',fontWeight:'700',color:T.sub,letterSpacing:'.08em',marginBottom:'10px'}}>SYSTEM</div>
              {[{l:'CAF-WIFI Version',v:'3.0.0 Enterprise'},{l:'Scan Engine',v:scanMethod||'Auto-detect'},{l:'Interface',v:scanIface||'Auto'},{l:'Networks Found',v:aps.length},{l:'Scan Count',v:scanN},{l:'Country',v:country}].map((r,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontSize:'12px',color:T.sub}}>{r.l}</span>
                  <span style={{fontSize:'12px',fontWeight:'600',color:T.text}}>{r.v}</span>
                </div>
              ))}
              <div style={{display:'flex',gap:'8px',marginTop:'12px',flexWrap:'wrap'}}>
                <button style={{...s.btn(T.cyan),flex:1,justifyContent:'center'}} onClick={()=>doScan(false)}>↺ Re-Scan</button>
                <button style={{...s.btn(T.card2,T.red),border:`1px solid ${T.red}44`,flex:1,justifyContent:'center'}} onClick={()=>{setSortBy('signal');setScanSpeed(10);setMaxDb(-20);setCompact(false);setShowLegend(true);setTheme('dark');toast('Settings reset','info');}}>↺ Reset</button>
              </div>
            </div>
          </div>
        )}

        {/* ═════ ABOUT ═════ */}
        {tab==='ab'&&(
          <div style={{...s.p,textAlign:'center'}}>
            <div style={{width:'64px',height:'64px',background:'linear-gradient(135deg,#00838f,#00bcd4)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',margin:'0 auto 16px'}}>📡</div>
            <div style={{fontSize:'22px',fontWeight:'700',marginBottom:'4px',color:T.text}}>CAF-WIFI</div>
            <div style={{fontSize:'13px',color:T.cyan,marginBottom:'4px'}}>Enterprise WiFi Analyzer v3.0.0</div>
            <div style={{fontSize:'12px',color:T.sub,marginBottom:'24px'}}>Professional Network Infrastructure Analysis</div>
            <div style={{textAlign:'left'}}>
              {[
                {i:'📡',t:'Identify Nearby Access Points',d:'Detects all nearby WiFi networks with SSID, MAC, signal (dBm), channel, frequency range, bandwidth, vendor (OUI), estimated distance, WiFi standard, and security capabilities.'},
                {i:'📊',t:'Graph Channels Signal Strength',d:'Channel spectrum graph with accurate trapezoid shapes per AP. Width = channel bandwidth (20/40/80/160/320 MHz). SSID labels shown above each peak. HT/VHT detection included.'},
                {i:'📈',t:'Graph AP Signal Strength Over Time',d:'Time graph with smooth bezier curves tracking signal strength per AP over multiple scans. SSID labels at end of each line. Useful for finding dead spots and interference.'},
                {i:'⭐',t:'Analyze and Rate Channels',d:'Rates each channel 1–10 based on congestion and signal strength. Best channels highlighted. Recommendation based on your current 2.4/5/6 GHz environment.'},
                {i:'🔍',t:'Filter Networks',d:'Filter by WiFi band (2.4/5/6 GHz), signal strength (5 levels), security type (None/WPS/WEP/WPA/WPA2/WPA3), and SSID text. Combine multiple filters.'},
                {i:'📏',t:'Estimated Distance',d:'Free-space path loss formula: distance = 10^((27.55 - 20×log₁₀(freq) + |RSSI|) / 20). Estimation only — walls and obstacles reduce accuracy.'},
                {i:'🏷️',t:'Vendor / OUI Database Lookup',d:'Identifies AP manufacturer from the first 3 bytes (OUI) of the MAC address using the IEEE OUI database. Search any MAC or vendor name.'},
                {i:'⚡',t:'Speed Test',d:'Measures download speed, upload speed, ping (latency), and jitter. Includes live log and animated speedometer.'},
                {i:'📤',t:'Export Access Point Details',d:'Export full scan reports to CSV format matching WiFiAnalyzer export format: SSID|BSSID|Strength|Channel|Frequency|Width|Distance|Security. PDF export also available.'},
                {i:'🌓',t:'Dark / Light / System Theme',d:'Three theme options: Dark, Light, and System (follows device preference). Toggle from the top bar or Settings.'},
                {i:'⏸',t:'Pause / Resume Scanning',d:'Pause live scanning at any time using the pause button in the top bar. Resumes from current data.'},
                {i:'📻',t:'Available Channels',d:'Visual channel availability map for 2.4, 5, and 6 GHz bands. Green = available, Red = in use, Blue = recommended (non-overlapping) for 2.4 GHz.'},
              ].map((x,i)=>(
                <div key={i} style={{background:T.card,borderRadius:'6px',padding:'12px',marginBottom:'8px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'5px'}}><span style={{fontSize:'18px'}}>{x.i}</span><span style={{fontWeight:'700',fontSize:'13px',color:T.text}}>{x.t}</span></div>
                  <div style={{fontSize:'12px',color:T.sub,lineHeight:'1.6'}}>{x.d}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:'11px',color:T.sub,marginTop:'16px',lineHeight:'1.7'}}>
              © 2024 CAF-WIFI Operations<br/>
              Administrator: hanybkhite@gmail.com<br/>
              GDIT-CAF-NETPULSE-v3-PROD
            </div>
          </div>
        )}
      </div>

      {/* AGENT CONNECTION MODAL */}
      {showAgentModal&&(
        <div style={s.overlay} onClick={e=>{if(e.target===e.currentTarget)setShowAgentModal(false);}}>
          <div style={s.sheet}>
            <div style={{fontWeight:'700',fontSize:'16px',color:T.text,marginBottom:'6px'}}>🔗 Connect Local Agent</div>
            <div style={{fontSize:'12px',color:T.sub,marginBottom:'14px',lineHeight:'1.6'}}>
              Run the <strong style={{color:T.cyan}}>CAF-WIFI Agent</strong> on your laptop/PC. Your phone connects to it for real WiFi scanning.
              <div style={{marginTop:'6px',padding:'8px',background:T.card2,borderRadius:'6px',fontSize:'11px',lineHeight:'1.8'}}>
                📱 <strong style={{color:T.text}}>On your Android phone:</strong> make sure it's on the <strong style={{color:T.cyan}}>same WiFi network</strong> as your laptop, then enter the URL below.
              </div>
            </div>
            {/* Download buttons */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'14px'}}>
              {[
                {label:'🪟 Windows',sub:'.bat + .js',href:'/caf-wifi-agent.bat',hint:'Download both files to same folder'},
                {label:'🐧 Linux',sub:'.sh + .js',href:'/caf-wifi-agent.sh',hint:'Run: bash caf-wifi-agent.sh'},
                {label:'🍎 macOS',sub:'.sh + .js',href:'/caf-wifi-agent.sh',hint:'Run: bash caf-wifi-agent.sh'},
              ].map((d,i)=>(
                <div key={i} style={{background:T.card2,borderRadius:'6px',padding:'10px',textAlign:'center'}}>
                  <div style={{fontWeight:'700',fontSize:'12px',color:T.text,marginBottom:'2px'}}>{d.label}</div>
                  <div style={{fontSize:'10px',color:T.sub,marginBottom:'8px'}}>{d.hint}</div>
                  <a href={d.href} download style={{background:T.cyan,color:'#fff',padding:'5px 10px',borderRadius:'4px',fontSize:'11px',fontWeight:'700',textDecoration:'none',display:'inline-block'}}>
                    ⬇ Download
                  </a>
                </div>
              ))}
            </div>
            {/* Also download agent.js */}
            <div style={{display:'flex',justifyContent:'center',marginBottom:'14px'}}>
              <a href="/caf-wifi-agent.js" download style={{background:'transparent',border:`1px solid ${T.border}`,color:T.sub,padding:'5px 14px',borderRadius:'4px',fontSize:'11px',textDecoration:'none'}}>
                ⬇ Download caf-wifi-agent.js (required for all platforms)
              </a>
            </div>
            <div style={{background:T.card2,borderRadius:'6px',padding:'10px',marginBottom:'14px',fontSize:'11px',color:T.sub,lineHeight:'1.7'}}>
              <strong style={{color:T.text}}>How to use:</strong><br/>
              1. Download both files to the same folder<br/>
              2. Run the launcher for your OS<br/>
              3. The agent will show your laptop IP<br/>
              4. Make sure phone is on same WiFi<br/>
              5. Enter <span style={{color:T.cyan,fontFamily:'monospace'}}>http://YOUR-IP:7788/api/scan</span> below
            </div>
            <div style={{marginBottom:'12px'}}>
              <label style={{fontSize:'11px',color:T.sub,display:'block',marginBottom:'4px'}}>AGENT URL</label>
              <input style={s.input} placeholder="http://192.168.1.100:3000/api/scan"
                value={agentUrl} onChange={e=>setAgentUrl(e.target.value)}/>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button style={{...s.btn(T.cyan),flex:1,justifyContent:'center'}} onClick={()=>{
                if(!agentUrl.trim()){toast('Enter agent URL','error');return;}
                localStorage.setItem('caf_agent_url',agentUrl.trim());
                setShowAgentModal(false);
                doScan(false);
                toast('✅ Agent URL saved — scanning...','success');
              }}>Connect & Scan</button>
              <button style={{...s.btn(T.card2,T.text),border:`1px solid ${T.border}`,flex:1,justifyContent:'center'}} onClick={()=>{
                localStorage.removeItem('caf_agent_url');
                setScanMode('demo');setAps([]);setScanMode('idle');
                setShowAgentModal(false);
                toast('Demo mode restored','info');
              }}>Use Demo Mode</button>
            </div>
            <button style={{width:'100%',background:'transparent',border:'none',color:T.sub,cursor:'pointer',padding:'10px',fontSize:'12px',marginTop:'4px'}} onClick={()=>setShowAgentModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ANDROID APK MODAL */}
      {showAndroidModal&&(
        <div style={s.overlay} onClick={e=>{if(e.target===e.currentTarget)setShowAndroidModal(false);}}>
          <div style={s.sheet}>
            <div style={{fontWeight:'700',fontSize:'16px',color:T.text,marginBottom:'4px'}}>🤖 Android APK Setup</div>
            <div style={{fontSize:'12px',color:T.sub,marginBottom:'16px'}}>Build CAF-WIFI as a native Android app — scans WiFi directly, no laptop needed</div>
            {[
              {step:'1',title:'Requirements',desc:'Node.js + Android Studio + Java 17',color:T.cyan},
              {step:'2',title:'Install Capacitor',code:'npm install @capacitor/core @capacitor/cli @capacitor/android',color:T.blue},
              {step:'3',title:'Init & Add Android',code:'npx cap add android',color:T.blue},
              {step:'4',title:'Build & Sync',code:'npm run android:sync',color:T.blue},
              {step:'5',title:'Open Android Studio',code:'npm run android:open  →  Build → Build APK(s)',color:T.green},
              {step:'6',title:'Install on phone',desc:'Copy app-debug.apk to phone → tap to install → grant WiFi permissions',color:T.green},
            ].map((s2,i)=>(
              <div key={i} style={{display:'flex',gap:'10px',marginBottom:'12px',alignItems:'flex-start'}}>
                <div style={{width:'24px',height:'24px',borderRadius:'50%',background:s2.color+'33',border:`1px solid ${s2.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700',color:s2.color,flexShrink:0}}>{s2.step}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'3px'}}>{s2.title}</div>
                  {s2.desc&&<div style={{fontSize:'12px',color:T.sub}}>{s2.desc}</div>}
                  {s2.code&&<div style={{background:dark?'#0a0a0a':'#f0f0f0',borderRadius:'4px',padding:'8px',fontFamily:'monospace',fontSize:'11px',color:T.green,marginTop:'4px',lineHeight:'1.8',whiteSpace:'pre'}}>{s2.code}</div>}
                </div>
              </div>
            ))}
            <div style={{background:dark?'#0d2137':'#e3f2fd',borderRadius:'6px',padding:'10px',fontSize:'11px',color:T.sub,marginBottom:'14px',lineHeight:'1.6'}}>
              💡 The APK uses Android's WifiManager API — scans all nearby networks with full signal, channel, and security info. No internet required.
            </div>
            <button style={{...s.btn(T.cyan),width:'100%',justifyContent:'center'}} onClick={()=>setShowAndroidModal(false)}>Got it!</button>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={s.bnav}>
        {BNAV.map(n=>(
          <button key={n.id} style={s.nbtn(tab===n.id)} onClick={()=>setTab(n.id)}>
            <span style={{fontSize:'19px',lineHeight:1}}>{n.i}</span>
            <span>{n.l}</span>
          </button>
        ))}
      </div>

      {/* FILTER SHEET */}
      {showFilter&&(
        <div style={s.overlay} onClick={e=>{if(e.target===e.currentTarget)setShowFilter(false);}}>
          <div style={s.sheet}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px',paddingBottom:'14px',borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:'20px'}}>⚙️</span><span style={{fontSize:'17px',fontWeight:'700',color:T.text}}>Filter Networks</span>
            </div>
            <div style={{marginBottom:'20px'}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'8px'}}>SSID <span style={{color:T.sub,fontWeight:'400'}}>(partial match)</span></div>
              <input style={{...s.input,borderRadius:0,borderTop:'none',borderLeft:'none',borderRight:'none',borderBottom:`2px solid ${T.cyan}`,background:'transparent'}} placeholder="Network name..." value={fSSID} onChange={e=>setFSSID(e.target.value)}/>
            </div>
            <div style={{marginBottom:'20px',paddingBottom:'20px',borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'10px'}}>WiFi Band</div>
              <div style={{display:'flex',gap:'8px'}}>{['2.4','5','6'].map(b=><button key={b} onClick={()=>setFBands(p=>p.includes(b)?p.filter(x=>x!==b):[...p,b])} style={s.chip(fBands.includes(b))}>{b} GHz</button>)}</div>
            </div>
            <div style={{marginBottom:'20px',paddingBottom:'20px',borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'12px'}}>Signal Strength</div>
              <div style={{display:'flex',gap:'8px',justifyContent:'center'}}>
                {[0,1,2,3,4].map(lv=>{
                  const cols=['#f44336','#ff9800','#ffc107','#8bc34a','#4caf50'];
                  const col=cols[lv],sz=42,cx=sz/2,cy=sz*.82,R=[sz*.11,sz*.24,sz*.38,sz*.52];
                  const a1=-148*Math.PI/180,a2=-32*Math.PI/180;
                  const P=(r,a)=>({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});
                  const arc=(ri,ro)=>{const p1=P(ri,a1),p2=P(ro,a1),p3=P(ro,a2),p4=P(ri,a2);return`M${p1.x},${p1.y} L${p2.x},${p2.y} A${ro},${ro} 0 0,1 ${p3.x},${p3.y} L${p4.x},${p4.y} A${ri},${ri} 0 0,0 ${p1.x},${p1.y} Z`;};
                  return(
                    <button key={lv} onClick={()=>setFSig(fSig===lv?null:lv)} style={{background:fSig===lv?col+'22':'transparent',border:`2px solid ${fSig===lv?col:'transparent'}`,borderRadius:'8px',cursor:'pointer',padding:'5px',opacity:fSig===null||fSig===lv?1:.4}}>
                      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}><circle cx={cx} cy={cy} r={sz*.055} fill={col}/>{R.map((ri,i)=>i<3&&<path key={i} d={arc(ri+1,R[i+1]-1)} fill={lv>i?col:'#333'} opacity=".92"/>)}</svg>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{marginBottom:'24px'}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'10px'}}>Security</div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>{['None','WPS','WEP','WPA','WPA2','WPA3'].map(sec=><button key={sec} onClick={()=>setFSec(p=>p.includes(sec)?p.filter(x=>x!==sec):[...p,sec])} style={s.chip(fSec.includes(sec))}>{sec}</button>)}</div>
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
