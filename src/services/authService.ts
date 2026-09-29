import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types/auth';
import { syncEntityToGoogleSheets } from './sheetsService';
import {
  normalizeIndianMobileNumber,
  deriveDeterministicUserUuid,
  deriveFormattedUserId,
} from '../lib/phoneUtils';

const USERS_COLLECTION = 'users';
const SESSION_TOKEN_STORAGE_KEY = 'bl_diagnostic_otp_session_token';

// Authorized Admin mobile numbers
const ADMIN_MOBILE_NUMBERS = new Set<string>(['+919649183422']);

function getStoredSessionToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredSessionToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Normalizes a partial user object into a complete UserProfile matching the Mobile + OTP schema.
 */
export function normalizeUserProfileRecord(raw: any): UserProfile {
  const now = new Date().toISOString();
  const normalizedMobile =
    normalizeIndianMobileNumber(raw?.mobile_number || raw?.mobileNumber || raw?.phone) ||
    String(raw?.mobile_number || raw?.phone || '').trim();
  const id =
    raw?.id ||
    raw?.uid ||
    (normalizedMobile ? deriveDeterministicUserUuid(normalizedMobile) : `user-${Date.now()}`);
  const userId =
    raw?.userId ||
    raw?.user_id ||
    (normalizedMobile ? deriveFormattedUserId(normalizedMobile) : `USER-${id.slice(0, 6).toUpperCase()}`);
  const name =
    raw?.name ||
    raw?.displayName ||
    raw?.full_name ||
    (normalizedMobile ? `Patient (${normalizedMobile.slice(-4)})` : 'Patient User');
  const isDefaultAdmin = ADMIN_MOBILE_NUMBERS.has(normalizedMobile);
  const role = raw?.role || (isDefaultAdmin ? 'ADMIN' : 'USER');
  const isVerified = raw?.is_verified ?? raw?.isVerified ?? true;
  const isActive = raw?.is_active ?? raw?.isActive ?? true;
  const createdAt = raw?.created_at || raw?.createdAt || raw?.registrationDate || now;
  const updatedAt = raw?.updated_at || raw?.updatedAt || now;
  const lastLoginAt = raw?.last_login_at || raw?.lastLogin || updatedAt;

  return {
    id,
    uid: id,
    userId,
    mobile_number: normalizedMobile,
    mobileNumber: normalizedMobile,
    phone: normalizedMobile,
    name,
    displayName: name,
    email: raw?.email || '',
    role,
    is_verified: Boolean(isVerified),
    isVerified: Boolean(isVerified),
    is_active: Boolean(isActive),
    isActive: Boolean(isActive),
    created_at: createdAt,
    createdAt,
    updated_at: updatedAt,
    updatedAt,
    last_login_at: lastLoginAt,
    lastLogin: lastLoginAt,
    registrationDate: raw?.registrationDate || createdAt,
  };
}

/**
 * Helper to build the exact 11-column Users sheet payload:
 * User ID | Firebase UID | Full Name | Email | Phone | Role | Account Status | Registration Date | Last Login | Created At | Updated At
 */
function buildUserSheetPayload(profile: UserProfile) {
  const now = new Date().toISOString();
  return {
    userId: profile.userId || deriveFormattedUserId(profile.mobile_number),
    uid: profile.id,
    firebase_uid: profile.id,
    full_name: profile.name || profile.displayName,
    name: profile.name || profile.displayName,
    email: profile.email || '',
    phone: profile.mobile_number,
    mobile_number: profile.mobile_number,
    role: profile.role,
    account_status: profile.is_active === false ? 'DEACTIVATED' : 'ACTIVE',
    status: profile.is_active === false ? 'DEACTIVATED' : 'ACTIVE',
    registration_date: profile.created_at || now,
    last_login: profile.last_login_at || now,
    created_at: profile.created_at || now,
    updated_at: profile.updated_at || now,
  };
}

