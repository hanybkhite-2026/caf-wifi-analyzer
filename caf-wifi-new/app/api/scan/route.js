import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ── IEEE 802.11 exact channel→frequency tables ─────────────────────────────
const CH24 = {1:2412,2:2417,3:2422,4:2427,5:2432,6:2437,7:2442,8:2447,9:2452,10:2457,11:2462,12:2467,13:2472};
const CH5  = {36:5180,40:5200,44:5220,48:5240,52:5260,56:5280,60:5300,64:5320,100:5500,104:5520,108:5540,112:5560,116:5580,120:5600,124:5620,128:5640,132:5660,136:5680,140:5700,149:5745,153:5765,157:5785,161:5805,165:5825};

// OUI vendor lookup (extended)
const OUI = {
  '00:0b:86':'ARUBA NETWORKS','7c:1c:f1':'HUAWEI TECHNOLOGIES','98:da:c4':'TP-LINK TECHNOLOGIES',
  '9e:da:c4':'GENERIC VENDOR','a8:5b:f7':'TP-LINK TECHNOLOGIES','44:e9:68':'HUAWEI TECHNOLOGIES',
  'bc:14:01':'HITRON TECHNOLOGIES','22:cf:30':'ASUSTEK COMP','20:cf:30':'ASUSTEK COMP',
  '68:86:fc':'HITRON TECHNOLOGIES','00:17:f2':'APPLE','b8:27:eb':'RASPBERRY PI',
  '00:50:f2':'MICROSOFT','f8:ff:c2':'CISCO SYSTEMS','00:1a:1e':'CISCO MERAKI',
  'd4:ae:52':'NETGEAR','a0:40:a0':'NETGEAR','c8:b3:73':'UBIQUITI NETWORKS',
  '24:a4:3c':'UBIQUITI NETWORKS','fc:ec:da':'UBIQUITI NETWORKS','00:27:22':'UBIQUITI',
  '4c:5e:0c':'TP-LINK','50:c7:bf':'TP-LINK','b0:4e:26':'TP-LINK',
  '00:11:32':'SYNOLOGY','00:24:a5':'ASUS NETWORKING','10:fe:ed':'ASUS',
};

const getVendor = (mac) => {
  if (!mac) return 'UNKNOWN VENDOR';
  const k = mac.slice(0,8).toLowerCase().replace(/-/g,':');
  return OUI[k] || 'UNKNOWN VENDOR';
};

// freq → channel (reverse)
const freqToChannel = (freq) => {
  for (const [ch, f] of Object.entries({...CH24, ...CH5})) {
    if (f === parseInt(freq)) return parseInt(ch);
  }
  // Fallback calculation
  if (freq >= 2412 && freq <= 2484) return Math.round((freq - 2412) / 5) + 1;
  if (freq >= 5180 && freq <= 5825) return Math.round((freq - 5000) / 5);
  return 0;
};

// dist: free-space path loss (exact WiFiAnalyzer formula)
const calcDist = (rssi, freq) => {
  const exp = (27.55 - (20 * Math.log10(freq)) + Math.abs(rssi)) / 20;
  return Math.round(Math.pow(10, exp) * 10) / 10;
};

// ── Try to detect available WiFi interfaces ────────────────────────────────
async function getWifiInterface() {
  try {
    const { stdout } = await execAsync('iw dev 2>/dev/null | grep Interface | head -1');
    const match = stdout.match(/Interface\s+(\S+)/);
    if (match) return match[1];
  } catch(e) {}
  try {
    const { stdout } = await execAsync('nmcli -t -f DEVICE,TYPE dev 2>/dev/null | grep wifi | head -1');
    const parts = stdout.split(':');
    if (parts[0]) return parts[0].trim();
  } catch(e) {}
  try {
    const { stdout } = await execAsync('ls /sys/class/net/ 2>/dev/null');
    const ifaces = stdout.split('\n').filter(i => i.match(/^wl|^wlan|^wifi/));
    if (ifaces.length > 0) return ifaces[0].trim();
  } catch(e) {}
  return null;
}

