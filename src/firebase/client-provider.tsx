
'use client';

import React, { useMemo } from 'react';
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
  const { firebaseApp, firestore, auth } = useMemo(() => {
    // Only initialize on the client
    if (typeof window === 'undefined') {
      return { firebaseApp: null as any, firestore: null as any, auth: null as any };
    }
    return initializeFirebase();
  }, []);

  // Don't render provider if we're on the server or initialization hasn't happened
  if (!firebaseApp) {
    return <>{children}</>;
  }

  return (
    <FirebaseProvider firebaseApp={firebaseApp} firestore={firestore} auth={auth}>
      {children}
    </FirebaseProvider>
  );
}
