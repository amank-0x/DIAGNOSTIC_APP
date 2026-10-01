import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types/auth';
import { getUserProfileFromFirebaseUser } from './firebaseAuthService';

/**
 * Get current Firebase user as UserProfile
 */
export async function getCurrentFirebaseUser(): Promise<UserProfile | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe();
      if (firebaseUser) {
        try {
          const profile = await getUserProfileFromFirebaseUser(firebaseUser);
          resolve(profile);
        } catch {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Sign out from Firebase
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

