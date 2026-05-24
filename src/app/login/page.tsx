
"use client";

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wifi, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc, getFirestore } from 'firebase/firestore';

export default function LoginPage() {
  const [email, setEmail] = useState('hanybkhite@gmail.com');
  const [password, setPassword] = useState('Hany1234!@#$');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { auth } = useAuth();
  const db = getFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: email,
          role: 'admin',
          createdAt: new Date().toISOString()
        });
        toast({ title: "Account created", description: "Welcome to NetPulse CAF." });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome back", description: "Authentication successful." });
      }
      router.push('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "Please check your credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
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
                placeholder="name@gdit.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full gradient-blue-cyan h-11" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isRegistering ? "Create Admin Account" : "Sign In"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-xs"
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
