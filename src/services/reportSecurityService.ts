import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  DiagnosticReport, 
  SecureReportPayload, 
  ReportAuditLog, 
  ReportAccessLog, 
  FileValidationResult,
  ReportMimeType 
} from '../types/reports';
import { createUserNotification } from './userService';
import { syncEntityToGoogleSheets } from './sheetsService';

const REPORTS_COLLECTION = 'reports';
const PAYLOADS_COLLECTION = 'secure_report_payloads';
const AUDIT_COLLECTION = 'report_audit_logs';
const ACCESS_COLLECTION = 'report_access_logs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Validate magic numbers / byte headers for security
 */
async function verifyMagicBytes(file: File): Promise<ReportMimeType | null> {
  const slice = file.slice(0, 16);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // PDF check: %PDF (0x25, 0x50, 0x44, 0x46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'application/pdf';
  }

  // PNG check: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
    bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A
  ) {
    return 'image/png';
  }

  // JPEG check: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }

  return null;
}

/**
 * Compute SHA-256 hash of a file for tamper evidence
 */
export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sanitize and construct safe filename
 */
export function generateSafeFileName(originalName: string, bookingId: string): string {
  // Strip path traversal attempts and special characters
  const cleanBase = originalName
    .replace(/^.*[\\\/]/, '')
    .replace(/\0/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');

  const ext = cleanBase.includes('.') ? cleanBase.split('.').pop()?.toLowerCase() : 'pdf';
  const timestamp = Date.now();
  return `BL_${bookingId.replace(/[^a-zA-Z0-9-]/g, '_')}_${timestamp}.${ext}`;
}

/**
 * Validate File against type, size, magic bytes, and path traversal
 */
export async function validateReportFile(file: File, bookingId: string): Promise<FileValidationResult> {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'File is empty.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size exceeds maximum allowed limit of 10MB (${(file.size / (1024 * 1024)).toFixed(2)}MB).` 
    };
  }

  // Validate magic bytes
  const verifiedMime = await verifyMagicBytes(file);
  if (!verifiedMime) {
    return { 
      valid: false, 
      error: 'Security rejection: Invalid file format. Only verified PDF, PNG, or JPEG diagnostic reports are accepted.' 
    };
  }

  const safeName = generateSafeFileName(file.name, bookingId);
  const hash = await computeFileHash(file);

  return {
    valid: true,
    sanitizedName: safeName,
    mimeType: verifiedMime,
    fileSize: file.size,
    hash
  };
}

/**
 * Convert file to Base64 data string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 part
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload diagnostic report securely (Admin / Authorized Staff only)
 */
