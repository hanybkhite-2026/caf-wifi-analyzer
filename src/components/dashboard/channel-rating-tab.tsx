"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Star, Info, AlertCircle, ChevronDown } from "lucide-react";
import { MOCK_NETWORKS } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function ChannelRatingTab() {
  const [band, setBand] = useState<'2.4GHz' | '5GHz' | '6GHz'>('2.4GHz');
  
  const currentConnection = MOCK_NETWORKS.find(n => n.isCurrent);

  const channelData = useMemo(() => {
    let channels: number[] = [];
    if (band === '2.4GHz') {
      channels = Array.from({ length: 11 }, (_, i) => i + 1);
    } else if (band === '5GHz') {
      channels = [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 149, 153, 157, 161, 165];
    } else {
      channels = [1, 5, 9, 13, 17, 21, 25, 29, 33, 37];
    }

    return channels.map(chanNum => {
      const apCount = MOCK_NETWORKS.filter(n => n.channel === chanNum && n.frequencyBand === band).length;
      // Heuristic for rating: Fewer APs = better rating. 10 stars total.
      let rating = 10;
      if (apCount > 5) rating = 2;
      else if (apCount > 3) rating = 4;
      else if (apCount > 1) rating = 7;
      else if (apCount === 1) rating = 9;
      else rating = 10;

      return {
        number: chanNum,
        bandwidth: "20 MHz",
        rating,
        apCount
      };
    });
  }, [band]);

  const bestChannels = useMemo(() => {
    return channelData
      .sort((a, b) => b.rating - a.rating || a.apCount - b.apCount)
      .slice(0, 10)
      .map(c => c.number)
      .join(", ");
  }, [channelData]);

  return (
    <div className="space-y-4 max-w-2xl mx-auto font-mono text-sm">
      {/* Header Band Selection */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-background/50 border-border h-9">
              {band.replace('GHz', ' GHz')} <ChevronDown className="ml-2 w-4 h-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem onClick={() => setBand('2.4GHz')}>2.4 GHz</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBand('5GHz')}>5 GHz</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBand('6GHz')}>6 GHz</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Current Connection Summary */}
      {currentConnection && (
        <div className="space-y-1 px-2 border-l-2 border-primary/50">
          <p className="text-blue-400 font-bold">Current connection</p>
          <p className="text-foreground">
            {currentConnection.ssid} - {currentConnection.frequencyBand.replace('GHz', 'G')} ({currentConnection.macAddress})
          </p>
          <div className="flex gap-4 text-xs">
            <span className="text-green-500 font-bold">{currentConnection.signalStrength}dBm</span>
            <span>CH <span className="text-blue-400">{currentConnection.channel}</span> {currentConnection.frequencyMHz}</span>
          </div>
          <div className="flex gap-4 text-xs text-blue-400">
            <span>{currentConnection.bandwidthMbps}Mbps</span>
            <span>{currentConnection.ipAddress}</span>
          </div>
        </div>
      )}

      {/* Warning Banner */}
      <div className="flex items-center gap-2 p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[11px] font-bold justify-center">
        <AlertCircle className="w-4 h-4" /> Wi-Fi scan throttling is enabled
      </div>

      {/* Best Channels */}
      <div className="space-y-1">
        <h3 className="font-bold text-muted-foreground uppercase text-xs">Best Channels:</h3>
        <p className="text-cyan-400 font-bold">20 MHz <span className="text-green-500">{bestChannels}</span></p>
      </div>

      {/* Rating Table Header */}
      <div className="grid grid-cols-[1fr,80px,80px] gap-4 px-2 font-bold text-muted-foreground text-[11px] uppercase border-b border-border pb-2">
        <div>Channel Rating</div>
        <div className="text-center">Channel Number</div>
        <div className="text-center">Access Point Count</div>
      </div>

      {/* Rating List */}
      <div className="space-y-1">
        {channelData.map((chan) => (
          <div key={chan.number} className="grid grid-cols-[1fr,80px,80px] gap-4 items-center px-2 py-1.5 hover:bg-muted/20 rounded transition-colors group">
            <div className="flex gap-0.5">
              {[...Array(10)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3.5 h-3.5 ${i < chan.rating ? 'text-green-500 fill-green-500' : 'text-muted-foreground/20'}`} 
                />
              ))}
            </div>
            <div className="text-center">
              <span className="text-cyan-400 font-bold">{chan.number}</span>
              <span className="text-[10px] text-muted-foreground ml-1">20 MHz</span>
            </div>
            <div className="text-center text-blue-400 font-bold">
              {chan.apCount}
            </div>
          </div>
        ))}
      </div>

      {/* Professional Footer Insight */}
      <Card className="glass border-none bg-blue-500/5 border border-blue-500/10 mt-6">
        <CardContent className="p-4">
          <p className="text-[11px] text-blue-500 flex items-center gap-2 leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <strong>System Recommendation:</strong> Based on current Aruba spectral analysis, channels with fewer than 2 APs are prioritized. Avoid overlapping channels (2, 3, 4, 5) in the 2.4GHz spectrum for stability.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
