import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Clock, 
  RefreshCw, 
  User, 
  FileText, 
  Lock, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { GeneralAuditLog } from '../../types/admin';
import { fetchAuditLogs } from '../../services/adminService';

export const AdminAuditLogsManager: React.FC = () => {
  const [logs, setLogs] = useState<GeneralAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    const q = search.toLowerCase();
    const matchesSearch = 
      l.action.toLowerCase().includes(q) ||
      l.actorEmail.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.entityId.toLowerCase().includes(q);

    const matchesEntity = entityFilter === 'ALL' || l.entityType === entityFilter;
    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Security & Administrative Audit Logs
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log trail for role escalations, price updates, report uploads, and booking status transitions.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* Security Notice */}
      <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Zero Plaintext Guarantee:</strong> All actions are audited with actor UID and timestamp. Passwords, session cookies, and private binary payloads are never recorded.
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, actor email, target ID, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Entity Types</option>
            <option value="USER">User Account</option>
            <option value="TEST">Diagnostic Test</option>
            <option value="BOOKING">Booking</option>
            <option value="REPORT">Report</option>
            <option value="LEAD">Lead</option>
            <option value="ENQUIRY">Enquiry</option>
            <option value="SETTINGS">Settings</option>
            <option value="SHEETS">Sheets Sync</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Action</th>
                <th className="px-4 py-3.5">Actor</th>
                <th className="px-4 py-3.5">Entity</th>
                <th className="px-4 py-3.5">Target ID</th>
                <th className="px-4 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Fetching audit trail records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No matching audit entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {l.action.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-800">{l.actorEmail}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{l.actorRole}</div>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-700">
                      {l.entityType}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-indigo-700 font-bold">
                      {l.entityId}
                    </td>

                    <td className="px-4 py-3.5 text-slate-700 max-w-md">
                      <p className="line-clamp-2 leading-relaxed">{l.details}</p>
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
