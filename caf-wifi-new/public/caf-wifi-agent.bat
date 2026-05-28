@echo off
title CAF-WIFI Local Agent
color 0B

echo.
echo  =====================================
echo   CAF-WIFI Local Agent v1.0
echo  =====================================
echo.

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js not found! Download from: https://nodejs.org
    pause & exit /b 1
)

set "JS=%TEMP%\cafwifi%RANDOM%.js"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$c='const http=require(''http''),{execFile}=require(''child_process''),os=require(''os'');const PORT=7788;const OUI={\"08:d2:3e\":\"INTEL\",\"00:0b:86\":\"ARUBA\",\"7c:1c:f1\":\"HUAWEI\",\"98:da:c4\":\"TP-LINK\",\"d4:ae:52\":\"NETGEAR\",\"4c:5e:0c\":\"TP-LINK\",\"b0:4e:26\":\"TP-LINK\",\"00:17:f2\":\"APPLE\",\"08:92:04\":\"INTEL\",\"f8:ff:c2\":\"CISCO\"};const vend=m=>{if(!m)return\"UNKNOWN\";const k=m.slice(0,8).toLowerCase().replace(/-/g,\":\");return OUI[k]||\"UNKNOWN VENDOR\"};const dst=(r,f)=>+(Math.pow(10,(27.55-(20*Math.log10(f))+Math.abs(r))/20)).toFixed(1);const ss=s=>{const p=[];if(s.includes(\"WPA3\"))p.push(\"[WPA3-SAE-CCMP]\");if(s.includes(\"WPA2\")&&s.includes(\"WPA\"))p.push(\"[WPA2-PSK-CCMP+TKIP]\");else if(s.includes(\"WPA2\"))p.push(\"[WPA2-PSK-CCMP]\");if(s.includes(\"WPA\")&&!s.includes(\"WPA2\"))p.push(\"[WPA-PSK-CCMP+TKIP]\");if(s.includes(\"WPS\"))p.push(\"[WPS]\");p.push(\"[ESS]\");return p.join(\"\")};function getIPs(){const i=[];for(const n of Object.values(os.networkInterfaces()))for(const a of n)if(a.family===\"IPv4\"&&!a.internal)i.push(a.address);return i}function parse(raw){const nets=[];let c={};for(const line of raw.split(/\r?\n/)){const l=line.trim();if(l.match(/^SSID \d+\s*:/)&&!l.match(/^BSSID/)){if(c.ssid&&c.bssid)nets.push(c);c={ssid:l.replace(/^SSID \d+\s*:\s*/,\"\").trim(),bssid:\"\",signal:-70,primaryCh:0,freq:2412,bw:20,security:[\"OPEN\"],band:\"2.4\"};}else if(l.match(/^BSSID \d+\s*:/)){c.bssid=l.replace(/^BSSID \d+\s*:\s*/,\"\").trim();}else if(l.match(/^Signal\s*:/) ){const m=l.match(/(\d+)%/);if(m)c.signal=Math.round(parseInt(m[1])/2-100);}else if(l.match(/^Channel\s*:/)){const m=l.match(/:\s*(\d+)/);if(m){c.primaryCh=parseInt(m[1]);c.freq=c.primaryCh<=13?2412+(c.primaryCh-1)*5:5000+c.primaryCh*5;c.band=c.primaryCh>13?\"5\":\"2.4\";}}else if(l.match(/^Authentication\s*:/)){const m=l.match(/:\s*(.+)/);if(m){const a=m[1].trim();c.security=a.includes(\"WPA3\")?[\"WPA3\",\"WPA2\"]:a.includes(\"WPA2\")?[\"WPA2\"]:a.includes(\"WPA\")?[\"WPA\"]:[\"OPEN\"];}}}if(c.ssid&&c.bssid)nets.push(c);const seen=new Set();return nets.filter(n=>{const k=(n.bssid||n.ssid)+n.primaryCh;if(seen.has(k))return false;seen.add(k);return true;}).map(n=>({...n,vendor:vend(n.bssid),dist:dst(n.signal,n.freq),secStr:ss(n.security),freqStart:n.freq-10,freqEnd:n.freq+10,chLabel:String(n.primaryCh),std:n.primaryCh>13?\"5\":\"4\",centerCh:null}));}function scan(){return new Promise(r=>{execFile(\"netsh\",[\"wlan\",\"show\",\"networks\",\"mode=bssid\"],{timeout:12000},(err,out)=>{if(err)return r({networks:[],error:\"\"+err.message,method:\"none\"});const n=parse(out);r({networks:n,method:\"netsh\",count:n.length,error:null});});});}const sv=http.createServer(async(req,res)=>{res.setHeader(\"Access-Control-Allow-Origin\",\"*\");res.setHeader(\"Content-Type\",\"application/json\");if(req.method===\"OPTIONS\"){res.writeHead(200);res.end();return;}if(req.url===\"/api/scan\"||req.url===\"/scan\"){console.log(\"[\"+new Date().toLocaleTimeString()+\"] Scanning...\");const r=await scan();console.log(\"[\"+new Date().toLocaleTimeString()+\"] \"+r.networks.length+\" networks\");res.writeHead(200);res.end(JSON.stringify({...r,timestamp:new Date().toISOString()}));return;}res.writeHead(200);res.end(JSON.stringify({status:\"ok\",agent:\"CAF-WIFI v1.0\"}));});sv.listen(PORT,\"0.0.0.0\",()=>{const ips=getIPs();console.log(\"\n=============================\");console.log(\" CAF-WIFI Agent Running!\");console.log(\"=============================\");console.log(\"\nEnter this URL in the app:\n\");ips.forEach(ip=>console.log(\"  http://\"+ip+\":7788/api/scan\"));console.log(\"\nPhone must be on same WiFi!\");console.log(\"\nCtrl+C to stop\n\");});sv.on(\"error\",e=>{if(e.code===\"EADDRINUSE\")console.error(\"Port 7788 busy!\");else console.error(e);process.exit(1);});'; Set-Content -Encoding UTF8 -Path $env:JS -Value $c" 

echo  Starting...
node "%JS%"
del "%JS%" >nul 2>&1
pause
