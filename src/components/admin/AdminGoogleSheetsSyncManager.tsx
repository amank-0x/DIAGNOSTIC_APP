import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Database,
  Link2,
  Layers,
} from 'lucide-react';
import { GoogleSheetsSyncState } from '../../types/admin';
import {
  fetchSheetsSyncState,
  retrySheetsSync,
  triggerFullDatabaseSyncToSheets,
  fetchAdminBookings,
} from '../../services/adminService';
import {
  exportBookingsToCSV,
  fetchBackendSheetsStatus,
  connectGoogleSheetsWithOAuthPopup,
  OFFICIAL_WORKSHEET_TABS,
} from '../../services/sheetsService';
import { useAuth } from '../../contexts/AuthContext';

export const AdminGoogleSheetsSyncManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [syncState, setSyncState] = useState<GoogleSheetsSyncState | null>(null);
  const [backendStatus, setBackendStatus] = useState<{
    configured: boolean;
    authMode: 'SERVICE_ACCOUNT' | 'OAUTH_TOKEN' | 'NONE';
    spreadsheetIdMasked: string | null;
    spreadsheetUrl?: string | null;
    spreadsheetTitle: string;
    reason?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadSyncData = async () => {
    setLoading(true);
    try {
      const [data, status] = await Promise.all([
        fetchSheetsSyncState(),
        fetchBackendSheetsStatus(),
      ]);
      setSyncState(data);
      setBackendStatus(status);
    } catch (err) {
      console.error('Failed to load sync state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSyncData();
  }, []);

  const handleConnectOAuth = async () => {
    setConnectingOAuth(true);
    setStatusBanner(null);
    try {
      const result = await connectGoogleSheetsWithOAuthPopup();
      if (result.success) {
        setStatusBanner({
          type: 'success',
          message: result.message,
        });
        await loadSyncData();
      } else {
        setStatusBanner({
          type: 'error',
          message: result.message,
        });
      }
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err.message || 'Failed to connect Google Sheets OAuth.',
      });
    } finally {
      setConnectingOAuth(false);
    }
  };

  const handleFullSyncNow = async () => {
    if (!currentUser) return;
    setSyncingAll(true);
    setStatusBanner(null);
    try {
      const result = await triggerFullDatabaseSyncToSheets({
        uid: currentUser.uid,
        email: currentUser.email,
        role: currentUser.role,
      });
      setStatusBanner({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });
      await loadSyncData();
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: `Full sync error: ${err.message}`,
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleRetrySync = async () => {
    if (!currentUser) return;
    setRetrying(true);
    setStatusBanner(null);
    try {
      const result = await retrySheetsSync({
        uid: currentUser.uid,
        email: currentUser.email,
        role: currentUser.role,
      });
      setStatusBanner({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });
      await loadSyncData();
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: `Retry sync error: ${err.message}`,
      });
    } finally {
      setRetrying(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const bookings = await fetchAdminBookings();
      exportBookingsToCSV(bookings.map((b) => b.raw || b));
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: `Export error: ${err.message}`,
      });
    } finally {
      setExporting(false);
    }
  };

  const isConnected = Boolean(backendStatus?.configured);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            Google Sheets Database Synchronization
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Spreadsheet:{' '}
            <span className="font-semibold text-slate-700">
              {backendStatus?.spreadsheetTitle || 'B.L. Diagnostic Center - Website Database'}
            </span>
            {backendStatus?.spreadsheetIdMasked && (
              <span className="ml-2 font-mono text-[11px] text-slate-500">
                (ID: {backendStatus.spreadsheetIdMasked})
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadSyncData}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleConnectOAuth}
            disabled={connectingOAuth}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" />
            {connectingOAuth
              ? 'Connecting Google Sheets...'
              : isConnected
              ? 'Reconnect Google Sheets'
              : 'Connect Google Sheets'}
          </button>

          <button
            type="button"
            onClick={handleFullSyncNow}
            disabled={syncingAll}
            className="bg-[#0F294A] hover:bg-[#16365D] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Layers className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
            {syncingAll ? 'Syncing All Tables...' : 'Sync Now'}
          </button>

          <button
            type="button"
            onClick={handleRetrySync}
            disabled={retrying}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Retrying...' : 'Retry Failed Syncs'}
          </button>

          {backendStatus?.spreadsheetUrl && (
            <a
              href={backendStatus.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Sheet
            </a>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {statusBanner && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {statusBanner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">{statusBanner.message}</div>
        </div>
      )}

      {/* Sync Health Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Connection Status
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {isConnected ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-xl font-black ${
                isConnected ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {isConnected
                ? `Connected (${backendStatus?.authMode === 'SERVICE_ACCOUNT' ? 'Service Account' : 'Google OAuth'})`
                : 'Not Connected'}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              {isConnected
                ? 'Auto-syncing Users, Bookings, Patients, Reports & Leads'
                : backendStatus?.reason ||
                  'Click "Connect Google Sheets" or configure Service Account in .env'}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Processed Records
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">
              {syncState?.totalSynced ?? 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Last Sync:{' '}
              {syncState?.lastSyncTimestamp
                ? new Date(syncState.lastSyncTimestamp).toLocaleString()
                : 'None yet'}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Failed Syncs
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                (syncState?.failedCount ?? 0) > 0
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl font-black ${
                (syncState?.failedCount ?? 0) > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {syncState?.failedCount ?? 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Logged in Sync_Log with retry support
            </p>
          </div>
        </div>
      </div>

      {/* Official Worksheets List */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Configured Database Worksheets ({OFFICIAL_WORKSHEET_TABS.length} Tabs)
        </h3>
        <div className="flex flex-wrap gap-2">
          {OFFICIAL_WORKSHEET_TABS.map((tab) => (
            <span
              key={tab}
              className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] font-semibold"
            >
              {tab}
            </span>
          ))}
        </div>
      </div>

      {/* Manual CSV Export Action */}
      <div className="bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-700" />
            Manual Google Sheets Intake Export
          </h3>
          <p className="text-xs text-emerald-800 mt-1 max-w-xl">
            Download a formatted CSV matching official laboratory column headers (Booking ID, Patient, Phone, Tests Ordered, Amount, Status, and Home Address).
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={exporting}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors whitespace-nowrap cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          {exporting ? 'Generating...' : 'Download Formatted CSV'}
        </button>
      </div>

      {/* Sync Log History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Sync_Log Audit History
          </h3>
          <span className="text-[11px] text-slate-400">Latest operations</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Entity / Tab</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Sync Event Details</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Retry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Checking sync logs...
                  </td>
                </tr>
              ) : !syncState || syncState.syncHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No sync log records found. Automatic sync runs on user registration, login, booking, patient creation, and report metadata updates.
                  </td>
                </tr>
              ) : (
                syncState.syncHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] font-semibold text-slate-700">
                      {item.entityType || 'Bookings'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      {item.operation || 'SYNC'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <div>{item.details}</div>
                      {item.errorMessage && (
                        <div className="text-[11px] text-rose-600 mt-0.5">
                          Error: {item.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          item.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.status === 'FAILED' && (
                        <button
                          type="button"
                          onClick={handleRetrySync}
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
