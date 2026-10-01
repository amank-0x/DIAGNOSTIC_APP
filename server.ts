import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import {
  getGoogleSheetsAuthStatus,
  setRuntimeGoogleOAuthConnection,
  setRuntimeSpreadsheetId,
  extractSpreadsheetId,
  SPREADSHEET_TITLE,
} from './src/server/sheets/googleSheetsAuth';
import {
  WORKSHEET_TABS,
  OFFICIAL_CANONICAL_TABS,
  WORKSHEET_HEADERS,
  WorksheetTabName,
  CanonicalTabName,
  mapEntityToSheetRow,
} from './src/server/sheets/googleSheetsMapper';
import {
  ensureAllWorksheetsExist,
  initializeGoogleSheets,
  fetchWorksheetObjects,
  syncUserRegistrationToUsersSheet,
  syncBookingToBookingsSheet,
  syncLeadToLeadsSheet,
  syncPatientToPatientsSheet,
  syncTimeSlotsToSheet,
  syncTests,
  syncPackages,
  upsertRecordsToWorksheet,
} from './src/server/sheets/googleSheetsService';
import { INITIAL_RATE_LIST_RECORDS } from './src/data/rateListRecords';
import { INITIAL_PACKAGES_DATA } from './src/data/packagesData';
import {
  executeEntitySyncToSheets,
  getServerSyncLogs,
  getServerSyncMetrics,
} from './src/server/sheets/googleSheetsSync';
import { retryFailedGoogleSheetsSyncs } from './src/server/sheets/googleSheetsRetry';
import {
  requestMobileOtp,
  verifyMobileOtpOnServer,
  getAuthenticatedUserFromToken,
  updateServerUserProfile,
  revokeSessionToken,
} from './src/server/auth/otpAuthService';

dotenv.config();

// Firebase Admin will be initialized dynamically when needed
let firebaseAdmin: typeof import('firebase-admin') | null = null;

async function getFirebaseAdmin() {
  if (!firebaseAdmin) {
    try {
      firebaseAdmin = await import('firebase-admin');
      const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT)
        : null;

      if (serviceAccount) {
        if (!firebaseAdmin.apps.length) {
          firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(serviceAccount),
          });
          console.log('Firebase Admin initialized with service account');
        }
      } else {
        console.warn('Firebase Admin service account not configured');
      }
    } catch (error) {
      console.warn('Firebase Admin initialization failed:', error);
    }
  }
  return firebaseAdmin;
}

// Initialize Google Sheets API with Service Account
const sheetsAuth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth: sheetsAuth });

const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = process.env.NODE_ENV || 'development';

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 120);

function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown'
  );
}

function apiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const clientIp = getClientIp(req);
  const now = Date.now();
  const bucket = rateLimitBuckets.get(clientIp);

  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  bucket.count++;
  if (bucket.count > RATE_LIMIT_MAX_REQUESTS) {
    res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
    return res.status(429).json({
      error: 'Too many requests. Please wait a moment before retrying.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }

  return next();
}

function extractBearerToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      setRuntimeGoogleOAuthConnection({ accessToken: token });
      return token;
    }
  }
  return undefined;
}

function extractSessionToken(req: Request): string | undefined {
  const sessionHeader = req.headers['x-session-token'];
  if (typeof sessionHeader === 'string' && sessionHeader.trim()) {
    return sessionHeader.trim();
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)bl_session_token=([^;]+)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return undefined;
}

function setSessionCookie(res: Response, token: string, maxAgeSeconds: number) {
  res.setHeader(
    'Set-Cookie',
    `bl_session_token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=None; Secure`
  );
}

function clearSessionCookie(res: Response) {
  res.setHeader(
    'Set-Cookie',
    'bl_session_token=; Path=/; Max-Age=0; HttpOnly; SameSite=None; Secure'
  );
}

