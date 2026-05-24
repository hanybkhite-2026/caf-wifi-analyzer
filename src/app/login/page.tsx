"use client";

import { useState, useEffect } from 'react';
import { useAuth, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wifi, Loader2, AlertCircle, ShieldCheck, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from 'firebase/firestore';

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
        title: "System Not Ready",
        description: "Firebase services are still initializing. Please wait a moment.",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      if (isRegistering) {
        // 1. Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 2. Update the Auth profile
        await updateProfile(userCredential.user, {
          displayName: 'Admin User'
        });

        // 3. Store extended user data in Firestore
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
      console.error("Authentication Error Details:", error);
      
      let title = "Auth Connection Error";
      let message = error.message || "An unexpected error occurred.";

      if (error.code === 'auth/api-key-not-valid') {
        title = "API Key Error";
        message = "Firebase reports the API key is invalid. Please check the 'studio-80326841e-b8f17' project settings in Google Cloud Console to ensure the API key has no restrictions and Firebase Auth is enabled.";
      } else if (error.code === 'auth/user-not-found') {
        message = "No account found with this email. Please click 'Register' at the bottom first.";
      } else if (error.code === 'auth/wrong-password') {
        message = "Incorrect password.";
      } else if (error.code === 'auth/email-already-in-use') {
        message = "This email is already registered. Try signing in instead.";
      }
      
      toast({
        variant: "destructive",
        title: title,
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

      <Card className="w-full max-w-md glass border-none shadow-2xl z-10 animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl gradient-blue-cyan flex items-center justify-center mx-auto shadow-xl">
            <Wifi className="text-white w-8 h-8" />
          </div>
          <div>
            <CardTitle className="text-2xl font-headline font-bold">NetPulse CAF</CardTitle>
            <CardDescription>Enterprise WiFi Infrastructure Analyzer</CardDescription>
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
                <p>Registering <strong>Admin</strong> credentials.</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg text-blue-500 border border-blue-500/20 text-xs font-medium">
                <Key className="w-4 h-4 shrink-0" />
                <p>Use your <strong>GDIT Admin</strong> credentials to sign in.</p>
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
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