/**
 * Request a 6-digit OTP to be sent to an Indian mobile number (+91XXXXXXXXXX).
 * Generation and hashing occur strictly on the backend server.
 */
export async function sendMobileOtp(mobileInput: string): Promise<{
  success: boolean;
  mobile_number: string;
  isExistingUser: boolean;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
  liveSmsDispatched: boolean;
  sandboxOtp?: string;
  message: string;
}> {
  const normalized = normalizeIndianMobileNumber(mobileInput);
  if (!normalized) {
    throw new Error('Please enter a valid 10-digit Indian mobile number.');
  }

  const res = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile_number: normalized }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to send OTP. Please try again.');
  }

  return data;
}

/**
 * Resend 6-digit OTP after cooldown period.
 */
export async function resendMobileOtp(mobileInput: string): Promise<{
  success: boolean;
  mobile_number: string;
  isExistingUser: boolean;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
  liveSmsDispatched: boolean;
  sandboxOtp?: string;
  message: string;
}> {
  const normalized = normalizeIndianMobileNumber(mobileInput);
  if (!normalized) {
    throw new Error('Please enter a valid 10-digit Indian mobile number.');
  }

  const res = await fetch('/api/auth/resend-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile_number: normalized }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Please wait before requesting another OTP.');
  }

  return data;
}

/**
 * Verify 6-digit OTP on the server, persist/merge user in Firestore (ensuring unique mobile_number),
 * create a secure session, and sync to Google Sheets.
 */
export async function verifyMobileOtp(params: {
  mobileInput: string;
  otp: string;
  name?: string;
}): Promise<{
  profile: UserProfile;
  isNewUser: boolean;
}> {
  const normalized = normalizeIndianMobileNumber(params.mobileInput);
  if (!normalized) {
    throw new Error('Please enter a valid 10-digit Indian mobile number.');
  }

  const cleanOtp = String(params.otp || '').replace(/\D/g, '');
  if (cleanOtp.length !== 6) {
    throw new Error('Please enter the 6-digit OTP sent to your mobile number.');
  }

  const res = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobile_number: normalized,
      otp: cleanOtp,
      name: params.name?.trim() || undefined,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success || !data.user) {
    throw new Error(data.error || 'Invalid or expired OTP. Please try again.');
  }

  if (data.sessionToken) {
    setStoredSessionToken(data.sessionToken);
  }

  let profile = normalizeUserProfileRecord(data.user);
  let isNewUser = Boolean(data.isNewUser);

  // Sync with Firestore `users` collection using canonical ID (and check for any existing doc by mobile_number)
  try {
    const docRef = doc(db, USERS_COLLECTION, profile.id);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const existingData = snap.data();
      isNewUser = false;
      if (existingData.is_active === false || existingData.isActive === false) {
        await logoutUser();
        throw new Error('Your account has been deactivated. Please contact B.L. Diagnostic Center.');
      }

      const mergedName =
        params.name?.trim() ||
        (existingData.name && !String(existingData.name).startsWith('Patient (')
          ? existingData.name
          : existingData.displayName || profile.name);

      profile = normalizeUserProfileRecord({
        ...existingData,
        ...profile,
        name: mergedName,
        displayName: mergedName,
        role: existingData.role || profile.role,
        created_at: existingData.created_at || existingData.createdAt || profile.created_at,
        last_login_at: profile.last_login_at,
        updated_at: profile.updated_at,
      });

      await setDoc(docRef, profile, { merge: true });
    } else {
      // Also check if a user document already exists with this mobile_number under a legacy UID
      const q = query(
        collection(db, USERS_COLLECTION),
        where('mobile_number', '==', normalized)
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const existingDoc = querySnap.docs[0];
        const existingData = existingDoc.data();
        isNewUser = false;
        if (existingData.is_active === false || existingData.isActive === false) {
          await logoutUser();
          throw new Error(
            'Your account has been deactivated. Please contact B.L. Diagnostic Center.'
          );
        }
        profile = normalizeUserProfileRecord({
          ...existingData,
          id: existingDoc.id,
          uid: existingDoc.id,
          mobile_number: normalized,
          last_login_at: profile.last_login_at,
          updated_at: profile.updated_at,
        });
        await setDoc(doc(db, USERS_COLLECTION, existingDoc.id), profile, { merge: true });
      } else {
        await setDoc(docRef, profile);
      }
    }
  } catch (err: any) {
    if (err?.message?.includes('deactivated')) {
      throw err;
    }
    console.warn('Firestore user profile sync warning:', err);
  }

  // Synchronize to Google Sheets ("Users" tab)
  syncEntityToGoogleSheets({
    entityType: 'Users',
    entityId: profile.id,
    operation: isNewUser ? 'CREATE' : 'UPDATE',
    record: buildUserSheetPayload(profile),
  }).catch(() => {});

  return { profile, isNewUser };
}

