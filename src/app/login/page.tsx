"use client";

import { useState, useEffect } from 'react';
import { useAuth, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wifi, Loader2, AlertCircle } from "lucide-react";
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
    
    // Check if Firebase is initialized correctly
    if (!auth || !db || (auth as any).config?.apiKey === "placeholder-api-key") {
      toast({
        variant: "destructive",
        title: "Configuration Missing",
        description: "Please update src/firebase/config.ts with your real Firebase project keys.",
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

        setDoc(userRef, userData).catch(async (error) => {
          const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'create',
            requestResourceData: userData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });

        toast({ 
          title: "Account Created", 
          description: "Welcome! Your admin account has been created." 
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ 
          title: "Welcome Back", 
          description: "Sign in successful." 
        });
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      let message = error.message || "An unexpected error occurred.";
      
      if (error.code === 'auth/user-not-found') {
        message = "No account found. Please register first.";
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Incorrect email or password.";
      } else if (error.code === 'auth/email-already-in-use') {
        message = "This email is already registered.";
      } else if (error.code === 'auth/invalid-api-key') {
        message = "The Firebase API key is invalid. Check your config.ts.";
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
              <Label htmlFor="email">Email / Username</Label>
              <Input
                id="email"
                type="email"
                placeholder="hanybkhite@gmail.com"
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

            {!isRegistering && (
              <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg text-blue-500 border border-blue-500/20 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>New here? Use the <strong>Register</strong> option below to create an admin account.</p>
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