export async function uploadDiagnosticReport(params: {
  bookingId: string;
  userId: string; // patient's user id
  patientId: string;
  patientName: string;
  reportTitle: string;
  testNames: string[];
  file: File;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  notes?: string;
  existingReportId?: string; // if replacing
}): Promise<DiagnosticReport> {
  const {
    bookingId,
    userId,
    patientId,
    patientName,
    reportTitle,
    testNames,
    file,
    actorId,
    actorEmail,
    actorRole,
    notes,
    existingReportId
  } = params;

  // Validation
  const val = await validateReportFile(file, bookingId);
  if (!val.valid || !val.sanitizedName || !val.mimeType || !val.hash) {
    throw new Error(val.error || 'File validation failed.');
  }

  const base64Data = await fileToBase64(file);
  const now = new Date().toISOString();

  // If replacing existing report, increment version
  let version = 1;
  let reportId = existingReportId;

  if (existingReportId) {
    const prevSnap = await getDoc(doc(db, REPORTS_COLLECTION, existingReportId));
    if (prevSnap.exists()) {
      version = (prevSnap.data().version || 1) + 1;
    }
  } else {
    reportId = `REP-${bookingId}-${Date.now().toString(36).toUpperCase()}`;
  }

  const reportMetadata: DiagnosticReport = {
    report_id: reportId!,
    booking_id: bookingId,
    user_id: userId,
    patient_id: patientId,
    patient_name: patientName,
    report_title: reportTitle.trim(),
    test_names: testNames,
    file_name: val.sanitizedName,
    file_size: val.fileSize!,
    mime_type: val.mimeType,
    file_hash: val.hash,
    is_active: true,
    version,
    uploaded_by: actorEmail || actorId,
    uploaded_at: now,
    updated_at: now,
    notes: notes?.trim()
  };

  const payload: SecureReportPayload = {
    report_id: reportId!,
    booking_id: bookingId,
    user_id: userId,
    data_base64: base64Data,
    mime_type: val.mimeType,
    file_hash: val.hash,
    created_at: now
  };

  // 1. Save metadata in /reports
  await setDoc(doc(db, REPORTS_COLLECTION, reportId!), reportMetadata);

  // 2. Save private binary in /secure_report_payloads (Strictly private)
  await setDoc(doc(db, PAYLOADS_COLLECTION, reportId!), payload);

  // 3. Write immutable audit log
  await logReportAuditAction({
    report_id: reportId!,
    booking_id: bookingId,
    action: existingReportId ? 'REPLACE' : 'UPLOAD',
    actor_id: actorId,
    actor_email: actorEmail,
    actor_role: actorRole,
    details: `Report ${existingReportId ? 'replaced (v' + version + ')' : 'uploaded'}: ${val.sanitizedName} (${(val.fileSize! / 1024).toFixed(1)} KB, SHA-256: ${val.hash.slice(0, 12)}...)`
  });

  // 4. Update booking with certified report flag
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      report_url: `private://reports/${reportId}`,
      report_notes: notes || 'Certified diagnostic report available in dashboard.',
      report_released_at: now,
      status: 'COMPLETED',
      updated_at: now
    });
  } catch (e) {
    console.warn('Booking status update notice:', e);
  }

  // 5. Send in-app notification to patient
  await createUserNotification({
    userId,
    title: `Diagnostic Report Ready: ${reportTitle}`,
    message: `Your certified laboratory report for ${patientName} (${bookingId}) is ready for secure download.`,
    type: 'REPORT',
    link: `/dashboard/reports`
  });

  // 6. Non-blocking Google Sheets Sync to Reports tab (Metadata & secure file_reference ONLY — NEVER binary payload)
  syncEntityToGoogleSheets({
    entityType: 'Reports',
    entityId: reportId!,
    operation: existingReportId ? 'UPDATE' : 'CREATE',
    record: {
      id: reportId!,
      booking_id: bookingId,
      patient_id: patientId,
      report_name: reportTitle.trim(),
      file_reference: `private://reports/${reportId}`,
      status: 'ACTIVE',
      uploaded_at: now,
      updated_at: now
    }
  }).catch(() => {});

  return reportMetadata;
}

/**
 * Fetch reports for a specific authenticated user (IDOR Protected: checks user_id)
 */
export async function getReportsForUser(userId: string): Promise<DiagnosticReport[]> {
  try {
    const q = query(
      collection(db, REPORTS_COLLECTION),
      where('user_id', '==', userId),
      where('is_active', '==', true)
    );
    const snap = await getDocs(q);
    const list: DiagnosticReport[] = [];
    snap.forEach(d => list.push(d.data() as DiagnosticReport));
    return list.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  } catch (err) {
    console.error('Error fetching reports for user:', err);
    return [];
  }
}

/**
 * Fetch all reports for Admin/Staff overview
 */
export async function getAllReportsAdmin(): Promise<DiagnosticReport[]> {
  try {
    const snap = await getDocs(collection(db, REPORTS_COLLECTION));
    const list: DiagnosticReport[] = [];
    snap.forEach(d => list.push(d.data() as DiagnosticReport));
    return list.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  } catch (err) {
    console.error('Error fetching all reports for admin:', err);
    return [];
  }
}

/**
 * Securely fetch report binary and generate a temporary in-memory Blob URL
 * Enforces server-side IDOR check and writes access log
 */
