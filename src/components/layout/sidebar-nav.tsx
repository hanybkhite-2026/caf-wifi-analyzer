"use client";

import { 
  Radio, 
  Signal, 
  LayoutDashboard, 
  LineChart, 
  FileUp, 
  Users, 
  Settings, 
  Info,
  Wifi 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function SidebarNav({ activeTab, setActiveTab }: SidebarNavProps) {
  const navItems = [
    { id: "access-points", label: "Access Points", icon: Radio },
    { id: "channel-rating", label: "Channel Rating", icon: Signal },
    { id: "channel-graph", label: "Channel Graph", icon: LayoutDashboard },
    { id: "time-graph", label: "Time Graph", icon: LineChart },
    { id: "export", label: "Export", icon: FileUp },
    { id: "vendors", label: "Vendors", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "about", label: "About", icon: Info },
  ];

  return (
    <aside className="w-20 lg:w-64 border-r border-border bg-card/40 backdrop-blur-xl flex flex-col hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-blue-cyan flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Wifi className="text-white w-6 h-6" />
          </div>
          <span className="font-headline font-bold text-lg hidden lg:block tracking-tight">NetPulse CAF</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
              activeTab === item.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5", activeTab === item.id ? "" : "group-hover:scale-110 transition-transform")} />
            <span className="font-medium text-sm hidden lg:block">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-500/20 rounded-2xl p-4 border border-blue-500/20 hidden lg:block">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Aruba Systems</p>
          <p className="text-sm text-foreground mb-3">v3.0.0 Enterprise</p>
          <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-full" />
          </div>
        </div>
      </div>
    </aside>
  );
}
