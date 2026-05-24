"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SPEED_HISTORY, WEEKLY_ACTIVITY } from "@/lib/mock-data";
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Download, Upload, Activity, TrendingUp, Play, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export function AnalyticsTab() {
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testStage, setTestStage] = useState<'idle' | 'latency' | 'download' | 'upload'>('idle');
  const [currentResult, setCurrentResult] = useState<{ download: number; upload: number; ping: number } | null>(null);
  const { toast } = useToast();

  const runSpeedTest = () => {
    setIsRunningTest(true);
    setTestProgress(0);
    setTestStage('latency');
    setCurrentResult(null);

    // Latency stage
    setTimeout(() => {
      setTestStage('download');
      setTestProgress(33);
      
      // Download stage
      setTimeout(() => {
        setTestStage('upload');
        setTestProgress(66);
        
        // Upload stage
        setTimeout(() => {
          setIsRunningTest(false);
          setTestProgress(100);
          setTestStage('idle');
          const result = {
            download: Math.floor(Math.random() * 200) + 350,
            upload: Math.floor(Math.random() * 100) + 150,
            ping: Math.floor(Math.random() * 10) + 8
          };
          setCurrentResult(result);
          toast({
            title: "Speed Test Complete",
            description: `Download: ${result.download} Mbps | Upload: ${result.upload} Mbps`,
          });
        }, 3000);
      }, 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass border-none shadow-lg">
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

        <Card className="glass border-none shadow-lg flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" /> Active Speed Test
            </CardTitle>
            <CardDescription>Measure real-time bandwidth</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center text-center space-y-6">
            {!isRunningTest && !currentResult && (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Activity className="w-10 h-10 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Perform a throughput check on your current CAF connection.</p>
                <Button onClick={runSpeedTest} className="w-full gradient-blue-cyan shadow-lg shadow-blue-500/20">
                  <Play className="w-4 h-4 mr-2" /> Start Speed Test
                </Button>
              </div>
            )}

            {isRunningTest && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span>{testStage === 'latency' ? 'Measuring Ping...' : testStage === 'download' ? 'Testing Download...' : 'Testing Upload...'}</span>
                    <span>{testProgress}%</span>
                  </div>
                  <Progress value={testProgress} className="h-2" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className={`p-2 rounded-lg border ${testStage === 'latency' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    <p className="text-[10px] text-muted-foreground uppercase">Ping</p>
                    <p className="text-sm font-bold">{testStage === 'latency' ? '...' : '--'}</p>
                  </div>
                  <div className={`p-2 rounded-lg border ${testStage === 'download' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    <p className="text-[10px] text-muted-foreground uppercase">Down</p>
                    <p className="text-sm font-bold">{testStage === 'download' ? '...' : '--'}</p>
                  </div>
                  <div className={`p-2 rounded-lg border ${testStage === 'upload' ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    <p className="text-[10px] text-muted-foreground uppercase">Up</p>
                    <p className="text-sm font-bold">{testStage === 'upload' ? '...' : '--'}</p>
                  </div>
                </div>
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              </div>
            )}

            {currentResult && !isRunningTest && (
              <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                    <Download className="w-5 h-5 text-blue-500 mb-2 mx-auto" />
                    <p className="text-xs text-muted-foreground uppercase font-bold">Download Speed</p>
                    <p className="text-3xl font-bold font-headline text-blue-500">{currentResult.download} <span className="text-sm">Mbps</span></p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                      <Upload className="w-4 h-4 text-cyan-400 mb-1 mx-auto" />
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Upload</p>
                      <p className="text-xl font-bold">{currentResult.upload} <span className="text-xs">Mbps</span></p>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                      <Activity className="w-4 h-4 text-purple-400 mb-1 mx-auto" />
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Latency</p>
                      <p className="text-xl font-bold">{currentResult.ping} <span className="text-xs">ms</span></p>
                    </div>
                  </div>
                </div>
                <Button onClick={runSpeedTest} variant="outline" className="w-full">
                  Run Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <CardContent className="h-[300px]">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Avg Download", value: "452.4 Mbps", icon: Download, color: "text-blue-500", trend: "+12%" },
            { label: "Avg Upload", value: "215.8 Mbps", icon: Upload, color: "text-cyan-500", trend: "+5%" },
            { label: "Avg Latency", value: "11.5 ms", icon: Activity, color: "text-purple-500", trend: "-2ms" },
            { label: "Stability Score", value: "94.2%", icon: Zap, color: "text-green-500", trend: "+0.5%" },
          ].map((item, i) => (
            <Card key={i} className="glass border-none">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-2xl font-bold font-headline">{item.value}</p>
                  <span className={`text-xs font-bold ${item.trend.startsWith('+') || item.trend.startsWith('-2') ? 'text-green-500' : 'text-blue-400'}`}>
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
    </div>
  );
}
