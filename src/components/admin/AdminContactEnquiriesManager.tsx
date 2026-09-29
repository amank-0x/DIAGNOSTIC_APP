import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { ContactEnquiry } from '../../types/admin';
import { fetchContactEnquiries, updateContactEnquiry } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

export const AdminContactEnquiriesManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedEnquiry, setSelectedEnquiry] = useState<ContactEnquiry | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<ContactEnquiry['status']>('NEW');
  const [internalNotes, setInternalNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadEnquiries = async () => {
    setLoading(true);
    try {
      const data = await fetchContactEnquiries();
      setEnquiries(data);
      if (selectedEnquiry) {
        const found = data.find(e => e.id === selectedEnquiry.id);
        if (found) setSelectedEnquiry(found);
      }
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, []);

  const filteredEnquiries = enquiries.filter(e => {
    const q = search.toLowerCase();
    const matchesSearch = 
      e.name.toLowerCase().includes(q) ||
      e.phone.includes(q) ||
      (e.email && e.email.toLowerCase().includes(q)) ||
      e.message.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdate = async () => {
    if (!selectedEnquiry || !currentUser) return;
    setIsProcessing(true);
    try {
      await updateContactEnquiry(
        selectedEnquiry.id,
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

      await loadEnquiries();
      alert(`Enquiry status updated to ${updatingStatus}.`);
    } catch (err: any) {
      alert(`Error updating enquiry: ${err.message}`);
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
            <MessageSquare className="w-5 h-5 text-amber-600" />
            Patient Messages & Center Contact Enquiries
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Questions, general inquiries, and test requirements submitted via the website contact form.
          </p>
        </div>

        <button
          onClick={loadEnquiries}
          disabled={loading}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Messages
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search inquiries by name, phone, message content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-600 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Enquiries List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold px-1">
            <span>Showing {filteredEnquiries.length} enquiries</span>
            <span>Click to respond</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
              Loading enquiries...
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No matching enquiries found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto pr-1">
              {filteredEnquiries.map((e) => {
                const isSelected = selectedEnquiry?.id === e.id;
                return (
                  <div
                    key={e.id}
                    onClick={() => {
                      setSelectedEnquiry(e);
                      setUpdatingStatus(e.status);
                      setInternalNotes(e.internalNotes || '');
                    }}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-amber-50/80 border border-amber-400 shadow-xs'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-xs">{e.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        e.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : e.status === 'NEW'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {e.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                      &ldquo;{e.message}&rdquo;
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        +91 {e.phone}
                      </span>
                      <span>{new Date(e.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Enquiry & Resolution Console (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          {selectedEnquiry ? (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Enquiry Resolution</h3>
                <span className="text-xs text-amber-700 font-mono">{selectedEnquiry.id}</span>
              </div>

              {/* Patient Message */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Sender Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedEnquiry.name}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:${selectedEnquiry.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call: +91 {selectedEnquiry.phone}
                  </a>
                  {selectedEnquiry.email && (
                    <a
                      href={`mailto:${selectedEnquiry.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </a>
                  )}
                </div>

                <div className="pt-2 text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="font-bold block text-slate-800 mb-1">Message:</span>
                  <p className="leading-relaxed">{selectedEnquiry.message}</p>
                </div>
              </div>

              {/* Status Update Form */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <label className="block font-bold text-slate-800">Resolution Status</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(['NEW', 'IN_PROGRESS', 'RESOLVED'] as ContactEnquiry['status'][]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setUpdatingStatus(st)}
                      className={`py-2 rounded-lg font-semibold border transition-all text-center ${
                        updatingStatus === st
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Internal Resolution Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Called customer and answered pricing inquiry. Sent brochure on WhatsApp."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleUpdate}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-xs"
                >
                  {isProcessing ? 'Saving...' : 'Save Status & Notes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
              <p>Select any message to view full patient query, initiate call, or mark inquiry resolved.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
