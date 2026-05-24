'use client';

import React, { useState, useEffect } from 'react';
import { initializeFirebase } from './init';
import { FirebaseProvider } from './provider';

/**
 * A client-side wrapper for the FirebaseProvider that handles initialization.
 * This component ensures Firebase is initialized only once on the client.
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
    // Initialize Firebase services only on the client
    const initialized = initializeFirebase();
    setServices(initialized);
  }, []);

  // Return children as-is if services aren't ready to avoid hydration issues,
  // but context will be null until initialized.
  if (!services) {
    return <>{children}</>;
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
