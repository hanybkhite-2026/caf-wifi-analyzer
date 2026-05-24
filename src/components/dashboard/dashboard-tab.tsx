"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_NETWORKS } from "@/lib/mock-data";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar 
} from 'recharts';
import { Wifi, Router, Signal, ShieldCheck, Zap } from "lucide-react";

export function DashboardTab() {
  const signalData = MOCK_NETWORKS.map(n => ({
    name: n.ssid,
    signal: Math.abs(n.signalStrength),
  }));

  const typeData = [
    { name: 'Main', value: MOCK_NETWORKS.filter(n => n.networkType === 'Main').length },
    { name: 'Guest', value: MOCK_NETWORKS.filter(n => n.networkType === 'Guest').length },
    { name: 'IoT', value: MOCK_NETWORKS.filter(n => n.networkType === 'IoT').length },
  ];

  const radarData = [
    { subject: 'Interference', A: 120, fullMark: 150 },
    { subject: 'Congestion', A: 98, fullMark: 150 },
    { subject: 'Reliability', A: 86, fullMark: 150 },
    { subject: 'Coverage', A: 99, fullMark: 150 },
    { subject: 'Speed', A: 85, fullMark: 150 },
  ];

  const COLORS = ['#3b82f6', '#06b6d4', '#a855f7', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "CAF Networks", value: "6", icon: Wifi, color: "text-blue-500" },
          { title: "Active APs", value: "18", icon: Router, color: "text-cyan-500" },
          { title: "Avg Signal", value: "-52 dBm", icon: Signal, color: "text-purple-500" },
          { title: "Network Health", value: "98%", icon: ShieldCheck, color: "text-green-500" },
        ].map((stat, i) => (
          <Card key={i} className="glass border-none shadow-md overflow-hidden relative">
            <div className={`absolute top-0 right-0 p-4 opacity-10 ${stat.color}`}>
              <stat.icon className="w-12 h-12" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{stat.value}</div>
              <p className="text-xs text-green-500 flex items-center mt-1">
                <Zap className="w-3 h-3 mr-1" /> +2.5% from last scan
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass border-none">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Signal Strength Comparison</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signalData}>
                <XAxis dataKey="name" fontSize={12} stroke="#888888" />
                <YAxis fontSize={12} stroke="#888888" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.8)', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Bar dataKey="signal" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-none">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Network Type Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {typeData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass border-none">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Spectral Analysis (Radar)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="subject" fontSize={10} stroke="#888" />
                <Radar
                  name="Quality"
                  dataKey="A"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          <Card className="glass border-none gradient-card-green">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-green-500 mb-1">5GHz Band Status</h3>
                <p className="text-xl font-bold font-headline">Excellent Connectivity</p>
                <p className="text-xs text-muted-foreground mt-1">Noise floor: -98dBm | No congestion</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <ShieldCheck className="text-green-500 w-6 h-6" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-none gradient-card-orange">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-orange-500 mb-1">2.4GHz Band Status</h3>
                <p className="text-xl font-bold font-headline">High Interference</p>
                <p className="text-xs text-muted-foreground mt-1">Overlapping channels detected: 1, 6, 11</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                <Zap className="text-orange-500 w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
