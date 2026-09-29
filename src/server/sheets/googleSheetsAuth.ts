import crypto from 'crypto';

/**
 * Backend-Only Google Sheets Authentication Service (`googleSheetsAuth`)
 *
 * SECURITY INVARIANT:
 * - Reads Service Account credentials exclusively from server-side `process.env`.
 * - Also supports verified server-side Google OAuth2 Bearer access token passed from
 *   authenticated administrator session (`Authorization: Bearer <token>`).
 * - NEVER exposes `GOOGLE_PRIVATE_KEY` or raw service account JSON to client responses.
 */

export interface GoogleSheetsAuthStatus {
  configured: boolean;
  spreadsheetIdConfigured: boolean;
  serviceAccountConfigured: boolean;
  oauthConnected: boolean;
  spreadsheetTitle: string;
  spreadsheetId: string | null;
  spreadsheetIdMasked: string | null;
  spreadsheetUrl: string | null;
  serviceAccountEmailMasked: string | null;
  connectedAccountEmailMasked: string | null;
  mode: 'LIVE_GOOGLE_SHEETS_API' | 'OAUTH_GOOGLE_SHEETS_API' | 'CREDENTIALS_REQUIRED';
}

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

let cachedServiceAccountToken: CachedToken | null = null;

// Server-side in-memory OAuth session (when connected via Google Workspace OAuth in UI)
let runtimeOAuthToken: string | null = null;
let runtimeOAuthExpiresAtMs = 0;
let runtimeSpreadsheetId: string | null = null;
let runtimeConnectedEmail: string | null = null;

export const SPREADSHEET_TITLE = 'B.L. Diagnostic Center - Website Database';

function maskString(value?: string | null): string | null {
  if (!value || value.includes('placeholder') || value.includes('YOUR_')) return null;
  if (value.length <= 8) return '****';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

/**
 * Extracts raw Google Spreadsheet ID whether user pasted the full URL or raw ID:
 * e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit -> 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  return trimmed;
}

export function setRuntimeGoogleOAuthConnection(params: {
  accessToken: string;
  spreadsheetId?: string | null;
  email?: string | null;
  expiresInSeconds?: number;
}): void {
  runtimeOAuthToken = params.accessToken;
  runtimeOAuthExpiresAtMs = Date.now() + (params.expiresInSeconds || 3500) * 1000;
  if (params.spreadsheetId) {
    runtimeSpreadsheetId = extractSpreadsheetId(params.spreadsheetId);
  }
  if (params.email) {
    runtimeConnectedEmail = params.email.trim();
  }
}

export function setRuntimeSpreadsheetId(spreadsheetId: string): void {
  if (spreadsheetId && spreadsheetId.trim()) {
    runtimeSpreadsheetId = extractSpreadsheetId(spreadsheetId);
  }
}

export function getSpreadsheetId(): string | null {
  const envId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  if (envId && !envId.includes('placeholder') && !envId.includes('YOUR_')) {
    return extractSpreadsheetId(envId);
  }
  if (runtimeSpreadsheetId && !runtimeSpreadsheetId.includes('placeholder')) {
    return runtimeSpreadsheetId;
  }
  return null;
}

export function getSpreadsheetUrl(): string | null {
  const id = getSpreadsheetId();
  if (!id) return null;
  return `https://docs.google.com/spreadsheets/d/${id}`;
}

export function getServiceAccountCredentials(): { clientEmail: string; privateKey: string } | null {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY?.trim();

  if (
    !clientEmail ||
    !rawPrivateKey ||
    clientEmail.includes('placeholder') ||
    rawPrivateKey.includes('PLACEHOLDER')
  ) {
    return null;
  }

  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    return null;
  }

  return { clientEmail, privateKey };
}

export function hasActiveRuntimeOAuthToken(): boolean {
  return Boolean(runtimeOAuthToken && Date.now() < runtimeOAuthExpiresAtMs);
}

export function getGoogleSheetsAuthStatus(): GoogleSheetsAuthStatus {
  const spreadsheetId = getSpreadsheetId();
  const creds = getServiceAccountCredentials();
  const oauthActive = hasActiveRuntimeOAuthToken();
  const serviceAccountReady = Boolean(spreadsheetId && creds);
  const oauthReady = Boolean(oauthActive && spreadsheetId);
  const configured = serviceAccountReady || oauthReady;

  let mode: GoogleSheetsAuthStatus['mode'] = 'CREDENTIALS_REQUIRED';
  if (serviceAccountReady) {
    mode = 'LIVE_GOOGLE_SHEETS_API';
  } else if (oauthReady) {
    mode = 'OAUTH_GOOGLE_SHEETS_API';
  }

  return {
    configured,
    spreadsheetIdConfigured: Boolean(spreadsheetId),
    serviceAccountConfigured: Boolean(creds),
    oauthConnected: oauthActive,
    spreadsheetTitle: SPREADSHEET_TITLE,
    spreadsheetId: spreadsheetId || null,
    spreadsheetIdMasked: maskString(spreadsheetId),
    spreadsheetUrl: getSpreadsheetUrl(),
    serviceAccountEmailMasked: creds ? maskString(creds.clientEmail) : null,
    connectedAccountEmailMasked: maskString(runtimeConnectedEmail),
    mode,
  };
}

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Generates or retrieves a valid Google OAuth2 Bearer access token for Google Sheets API v4.
 * Prioritizes Service Account credentials in `.env`, falling back to active OAuth token if connected.
 */
export async function getGoogleSheetsAccessToken(overrideBearerToken?: string): Promise<string> {
  if (overrideBearerToken && overrideBearerToken.trim()) {
    return overrideBearerToken.replace(/^Bearer\s+/i, '').trim();
  }

  const creds = getServiceAccountCredentials();
  if (creds) {
    if (cachedServiceAccountToken && Date.now() < cachedServiceAccountToken.expiresAtMs - 60_000) {
      return cachedServiceAccountToken.accessToken;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: creds.clientEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: nowSec + 3600,
      iat: nowSec,
    };

    const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
      JSON.stringify(payload)
    )}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    signer.end();
    const signature = signer.sign(creds.privateKey);
    const jwtAssertion = `${signingInput}.${base64UrlEncode(signature)}`;

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtAssertion,
      }).toString(),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown token exchange error');
      throw new Error(`Google OAuth2 token exchange failed (${response.status}): ${errText.slice(0, 200)}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    cachedServiceAccountToken = {
      accessToken: data.access_token,
      expiresAtMs: Date.now() + (data.expires_in || 3600) * 1000,
    };

    return cachedServiceAccountToken.accessToken;
  }

  if (hasActiveRuntimeOAuthToken() && runtimeOAuthToken) {
    return runtimeOAuthToken;
  }

  throw new Error(
    'Google Sheets API credentials are not configured. Set GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in server .env, or connect via Google OAuth in /admin/google-sheets.'
  );
}
