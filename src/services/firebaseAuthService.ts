import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types/auth';

/**
 * Firebase Email/Password Authentication Service
 * Uses mobile number as hidden email: mobile@bldiagnostic.app
 */

const APP_DOMAIN = 'bldiagnostic.app';
export const ADMIN_MOBILE_NUMBERS = new Set<string>(['+919649183422', '9649183422']);

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

  // 1. Create user in Firebase Auth (instant: ~300ms)
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // 2. Set display name in Firebase Auth
  try {
    await updateProfile(userCredential.user, { displayName: name.trim() });
  } catch (nameErr) {
    console.warn('Could not update display name:', nameErr);
  }

  // 3. Get ID token
  const token = await userCredential.user.getIdToken();

  // 4. Construct local user profile immediately & cache in localStorage (0ms)
  const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
  const normalizedMobile = `+91${cleanMobile}`;
  const userId = `USER-${cleanMobile}`;
  const now = new Date().toISOString();
  const isDefaultAdmin =
    ADMIN_MOBILE_NUMBERS.has(normalizedMobile) || ADMIN_MOBILE_NUMBERS.has(cleanMobile);

  const initialProfile: UserProfile = {
    id: userCredential.user.uid,
    uid: userCredential.user.uid,
    userId,
    mobile_number: normalizedMobile,
    mobileNumber: normalizedMobile,
    phone: normalizedMobile,
    name: name.trim(),
    displayName: name.trim(),
    email: userCredential.user.email || email,
    role: isDefaultAdmin ? 'ADMIN' : 'USER',
    is_verified: true,
    isVerified: true,
    is_active: true,
    isActive: true,
    created_at: now,
    createdAt: now,
    updated_at: now,
    updatedAt: now,
    last_login_at: now,
    lastLogin: now,
    registrationDate: now,
  };

  try {
    localStorage.setItem(`user_profile_${userCredential.user.uid}`, JSON.stringify(initialProfile));
  } catch {}

  // 5. Fire-and-forget: persist to Firestore in background without blocking registration
  setDoc(doc(db, 'users', userCredential.user.uid), initialProfile, { merge: true }).catch(() => {});

  // 6. Fire-and-forget: sync to Google Sheets in background without blocking registration
  fetch('/api/register-sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: name.trim(), mobile: cleanMobile, address }),
  }).catch((error) => {
    console.warn('Background sheets sync trigger:', error);
  });

  return { user: userCredential.user, token };
}

/**
 * Fetch and construct complete UserProfile from FirebaseUser, local cache, and Firestore
 */
export async function getUserProfileFromFirebaseUser(
  firebaseUser: FirebaseUser
): Promise<UserProfile> {
  const cleanMobile = (firebaseUser.email || '')
    .replace('@bldiagnostic.app', '')
    .replace(/\D/g, '')
    .slice(-10);
  const normalizedMobile = cleanMobile ? `+91${cleanMobile}` : '';
  const userId = cleanMobile
    ? `USER-${cleanMobile}`
    : `USER-${firebaseUser.uid.slice(0, 6).toUpperCase()}`;
  const isDefaultAdmin =
    ADMIN_MOBILE_NUMBERS.has(normalizedMobile) ||
    ADMIN_MOBILE_NUMBERS.has(cleanMobile) ||
    (firebaseUser.phoneNumber ? ADMIN_MOBILE_NUMBERS.has(firebaseUser.phoneNumber) : false);

  const now = new Date().toISOString();

  // 1. Instant local cache lookup (0ms)
  let cached: UserProfile | null = null;
  try {
    const raw = localStorage.getItem(`user_profile_${firebaseUser.uid}`);
    if (raw) cached = JSON.parse(raw);
  } catch {}

  const displayName =
    cached?.displayName ||
    cached?.name ||
    firebaseUser.displayName ||
    (cleanMobile ? `Patient (${cleanMobile.slice(-4)})` : 'Patient User');

  const profile: UserProfile = {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    userId: cached?.userId || userId,
    mobile_number: cached?.mobile_number || normalizedMobile,
    mobileNumber: cached?.mobileNumber || normalizedMobile,
    phone: cached?.phone || normalizedMobile,
    name: displayName,
    displayName: displayName,
    email: firebaseUser.email || cached?.email || '',
    role: isDefaultAdmin ? 'ADMIN' : cached?.role || 'USER',
    is_verified: true,
    isVerified: true,
    is_active: true,
    isActive: true,
    created_at: cached?.created_at || firebaseUser.metadata.creationTime || now,
    createdAt: cached?.createdAt || firebaseUser.metadata.creationTime || now,
    updated_at: now,
    updatedAt: now,
    last_login_at: now,
    lastLogin: now,
    registrationDate: cached?.registrationDate || firebaseUser.metadata.creationTime || now,
  };

  try {
    localStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(profile));
  } catch {}

  // 2. Non-blocking Firestore sync in background (timeout race at 1 second so it never hangs)
  const syncWithFirestore = async () => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const fsData = snap.data();
        if (fsData.is_active === false || fsData.isActive === false) {
          await firebaseSignOut(auth).catch(() => {});
          return;
        }
        const merged: UserProfile = {
          ...profile,
          ...fsData,
          role: isDefaultAdmin ? 'ADMIN' : fsData.role || profile.role,
        };
        try {
          localStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(merged));
        } catch {}
      } else {
        setDoc(userDocRef, profile, { merge: true }).catch(() => {});
      }
    } catch {}
  };

  // Run in background without awaiting
  syncWithFirestore().catch(() => {});

  return profile;
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
