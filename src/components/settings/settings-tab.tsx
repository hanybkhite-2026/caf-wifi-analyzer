"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Moon, Sun, Info, HelpCircle, Database, Server, Smartphone, Monitor } from "lucide-react";

interface SettingsTabProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function SettingsTab({ theme, toggleTheme }: SettingsTabProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="glass border-none">
        <CardHeader>
          <CardTitle className="text-xl font-headline">Appearance & Preferences</CardTitle>
          <CardDescription>Customize your analyzer workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-background border border-border">
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-500" />}
              </div>
              <div>
                <Label className="text-base font-bold">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">Adjust display for low-light environments</p>
              </div>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-background border border-border">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <Label className="text-base font-bold">Real-time Notifications</Label>
                <p className="text-xs text-muted-foreground">Alerts for critical signal interference</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-none">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-500" /> Help & Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-border">
              <AccordionTrigger className="hover:no-underline font-bold">Getting Started</AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-2">
                <p>1. Open app on any device</p>
                <p>2. Login with CAF credentials</p>
                <p>3. Click Scanner tab</p>
                <p>4. Enter location & Click Start Scan</p>
                <p>5. View results and AI recommendations</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-border">
              <AccordionTrigger className="hover:no-underline font-bold">How to Scan Properly</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Hold device steady at chest height</li>
                  <li>Avoid standing too close to structural metal or concrete</li>
                  <li>Scan at least 3 points in a large room for accuracy</li>
                  <li>Green means excellent (-30 to -50dBm), Red means poor (&lt;-70dBm)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-border">
              <AccordionTrigger className="hover:no-underline font-bold">Multi-Platform Compatibility</AccordionTrigger>
              <AccordionContent className="text-muted-foreground grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2"><Monitor className="w-4 h-4" /> Windows (Chrome/Edge)</div>
                <div className="flex items-center gap-2"><Monitor className="w-4 h-4" /> macOS (Safari/Chrome)</div>
                <div className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> iOS (Safari)</div>
                <div className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> Android (Chrome)</div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="glass border-none gradient-card-blue-cyan border-none">
        <CardHeader>
          <CardTitle className="text-lg font-headline">System Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500"><Server className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground font-bold">App Version</p>
                <p className="text-sm font-bold">v3.0.0 Enterprise</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-500"><Database className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground font-bold">Database</p>
                <p className="text-sm font-bold">Firebase Firestore</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
             <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] uppercase text-muted-foreground font-bold mb-2">Supported Standards</p>
                <div className="flex flex-wrap gap-2">
                  {['WiFi 6E', 'WiFi 6', 'WPA3', '802.11ax/ac'].map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 font-bold">{s}</span>
                  ))}
                </div>
             </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">© 2024 CAF-WIFI Operations | NetPulse Infrastructure</p>
      </div>
    </div>
  );
}
