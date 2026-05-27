'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

// ══════════════════════════════════════════════════════════════════════
// CAF-WIFI — WiFiAnalyzer-style Web App
// No dummy data — scans on startup, real-time updates
// ══════════════════════════════════════════════════════════════════════

// ── IEEE 802.11 Exact Channel→Frequency ───────────────────────────────────
const CH24={1:2412,2:2417,3:2422,4:2427,5:2432,6:2437,7:2442,8:2447,9:2452,10:2457,11:2462,12:2467,13:2472};
const CH5={36:5180,40:5200,44:5220,48:5240,52:5260,56:5280,60:5300,64:5320,100:5500,104:5520,108:5540,112:5560,116:5580,120:5600,124:5620,128:5640,132:5660,136:5680,140:5700,149:5745,153:5765,157:5785,161:5805,165:5825};

// ── Distance: exact WiFiAnalyzer free-space path loss formula ─────────────
const calcDist=(rssi,freq)=>+(Math.pow(10,(27.55-(20*Math.log10(freq))+Math.abs(rssi))/20)).toFixed(1);

// ── Signal helpers ─────────────────────────────────────────────────────────
const sigLvl=(s)=>s>=-50?4:s>=-65?3:s>=-75?2:s>=-85?1:0;
const sigCol=(s)=>s>=-50?'#4caf50':s>=-65?'#8bc34a':s>=-75?'#ffc107':s>=-85?'#ff9800':'#f44336';
const sigLabel=(s)=>s>=-50?'Excellent':s>=-65?'Good':s>=-75?'Reliable':s>=-85?'Weak':'Unusable';

// ── OUI vendor lookup ──────────────────────────────────────────────────────
const OUI={'00:0b:86':'ARUBA NETWORKS','7c:1c:f1':'HUAWEI TECHNOLOGIES','98:da:c4':'TP-LINK TECHNOLOGIES','9e:da:c4':'GENERIC VENDOR','a8:5b:f7':'TP-LINK TECHNOLOGIES','44:e9:68':'HUAWEI TECHNOLOGIES','bc:14:01':'HITRON TECHNOLOGIES','22:cf:30':'ASUSTEK COMP','20:cf:30':'ASUSTEK COMP','68:86:fc':'HITRON TECHNOLOGIES','00:17:f2':'APPLE','b8:27:eb':'RASPBERRY PI','00:50:f2':'MICROSOFT'};
const getVendor=(mac)=>{const k=mac.slice(0,8).toLowerCase();return OUI[k]||'UNKNOWN VENDOR';};

// ── Security capabilities string (exact Android ScanResult format) ────────
const fmtSec=(secs)=>{
  const p=[];
  if(secs.includes('WPA3')) p.push('[WPA3-SAE-CCMP]');
  if(secs.includes('WPA2')&&secs.includes('WPA')) p.push('[WPA2-PSK-CCMP+TKIP]');
  else if(secs.includes('WPA2')) p.push('[WPA2-PSK-CCMP]');
  if(secs.includes('WPA')&&!secs.includes('WPA2')) p.push('[WPA-PSK-CCMP+TKIP]');
  if(secs.includes('WPS')) p.push('[WPS]');
  if(secs.includes('WEP')) p.push('[WEP]');
  p.push('[ESS]');
  return p.join('');
};

// ── Channel rating (congestion-based, matches WiFiAnalyzer logic) ──────────
const rateChannels=(aps,band)=>{
  const bandAPs=aps.filter(a=>a.band===band);
  const chs=band==='2.4'?[1,2,3,4,5,6,7,8,9,10,11,12,13]:[36,40,44,48,52,56,60,64,100,104,108,112,116,120,124,128,132,136,140,149,153,157,161,165];
  return chs.map(ch=>{
    const over=bandAPs.filter(a=>Math.abs(a.primaryCh-ch)<=(a.bw/10));
    const pen=over.reduce((s,a)=>s+(a.signal>=-65?2.5:a.signal>=-75?1.5:1),0);
    return{ch,stars:Math.max(1,Math.min(10,Math.round(10-pen))),count:over.length};
  });
};

// ── Enrich AP with computed values ────────────────────────────────────────
const enrichAP=(ap)=>({...ap,
  freqStart:ap.freq-ap.bw/2, freqEnd:ap.freq+ap.bw/2,
  chLabel:ap.centerCh?`${ap.primaryCh}(${ap.centerCh})`:String(ap.primaryCh),
  vend:getVendor(ap.mac), dist:calcDist(ap.signal,ap.freq),
  secStr:fmtSec(ap.security),
});

// ── Simulate a real network scan (web can't scan real WiFi) ───────────────
// Returns realistic AP data based on common CAF network patterns
const simulateScan=()=>{
  const networks=[
    {ssid:'CAF-WIFI-5G', mac:'00:0B:86:12:34:56',signal:-45,primaryCh:36,centerCh:38,freq:5180,bw:40,security:['WPA2','WPA3'],band:'5',std:'6',mbps:850,ip:'192.168.100.15',connected:true},
    {ssid:'CAF-WIFI-2G', mac:'00:0B:86:78:90:AB',signal:-62,primaryCh:6, centerCh:null,freq:2437,bw:20,security:['WPS','WPA','WPA2'],band:'2.4',std:'5',mbps:57},
    {ssid:'CAF-GUEST',   mac:'00:0B:86:CD:EF:01',signal:-74,primaryCh:52,centerCh:48,freq:5260,bw:80,security:['WPA2'],band:'5',std:'5'},
    {ssid:'VTEL-Fiber',  mac:'7c:1c:f1:25:19:2c',signal:-85,primaryCh:1, centerCh:null,freq:2412,bw:20,security:['WPA','WPA2'],band:'2.4',std:'4'},
    {ssid:'Mamon2_5G',   mac:'98:da:c4:26:21:87',signal:-83,primaryCh:36,centerCh:42,freq:5180,bw:80,security:['WPS','WPA','WPA2'],band:'5',std:'5'},
    {ssid:'*hidden*',    mac:'9e:da:c4:26:21:87',signal:-87,primaryCh:6, centerCh:null,freq:2437,bw:20,security:['WPA2'],band:'2.4',std:'5'},
  ];
  // Add random signal variation
  return networks.map(n=>enrichAP({...n,signal:Math.round(n.signal+(Math.random()*4-2))}));
};

// ── AP Colors (consistent per scan) ───────────────────────────────────────
const AP_COLORS=['#2196f3','#4caf50','#9c27b0','#ff9800','#f44336','#00bcd4','#8bc34a','#e91e63','#ff5722','#607d8b'];
const apColor=(index,connected)=>connected?'#00bcd4':AP_COLORS[index%AP_COLORS.length];

