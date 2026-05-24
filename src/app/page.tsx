'use client';

import React, { useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Wifi, Sun, Moon, Settings, BarChart3, Network, TrendingUp, Activity, Zap } from 'lucide-react';

export default function CAFWiFiAnalyzer() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock Data
  const signalData = [
    { network: 'CAF-WIFI-5G', strength: 85 },
    { network: 'CAF-WIFI-2G', strength: 72 },
    { network: 'CAF-GUEST', strength: 68 },
    { network: 'CAF-IoT', strength: 55 },
    { network: 'CAF-ADMIN', strength: 92 },
    { network: 'CAF-BACKUP', strength: 48 }
  ];

  const networkTypes = [
    { name: 'Main', value: 2, color: '#3b82f6' },
    { name: 'Guest', value: 1, color: '#10b981' },
    { name: 'IoT', value: 1, color: '#f59e0b' }
  ];

  const speedData = [
    { time: '10:00', download: 450, upload: 180 },
    { time: '12:00', download: 480, upload: 200 },
    { time: '14:00', download: 420, upload: 160 },
    { time: '16:00', download: 510, upload: 220 },
    { time: '18:00', download: 490, upload: 190 },
    { time: '20:00', download: 520, upload: 210 }
  ];

  const weeklyData = [
    { day: 'Mon', scans: 45, networks: 34 },
    { day: 'Tue', scans: 52, networks: 38 },
    { day: 'Wed', scans: 48, networks: 35 },
    { day: 'Thu', scans: 61, networks: 42 },
    { day: 'Fri', scans: 55, networks: 39 },
    { day: 'Sat', scans: 38, networks: 28 },
    { day: 'Sun', scans: 32, networks: 24 }
  ];

  const radarData = [
    { metric: 'Coverage', value: 85 },
    { metric: 'Speed', value: 92 },
    { metric: 'Security', value: 88 },
    { metric: 'Stability', value: 90 },
    { metric: 'Reliability', value: 86 }
  ];

  const discoveredNetworks = [
    { ssid: 'CAF-WIFI-5G', signal: -45, channel: 36, clients: 15, band: '5GHz', encryption: 'WPA3' },
    { ssid: 'CAF-WIFI-2G', signal: -58, channel: 6, clients: 22, band: '2.4GHz', encryption: 'WPA3' },
    { ssid: 'CAF-GUEST', signal: -65, channel: 52, clients: 8, band: '5GHz', encryption: 'WPA2' },
    { ssid: 'CAF-IoT', signal: -70, channel: 1, clients: 32, band: '2.4GHz', encryption: 'WPA2' },
    { ssid: 'CAF-ADMIN', signal: -50, channel: 128, clients: 5, band: '5GHz', encryption: 'WPA3-Enterprise' },
    { ssid: 'CAF-BACKUP', signal: -72, channel: 11, clients: 3, band: '2.4GHz', encryption: 'WPA3' }
  ];

  const teamMembers = [
    { name: 'Alex Johnson', role: 'Senior Tech', scans: 145, status: 'Active', performance: 88 },
    { name: 'Maria Garcia', role: 'Network Admin', scans: 89, status: 'Active', performance: 96 },
    { name: 'Sam Wilson', role: 'Support Specialist', scans: 212, status: 'On Leave', performance: 85 },
    { name: 'Jordan Lee', role: 'Junior Tech', scans: 56, status: 'Active', performance: 72 }
  ];

  const reports = [
    { id: 'REP-001', location: 'Main Campus - Wing A', date: '2024-05-15', networks: 12, avgSignal: -52 },
    { id: 'REP-002', location: 'Basement Storage', date: '2024-05-18', networks: 8, avgSignal: -68 },
    { id: 'REP-003', location: 'Executive Suite', date: '2024-05-20', networks: 15, avgSignal: -45 }
  ];

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'scanner', label: 'Scanner', icon: Network },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: Activity },
    { id: 'admin', label: 'Admin', icon: Settings },
    { id: 'settings', label: 'Settings', icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-700 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Wifi className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl md:text-3xl font-bold">CAF-WIFI Analyzer</h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
              title="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="btn btn-primary text-sm flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-t border-dark-700 bg-dark-900 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 flex gap-8">
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${isActive ? 'nav-button-active' : 'nav-button'} flex items-center gap-2 py-4`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'CAF Networks', value: '6', change: '+2.5%', icon: '📡' },
                { label: 'Active APs', value: '18', change: '+2.5%', icon: '🛜' },
                { label: 'Avg Signal', value: '-52 dBm', change: '+2.5%', icon: '📶' },
                { label: 'Network Health', value: '98%', change: '+2.5%', icon: '❤️' }
              ].map((stat, i) => (
                <div key={i} className="card hover:border-dark-600 transition-colors">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-sm text-gray-400 mb-2">{stat.label}</div>
                  <div className="text-3xl font-bold mb-2">{stat.value}</div>
                  <div className="text-sm text-green-500">{stat.change}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Signal Strength Comparison</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={signalData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="network" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                      <Bar dataKey="strength" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Network Type Distribution</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={networkTypes} cx="50%" cy="50%" labelLine={false} label={{ fill: '#fff' }} dataKey="value">
                        {networkTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Network Performance (Radar)</h3>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Radar name="Performance" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Legend />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Scanner Tab */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Network className="w-5 h-5" /> Network Scanner
              </h3>
              <div className="mb-4">
                <label className="block text-sm mb-2 font-medium">Scan Location</label>
                <input
                  type="text"
                  placeholder="e.g., Floor 1, Conference Room A"
                  className="input"
                />
              </div>
              <button className="btn btn-primary w-full sm:w-auto">Start Network Scan</button>
            </div>

            <div className="card overflow-x-auto">
              <h3 className="text-lg font-semibold mb-4">Discovered Networks</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dark-700 border-b border-dark-600">
                    <th className="px-4 py-2 text-left font-semibold">SSID</th>
                    <th className="px-4 py-2 text-left font-semibold">Signal</th>
                    <th className="px-4 py-2 text-left font-semibold">Channel</th>
                    <th className="px-4 py-2 text-left font-semibold">Clients</th>
                    <th className="px-4 py-2 text-left font-semibold">Band</th>
                    <th className="px-4 py-2 text-left font-semibold">Encryption</th>
                  </tr>
                </thead>
                <tbody>
                  {discoveredNetworks.map((network, i) => (
                    <tr key={i} className="border-b border-dark-700 hover:bg-dark-700 transition-colors">
                      <td className="px-4 py-2 font-semibold">{network.ssid}</td>
                      <td className="px-4 py-2 text-green-400">{network.signal} dBm</td>
                      <td className="px-4 py-2">{network.channel}</td>
                      <td className="px-4 py-2">{network.clients}</td>
                      <td className="px-4 py-2">{network.band}</td>
                      <td className="px-4 py-2">{network.encryption}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Speed Test History</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={speedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                    <Legend />
                    <Line type="monotone" dataKey="download" stroke="#3b82f6" name="Download (Mbps)" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                    <Line type="monotone" dataKey="upload" stroke="#10b981" name="Upload (Mbps)" strokeWidth={2} dot={{ fill: '#10b981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Weekly Activity Trends</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                    <Legend />
                    <Area type="monotone" dataKey="scans" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="networks" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="card overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Scan Reports
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-dark-700 border-b border-dark-600">
                  <th className="px-4 py-2 text-left font-semibold">Report ID</th>
                  <th className="px-4 py-2 text-left font-semibold">Location</th>
                  <th className="px-4 py-2 text-left font-semibold">Date</th>
                  <th className="px-4 py-2 text-left font-semibold">Networks</th>
                  <th className="px-4 py-2 text-left font-semibold">Avg Signal</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, i) => (
                  <tr key={i} className="border-b border-dark-700 hover:bg-dark-700 transition-colors">
                    <td className="px-4 py-2 font-semibold text-blue-400">{report.id}</td>
                    <td className="px-4 py-2">{report.location}</td>
                    <td className="px-4 py-2">{report.date}</td>
                    <td className="px-4 py-2">{report.networks} detected</td>
                    <td className="px-4 py-2 text-green-400">{report.avgSignal} dBm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card">
                <div className="text-2xl mb-2">🔒</div>
                <div className="text-sm text-gray-400 mb-2">Security Events</div>
                <div className="text-3xl font-bold">0</div>
                <div className="text-sm text-green-500 mt-2">All systems secured</div>
              </div>
              <div className="card">
                <div className="text-2xl mb-2">📈</div>
                <div className="text-sm text-gray-400 mb-2">Org Monthly Scans</div>
                <div className="text-3xl font-bold">1,248</div>
                <div className="text-sm text-gray-400 mt-2">On track for target</div>
              </div>
              <div className="card">
                <div className="text-2xl mb-2">⏱️</div>
                <div className="text-sm text-gray-400 mb-2">System Uptime</div>
                <div className="text-3xl font-bold">99.98%</div>
                <div className="text-sm text-gray-400 mt-2">Last incident: 24 days ago</div>
              </div>
            </div>

            <div className="card overflow-x-auto">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" /> Team Members
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dark-700 border-b border-dark-600">
                    <th className="px-4 py-2 text-left font-semibold">Member</th>
                    <th className="px-4 py-2 text-left font-semibold">Role</th>
                    <th className="px-4 py-2 text-left font-semibold">Scans</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-left font-semibold">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member, i) => (
                    <tr key={i} className="border-b border-dark-700 hover:bg-dark-700 transition-colors">
                      <td className="px-4 py-2 font-semibold">{member.name}</td>
                      <td className="px-4 py-2">{member.role}</td>
                      <td className="px-4 py-2">{member.scans}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          member.status === 'Active' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">{member.performance}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" /> Appearance & Preferences
              </h3>
              <div className="flex items-center justify-between">
                <span className="font-medium">Dark Mode</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">ℹ️ System Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">App Version</span>
                  <span className="font-semibold">v3.0.0 Enterprise</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Database</span>
                  <span className="font-semibold">Firebase Firestore</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Supported Standards</span>
                  <span className="font-semibold">WiFi 6E, WiFi 6, WPA3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Deployment</span>
                  <span className="font-semibold">Vercel + Firebase</span>
                </div>
              </div>
            </div>

            <div className="card text-center">
              <p className="text-sm text-gray-400">
                © 2024 CAF-WIFI Operations | NetPulse Infrastructure
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Professional Enterprise WiFi Management System
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
