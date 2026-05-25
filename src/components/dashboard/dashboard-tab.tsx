"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MOCK_NETWORKS } from "@/lib/mock-data";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell,
  CartesianGrid, AreaChart, Area
} from 'recharts';
import { Wifi, Router, Signal, ShieldCheck, Zap, Activity, AlertTriangle, Layers } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DashboardTab() {
  const [band, setBand] = useState<'2.4GHz' | '5GHz'>('5GHz');

  const performanceData = useMemo(() => MOCK_NETWORKS.map(n => ({
    name: n.ssid,
    signal: Math.abs(n.signalStrength),
    bandwidth: n.bandwidthMbps,
    interference: n.interferenceScore * 10,
  })), []);

  const signalData = useMemo(() => MOCK_NETWORKS.map(n => ({
    network: n.ssid,
    strength: Math.abs(n.signalStrength)
  })), []);

  const typeData = useMemo(() => [
    { name: 'Main', value: MOCK_NETWORKS.filter(n => n.networkType === 'Main').length },
    { name: 'Guest', value: MOCK_NETWORKS.filter(n => n.networkType === 'Guest').length },
    { name: 'IoT', value: MOCK_NETWORKS.filter(n => n.networkType === 'IoT').length },
  ], []);

  const channelGraphData = useMemo(() => {
    const is2G = band === '2.4GHz';
    const channels = is2G ? Array.from({ length: 14 }, (_, i) => i + 1) : [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 149, 153, 157, 161, 165];
    
    const dataPoints: any[] = [];
    const minChan = Math.min(...channels) - 2;
    const maxChan = Math.max(...channels) + 2;
    
    for (let i = minChan; i <= maxChan; i += 0.5) {
      const point: any = { channel: i };
      MOCK_NETWORKS.filter(n => n.frequencyBand === band).forEach(net => {
        const dist = Math.abs(i - net.channel);
        if (dist <= 2) {
          const strength = Math.max(0, (net.signalStrength + 100));
          point[net.ssid] = strength * (1 - (dist / 2));
        } else {
          point[net.ssid] = 0;
        }
      });
      dataPoints.push(point);
    }
    return dataPoints;
  }, [band]);

  const COLORS = ['#3b82f6', '#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "CAF Networks", value: "6", icon: Wifi, color: "text-blue-500" },
          { title: "Active APs", value: "18", icon: Router, color: "text-cyan-500" },
          { title: "Avg Signal", value: "-52 dBm", icon: Signal, color: "text-purple-500" },
          { title: "Network Health", value: "98%", icon: ShieldCheck, color: "text-green-500" },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/50 backdrop-blur-md border-none shadow-md overflow-hidden relative">
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

      <Card className="bg-card/50 backdrop-blur-md border-none shadow-lg overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" /> Channel Spectrum Graph
            </CardTitle>
            <CardDescription>Visualizing signal overlap and channel congestion</CardDescription>
          </div>
          <Tabs value={band} onValueChange={(v) => setBand(v as any)} className="w-auto">
            <TabsList className="bg-background/50">
              <TabsTrigger value="2.4GHz">2.4 GHz</TabsTrigger>
              <TabsTrigger value="5GHz">5 GHz</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="h-[400px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={channelGraphData}>
              <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#333" />
              <XAxis 
                dataKey="channel" 
                type="number" 
                domain={['dataMin', 'dataMax']} 
                stroke="#888" 
                fontSize={12} 
                label={{ value: 'WiFi Channels', position: 'insideBottom', offset: -5, fill: '#888' }}
              />
              <YAxis 
                stroke="#888" 
                fontSize={12} 
                domain={[0, 100]} 
                label={{ value: 'Signal Strength (dBm Equiv)', angle: -90, position: 'insideLeft', fill: '#888' }} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', border: 'none', borderRadius: '12px' }}
                labelFormatter={(v) => `Channel ${v}`}
              />
              {MOCK_NETWORKS.filter(n => n.frequencyBand === band).map((net, i) => (
                <Area
                  key={net.ssid}
                  type="monotone"
                  dataKey={net.ssid}
                  stroke={COLORS[i % COLORS.length]}
                  fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  connectNulls
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-md border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> SSID Bandwidth Distribution
            </CardTitle>
            <CardDescription>Throughput capacity across discovered CAF networks (Mbps)</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#333" />
                <XAxis type="number" stroke="#888" fontSize={12} unit=" Mbps" />
                <YAxis dataKey="name" type="category" stroke="#888" fontSize={10} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', border: 'none', borderRadius: '12px' }}
                />
                <Bar dataKey="bandwidth" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-md border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" /> Interference Analysis
            </CardTitle>
            <CardDescription>Estimated interference impact per SSID (0-100 scale)</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="name" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', border: 'none', borderRadius: '12px' }}
                />
                <Bar dataKey="interference" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-md border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Signal Strength Comparison</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="network" fontSize={10} stroke="#888888" />
                <YAxis fontSize={12} stroke="#888888" domain={[0, 100]} label={{ value: 'dBm (Abs)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.8)', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Bar dataKey="strength" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-md border-none shadow-lg">
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
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