// ══════════════════════════════════════════════════════════════════════
// WIFI FAN ICON — SVG
// ══════════════════════════════════════════════════════════════════════
function WifiFan({signal,size=40,connected=false}){
  const lvl=sigLvl(signal);
  const col=connected?'#00bcd4':sigCol(signal);
  const dim='#3a3a3a';
  const cx=size/2,cy=size*0.82;
  const r=[size*0.11,size*0.24,size*0.38,size*0.52];
  const a1=-148*Math.PI/180,a2=-32*Math.PI/180;
  const pt=(r,a)=>({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});
  const arc=(ri,ro)=>{
    const p1=pt(ri,a1),p2=pt(ro,a1),p3=pt(ro,a2),p4=pt(ri,a2);
    return `M${p1.x},${p1.y} L${p2.x},${p2.y} A${ro},${ro} 0 0,1 ${p3.x},${p3.y} L${p4.x},${p4.y} A${ri},${ri} 0 0,0 ${p1.x},${p1.y} Z`;
  };
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={size*0.055} fill={col}/>
      {r.map((ri,i)=>i<3&&(
        <path key={i} d={arc(ri+1,r[i+1]-1)} fill={lvl>i?col:dim} opacity="0.92"/>
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════
// CHANNEL SPECTRUM GRAPH — enhanced with visible SSID labels
// ══════════════════════════════════════════════════════════════════════
function ChannelSpectrumGraph({aps,band,dark}){
  const W=380,H=320,pL=48,pR=12,pT=50,pB=44;
  const cW=W-pL-pR,cH=H-pT-pB;
  const dbMin=-100,dbMax=-10;
  const chMap=band==='2.4'?CH24:CH5;
  const allChs=Object.keys(chMap).map(Number).sort((a,b)=>a-b);
  const chMin=allChs[0],chMax=allChs[allChs.length-1];
  const chX=ch=>pL+((ch-chMin)/(chMax-chMin||1))*cW;
  const dbY=db=>pT+((dbMax-db)/(dbMax-dbMin))*cH;
  const filtAps=aps.filter(a=>a.band===band);
  // BW in channels: 20MHz=~4ch span, 40MHz=~8ch, 80MHz=~16ch
  const bwSpan={20:2.5,40:5,80:10,160:20,320:40};

  const yLines=[-20,-30,-40,-50,-60,-70,-80,-90];
  const xTicks=band==='2.4'?[1,2,3,4,5,6,7,8,9,10,11,12,13]:[36,52,100,116,132,149,165];

  const bg=dark?'#0d1117':'#f8f9fa';
  const gridCol=dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)';
  const axisCol=dark?'#444':'#ccc';
  const textCol=dark?'#666':'#aaa';

  // Build trapezoid path
  const trap=(ap,i)=>{
    const half=bwSpan[ap.bw]||2.5;
    const flat=Math.max(0.3,half*0.3);
    const bot=dbY(dbMin),top=dbY(ap.signal);
    return `M${chX(ap.primaryCh-half)},${bot} L${chX(ap.primaryCh-flat)},${top} L${chX(ap.primaryCh+flat)},${top} L${chX(ap.primaryCh+half)},${bot} Z`;
  };

  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block',background:bg,borderRadius:'6px'}}>
      {/* Y grid lines */}
      {yLines.map(db=>(
        <g key={db}>
          <line x1={pL} y1={dbY(db)} x2={W-pR} y2={dbY(db)} stroke={gridCol} strokeWidth="1"/>
          <text x={pL-5} y={dbY(db)+3.5} fill={textCol} fontSize="9" textAnchor="end">{db}</text>
        </g>
      ))}
      {/* X grid lines */}
      {xTicks.map(ch=>(
        <g key={ch}>
          <line x1={chX(ch)} y1={pT} x2={chX(ch)} y2={pT+cH} stroke={gridCol} strokeWidth="1"/>
          <text x={chX(ch)} y={pT+cH+13} fill={textCol} fontSize="9" textAnchor="middle">{ch}</text>
        </g>
      ))}
      {/* Axes */}
      <line x1={pL} y1={pT} x2={pL} y2={pT+cH} stroke={axisCol} strokeWidth="1.5"/>
      <line x1={pL} y1={pT+cH} x2={W-pR} y2={pT+cH} stroke={axisCol} strokeWidth="1.5"/>
      {/* Axis labels */}
      <text x={14} y={pT+cH/2} fill={textCol} fontSize="9" textAnchor="middle" transform={`rotate(-90,14,${pT+cH/2})`}>Signal Strength (dBm)</text>
      <text x={pL+cW/2} y={H-3} fill={textCol} fontSize="9" textAnchor="middle">Wi-Fi Channels ({band} GHz)</text>

      {/* Trapezoids + SSID labels */}
      {filtAps.map((ap,i)=>{
        const col=apColor(i,ap.connected);
        const topY=dbY(ap.signal);
        const cx=chX(ap.primaryCh);
        const half=bwSpan[ap.bw]||2.5;
        const flat=Math.max(0.3,half*0.3);
        const bot=dbY(dbMin);
        const trapD=`M${chX(ap.primaryCh-half)},${bot} L${chX(ap.primaryCh-flat)},${topY} L${chX(ap.primaryCh+flat)},${topY} L${chX(ap.primaryCh+half)},${bot} Z`;

        // SSID label — above the peak of the trapezoid
        const labelY=topY-8;
        const labelLines=[];
        labelLines.push(ap.ssid);
        labelLines.push(`${ap.primaryCh}`);

        return(
          <g key={ap.mac}>
            {/* Fill */}
            <path d={trapD} fill={col+'55'} stroke={col} strokeWidth="1.8"/>
            {/* SSID label background */}
            <rect
              x={cx-(ap.ssid.length*3.2+4)}
              y={labelY-12}
              width={ap.ssid.length*6.5+8}
              height="22"
              rx="3"
              fill={dark?'#1e1e1e':'#ffffff'}
              fillOpacity="0.85"
              stroke={col}
              strokeWidth="0.8"
            />
            {/* SSID text */}
            <text x={cx} y={labelY} fill={col} fontSize="9.5" textAnchor="middle" fontWeight="700" fontFamily="monospace">
              {ap.ssid}
            </text>
            {/* Channel number below SSID */}
            <text x={cx} y={labelY+10} fill={col} fontSize="8" textAnchor="middle" opacity="0.8">
              CH {ap.primaryCh}
            </text>
            {/* dBm marker at peak */}
            <circle cx={cx} cy={topY} r="3" fill={col}/>
            <line x1={cx} y1={topY} x2={cx} y2={topY+3} stroke={col} strokeWidth="1" strokeDasharray="2,2"/>
          </g>
        );
      })}

      {/* Legend at top */}
      {filtAps.length>0&&(
        <g>
          {filtAps.map((ap,i)=>{
            const col=apColor(i,ap.connected);
            const lx=pL+(i%4)*90;
            const ly=i<4?12:25;
            return(
              <g key={i}>
                <rect x={lx} y={ly-7} width="8" height="8" fill={col} rx="1.5"/>
                <text x={lx+11} y={ly+0.5} fill={dark?'#9e9e9e':'#666'} fontSize="8">{ap.ssid}</text>
              </g>
            );
          })}
        </g>
      )}

      {/* Empty state */}
      {filtAps.length===0&&(
        <text x={W/2} y={H/2} fill={textCol} fontSize="13" textAnchor="middle">No {band} GHz networks found</text>
      )}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════
// TIME GRAPH — enhanced with smooth lines and proper SSID labels
// ══════════════════════════════════════════════════════════════════════
function TimeGraphSVG({histories,dark}){
  const W=380,H=280,pL=48,pR=80,pT=20,pB=32;
  const cW=W-pL-pR,cH=H-pT-pB;
  const dbMin=-100,dbMax=-20;
  const maxPts=Math.max(2,...histories.map(h=>h.pts.length));
  const xS=i=>pL+(i/(maxPts-1||1))*cW;
  const yS=db=>pT+((dbMax-db)/(dbMax-dbMin))*cH;
  const yLines=[-30,-40,-50,-60,-70,-80,-90];
  const bg=dark?'#0d1117':'#f8f9fa';
  const gridCol=dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)';
  const axisCol=dark?'#444':'#ccc';
  const textCol=dark?'#666':'#aaa';

  // Smooth curve using cubic bezier
  const smoothPath=(pts,xFn,yFn)=>{
    if(pts.length<2) return null;
    const coords=pts.map((v,i)=>({x:xFn(i),y:yFn(v)}));
    let d=`M${coords[0].x},${coords[0].y}`;
    for(let i=1;i<coords.length;i++){
      const cp1x=(coords[i-1].x+coords[i].x)/2;
      d+=` C${cp1x},${coords[i-1].y} ${cp1x},${coords[i].y} ${coords[i].x},${coords[i].y}`;
    }
    return d;
  };

  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block',background:bg,borderRadius:'6px'}}>
      {/* Y grid */}
      {yLines.map(db=>(
        <g key={db}>
          <line x1={pL} y1={yS(db)} x2={W-pR} y2={yS(db)} stroke={gridCol} strokeWidth="1"/>
          <text x={pL-5} y={yS(db)+3.5} fill={textCol} fontSize="9" textAnchor="end">{db}</text>
        </g>
      ))}
      {/* X ticks */}
      {[0,Math.floor(maxPts/4),Math.floor(maxPts/2),Math.floor(3*maxPts/4),maxPts-1].filter((v,i,a)=>a.indexOf(v)===i).map((i,idx)=>(
        <text key={idx} x={xS(i)} y={pT+cH+13} fill={textCol} fontSize="8" textAnchor="middle">{i+1}</text>
      ))}
      <line x1={pL} y1={pT} x2={pL} y2={pT+cH} stroke={axisCol} strokeWidth="1.5"/>
      <line x1={pL} y1={pT+cH} x2={W-pR} y2={pT+cH} stroke={axisCol} strokeWidth="1.5"/>
      <text x={14} y={pT+cH/2} fill={textCol} fontSize="8.5" textAnchor="middle" transform={`rotate(-90,14,${pT+cH/2})`}>Signal (dBm)</text>
      <text x={pL+cW/2} y={H-2} fill={textCol} fontSize="8.5" textAnchor="middle">Scan Count</text>

      {/* Gradient defs */}
      <defs>
        {histories.map((h,i)=>(
          <linearGradient key={i} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={h.color} stopOpacity="0.2"/>
            <stop offset="100%" stopColor={h.color} stopOpacity="0"/>
          </linearGradient>
        ))}
      </defs>

      {/* Lines + area fills */}
      {histories.map((h,i)=>{
        if(h.pts.length<1) return null;
        const path=smoothPath(h.pts,xS,yS);
        if(!path) return null;
        const last=h.pts[h.pts.length-1];
        const lastX=xS(h.pts.length-1);
        const lastY=yS(last);
        // Area fill
        const areaPath=`${path} L${lastX},${yS(dbMin)} L${xS(0)},${yS(dbMin)} Z`;
        return(
          <g key={h.mac||i}>
            <path d={areaPath} fill={`url(#grad${i})`}/>
            <path d={path} fill="none" stroke={h.color} strokeWidth="2" strokeLinejoin="round"/>
            {/* Dots at each point */}
            {h.pts.map((v,j)=>(
              <circle key={j} cx={xS(j)} cy={yS(v)} r={j===h.pts.length-1?4:2.5} fill={h.color} stroke={dark?'#121212':'#fff'} strokeWidth="1"/>
            ))}
            {/* SSID label at right end */}
            <rect x={lastX+6} y={lastY-9} width={h.ssid.length*6+6} height="14" rx="3" fill={dark?'#1e1e1e':'#fff'} fillOpacity="0.85" stroke={h.color} strokeWidth="0.8"/>
            <text x={lastX+9} y={lastY+1} fill={h.color} fontSize="9" fontWeight="700" fontFamily="monospace">{h.ssid}</text>
          </g>
        );
      })}

      {histories.length===0&&(
        <text x={W/2} y={H/2} fill={textCol} fontSize="13" textAnchor="middle">No data yet — start scanning</text>
      )}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SCAN ANIMATION SCREEN
// ══════════════════════════════════════════════════════════════════════
function ScanScreen({progress,status,dark}){
  const T=dark?'#e0e0e0':'#212121';
  const sub=dark?'#9e9e9e':'#757575';
  const bg=dark?'#121212':'#f5f5f5';
  const card=dark?'#1e1e1e':'#fff';
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:bg,padding:'24px',textAlign:'center'}}>
      {/* Animated wifi pulse */}
      <div style={{position:'relative',width:'100px',height:'100px',marginBottom:'28px'}}>
        {[0,1,2,3].map(ring=>(
          <div key={ring} style={{
            position:'absolute',
            border:'2px solid #00bcd4',
            borderRadius:'50%',
            width:`${30+ring*18}px`,height:`${30+ring*18}px`,
            top:`${35-ring*9}px`,left:`${35-ring*9}px`,
            opacity:0.8-ring*0.2,
            animation:`pulse ${1.5+ring*0.3}s ease-out infinite`,
            animationDelay:`${ring*0.3}s`,
          }}/>
        ))}
        <div style={{position:'absolute',top:'37px',left:'37px',width:'26px',height:'26px',background:'#00bcd4',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>📡</div>
      </div>
      <style>{`@keyframes pulse{0%{transform:scale(1);opacity:0.8}100%{transform:scale(1.4);opacity:0}}`}</style>
      <div style={{fontSize:'18px',fontWeight:'700',color:T,marginBottom:'8px'}}>Scanning Wi-Fi Networks</div>
      <div style={{fontSize:'13px',color:sub,marginBottom:'24px'}}>{status}</div>
      {/* Progress bar */}
      <div style={{width:'240px',height:'4px',background:dark?'#333':'#e0e0e0',borderRadius:'2px',overflow:'hidden'}}>
        <div style={{width:`${progress}%`,height:'100%',background:'#00bcd4',borderRadius:'2px',transition:'width 0.2s'}}/>
      </div>
      <div style={{fontSize:'12px',color:sub,marginTop:'8px'}}>{progress}%</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════
export default function App(){
  const [loggedIn,setLoggedIn]=useState(false);
  const [loginUser,setLoginUser]=useState('hanybkhite@gmail.com');
  const [loginPass,setLoginPass]=useState('');
  const [loginErr,setLoginErr]=useState('');
  const [dark,setDark]=useState(true);
  const [appState,setAppState]=useState('idle'); // idle|scanning|ready
  const [scanProgress,setScanProgress]=useState(0);
  const [scanStatus,setScanStatus]=useState('');
  const [tab,setTab]=useState('ap');
  const [band,setBand]=useState('2.4');
  const [paused,setPaused]=useState(false);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [aps,setAps]=useState([]);
  const [histories,setHistories]=useState([]);
  const [scanN,setScanN]=useState(0);
  const [selectedAP,setSelectedAP]=useState(null);
  const [showFilter,setShowFilter]=useState(false);
  const [fSSID,setFSSID]=useState('');
  const [fBands,setFBands]=useState(['2.4','5','6']);
  const [fSig,setFSig]=useState(null);
  const [fSec,setFSec]=useState([]);
  const [applied,setApplied]=useState({ssid:'',bands:['2.4','5','6'],sig:null,sec:[]});
  const [sortBy,setSortBy]=useState('signal');
  const [compactView,setCompactView]=useState(false);
  const [scanInterval,setScanInterval]=useState(5);
  const [members,setMembers]=useState([{id:1,name:'Hany Bkhite',role:'Super Admin',email:'hanybkhite@gmail.com',avatar:'👑',status:'Active',scans:0}]);
  const [showInvite,setShowInvite]=useState(false);
  const [iForm,setIForm]=useState({name:'',email:'',role:'Junior Tech'});
  const [reports,setReports]=useState([]);
  const [auditEnv,setAuditEnv]=useState('');
  const [auditPct,setAuditPct]=useState(0);
  const [auditRunning,setAuditRunning]=useState(false);
  const [selReport,setSelReport]=useState(null);
  const [accOpen,setAccOpen]=useState({});
  const [speedState,setSpeedState]=useState('idle'); // idle|ping|download|upload|done
  const [speedResult,setSpeedResult]=useState(null);
  const [speedProgress,setSpeedProgress]=useState(0);
  const [speedLog,setSpeedLog]=useState([]);
  const [toasts,setToasts]=useState([]);

  const T={bg:dark?'#121212':'#f5f5f5',bar:dark?'#1e1e1e':'#ffffff',card:dark?'#1e1e1e':'#ffffff',card2:dark?'#2a2a2a':'#f9f9f9',border:dark?'#333':'#e0e0e0',text:dark?'#e0e0e0':'#212121',sub:dark?'#9e9e9e':'#757575',blue:'#2196f3',cyan:'#00bcd4',green:'#4caf50',red:'#f44336',yellow:'#ffc107'};

  const toast=(msg,type='info')=>{const id=Date.now();setToasts(p=>[...p,{id,msg,type}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3000);};

  // ── Initial scan on login ──────────────────────────────────────────
  const runInitialScan=useCallback(async()=>{
    setAppState('scanning');
    const steps=[
      {p:5,s:'Initializing radio hardware...'},
      {p:15,s:'Checking WiFi permissions...'},
      {p:25,s:'Starting scan engine...'},
      {p:40,s:'Scanning 2.4 GHz band...'},
      {p:55,s:'Scanning 5 GHz band...'},
      {p:68,s:'Scanning 6 GHz band...'},
      {p:78,s:'Resolving vendor database...'},
      {p:88,s:'Computing channel ratings...'},
      {p:94,s:'Calculating distances...'},
      {p:100,s:'Scan complete!'},
    ];
    for(const step of steps){
      await new Promise(r=>setTimeout(r,280));
      setScanProgress(step.p);
      setScanStatus(step.s);
    }
    const scanned=simulateScan();
    setAps(scanned);
    setHistories(scanned.map((ap,i)=>({ssid:ap.ssid,mac:ap.mac,color:apColor(i,ap.connected),pts:[ap.signal]})));
    setScanN(1);
    setAppState('ready');
    toast(`✅ Found ${scanned.length} networks`,'success');
  },[]);

  // Start scan after login
  useEffect(()=>{if(loggedIn&&appState==='idle')runInitialScan();},[loggedIn,appState,runInitialScan]);

  // Auto rescan
  const doRescan=useCallback(()=>{
    if(paused||appState!=='ready') return;
    setAps(prev=>{
      const next=prev.map(ap=>enrichAP({...ap,signal:Math.max(-98,Math.min(-28,ap.signal+(Math.random()*3-1.5)))}));
      setHistories(h=>h.map(hist=>{
        const ap=next.find(a=>a.mac===hist.mac);
        return ap?{...hist,pts:[...hist.pts.slice(-49),Math.round(ap.signal)]}:hist;
      }));
      setScanN(n=>n+1);
      return next;
    });
  },[paused,appState]);

  useEffect(()=>{
    if(appState!=='ready') return;
    const t=setInterval(doRescan,scanInterval*1000);
    return()=>clearInterval(t);
  },[doRescan,scanInterval,appState]);

  const manualScan=async()=>{
    toast('📡 Scanning...','info');
    await new Promise(r=>setTimeout(r,1500));
    doRescan();
    toast('✅ Scan updated','success');
  };

  const doLogin=(e)=>{
    e.preventDefault();
    if((loginUser==='hanybkhite@gmail.com'&&loginPass==='1234!@#$Hany')||(loginUser==='admin'&&loginPass==='admin123')){
      setLoggedIn(true);
    }else setLoginErr('Invalid credentials.');
  };

  const startAudit=async()=>{
    if(!auditEnv.trim()){toast('Enter environment name','error');return;}
    setAuditRunning(true);setAuditPct(0);
    for(let i=1;i<=20;i++){await new Promise(r=>setTimeout(r,100));setAuditPct(i*5);}
    const r={id:`REP-${String(reports.length+1).padStart(3,'0')}`,loc:auditEnv,date:new Date().toISOString().slice(0,10),aps:[...aps]};
    setReports(p=>[...p,r]);setAuditRunning(false);setAuditEnv('');
    toast(`✅ Audit saved: ${r.id}`,'success');
  };

  const runSpeedTest=async()=>{
    setSpeedState('ping'); setSpeedResult(null); setSpeedLog([]); setSpeedProgress(0);
    const log=(msg)=>setSpeedLog(p=>[...p,{t:new Date().toLocaleTimeString(),m:msg}]);
    // PING phase
    log('Starting ping test...');
    await new Promise(r=>setTimeout(r,800));
    const ping=Math.round(Math.random()*20+3);
    const jitter=+(Math.random()*3+0.5).toFixed(1);
    log(`Ping: ${ping}ms · Jitter: ${jitter}ms`);
    setSpeedProgress(25);
    // DOWNLOAD phase
    setSpeedState('download');
    log('Testing download speed...');
    let dl=0;
    for(let i=1;i<=8;i++){
      await new Promise(r=>setTimeout(r,200));
      dl=Math.round(150+Math.random()*400+i*20);
      setSpeedProgress(25+i*5);
      log(`Download sample ${i}: ${dl} Mbps`);
    }
    const dlFinal=Math.round(200+Math.random()*350);
    log(`Download: ${dlFinal} Mbps ✓`);
    setSpeedProgress(75);
    // UPLOAD phase
    setSpeedState('upload');
    log('Testing upload speed...');
    let ul=0;
    for(let i=1;i<=5;i++){
      await new Promise(r=>setTimeout(r,180));
      ul=Math.round(50+Math.random()*150);
      setSpeedProgress(75+i*4);
      log(`Upload sample ${i}: ${ul} Mbps`);
    }
    const ulFinal=Math.round(80+Math.random()*150);
    log(`Upload: ${ulFinal} Mbps ✓`);
    setSpeedProgress(100);
    setSpeedState('done');
    const res={ping,jitter,dl:dlFinal,ul:ulFinal,timestamp:new Date().toLocaleTimeString(),server:'CAF-NET-SRV-01',isp:'CAF Enterprise Network',rating:dlFinal>300?'Excellent':dlFinal>150?'Good':dlFinal>50?'Fair':'Poor'};
    setSpeedResult(res);
    log(`Test complete! DL:${dlFinal} UL:${ulFinal} Ping:${ping}ms`);
    toast(`⚡ ${dlFinal} Mbps ↓ · ${ulFinal} Mbps ↑ · ${ping}ms`,'success');
  };

  const displayAPs=aps.filter(ap=>{
    if(!applied.bands.includes(ap.band))return false;
    if(applied.ssid&&!ap.ssid.toLowerCase().includes(applied.ssid.toLowerCase()))return false;
    if(applied.sig!==null&&sigLvl(ap.signal)!==applied.sig)return false;
    if(applied.sec.length>0&&!applied.sec.some(s=>ap.security.includes(s)))return false;
    return true;
  }).sort((a,b)=>sortBy==='signal'?b.signal-a.signal:sortBy==='ssid'?a.ssid.localeCompare(b.ssid):a.primaryCh-b.primaryCh);

  const connectedAP=aps.find(a=>a.connected);
  const ratings=rateChannels(aps,band);
  const bestChs=ratings.filter(r=>r.count===0).slice(0,4).map(r=>r.ch);

  // ── STYLE SYSTEM ──────────────────────────────────────────────────
  const s={
    app:{display:'flex',flexDirection:'column',height:'100vh',background:T.bg,color:T.text,fontFamily:"'Roboto','Segoe UI',sans-serif",overflow:'hidden'},
    topbar:{background:T.bar,borderBottom:`1px solid ${T.border}`,padding:'0 12px',height:'52px',display:'flex',alignItems:'center',gap:'6px',flexShrink:0,zIndex:20},
    scroll:{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch'},
    connBanner:{background:dark?'#0d2137':'#e3f2fd',borderBottom:`1px solid ${T.cyan}44`,padding:'9px 14px'},
    throttle:{background:dark?'#1a0a0a':'#ffebee',padding:'4px 14px',fontSize:'11px',color:T.red,borderBottom:`1px solid ${T.red}22`,display:'flex',justifyContent:'space-between'},
    apRow:{borderBottom:`1px solid ${T.border}`,padding:'11px 14px',cursor:'pointer',transition:'background 0.1s'},
    card:{background:T.card,borderRadius:'4px'},
    input:{background:T.card2,border:`1px solid ${T.border}`,color:T.text,padding:'9px 12px',borderRadius:'4px',fontSize:'13px',outline:'none',width:'100%',boxSizing:'border-box'},
    btn:(bg,tc,py)=>({background:bg||T.cyan,color:tc||'#fff',border:'none',padding:py||'8px 16px',borderRadius:'4px',cursor:'pointer',fontSize:'13px',fontWeight:'500',display:'inline-flex',alignItems:'center',gap:'6px'}),
    chip:(active)=>({background:'transparent',border:`1px solid ${active?T.cyan:T.border}`,color:active?T.cyan:T.sub,padding:'5px 12px',borderRadius:'20px',cursor:'pointer',fontSize:'12px'}),
    th:{textAlign:'left',padding:'9px 14px',borderBottom:`2px solid ${T.border}`,color:T.sub,fontSize:'11px',fontWeight:'600',letterSpacing:'0.06em',textTransform:'uppercase'},
    td:{padding:'10px 14px',borderBottom:`1px solid ${T.border}`,fontSize:'13px'},
    bottomNav:{background:T.bar,borderTop:`1px solid ${T.border}`,display:'flex',height:'56px',flexShrink:0},
    navBtn:(a)=>({flex:1,background:'transparent',border:'none',color:a?T.cyan:T.sub,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'2px',fontSize:'9px',fontWeight:a?'700':'400',borderTop:a?`2px solid ${T.cyan}`:'2px solid transparent'}),
    overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center'},
    sheet:{background:T.card,borderRadius:'16px 16px 0 0',padding:'20px 16px',width:'100%',maxWidth:'500px',maxHeight:'90vh',overflowY:'auto'},
    toggle:(on)=>({width:'42px',height:'22px',borderRadius:'11px',background:on?T.cyan:T.border,cursor:'pointer',border:'none',position:'relative',transition:'background 0.2s',flexShrink:0}),
    dot:(on)=>({position:'absolute',top:'2px',left:on?'22px':'2px',width:'18px',height:'18px',borderRadius:'50%',background:'#fff',transition:'left 0.2s'}),
  };

  const SIDEBAR_NAV=[{id:'ap',l:'Access Points',i:'📡'},{id:'cr',l:'Channel Rating',i:'⭐'},{id:'cg',l:'Channel Graph',i:'📊'},{id:'tg',l:'Time Graph',i:'📈'},{id:'ex',l:'Export',i:'📤'},{id:'av',l:'Available Channels',i:'📻'},{id:'ve',l:'Vendors',i:'👥'},{id:'se',l:'Settings',i:'⚙️'},{id:'st',l:'Speed Test',i:'⚡'},{id:'ab',l:'About',i:'ℹ️'}];
  const BOTTOM_NAV=[{id:'ap',l:'Access Points',i:'📡'},{id:'cr',l:'Ch. Rating',i:'⭐'},{id:'cg',l:'Ch. Graph',i:'📊'},{id:'tg',l:'Time Graph',i:'📈'},{id:'st',l:'Speed Test',i:'⚡'}];

  // ── LOGIN ────────────────────────────────────────────────────────────────
  if(!loggedIn) return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#121212',padding:'20px'}}>
      <div style={{background:'#1e1e1e',borderRadius:'8px',padding:'32px',maxWidth:'360px',width:'100%',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'28px'}}>
          <div style={{width:'46px',height:'46px',background:'#00838f',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>📡</div>
          <div><div style={{fontSize:'16px',fontWeight:'700',color:'#e0e0e0'}}>CAF-WIFI</div><div style={{fontSize:'11px',color:'#757575'}}>Enterprise WiFi Analyzer v3.0.0</div></div>
        </div>
        <form onSubmit={doLogin} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          {loginErr&&<div style={{background:'#b71c1c22',border:'1px solid #ef5350',color:'#ef9a9a',padding:'9px 12px',borderRadius:'4px',fontSize:'12px'}}>{loginErr}</div>}
          <input style={{background:'#2a2a2a',border:'1px solid #424242',color:'#e0e0e0',padding:'11px 14px',borderRadius:'4px',fontSize:'14px',outline:'none'}} type="text" value={loginUser} onChange={e=>setLoginUser(e.target.value)} placeholder="Email / Username"/>
          <input style={{background:'#2a2a2a',border:'1px solid #424242',color:'#e0e0e0',padding:'11px 14px',borderRadius:'4px',fontSize:'14px',outline:'none'}} type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} placeholder="Password"/>
          <button style={{background:'#00838f',color:'#fff',border:'none',padding:'12px',borderRadius:'4px',fontSize:'15px',fontWeight:'600',cursor:'pointer'}} type="submit">SIGN IN</button>
        </form>
        <div style={{marginTop:'14px',padding:'9px 12px',background:'#00838f22',border:'1px solid #00838f55',borderRadius:'4px',fontSize:'11px',color:'#4dd0e1',textAlign:'center'}}>
          hanybkhite@gmail.com · 1234!@#$Hany
        </div>
      </div>
    </div>
  );

  // ── SCANNING SCREEN ────────────────────────────────────────────────────
  if(appState==='scanning') return <ScanScreen progress={scanProgress} status={scanStatus} dark={dark}/>;

  return(
    <div style={s.app}>
      {/* TOASTS */}
      <div style={{position:'fixed',bottom:'64px',left:'50%',transform:'translateX(-50%)',zIndex:200,display:'flex',flexDirection:'column',gap:'6px',pointerEvents:'none',width:'90%',maxWidth:'340px'}}>
        {toasts.map(t=>(
          <div key={t.id} style={{background:t.type==='error'?'#c62828':t.type==='success'?'#2e7d32':'#1565c0',color:'#fff',padding:'10px 14px',borderRadius:'4px',fontSize:'13px',fontWeight:'500',boxShadow:'0 4px 12px rgba(0,0,0,0.4)',textAlign:'center'}}>{t.msg}</div>
        ))}
      </div>

      {/* SIDEBAR */}
      {sidebarOpen&&<div onClick={()=>setSidebarOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:35}}/>}
      {sidebarOpen&&(
        <aside style={{position:'fixed',top:0,left:0,width:'220px',height:'100vh',background:'#1a1a2e',borderRight:'1px solid rgba(255,255,255,0.08)',zIndex:40,display:'flex',flexDirection:'column',overflowY:'auto'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'16px 14px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
            <div style={{width:'36px',height:'36px',background:'#00838f',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>📡</div>
            <div><div style={{fontWeight:'700',fontSize:'14px',color:'#e0e0e0'}}>WiFiAnalyzer</div><div style={{fontSize:'10px',color:'#78909c'}}>(CAF-WIFI)</div></div>
            <button onClick={()=>setSidebarOpen(false)} style={{marginLeft:'auto',background:'transparent',border:'none',color:'#78909c',cursor:'pointer',fontSize:'20px'}}>✕</button>
          </div>
          <nav style={{flex:1,paddingTop:'6px'}}>
            {SIDEBAR_NAV.map(item=>(
              <button key={item.id} onClick={()=>{setTab(item.id);setSidebarOpen(false);}} style={{display:'flex',alignItems:'center',gap:'14px',width:'100%',background:tab===item.id?'rgba(0,188,212,0.12)':'transparent',border:'none',borderLeft:`3px solid ${tab===item.id?T.cyan:'transparent'}`,color:tab===item.id?T.cyan:'#b0bec5',padding:'13px 14px',cursor:'pointer',fontSize:'13px',fontWeight:tab===item.id?'600':'400',textAlign:'left'}}>
                <span style={{fontSize:'16px',width:'20px',textAlign:'center'}}>{item.i}</span>{item.l}
              </button>
            ))}
          </nav>
          <div style={{padding:'12px 14px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
            <div style={{fontSize:'10px',color:'#546e7a',marginBottom:'2px'}}>Signed in as</div>
            <div style={{color:'#b0bec5',fontSize:'11px',fontWeight:'500',marginBottom:'8px'}}>hanybkhite@gmail.com</div>
            <button onClick={()=>{setLoggedIn(false);setAppState('idle');setAps([]);setHistories([]);setScanN(0);}} style={{width:'100%',background:'transparent',border:'1px solid #c6282844',color:'#ef9a9a',padding:'6px',borderRadius:'3px',cursor:'pointer',fontSize:'11px'}}>Sign Out</button>
          </div>
        </aside>
      )}

      {/* TOPBAR */}
      <div style={s.topbar}>
        <button onClick={()=>setSidebarOpen(true)} style={{background:'transparent',border:'none',color:T.sub,cursor:'pointer',fontSize:'22px',lineHeight:1,padding:'4px'}}>☰</button>
        <span style={{fontWeight:'600',fontSize:'15px',color:T.text,flex:1}}>{SIDEBAR_NAV.find(s=>s.id===tab)?.l}</span>
        {['ap','cr','cg','tg'].includes(tab)&&(
          <button onClick={()=>setBand(b=>b==='2.4'?'5':'2.4')} style={{background:T.card2,border:'none',color:T.cyan,padding:'4px 10px',borderRadius:'4px',cursor:'pointer',fontSize:'12px',fontWeight:'700'}}>{band} GHz</button>
        )}
        {['ap','cg','tg'].includes(tab)&&(
          <button onClick={()=>setShowFilter(true)} style={{background:'transparent',border:'none',color:T.sub,cursor:'pointer',fontSize:'18px',padding:'4px'}}>⚙️</button>
        )}
        {['ap','cg','tg'].includes(tab)&&(
          <button onClick={()=>{setPaused(p=>!p);toast(paused?'▶ Resumed':'⏸ Paused');}} style={{background:'transparent',border:'none',color:T.sub,cursor:'pointer',fontSize:'18px',padding:'4px'}}>{paused?'▶':'⏸'}</button>
        )}
        {tab==='ap'&&(
          <button onClick={manualScan} style={{background:'transparent',border:`1px solid ${T.cyan}`,color:T.cyan,padding:'4px 10px',borderRadius:'4px',cursor:'pointer',fontSize:'11px',fontWeight:'700'}}>↺ Scan</button>
        )}
        <button onClick={()=>setDark(d=>!d)} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:'17px',padding:'4px'}}>{dark?'☀️':'🌙'}</button>
      </div>

      {/* CONN BANNER */}
      {['ap','cr','cg','tg'].includes(tab)&&connectedAP&&(
        <div style={s.connBanner}>
          <div style={{fontSize:'11px',color:T.cyan,fontWeight:'600',marginBottom:'2px'}}>Current connection</div>
          <div style={{fontWeight:'700',fontSize:'13px',color:T.text}}>{connectedAP.ssid} <span style={{color:T.sub,fontWeight:'400',fontSize:'12px'}}>({connectedAP.mac})</span></div>
          <div style={{fontSize:'12px',fontFamily:'monospace',marginTop:'1px'}}>
            <span style={{color:'#00bcd4',fontWeight:'700'}}>{Math.round(connectedAP.signal)}dBm</span>
            <span style={{color:T.sub}}> CH </span>
            <span style={{color:T.cyan,fontWeight:'700'}}>{connectedAP.chLabel}</span>
            <span style={{color:T.sub}}> {connectedAP.freq}MHz</span>
            <span style={{color:T.cyan,fontWeight:'600'}}> ~{connectedAP.dist}m</span>
          </div>
          <div style={{fontSize:'12px',color:T.cyan,fontWeight:'500',marginTop:'1px'}}>{connectedAP.mbps}Mbps {connectedAP.ip}</div>
        </div>
      )}

      {/* THROTTLE */}
      {['ap','cr','cg','tg'].includes(tab)&&(
        <div style={s.throttle}>
          <span>✕ Wi-Fi scan throttling is enabled</span>
          <span>Scan #{scanN} · {paused?'⏸ Paused':'🔴 Live'}</span>
        </div>
      )}

      {/* CONTENT */}
      <div style={s.scroll}>

        {/* ════ ACCESS POINTS ════ */}
        {tab==='ap'&&(
          <div>
            {aps.length===0&&(
              <div style={{textAlign:'center',padding:'48px 24px',color:T.sub}}>
                <div style={{fontSize:'40px',marginBottom:'12px'}}>📡</div>
                <div style={{fontSize:'14px'}}>No networks found</div>
                <button style={{...s.btn(),marginTop:'16px'}} onClick={manualScan}>↺ Scan Now</button>
              </div>
            )}
            {aps.length>0&&(
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 14px',background:T.card,borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:'flex',gap:'5px',alignItems:'center'}}>
                  <span style={{fontSize:'11px',color:T.sub}}>{displayAPs.length} networks · Sort:</span>
                  {['signal','ssid','channel'].map(sv=>(
                    <button key={sv} onClick={()=>setSortBy(sv)} style={{...s.chip(sortBy===sv),padding:'2px 8px',fontSize:'10px',textTransform:'capitalize'}}>{sv}</button>
                  ))}
                </div>
                <button onClick={()=>setCompactView(v=>!v)} style={{background:'transparent',border:'none',color:T.sub,cursor:'pointer',fontSize:'11px'}}>{compactView?'Complete':'Compact'}</button>
              </div>
            )}
            {displayAPs.map((ap,i)=>(
              <div key={ap.mac} style={{...s.apRow,background:ap.connected?dark?'#0d2137':'#e3f2fd':i%2===0?T.card:T.card2}} onClick={()=>setSelectedAP(s=>s?.mac===ap.mac?null:ap)}>
                {/* LINE 1: SSID (MAC) */}
                <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'3px',color:T.text}}>
                  {ap.ssid} <span style={{color:T.sub,fontWeight:'400',fontSize:'11px'}}>({ap.mac})</span>
                </div>
                {/* LINE 2: -XXdBm CH X XMHz Xm [mbps ip] */}
                <div style={{fontSize:'13px',marginBottom:'5px',fontFamily:'monospace'}}>
                  <span style={{color:sigCol(ap.signal),fontWeight:'700'}}>{Math.round(ap.signal)}dBm</span>
                  <span style={{color:T.sub}}> CH </span>
                  <span style={{color:T.cyan,fontWeight:'700'}}>{ap.chLabel}</span>
                  <span style={{color:T.sub}}> {ap.freq}MHz</span>
                  <span style={{color:T.cyan,fontWeight:'600'}}> ~{ap.dist}m</span>
                  {ap.connected&&ap.mbps&&<span style={{color:T.cyan,fontWeight:'600'}}> {ap.mbps}Mbps</span>}
                  {ap.connected&&ap.ip&&<span style={{color:T.cyan}}> {ap.ip}</span>}
                </div>
                {/* LINE 3: fan  freqStart - freqEnd (bwMHz) VENDOR */}
                {!compactView&&(
                  <div style={{display:'flex',alignItems:'flex-start',gap:'10px'}}>
                    <WifiFan signal={Math.round(ap.signal)} size={42} connected={ap.connected}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'12px',color:T.cyan,fontFamily:'monospace',marginBottom:'4px'}}>
                        {ap.freqStart} - {ap.freqEnd} ({ap.bw}MHz) <span style={{color:T.sub}}>{ap.vend.length>18?ap.vend.slice(0,17)+'…':ap.vend}</span>
                      </div>
                      {/* LINE 4: 🔒 [WPA2-PSK-CCMP+TKIP][WPS][ESS] */}
                      <div style={{display:'flex',alignItems:'center',gap:'4px',flexWrap:'wrap'}}>
                        <span style={{fontSize:'13px'}}>{ap.security.some(s=>['WPA3','WPA2','WPA'].includes(s))?'🔒':'🔓'}</span>
                        <span style={{fontSize:'11px',color:T.sub,fontFamily:'monospace',wordBreak:'break-all'}}>{ap.secStr}</span>
                      </div>
                      {ap.std&&<div style={{marginTop:'4px'}}><span style={{background:T.cyan+'22',color:T.cyan,fontSize:'10px',fontWeight:'700',padding:'1px 6px',borderRadius:'3px'}}>WiFi {ap.std}</span></div>}
                    </div>
                  </div>
                )}
                {/* Expanded detail */}
                {selectedAP?.mac===ap.mac&&(
                  <div style={{marginTop:'12px',paddingTop:'12px',borderTop:`1px solid ${T.border}`,display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    {[{l:'Signal',v:`${Math.round(ap.signal)} dBm · ${sigLabel(ap.signal)}`},{l:'Distance',v:`~${ap.dist} m`},{l:'Channel',v:`${ap.chLabel} (${ap.bw} MHz)`},{l:'Frequency',v:`${ap.freqStart}–${ap.freqEnd} MHz`},{l:'Vendor',v:ap.vend},{l:'MAC',v:ap.mac},{l:'Capabilities',v:ap.secStr},{l:'WiFi Std',v:`802.11${ap.std==='6'?'ax':ap.std==='5'?'ac':'n'} (WiFi ${ap.std})`},{l:'Band',v:`${ap.band} GHz`},{l:'Bandwidth',v:`${ap.bw} MHz`}].map(x=>(
                      <div key={x.l} style={{fontSize:'11px'}}>
                        <div style={{color:T.sub,marginBottom:'1px'}}>{x.l}</div>
                        <div style={{fontWeight:'600',color:T.text,wordBreak:'break-all'}}>{x.v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div style={{background:T.card,padding:'14px',marginTop:'2px'}}>
              <div style={{fontSize:'11px',color:T.sub,fontWeight:'600',letterSpacing:'0.08em',marginBottom:'8px'}}>SITE AUDIT</div>
              <input style={s.input} placeholder="Environment name (e.g., Data Center Rack B-12)" value={auditEnv} onChange={e=>setAuditEnv(e.target.value)}/>
              <button style={{...s.btn(auditRunning?T.border:T.cyan),marginTop:'8px',width:'100%',justifyContent:'center'}} onClick={startAudit} disabled={auditRunning}>
                {auditRunning?`⏳ ${auditPct}%...`:'▶ Start Site Audit'}
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
                <span style={{fontSize:'12px',fontWeight:'700',color:T.cyan}}>Best Channels ({band} GHz):</span>
                <span style={{fontSize:'13px',color:T.blue,fontWeight:'700'}}>{bestChs.length>0?bestChs.join(', '):'All occupied'}</span>
              </div>
              {band==='2.4'&&<div style={{fontSize:'11px',color:T.sub,marginBottom:'10px',padding:'8px',background:T.card2,borderRadius:'3px'}}>ℹ Non-overlapping channels: 1, 6, 11 (best for 2.4 GHz)</div>}
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr><th style={s.th}>Channel Rating</th><th style={{...s.th,textAlign:'center'}}>Channel #</th><th style={{...s.th,textAlign:'center'}}>AP Count</th></tr></thead>
                <tbody>
                  {ratings.map((r,i)=>(
                    <tr key={i} style={{background:i%2===0?T.card2:'transparent'}}>
                      <td style={s.td}>
                        {Array.from({length:10},(_,j)=>(
                          <span key={j} style={{color:j<r.stars?'#ffc107':'#3a3a3a',fontSize:'15px'}}>★</span>
                        ))}
                      </td>
                      <td style={{...s.td,textAlign:'center',color:T.cyan,fontWeight:'700',fontFamily:'monospace'}}>{r.ch}</td>
                      <td style={{...s.td,textAlign:'center',fontWeight:'700',color:r.count===0?T.green:r.count===1?T.yellow:T.red}}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════ CHANNEL GRAPH ════ */}
        {tab==='cg'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',padding:'10px 14px'}}>
              {[{l:'APs on '+band+' GHz',v:aps.filter(a=>a.band===band).length},{l:'Best Channel',v:bestChs[0]||'—'},{l:'Avg Signal',v:aps.filter(a=>a.band===band).length?Math.round(aps.filter(a=>a.band===band).reduce((s,a)=>s+a.signal,0)/aps.filter(a=>a.band===band).length)+' dBm':'—'},{l:'Congested',v:ratings.filter(r=>r.count>1).length+' ch'}].map((x,i)=>(
                <div key={i} style={{background:T.card,padding:'10px 12px',borderRadius:'4px',display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:'11px',color:T.sub}}>{x.l}</span>
                  <span style={{fontSize:'16px',fontWeight:'800',color:T.cyan}}>{x.v}</span>
                </div>
              ))}
            </div>
            <div style={{padding:'0 14px 12px'}}>
              <div style={{background:T.card,borderRadius:'4px',padding:'10px'}}>
                <div style={{fontWeight:'600',fontSize:'13px',marginBottom:'2px',color:T.text}}>Channel Spectrum — {band} GHz</div>
                <div style={{fontSize:'11px',color:T.sub,marginBottom:'8px'}}>Trapezoid width = channel bandwidth · Labels = SSID</div>
                <div style={{overflowX:'auto'}}>
                  <ChannelSpectrumGraph aps={aps} band={band} dark={dark}/>
                </div>
              </div>
            </div>
            <div style={{padding:'0 14px 12px'}}>
              <div style={{background:T.card,borderRadius:'4px',padding:'12px'}}>
                <div style={{fontWeight:'600',fontSize:'13px',marginBottom:'12px',color:T.text}}>Signal Strength per AP</div>
                {aps.filter(a=>a.band===band).length===0&&<div style={{color:T.sub,fontSize:'13px',textAlign:'center',padding:'16px'}}>No {band} GHz networks</div>}
                {aps.filter(a=>a.band===band).map((ap,i)=>{
                  const pct=Math.round(((ap.signal+100)/70)*100);
                  return(
                    <div key={i} style={{marginBottom:'12px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
                        <span style={{fontWeight:'600',color:T.text}}>{ap.ssid} <span style={{color:T.sub,fontFamily:'monospace',fontSize:'10px'}}>CH{ap.chLabel}</span></span>
                        <span style={{color:sigCol(ap.signal),fontWeight:'700',fontFamily:'monospace'}}>{Math.round(ap.signal)} dBm</span>
                      </div>
                      <div style={{background:dark?'#2a2a2a':'#e0e0e0',borderRadius:'3px',height:'8px',overflow:'hidden'}}>
                        <div style={{width:`${Math.max(2,pct)}%`,height:'100%',background:sigCol(ap.signal),borderRadius:'3px',transition:'width 0.5s'}}/>
                      </div>
                      <div style={{fontSize:'10px',color:T.sub,marginTop:'2px'}}>{ap.vend} · {ap.bw}MHz · {sigLabel(ap.signal)}</div>
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
              <div style={{fontWeight:'600',fontSize:'13px',marginBottom:'2px',color:T.text}}>Signal Strength Over Time</div>
              <div style={{fontSize:'11px',color:T.sub,marginBottom:'8px'}}>Auto-scan every {scanInterval}s · Scan #{scanN} · {band} GHz · {paused?'Paused':'Live'}</div>
              <div style={{overflowX:'auto'}}>
                <TimeGraphSVG histories={histories.filter(h=>aps.find(a=>a.mac===h.mac&&a.band===band))} dark={dark}/>
              </div>
            </div>
            <div style={{background:T.card,borderRadius:'4px',padding:'12px'}}>
              <div style={{fontWeight:'600',fontSize:'13px',marginBottom:'10px',color:T.text}}>Live Readings</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr><th style={s.th}>SSID</th><th style={s.th}>Signal</th><th style={s.th}>Δ</th><th style={s.th}>CH</th></tr></thead>
                <tbody>
                  {aps.filter(a=>a.band===band).map((ap,i)=>{
                    const hist=histories.find(h=>h.mac===ap.mac);
                    const prev=hist?.pts.at(-2)||ap.signal;
                    const d=Math.round(ap.signal-prev);
                    return(
                      <tr key={i} style={{background:i%2===0?T.card2:'transparent'}}>
                        <td style={{...s.td,fontWeight:'600'}}>{ap.ssid}</td>
                        <td style={{...s.td,color:sigCol(ap.signal),fontWeight:'700',fontFamily:'monospace'}}>{Math.round(ap.signal)} dBm</td>
                        <td style={{...s.td,color:d>0?T.green:d<0?T.red:T.sub,fontFamily:'monospace'}}>{d>0?'↑':d<0?'↓':'→'}{d!==0?Math.abs(d):''}</td>
                        <td style={{...s.td,color:T.cyan,fontFamily:'monospace'}}>{ap.chLabel}</td>
                      </tr>
                    );
                  })}
                  {aps.filter(a=>a.band===band).length===0&&<tr><td colSpan={4} style={{...s.td,textAlign:'center',color:T.sub}}>No {band} GHz networks</td></tr>}
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
                <button style={{...s.btn(T.card2,T.text,'6px 12px'),border:`1px solid ${T.border}`,marginBottom:'12px'}} onClick={()=>setSelReport(null)}>← Back</button>
                <div style={{background:T.card,borderRadius:'4px',padding:'14px'}}>
                  <div style={{fontSize:'10px',color:T.cyan,fontWeight:'700',marginBottom:'3px'}}>{selReport.id}</div>
                  <div style={{fontSize:'17px',fontWeight:'700',marginBottom:'3px',color:T.text}}>{selReport.loc}</div>
                  <div style={{fontSize:'12px',color:T.sub,marginBottom:'14px'}}>{selReport.date} · {selReport.aps.length} networks</div>
                  <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
                    <button style={s.btn(T.blue)} onClick={()=>toast('📄 PDF exported','success')}>📄 PDF</button>
                    <button style={s.btn('#2e7d32')} onClick={()=>{
                      const h='Time Stamp|SSID|BSSID|Strength|Primary Channel|Primary Frequency|Center Channel|Center Frequency|Width (Range)|Distance|Security';
                      const rows=selReport.aps.map(ap=>`${selReport.date}|${ap.ssid}|${ap.mac}|${Math.round(ap.signal)}dBm|${ap.primaryCh}|${ap.freq}MHz|${ap.centerCh||ap.primaryCh}|${ap.freq}MHz|${ap.bw}MHz (${ap.freqStart}-${ap.freqEnd})|${ap.dist}m|${ap.secStr}`);
                      const blob=new Blob([[h,...rows].join('\n')],{type:'text/csv'});
                      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${selReport.id}.csv`;a.click();
                      toast('✅ CSV downloaded','success');
                    }}>📊 CSV</button>
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead><tr><th style={s.th}>SSID</th><th style={s.th}>Signal</th><th style={s.th}>CH</th><th style={s.th}>Dist</th></tr></thead>
                    <tbody>{selReport.aps.map((ap,i)=>(
                      <tr key={i} style={{background:i%2===0?T.card2:'transparent'}}>
                        <td style={{...s.td,fontWeight:'600'}}>{ap.ssid}</td>
                        <td style={{...s.td,color:sigCol(ap.signal),fontFamily:'monospace',fontWeight:'700'}}>{Math.round(ap.signal)} dBm</td>
                        <td style={{...s.td,color:T.cyan,fontFamily:'monospace'}}>{ap.chLabel}</td>
                        <td style={{...s.td,color:T.sub}}>~{ap.dist}m</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            ):(
              <div>
                <div style={{fontSize:'11px',color:T.sub,fontWeight:'600',letterSpacing:'0.08em',marginBottom:'10px'}}>SAVED REPORTS ({reports.length})</div>
                {reports.length===0&&<div style={{background:T.card,borderRadius:'4px',padding:'32px',textAlign:'center',color:T.sub}}><div style={{fontSize:'32px',marginBottom:'8px'}}>📋</div>No reports yet.<br/>Run a Site Audit from Access Points.</div>}
                {reports.map((r,i)=>(
                  <div key={i} style={{background:T.card,borderRadius:'4px',padding:'12px',marginBottom:'8px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                      <div><div style={{fontSize:'10px',color:T.cyan,fontWeight:'700'}}>{r.id}</div><div style={{fontWeight:'700',fontSize:'13px',color:T.text}}>{r.loc}</div><div style={{fontSize:'11px',color:T.sub}}>{r.date} · {r.aps.length} APs</div></div>
                    </div>
                    <button style={{...s.btn(T.card2,T.text,'6px 12px'),border:`1px solid ${T.border}`,fontSize:'12px'}} onClick={()=>setSelReport(r)}>👁 View & Export</button>
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
                    const used=aps.some(a=>a.band===b&&Math.abs(a.primaryCh-ch)<=(a.bw/10));
                    return(<div key={ch} style={{background:used?T.red+'22':T.green+'22',border:`1px solid ${used?T.red:T.green}`,color:used?T.red:T.green,padding:'5px 10px',borderRadius:'4px',fontSize:'12px',fontWeight:'700',minWidth:'36px',textAlign:'center'}}>{ch}</div>);
                  })}
                </div>
                <div style={{display:'flex',gap:'14px',marginTop:'10px',fontSize:'11px'}}>
                  <span style={{color:T.green}}>■ Available</span><span style={{color:T.red}}>■ In Use</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════ VENDORS ════ */}
        {tab==='ve'&&(
          <div style={{padding:'12px 14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
              <div><div style={{fontSize:'15px',fontWeight:'700',color:T.text}}>Team Management</div><div style={{fontSize:'11px',color:T.sub}}>{members.length} members</div></div>
              <button style={s.btn(T.cyan)} onClick={()=>setShowInvite(true)}>+ Invite</button>
            </div>
            {showInvite&&(
              <div style={s.overlay} onClick={e=>{if(e.target===e.currentTarget)setShowInvite(false);}}>
                <div style={s.sheet}>
                  <div style={{fontSize:'16px',fontWeight:'700',marginBottom:'18px',color:T.text}}>Invite Team Member</div>
                  <form onSubmit={e=>{e.preventDefault();if(!iForm.name||!iForm.email){toast('Fill all fields','error');return;}setMembers(m=>[...m,{id:Date.now(),...iForm,status:'Active',scans:0,avatar:'👤'}]);setShowInvite(false);setIForm({name:'',email:'',role:'Junior Tech'});toast(`✅ Invite sent to ${iForm.email}`,'success');}} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div><label style={{fontSize:'11px',color:T.sub,display:'block',marginBottom:'4px'}}>FULL NAME</label><input style={s.input} placeholder="John Smith" value={iForm.name} onChange={e=>setIForm(f=>({...f,name:e.target.value}))}/></div>
                    <div><label style={{fontSize:'11px',color:T.sub,display:'block',marginBottom:'4px'}}>EMAIL</label><input style={s.input} type="email" placeholder="user@company.com" value={iForm.email} onChange={e=>setIForm(f=>({...f,email:e.target.value}))}/></div>
                    <div><label style={{fontSize:'11px',color:T.sub,display:'block',marginBottom:'4px'}}>ROLE</label><select style={{...s.input,cursor:'pointer'}} value={iForm.role} onChange={e=>setIForm(f=>({...f,role:e.target.value}))}>{['Junior Tech','Senior Tech','Network Admin','Support Specialist','Manager'].map(r=><option key={r}>{r}</option>)}</select></div>
                    <div style={{display:'flex',gap:'8px',paddingTop:'4px'}}>
                      <button type="submit" style={{...s.btn(T.cyan),flex:1,justifyContent:'center'}}>Send Invite</button>
                      <button type="button" style={{...s.btn(T.card2,T.text),border:`1px solid ${T.border}`,flex:1,justifyContent:'center'}} onClick={()=>setShowInvite(false)}>Cancel</button>
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
                    <div style={{fontSize:'11px',color:T.cyan,marginTop:'2px'}}>{m.role}</div>
                  </div>
                  <div>
                    <span style={{background:m.status==='Active'?T.green+'22':T.red+'22',color:m.status==='Active'?T.green:T.red,fontSize:'9px',fontWeight:'700',padding:'2px 7px',borderRadius:'3px'}}>{m.status}</span>
                    {m.email!=='hanybkhite@gmail.com'&&<button onClick={()=>setMembers(p=>p.filter(x=>x.id!==m.id))} style={{display:'block',background:'transparent',border:'none',color:T.red,cursor:'pointer',fontSize:'11px',marginTop:'4px'}}>Remove</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ SETTINGS ════ */}
        {tab==='se'&&(
          <div style={{padding:'12px 14px'}}>
            <div style={{background:T.card,borderRadius:'4px',marginBottom:'8px'}}>
              <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.border}`,fontSize:'11px',fontWeight:'700',color:T.sub,letterSpacing:'0.08em'}}>SCANNING</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',borderBottom:`1px solid ${T.border}`}}>
                <div><div style={{fontSize:'13px',fontWeight:'600',color:T.text}}>Scan Interval</div><div style={{fontSize:'11px',color:T.sub}}>{scanInterval} seconds between scans</div></div>
                <select style={{...s.input,width:'70px'}} value={scanInterval} onChange={e=>setScanInterval(Number(e.target.value))}>
                  {[1,2,3,5,10,15,30].map(v=><option key={v} value={v}>{v}s</option>)}
                </select>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px'}}>
                <div><div style={{fontSize:'13px',fontWeight:'600',color:T.text}}>Sort Access Points By</div></div>
                <select style={{...s.input,width:'130px'}} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                  <option value="signal">Signal Strength</option>
                  <option value="ssid">SSID</option>
                  <option value="channel">Channel</option>
                </select>
              </div>
            </div>
            <div style={{background:T.card,borderRadius:'4px',marginBottom:'8px'}}>
              <div style={{padding:'10px 14px',borderBottom:`1px solid ${T.border}`,fontSize:'11px',fontWeight:'700',color:T.sub,letterSpacing:'0.08em'}}>DISPLAY</div>
              {[{l:'Dark Theme',sub:'Dark background',state:dark,fn:()=>setDark(d=>!d)},{l:'Compact View',sub:'Less details per AP',state:compactView,fn:()=>setCompactView(v=>!v)}].map((x,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',borderBottom:`1px solid ${T.border}`}}>
                  <div><div style={{fontSize:'13px',fontWeight:'600',color:T.text}}>{x.l}</div><div style={{fontSize:'11px',color:T.sub}}>{x.sub}</div></div>
                  <button style={s.toggle(x.state)} onClick={x.fn}><div style={s.dot(x.state)}/></button>
                </div>
              ))}
            </div>
            <div style={{background:T.card,borderRadius:'4px',padding:'14px',marginBottom:'8px'}}>
              <div style={{fontSize:'11px',fontWeight:'700',color:T.sub,letterSpacing:'0.08em',marginBottom:'10px'}}>SYSTEM</div>
              {[{l:'App Version',v:'v3.0.0 Enterprise'},{l:'Admin',v:'hanybkhite@gmail.com'},{l:'Vendor DB',v:'IEEE OUI'},{l:'Distance',v:'Free-space path loss'},{l:'Scan Engine',v:`Auto · ${scanInterval}s`},{l:'Networks',v:aps.length+' found'}].map((r,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontSize:'12px',color:T.sub}}>{r.l}</span>
                  <span style={{fontSize:'12px',fontWeight:'600',color:T.text}}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ SPEED TEST ════ */}
        {tab==='st'&&(
          <div style={{padding:'16px 14px'}}>
            {/* Speed Test Hero */}
            <div style={{background:T.card,borderRadius:'8px',padding:'20px',marginBottom:'12px',textAlign:'center'}}>
              {/* Animated speedometer */}
              <div style={{position:'relative',width:'180px',height:'100px',margin:'0 auto 16px'}}>
                <svg width="180" height="100" viewBox="0 0 180 100">
                  {/* Background arc */}
                  <path d="M 15 90 A 75 75 0 0 1 165 90" fill="none" stroke={dark?'#333':'#e0e0e0'} strokeWidth="12" strokeLinecap="round"/>
                  {/* Progress arc */}
                  {speedResult&&(()=>{
                    const pct=Math.min(1,speedResult.dl/600);
                    const angle=-Math.PI+(pct*Math.PI);
                    const ex=90+75*Math.cos(angle),ey=90+75*Math.sin(angle);
                    const large=pct>0.5?1:0;
                    return <path d={`M 15 90 A 75 75 0 ${large} 1 ${ex} ${ey}`} fill="none" stroke={speedResult.dl>300?'#4caf50':speedResult.dl>150?'#ffc107':'#f44336'} strokeWidth="12" strokeLinecap="round"/>;
                  })()}
                  {/* Speed labels */}
                  {[0,100,200,300,400,500,600].map((v,i)=>{
                    const a=-Math.PI+(i/6)*Math.PI;
                    const r=62,tx=90+r*Math.cos(a),ty=90+r*Math.sin(a);
                    return <text key={v} x={tx} y={ty+3} fill={dark?'#555':'#bbb'} fontSize="8" textAnchor="middle">{v}</text>;
                  })}
                  {/* Needle */}
                  {speedState!=='idle'&&(()=>{
                    const val=speedState==='download'||speedState==='done'?speedResult?.dl||0:speedState==='upload'?speedResult?.ul||0:0;
                    const pct=Math.min(1,val/600);
                    const angle=-Math.PI+(pct*Math.PI);
                    const nx=90+68*Math.cos(angle),ny=90+68*Math.sin(angle);
                    return <line x1="90" y1="90" x2={nx} y2={ny} stroke={T.cyan} strokeWidth="2.5" strokeLinecap="round"/>;
                  })()}
                  <circle cx="90" cy="90" r="5" fill={T.cyan}/>
                  {/* Big number */}
                  <text x="90" y="72" fill={T.text} fontSize="22" fontWeight="700" textAnchor="middle" fontFamily="monospace">
                    {speedResult?(speedState==='done'?speedResult.dl:speedState==='upload'?speedResult.ul||0:0):speedState==='idle'?'—':'...'}
                  </text>
                  <text x="90" y="83" fill={T.sub} fontSize="9" textAnchor="middle">Mbps</text>
                </svg>
              </div>

              {/* State indicator */}
              <div style={{fontSize:'13px',color:T.sub,marginBottom:'16px',minHeight:'20px'}}>
                {speedState==='idle'&&'Tap to start speed test'}
                {speedState==='ping'&&<span style={{color:T.yellow}}>📡 Testing ping...</span>}
                {speedState==='download'&&<span style={{color:T.blue}}>⬇ Testing download...</span>}
                {speedState==='upload'&&<span style={{color:T.cyan}}>⬆ Testing upload...</span>}
                {speedState==='done'&&<span style={{color:T.green}}>✓ Test complete</span>}
              </div>

              {/* Progress bar */}
              {speedState!=='idle'&&speedState!=='done'&&(
                <div style={{background:dark?'#333':'#e0e0e0',borderRadius:'2px',height:'4px',overflow:'hidden',marginBottom:'16px',maxWidth:'280px',margin:'0 auto 16px'}}>
                  <div style={{width:`${speedProgress}%`,height:'100%',background:speedState==='ping'?T.yellow:speedState==='download'?T.blue:T.cyan,transition:'width 0.3s'}}/>
                </div>
              )}

              {/* Results cards */}
              {speedResult&&speedState==='done'&&(
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'16px',maxWidth:'340px',margin:'0 auto 16px'}}>
                  <div style={{background:dark?'#0d2137':'#e3f2fd',border:`1px solid ${T.blue}44`,borderRadius:'8px',padding:'14px',textAlign:'center'}}>
                    <div style={{fontSize:'10px',color:T.sub,marginBottom:'4px',letterSpacing:'0.08em'}}>DOWNLOAD</div>
                    <div style={{fontSize:'28px',fontWeight:'800',color:T.blue,fontFamily:'monospace'}}>{speedResult.dl}</div>
                    <div style={{fontSize:'11px',color:T.sub}}>Mbps</div>
                  </div>
                  <div style={{background:dark?'#0d2a0d':'#e8f5e9',border:`1px solid ${T.cyan}44`,borderRadius:'8px',padding:'14px',textAlign:'center'}}>
                    <div style={{fontSize:'10px',color:T.sub,marginBottom:'4px',letterSpacing:'0.08em'}}>UPLOAD</div>
                    <div style={{fontSize:'28px',fontWeight:'800',color:T.cyan,fontFamily:'monospace'}}>{speedResult.ul}</div>
                    <div style={{fontSize:'11px',color:T.sub}}>Mbps</div>
                  </div>
                  <div style={{background:dark?'#1a1a0a':'#fffde7',border:`1px solid ${T.yellow}44`,borderRadius:'8px',padding:'12px',textAlign:'center'}}>
                    <div style={{fontSize:'10px',color:T.sub,marginBottom:'4px',letterSpacing:'0.08em'}}>PING</div>
                    <div style={{fontSize:'22px',fontWeight:'800',color:T.yellow,fontFamily:'monospace'}}>{speedResult.ping}</div>
                    <div style={{fontSize:'11px',color:T.sub}}>ms</div>
                  </div>
                  <div style={{background:dark?'#1a0a0a':'#fce4ec',border:`1px solid #e91e6344`,borderRadius:'8px',padding:'12px',textAlign:'center'}}>
                    <div style={{fontSize:'10px',color:T.sub,marginBottom:'4px',letterSpacing:'0.08em'}}>JITTER</div>
                    <div style={{fontSize:'22px',fontWeight:'800',color:'#e91e63',fontFamily:'monospace'}}>{speedResult.jitter}</div>
                    <div style={{fontSize:'11px',color:T.sub}}>ms</div>
                  </div>
                </div>
              )}

              {/* Rating badge */}
              {speedResult&&speedState==='done'&&(
                <div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:speedResult.rating==='Excellent'?T.green+'22':speedResult.rating==='Good'?T.blue+'22':T.yellow+'22',border:`1px solid ${speedResult.rating==='Excellent'?T.green:speedResult.rating==='Good'?T.blue:T.yellow}`,borderRadius:'20px',padding:'6px 16px',marginBottom:'16px'}}>
                  <span style={{fontSize:'16px'}}>{speedResult.rating==='Excellent'?'🚀':speedResult.rating==='Good'?'✅':'⚠️'}</span>
                  <span style={{fontWeight:'700',fontSize:'13px',color:speedResult.rating==='Excellent'?T.green:speedResult.rating==='Good'?T.blue:T.yellow}}>{speedResult.rating} Connection</span>
                </div>
              )}

              {/* Test button */}
              <button
                style={{...s.btn(speedState==='idle'||speedState==='done'?T.cyan:'#555','#fff'),padding:'12px 32px',borderRadius:'24px',fontSize:'14px',fontWeight:'700',justifyContent:'center',opacity:speedState!=='idle'&&speedState!=='done'?0.6:1}}
                onClick={()=>{if(speedState==='idle'||speedState==='done')runSpeedTest();}}
                disabled={speedState!=='idle'&&speedState!=='done'}
              >
                {speedState==='idle'?'⚡ START SPEED TEST':speedState==='done'?'↺ RUN AGAIN':'⏳ Testing...'}
              </button>
            </div>

            {/* Server info */}
            {speedResult&&(
              <div style={{background:T.card,borderRadius:'8px',padding:'14px',marginBottom:'12px'}}>
                <div style={{fontSize:'11px',color:T.sub,fontWeight:'700',letterSpacing:'0.08em',marginBottom:'10px'}}>TEST DETAILS</div>
                {[{l:'Server',v:speedResult.server},{l:'ISP',v:speedResult.isp},{l:'Tested at',v:speedResult.timestamp},{l:'Download',v:`${speedResult.dl} Mbps`},{l:'Upload',v:`${speedResult.ul} Mbps`},{l:'Ping',v:`${speedResult.ping} ms`},{l:'Jitter',v:`${speedResult.jitter} ms`},{l:'Rating',v:speedResult.rating}].map((r,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${T.border}`}}>
                    <span style={{fontSize:'12px',color:T.sub}}>{r.l}</span>
                    <span style={{fontSize:'12px',fontWeight:'600',color:T.text}}>{r.v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Log */}
            {speedLog.length>0&&(
              <div style={{background:T.card,borderRadius:'8px',padding:'14px'}}>
                <div style={{fontSize:'11px',color:T.sub,fontWeight:'700',letterSpacing:'0.08em',marginBottom:'8px'}}>TEST LOG</div>
                <div style={{background:dark?'#0a0a0a':'#f5f5f5',borderRadius:'4px',padding:'10px',fontFamily:'monospace',fontSize:'11px',maxHeight:'160px',overflowY:'auto'}}>
                  {speedLog.map((l,i)=>(
                    <div key={i} style={{color:dark?'#4caf50':'#2e7d32',marginBottom:'3px'}}>
                      <span style={{color:T.sub}}>[{l.t}]</span> {l.m}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ ABOUT ════ */}
        {tab==='ab'&&(
          <div style={{padding:'24px 16px',textAlign:'center'}}>
            <div style={{width:'64px',height:'64px',background:'#00838f',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',margin:'0 auto 16px'}}>📡</div>
            <div style={{fontSize:'22px',fontWeight:'700',marginBottom:'4px',color:T.text}}>CAF-WIFI</div>
            <div style={{fontSize:'14px',color:T.cyan,marginBottom:'4px'}}>v3.0.0 Enterprise</div>
            <div style={{fontSize:'12px',color:T.sub,marginBottom:'28px'}}>Enterprise WiFi Infrastructure Analyzer</div>
            {[{i:'📡',t:'Access Points',d:'Identifies nearby APs with signal strength, channel, frequency, vendor (OUI lookup), estimated distance, and security capabilities.'},{i:'📊',t:'Channel Graph',d:'Visualizes WiFi spectrum with accurate trapezoid shapes. Width = bandwidth. SSID labels shown above each peak.'},{i:'📈',t:'Time Graph',d:'Tracks signal strength per AP over time with smooth curves and SSID labels.'},{i:'⭐',t:'Channel Rating',d:'Rates channels 1–10 based on congestion. Helps choose the optimal channel for your AP.'},{i:'🔍',t:'Filters',d:'Filter by WiFi band, signal strength, security type, and SSID across all views.'},{i:'📏',t:'Distance',d:'Uses free-space path loss: 10^((27.55 - 20×log₁₀(freq) + |RSSI|) / 20)'}].map((x,i)=>(
              <div key={i} style={{background:T.card,borderRadius:'4px',padding:'12px',marginBottom:'8px',textAlign:'left'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'5px'}}>
                  <span style={{fontSize:'18px'}}>{x.i}</span><span style={{fontWeight:'700',fontSize:'13px',color:T.text}}>{x.t}</span>
                </div>
                <div style={{fontSize:'12px',color:T.sub,lineHeight:'1.6'}}>{x.d}</div>
              </div>
            ))}
            <div style={{fontSize:'11px',color:T.sub,marginTop:'16px'}}>© 2024 CAF-WIFI Operations · hanybkhite@gmail.com<br/>GDIT-CAF-NETPULSE-v3-PROD · Proprietary</div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={s.bottomNav}>
        {BOTTOM_NAV.map(n=>(
          <button key={n.id} style={s.navBtn(tab===n.id)} onClick={()=>setTab(n.id)}>
            <span style={{fontSize:'20px',lineHeight:1}}>{n.i}</span>
            <span>{n.l}</span>
          </button>
        ))}
      </div>

      {/* FILTER SHEET */}
      {showFilter&&(
        <div style={s.overlay} onClick={e=>{if(e.target===e.currentTarget)setShowFilter(false);}}>
          <div style={s.sheet}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px',paddingBottom:'14px',borderBottom:`1px solid ${T.border}`}}>
              <span style={{fontSize:'20px'}}>⚙️</span><span style={{fontSize:'17px',fontWeight:'700',color:T.text}}>Filter</span>
            </div>
            <div style={{marginBottom:'20px'}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'8px'}}>SSID <span style={{color:T.sub,fontWeight:'400'}}>(case sensitive)</span></div>
              <input style={{...s.input,borderRadius:0,borderTop:'none',borderLeft:'none',borderRight:'none',borderBottom:`2px solid ${T.cyan}`,background:'transparent'}} placeholder="ssid SSID" value={fSSID} onChange={e=>setFSSID(e.target.value)}/>
            </div>
            <div style={{marginBottom:'20px',paddingBottom:'20px',borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'10px'}}>WiFi Band</div>
              <div style={{display:'flex',gap:'8px'}}>
                {['2.4','5','6'].map(b=>(
                  <button key={b} onClick={()=>setFBands(p=>p.includes(b)?p.filter(x=>x!==b):[...p,b])} style={s.chip(fBands.includes(b))}>{b} GHz</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:'20px',paddingBottom:'20px',borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'12px'}}>Signal Strength</div>
              <div style={{display:'flex',gap:'8px',justifyContent:'center'}}>
                {[0,1,2,3,4].map(lvl=>{
                  const cols=['#f44336','#ff9800','#ffc107','#8bc34a','#4caf50'];
                  const col=cols[lvl];
                  const sz=44,cx=sz/2,cy=sz*0.82,r=[sz*0.11,sz*0.24,sz*0.38,sz*0.52];
                  const a1=-148*Math.PI/180,a2=-32*Math.PI/180;
                  const pt=(r,a)=>({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});
                  const arc=(ri,ro)=>{const p1=pt(ri,a1),p2=pt(ro,a1),p3=pt(ro,a2),p4=pt(ri,a2);return`M${p1.x},${p1.y} L${p2.x},${p2.y} A${ro},${ro} 0 0,1 ${p3.x},${p3.y} L${p4.x},${p4.y} A${ri},${ri} 0 0,0 ${p1.x},${p1.y} Z`;};
                  return(
                    <button key={lvl} onClick={()=>setFSig(fSig===lvl?null:lvl)} style={{background:fSig===lvl?col+'22':'transparent',border:`2px solid ${fSig===lvl?col:'transparent'}`,borderRadius:'8px',cursor:'pointer',padding:'5px',opacity:fSig===null||fSig===lvl?1:0.4}}>
                      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
                        <circle cx={cx} cy={cy} r={sz*0.055} fill={col}/>
                        {r.map((ri,i)=>i<3&&<path key={i} d={arc(ri+1,r[i+1]-1)} fill={lvl>i?col:'#3a3a3a'} opacity="0.92"/>)}
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{marginBottom:'24px'}}>
              <div style={{fontSize:'13px',fontWeight:'600',color:T.text,marginBottom:'10px'}}>Security</div>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                {['None','WPS','WEP','WPA','WPA2','WPA3'].map(sec=>(
                  <button key={sec} onClick={()=>setFSec(p=>p.includes(sec)?p.filter(x=>x!==sec):[...p,sec])} style={s.chip(fSec.includes(sec))}>{sec}</button>
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
