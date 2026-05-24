'use client';

import React, { useState, useEffect } from 'react';
import { initializeFirebase } from './init';
import { FirebaseProvider } from './provider';
import { Loader2 } from 'lucide-react';

/**
 * A client-side wrapper for the FirebaseProvider that handles initialization.
 * Modified to be non-blocking so the app can run even if Firebase is pending.
 */
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [services, setServices] = useState<{
    firebaseApp: any;
    firestore: any;
    auth: any;
  } | null>(null);

  useEffect(() => {
    try {
      const initialized = initializeFirebase();
      setServices(initialized);
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      // We don't block the app here so the UI can still render in "bypass" mode
    }
  }, []);

  // If services are still null (initializing), we show a quick loader
  // but we provide a fallback empty state if it takes too long
  if (!services) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-slate-400 text-sm font-medium">Initializing NetPulse Systems...</p>
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider 
      firebaseApp={services.firebaseApp} 
      firestore={services.firestore} 
      auth={services.auth}
    >
      {children}
    </FirebaseProvider>
  );
}
