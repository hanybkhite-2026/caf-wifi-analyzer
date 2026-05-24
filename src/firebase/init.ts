
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Initializes the Firebase application and its services.
 * This should only be called on the client side.
 */
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
} {
  const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);

  return { firebaseApp, firestore, auth };
}
