
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
  Volume2, 
  VolumeX, 
  Crosshair, 
  X, 
  Wifi, 
  Lock, 
  AlertTriangle 
} from "lucide-react";
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  const currentConnection = networks.find(n => n.isCurrent);

  const startScan = () => {
    if (!location) {
      toast({ title: "Audit Error", description: "Location name required for registry entry.", variant: "destructive" });
      return;
    }
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      toast({ title: "Audit Complete", description: `Discovered ${networks.length} infrastructure nodes.` });
    }, 2500);
  };

  const handleAiOptimize = async () => {
    setIsOptimizing(true);
    try {
      const result = await aiNetworkOptimizer({ networkScans: networks });
      setAiResult(result);
    } catch (error) {
      toast({ title: "Analysis Failed", description: "Cloud AI engine unreachable.", variant: "destructive" });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Web Audio Geiger Counter Logic
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
        const freq = 400 + (Math.abs(currentSignal) < 40 ? 400 : 0) + (Math.abs(currentSignal + 90) * 2.5);
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
        const delay = Math.max(60, (Math.abs(currentSignal) - 30) * 12);
        intervalRef.current = setInterval(() => {
          playBeep();
          setCurrentSignal(prev => {
            const fluctuation = (Math.random() - 0.5) * 5;
            return Math.min(-30, Math.max(-95, prev + fluctuation));
          });
        }, delay);
      };
      updateInterval();
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [trackingNetwork, currentSignal, isMuted]);

  const getSignalColor = (dBm: number) => {
    if (dBm >= -55) return "text-green-500";
    if (dBm >= -75) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-body">
      {trackingNetwork ? (
        <Card className="glass border-blue-500/50 shadow-2xl animate-in zoom-in-95 duration-300 bg-slate-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-2xl font-headline font-bold flex items-center gap-3">
                <Crosshair className="w-8 h-8 text-blue-500 animate-pulse" />
                Locating Hardware: {trackingNetwork.ssid}
              </CardTitle>
              <CardDescription className="flex items-center gap-3 font-mono text-xs mt-1">
                <Badge variant="outline" className="border-blue-500/30 text-blue-400">{trackingNetwork.vendor}</Badge>
                <span>MAC: {trackingNetwork.macAddress}</span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="icon" onClick={() => setIsMuted(!isMuted)} className="bg-slate-800">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <Button variant="secondary" size="icon" onClick={() => setTrackingNetwork(null)} className="bg-slate-800 hover:text-red-500">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="py-12 space-y-10 text-center">
            <div className="text-9xl font-black font-headline tracking-tighter text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              {Math.round(currentSignal)}
              <span className="text-2xl ml-2 text-slate-500">dBm</span>
            </div>
            <div className="max-w-xl mx-auto space-y-4">
              <Progress value={Math.min(100, Math.max(0, (currentSignal + 100) * 1.5))} className="h-6" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Geiger feedback rate increases as proximity to <span className="text-blue-500">Aruba Radio</span> improves.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current Connection Header */}
          {currentConnection && (
            <Card className="bg-blue-600/5 border-l-4 border-l-blue-600 border-inherit">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">Live Connection Diagnostics</span>
                  <Badge variant="outline" className="text-[9px] border-blue-500/20 text-blue-400 font-mono">IP: {currentConnection.ipAddress}</Badge>
                </div>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold font-headline">{currentConnection.ssid}</h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">{currentConnection.vendor} | HW: {currentConnection.macAddress}</p>
                  </div>
                  <div className="flex gap-8 text-[11px] font-bold">
                    <div className="text-center">
                      <div className={getSignalColor(currentConnection.signalStrength)}>{currentConnection.signalStrength} dBm</div>
                      <div className="text-[8px] text-slate-500 uppercase mt-1">Signal</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-500">CH {currentConnection.channel}</div>
                      <div className="text-[8px] text-slate-500 uppercase mt-1">{currentConnection.frequencyMHz} MHz</div>
                    </div>
                    <div className="text-center">
                      <div className="text-cyan-400">{currentConnection.bandwidthMbps} Mbps</div>
                      <div className="text-[8px] text-slate-500 uppercase mt-1">Throughput</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning Banner */}
          <div className="flex items-center gap-3 p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest justify-center">
            <AlertTriangle className="w-4 h-4" /> Wi-Fi scan throttling is active. Accuracy may vary.
          </div>

          <div className="flex flex-col md:flex-row gap-4 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-500 flex items-center tracking-widest">
                <MapPin className="w-3 h-3 mr-2" /> Audit Environment
              </label>
              <Input 
                placeholder="e.g., Data Center Rack B-12" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-slate-800/50 border-slate-700 h-11"
              />
            </div>
            <Button onClick={startScan} disabled={isScanning} className="bg-blue-600 hover:bg-blue-700 h-11 px-10 self-end font-bold uppercase tracking-widest text-xs">
              {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              {isScanning ? "Scanning..." : "Start Site Audit"}
            </Button>
          </div>

          {/* Network Registry */}
          <div className="bg-slate-900/30 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-800/30 border-b border-slate-800 flex justify-between items-center">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Discovery Registry</h4>
              {isScanning && <div className="text-[9px] text-blue-500 animate-pulse font-bold tracking-widest">REAL-TIME SPECTRAL SCAN...</div>}
            </div>
            <div className="divide-y divide-slate-800">
              {networks.map((network) => (
                <div key={network.id} className="p-4 hover:bg-blue-600/5 transition-colors group flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center relative ${getSignalColor(network.signalStrength)}/10`}>
                      <Wifi className={`w-6 h-6 ${getSignalColor(network.signalStrength)}`} />
                      <div className="absolute -top-1 -right-1 text-[8px] font-bold bg-slate-700 px-1.5 py-0.5 rounded-md border border-slate-600">{network.channel}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm tracking-tight">{network.ssid}</span>
                        {network.encryption.includes('WPA') && <Lock className="w-3 h-3 text-slate-500" />}
                      </div>
                      <div className="flex gap-4 text-[10px] font-mono text-slate-500">
                        <span className={`font-bold ${getSignalColor(network.signalStrength)}`}>{network.signalStrength} dBm</span>
                        <span className="uppercase tracking-tighter">{network.vendor}</span>
                        <span className="text-cyan-600">{network.frequencyRange}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setTrackingNetwork(network)} 
                    className="h-8 px-4 text-[9px] font-bold uppercase tracking-widest border-blue-500/20 text-blue-500 hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <Crosshair className="w-3 h-3 mr-2" /> Locate AP
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

