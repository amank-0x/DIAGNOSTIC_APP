import {
  doc,
  setDoc,
} from 'firebase/firestore';
import { db, getWorkspaceAccessToken } from '../lib/firebase';
import { GoogleSheetTabName, SyncLogRecord } from '../types/admin';

const SYNC_LOGS_COLLECTION = 'sync_logs';

export const OFFICIAL_WORKSHEET_TABS: GoogleSheetTabName[] = [
  'Users',
  'Patients',
  'Bookings',
  'Booking_Items',
  'Tests',
  'Packages',
  'Reports',
  'Home_Collection',
  'Contact_Enquiries',
  'Leads',
  'Notifications',
  'Analytics',
  'Audit_Logs',
  'Sync_Log',
  'Test_Categories',
  'Package_Items',
];

export const OFFICIAL_WORKSHEET_HEADERS: Record<GoogleSheetTabName, string[]> = {
  Users: [
    'User ID',
    'Firebase UID',
    'Full Name',
    'Email',
    'Phone',
    'Role',
    'Account Status',
    'Registration Date',
    'Last Login',
    'Created At',
    'Updated At',
  ],
  Patients: [
    'Patient ID',
    'User ID',
    'Patient Name',
    'Date of Birth',
    'Gender',
    'Phone',
    'Relationship',
    'Address',
    'Status',
    'Created At',
    'Updated At',
  ],
  Bookings: [
    'Booking ID',
    'User ID',
    'Patient ID',
    'Patient Name',
    'Phone',
    'Booking Date',
    'Booking Time',
    'Collection Type',
    'Address',
    'Status',
    'Created At',
    'Updated At',
  ],
  Booking_Items: [
    'Booking Item ID',
    'Booking ID',
    'Test ID',
    'Test Name',
    'Quantity',
    'Price',
    'Created At',
  ],
  Tests: [
    'Test ID',
    'Test Name',
    'Category',
    'Method',
    'Sample',
    'Sample Instructions',
    'Clinical Information',
    'Reporting Time',
    'General Price',
    'Corporate Price',
    'Status',
    'Created At',
    'Updated At',
  ],
  Packages: [
    'Package ID',
    'Package Name',
    'Description',
    'Included Tests',
    'Price',
    'Status',
    'Created At',
    'Updated At',
  ],
  Reports: [
    'Report ID',
    'Booking ID',
    'Patient ID',
    'User ID',
    'Report Name',
    'Report Date',
    'Status',
    'File Reference',
    'Created At',
    'Updated At',
  ],
  Home_Collection: [
    'Home Collection ID',
    'Booking ID',
    'User ID',
    'Patient ID',
    'Patient Name',
    'Phone',
    'Address',
    'Area',
    'Pincode',
    'Status',
    'Created At',
    'Updated At',
  ],
  Contact_Enquiries: [
    'Enquiry ID',
    'Name',
    'Phone',
    'Email',
    'Message',
    'Status',
    'Created At',
    'Updated At',
  ],
  Leads: [
    'Lead ID',
    'Name',
    'Phone',
    'Email',
    'Source',
    'Message',
    'Status',
    'Created At',
    'Updated At',
  ],
  Notifications: [
    'Notification ID',
    'User ID',
    'Type',
    'Title',
    'Message',
    'Read Status',
    'Created At',
  ],
  Analytics: [
    'Metric ID',
    'Metric Date',
    'Metric Group',
    'Metric Key',
    'Metric Value',
    'Notes',
    'Updated At',
  ],
  Audit_Logs: [
    'Log ID',
    'User ID',
    'Admin ID',
    'Action',
    'Entity Type',
    'Entity ID',
    'Description',
    'Created At',
  ],
  Sync_Log: [
    'Sync ID',
    'Entity Type',
    'Entity ID',
    'Operation',
    'Status',
    'Attempt Count',
    'Error Message',
    'Last Attempt At',
    'Created At',
    'Updated At',
  ],
  Test_Categories: [
    'Category ID',
    'Category Name',
    'Description',
    'Total Tests',
    'Active Tests',
    'Status',
    'Updated At',
  ],
  Package_Items: [
    'Package Item ID',
    'Package ID',
    'Test ID',
    'Test Name',
    'Category',
    'Created At',
  ],
};

export interface SheetsExportRow {
  bookingId: string;
  bookingDate: string;
  timeSlot: string;
  collectionType: string;
  patientName: string;
  ageGender: string;
  phone: string;
  tests: string;
  totalAmount: number;
  currentStatus: string;
  address: string;
  createdAt: string;
}

