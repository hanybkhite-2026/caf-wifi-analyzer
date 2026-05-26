'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Wifi, Menu, X } from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [tab, setTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      alert('Wrong password!');
    }
  };

  const bg = darkMode ? 'bg-slate-950 text-white' : 'bg-white text-black';
  const card = darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-300';
  const header = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-slate-300';

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center`}>
        <div className={`${card} border rounded-lg p-8 max-w-sm w-full`}>
          <div className="text-center mb-6">
            <Wifi className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h1 className="text-2xl font-bold">NetPulse CAF</h1>
            <p className="text-sm opacity-60 mt-2">WiFi Analyzer v3.0.0</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className={`w-full p-2 rounded border ${darkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'}`} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={`w-full p-2 rounded border ${darkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'}`} />
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded">Login</button>
          </form>
          <p className="text-xs text-center mt-4 opacity-50">admin / admin123</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} flex`}>
      <aside className={`${header} border-r w-48 p-4 ${sidebarOpen ? 'block' : 'hidden'} md:block`}>
        <div className="flex items-center gap-3 mb-8">
          <Wifi className="w-6 h-6 text-blue-500" />
          <div>
            <h1 className="font-bold">NetPulse</h1>
            <p className="text-xs opacity-60">Analyzer</p>
          </div>
        </div>
        <nav className="space-y-2 mb-8">
          {['home', 'channels', 'reports', 'team', 'settings'].map((t) => (
            <button key={t} onClick={() => { setTab(t); setSidebarOpen(false); }} className={`w-full text-left px-3 py-2 rounded text-sm font-bold transition ${tab === t ? 'bg-blue-600 text-white' : 'hover:bg-blue-500/20'}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </nav>
        <button onClick={() => setIsLoggedIn(false)} className="w-full py-2 text-red-500 text-sm font-bold">LOGOUT</button>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className={`${header} border-b sticky top-0 p-4 flex justify-between items-center`}>
          <h2 className="text-xl font-bold">{tab.toUpperCase()}</h2>
          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="text-2xl">{darkMode ? '☀️' : '🌙'}</button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden">{sidebarOpen ? <X /> : <Menu />}</button>
          </div>
        </header>

        <div className="p-6">
          {tab === 'home' && (
            <div className={`${card} border rounded-lg p-6`}>
              <h3 className="text-lg font-bold mb-4 text-blue-400">📊 LIVE DASHBOARD</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[{ label: 'Networks', value: '6' }, { label: 'APs Online', value: '18' }, { label: 'Avg Signal', value: '-52 dBm' }, { label: 'Health', value: '98%' }].map((s) => (
                  <div key={s.label} className={`${darkMode ? 'bg-slate-800' : 'bg-slate-200'} p-4 rounded text-center`}>
                    <div className="text-2xl font-bold text-blue-400">{s.value}</div>
                    <div className="text-xs opacity-60 mt-2">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className={`border ${darkMode ? 'border-blue-500/30' : 'border-blue-300'} rounded p-4`}>
                <h4 className="font-bold mb-2">CAF-WIFI-5G</h4>
                <p className="text-sm opacity-60">Signal: -45 dBm | Channel: 36 | Speed: 850 Mbps</p>
              </div>
            </div>
          )}
          {tab === 'channels' && (
            <div className={`${card} border rounded-lg p-6`}>
              <h3 className="text-lg font-bold mb-4">📡 CHANNELS</h3>
              {['CAF-WIFI-5G', 'CAF-WIFI-2G', 'CAF-GUEST', 'VTEL-Fiber', 'Mamon2_5G', '*hidden*'].map((name) => (
                <div key={name} className="p-3 border border-slate-700 rounded mb-2 flex justify-between">
                  <span className="font-bold text-sm">{name}</span>
                  <span className="text-yellow-500 text-sm">-{Math.floor(Math.random() * 40 + 45)} dBm</span>
                </div>
              ))}
            </div>
          )}
          {tab === 'reports' && (
            <div className={`${card} border rounded-lg p-6`}>
              <h3 className="text-lg font-bold mb-4">📄 REPORTS</h3>
              {['Main Campus', 'Basement', 'Executive Suite'].map((r) => (
                <div key={r} className="p-4 border border-slate-700 rounded mb-2">
                  <div className="font-bold text-sm">{r}</div>
                  <div className="text-xs opacity-60 mt-1">12 networks • -52 dBm avg</div>
                </div>
              ))}
            </div>
          )}
          {tab === 'team' && (
            <div className={`${card} border rounded-lg p-6`}>
              <h3 className="text-lg font-bold mb-4">👥 TEAM</h3>
              {[{ name: 'Alex Johnson', role: 'Senior Tech' }, { name: 'Maria Garcia', role: 'Network Admin' }, { name: 'Sam Wilson', role: 'Support' }].map((u) => (
                <div key={u.name} className="p-3 border border-slate-700 rounded mb-2">
                  <div className="font-bold text-sm">{u.name}</div>
                  <div className="text-xs opacity-60">{u.role}</div>
                </div>
              ))}
            </div>
          )}
          {tab === 'settings' && (
            <div className={`${card} border rounded-lg p-6`}>
              <h3 className="text-lg font-bold mb-4">⚙️ SETTINGS</h3>
              <div className="space-y-3 text-sm opacity-70">
                <div>Version: v3.0.0 Enterprise</div>
                <div>Database: Firebase Firestore</div>
                <div>Status: ✅ Connected</div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
