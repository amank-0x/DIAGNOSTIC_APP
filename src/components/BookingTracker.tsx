import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  MapPin, 
  Building2, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Phone, 
  Calendar,
  Download,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Booking, BookingStatus, BUSINESS_INFO } from '../types';
import { getBookingById } from '../services/bookingService';

interface BookingTrackerProps {
  initialBookingId?: string;
}

export const BookingTracker: React.FC<BookingTrackerProps> = ({ initialBookingId }) => {
  const [searchId, setSearchId] = useState(initialBookingId || '');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const statusSteps: BookingStatus[] = [
    'Requested',
    'Confirmed',
    'Sample Collected',
    'Processing in Lab',
    'Report Ready',
    'Completed'
  ];

  const handleSearch = async (idToSearch?: string) => {
    const target = idToSearch || searchId;
    if (!target.trim()) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const result = await getBookingById(target);
      if (result) {
        setBooking(result);
      } else {
        setBooking(null);
        setErrorMsg(`No booking found with ID: ${target.toUpperCase()}. Please check your reference.`);
      }
    } catch (err) {
      setErrorMsg('Error retrieving booking record. Please check network connection.');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  useEffect(() => {
    if (initialBookingId) {
      setSearchId(initialBookingId);
      handleSearch(initialBookingId);
    }
  }, [initialBookingId]);

  const getCurrentStepIndex = (status: BookingStatus) => {
    if (status === 'Cancelled') return -1;
    return statusSteps.indexOf(status);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Search Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Track Diagnostic Booking & Reports</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your unique Booking ID (e.g. BLD-2026-XXXX) provided at the time of appointment request.
          </p>
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. BLD-2026-1234"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.toUpperCase())}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-wider text-slate-900 uppercase focus:ring-2 focus:ring-[#0F294A] focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#0F294A] hover:bg-[#16365D] disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2"
          >
            {loading ? 'Searching...' : 'Track Status'}
          </button>
        </form>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}
      </div>

      {/* Booking Details & Status Timeline */}
      {booking && (
        <div className="space-y-6">
          {/* Main Status Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest block">
                  Reference ID
                </span>
                <span className="text-2xl font-black text-[#0F294A] font-mono">
                  {booking.id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  booking.status === 'Completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : booking.status === 'Cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-900'
                }`}>
                  Status: {booking.status}
                </span>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Print Slip"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stepper Visualizer */}
            {booking.status !== 'Cancelled' ? (
              <div className="py-2">
                <div className="hidden sm:grid grid-cols-6 gap-2">
                  {statusSteps.map((step, idx) => {
                    const currentIdx = getCurrentStepIndex(booking.status);
                    const isDone = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;

                    return (
                      <div key={step} className="flex flex-col items-center text-center space-y-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                          isDone 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'bg-white border-slate-300 text-slate-400'
                        } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}>
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className={`text-[11px] leading-tight font-medium ${
                          isCurrent ? 'text-emerald-800 font-bold' : isDone ? 'text-slate-800' : 'text-slate-400'
                        }`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile version simple status */}
                <div className="sm:hidden bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Lifecycle Stage:</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
                    {booking.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-xs text-red-800">
                This booking request has been cancelled.
              </div>
            )}

            {/* Diagnostic Report Available Card */}
            {booking.status === 'Report Ready' || booking.status === 'Completed' ? (
              <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">Diagnostic Lab Report Available</h4>
                      <p className="text-xs text-emerald-800">
                        Verified by Pathologist at {BUSINESS_INFO.name}.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      alert(`Viewing Lab Report for ${booking.id}\nPatient: ${booking.patient.fullName}\nStatus: Certified\nAvailable for collection at center or secure electronic download.`);
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    Download Lab Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Diagnostic report will be accessible here once the laboratory processing is finished.
              </div>
            )}
          </div>

          {/* Details Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient & Booking Specifics */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2">
                Appointment & Patient Info
              </h3>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-bold text-slate-900">{booking.patient.fullName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Age / Gender:</span>
                <span className="font-semibold text-slate-800">{booking.patient.age} Yrs / {booking.patient.gender}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Contact Number:</span>
                <span className="font-semibold text-slate-800">+91 {booking.patient.phone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Scheduled Date:</span>
                <span className="font-semibold text-emerald-800">{booking.bookingDate}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Time Slot:</span>
                <span className="font-semibold text-slate-800">{booking.timeSlot}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Mode:</span>
                <span className="font-bold text-emerald-700">{booking.collectionType}</span>
              </div>

              {booking.collectionType === 'Home Collection' && booking.address && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block mb-1">Address:</span>
                  <p className="text-slate-800 font-medium">
                    {booking.address.street}
                    {booking.address.landmark ? `, Landmark: ${booking.address.landmark}` : ''}, {booking.address.city} - {booking.address.pincode}
                  </p>
                </div>
              )}
            </div>

            {/* Tests & Payment Info */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2">
                Tests & Billing
              </h3>
              <div className="space-y-1.5 divide-y divide-slate-100 max-h-40 overflow-y-auto">
                {booking.tests.map(test => (
                  <div key={test.id} className="pt-1.5 first:pt-0 flex justify-between">
                    <div>
                      <span className="font-medium text-slate-800 block">{test.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{test.code}</span>
                    </div>
                    <span className="font-bold text-[#0F294A]">₹{test.price}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-800">Total Amount:</span>
                  <span className="font-black text-[#0F294A] text-base">₹{booking.totalAmount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className={`font-semibold ${
                    booking.paymentStatus === 'Pending' ? 'text-amber-700' : 'text-emerald-700'
                  }`}>
                    {booking.paymentStatus}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg text-[11px] text-slate-600">
                  Strict Request Model • Direct settlement at collection or center.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Initial state placeholder */}
      {!booking && !loading && !searched && (
        <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-300 text-center space-y-3">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">Ready to track your diagnostics</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Bookings generated through the website or at {BUSINESS_INFO.name} can be monitored here in real time.
          </p>
        </div>
      )}
    </div>
  );
};
