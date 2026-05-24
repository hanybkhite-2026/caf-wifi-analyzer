
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Header } from "@/components/layout/header";
import { DashboardTab } from "@/components/dashboard/dashboard-tab";
import { ScannerTab } from "@/components/scanner/scanner-tab";
import { AnalyticsTab } from "@/components/analytics/analytics-tab";
import { ReportsTab } from "@/components/reports/reports-tab";
import { AdminTab } from "@/components/admin/admin-tab";
import { SettingsTab } from "@/components/settings/settings-tab";
import { AboutTab } from "@/components/about/about-tab";
import { ChannelRatingTab } from "@/components/dashboard/channel-rating-tab";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("access-points");
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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

  if (loading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-body">
      <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header theme={theme} toggleTheme={toggleTheme} activeTab={activeTab} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="access-points" className="mt-0 outline-none">
              <ScannerTab />
            </TabsContent>
            <TabsContent value="channel-rating" className="mt-0 outline-none">
              <ChannelRatingTab />
            </TabsContent>
            <TabsContent value="channel-graph" className="mt-0 outline-none">
              <DashboardTab />
            </TabsContent>
            <TabsContent value="time-graph" className="mt-0 outline-none">
              <AnalyticsTab />
            </TabsContent>
            <TabsContent value="export" className="mt-0 outline-none">
              <ReportsTab />
            </TabsContent>
            <TabsContent value="vendors" className="mt-0 outline-none">
              <AdminTab />
            </TabsContent>
            <TabsContent value="settings" className="mt-0 outline-none">
              <SettingsTab theme={theme} toggleTheme={toggleTheme} />
            </TabsContent>
            <TabsContent value="about" className="mt-0 outline-none">
              <AboutTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
