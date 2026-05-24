"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Star, ShieldAlert, Zap, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ChannelRatingTab() {
  const channels = [
    { num: 1, stars: 5, status: "Excellent", interference: "Minimal" },
    { num: 6, stars: 2, status: "Congested", interference: "High" },
    { num: 11, stars: 4, status: "Good", interference: "Low" },
    { num: 36, stars: 5, status: "Excellent", interference: "None" },
    { num: 44, stars: 5, status: "Excellent", interference: "None" },
    { num: 149, stars: 3, status: "Moderate", interference: "Medium" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map((chan) => (
          <Card key={chan.num} className="glass border-none shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Radio className="w-16 h-16" />
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2">Channel {chan.num}</Badge>
                  <CardTitle className="text-xl font-headline">{chan.status}</CardTitle>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < chan.stars ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground opacity-30'}`} 
                    />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Interference
                  </span>
                  <span className={chan.interference === 'High' ? 'text-red-500 font-bold' : 'text-green-500'}>
                    {chan.interference}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Potential Speed
                  </span>
                  <span className="font-mono">{chan.stars * 200} Mbps</span>
                </div>
                <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${chan.stars >= 4 ? 'bg-green-500' : chan.stars >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    style={{ width: `${chan.stars * 20}%` }} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="glass border-none bg-blue-500/5 border border-blue-500/10">
        <CardContent className="p-6">
          <p className="text-sm text-blue-500 flex items-center gap-2">
            <Info className="w-4 h-4" />
            <strong>Analysis Insight:</strong> Channels 1, 6, and 11 are the only non-overlapping channels in the 2.4GHz spectrum. For CAF-WIFI deployments on Aruba APs, we recommend prioritizing DFS channels in the 5GHz band to minimize civilian interference.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  );
}
