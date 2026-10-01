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

  // Create user with email and password
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Update display name
  await updateProfile(userCredential.user, { displayName: name });

  // Get ID token
  const token = await userCredential.user.getIdToken();

  // Save profile to Firestore immediately so Admin Panel and User Dashboard have the record
  try {
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
    await setDoc(doc(db, 'users', userCredential.user.uid), initialProfile, { merge: true });
  } catch (fsErr) {
    console.warn('Failed to save user profile to Firestore in registerUser:', fsErr);
  }

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
 * Fetch and construct complete UserProfile from FirebaseUser and Firestore
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

  let fsData: any = null;
  try {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      fsData = snap.data();
    } else {
      const initialProfile: UserProfile = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        userId,
        mobile_number: normalizedMobile,
        mobileNumber: normalizedMobile,
        phone: normalizedMobile,
        name:
          firebaseUser.displayName ||
          (cleanMobile ? `Patient (${cleanMobile.slice(-4)})` : 'Patient User'),
        displayName:
          firebaseUser.displayName ||
          (cleanMobile ? `Patient (${cleanMobile.slice(-4)})` : 'Patient User'),
        email: firebaseUser.email || '',
        role: isDefaultAdmin ? 'ADMIN' : 'USER',
        is_verified: true,
        isVerified: true,
        is_active: true,
        isActive: true,
        created_at: firebaseUser.metadata.creationTime || now,
        createdAt: firebaseUser.metadata.creationTime || now,
        updated_at: now,
        updatedAt: now,
        last_login_at: now,
        lastLogin: now,
        registrationDate: firebaseUser.metadata.creationTime || now,
      };
      await setDoc(userDocRef, initialProfile, { merge: true }).catch(() => {});
      return initialProfile;
    }
  } catch (err) {
    console.warn('Firestore read error in getUserProfileFromFirebaseUser:', err);
  }

  if (fsData) {
    if (fsData.is_active === false || fsData.isActive === false) {
      await firebaseSignOut(auth).catch(() => {});
      throw new Error('Your account has been deactivated. Please contact B.L. Diagnostic Center.');
    }

    const name =
      fsData.name ||
      fsData.displayName ||
      firebaseUser.displayName ||
      (cleanMobile ? `Patient (${cleanMobile.slice(-4)})` : 'Patient User');

    const role: UserRole = isDefaultAdmin ? 'ADMIN' : fsData.role || 'USER';
    const createdAt =
      fsData.created_at || fsData.createdAt || firebaseUser.metadata.creationTime || now;

    // Update last_login_at in background
    setDoc(
      doc(db, 'users', firebaseUser.uid),
      {
        last_login_at: now,
        lastLogin: now,
        updated_at: now,
        updatedAt: now,
      },
      { merge: true }
    ).catch(() => {});

    return {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      userId: fsData.userId || userId,
      mobile_number: fsData.mobile_number || normalizedMobile,
      mobileNumber: fsData.mobileNumber || normalizedMobile,
      phone: fsData.phone || fsData.mobile_number || normalizedMobile,
      name,
      displayName: name,
      email: firebaseUser.email || fsData.email || '',
      role,
      is_verified: true,
      isVerified: true,
      is_active: true,
      isActive: true,
      created_at: createdAt,
      createdAt,
      updated_at: now,
      updatedAt: now,
      last_login_at: now,
      lastLogin: now,
      registrationDate: fsData.registrationDate || createdAt,
    };
  }

  // Fallback if Firestore read fails
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    userId,
    mobile_number: normalizedMobile,
    mobileNumber: normalizedMobile,
    phone: normalizedMobile,
    name:
      firebaseUser.displayName ||
      (cleanMobile ? `Patient (${cleanMobile.slice(-4)})` : 'Patient User'),
    displayName:
      firebaseUser.displayName ||
      (cleanMobile ? `Patient (${cleanMobile.slice(-4)})` : 'Patient User'),
    email: firebaseUser.email || '',
    role: isDefaultAdmin ? 'ADMIN' : 'USER',
    is_verified: true,
    isVerified: true,
    is_active: true,
    isActive: true,
    created_at: firebaseUser.metadata.creationTime || now,
    createdAt: firebaseUser.metadata.creationTime || now,
    updated_at: now,
    updatedAt: now,
    last_login_at: now,
    lastLogin: now,
    registrationDate: firebaseUser.metadata.creationTime || now,
  };
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
