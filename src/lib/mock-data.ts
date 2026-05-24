export interface NetworkScan {
  id: string;
  ssid: string;
  networkType: 'Main' | 'Guest' | 'IoT' | 'Admin' | 'Backup';
  signalStrength: number;
  channel: number;
  clientsConnected: number;
  frequencyBand: '2.4GHz' | '5GHz' | '6GHz';
  encryption: string;
  location: string;
  interferenceScore: number;
  bandwidthMbps: number;
  vendor?: string;
  macAddress?: string;
}

export const MOCK_NETWORKS: NetworkScan[] = [
  { id: '1', ssid: 'CAF-WIFI-5G', networkType: 'Main', signalStrength: -45, channel: 36, clientsConnected: 15, frequencyBand: '5GHz', encryption: 'WPA3', location: 'Floor 1, Office A', interferenceScore: 1, bandwidthMbps: 850, vendor: 'Aruba Networks', macAddress: '00:0B:86:12:34:56' },
  { id: '2', ssid: 'CAF-WIFI-2G', networkType: 'Main', signalStrength: -58, channel: 6, clientsConnected: 22, frequencyBand: '2.4GHz', encryption: 'WPA3', location: 'Floor 1, Lobby', interferenceScore: 4, bandwidthMbps: 150, vendor: 'Aruba Networks', macAddress: '00:0B:86:78:90:AB' },
  { id: '3', ssid: 'CAF-GUEST', networkType: 'Guest', signalStrength: -65, channel: 52, clientsConnected: 8, frequencyBand: '5GHz', encryption: 'WPA2', location: 'Floor 1, Cafeteria', interferenceScore: 2, bandwidthMbps: 300, vendor: 'Aruba Networks', macAddress: '00:0B:86:CD:EF:01' },
  { id: '4', ssid: 'CAF-IoT', networkType: 'IoT', signalStrength: -70, channel: 1, clientsConnected: 32, frequencyBand: '2.4GHz', encryption: 'WPA2', location: 'Basement, Utility', interferenceScore: 8, bandwidthMbps: 50, vendor: 'Cisco', macAddress: '00:11:22:33:44:55' },
  { id: '5', ssid: 'CAF-ADMIN', networkType: 'Admin', signalStrength: -50, channel: 128, clientsConnected: 5, frequencyBand: '5GHz', encryption: 'WPA3-Enterprise', location: 'Floor 2, Exec', interferenceScore: 1, bandwidthMbps: 900, vendor: 'Aruba Networks', macAddress: '00:0B:86:44:55:66' },
  { id: '6', ssid: 'CAF-BACKUP', networkType: 'Backup', signalStrength: -72, channel: 11, clientsConnected: 3, frequencyBand: '2.4GHz', encryption: 'WPA3', location: 'Floor 2, Server Room', interferenceScore: 5, bandwidthMbps: 100, vendor: 'Ubiquiti', macAddress: '24:5A:4C:99:88:77' },
];

export const WEEKLY_ACTIVITY = [
  { name: 'Mon', scans: 45, events: 12 },
  { name: 'Tue', scans: 52, events: 18 },
  { name: 'Wed', scans: 38, events: 10 },
  { name: 'Thu', scans: 65, events: 25 },
  { name: 'Fri', scans: 48, events: 15 },
  { name: 'Sat', scans: 24, events: 8 },
  { name: 'Sun', scans: 18, events: 5 },
];

export const SPEED_HISTORY = [
  { time: '10:00', download: 450, upload: 200, ping: 12 },
  { time: '12:00', download: 380, upload: 180, ping: 15 },
  { time: '14:00', download: 520, upload: 240, ping: 10 },
  { time: '16:00', download: 410, upload: 190, ping: 14 },
  { time: '18:00', download: 490, upload: 210, ping: 11 },
  { time: '20:00', download: 430, upload: 200, ping: 13 },
  { time: '22:00', download: 460, upload: 220, ping: 12 },
];

export const TEAM_MEMBERS = [
  { id: '1', name: 'Alex Johnson', scans: 145, status: 'Active', role: 'Senior Tech' },
  { id: '2', name: 'Maria Garcia', scans: 89, status: 'Active', role: 'Network Admin' },
  { id: '3', name: 'Sam Wilson', scans: 212, status: 'On Leave', role: 'Support Specialist' },
  { id: '4', name: 'Jordan Lee', scans: 56, status: 'Active', role: 'Junior Tech' },
];

export const REPORTS = [
  { id: 'REP-001', location: 'Main Campus - Wing A', date: '2024-05-15', networks: 12, cafAps: 5, avgSignal: -52 },
  { id: 'REP-002', location: 'Basement Storage', date: '2024-05-18', networks: 8, cafAps: 2, avgSignal: -68 },
  { id: 'REP-003', location: 'Executive Suite', date: '2024-05-20', networks: 15, cafAps: 8, avgSignal: -45 },
];
