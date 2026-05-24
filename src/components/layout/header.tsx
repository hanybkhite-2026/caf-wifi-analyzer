
"use client";

import { Moon, Sun, Bell, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeTab: string;
}

export function Header({ theme, toggleTheme, activeTab }: HeaderProps) {
  const titles: Record<string, string> = {
    "access-points": "Access Points Discovery",
    "channel-rating": "Channel Ratings & Health",
    "channel-graph": "Spectral Channel Graph",
    "time-graph": "Signal Time History",
    "export": "Export & Audit Registry",
    "vendors": "Organization & Vendors",
    "settings": "System Settings",
    "about": "About NetPulse CAF",
  };

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/30 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-headline font-bold text-foreground">
          {titles[activeTab] || "CAF-WIFI Analyzer"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium border border-blue-500/20">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Aruba Analysis: Public Access
        </div>
        
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-yellow-400" />}
        </Button>
        
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2 ml-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Operational</span>
        </div>
      </div>
    </header>
  );
}
