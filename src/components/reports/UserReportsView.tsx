import React, { useState, useEffect } from 'react';
import { DiagnosticReport } from '../../types/reports';
import {
  getReportsForUser,
  accessSecureReportFile,
} from '../../services/reportSecurityService';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileText,
  Download,
  ExternalLink,
  Search,
  Eye,
  AlertCircle,
} from 'lucide-react';
import {
  Badge,
  Button,
  SkeletonList,
  EmptyState,
} from '../ui/DesignSystem';

interface UserReportsViewProps {
  onNavigateToBooking?: (bookingId: string) => void;
}

export const UserReportsView: React.FC<UserReportsViewProps> = ({
  onNavigateToBooking,
}) => {
  const { user, isStaffOrAdmin } = useAuth();
  const [reports, setReports] = useState<DiagnosticReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadReports = async () => {
    if (!user) return;
    setLoading(true);
    const list = await getReportsForUser(user.uid);
    setReports(list);
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, [user]);

  const handleSecureAccess = async (
    report: DiagnosticReport,
    action: 'VIEW' | 'DOWNLOAD'
  ) => {
    if (!user) return;
    setDownloadingId(report.report_id);
    setErrorMessage('');
    try {
      const { blobUrl, fileName } = await accessSecureReportFile({
        reportId: report.report_id,
        userId: user.uid,
        userEmail: user.email,
        isStaffOrAdmin,
        action,
      });

      const link = document.createElement('a');
      link.href = blobUrl;
      if (action === 'DOWNLOAD') {
        link.download = fileName;
      } else {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to access report right now.');
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = reports.filter((r) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      r.report_title.toLowerCase().includes(q) ||
      r.patient_name.toLowerCase().includes(q) ||
      r.booking_id.toLowerCase().includes(q) ||
      r.report_id.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <SkeletonList rows={3} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0F294A]">Diagnostic Reports</h2>
          <p className="text-xs text-slate-600">
            View and download released pathology reports for your bookings.
          </p>
        </div>

        {reports.length > 0 && (
          <div className="relative w-full sm:w-72">
            <label htmlFor="reports-search-input" className="sr-only">
              Filter reports
            </label>
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="reports-search-input"
              type="text"
              placeholder="Search Report ID, Booking ID, Patient..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A]"
            />
          </div>
        )}
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="No reports available yet."
          description={
            searchFilter
              ? `No diagnostic reports matched "${searchFilter}".`
              : 'Once your diagnostic test sample is processed at B.L. Diagnostic Center, your digital report will appear here for secure viewing and download.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((rep) => {
            const isBusy = downloadingId === rep.report_id;
            return (
              <div
                key={rep.report_id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" aria-hidden="true" />
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-[#0F294A] tabular-nums">
                        Report ID: {rep.report_id}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="font-mono text-slate-600 tabular-nums">
                        Booking ID: {rep.booking_id}
                      </span>
                      <Badge variant="green">Ready</Badge>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">
                      {rep.report_title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
                      <span>
                        Patient:{' '}
                        <strong className="text-slate-900">{rep.patient_name}</strong>
                      </span>
                      <span className="tabular-nums">
                        Report Date:{' '}
                        <strong className="text-slate-800">
                          {new Date(rep.uploaded_at).toLocaleDateString()}
                        </strong>
                      </span>
                    </div>

                    {rep.notes && (
                      <p className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                        Note: {rep.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                  {onNavigateToBooking && (
                    <button
                      type="button"
                      onClick={() => onNavigateToBooking(rep.booking_id)}
                      className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Booking</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => handleSecureAccess(rep, 'VIEW')}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>VIEW</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={isBusy}
                    onClick={() => handleSecureAccess(rep, 'DOWNLOAD')}
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>DOWNLOAD</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
