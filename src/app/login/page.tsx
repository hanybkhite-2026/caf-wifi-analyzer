"use client";

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wifi, Loader2, ShieldCheck, Key, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { firebaseConfig } from '@/firebase/config';

export default function LoginPage() {
  const [email, setEmail] = useState('hanybkhite@gmail.com');
  const [password, setPassword] = useState('Hany1234!@#$');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { auth } = useAuth();
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Initialization Error",
        description: "Firebase Auth is not initialized. Please check your config.",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: 'Admin User' });
        }
        toast({ title: "Registration Successful", description: "Admin account created." });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome Back", description: "Signed in successfully." });
      }
    } catch (error: any) {
      console.error("Auth Exception:", error.code, error.message);
      let message = error.message || "An unexpected error occurred.";
      
      if (error.code === 'auth/api-key-not-valid') {
        message = "The Firebase API Key is rejected by the server. Please verify it in the Firebase Console under Project Settings.";
      }
      
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden">
      <Card className="w-full max-w-md bg-[#1e293b] border-none shadow-2xl z-10 text-white">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto shadow-xl">
            <Wifi className="text-white w-8 h-8" />
          </div>
          <div>
            <CardTitle className="text-2xl font-headline font-bold">NetPulse CAF</CardTitle>
            <CardDescription className="text-slate-400">Enterprise Infrastructure Analyzer</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isRegistering ? "Create Admin Account" : "Sign In"}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              className="text-xs hover:bg-transparent hover:underline text-slate-400"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Already have an account? Sign In" : "Need access? Register as Admin"}
            </Button>
            
            <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-[10px] text-slate-500 font-mono w-full">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-300">
                  <AlertCircle className="w-3.5 h-3.5" /> CONFIG DIAGNOSTICS
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => window.location.reload()}>
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
              <p className="truncate">Project: {firebaseConfig.projectId}</p>
              <p className="truncate">Key: {firebaseConfig.apiKey.substring(0, 10)}...</p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}