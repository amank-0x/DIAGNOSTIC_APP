import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { Lead } from '../../types/admin';
import { fetchLeads, updateLead } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLeadsManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<Lead['status']>('NEW');
  const [internalNotes, setInternalNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await fetchLeads();
      setLeads(data);
      if (selectedLead) {
        const found = data.find(l => l.id === selectedLead.id);
        if (found) setSelectedLead(found);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = leads.filter(l => {
    const q = search.toLowerCase();
    const matchesSearch = 
      l.fullName.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      (l.email && l.email.toLowerCase().includes(q)) ||
      l.serviceType.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchesSource = sourceFilter === 'ALL' || l.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleUpdateLead = async () => {
    if (!selectedLead || !currentUser) return;
    setIsProcessing(true);
    try {
      await updateLead(
        selectedLead.id,
        {
          status: updatingStatus,
          internalNotes
        },
        {
          uid: currentUser.uid,
          email: currentUser.email,
          role: currentUser.role
        }
      );

      await loadLeads();
      alert(`Lead status updated to ${updatingStatus}.`);
    } catch (err: any) {
      alert(`Error updating lead: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-600" />
            Lead & Diagnostic Inquiry Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track and convert customer inquiries, preventive checkup requests, and home collection requests.
          </p>
        </div>

        <button
          onClick={loadLeads}
          disabled={loading}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Leads
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by name, phone, email, or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-600 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Sources</option>
            <option value="CONTACT_FORM">Contact Form</option>
            <option value="HOME_COLLECTION">Home Collection</option>
            <option value="CALLBACK_REQUEST">Callback Request</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="CONVERTED">Converted to Booking</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Leads Table / List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold px-1">
            <span>Showing {filteredLeads.length} leads</span>
            <span>Click to update follow-up notes</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
              Loading inquiry pipeline...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No matching leads found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto pr-1">
              {filteredLeads.map((l) => {
                const isSelected = selectedLead?.id === l.id;
                return (
                  <div
                    key={l.id}
                    onClick={() => {
                      setSelectedLead(l);
                      setUpdatingStatus(l.status);
                      setInternalNotes(l.internalNotes || '');
                    }}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-purple-50/80 border border-purple-400 shadow-xs'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-xs">{l.fullName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        l.status === 'CONVERTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : l.status === 'NEW'
                          ? 'bg-purple-100 text-purple-800'
                          : l.status === 'CONTACTED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {l.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="font-semibold text-purple-900 flex items-center gap-1.5 truncate">
                        <Tag className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="truncate">{l.serviceType}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase shrink-0 ${
                        l.source === 'HOME_COLLECTION'
                          ? 'bg-emerald-100 text-emerald-800'
                          : l.source === 'CALLBACK_REQUEST'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {l.source ? l.source.replace(/_/g, ' ') : 'INQUIRY'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        +91 {l.phone}
                      </span>
                      <span>{new Date(l.createdAt).toLocaleDateString()}</span>
                    </div>

                    {l.notes && (
                      <p className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-100 line-clamp-2">
                        &ldquo;{l.notes}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Lead Details & Status Follow-up (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          {selectedLead ? (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Lead Details & Follow-up</h3>
                <span className="text-xs text-purple-700 font-mono">{selectedLead.id}</span>
              </div>

              {/* Lead Contact Info */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Prospect Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedLead.fullName}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call: +91 {selectedLead.phone}
                  </a>
                  {selectedLead.email && (
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </a>
                  )}
                </div>

                <div className="pt-2 text-slate-700 flex justify-between items-center">
                  <div>
                    <span className="font-bold block text-slate-800">Interested In:</span>
                    <span>{selectedLead.serviceType}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase ${
                    selectedLead.source === 'HOME_COLLECTION'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedLead.source === 'CALLBACK_REQUEST'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    Source: {selectedLead.source ? selectedLead.source.replace(/_/g, ' ') : 'DIRECT'}
                  </span>
                </div>

                {selectedLead.address && (
                  <div className="pt-1 text-slate-700">
                    <span className="font-bold block text-slate-800">Collection Address:</span>
                    <p className="bg-white p-2 rounded-lg border border-slate-200 mt-0.5">{selectedLead.address}</p>
                  </div>
                )}

                {selectedLead.notes && (
                  <div className="pt-1 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-bold block text-slate-700 mb-0.5">Prospect Notes:</span>
                    <p className="leading-relaxed">{selectedLead.notes}</p>
                  </div>
                )}
              </div>

              {/* Status Update Form */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <label className="block font-bold text-slate-800">Pipeline Status</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'] as Lead['status'][]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setUpdatingStatus(st)}
                      className={`px-3 py-2 rounded-lg font-semibold border transition-all text-left ${
                        updatingStatus === st
                          ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Internal Follow-up Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Spoke with customer. Scheduled home visit for tomorrow morning."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleUpdateLead}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-xs"
                >
                  {isProcessing ? 'Updating...' : 'Save Follow-up Update'}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-slate-400 space-y-2">
              <UserCheck className="w-8 h-8 mx-auto text-slate-300" />
              <p>Select any lead from the list to view contact information, make a follow-up call, or advance pipeline status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
