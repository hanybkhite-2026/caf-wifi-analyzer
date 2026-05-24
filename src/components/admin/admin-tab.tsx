
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TEAM_MEMBERS as INITIAL_MEMBERS } from "@/lib/mock-data";
import { UserPlus, ShieldAlert, BarChart, MoreVertical, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminTab() {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const { toast } = useToast();

  const handleRemoveMember = (id: string, name: string) => {
    setMembers(members.filter(m => m.id !== id));
    toast({
      title: "Member Removed",
      description: `${name} has been removed from the organization.`,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-headline">Organization Management</h2>
          <p className="text-muted-foreground">Monitor team performance and system access</p>
        </div>
        <Button className="gradient-blue-cyan shadow-lg shadow-blue-500/20">
          <UserPlus className="w-4 h-4 mr-2" /> Invite Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" /> Security Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">0</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" /> All systems secured
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BarChart className="w-4 h-4 text-blue-500" /> Org Monthly Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">1,248</div>
            <p className="text-xs text-blue-500 mt-1 flex items-center">
              <Activity className="w-3 h-3 mr-1" /> On track for target
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-500" /> Sys Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">99.98%</div>
            <p className="text-xs text-muted-foreground mt-1">Last incident: 24 days ago</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-headline">Team Members</CardTitle>
          <CardDescription>Performance tracking for field technicians</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lifetime Scans</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/10 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 border border-border">
                        <AvatarImage src={`https://picsum.photos/seed/${member.id}/32/32`} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-bold">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                      {member.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={member.status === 'Active' ? 'text-green-500 border-green-500/20 bg-green-500/10' : 'text-muted-foreground'}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono font-bold">{member.scans}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(member.scans/2.5, 100)}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{Math.round(Math.min(member.scans/2.5, 100))}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={() => handleRemoveMember(member.id, member.name)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No team members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Activity({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
}
