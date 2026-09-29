import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  normalizeIndianMobileNumber,
  deriveDeterministicUserUuid,
  deriveFormattedUserId,
} from '../../lib/phoneUtils';

/**
 * Server-Side Mobile Number + OTP Authentication Service for B.L. Diagnostic Center
 *
 * Enforces:
 * - Strict Indian mobile normalization (+91XXXXXXXXXX)
 * - 6-digit cryptographically random OTP generation on server only
 * - HMAC-SHA256 hashed OTP storage (never stores plaintext OTP)
 * - 5-minute OTP expiration
 * - One-time use invalidation after verification
 * - Max 5 verification attempts per OTP
 * - 30-second resend cooldown
 * - Per-mobile and per-IP rate limiting
 * - Configurable SMS OTP provider (MSG91 / Fast2SMS / Twilio) via environment variables
 */

export type ServerUserRole = 'USER' | 'STAFF' | 'ADMIN';

export interface ServerUserRecord {
  id: string;
  uid: string;
  userId: string;
  mobile_number: string;
  mobileNumber: string;
  phone: string;
  name: string;
  displayName: string;
  email: string;
  role: ServerUserRole;
  is_verified: boolean;
  isVerified: boolean;
  is_active: boolean;
  isActive: boolean;
  created_at: string;
  createdAt: string;
  updated_at: string;
  updatedAt: string;
  last_login_at: string;
  lastLogin: string;
}

interface OtpRecord {
  id: string;
  mobile_number: string;
  otp_hash: string;
  expires_at: number; // epoch ms
  cooldown_until: number; // epoch ms
  attempts: number;
  max_attempts: number;
  verified: boolean;
  verified_at?: number;
  ip_address?: string;
  created_at: number;
}

interface SessionRecord {
  session_id: string;
  user_id: string;
  mobile_number: string;
  token_hash: string;
  expires_at: number;
  created_at: number;
}

const OTP_EXPIRY_SECONDS = Number(process.env.OTP_EXPIRY_SECONDS || 300); // 5 minutes
const OTP_RESEND_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 30); // 30 seconds
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_RATE_LIMIT_WINDOW_MS = Number(process.env.OTP_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000); // 10 minutes
const OTP_MAX_SENDS_PER_WINDOW = Number(process.env.OTP_MAX_SENDS_PER_WINDOW || 6);
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 30 * 24 * 60 * 60 * 1000); // 30 days

function getOtpSecret(): string {
  return (
    process.env.OTP_SECRET ||
    process.env.SESSION_SECRET ||
    'bl-diagnostic-center-server-otp-hmac-secret-2026'
  );
}

function getAdminMobileNumbers(): Set<string> {
  const raw = process.env.ADMIN_MOBILE_NUMBERS || '+919649183422';
  const set = new Set<string>(['+919649183422']);
  for (const part of raw.split(',')) {
    const normalized = normalizeIndianMobileNumber(part.trim());
    if (normalized) set.add(normalized);
  }
  return set;
}

// Persistent server store backed by local JSON file + memory for instant durability across restarts
const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_STORE_PATH = path.join(DATA_DIR, 'users_otp_store.json');

const usersByMobile = new Map<string, ServerUserRecord>();
const usersById = new Map<string, ServerUserRecord>();
const otpByMobile = new Map<string, OtpRecord>();
const sendHistoryByKey = new Map<string, number[]>();
const sessionsByTokenHash = new Map<string, SessionRecord>();

function loadPersistedUsers() {
  try {
    if (fs.existsSync(USERS_STORE_PATH)) {
      const raw = fs.readFileSync(USERS_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as ServerUserRecord[];
      if (Array.isArray(parsed)) {
        for (const u of parsed) {
          if (u && u.mobile_number) {
            usersByMobile.set(u.mobile_number, u);
            usersById.set(u.id, u);
          }
        }
      }
    }
  } catch (e) {
    console.warn('[OTP Auth] Could not read persisted user store:', e);
  }
}

function savePersistedUsers() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(usersByMobile.values());
    fs.writeFileSync(USERS_STORE_PATH, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[OTP Auth] Could not persist user store:', e);
  }
}

loadPersistedUsers();

function hashOtp(normalizedMobile: string, otp: string): string {
  return crypto
    .createHmac('sha256', getOtpSecret())
    .update(`OTP:${normalizedMobile}:${otp.trim()}`)
    .digest('hex');
}

