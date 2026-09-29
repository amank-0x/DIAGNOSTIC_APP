import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseAppletConfig from '../../firebase-applet-config.json';

/**
 * Single canonical Firebase initialization for B.L. Diagnostic Center.
 * Merges firebase-applet-config.json with optional VITE_FIREBASE_* environment overrides.
 * Never creates duplicate Firebase app instances.
 */
const env = (import.meta as any).env || {};

export const firebaseConfig = {
  projectId:
    (env.VITE_FIREBASE_PROJECT_ID && !String(env.VITE_FIREBASE_PROJECT_ID).includes('placeholder')
      ? env.VITE_FIREBASE_PROJECT_ID
      : firebaseAppletConfig.projectId) || firebaseAppletConfig.projectId,
  appId:
    (env.VITE_FIREBASE_APP_ID && !String(env.VITE_FIREBASE_APP_ID).includes('placeholder')
      ? env.VITE_FIREBASE_APP_ID
      : firebaseAppletConfig.appId) || firebaseAppletConfig.appId,
  apiKey:
    (env.VITE_FIREBASE_API_KEY && !String(env.VITE_FIREBASE_API_KEY).includes('placeholder')
      ? env.VITE_FIREBASE_API_KEY
      : firebaseAppletConfig.apiKey) || firebaseAppletConfig.apiKey,
  authDomain:
    (env.VITE_FIREBASE_AUTH_DOMAIN && !String(env.VITE_FIREBASE_AUTH_DOMAIN).includes('placeholder')
      ? env.VITE_FIREBASE_AUTH_DOMAIN
      : firebaseAppletConfig.authDomain) || firebaseAppletConfig.authDomain,
  storageBucket:
    (env.VITE_FIREBASE_STORAGE_BUCKET && !String(env.VITE_FIREBASE_STORAGE_BUCKET).includes('placeholder')
      ? env.VITE_FIREBASE_STORAGE_BUCKET
      : firebaseAppletConfig.storageBucket) || firebaseAppletConfig.storageBucket,
  messagingSenderId:
    (env.VITE_FIREBASE_MESSAGING_SENDER_ID && !String(env.VITE_FIREBASE_MESSAGING_SENDER_ID).includes('placeholder')
      ? env.VITE_FIREBASE_MESSAGING_SENDER_ID
      : firebaseAppletConfig.messagingSenderId) || firebaseAppletConfig.messagingSenderId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = (firebaseAppletConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseAppletConfig as any).firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Google Workspace OAuth Scopes configured for Google Sheets & Drive integration
export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

export const googleProvider = new GoogleAuthProvider();
SCOPES.forEach((scope) => googleProvider.addScope(scope));
export const googleWorkspaceProvider = googleProvider;

// In-memory cache for Google Workspace OAuth access token (never stored in localStorage/sessionStorage)
let cachedWorkspaceAccessToken: string | null = null;

export function setWorkspaceAccessToken(token: string | null): void {
  cachedWorkspaceAccessToken = token;
}

export function getWorkspaceAccessToken(): string | null {
  return cachedWorkspaceAccessToken;
}

export default app;
