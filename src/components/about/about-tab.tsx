"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, ShieldCheck, Globe, Cpu } from "lucide-react";

export function AboutTab() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl gradient-blue-cyan flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/40">
          <Wifi className="text-white w-10 h-10" />
        </div>
        <h2 className="text-4xl font-bold font-headline tracking-tight">NetPulse CAF Analyzer</h2>
        <p className="text-muted-foreground text-lg">v3.0.0 Enterprise Infrastructure Monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass border-none">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" /> Secure Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            Designed specifically for high-security environments, NetPulse provides real-time spectral analysis of CAF-WIFI networks without compromising endpoint security.
          </CardContent>
        </Card>

        <Card className="glass border-none">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-500" /> Aruba Optimized
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            Deep integration with Aruba Access Point hardware enables specialized features like hidden AP tracking and automated channel optimization.
          </CardContent>
        </Card>
      </div>

      <div className="p-8 rounded-3xl bg-secondary/30 border border-border text-center">
        <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-bold mb-2 text-xl font-headline">Global Deployment</h3>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Used by field technicians across multiple continents to ensure reliable connectivity for the modern mobile workforce. Developed and maintained by the GDIT Engineering Team.
        </p>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-8">
        <p>© 2024 CAF-WIFI Operations | All Rights Reserved</p>
        <p className="mt-2">GDIT-CAF-NETPULSE-v3-PROD</p>
      </div>
    </div>
  );
}
