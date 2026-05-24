"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { REPORTS, MOCK_NETWORKS } from "@/lib/mock-data";
import { FileText, Download, Eye, Search, Filter, Sparkles, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { reportIssueRecommendations, type ReportIssueRecommendationsOutput } from "@/ai/flows/report-issue-recommendations";
import { useToast } from "@/hooks/use-toast";

export function ReportsTab() {
  const [selectedReport, setSelectedReport] = useState<typeof REPORTS[0] | null>(null);
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);
  const [recs, setRecs] = useState<ReportIssueRecommendationsOutput | null>(null);
  const { toast } = useToast();

  const handleGenerateRecs = async (report: typeof REPORTS[0]) => {
    setIsGeneratingRecs(true);
    setSelectedReport(report);
    try {
      const result = await reportIssueRecommendations({
        location: report.location,
        networksFound: report.networks,
        cafAps: report.cafAps,
        avgSignal: report.avgSignal,
        identifiedIssues: ["Moderate congestion on 2.4GHz"],
        scanDetails: MOCK_NETWORKS.map(n => ({
          ssid: n.ssid,
          networkType: n.networkType as any,
          signalStrength: n.signalStrength,
          wifiChannel: n.channel,
          connectedClients: n.clientsConnected
        }))
      });
      setRecs(result);
    } catch (error) {
      toast({ title: "Failed", description: "Could not generate recommendations.", variant: "destructive" });
    } finally {
      setIsGeneratingRecs(false);
    }
  };

  return (
    <div className="space-y-6">
      {!selectedReport ? (
        <Card className="glass border-none shadow-xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-headline">Audit Reports Registry</CardTitle>
                <CardDescription>Manage and export your CAF network scan history</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search reports..." className="pl-9 bg-background/50 border-border w-full md:w-64" />
                </div>
                <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Report ID</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Networks</TableHead>
                  <TableHead>Avg Signal</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {REPORTS.map((report) => (
                  <TableRow key={report.id} className="group hover:bg-muted/20 transition-colors">
                    <TableCell className="font-mono text-primary font-bold">{report.id}</TableCell>
                    <TableCell className="font-medium">{report.location}</TableCell>
                    <TableCell className="text-muted-foreground">{report.date}</TableCell>
                    <TableCell>{report.networks} detected</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${report.avgSignal >= -55 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {report.avgSignal} dBm
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleGenerateRecs(report)}>
                        <Eye className="w-4 h-4 mr-2" /> View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => { setSelectedReport(null); setRecs(null); }} className="mb-2">
            <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Back to List
          </Button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 glass border-none p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold font-headline">{selectedReport.location}</h2>
                  <p className="text-muted-foreground">Scan performed on {selectedReport.date}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> PDF</Button>
                  <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> CSV</Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Networks", val: selectedReport.networks },
                  { label: "CAF APs", val: selectedReport.cafAps },
                  { label: "Avg Signal", val: `${selectedReport.avgSignal}dBm` },
                  { label: "Audit Result", val: "PASS", color: "text-green-500" },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground uppercase mb-1">{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.color || ''}`}>{stat.val}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-bold font-headline mb-4">Detailed Scan Metrics</h3>
              <div className="space-y-3">
                {MOCK_NETWORKS.map((n, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="font-medium">{n.ssid}</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span>{n.signalStrength} dBm</span>
                      <span className="text-muted-foreground">{n.frequencyBand}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="glass border-none gradient-card-purple overflow-hidden">
              <CardHeader className="border-b border-white/10 bg-white/5">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" /> AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isGeneratingRecs ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
                    <p className="font-bold">Analyzing scan data...</p>
                    <p className="text-xs text-muted-foreground mt-2">Checking for interference patterns</p>
                  </div>
                ) : recs ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-500 mb-2">Issue Summary</h4>
                      <p className="text-sm leading-relaxed">{recs.issueSummary}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-500 mb-2">Actionable Recommendations</h4>
                      <ul className="space-y-2">
                        {recs.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm flex gap-2">
                            <div className="w-5 h-5 shrink-0 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-[10px] font-bold">
                              {i + 1}
                            </div>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Button onClick={() => handleGenerateRecs(selectedReport)} className="bg-purple-600 hover:bg-purple-700">
                      Generate Analysis
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}