// ── Parse nmcli output ────────────────────────────────────────────────────
function parseNmcli(output) {
  const networks = [];
  const lines = output.split('\n').filter(l => l.trim());
  for (const line of lines) {
    // nmcli -t -f SSID,BSSID,MODE,CHAN,FREQ,RATE,SIGNAL,SECURITY dev wifi
    const parts = line.split(':');
    if (parts.length < 8) continue;
    // Handle colons in BSSID
    const ssid = parts[0] || '*hidden*';
    const bssid = parts.slice(1,7).join(':').trim();
    const mode = parts[7] || 'Infra';
    const chan = parseInt(parts[8]) || 0;
    const freqStr = parts[9] || '0';
    const freq = parseInt(freqStr.replace(/[^0-9]/g,'')) * (freqStr.includes('GHz') ? 1000 : 1);
    const signal = parseInt(parts[11]) || 0;
    // nmcli signal is 0-100, convert to dBm: dBm = (signal/2) - 100
    const rssi = Math.round((signal / 2) - 100);
    const security = parts[12] || '';
    networks.push({ ssid: ssid||'*hidden*', bssid, chan, freq: freq||2412, rssi, security, mode });
  }
  return networks;
}

// ── Parse iw scan output ──────────────────────────────────────────────────
function parseIwScan(output) {
  const networks = [];
  const blocks = output.split('BSS ').filter(b => b.trim());
  for (const block of blocks) {
    const mac = (block.match(/^([0-9a-f:]{17})/i)||[])[1] || '';
    const ssidMatch = block.match(/SSID:\s*(.+)/);
    const freqMatch = block.match(/freq:\s*(\d+)/);
    const signalMatch = block.match(/signal:\s*([-\d.]+)/);
    const chanMatch = block.match(/DS Parameter set: channel\s*(\d+)/)||block.match(/\* primary channel:\s*(\d+)/);
    const htMatch = block.match(/HT operation.*?channel:\s*(\d+)/s);
    const secMatch = block.match(/capability:.*?Privacy/);
    const wpaMatch = block.match(/WPA|RSN|WPA2/);
    const ssid = ssidMatch ? ssidMatch[1].trim() : '*hidden*';
    const freq = freqMatch ? parseInt(freqMatch[1]) : 2412;
    const rssi = signalMatch ? Math.round(parseFloat(signalMatch[1])) : -80;
    const chan = chanMatch ? parseInt(chanMatch[1]) : freqToChannel(freq);
    const security = [];
    if (block.includes('WPA2') || block.includes('RSN')) security.push('WPA2');
    if (block.includes('WPA')) security.push('WPA');
    if (block.includes('WPS')) security.push('WPS');
    if (!security.length && secMatch) security.push('WEP');
    if (!security.length && !secMatch) security.push('OPEN');
    // Bandwidth detection
    let bw = 20;
    if (block.includes('VHT channel width: 1')) bw = 80;
    else if (block.includes('VHT channel width: 2')) bw = 160;
    else if (block.match(/channel width:\s*\[HT40/)) bw = 40;
    else if (block.match(/channel width:\s*[48]/)) bw = 40;
    if (!ssid || ssid.includes('\x00')) continue;
    networks.push({ ssid, bssid: mac, chan, freq, rssi, security, bw });
  }
  return networks;
}

// ── Main scan function ────────────────────────────────────────────────────
async function scanWifi(iface) {
  let networks = [];
  let method = 'none';

  // Method 1: nmcli (most reliable, no root needed)
  try {
    const { stdout } = await execAsync(
      `nmcli -t -f SSID,BSSID,MODE,CHAN,FREQ,RATE,SIGNAL,SECURITY dev wifi list --rescan yes 2>/dev/null`,
      { timeout: 15000 }
    );
    if (stdout.trim()) {
      // Parse nmcli terse output
      const lines = stdout.split('\n').filter(l => l.trim());
      for (const line of lines) {
        // nmcli uses backslash to escape colons in BSSID
        // Format: SSID:BSSID:MODE:CHAN:FREQ:RATE:SIGNAL:SECURITY
        // BSSID has colons so we need careful parsing
        const escaped = line.replace(/\\:/g, '\x00');
        const parts = escaped.split(':');
        if (parts.length < 7) continue;
        const ssid = parts[0].replace(/\x00/g,':') || '*hidden*';
        // Reassemble BSSID (6 hex pairs joined by colon)
        // nmcli escapes colons in BSSID as \:
        const bssidRaw = line.match(/([0-9A-Fa-f]{2}\\:[0-9A-Fa-f]{2}\\:[0-9A-Fa-f]{2}\\:[0-9A-Fa-f]{2}\\:[0-9A-Fa-f]{2}\\:[0-9A-Fa-f]{2})/);
        const bssid = bssidRaw ? bssidRaw[1].replace(/\\/g,'') : '';
        // After BSSID, the rest
        const afterBssid = line.slice((bssidRaw?bssidRaw.index+bssidRaw[0].length:0)+1);
        const rest = afterBssid.split(':');
        const chan = parseInt(rest[1]) || 0;
        const freqStr = rest[2] || '0 MHz';
        const freqMhz = parseInt(freqStr) || 2412;
        const signalPct = parseInt(rest[4]) || 0;
        const rssi = signalPct > 0 ? Math.round((signalPct / 2) - 100) : -80;
        const security = (rest[6]||'').split(' ').filter(Boolean);
        const freq = freqMhz < 100 ? freqMhz * 1000 : freqMhz;
        const band = freq >= 5000 ? '5' : freq >= 6000 ? '6' : '2.4';
        networks.push({
          ssid: ssid.trim()||'*hidden*', bssid, chan, freq, rssi,
          security: security.length ? security : ['OPEN'],
          bw: 20, band,
          dist: calcDist(rssi, freq),
          vendor: getVendor(bssid),
        });
      }
      if (networks.length > 0) method = 'nmcli';
    }
  } catch(e) {}

  // Method 2: iw dev scan (needs root or cap_net_admin)
  if (!networks.length && iface) {
    try {
      const { stdout } = await execAsync(`iw dev ${iface} scan 2>/dev/null`, { timeout: 20000 });
      if (stdout.trim()) {
        const parsed = parseIwScan(stdout);
        networks = parsed.map(n => ({
          ...n,
          band: n.freq >= 5000 ? '5' : n.freq >= 6000 ? '6' : '2.4',
          dist: calcDist(n.rssi, n.freq),
          vendor: getVendor(n.bssid),
          security: Array.isArray(n.security) ? n.security : [n.security],
        }));
        if (networks.length > 0) method = 'iw';
      }
    } catch(e) {}
  }

  // Method 3: iwlist (legacy fallback)
  if (!networks.length && iface) {
    try {
      const { stdout } = await execAsync(`iwlist ${iface} scan 2>/dev/null`, { timeout: 15000 });
      if (stdout.includes('ESSID')) {
        const cells = stdout.split(/Cell \d+/).filter(c => c.includes('ESSID'));
        for (const cell of cells) {
          const ssid = (cell.match(/ESSID:"([^"]*)"/)||[])[1] || '*hidden*';
          const mac  = (cell.match(/Address:\s*([0-9A-Fa-f:]{17})/)||[])[1] || '';
          const freq = parseInt((cell.match(/Frequency:(\d+\.\d+)/)||[])[1]?.replace('.','') || '2412');
          const chan = parseInt((cell.match(/Channel:\s*(\d+)/)||[])[1] || freqToChannel(freq));
          const sig  = parseInt((cell.match(/Signal level=(-?\d+)/)||[])[1] || '-80');
          const enc  = cell.includes('WPA2') ? ['WPA2'] : cell.includes('WPA') ? ['WPA'] : cell.includes('WEP') ? ['WEP'] : ['OPEN'];
          const freqMhz = freq < 100 ? freq * 1000 : freq;
          networks.push({
            ssid, bssid: mac, chan, freq: freqMhz, rssi: sig, security: enc, bw: 20,
            band: freqMhz >= 5000 ? '5' : '2.4',
            dist: calcDist(sig, freqMhz), vendor: getVendor(mac),
          });
        }
        if (networks.length > 0) method = 'iwlist';
      }
    } catch(e) {}
  }

  return { networks, method, iface };
}

// ── Enrich network data ───────────────────────────────────────────────────
function enrichNetwork(n, index) {
  const freq = n.freq || 2412;
  const rssi = n.rssi || -70;
  const bw = n.bw || 20;
  const ch = n.chan || freqToChannel(freq);
  const band = freq >= 5945 ? '6' : freq >= 5180 ? '5' : '2.4';
  // Security string matching Android ScanResult format
  const secs = Array.isArray(n.security) ? n.security : [n.security||'OPEN'];
  const secParts = [];
  if (secs.includes('WPA3') || secs.includes('SAE')) secParts.push('[WPA3-SAE-CCMP]');
  if (secs.includes('WPA2') && secs.includes('WPA')) secParts.push('[WPA2-PSK-CCMP+TKIP]');
  else if (secs.includes('WPA2')) secParts.push('[WPA2-PSK-CCMP]');
  if (secs.includes('WPA') && !secs.includes('WPA2')) secParts.push('[WPA-PSK-CCMP+TKIP]');
  if (secs.includes('WPS')) secParts.push('[WPS]');
  if (secs.includes('WEP')) secParts.push('[WEP]');
  if (!secs.includes('WEP') && !secs.includes('WPA') && !secs.includes('WPA2') && !secs.includes('WPA3')) secParts.push('[ESS]');
  else secParts.push('[ESS]');
  const secStr = secParts.join('');
  // WiFi standard detection
  let std = '4'; // n by default
  if (secs.includes('WPA3') || (bw >= 80 && freq >= 5180)) std = '6';
  else if (bw >= 80 || freq >= 5180) std = '5';
  const colors = ['#2196f3','#4caf50','#9c27b0','#ff9800','#f44336','#00bcd4','#8bc34a','#e91e63','#ff5722','#607d8b'];
  return {
    id: `${n.bssid||n.ssid}_${ch}`,
    ssid: n.ssid || '*hidden*',
    mac: n.bssid || '00:00:00:00:00:00',
    signal: rssi,
    primaryCh: ch,
    centerCh: null,
    freq,
    freqStart: freq - bw/2,
    freqEnd: freq + bw/2,
    bw,
    band,
    std,
    security: secs,
    secStr,
    vendor: n.vendor || getVendor(n.bssid || ''),
    dist: calcDist(rssi, freq),
    connected: false,
    color: colors[index % colors.length],
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'scan';

  if (action === 'interfaces') {
    // Return available WiFi interfaces
    try {
      const { stdout } = await execAsync('iw dev 2>/dev/null | grep -E "Interface|phy#"');
      const interfaces = [];
      const lines = stdout.split('\n');
      let phy = '';
      for (const line of lines) {
        const phyMatch = line.match(/phy#(\d+)/);
        if (phyMatch) phy = 'phy' + phyMatch[1];
        const ifMatch = line.match(/Interface\s+(\S+)/);
        if (ifMatch) interfaces.push({ name: ifMatch[1], phy });
      }
      // Also try nmcli
      try {
        const { stdout: nm } = await execAsync('nmcli -t -f DEVICE,TYPE dev 2>/dev/null');
        const wifiIfaces = nm.split('\n')
          .filter(l => l.includes(':wifi'))
          .map(l => ({ name: l.split(':')[0].trim(), phy: 'unknown' }));
        for (const wi of wifiIfaces) {
          if (!interfaces.find(i => i.name === wi.name)) interfaces.push(wi);
        }
      } catch(e) {}
      return Response.json({ interfaces, error: null });
    } catch(e) {
      return Response.json({ interfaces: [], error: e.message });
    }
  }

  // Scan action
  try {
    const iface = await getWifiInterface();
    const { networks, method } = await scanWifi(iface);
    const enriched = networks.map((n, i) => enrichNetwork(n, i));
    // Deduplicate by MAC
    const seen = new Set();
    const unique = enriched.filter(n => {
      const key = n.mac + n.primaryCh;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return Response.json({
      networks: unique,
      method,
      iface: iface || 'none',
      timestamp: new Date().toISOString(),
      count: unique.length,
      error: unique.length === 0 ? 'No networks found. WiFi adapter may not be available in this environment.' : null,
    });
  } catch (error) {
    return Response.json({
      networks: [],
      method: 'error',
      error: error.message,
      iface: null,
      timestamp: new Date().toISOString(),
      count: 0,
    });
  }
}
