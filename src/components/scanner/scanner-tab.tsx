"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MOCK_NETWORKS, type NetworkScan } from "@/lib/mock-data";
import { 
  Radio, 
  MapPin, 
  Play, 
  Loader2, 
  Wand2, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Crosshair, 
  X, 
  Info, 
  Wifi, 
  Lock, 
  ShieldAlert 
} from "lucide-react";
import { aiNetworkOptimizer, type AiNetworkOptimizerOutput } from "@/ai/flows/ai-network-optimizer";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  const currentConnection = networks.find(n => n.isCurrent);

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
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const playBeep = () => {
        if (isMuted || !audioContextRef.current) return;
        
        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();
        
        osc.type = 'sine';
        const freq = 400 + (Math.abs(currentSignal) < 40 ? 400 : 0) + (Math.abs(currentSignal + 90) * 2);
        osc.frequency.setValueAtTime(freq, audioContextRef.current.currentTime);
        
        gain.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(audioContextRef.current.destination);
        
        osc.start();
        osc.stop(audioContextRef.current.currentTime + 0.1);
      };

      const updateInterval = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        
        const delay = Math.max(50, (Math.abs(currentSignal) - 30) * 15);
        intervalRef.current = setInterval(() => {
          playBeep();
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
    if (dBm >= -55) return "text-green-500";
    if (dBm >= -75) return "text-yellow-500";
    return "text-red-500";
  };

  const getSignalPercent = (dBm: number) => {
    const min = -100;
    const max = -30;
    return Math.min(100, Math.max(0, ((dBm - min) / (max - min)) * 100));
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {trackingNetwork ? (
        <Card className="glass border-primary/50 shadow-2xl animate-in zoom-in-95 duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <Crosshair className="w-6 h-6 text-primary animate-pulse" />
                Locating Hidden AP: {trackingNetwork.ssid}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="secondary">{trackingNetwork.vendor}</Badge>
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
          <CardContent className="py-8 space-y-8 text-center">
            <div className="text-6xl font-bold font-headline mb-4">
              {Math.round(currentSignal)}
              <span className="text-xl ml-1 text-muted-foreground">dBm</span>
            </div>
            <Progress value={getSignalPercent(currentSignal)} className="h-4 max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground mt-4">
              Beep frequency increases as you approach the <strong>Aruba AP</strong>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current Connection Header */}
          {currentConnection && (
            <div className="bg-secondary/40 p-4 rounded-xl border-l-4 border-primary space-y-1">
              <p className="text-primary text-xs font-bold uppercase tracking-widest">Current connection</p>
              <div className="flex justify-between items-baseline">
                <h3 className="text-lg font-bold font-headline">{currentConnection.ssid} ({currentConnection.macAddress})</h3>
                <span className="text-xs font-mono text-blue-400">{currentConnection.ipAddress}</span>
              </div>
              <div className="flex gap-4 text-xs font-medium">
                <span className={getSignalColor(currentConnection.signalStrength)}>{currentConnection.signalStrength}dBm</span>
                <span>CH <span className="text-blue-400">{currentConnection.channel}</span> {currentConnection.frequencyMHz}MHz</span>
                <span className="text-cyan-400">{currentConnection.distance}</span>
                <span className="text-blue-500 font-bold">{currentConnection.bandwidthMbps}Mbps</span>
              </div>
            </div>
          )}

          {/* Warning Banner */}
          <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold justify-center">
            <X className="w-4 h-4" /> Wi-Fi scan throttling is enabled
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end glass p-4 rounded-xl">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-xs font-bold uppercase text-muted-foreground flex items-center">
                <MapPin className="w-3 h-3 mr-1" /> Scan Location
              </label>
              <Input 
                placeholder="e.g., Floor 1, Office A" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <Button onClick={startScan} disabled={isScanning} className="gradient-blue-cyan h-10 px-8 w-full md:w-auto">
              {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              {isScanning ? "Scanning..." : "Start Scan"}
            </Button>
          </div>

          {/* Network List Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-xs font-bold uppercase text-muted-foreground">Nearby Access Points</h4>
              {isScanning && <div className="text-[10px] text-blue-500 animate-pulse font-bold">LIVE SCANNING...</div>}
            </div>
            
            <div className="space-y-0.5">
              {networks.map((network) => (
                <div key={network.id} className="bg-card/30 hover:bg-card/50 transition-colors border-b border-border p-4 first:rounded-t-xl last:rounded-b-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{network.ssid}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">({network.macAddress})</span>
                      </div>
                      <div className="flex gap-3 text-[11px] font-mono">
                        <span className={`font-bold ${getSignalColor(network.signalStrength)}`}>{network.signalStrength}dBm</span>
                        <span>CH <span className="text-blue-400">{network.channel}</span> {network.frequencyMHz}MHz</span>
                        <span className="text-cyan-400">{network.distance}</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setTrackingNetwork(network)} 
                      className="h-8 px-2 text-[10px] font-bold text-primary border border-primary/20 hover:bg-primary/10"
                    >
                      <Crosshair className="w-3.5 h-3.5 mr-1" /> LOCATE
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Signal Icon */}
                    <div className="w-10 h-10 flex items-center justify-center relative">
                      <Wifi className={`w-8 h-8 ${getSignalColor(network.signalStrength)}`} />
                      <div className="absolute bottom-0 right-0">
                        {network.encryption.includes('WPA') ? <Lock className="w-3 h-3 text-muted-foreground" /> : null}
                      </div>
                      <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-secondary px-1 rounded">{network.channel}</span>
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[10px] uppercase font-bold">
                        <span className="text-cyan-400">{network.frequencyRange}</span>
                        <span className="text-muted-foreground truncate max-w-[120px]">{network.vendor}</span>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground/80">
                        {network.encryption}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights Sidebar */}
          <Card className="glass border-none gradient-card-purple">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-headline flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-500" /> AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!aiResult ? (
                <Button onClick={handleAiOptimize} disabled={isOptimizing} variant="outline" className="w-full text-xs">
                  {isOptimizing ? "Analyzing..." : "Analyze Scan Data"}
                </Button>
              ) : (
                <div className="space-y-2 text-xs">
                  <p className="bg-purple-500/10 p-2 rounded">{aiResult.summary}</p>
                  <Button onClick={() => setAiResult(null)} variant="ghost" className="w-full h-6 text-[10px]">Clear</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