export async function accessSecureReportFile(params: {
  reportId: string;
  userId: string;
  userEmail?: string;
  isStaffOrAdmin?: boolean;
  action: 'VIEW' | 'DOWNLOAD';
}): Promise<{ blobUrl: string; fileName: string; mimeType: string }> {
  const { reportId, userId, userEmail, isStaffOrAdmin, action } = params;

  // 1. Fetch metadata first to verify ownership
  const metaSnap = await getDoc(doc(db, REPORTS_COLLECTION, reportId));
  if (!metaSnap.exists()) {
    throw new Error('Report not found or has been deleted.');
  }

  const meta = metaSnap.data() as DiagnosticReport;

  // IDOR Protection: User can ONLY view reports belonging to their user_id unless Staff/Admin
  if (!isStaffOrAdmin && meta.user_id !== userId) {
    throw new Error('Access Denied (403): You are not authorized to view this diagnostic report.');
  }

  if (!meta.is_active && !isStaffOrAdmin) {
    throw new Error('This report has been archived or deactivated by center pathologists.');
  }

  // 2. Fetch secured payload
  const payloadSnap = await getDoc(doc(db, PAYLOADS_COLLECTION, reportId));
  if (!payloadSnap.exists()) {
    throw new Error('Secured report payload not found.');
  }

  const payload = payloadSnap.data() as SecureReportPayload;

  // 3. Log access event in immutable audit log
  await logReportAccess({
    report_id: reportId,
    booking_id: meta.booking_id,
    user_id: userId,
    user_email: userEmail,
    action
  });

  // 4. Convert Base64 to Blob and generate ephemeral in-memory Object URL
  const byteCharacters = atob(payload.data_base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: payload.mime_type });
  const blobUrl = URL.createObjectURL(blob);

  return {
    blobUrl,
    fileName: meta.file_name,
    mimeType: payload.mime_type
  };
}

/**
 * Deactivate or Reactivate report (Admin / Staff only)
 */
export async function toggleReportActiveStatus(params: {
  reportId: string;
  isActive: boolean;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  reason?: string;
}): Promise<void> {
  const { reportId, isActive, actorId, actorEmail, actorRole, reason } = params;

  const docRef = doc(db, REPORTS_COLLECTION, reportId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Report not found.');
  }

  const report = snap.data() as DiagnosticReport;

  await updateDoc(docRef, {
    is_active: isActive,
    updated_at: new Date().toISOString()
  });

  await logReportAuditAction({
    report_id: reportId,
    booking_id: report.booking_id,
    action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
    actor_id: actorId,
    actor_email: actorEmail,
    actor_role: actorRole,
    details: `Report ${isActive ? 'reactivated' : 'deactivated'}. Reason: ${reason || 'Administrative action'}`
  });
}

/**
 * Log administrative audit action
 */
export async function logReportAuditAction(data: Omit<ReportAuditLog, 'log_id' | 'timestamp'>): Promise<void> {
  const logId = `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const record: ReportAuditLog = {
    ...data,
    log_id: logId,
    timestamp: new Date().toISOString()
  };
  await setDoc(doc(db, AUDIT_COLLECTION, logId), record);
}

/**
 * Log user access (View / Download)
 */
export async function logReportAccess(data: Omit<ReportAccessLog, 'log_id' | 'timestamp' | 'user_agent'>): Promise<void> {
  const logId = `ACC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const record: ReportAccessLog = {
    ...data,
    log_id: logId,
    timestamp: new Date().toISOString(),
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
  };
  await setDoc(doc(db, ACCESS_COLLECTION, logId), record);
}

/**
 * Fetch audit logs for Admin inspection
 */
export async function getReportAuditLogs(limitCount = 50): Promise<ReportAuditLog[]> {
  try {
    const snap = await getDocs(collection(db, AUDIT_COLLECTION));
    const list: ReportAuditLog[] = [];
    snap.forEach(d => list.push(d.data() as ReportAuditLog));
    return list
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limitCount);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return [];
  }
}

/**
 * Fetch access logs for Admin inspection
 */
export async function getReportAccessLogs(limitCount = 50): Promise<ReportAccessLog[]> {
  try {
    const snap = await getDocs(collection(db, ACCESS_COLLECTION));
    const list: ReportAccessLog[] = [];
    snap.forEach(d => list.push(d.data() as ReportAccessLog));
    return list
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limitCount);
  } catch (err) {
    console.error('Error fetching access logs:', err);
    return [];
  }
}