export function buildSheetsAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getWorkspaceAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchBackendSheetsStatus(): Promise<{
  configured: boolean;
  authMode: 'SERVICE_ACCOUNT' | 'OAUTH_TOKEN' | 'NONE';
  spreadsheetIdMasked: string | null;
  spreadsheetUrl?: string | null;
  spreadsheetTitle: string;
  reason?: string;
}> {
  try {
    const res = await fetch('/api/sheets/status', {
      headers: buildSheetsAuthHeaders(),
    });
    if (!res.ok) {
      return {
        configured: false,
        authMode: 'NONE',
        spreadsheetIdMasked: null,
        spreadsheetTitle: 'B.L. Diagnostic Center - Website Database',
        reason: `Status check HTTP ${res.status}`,
      };
    }
    return await res.json();
  } catch (err: any) {
    return {
      configured: false,
      authMode: 'NONE',
      spreadsheetIdMasked: null,
      spreadsheetTitle: 'B.L. Diagnostic Center - Website Database',
      reason: err?.message || 'Unable to reach backend Google Sheets service.',
    };
  }
}

/**
 * Connect the backend Google Sheets service using a verified Google Workspace OAuth access token.
 */
export async function connectGoogleSheetsWithOAuth(params: {
  accessToken: string;
  email?: string | null;
  spreadsheetId?: string;
}): Promise<{
  success: boolean;
  spreadsheetTitle?: string;
  spreadsheetIdMasked?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/sheets/connect-oauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.accessToken}`,
      },
      body: JSON.stringify({
        accessToken: params.accessToken,
        email: params.email,
        spreadsheetId: params.spreadsheetId,
      }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error connecting Google Sheets via OAuth.',
    };
  }
}

/**
 * Trigger Google OAuth popup with Google Sheets & Drive scopes and connect the backend spreadsheet.
 */
export async function connectGoogleSheetsWithOAuthPopup(): Promise<{
  success: boolean;
  message: string;
}> {
  const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
  const { auth, googleWorkspaceProvider, setWorkspaceAccessToken } = await import('../lib/firebase');

  const result = await signInWithPopup(auth, googleWorkspaceProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken || null;

  if (!accessToken) {
    return {
      success: false,
      message: 'Google OAuth completed, but no Google Sheets access token was returned.',
    };
  }

  setWorkspaceAccessToken(accessToken);
  const connected = await connectGoogleSheetsWithOAuth({
    accessToken,
    email: result.user.email,
  });

  if (!connected.success) {
    return {
      success: false,
      message: connected.error || 'Failed to initialize Google Sheets database.',
    };
  }

  return {
    success: true,
    message: `Connected to "${connected.spreadsheetTitle || 'B.L. Diagnostic Center - Website Database'}" (${connected.spreadsheetIdMasked || 'Active'}) and initialized all worksheets.`,
  };
}

/**
 * Non-blocking post-DB synchronization to Google Sheets via Backend API (`/api/sheets/sync`).
 * Supports both object signature `{ entityType, entityId, operation, record }` and
 * positional signature `(entityType, operation, entityId, records, meta)`.
 */
export async function syncEntityToGoogleSheets(
  arg1:
    | {
        entityType: GoogleSheetTabName;
        entityId: string;
        operation: SyncLogRecord['operation'];
        record: Record<string, any> | Record<string, any>[];
        syncId?: string;
        previousAttemptCount?: number;
        createdAt?: string;
      }
    | GoogleSheetTabName,
  arg2?: SyncLogRecord['operation'],
  arg3?: string,
  arg4?: Record<string, any> | Record<string, any>[],
  _arg5?: Record<string, any>
): Promise<SyncLogRecord> {
  const params =
    typeof arg1 === 'string'
      ? {
          entityType: arg1,
          operation: (arg2 || 'CREATE') as SyncLogRecord['operation'],
          entityId: String(arg3 || `BATCH-${Date.now()}`),
          record: arg4 || {},
        }
      : arg1;

  const now = new Date().toISOString();
  const syncId =
    params.syncId ||
    `SYNC-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const attemptCount = (params.previousAttemptCount || 0) + 1;
  const createdAt = params.createdAt || now;
  const recordsArray = Array.isArray(params.record) ? params.record : [params.record];

  let status: SyncLogRecord['status'] = 'PENDING';
  let errorMessage: string | null = null;

  try {
    const response = await fetch('/api/sheets/sync', {
      method: 'POST',
      headers: buildSheetsAuthHeaders(),
      body: JSON.stringify({
        syncId,
        entityType: params.entityType,
        entityId: params.entityId,
        operation: params.operation,
        records: recordsArray,
        previousAttemptCount: params.previousAttemptCount || 0,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.syncLog) {
        status = data.syncLog.status;
        errorMessage = data.syncLog.error_message || null;
      } else {
        status = data.success ? 'SUCCESS' : 'FAILED';
        errorMessage = data.error || null;
      }
    } else {
      status = 'FAILED';
      errorMessage = `Backend sync HTTP ${response.status}`;
    }
  } catch (err: any) {
    status = 'FAILED';
    errorMessage = err?.message || 'Network error communicating with backend Google Sheets service';
  }

  const syncRecord: SyncLogRecord = {
    sync_id: syncId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    operation: params.operation,
    status,
    attempt_count: attemptCount,
    last_attempt_at: now,
    error_message: errorMessage,
    created_at: createdAt,
    updated_at: now,
  };

  try {
    await setDoc(doc(db, SYNC_LOGS_COLLECTION, syncId), {
      ...syncRecord,
      id: syncId,
      timestamp: now,
      recordsProcessed: recordsArray.length,
      details: `${params.operation} on ${params.entityType} (${params.entityId})`,
      payload: recordsArray[0] || {},
    });
  } catch (e) {
    console.warn('Could not persist Sync_Log to Firestore:', e);
  }

  return syncRecord;
}

export function formatBookingForSheets(booking: any): SheetsExportRow {
  const items = booking.items || booking.tests || [];
  const testNames = items
    .map((t: any) => `${t.test_name_snapshot || t.name} (₹${t.price_snapshot ?? t.price ?? 0})`)
    .join('; ');

  const colType = booking.collection_type || booking.collectionType || 'CENTER';
  const isHome = String(colType).toUpperCase().includes('HOME');

  const addressStr = isHome
    ? booking.home_address ||
      (booking.address && typeof booking.address === 'object'
        ? `${booking.address.street || ''}, ${booking.address.landmark || ''}, ${booking.address.pincode || ''}, ${booking.address.city || 'Jaipur'}`
        : String(booking.address || 'Pratap Nagar, Jaipur'))
    : 'Center Visit (Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur)';

  return {
    bookingId: booking.booking_id || booking.id || '',
    bookingDate: booking.booking_date || booking.bookingDate || '',
    timeSlot: booking.time_slot || booking.timeSlot || '',
    collectionType: isHome ? 'HOME_COLLECTION' : 'CENTER',
    patientName:
      booking.patient_name_snapshot ||
      booking.patient_name ||
      (booking.patient && booking.patient.fullName) ||
      'Patient',
    ageGender: `${booking.patient_age_snapshot || (booking.patient && booking.patient.age) || ''} / ${
      booking.patient_gender_snapshot || (booking.patient && booking.patient.gender) || ''
    }`,
    phone:
      booking.patient_phone_snapshot ||
      booking.patient_phone ||
      (booking.patient && booking.patient.phone) ||
      '',
    tests: testNames,
    totalAmount: Number(booking.total_amount ?? booking.totalAmount ?? 0),
    currentStatus: String(booking.status || 'CONFIRMED').toUpperCase(),
    address: addressStr,
    createdAt: booking.created_at || booking.createdAt || new Date().toISOString(),
  };
}

export function exportBookingsToCSV(bookings: any[]): void {
  const headers = [
    'Booking ID',
    'Booking Date',
    'Booking Time',
    'Collection Type',
    'Patient Name',
    'Phone',
    'Tests',
    'Address',
    'Status',
    'Created At',
  ];

  const rows = bookings.map((b) => {
    const formatted = formatBookingForSheets(b);
    return [
      `"${formatted.bookingId}"`,
      `"${formatted.bookingDate}"`,
      `"${formatted.timeSlot}"`,
      `"${formatted.collectionType}"`,
      `"${formatted.patientName.replace(/"/g, '""')}"`,
      `"${formatted.phone}"`,
      `"${formatted.tests.replace(/"/g, '""')}"`,
      `"${formatted.address.replace(/"/g, '""')}"`,
      `"${formatted.currentStatus}"`,
      `"${formatted.createdAt}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `BL_Diagnostic_Bookings_Sheet_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportWorksheetTabToCSV(
  tab: GoogleSheetTabName,
  rows: (string | number)[][]
): void {
  const headers = OFFICIAL_WORKSHEET_HEADERS[tab];
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          if (typeof cell === 'number') return String(cell);
          const str = String(cell ?? '').replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    ),
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `BL_Diagnostic_${tab}_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseSheetTextToObjects(
  rawText: string,
  defaultHeaders?: string[]
): Record<string, any>[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes('\t') ? '\t' : ',';

  const splitLine = (line: string): string[] => {
    if (delimiter === '\t') {
      return line.split('\t').map((c) => c.trim());
    }
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const firstRow = splitLine(lines[0]);
  const looksLikeHeader = firstRow.some((h) =>
    [
      'id',
      'user id',
      'test_id',
      'test id',
      'test_name',
      'test name',
      'package_name',
      'package id',
      'booking_id',
      'booking id',
    ].includes(h.toLowerCase())
  );

  const headers = looksLikeHeader ? firstRow : defaultHeaders || firstRow;
  const startIndex = looksLikeHeader ? 1 : 0;

  const objects: Record<string, any>[] = [];
  for (let i = startIndex; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    if (cells.every((c) => !c)) continue;
    const obj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      obj[h] = cells[idx] !== undefined ? cells[idx] : '';
    });
    objects.push(obj);
  }
  return objects;
}
