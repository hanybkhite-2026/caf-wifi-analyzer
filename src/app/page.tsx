'use client';

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { DashboardTab } from '@/components/dashboard/dashboard-tab';
import { ScannerTab } from '@/components/scanner/scanner-tab';
import { AnalyticsTab } from '@/components/analytics/analytics-tab';
import { ReportsTab } from '@/components/reports/reports-tab';
import { AdminTab } from '@/components/admin/admin-tab';
import { SettingsTab } from '@/components/settings/settings-tab';
import { AboutTab } from '@/components/about/about-tab';
import { ChannelRatingTab } from '@/components/dashboard/channel-rating-tab';

/**
 * CAFWiFiAnalyzer - Final Enterprise V3.0.0
 * The main entry point for the WiFi Analysis Infrastructure.
 */
export default function CAFWiFiAnalyzer() {
  const [activeTab, setActiveTab] = useState('access-points');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Sync theme with document class for Tailwind dark mode
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'channel-graph':
        return <DashboardTab />;
      case 'access-points':
        return <ScannerTab />;
      case 'channel-rating':
        return <ChannelRatingTab />;
      case 'time-graph':
        return <AnalyticsTab />;
      case 'export':
        return <ReportsTab />;
      case 'vendors':
        return <AdminTab />;
      case 'settings':
        return <SettingsTab theme={theme} toggleTheme={toggleTheme} />;
      case 'about':
        return <AboutTab />;
      default:
        return <ScannerTab />;
    }
  };

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'dark bg-[#0f172a]' : 'bg-slate-50'}`}>
      {/* Fixed Sidebar for Enterprise Navigation */}
      <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header theme={theme} toggleTheme={toggleTheme} activeTab={activeTab} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>

        {/* Enterprise Status Bar */}
        <footer className="h-8 border-t border-border bg-card/30 flex items-center justify-between px-6 text-[10px] font-mono tracking-widest uppercase text-muted-foreground shrink-0">
          <div className="flex gap-6">
            <span>SYSTEM: v3.0.0-PROD</span>
            <span className="text-green-500 font-bold">STATE: OPERATIONAL</span>
          </div>
          <div className="hidden sm:flex gap-6">
            <span>ENCRYPTION: AES-256-FIPS</span>
            <span>REGION: US-EAST-1</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
