'use client';

import React, { useState } from 'react';
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

export default function CAFWiFiAnalyzer() {
  const [activeTab, setActiveTab] = useState('access-points');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'access-points':
        return <DashboardTab />;
      case 'scanner':
        return <ScannerTab />;
      case 'channel-rating':
        return <ChannelRatingTab />;
      case 'channel-graph':
        return <DashboardTab />;
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
        return <DashboardTab />;
    }
  };

  return (
    <div className={`flex h-screen bg-dark-900 text-white font-body ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Sidebar - Persistent for Enterprise Layout */}
      <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header theme={theme} toggleTheme={toggleTheme} activeTab={activeTab} />
        
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>

        {/* System Status Footer Bar */}
        <footer className="h-8 border-t border-border bg-card/20 backdrop-blur-sm px-6 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <div className="flex gap-4">
            <span>SYSTEM: v3.0.0-ENTERPRISE</span>
            <span className="text-green-500">ENGINE: ARUBA-OS-V8</span>
          </div>
          <div className="flex gap-4">
            <span>REGION: US-EAST-1</span>
            <span>ENCRYPTION: AES-256-WPA3</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
