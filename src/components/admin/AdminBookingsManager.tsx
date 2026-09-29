import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Home, 
  ChevronRight, 
  FileText, 
  Check, 
  X,
  FileSpreadsheet,
  FileUp,
  CreditCard
} from 'lucide-react';
import { fetchAdminBookings, updateAdminBooking } from '../../services/adminService';
import { exportBookingsToCSV } from '../../services/sheetsService';
import { useAuth } from '../../contexts/AuthContext';
import { AdminRoute } from '../../types/admin';

interface AdminBookingsManagerProps {
  filterMode?: 'all' | 'home-collection';
  onNavigateTab?: (tab: AdminRoute) => void;
}

export const AdminBookingsManager: React.FC<AdminBookingsManagerProps> = ({ 
  filterMode = 'all',
  onNavigateTab 
}) => {
  const { user: currentUser } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  // Status updating form states
  const [updatingStatus, setUpdatingStatus] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [assignedPhleb, setAssignedPhleb] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminBookings();
      setBookings(data);
      if (selectedBooking) {
        const updated = data.find(b => b.id === selectedBooking.id);
        if (updated) setSelectedBooking(updated);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filteredBookings = bookings.filter(b => {
    if (filterMode === 'home-collection') {
      const col = (b.collection_type || '').toUpperCase();
      if (!col.includes('HOME')) return false;
    }

    const q = search.toLowerCase();
    const matchesSearch = 
      b.id.toLowerCase().includes(q) ||
      b.patient_name.toLowerCase().includes(q) ||
      b.patient_phone.includes(q) ||
      (b.home_address && b.home_address.toLowerCase().includes(q));

    const matchesStatus = 
      statusFilter === 'ALL' || 
      b.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const handleUpdateBooking = async (newStatus?: string) => {
    if (!selectedBooking || !currentUser) return;
    setIsProcessing(true);
    try {
      await updateAdminBooking(
        selectedBooking.id,
        {
          status: newStatus || updatingStatus || selectedBooking.status,
          internal_notes: internalNotes || selectedBooking.internal_notes,
          assigned_phlebotomist: assignedPhleb || selectedBooking.assigned_phlebotomist
        },
        {
          uid: currentUser.uid,
          email: currentUser.email,
          role: currentUser.role
        }
      );

      await loadBookings();
      setInternalNotes('');
      setUpdatingStatus('');
      alert(`Booking ${selectedBooking.id} updated successfully.`);
    } catch (err: any) {
      alert(`Error updating booking: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const isHomeCollectionMode = filterMode === 'home-collection';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            {isHomeCollectionMode ? (
              <Home className="w-5 h-5 text-emerald-700" />
            ) : (
              <Calendar className="w-5 h-5 text-[#0F294A]" />
            )}
            <h2 className="text-xl font-bold text-slate-900">
              {isHomeCollectionMode ? 'Doorstep Home Sample Collection Queue' : 'Diagnostic Intake & Booking Console'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isHomeCollectionMode 
              ? 'Phlebotomist route scheduling, address verification, and status advancement for home sample visits.' 
              : 'Search, filter, update statuses, assign phlebotomists, and review immutable test snapshots.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadBookings}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => exportBookingsToCSV(bookings.map(b => b.raw || b))}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            title="Download formatted CSV for Google Sheets sync"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export for Google Sheets
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search booking ID (BL-2026-...), patient, phone, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-[#0F294A] bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="REQUESTED">Requested / Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COLLECTION_ASSIGNED">Collection Assigned</option>
            <option value="SAMPLE_COLLECTED">Sample Collected</option>
            <option value="PROCESSING IN LAB">In Lab Processing</option>
            <option value="REPORT READY">Report Ready</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Split Grid: Table (7 cols) + Processing Console (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Bookings Queue List */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>Showing {filteredBookings.length} bookings</span>
            <span>Click any item to inspect</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F294A]" />
              Loading bookings queue...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No matching bookings found for this criteria.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto pr-1">
              {filteredBookings.map((b) => {
                const isSelected = selectedBooking?.id === b.id;
                const isHome = (b.collection_type || '').toUpperCase().includes('HOME');

                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBooking(b);
                      setAssignedPhleb(b.assigned_phlebotomist || '');
                      setInternalNotes(b.internal_notes || '');
                    }}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-emerald-50/80 border border-emerald-500 shadow-xs'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-black text-[#0F294A]">
                        {b.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        b.status === 'COMPLETED' || b.status === 'Report Ready'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'REQUESTED' || b.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{b.patient_name}</span>
                        <span className="text-slate-400 ml-1">({b.patient_age}y • {b.patient_gender})</span>
                      </div>
                      <span className="font-extrabold text-[#0F294A] text-sm">₹{b.total_amount}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {b.booking_date} • {b.time_slot}
                      </span>
                      <span className={`font-semibold flex items-center gap-1 ${
                        isHome ? 'text-emerald-700' : 'text-slate-600'
                      }`}>
                        {isHome && <Home className="w-3 h-3" />}
                        {isHome ? 'Home Collection' : 'Center Visit'}
                      </span>
                    </div>

                    {isHome && b.home_address && (
                      <div className="text-[11px] text-slate-600 flex items-center gap-1 truncate pt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{b.home_address}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Booking Detail & Processing Actions */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          {selectedBooking ? (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Processing Console</h3>
                  <span className="font-mono font-bold text-emerald-700">{selectedBooking.id}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(selectedBooking.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Status Advancement Buttons */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                <label className="block font-bold text-slate-700">Change Workflow Status</label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    'CONFIRMED',
                    'COLLECTION_ASSIGNED',
                    'SAMPLE_COLLECTED',
                    'COMPLETED',
                    'CANCELLED'
                  ].map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleUpdateBooking(st)}
                      className={`px-2 py-1.5 rounded-lg font-semibold border text-left transition-all ${
                        selectedBooking.status.toUpperCase() === st
                          ? 'bg-[#0F294A] text-white border-[#0F294A] shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>

                {/* Phlebotomist assignment */}
                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Assigned Phlebotomist Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Suresh Kumar (Phleb ID: PH-04)"
                    value={assignedPhleb}
                    onChange={(e) => setAssignedPhleb(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>

                {/* Internal Notes */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Internal Staff Notes / Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Patient requested morning 7:30 AM arrival. Gate code #12."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleUpdateBooking()}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-xs"
                >
                  {isProcessing ? 'Updating...' : 'Save Notes & Dispatch Phlebotomist'}
                </button>
              </div>

              {/* Patient and Address Info */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-800 block mb-1">Patient Details</span>
                <div>Name: <span className="font-semibold text-slate-900">{selectedBooking.patient_name}</span></div>
                <div>Phone: <span className="font-semibold text-slate-900">+91 {selectedBooking.patient_phone}</span></div>
                <div>Age / Gender: {selectedBooking.patient_age} yrs / {selectedBooking.patient_gender}</div>

                {selectedBooking.home_address && (
                  <div className="pt-2 border-t border-slate-200 mt-2 text-slate-700">
                    <span className="font-bold block text-slate-800">Home Collection Address</span>
                    <p className="mt-0.5 leading-relaxed">{selectedBooking.home_address}</p>
                    {selectedBooking.pincode && <div>Pincode: {selectedBooking.pincode}</div>}
                  </div>
                )}
              </div>

              {/* Test Items Snapshots */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Diagnostic Tests Ordered</span>
                  <span className="font-extrabold text-[#0F294A]">Total: ₹{selectedBooking.total_amount}</span>
                </div>

                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {(selectedBooking.items || []).map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                      <div>
                        <span className="font-semibold text-slate-800 block">{it.test_name_snapshot || it.name}</span>
                        <span className="text-[10px] text-slate-400">{it.test_id || it.code}</span>
                      </div>
                      <span className="font-bold text-slate-900">₹{it.price_snapshot ?? it.price ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action shortcut to reports */}
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('reports')}
                  className="w-full bg-[#0F294A] hover:bg-[#16365D] text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  Attach Lab Diagnostic Report to this Booking
                </button>
              )}
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-slate-400 space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-slate-300" />
              <p>Select any booking from the queue to inspect details, dispatch a phlebotomist, or update workflow status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
