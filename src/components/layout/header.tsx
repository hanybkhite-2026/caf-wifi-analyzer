
"use client";

import { Moon, Sun, Bell, UserCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeTab: string;
}

export function Header({ theme, toggleTheme, activeTab }: HeaderProps) {
  const { auth } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <UserCircle className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.displayName || 'Admin'}</span>
                <span className="text-[10px] text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
