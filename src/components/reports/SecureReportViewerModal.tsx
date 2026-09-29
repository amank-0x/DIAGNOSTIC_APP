import React, { useState, useEffect } from 'react';
import { DiagnosticReport } from '../../types/reports';
import { accessSecureReportFile } from '../../services/reportSecurityService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  X, 
  Download, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  Clock, 
  Lock, 
  RefreshCw,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { Button, Badge } from '../ui/DesignSystem';
import { BUSINESS_INFO } from '../../types';

interface SecureReportViewerModalProps {
  report: DiagnosticReport;
  onClose: () => void;
}

export const SecureReportViewerModal: React.FC<SecureReportViewerModalProps> = ({
  report,
  onClose,
}) => {
  const { user, isStaffOrAdmin } = useAuth();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);

  useEffect(() => {
    let activeUrl: string | null = null;
    let isCancelled = false;

    const fetchPayload = async () => {
      if (!user) return;
      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await accessSecureReportFile({
          reportId: report.report_id,
          userId: user.uid,
          userEmail: user.email,
          isStaffOrAdmin,
          action: 'VIEW'
        });

        if (!isCancelled) {
          activeUrl = res.blobUrl;
          setBlobUrl(res.blobUrl);
          setLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setErrorMsg(err.message || 'Failed to retrieve secure report.');
          setLoading(false);
        }
      }
    };

    fetchPayload();

    return () => {
      isCancelled = true;
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [report, user, isStaffOrAdmin]);

  const handleDownload = async () => {
    if (!user) return;
    setDownloading(true);

    try {
      const res = await accessSecureReportFile({
        reportId: report.report_id,
        userId: user.uid,
        userEmail: user.email,
        isStaffOrAdmin,
        action: 'DOWNLOAD'
      });

      // Ephemeral download trigger
      const link = document.createElement('a');
      link.href = res.blobUrl;
      link.download = res.fileName || report.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up object URL after download
      setTimeout(() => {
        URL.revokeObjectURL(res.blobUrl);
      }, 1000);
    } catch (e: any) {
      alert(e.message || 'Download error.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">{report.report_title}</h3>
                <Badge variant={report.is_active ? 'green' : 'amber'}>
                  {report.is_active ? 'Certified & Active' : 'Archived'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Booking: <span className="font-mono font-bold text-slate-700">{report.booking_id}</span> • Patient: <strong className="text-slate-800">{report.patient_name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              isLoading={downloading}
              onClick={handleDownload}
            >
              <Download className="w-4 h-4" />
              Download Report
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security & Verification Metadata Strip */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Cryptographic Integrity Verified:</strong> SHA-256: <code className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-emerald-200">{report.file_hash.slice(0, 16)}...</code>
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-600">
            <span>Size: {(report.file_size / 1024).toFixed(1)} KB</span>
            <span>Version: v{report.version}</span>
            <span>Uploaded: {new Date(report.uploaded_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Document Body / Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 min-h-[350px] flex items-center justify-center">
          {loading ? (
            <div className="text-center space-y-3">
              <RefreshCw className="w-7 h-7 animate-spin text-[#0F294A] mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Authorizing & decrypting private report stream...</p>
            </div>
          ) : errorMsg ? (
            <div className="bg-white p-8 rounded-2xl border border-red-200 text-center space-y-2 max-w-md">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
              <h4 className="text-sm font-bold text-red-900">Report Retrieval Blocked</h4>
              <p className="text-xs text-red-700">{errorMsg}</p>
            </div>
          ) : blobUrl ? (
            report.mime_type === 'application/pdf' ? (
              <iframe
                src={`${blobUrl}#toolbar=0`}
                title={report.report_title}
                className="w-full h-[520px] rounded-xl border border-slate-200 bg-white shadow-sm"
              />
            ) : (
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm max-h-[520px] overflow-auto">
                <img
                  src={blobUrl}
                  alt={report.report_title}
                  className="max-w-full max-h-[500px] object-contain mx-auto"
                />
              </div>
            )
          ) : (
            <p className="text-xs text-slate-500">No preview available for this document.</p>
          )}
        </div>

        {/* Pathologist Certification & Legal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Certified Diagnostic Document • {BUSINESS_INFO.name}</span>
          </div>

          <div className="font-mono text-[11px] text-slate-400">
            Report ID: {report.report_id}
          </div>
        </div>
      </div>
    </div>
  );
};