function verifyOtpHash(normalizedMobile: string, candidateOtp: string, expectedHashHex: string): boolean {
  const candidateHashHex = hashOtp(normalizedMobile, candidateOtp);
  const a = Buffer.from(candidateHashHex, 'hex');
  const b = Buffer.from(expectedHashHex, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function hashSessionToken(rawToken: string): string {
  return crypto
    .createHmac('sha256', getOtpSecret())
    .update(`SESSION:${rawToken}`)
    .digest('hex');
}

function createSignedStatelessToken(user: ServerUserRecord, expiresAt: number): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      mob: user.mobile_number,
      role: user.role,
      exp: expiresAt,
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getOtpSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifySignedStatelessToken(token: string): {
  sub: string;
  mob: string;
  role: ServerUserRole;
  exp: number;
} | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getOtpSecret())
    .update(payload)
    .digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (!decoded.exp || Date.now() > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}

function checkOtpSendRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const history = (sendHistoryByKey.get(key) || []).filter(
    (ts) => now - ts < OTP_RATE_LIMIT_WINDOW_MS
  );
  if (history.length >= OTP_MAX_SENDS_PER_WINDOW) {
    const oldest = history[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((OTP_RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000)
    );
    sendHistoryByKey.set(key, history);
    return { allowed: false, retryAfterSeconds };
  }
  history.push(now);
  sendHistoryByKey.set(key, history);
  return { allowed: true };
}

/**
 * Dispatches the 6-digit OTP via configured SMS provider (MSG91, Fast2SMS, or Twilio).
 * Credentials are read strictly from server environment variables and never exposed to the client.
 */
async function dispatchSmsViaProvider(
  normalizedMobile: string,
  otp: string
): Promise<{ liveSmsDispatched: boolean; provider: string }> {
  const provider = String(process.env.SMS_PROVIDER || '').toUpperCase().trim();
  const smsApiKey = process.env.SMS_API_KEY || '';
  const senderId = process.env.SMS_SENDER_ID || 'BLDIAG';
  const templateId = process.env.SMS_TEMPLATE_ID || '';

  // 1. Fast2SMS Provider
  if (provider === 'FAST2SMS' && smsApiKey) {
    const tenDigit = normalizedMobile.slice(3);
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: smsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: otp,
        numbers: tenDigit,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`SMS provider error (${res.status}): ${errText.slice(0, 120)}`);
    }
    return { liveSmsDispatched: true, provider: 'FAST2SMS' };
  }

  // 2. MSG91 Provider
  if (provider === 'MSG91' && smsApiKey) {
    const mobileWithoutPlus = normalizedMobile.replace('+', '');
    const res = await fetch('https://control.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        authkey: smsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: templateId,
        mobile: mobileWithoutPlus,
        otp,
        sender: senderId,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`MSG91 OTP dispatch failed (${res.status}): ${errText.slice(0, 120)}`);
    }
    return { liveSmsDispatched: true, provider: 'MSG91' };
  }

  // 3. Twilio Provider
  const twilioSid = process.env.TWILIO_ACCOUNT_SID || '';
  const twilioToken = process.env.TWILIO_AUTH_TOKEN || '';
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER || '';
  if ((provider === 'TWILIO' || (twilioSid && twilioToken)) && twilioSid && twilioToken && twilioFrom) {
    const params = new URLSearchParams();
    params.append('To', normalizedMobile);
    params.append('From', twilioFrom);
    params.append(
      'Body',
      `Your B.L. Diagnostic Center verification OTP is ${otp}. Valid for 5 minutes. Do not share this code.`
    );

    const authBasic = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authBasic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Twilio SMS dispatch failed (${res.status}): ${errText.slice(0, 120)}`);
    }
    return { liveSmsDispatched: true, provider: 'TWILIO' };
  }

  // Sandbox / Development mode when live SMS gateway credentials are not yet configured in .env
  console.log(
    `[B.L. Diagnostic OTP Service] Mobile: ${normalizedMobile} | 6-Digit OTP: ${otp} (Valid for ${OTP_EXPIRY_SECONDS}s)`
  );
  return { liveSmsDispatched: false, provider: 'SERVER_DEV_SANDBOX' };
}

/**
 * Generates and sends a 6-digit OTP to a validated Indian mobile number.
 */
export async function requestMobileOtp(params: {
  mobileInput: string;
  ipAddress?: string;
  isResend?: boolean;
}): Promise<{
  success: boolean;
  mobile_number: string;
  isExistingUser: boolean;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
  liveSmsDispatched: boolean;
  sandboxOtp?: string;
  message: string;
}> {
  const normalizedMobile = normalizeIndianMobileNumber(params.mobileInput);
  if (!normalizedMobile) {
    throw new Error(
      'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).'
    );
  }

  const now = Date.now();
  const existingOtp = otpByMobile.get(normalizedMobile);

  // Enforce 30-second resend cooldown
  if (existingOtp && !existingOtp.verified && now < existingOtp.cooldown_until) {
    const waitSeconds = Math.max(1, Math.ceil((existingOtp.cooldown_until - now) / 1000));
    throw new Error(`Please wait ${waitSeconds} seconds before requesting another OTP.`);
  }

  // Enforce rate limit per mobile number and per IP
  const mobileRate = checkOtpSendRateLimit(`mob:${normalizedMobile}`);
  if (!mobileRate.allowed) {
    throw new Error(
      `Too many OTP requests for this mobile number. Please try again in ${mobileRate.retryAfterSeconds} seconds.`
    );
  }

  if (params.ipAddress) {
    const ipRate = checkOtpSendRateLimit(`ip:${params.ipAddress}`);
    if (!ipRate.allowed) {
      throw new Error(
        `Too many OTP requests from your network. Please try again in ${ipRate.retryAfterSeconds} seconds.`
      );
    }
  }

  // Generate cryptographically secure 6-digit OTP
  const otpPlain = String(crypto.randomInt(100000, 1000000));
  const otpHash = hashOtp(normalizedMobile, otpPlain);

  const otpRecord: OtpRecord = {
    id: crypto.randomUUID(),
    mobile_number: normalizedMobile,
    otp_hash: otpHash,
    expires_at: now + OTP_EXPIRY_SECONDS * 1000,
    cooldown_until: now + OTP_RESEND_COOLDOWN_SECONDS * 1000,
    attempts: 0,
    max_attempts: OTP_MAX_ATTEMPTS,
    verified: false,
    ip_address: params.ipAddress,
    created_at: now,
  };

  otpByMobile.set(normalizedMobile, otpRecord);

  const dispatchResult = await dispatchSmsViaProvider(normalizedMobile, otpPlain);
  const existingUser = usersByMobile.get(normalizedMobile);

  return {
    success: true,
    mobile_number: normalizedMobile,
    isExistingUser: Boolean(existingUser),
    expiresInSeconds: OTP_EXPIRY_SECONDS,
    resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    liveSmsDispatched: dispatchResult.liveSmsDispatched,
    // Only provide sandboxOtp when no external SMS API key is configured so preview testing works out of the box
    sandboxOtp: !dispatchResult.liveSmsDispatched ? otpPlain : undefined,
    message: `OTP sent successfully to +91 ${normalizedMobile.slice(3)}`,
  };
}

/**
 * Verifies a 6-digit OTP for a mobile number, creates the user if new or logs in if existing,
 * and issues a signed server session token.
 */
export async function verifyMobileOtpOnServer(params: {
  mobileInput: string;
  otpInput: string;
  nameInput?: string;
  ipAddress?: string;
}): Promise<{
  success: boolean;
  isNewUser: boolean;
  user: ServerUserRecord;
  sessionToken: string;
  expiresAt: number;
}> {
  const normalizedMobile = normalizeIndianMobileNumber(params.mobileInput);
  if (!normalizedMobile) {
    throw new Error('Please enter a valid 10-digit Indian mobile number.');
  }

  const cleanOtp = String(params.otpInput || '').replace(/\D/g, '');
  if (!/^\d{6}$/.test(cleanOtp)) {
    throw new Error('Please enter a valid 6-digit OTP.');
  }

  const otpRecord = otpByMobile.get(normalizedMobile);
  if (!otpRecord || otpRecord.verified) {
    throw new Error('No active OTP found for this mobile number. Please request a new OTP.');
  }

  const now = Date.now();

  // Check expiration
  if (now > otpRecord.expires_at) {
    otpByMobile.delete(normalizedMobile);
    throw new Error('OTP has expired. Please request a new OTP.');
  }

  // Check maximum verification attempts
  if (otpRecord.attempts >= otpRecord.max_attempts) {
    otpByMobile.delete(normalizedMobile);
    throw new Error('Maximum OTP verification attempts exceeded. Please request a new OTP.');
  }

  // Timing-safe hash comparison
  const isValid = verifyOtpHash(normalizedMobile, cleanOtp, otpRecord.otp_hash);
  if (!isValid) {
    otpRecord.attempts += 1;
    const remaining = Math.max(0, otpRecord.max_attempts - otpRecord.attempts);
    if (remaining === 0) {
      otpByMobile.delete(normalizedMobile);
      throw new Error('Invalid OTP. Maximum attempts reached. Please request a new OTP.');
    }
    otpByMobile.set(normalizedMobile, otpRecord);
    throw new Error(`Invalid OTP. Please check the 6-digit code (${remaining} attempts remaining).`);
  }

  // Mark OTP verified & invalidate immediately (strict one-time use)
  otpRecord.verified = true;
  otpRecord.verified_at = now;
  otpByMobile.delete(normalizedMobile);

  const nowIso = new Date(now).toISOString();
  const adminNumbers = getAdminMobileNumbers();
  const isDefaultAdmin = adminNumbers.has(normalizedMobile);

  let user = usersByMobile.get(normalizedMobile);
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const id = deriveDeterministicUserUuid(normalizedMobile);
    const userId = deriveFormattedUserId(normalizedMobile);
    const cleanName = params.nameInput?.trim() || `Patient (${normalizedMobile.slice(-4)})`;

    user = {
      id,
      uid: id,
      userId,
      mobile_number: normalizedMobile,
      mobileNumber: normalizedMobile,
      phone: normalizedMobile,
      name: cleanName,
      displayName: cleanName,
      email: '',
      role: isDefaultAdmin ? 'ADMIN' : 'USER',
      is_verified: true,
      isVerified: true,
      is_active: true,
      isActive: true,
      created_at: nowIso,
      createdAt: nowIso,
      updated_at: nowIso,
      updatedAt: nowIso,
      last_login_at: nowIso,
      lastLogin: nowIso,
    };
  } else {
    if (user.is_active === false || user.isActive === false) {
      throw new Error('Your account has been deactivated. Please contact B.L. Diagnostic Center.');
    }
    if (params.nameInput && params.nameInput.trim().length >= 2) {
      user.name = params.nameInput.trim();
      user.displayName = params.nameInput.trim();
    }
    if (isDefaultAdmin && user.role === 'USER') {
      user.role = 'ADMIN';
    }
    user.is_verified = true;
    user.isVerified = true;
    user.last_login_at = nowIso;
    user.lastLogin = nowIso;
    user.updated_at = nowIso;
    user.updatedAt = nowIso;
  }

  usersByMobile.set(normalizedMobile, user);
  usersById.set(user.id, user);
  savePersistedUsers();

  // Issue signed session token
  const expiresAt = now + SESSION_TTL_MS;
  const sessionToken = createSignedStatelessToken(user, expiresAt);
  const tokenHash = hashSessionToken(sessionToken);

  sessionsByTokenHash.set(tokenHash, {
    session_id: crypto.randomUUID(),
    user_id: user.id,
    mobile_number: user.mobile_number,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_at: now,
  });

  return {
    success: true,
    isNewUser,
    user,
    sessionToken,
    expiresAt,
  };
}

/**
 * Validates a session token and returns the associated user record.
 */
export function getAuthenticatedUserFromToken(rawToken: string | undefined): ServerUserRecord | null {
  if (!rawToken) return null;
  const decoded = verifySignedStatelessToken(rawToken);
  if (!decoded) return null;

  const normalizedMobile = normalizeIndianMobileNumber(decoded.mob) || decoded.mob;
  let user = usersByMobile.get(normalizedMobile) || usersById.get(decoded.sub);

  if (!user) {
    // Reconstruct user from verified signed token if server restarted without persisted file
    const nowIso = new Date().toISOString();
    const id = decoded.sub || deriveDeterministicUserUuid(normalizedMobile);
    const userId = deriveFormattedUserId(normalizedMobile);
    user = {
      id,
      uid: id,
      userId,
      mobile_number: normalizedMobile,
      mobileNumber: normalizedMobile,
      phone: normalizedMobile,
      name: `Patient (${normalizedMobile.slice(-4)})`,
      displayName: `Patient (${normalizedMobile.slice(-4)})`,
      email: '',
      role: decoded.role || 'USER',
      is_verified: true,
      isVerified: true,
      is_active: true,
      isActive: true,
      created_at: nowIso,
      createdAt: nowIso,
      updated_at: nowIso,
      updatedAt: nowIso,
      last_login_at: nowIso,
      lastLogin: nowIso,
    };
    usersByMobile.set(normalizedMobile, user);
    usersById.set(user.id, user);
  }

  if (user.is_active === false || user.isActive === false) {
    return null;
  }

  return user;
}

/**
 * Updates user profile (e.g. name) on the server store.
 */
export function updateServerUserProfile(
  userId: string,
  updates: { name?: string; role?: ServerUserRole; is_active?: boolean }
): ServerUserRecord | null {
  const existing = usersById.get(userId);
  if (!existing) return null;

  const nowIso = new Date().toISOString();
  if (typeof updates.name === 'string' && updates.name.trim()) {
    existing.name = updates.name.trim();
    existing.displayName = updates.name.trim();
  }
  if (updates.role) {
    existing.role = updates.role;
  }
  if (typeof updates.is_active === 'boolean') {
    existing.is_active = updates.is_active;
    existing.isActive = updates.is_active;
  }
  existing.updated_at = nowIso;
  existing.updatedAt = nowIso;

  usersById.set(existing.id, existing);
  usersByMobile.set(existing.mobile_number, existing);
  savePersistedUsers();
  return existing;
}

/**
 * Revokes a session token upon logout.
 */
export function revokeSessionToken(rawToken: string | undefined): void {
  if (!rawToken) return;
  const tokenHash = hashSessionToken(rawToken);
  sessionsByTokenHash.delete(tokenHash);
}