async function startServer() {
  const app = express();

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    if (NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  app.use(express.json({ limit: '5mb' }));

  app.use('/api', apiRateLimiter, (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (process.env.LOG_LEVEL !== 'silent') {
        console.log(
          `[API] ${new Date().toISOString()} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`
        );
      }
    });
    next();
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    const sheetsStatus = getGoogleSheetsAuthStatus();
    res.json({
      status: 'healthy',
      service: 'B.L. Diagnostic Center Production Server',
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      authentication: 'MOBILE_OTP_SERVER_VERIFIED',
      database: {
        primarySourceOfTruth: 'PostgreSQL / Firestore',
        operationalSyncLayer: 'Google Sheets v4',
      },
      googleSheets: {
        spreadsheetTitle: SPREADSHEET_TITLE,
        mode: sheetsStatus.mode,
        configured: sheetsStatus.configured,
      },
    });
  });

  // ============================================================================
  // MOBILE NUMBER + OTP AUTHENTICATION ENDPOINTS
  // ============================================================================

  /**
   * POST /api/auth/send-otp
   * Validates Indian mobile number (+91XXXXXXXXXX), generates 6-digit OTP server-side,
   * hashes OTP before storage, and dispatches SMS.
   */
  app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
    try {
      const mobile = req.body?.mobile_number || req.body?.mobile || req.body?.phone || '';
      const result = await requestMobileOtp({
        mobileInput: String(mobile),
        ipAddress: getClientIp(req),
        isResend: false,
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err?.message || 'Unable to send OTP. Please check your mobile number.',
      });
    }
  });

  /**
   * POST /api/auth/resend-otp
   * Enforces 30-second cooldown and rate limit before issuing a fresh 6-digit OTP.
   */
  app.post('/api/auth/resend-otp', async (req: Request, res: Response) => {
    try {
      const mobile = req.body?.mobile_number || req.body?.mobile || req.body?.phone || '';
      const result = await requestMobileOtp({
        mobileInput: String(mobile),
        ipAddress: getClientIp(req),
        isResend: true,
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err?.message || 'Unable to resend OTP right now.',
      });
    }
  });

  /**
   * POST /api/auth/verify-otp
   * Verifies 6-digit OTP server-side, creates account if new user or logs in if existing,
   * creates secure session, and triggers non-blocking Google Sheets Users sync.
   */
  app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
    try {
      const mobile = req.body?.mobile_number || req.body?.mobile || req.body?.phone || '';
      const otp = req.body?.otp || '';
      const name = req.body?.name || req.body?.fullName || '';

      const result = await verifyMobileOtpOnServer({
        mobileInput: String(mobile),
        otpInput: String(otp),
        nameInput: name ? String(name) : undefined,
        ipAddress: getClientIp(req),
      });

      const maxAgeSeconds = Math.max(
        60,
        Math.floor((result.expiresAt - Date.now()) / 1000)
      );
      setSessionCookie(res, result.sessionToken, maxAgeSeconds);

      // Non-blocking sync to Google Sheets 'Users' worksheet after primary user creation/update
      syncUserRegistrationToUsersSheet({
        userId: result.user.userId,
        firebaseUid: result.user.id,
        fullName: result.user.name,
        email: '',
        phone: result.user.mobile_number,
        role: result.user.role,
        accountStatus: result.user.is_active ? 'ACTIVE' : 'DEACTIVATED',
        registrationDate: result.user.created_at,
        lastLogin: result.user.last_login_at,
        createdAt: result.user.created_at,
        updatedAt: result.user.updated_at,
      }).catch(() => {});

      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err?.message || 'OTP verification failed. Please try again.',
      });
    }
  });

  /**
   * GET /api/auth/session
   * Validates active session token and returns the authenticated user profile.
   */
  app.get('/api/auth/session', (req: Request, res: Response) => {
    const token = extractSessionToken(req);
    const user = getAuthenticatedUserFromToken(token);
    if (!user) {
      return res.status(200).json({
        authenticated: false,
        user: null,
      });
    }
    return res.json({
      authenticated: true,
      user,
    });
  });

  /**
   * PUT /api/auth/profile
   * Updates user's name or status in the server user store.
   */
  app.put('/api/auth/profile', (req: Request, res: Response) => {
    const token = extractSessionToken(req);
    const currentUser = getAuthenticatedUserFromToken(token);
    const targetUserId = req.body?.userId || req.body?.id || currentUser?.id;

    if (!targetUserId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to update profile.',
      });
    }

    const updated = updateServerUserProfile(targetUserId, {
      name: req.body?.name || req.body?.displayName,
      role: currentUser?.role === 'ADMIN' ? req.body?.role : undefined,
      is_active:
        currentUser?.role === 'ADMIN' && typeof req.body?.is_active === 'boolean'
          ? req.body.is_active
          : undefined,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found.',
      });
    }

    return res.json({
      success: true,
      user: updated,
    });
  });

  /**
   * POST /api/auth/logout
   * Revokes server session and clears session cookie.
   */
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = extractSessionToken(req);
    revokeSessionToken(token);
    clearSessionCookie(res);
    return res.json({ success: true });
  });

  // ============================================================================
  // FIREBASE AUTH + GOOGLE SHEETS REGISTRATION SYNC
  // ============================================================================

  /**
   * POST /api/register-sync
   * Syncs Firebase user registration to Google Sheets.
   * Verifies Firebase ID token and appends row to Registrations sheet.
   */
  app.post('/api/register-sync', async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, error: 'Missing authorization token' });
      }

      // Verify Firebase ID token (if Firebase Admin is configured)
      const admin = await getFirebaseAdmin();
      if (admin && admin.apps.length > 0) {
        try {
          await admin.auth().verifyIdToken(token);
        } catch (error: any) {
          if (error.code === 'auth/id-token-expired' || error.code === 'auth/invalid-id-token') {
            return res.status(401).json({ success: false, error: 'Invalid or expired token' });
          }
          throw error;
        }
      } else {
        console.warn('Firebase Admin not initialized, skipping token verification');
      }

      const { name, mobile, address } = req.body;

      // Validate mobile number (10 digits, starts with 6-9)
      if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
        return res.status(400).json({ success: false, error: 'Invalid mobile number format' });
      }

      // Validate name and address
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }

      // Append to Google Sheets
      const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
      if (!spreadsheetId) {
        console.error('GOOGLE_SHEETS_SPREADSHEET_ID not configured');
        return res.status(500).json({ success: false, error: 'Server configuration error' });
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Registrations!A:F',
        valueInputOption: 'RAW',
        requestBody: {
          values: [
            [
              new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
              String(name).slice(0, 100),
              '+91' + mobile,
              String(address || '').slice(0, 300),
              'New',
              '',
            ],
          ],
        },
      });

      console.log(`Registration synced to sheets: ${name}, +91${mobile}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Sheet sync failed:', error);
      res.status(500).json({ success: false, error: 'Failed to sync registration' });
    }
  });

  // ============================================================================
  // GOOGLE SHEETS SYNC & OPERATIONAL ENDPOINTS
  // ============================================================================

  app.get('/api/sheets/status', (req: Request, res: Response) => {
    extractBearerToken(req);
    const authStatus = getGoogleSheetsAuthStatus();
    const metrics = getServerSyncMetrics();
    res.json({
      configured: authStatus.configured,
      authMode: authStatus.serviceAccountConfigured
        ? 'SERVICE_ACCOUNT'
        : authStatus.oauthConnected
        ? 'OAUTH_TOKEN'
        : 'NONE',
      spreadsheetTitle: SPREADSHEET_TITLE,
      spreadsheetId: authStatus.spreadsheetId,
      spreadsheetUrl: authStatus.spreadsheetUrl,
      connectionStatus: authStatus.configured ? 'CONNECTED' : 'CREDENTIALS_REQUIRED',
      mode: authStatus.mode,
      spreadsheetIdConfigured: authStatus.spreadsheetIdConfigured,
      serviceAccountConfigured: authStatus.serviceAccountConfigured,
      oauthConnected: authStatus.oauthConnected,
      serviceAccountEmailMasked: authStatus.serviceAccountEmailMasked,
      connectedAccountEmailMasked: authStatus.connectedAccountEmailMasked,
      spreadsheetIdMasked: authStatus.spreadsheetIdMasked,
      reason: authStatus.configured
        ? undefined
        : 'Configure GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in .env, or connect via Google Sheets in Admin.',
      worksheetsCount: OFFICIAL_CANONICAL_TABS.length,
      canonicalTabs: OFFICIAL_CANONICAL_TABS,
      worksheets: OFFICIAL_CANONICAL_TABS.map((tab) => ({
        name: tab,
        headers: WORKSHEET_HEADERS[tab],
      })),
      metrics,
      recentServerLogs: getServerSyncLogs().slice(0, 50),
    });
  });

  /**
   * POST /api/sheets/set-spreadsheet
   * Connect an existing Google Spreadsheet by URL or Spreadsheet ID.
   */
  app.post('/api/sheets/set-spreadsheet', async (req: Request, res: Response) => {
    try {
      const urlOrId = req.body?.urlOrId || req.body?.spreadsheetId || '';
      if (!urlOrId || !String(urlOrId).trim()) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid Google Spreadsheet URL or Spreadsheet ID.',
        });
      }

      const extracted = extractSpreadsheetId(String(urlOrId));
      setRuntimeSpreadsheetId(extracted);

      const bearerToken = extractBearerToken(req);
      let initResult: any = null;
      let initError: string | null = null;
      try {
        initResult = await initializeGoogleSheets(bearerToken);
      } catch (e: any) {
        initError = e.message;
      }

      const authStatus = getGoogleSheetsAuthStatus();
      return res.json({
        success: Boolean(initResult?.success || authStatus.spreadsheetIdConfigured),
        spreadsheetId: authStatus.spreadsheetId,
        spreadsheetIdMasked: authStatus.spreadsheetIdMasked,
        spreadsheetUrl: authStatus.spreadsheetUrl,
        ensuredTabs: initResult?.ensuredTabs || OFFICIAL_CANONICAL_TABS,
        connectionStatus: authStatus.configured ? 'CONNECTED' : 'CREDENTIALS_REQUIRED',
        initError,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err?.message || 'Failed to configure spreadsheet.',
      });
    }
  });

  /**
   * POST /api/sheets/initial-sync
   * Admin-controlled Initial Sync / Backfill:
   * Pushes existing PostgreSQL / catalog records into the 9 Google Sheet tabs.
   * Guarantees strict duplicate prevention via row lookup.
   */
  app.post('/api/sheets/initial-sync', async (req: Request, res: Response) => {
    try {
      const bearerToken = extractBearerToken(req);
      const authStatus = getGoogleSheetsAuthStatus();
      if (!authStatus.configured && !authStatus.oauthConnected && !bearerToken) {
        return res.status(400).json({
          success: false,
          error:
            'Google Sheets connection not configured yet. Paste your Spreadsheet URL and verify credentials or OAuth first.',
        });
      }

      // Ensure all 9 canonical tabs exist first
      await initializeGoogleSheets(bearerToken);

      let testsSynced = 0;
      let packagesSynced = 0;
      let slotsSynced = 0;

      // 1. Backfill Tests
      try {
        const testRes = await syncTests(INITIAL_RATE_LIST_RECORDS, bearerToken);
        testsSynced = testRes.syncedCount;
      } catch (e) {
        console.warn('Initial tests backfill notice:', e);
      }

      // 2. Backfill Packages
      try {
        const pkgRes = await syncPackages(INITIAL_PACKAGES_DATA, bearerToken);
        packagesSynced = pkgRes.syncedCount;
      } catch (e) {
        console.warn('Initial packages backfill notice:', e);
      }

      // 3. Backfill Standard Operating Time Slots
      try {
        const defaultSlots = [
          { slot_id: 'SLOT-0700', date: new Date().toISOString().slice(0, 10), start_time: '07:00 AM', end_time: '08:00 AM', capacity: 10, booked_count: 0, available_count: 10, status: 'AVAILABLE' },
          { slot_id: 'SLOT-0800', date: new Date().toISOString().slice(0, 10), start_time: '08:00 AM', end_time: '09:00 AM', capacity: 10, booked_count: 0, available_count: 10, status: 'AVAILABLE' },
          { slot_id: 'SLOT-0900', date: new Date().toISOString().slice(0, 10), start_time: '09:00 AM', end_time: '10:00 AM', capacity: 10, booked_count: 0, available_count: 10, status: 'AVAILABLE' },
          { slot_id: 'SLOT-1000', date: new Date().toISOString().slice(0, 10), start_time: '10:00 AM', end_time: '11:00 AM', capacity: 10, booked_count: 0, available_count: 10, status: 'AVAILABLE' },
          { slot_id: 'SLOT-1100', date: new Date().toISOString().slice(0, 10), start_time: '11:00 AM', end_time: '12:00 PM', capacity: 10, booked_count: 0, available_count: 10, status: 'AVAILABLE' },
          { slot_id: 'SLOT-1600', date: new Date().toISOString().slice(0, 10), start_time: '04:00 PM', end_time: '05:00 PM', capacity: 10, booked_count: 0, available_count: 10, status: 'AVAILABLE' },
          { slot_id: 'SLOT-1700', date: new Date().toISOString().slice(0, 10), start_time: '05:00 PM', end_time: '06:00 PM', capacity: 10, booked_count: 0, available_count: 10, status: 'AVAILABLE' },
          { slot_id: 'SLOT-1800', date: new Date().toISOString().slice(0, 10), start_time: '06:00 PM', end_time: '07:00 PM', capacity: 10, booked_count: 0, available_count: 10, status: 'AVAILABLE' },
        ];
        const slotRes = await syncTimeSlotsToSheet(defaultSlots, bearerToken);
        slotsSynced = slotRes.syncedCount;
      } catch (e) {
        console.warn('Initial time slots backfill notice:', e);
      }

      // 4. Backfill any provided runtime users, patients, bookings, leads
      const { users = [], patients = [], bookings = [], leads = [] } = req.body || {};
      let usersSynced = 0;
      let patientsSynced = 0;
      let bookingsSynced = 0;
      let leadsSynced = 0;

      if (Array.isArray(users) && users.length > 0) {
        const uRes = await upsertRecordsToWorksheet('Users', users, bearerToken);
        usersSynced = uRes.syncedCount;
      }
      if (Array.isArray(patients) && patients.length > 0) {
        const pRes = await upsertRecordsToWorksheet('Patients', patients, bearerToken);
        patientsSynced = pRes.syncedCount;
      }
      if (Array.isArray(bookings) && bookings.length > 0) {
        for (const b of bookings) {
          await syncBookingToBookingsSheet(b, bearerToken).catch(() => {});
        }
        bookingsSynced = bookings.length;
      }
      if (Array.isArray(leads) && leads.length > 0) {
        const lRes = await upsertRecordsToWorksheet('Leads', leads, bearerToken);
        leadsSynced = lRes.syncedCount;
      }

      return res.json({
        success: true,
        message: 'Initial backfill completed successfully without duplicate rows.',
        synced: {
          tests: testsSynced,
          packages: packagesSynced,
          timeSlots: slotsSynced,
          users: usersSynced,
          patients: patientsSynced,
          bookings: bookingsSynced,
          leads: leadsSynced,
        },
      });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        error: err?.message || 'Initial sync failed.',
      });
    }
  });

  app.post('/api/sheets/sync-patient', async (req: Request, res: Response) => {
    try {
      const bearerToken = extractBearerToken(req);
      const patient = req.body?.patient || req.body || {};
      const result = await syncPatientToPatientsSheet(patient, bearerToken);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        error: err?.message || 'Patient sync to Google Sheets failed.',
      });
    }
  });

  app.post('/api/sheets/sync-lead', async (req: Request, res: Response) => {
    try {
      const bearerToken = extractBearerToken(req);
      const lead = req.body?.lead || req.body || {};
      const result = await syncLeadToLeadsSheet(lead, bearerToken);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        error: err?.message || 'Lead sync to Google Sheets failed.',
      });
    }
  });

  app.post('/api/sheets/connect-oauth', async (req: Request, res: Response) => {
    try {
      const token = extractBearerToken(req) || req.body?.accessToken;
      const spreadsheetId = req.body?.spreadsheetId;
      const email = req.body?.email;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Missing OAuth access token in Authorization header.',
        });
      }

      setRuntimeGoogleOAuthConnection({
        accessToken: token,
        spreadsheetId,
        email,
      });

      const initResult = await initializeGoogleSheets(token);
      const authStatus = getGoogleSheetsAuthStatus();

      return res.json({
        success: true,
        spreadsheetTitle: SPREADSHEET_TITLE,
        spreadsheetIdMasked: authStatus.spreadsheetIdMasked,
        ensuredTabs: initResult.ensuredTabs,
        connectionStatus: 'CONNECTED',
      });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        error: err?.message || 'Failed to initialize Google Sheets.',
      });
    }
  });

  app.post('/api/sheets/ensure-tabs', async (req: Request, res: Response) => {
    try {
      const token = extractBearerToken(req);
      const result = token ? await initializeGoogleSheets(token) : await ensureAllWorksheetsExist();
      res.json(result);
    } catch (err: any) {
      res.status(200).json({
        success: false,
        ensuredTabs: [],
        error: err?.message || 'Failed to ensure worksheet tabs',
      });
    }
  });

  app.post('/api/sheets/sync-user', async (req: Request, res: Response) => {
    try {
      const bearerToken = extractBearerToken(req);
      const user = req.body?.user || req.body || {};
      const result = await syncUserRegistrationToUsersSheet(
        {
          userId: user.user_id || user.userId || '',
          firebaseUid: user.firebase_uid || user.firebaseUid || user.uid || user.id || '',
          fullName: user.full_name || user.fullName || user.name || user.displayName || '',
          email: user.email || '',
          phone: user.mobile_number || user.mobileNumber || user.phone || '',
          role: user.role || 'USER',
          accountStatus:
            user.account_status ||
            user.accountStatus ||
            user.status ||
            (user.is_active === false ? 'DEACTIVATED' : 'ACTIVE'),
          registrationDate: user.registration_date || user.registrationDate || user.created_at || user.createdAt,
          lastLogin: user.last_login_at || user.last_login || user.lastLogin || user.updated_at || user.updatedAt,
          createdAt: user.created_at || user.createdAt,
          updatedAt: user.updated_at || user.updatedAt,
        },
        bearerToken
      );
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        error: err?.message || 'User registration sync to Google Sheets failed.',
      });
    }
  });

  app.post('/api/sheets/sync-booking', async (req: Request, res: Response) => {
    try {
      const bearerToken = extractBearerToken(req);
      const booking = req.body?.booking || req.body || {};
      const result = await syncBookingToBookingsSheet(booking, bearerToken);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        error: err?.message || 'Booking sync to Google Sheets failed.',
      });
    }
  });

  app.post('/api/sheets/sync', async (req: Request, res: Response) => {
    try {
      const bearerToken = extractBearerToken(req);
      const {
        syncId,
        entityType,
        entityId,
        operation = 'CREATE',
        records = [],
        previousAttemptCount = 0,
      } = req.body || {};

      if (!entityType || !WORKSHEET_TABS.includes(entityType as WorksheetTabName)) {
        return res.status(400).json({
          error: `Invalid worksheet tab "${entityType}".`,
        });
      }

      const safeRecords = Array.isArray(records) ? records : [records];
      const result = await executeEntitySyncToSheets({
        syncId,
        entityType: entityType as WorksheetTabName,
        entityId: String(
          entityId ||
            safeRecords[0]?.uid ||
            safeRecords[0]?.id ||
            safeRecords[0]?.booking_id ||
            `BATCH-${Date.now()}`
        ),
        operation,
        records: safeRecords,
        previousAttemptCount: Number(previousAttemptCount || 0),
        bearerToken,
      });

      return res.json({
        success: result.syncLog.status === 'SUCCESS',
        liveApiCalled: result.liveApiCalled,
        syncedCount: result.syncedCount,
        syncLog: result.syncLog,
        mappedPreview: safeRecords
          .slice(0, 5)
          .map((r) => mapEntityToSheetRow(entityType as WorksheetTabName, r)),
      });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        error: err?.message || 'Sync operation encountered an unexpected error',
      });
    }
  });

  app.post('/api/sheets/retry', async (req: Request, res: Response) => {
    try {
      extractBearerToken(req);
      const { items } = req.body || {};
      const result = await retryFailedGoogleSheetsSyncs(Array.isArray(items) ? items : undefined);
      return res.json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        error: err?.message || 'Retry batch failed',
      });
    }
  });

  app.post('/api/sheets/import-validate', async (req: Request, res: Response) => {
    try {
      const token = extractBearerToken(req);
      const { tab, rows } = req.body || {};
      if (!tab || !WORKSHEET_TABS.includes(tab as WorksheetTabName)) {
        return res.status(400).json({
          error: `Invalid worksheet tab "${tab}".`,
        });
      }

      let sourceRows: Record<string, any>[] = [];
      if (Array.isArray(rows) && rows.length > 0) {
        sourceRows = rows;
      } else {
        sourceRows = await fetchWorksheetObjects(tab as WorksheetTabName, token);
      }

      return res.json({
        valid: true,
        tab,
        rowCount: sourceRows.length,
        rows: sourceRows,
      });
    } catch (err: any) {
      return res.status(400).json({
        valid: false,
        error: err?.message || 'Failed to validate Google Sheet import rows.',
      });
    }
  });

  if (NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1d', index: false }));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Server Error]:', err);
    res.status(err.status || 500).json({
      error: NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Server error',
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[B.L. Diagnostic Center] Server running on http://0.0.0.0:${PORT} (${NODE_ENV} mode)`
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
