"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Header } from "@/components/layout/header";
import { DashboardTab } from "@/components/dashboard/dashboard-tab";
import { ScannerTab } from "@/components/scanner/scanner-tab";
import { AnalyticsTab } from "@/components/analytics/analytics-tab";
import { ReportsTab } from "@/components/reports/reports-tab";
import { AdminTab } from "@/components/admin/admin-tab";
import { SettingsTab } from "@/components/settings/settings-tab";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-body">
      {/* Navigation Sidebar */}
      <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header theme={theme} toggleTheme={toggleTheme} activeTab={activeTab} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="dashboard" className="mt-0 outline-none">
              <DashboardTab />
            </TabsContent>
            <TabsContent value="scanner" className="mt-0 outline-none">
              <ScannerTab />
            </TabsContent>
            <TabsContent value="analytics" className="mt-0 outline-none">
              <AnalyticsTab />
            </TabsContent>
            <TabsContent value="reports" className="mt-0 outline-none">
              <ReportsTab />
            </TabsContent>
            <TabsContent value="admin" className="mt-0 outline-none">
              <AdminTab />
            </TabsContent>
            <TabsContent value="settings" className="mt-0 outline-none">
              <SettingsTab theme={theme} toggleTheme={toggleTheme} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
