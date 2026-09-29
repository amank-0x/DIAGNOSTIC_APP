import React, { useState, useEffect } from 'react';
import { 
  DiagnosticReport, 
  ReportAuditLog, 
  ReportAccessLog,
  FileValidationResult 
} from '../../types/reports';
import { BookingRecord } from '../../types/bookingSystem';
import { 
  getAllReportsAdmin, 
  uploadDiagnosticReport, 
  toggleReportActiveStatus, 
  getReportAuditLogs, 
  getReportAccessLogs,
  validateReportFile
} from '../../services/reportSecurityService';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { SecureReportViewerModal } from '../reports/SecureReportViewerModal';
import { 
  Upload, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  Check, 
  X, 
  Search, 
  Clock, 
  RefreshCw, 
  Eye, 
  Lock, 
  Power, 
  RotateCcw,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { Button, Badge, LoadingState } from '../ui/DesignSystem';

export const AdminReportsManager: React.FC = () => {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState<'reports' | 'upload' | 'audit_logs' | 'access_logs'>('reports');

  // Reports list & logs
  const [reports, setReports] = useState<DiagnosticReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<ReportAuditLog[]>([]);
  const [accessLogs, setAccessLogs] = useState<ReportAccessLog[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected report for viewing
  const [viewingReport, setViewingReport] = useState<DiagnosticReport | null>(null);

  // Upload Form State
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [reportTitle, setReportTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidation, setFileValidation] = useState<FileValidationResult | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string>('');

  // Replace Report Modal
  const [replacingReport, setReplacingReport] = useState<DiagnosticReport | null>(null);

  // Booking search in upload form
  const [bookingSearch, setBookingSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [rList, aLogs, accLogs, bSnap] = await Promise.all([
        getAllReportsAdmin(),
        getReportAuditLogs(50),
        getReportAccessLogs(50),
        getDocs(collection(db, 'bookings'))
      ]);

      setReports(rList);
      setAuditLogs(aLogs);
      setAccessLogs(accLogs);

      const bList: BookingRecord[] = [];
      bSnap.forEach(d => bList.push(d.data() as BookingRecord));
      setBookings(bList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (e) {
      console.error('Error loading admin reports data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setFileValidation(null);
      return;
    }

    setSelectedFile(file);
    const val = await validateReportFile(file, selectedBookingId || 'PREVIEW');
    setFileValidation(val);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile || !selectedBookingId) {
      setUploadError('Please select a booking and a valid report file.');
      return;
    }

    const booking = bookings.find(b => b.booking_id === selectedBookingId);
    if (!booking) {
      setUploadError('Selected booking could not be verified.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const testNames = booking.items ? booking.items.map(it => it.test_name_snapshot) : ['Diagnostic Panel'];
      const defaultTitle = reportTitle.trim() || `${booking.patient_name_snapshot} - Certified Lab Report`;

      await uploadDiagnosticReport({
        bookingId: booking.booking_id,
        userId: booking.user_id,
        patientId: booking.patient_id,
        patientName: booking.patient_name_snapshot,
        reportTitle: defaultTitle,
        testNames,
        file: selectedFile,
        actorId: user.uid,
        actorEmail: user.email,
        actorRole: user.role,
        notes,
        existingReportId: replacingReport?.report_id
      });

      setUploadSuccess(`Report successfully certified and uploaded! Patient has been notified.`);
      setSelectedFile(null);
      setFileValidation(null);
      setReportTitle('');
      setNotes('');
      setReplacingReport(null);
      await loadData();
      setTimeout(() => {
        setSubTab('reports');
        setUploadSuccess('');
      }, 1200);
    } catch (err: any) {
      setUploadError(err.message || 'Report upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleActive = async (rep: DiagnosticReport) => {
    if (!user) return;
    const confirmAction = confirm(
      rep.is_active 
        ? `Are you sure you want to deactivate ${rep.report_id}? Patient will not be able to access this report.` 
        : `Reactivate report ${rep.report_id}?`
    );
    if (!confirmAction) return;

    try {
      await toggleReportActiveStatus({
        reportId: rep.report_id,
        isActive: !rep.is_active,
        actorId: user.uid,
        actorEmail: user.email,
        actorRole: user.role,
        reason: rep.is_active ? 'Pathologist revised specimen' : 'Administrative reactivation'
      });
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Error updating report status.');
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (!bookingSearch.trim()) return true;
    const q = bookingSearch.toLowerCase();
    return (
      b.booking_id.toLowerCase().includes(q) ||
      b.patient_name_snapshot.toLowerCase().includes(q) ||
      (b.patient_phone_snapshot && b.patient_phone_snapshot.includes(q))
    );
  }).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            Diagnostic Pathology Module
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Secure Diagnostic Report Management
          </h2>
          <p className="text-xs text-slate-500">
            Certified document dispatch, magic-byte malware validation, SHA-256 integrity, and immutable audit logs.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => setSubTab('reports')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              subTab === 'reports' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Reports ({reports.length})
          </button>
          <button
            onClick={() => { setReplacingReport(null); setSubTab('upload'); }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
              subTab === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            Upload Report
          </button>
          <button
            onClick={() => setSubTab('audit_logs')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              subTab === 'audit_logs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
          <button
            onClick={() => setSubTab('access_logs')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              subTab === 'access_logs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Access Logs ({accessLogs.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: ALL REPORTS LIST */}
      {subTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">
              Diagnostic Reports Database ({reports.length})
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => { setReplacingReport(null); setSubTab('upload'); }}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload New Report
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Report ID</th>
                  <th className="p-3.5">Booking ID</th>
                  <th className="p-3.5">Patient Name</th>
                  <th className="p-3.5">Title / File</th>
                  <th className="p-3.5">Size / SHA-256</th>
                  <th className="p-3.5">Version</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((rep) => (
                  <tr key={rep.report_id} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-mono font-bold text-slate-800">{rep.report_id}</td>
                    <td className="p-3.5 font-mono font-semibold text-[#0F294A]">{rep.booking_id}</td>
                    <td className="p-3.5 font-bold text-slate-900">{rep.patient_name}</td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800 block">{rep.report_title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{rep.file_name}</span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      <span>{(rep.file_size / 1024).toFixed(1)} KB</span>
                      <code className="text-[9px] block text-slate-400 font-mono truncate max-w-[120px]">
                        {rep.file_hash}
                      </code>
                    </td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">
                        v{rep.version}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <Badge variant={rep.is_active ? 'green' : 'amber'}>
                        {rep.is_active ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => setViewingReport(rep)}
                        className="text-emerald-700 font-bold hover:underline"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => {
                          setReplacingReport(rep);
                          setSelectedBookingId(rep.booking_id);
                          setReportTitle(rep.report_title);
                          setSubTab('upload');
                        }}
                        className="text-blue-700 font-semibold hover:underline"
                      >
                        Replace
                      </button>
                      <button
                        onClick={() => handleToggleActive(rep)}
                        className={`text-xs font-semibold hover:underline ${
                          rep.is_active ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {rep.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: UPLOAD / REPLACE REPORT */}
      {subTab === 'upload' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              {replacingReport ? `Replace Report: ${replacingReport.report_id} (Version ${replacingReport.version + 1})` : 'Certify & Upload Diagnostic Report'}
            </h3>
            <p className="text-xs text-slate-500">
              Files are validated against magic byte signatures, stored in private partitions, and encrypted against IDOR exposure.
            </p>
          </div>

          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* 1. Select Booking */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Booking to Attach Report *
              </label>

              {replacingReport ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono font-bold text-[#0F294A]">
                  Attached Booking: {replacingReport.booking_id} ({replacingReport.patient_name})
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search booking by ID (e.g. BL-2026-...) or patient name..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />

                  <select
                    required
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">-- Choose a Verified Booking Order --</option>
                    {filteredBookings.map(b => (
                      <option key={b.booking_id} value={b.booking_id}>
                        {b.booking_id} — {b.patient_name_snapshot} ({b.booking_date}, {b.items?.length || 1} tests)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 2. Report Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Report Title / Clinical Panel
              </label>
              <input
                type="text"
                placeholder="e.g. Complete Blood Count (CBC) Certified Report"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            {/* 3. Secure File Upload with Validation Feedback */}
            <div className="p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                Diagnostic File (PDF, PNG, or JPEG - Max 10MB) *
              </label>
              <input
                type="file"
                required
                accept=".pdf,image/png,image/jpeg"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0F294A] file:text-white hover:file:bg-[#16365D]"
              />

              {fileValidation && (
                <div className="pt-2 text-xs space-y-1">
                  {fileValidation.valid ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        File Verified Secure & Safe
                      </div>
                      <p className="text-[11px]">Sanitized Name: <code className="font-mono bg-white px-1 py-0.5 rounded">{fileValidation.sanitizedName}</code></p>
                      <p className="text-[11px]">SHA-256 Checksum: <code className="font-mono bg-white px-1 py-0.5 rounded">{fileValidation.hash?.slice(0, 24)}...</code></p>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{fileValidation.error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Pathologist Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pathologist Certification Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Findings correlate with clinical history. Verified by Senior Consultant Pathologist."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSubTab('reports')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isUploading}
                disabled={!selectedFile || Boolean(fileValidation && !fileValidation.valid)}
              >
                {replacingReport ? 'Upload Replacement (v' + (replacingReport.version + 1) + ')' : 'Certify & Dispatch Report'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 3: IMMUTABLE AUDIT LOG */}
      {subTab === 'audit_logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">
              Administrative Report Audit Trail ({auditLogs.length} Records)
            </span>
            <span className="text-[11px] text-slate-400">Strictly immutable write-only logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Report ID</th>
                  <th className="p-3.5">Booking</th>
                  <th className="p-3.5">Actor (Staff/Admin)</th>
                  <th className="p-3.5">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map(log => (
                  <tr key={log.log_id} className="hover:bg-slate-50">
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        log.action === 'UPLOAD' ? 'bg-emerald-100 text-emerald-800' :
                        log.action === 'REPLACE' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{log.report_id}</td>
                    <td className="p-3.5 text-[#0F294A] font-semibold">{log.booking_id}</td>
                    <td className="p-3.5 text-slate-700">{log.actor_email || log.actor_id} ({log.actor_role})</td>
                    <td className="p-3.5 text-slate-600 font-sans text-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: ACCESS LOGS */}
      {subTab === 'access_logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">
              Access & Retrieval Logs ({accessLogs.length} Records)
            </span>
            <span className="text-[11px] text-slate-400">Tracks all report inspections & downloads</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Report ID</th>
                  <th className="p-3.5">Booking ID</th>
                  <th className="p-3.5">User ID / Email</th>
                  <th className="p-3.5">Client User Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {accessLogs.map(acc => (
                  <tr key={acc.log_id} className="hover:bg-slate-50">
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">{new Date(acc.timestamp).toLocaleString()}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        acc.action === 'DOWNLOAD' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {acc.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{acc.report_id}</td>
                    <td className="p-3.5 text-[#0F294A] font-semibold">{acc.booking_id}</td>
                    <td className="p-3.5 text-slate-700">{acc.user_email || acc.user_id}</td>
                    <td className="p-3.5 text-slate-400 text-[10px] truncate max-w-xs">{acc.user_agent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Secure Viewer Modal */}
      {viewingReport && (
        <SecureReportViewerModal
          report={viewingReport}
          onClose={() => setViewingReport(null)}
        />
      )}
    </div>
  );
};
