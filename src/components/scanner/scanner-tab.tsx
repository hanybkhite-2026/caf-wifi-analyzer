"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MOCK_NETWORKS, type NetworkScan } from "@/lib/mock-data";
import { Radio, MapPin, Play, Loader2, Wand2, RefreshCw } from "lucide-react";
import { aiNetworkOptimizer, type AiNetworkOptimizerOutput } from "@/ai/flows/ai-network-optimizer";
import { useToast } from "@/hooks/use-toast";

export function ScannerTab() {
  const [location, setLocation] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [networks, setNetworks] = useState<NetworkScan[]>(MOCK_NETWORKS);
  const [aiResult, setAiResult] = useState<AiNetworkOptimizerOutput | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  const startScan = () => {
    if (!location) {
      toast({ title: "Error", description: "Please enter a location first.", variant: "destructive" });
      return;
    }
    setIsScanning(true);
    // Simulate real-time scanning
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

  const getSignalColor = (dBm: number) => {
    if (dBm >= -50) return "text-green-500";
    if (dBm >= -70) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
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
              <CardDescription>Live real-time CAF network mapping</CardDescription>
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
                    <TableHead>Type</TableHead>
                    <TableHead>Signal Strength</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Clients</TableHead>
                    <TableHead>Band</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {networks.map((network) => (
                    <TableRow key={network.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-bold">{network.ssid}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium bg-blue-500/10 text-blue-500 border-blue-500/20">
                          {network.networkType}
                        </Badge>
                      </TableCell>
                      <TableCell className={`font-mono font-bold ${getSignalColor(network.signalStrength)}`}>
                        {network.signalStrength} dBm
                      </TableCell>
                      <TableCell className="font-mono">{network.channel}</TableCell>
                      <TableCell>{network.clientsConnected}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{network.frequencyBand}</TableCell>
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
    </div>
  );
}
