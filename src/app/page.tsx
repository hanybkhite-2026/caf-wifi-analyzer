'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wifi, Sun, Moon, Settings, BarChart3, Network, TrendingUp, 
  Activity, Zap, Volume2, VolumeX, LogOut, Mail, Lock, 
  Globe, Gauge, Loader2, Eye, EyeOff, Signal, Router, 
  ShieldCheck, Crosshair, MapPin, Play, X, FileText, Smartphone, Monitor, 
  Layers, AlertTriangle, UserPlus, CheckCircle2, Clock, MoreVertical, 
  Trash2, Filter, Sparkles, ChevronRight, Download, Search, BadgeAlert, User,
  Radio, LayoutDashboard, FileUp, Users, Info
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Components
import { DashboardTab } from "@/components/dashboard/dashboard-tab";
import { ScannerTab } from "@/components/scanner/scanner-tab";
import { AnalyticsTab } from "@/components/analytics/analytics-tab";
import { ReportsTab } from "@/components/reports/reports-tab";
import { AdminTab } from "@/components/admin/admin-tab";
import { SettingsTab } from "@/components/settings/settings-tab";
import { AboutTab } from "@/components/about/about-tab";
import { ChannelRatingTab } from "@/components/dashboard/channel-rating-tab";

export default function CAFWiFiAnalyzer() {
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('admin@caf.com');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');

  // App State
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('access-points');
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const tabs = [
    { id: "access-points", label: "Access Points", icon: Radio },
    { id: "channel-rating", label: "Channel Rating", icon: Signal },
    { id: "channel-graph", label: "Channel Graph", icon: LayoutDashboard },
    { id: "time-graph", label: "Time Graph", icon: LineChart },
    { id: "export", label: "Export", icon: FileUp },
    { id: "vendors", label: "Vendors", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "about", label: "About", icon: Info },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@caf.com' && password === 'admin123') {
      setIsAuthenticated(true);
      toast({ title: "System Initialized", description: "Operational mode active." });
    } else {
      setLoginError('Invalid security key. Use: admin@caf.com / admin123');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('access-points');
  };

  if (!isMounted) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-headline">
        <div className="w-full max-w-md bg-slate-900/50 rounded-2xl shadow-2xl p-8 border border-slate-800">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 rounded-2xl p-4 shadow-lg shadow-blue-500/20">
              <Wifi className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-1 text-white">NetPulse CAF</h1>
          <p className="text-center text-gray-400 mb-8 text-sm">Enterprise Infrastructure Analyzer</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Technician Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-blue-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-blue-500 text-sm" />
              </div>
            </div>
            {loginError && <div className="text-red-400 text-xs text-center font-bold uppercase tracking-tighter">{loginError}</div>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 text-sm uppercase tracking-widest">
              Access Infrastructure
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'} font-body transition-colors duration-300`}>
      <div className="flex">
        {/* Sidebar Nav */}
        <aside className={`w-20 lg:w-64 border-r ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'} h-screen sticky top-0 flex flex-col hidden md:flex`}>
          <div className="p-6 border-b border-inherit">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Wifi className="text-white w-6 h-6" />
              </div>
              <span className="font-headline font-bold text-lg hidden lg:block tracking-tight">NetPulse CAF</span>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
            {tabs.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : `text-slate-500 ${darkMode ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'}`
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-bold text-xs uppercase tracking-widest hidden lg:block">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-6 border-t border-inherit">
            <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-red-500 ${darkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
              <LogOut className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-widest hidden lg:block">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* Top Header */}
          <header className={`h-16 border-b flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-md ${darkMode ? 'bg-[#0f172a]/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                {tabs.find(t => t.id === activeTab)?.label || "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Aruba Analysis Mode
              </div>
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg transition-all ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}>
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-y-auto no-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
              {activeTab === 'access-points' && <ScannerTab />}
              {activeTab === 'channel-rating' && <ChannelRatingTab />}
              {activeTab === 'channel-graph' && <DashboardTab />}
              {activeTab === 'time-graph' && <AnalyticsTab />}
              {activeTab === 'export' && <ReportsTab />}
              {activeTab === 'vendors' && <AdminTab />}
              {activeTab === 'settings' && <SettingsTab theme={darkMode ? 'dark' : 'light'} toggleTheme={() => setDarkMode(!darkMode)} />}
              {activeTab === 'about' && <AboutTab />}
            </div>
          </main>

          {/* Footer Status Bar */}
          <footer className={`h-10 border-t flex items-center justify-between px-8 text-[9px] font-mono tracking-widest uppercase transition-colors ${darkMode ? 'bg-[#0f172a] border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
            <div className="flex gap-8">
              <span>SYSTEM: v3.6.0-ENTERPRISE-PROD</span>
              <span className="text-green-500 font-bold">STATE: SECURE@OPS</span>
            </div>
            <div className="hidden sm:flex gap-8">
              <span>ENCRYPTION: AES-256-FIPS</span>
              <span>ENGINE: NETPULSE-X-ARUBA</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
