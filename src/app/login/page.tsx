"use client";

import { useState, useEffect } from 'react';
import { useAuth, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wifi, Loader2, ShieldCheck, Key, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

export default function LoginPage() {
  const [email, setEmail] = useState('hanybkhite@gmail.com');
  const [password, setPassword] = useState('Hany1234!@#$');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { auth, firestore: db } = useAuth();
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
    
    if (!auth || !db) {
      toast({
        variant: "destructive",
        title: "Initialization Error",
        description: "Firebase services are not ready. Please refresh the page.",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        await updateProfile(userCredential.user, {
          displayName: 'Admin User'
        });

        const userRef = doc(db, 'users', userCredential.user.uid);
        const userData = {
          uid: userCredential.user.uid,
          email: email,
          displayName: 'Admin User',
          role: 'admin',
          createdAt: new Date().toISOString()
        };

        setDoc(userRef, userData, { merge: true })
          .catch(async (dbError: any) => {
            if (dbError.code === 'permission-denied') {
              const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'create',
                requestResourceData: userData,
              });
              errorEmitter.emit('permission-error', permissionError);
            }
          });

        toast({ 
          title: "Registration Successful", 
          description: "Your admin account has been created." 
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ 
          title: "Welcome Back", 
          description: "Signed in as " + email 
        });
      }
    } catch (error: any) {
      console.error("Auth Exception:", error.code, error.message);
      
      let message = error.message || "An unexpected error occurred.";

      if (error.code === 'auth/api-key-not-valid') {
        message = "CRITICAL: The API Key is rejected by Firebase. Please go to the Firebase Console, select project 'studio-80326841e-b8f17', and ensure Authentication is ENABLED and Email/Password provider is active.";
      } else if (error.code === 'auth/user-not-found') {
        message = "Account not found. Use the 'Register' toggle below to create your account first.";
      } else if (error.code === 'auth/wrong-password') {
        message = "Incorrect password.";
      } else if (error.code === 'auth/email-already-in-use') {
        message = "This email is already registered. Try signing in.";
      }
      
      toast({
        variant: "destructive",
        title: "Authentication Failed",
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent rounded-full blur-[120px]" />
      </div>

      <Card className="w-full max-w-md glass border-none shadow-2xl z-10">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl gradient-blue-cyan flex items-center justify-center mx-auto shadow-xl">
            <Wifi className="text-white w-8 h-8" />
          </div>
          <div>
            <CardTitle className="text-2xl font-headline font-bold">NetPulse CAF</CardTitle>
            <CardDescription>Infrastructure Analyzer Login</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@caf.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>

            {isRegistering ? (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg text-primary border border-primary/20 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <p>Registering new <strong>Admin</strong> access.</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg text-blue-500 border border-blue-500/20 text-xs font-medium">
                <Key className="w-4 h-4 shrink-0" />
                <p>Sign in with your <strong>GDIT</strong> credentials.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full gradient-blue-cyan h-11" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isRegistering ? "Create Admin Account" : "Sign In"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-xs hover:bg-transparent hover:underline"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Already have an account? Sign In" : "Need an account? Register as Admin"}
            </Button>
            
            <div className="mt-4 p-3 bg-secondary/30 rounded-lg border border-border text-[10px] text-muted-foreground font-mono w-full">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3 h-3" /> CONFIG CHECK
                </div>
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => window.location.reload()}>
                  <RefreshCw className="w-2.5 h-2.5" />
                </Button>
              </div>
              <p className="truncate">Project: {firebaseConfig.projectId}</p>
              <p className="truncate">Key: {firebaseConfig.apiKey.substring(0, 10)}...</p>
              <p className="mt-2 text-[9px] text-orange-500 italic">If 'api-key-not-valid' persists, please verify Auth is enabled in Console.</p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
