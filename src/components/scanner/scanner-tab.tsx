"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MOCK_NETWORKS, type NetworkScan } from "@/lib/mock-data";
import { Radio, MapPin, Play, Loader2, Wand2, RefreshCw, Volume2, VolumeX, Crosshair, X, Info } from "lucide-react";
import { aiNetworkOptimizer, type AiNetworkOptimizerOutput } from "@/ai/flows/ai-network-optimizer";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export function ScannerTab() {
  const [location, setLocation] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [networks, setNetworks] = useState<NetworkScan[]>(MOCK_NETWORKS);
  const [aiResult, setAiResult] = useState<AiNetworkOptimizerOutput | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Signal Tracker State
  const [trackingNetwork, setTrackingNetwork] = useState<NetworkScan | null>(null);
  const [currentSignal, setCurrentSignal] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  const startScan = () => {
    if (!location) {
      toast({ title: "Error", description: "Please enter a location first.", variant: "destructive" });
      return;
    }
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      toast({ title: "Scan Complete", description: `Found ${networks.length} CAF networks in ${location}.` });
    }, 3000);
  };

  const handleAiOptimize = async () => {
    setIsOptimizing(true);
    try {
      const result = await aiNetworkOptimizer({ networkScans: networks });
      setAiResult(result);
    } catch (error) {
      toast({ title: "Optimization Failed", description: "Could not connect to AI service.", variant: "destructive" });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Signal Tracking Logic
  useEffect(() => {
    if (trackingNetwork) {
      setCurrentSignal(trackingNetwork.signalStrength);
      
      // Setup Audio
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const playBeep = () => {
        if (isMuted || !audioContextRef.current) return;
        
        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();
        
        osc.type = 'sine';
        // Frequency higher as signal gets stronger (-30 is better than -90)
        const freq = 400 + (Math.abs(currentSignal) < 40 ? 400 : 0) + (Math.abs(currentSignal + 90) * 2);
        osc.frequency.setValueAtTime(freq, audioContextRef.current.currentTime);
        
        gain.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(audioContextRef.current.destination);
        
        osc.start();
        osc.stop(audioContextRef.current.currentTime + 0.1);
      };

      // Interval speed based on signal strength
      // Strong signal (-30) = fast beeps
      // Weak signal (-90) = slow beeps
      const updateInterval = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        
        const delay = Math.max(50, (Math.abs(currentSignal) - 30) * 15);
        intervalRef.current = setInterval(() => {
          playBeep();
          // Simulate slight signal fluctuation for realism
          setCurrentSignal(prev => {
            const fluctuation = (Math.random() - 0.5) * 4;
            const newVal = prev + fluctuation;
            return Math.min(-30, Math.max(-95, newVal));
          });
        }, delay);
      };

      updateInterval();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        // We don't necessarily want to close it, just stop the beeps
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [trackingNetwork, currentSignal, isMuted]);

  const stopTracking = () => {
    setTrackingNetwork(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const getSignalColor = (dBm: number) => {
    if (dBm >= -50) return "text-green-500";
    if (dBm >= -70) return "text-yellow-500";
    return "text-red-500";
  };

  const getSignalPercent = (dBm: number) => {
    const min = -100;
    const max = -30;
    return Math.min(100, Math.max(0, ((dBm - min) / (max - min)) * 100));
  };

  return (
    <div className="space-y-6">
      {trackingNetwork ? (
        <Card className="glass border-primary/50 shadow-2xl animate-in zoom-in-95 duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <Crosshair className="w-6 h-6 text-primary animate-pulse" />
                Locating: {trackingNetwork.ssid}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="secondary">{trackingNetwork.vendor || 'Aruba Networks'}</Badge>
                <span className="font-mono text-xs">{trackingNetwork.macAddress}</span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={stopTracking}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="py-8 space-y-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full border-4 border-dashed border-primary/20 animate-spin-slow`} />
                <div className="text-6xl font-bold font-headline transition-all duration-300" style={{ transform: `scale(${1 + getSignalPercent(currentSignal)/200})` }}>
                  {Math.round(currentSignal)}
                  <span className="text-xl ml-1 text-muted-foreground uppercase">dBm</span>
                </div>
              </div>
              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span>Proximity</span>
                  <span>{Math.round(getSignalPercent(currentSignal))}%</span>
                </div>
                <Progress value={getSignalPercent(currentSignal)} className="h-4" />
              </div>
              <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 max-w-md">
                <p className="text-sm flex items-start gap-2 text-left">
                  <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                  <span>
                    Audio frequency and beep rate will increase as you move closer to the <strong>Aruba Access Point</strong>. Use this to locate hidden devices behind walls or ceilings.
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="glass border-none">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                    <MapPin className="w-3 h-3 mr-1" /> Scan Location
                  </label>
                  <Input 
                    placeholder="e.g., Floor 1, Conference Room A" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-background/50 border-border"
                  />
                </div>
                <Button 
                  onClick={startScan} 
                  disabled={isScanning}
                  className="gradient-blue-cyan border-none h-10 px-8 shadow-lg shadow-blue-500/20"
                >
                  {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  {isScanning ? "Scanning..." : "Start Network Scan"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-3 glass border-none overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-headline">Discovery Results</CardTitle>
                  <CardDescription>Live real-time CAF network mapping (Aruba Infrastructure)</CardDescription>
                </div>
                {isScanning && (
                  <div className="flex items-center text-xs text-blue-500 animate-pulse font-bold">
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> LIVE UPDATING
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>SSID</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Signal Strength</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Clients</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {networks.map((network) => (
                        <TableRow key={network.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-bold">
                            <div>{network.ssid}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{network.macAddress}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium bg-blue-500/5 text-blue-500/80 border-blue-500/20">
                              {network.vendor || 'Aruba'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`font-mono font-bold ${getSignalColor(network.signalStrength)}`}>
                            {network.signalStrength} dBm
                          </TableCell>
                          <TableCell className="font-mono">{network.channel}</TableCell>
                          <TableCell>{network.clientsConnected}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setTrackingNetwork(network)} className="text-primary hover:text-primary hover:bg-primary/10">
                              <Crosshair className="w-4 h-4 mr-2" /> Locate AP
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-none flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-cyan-500" /> AI Optimizer
                </CardTitle>
                <CardDescription>Get performance recommendations</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center gap-4">
                {!aiResult ? (
                  <div className="text-center space-y-4">
                    <div className="p-6 rounded-2xl bg-muted/30 border border-dashed border-border flex flex-col items-center">
                      <Radio className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">Scan data ready for analysis.</p>
                    </div>
                    <Button 
                      onClick={handleAiOptimize} 
                      disabled={isOptimizing}
                      variant="outline"
                      className="w-full border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10"
                    >
                      {isOptimizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Run AI Analysis"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                      <h4 className="text-xs font-bold text-cyan-500 uppercase mb-2">Health Summary</h4>
                      <p className="text-sm line-clamp-4">{aiResult.summary}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase">Key Recommendations</h4>
                      {aiResult.recommendations.slice(0, 2).map((rec, i) => (
                        <div key={i} className="text-xs p-2 rounded bg-muted/50 border border-border">
                          <span className="font-bold text-primary mr-1">[{rec.priority}]</span> {rec.category}
                        </div>
                      ))}
                    </div>
                    <Button onClick={() => setAiResult(null)} variant="ghost" className="w-full text-xs">Clear Results</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
