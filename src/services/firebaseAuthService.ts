import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

/**
 * Firebase Email/Password Authentication Service
 * Uses mobile number as hidden email: mobile@bldiagnostic.app
 */

const APP_DOMAIN = 'bldiagnostic.app';

/**
 * Convert mobile number to Firebase email
 * @param mobile - 10-digit Indian mobile number
 * @returns email in format: mobile@bldiagnostic.app
 */
export function mobileToEmail(mobile: string): string {
  const cleanMobile = mobile.replace(/\D/g, '').slice(0, 10);
  return `${cleanMobile}@${APP_DOMAIN}`;
}

/**
 * Register a new user with email/password
 * @param name - User's full name
 * @param mobile - 10-digit mobile number
 * @param address - User's address
 * @param password - User's password
 * @returns Firebase user and token
 */
export async function registerUser(
  name: string,
  mobile: string,
  address: string,
  password: string
): Promise<{ user: FirebaseUser; token: string }> {
  const email = mobileToEmail(mobile);

  // Create user with email and password
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Update display name
  await updateProfile(userCredential.user, { displayName: name });

  // Get ID token
  const token = await userCredential.user.getIdToken();

  // Sync to Google Sheets via server
  try {
    await fetch('/api/register-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, mobile, address }),
    });
  } catch (error) {
    console.warn('Registration sync to sheets failed:', error);
    // Don't fail registration if sheet sync fails
  }

  return { user: userCredential.user, token };
}

/**
 * Login user with email/password
 * @param mobile - 10-digit mobile number
 * @param password - User's password
 * @returns Firebase user and token
 */
export async function loginUser(
  mobile: string,
  password: string
): Promise<{ user: FirebaseUser; token: string }> {
  const email = mobileToEmail(mobile);

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();

  return { user: userCredential.user, token };
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns validation result
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate mobile number
 * @param mobile - Mobile number to validate
 * @returns validation result
 */
export function validateMobile(mobile: string): {
  isValid: boolean;
  error?: string;
} {
  const cleanMobile = mobile.replace(/\D/g, '');

  if (cleanMobile.length !== 10) {
    return { isValid: false, error: 'Mobile number must be 10 digits' };
  }

  if (!/^[6-9]/.test(cleanMobile)) {
    return { isValid: false, error: 'Mobile number must start with 6, 7, 8, or 9' };
  }

  return { isValid: true };
}