/**
 * Fetch the currently authenticated user's profile from the active server OTP session + Firestore.
 */
export async function fetchCurrentSessionUser(): Promise<UserProfile | null> {
  const token = getStoredSessionToken();
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['X-Session-Token'] = token;
    }

    const res = await fetch('/api/auth/session', {
      method: 'GET',
      headers,
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.authenticated || !data.user) {
      setStoredSessionToken(null);
      return null;
    }

    let profile = normalizeUserProfileRecord(data.user);

    // Enrich with Firestore document if available
    try {
      const docRef = doc(db, USERS_COLLECTION, profile.id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const fsData = snap.data();
        if (fsData.is_active === false || fsData.isActive === false) {
          await logoutUser();
          return null;
        }
        profile = normalizeUserProfileRecord({
          ...profile,
          ...fsData,
          mobile_number: profile.mobile_number,
        });
      } else {
        await setDoc(docRef, profile).catch(() => {});
      }
    } catch {
      // Return server-verified profile if Firestore read is offline
    }

    return profile;
  } catch (err) {
    console.error('Error verifying session:', err);
    return null;
  }
}

/**
 * Legacy helper kept for compatibility: fetches user profile by UID from Firestore.
 */
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return normalizeUserProfileRecord(snap.data());
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sign out session from server and clear stored session token.
 */
export async function logoutUser(): Promise<void> {
  const token = getStoredSessionToken();
  setStoredSessionToken(null);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['X-Session-Token'] = token;
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers,
    });
  } catch {
    // Ignore network error on logout
  }
}

/**
 * Update user profile details (Name) in both Server Session Store, Firestore, and Google Sheets Users tab.
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, 'displayName' | 'name' | 'phone'>>
): Promise<UserProfile | null> {
  const now = new Date().toISOString();
  const cleanName = (updates.name || updates.displayName || '').trim();
  const token = getStoredSessionToken();

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['X-Session-Token'] = token;
    await fetch('/api/auth/profile', {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        userId: uid,
        name: cleanName || undefined,
      }),
    });
  } catch {
    // Continue to Firestore update
  }

  const docRef = doc(db, USERS_COLLECTION, uid);
  const firestoreUpdates: Record<string, any> = {
    updated_at: now,
    updatedAt: now,
  };
  if (cleanName) {
    firestoreUpdates.name = cleanName;
    firestoreUpdates.displayName = cleanName;
  }

  await updateDoc(docRef, firestoreUpdates).catch(async () => {
    await setDoc(docRef, firestoreUpdates, { merge: true }).catch(() => {});
  });

  const snap = await getDoc(docRef).catch(() => null);
  if (snap && snap.exists()) {
    const updatedProfile = normalizeUserProfileRecord(snap.data());
    syncEntityToGoogleSheets({
      entityType: 'Users',
      entityId: uid,
      operation: 'UPDATE',
      record: buildUserSheetPayload(updatedProfile),
    }).catch(() => {});
    return updatedProfile;
  }
  return null;
}
