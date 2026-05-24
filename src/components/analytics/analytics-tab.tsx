"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SPEED_HISTORY, WEEKLY_ACTIVITY } from "@/lib/mock-data";
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Download, Upload, Activity, TrendingUp } from "lucide-react";

export function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-headline">Speed Test History</CardTitle>
                <CardDescription>Network throughput over the last 24 hours</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-muted-foreground">Download</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SPEED_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="time" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} unit="Mbps" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', border: 'none', borderRadius: '12px' }}
                />
                <Line type="monotone" dataKey="download" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6' }} />
                <Line type="monotone" dataKey="upload" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-headline">Weekly Activity Trends</CardTitle>
                <CardDescription>Network scan volume and identified events</CardDescription>
              </div>
              <TrendingUp className="text-green-500 w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEEKLY_ACTIVITY}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', border: 'none', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="scans" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScans)" />
                <Area type="monotone" dataKey="events" stroke="#f59e0b" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Avg Download", value: "452.4 Mbps", icon: Download, color: "text-blue-500", trend: "+12%" },
          { label: "Avg Upload", value: "215.8 Mbps", icon: Upload, color: "text-cyan-500", trend: "+5%" },
          { label: "Avg Latency", value: "11.5 ms", icon: Activity, color: "text-purple-500", trend: "-2ms" },
        ].map((item, i) => (
          <Card key={i} className="glass border-none">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-2xl font-bold font-headline">{item.value}</p>
                <span className={`text-xs font-bold ${item.trend.startsWith('+') ? 'text-green-500' : 'text-blue-400'}`}>
                  {item.trend} compared to last week
                </span>
              </div>
              <div className={`p-3 rounded-2xl bg-muted/50 ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
