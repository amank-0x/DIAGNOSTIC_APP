export type ReportMimeType = 'application/pdf' | 'image/png' | 'image/jpeg';

export interface DiagnosticReport {
  report_id: string; // e.g., REP-BL-2026-000001
  booking_id: string; // reference to booking
  user_id: string; // foreign key to owner user (for server-side IDOR protection)
  patient_id: string;
  patient_name: string;
  report_title: string;
  test_names: string[];
  file_name: string; // safe sanitized name
  file_size: number; // in bytes
  mime_type: ReportMimeType;
  file_hash: string; // SHA-256 checksum for tamper evidence
  is_active: boolean;
  version: number;
  uploaded_by: string; // staff/admin identifier
  uploaded_at: string;
  updated_at: string;
  notes?: string;
}

export interface SecureReportPayload {
  report_id: string;
  booking_id: string;
  user_id: string;
  data_base64: string;
  mime_type: ReportMimeType;
  file_hash: string;
  created_at: string;
}

export interface ReportAuditLog {
  log_id: string;
  report_id: string;
  booking_id: string;
  action: 'UPLOAD' | 'REPLACE' | 'DEACTIVATE' | 'ACTIVATE';
  actor_id: string;
  actor_email: string;
  actor_role: string;
  details: string;
  timestamp: string;
}

export interface ReportAccessLog {
  log_id: string;
  report_id: string;
  booking_id: string;
  user_id: string;
  user_email?: string;
  action: 'VIEW' | 'DOWNLOAD';
  timestamp: string;
  user_agent: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
  mimeType?: ReportMimeType;
  fileSize?: number;
  hash?: string;
}
