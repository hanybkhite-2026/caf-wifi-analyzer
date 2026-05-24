"use client";

import { Moon, Sun, Bell, UserCircle } from "lucide-react";
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
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium border border-border">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Aruba Engine: Online
        </div>
        
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-yellow-400" />}
        </Button>
        
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon" className="rounded-full">
          <UserCircle className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
