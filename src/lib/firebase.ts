import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

const rawConfig: FirebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env?.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID,
};

/**
 * 必須の Firebase 設定値が設定されているか判定する
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    rawConfig.apiKey &&
    rawConfig.projectId &&
    rawConfig.appId &&
    !rawConfig.apiKey.includes('your-api-key')
  );
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured()) {
  try {
    const existingApps = getApps();
    appInstance = existingApps.length > 0 ? existingApps[0] : initializeApp(rawConfig);
    authInstance = getAuth(appInstance);
    firestoreInstance = getFirestore(appInstance);
  } catch (error) {
    console.warn('[Firebase] Initialization skipped or failed:', error);
  }
}

export const firebaseApp = appInstance;
export const auth = authInstance;
export const db = firestoreInstance;
