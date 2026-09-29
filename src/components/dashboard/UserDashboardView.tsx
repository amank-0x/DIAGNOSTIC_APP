import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PublicPage } from '../layout/Header';
import { BookingRecord, PatientRecord } from '../../types/bookingSystem';
import { getBookingsForUser, getBookingById } from '../../services/orderService';
import { getPatientsForUser } from '../../services/patientService';
import { PatientManager } from './PatientManager';
import { UserReportsView } from '../reports/UserReportsView';
import { getNotificationsForUser, markNotificationAsRead } from '../../services/userService';
import { UserNotification } from '../../types/auth';
import {
  Calendar,
  FileText,
  Users,
  Bell,
  User as UserIcon,
  Download,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Plus,
  LogOut,
  Home,
} from 'lucide-react';
import { Button, Badge, SkeletonList, EmptyState } from '../ui/DesignSystem';

interface UserDashboardViewProps {
  onNavigate: (page: PublicPage, param?: string) => void;
  initialTab?: 'dashboard' | 'profile' | 'patients' | 'bookings' | 'reports' | 'notifications';
  initialBookingId?: string;
}

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  onNavigate,
  initialTab = 'dashboard',
  initialBookingId,
}) => {
  const { user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [selectedBookingDetailId, setSelectedBookingDetailId] = useState<string | null>(
    initialBookingId || null
  );

  // Data States
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [singleBooking, setSingleBooking] = useState<BookingRecord | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    const [bList, nList, pList] = await Promise.all([
      getBookingsForUser(user.uid),
      getNotificationsForUser(user.uid),
      getPatientsForUser(user.uid),
    ]);
    setBookings(bList);
    setNotifications(nList);
    setPatients(pList);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  useEffect(() => {
    if (selectedBookingDetailId && user) {
      getBookingById(selectedBookingDetailId, user.uid).then(setSingleBooking);
    } else {
      setSingleBooking(null);
    }
  }, [selectedBookingDetailId, user]);

  const handleNotificationClick = async (notif: UserNotification) => {
    await markNotificationAsRead(notif.id);
    setNotifications(notifications.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
    if (notif.link?.includes('bookings')) {
      const parts = notif.link.split('/');
      const id = parts[parts.length - 1];
      setSelectedBookingDetailId(id);
      setCurrentTab('bookings');
    }
  };

  // Status badge helper mapping workflow status to clean human labels: Pending, Confirmed, Completed, Cancelled
  const renderBookingStatusBadge = (status: string) => {
    const normalized = status.toUpperCase();
    if (normalized === 'COMPLETED' || normalized === 'REPORT_READY') {
      return <Badge variant="green">Completed</Badge>;
    }
    if (normalized === 'CANCELLED') {
      return <Badge variant="red">Cancelled</Badge>;
    }
    if (
      normalized === 'CONFIRMED' ||
      normalized === 'COLLECTION_ASSIGNED' ||
      normalized === 'SAMPLE_COLLECTED' ||
      normalized === 'PROCESSING'
    ) {
      return <Badge variant="navy">Confirmed</Badge>;
    }
    return <Badge variant="amber">Pending</Badge>;
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 bg-white p-8 rounded-xl border border-slate-200 shadow-2xs">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" aria-hidden="true" />
        <h1 className="text-xl font-bold text-[#0F294A]">Sign in to Patient Dashboard</h1>
        <Button variant="primary" size="md" onClick={() => onNavigate('login')}>
          Sign In
        </Button>
      </div>
    );
  }

  // BOOKING DETAIL VIEW (/dashboard/bookings/[id])
  if (selectedBookingDetailId && singleBooking) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        <button
          type="button"
          onClick={() => setSelectedBookingDetailId(null)}
          className="text-xs font-semibold text-slate-600 hover:text-[#0F294A] flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Bookings</span>
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          {/* Header */}
          <div className="border-b border-slate-100 pb-4 flex flex-wrap justify-between items-start gap-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Booking Reference
              </span>
              <h1 className="text-2xl font-mono font-bold text-[#0F294A] tabular-nums">
                {singleBooking.booking_id}
              </h1>
              <span className="text-xs text-slate-500 tabular-nums">
                Created: {new Date(singleBooking.created_at).toLocaleString()}
              </span>
            </div>

            {renderBookingStatusBadge(singleBooking.status)}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold block">Patient Information</span>
              <h2 className="font-bold text-slate-900 text-sm">
                {singleBooking.patient_name_snapshot}
              </h2>
              <p className="text-slate-600">
                {singleBooking.patient_age_snapshot} Yrs · {singleBooking.patient_gender_snapshot}
              </p>
              {singleBooking.patient_phone_snapshot && (
                <p className="text-slate-500 tabular-nums">
                  +91 {singleBooking.patient_phone_snapshot}
                </p>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold block">Schedule &amp; Collection</span>
              <p className="font-bold text-slate-900 tabular-nums">
                {singleBooking.booking_date} · {singleBooking.time_slot}
              </p>
              <p className="text-emerald-800 font-semibold">
                {singleBooking.collection_type === 'HOME_COLLECTION'
                  ? 'Home Collection'
                  : 'Center Visit'}
              </p>
              {singleBooking.home_address && (
                <p className="text-slate-600 mt-1">
                  {singleBooking.home_address}, {singleBooking.area} - {singleBooking.pincode}
                </p>
              )}
            </div>
          </div>

          {/* Items Table Snapshot */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#0F294A] uppercase tracking-wider">
              Selected Diagnostic Tests ({singleBooking.items.length})
            </h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {singleBooking.items.map((it) => (
                <div
                  key={it.booking_item_id}
                  className="p-3.5 flex justify-between items-center bg-white"
                >
                  <div>
                    <span className="font-bold text-slate-900">{it.test_name_snapshot}</span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {it.test_id}
                    </span>
                  </div>
                  <span className="font-bold text-[#0F294A] tabular-nums">
                    ₹{it.price_snapshot}
                  </span>
                </div>
              ))}
              <div className="p-3.5 bg-slate-50 flex justify-between items-center font-bold text-sm">
                <span>Total Amount:</span>
                <span className="text-lg font-extrabold text-[#0F294A] tabular-nums">
                  ₹{singleBooking.total_amount}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Payment mode: Pay directly at sample collection or center visit.
            </p>
          </div>

          {/* Certified Report Section if ready */}
          {singleBooking.report_url && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-emerald-950">
                  Diagnostic Report Available
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Released:{' '}
                  {singleBooking.report_released_at
                    ? new Date(singleBooking.report_released_at).toLocaleString()
                    : 'Ready'}
                </p>
              </div>
              <a
                href={singleBooking.report_url}
                target="_blank"
                rel="noreferrer"
                className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Download Report</span>
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(
    (b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED'
  );
  const readyReports = bookings.filter((b) => Boolean(b.report_url));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* 1. WELCOME BANNER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#0F294A] text-white flex items-center justify-center font-extrabold text-lg shrink-0">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#0F294A]">
                Welcome, {user.displayName}
              </h1>
              <Badge variant="navy">{user.role}</Badge>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {user.email} {user.phone && `· +91 ${user.phone}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="primary" size="sm" onClick={() => onNavigate('book')}>
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            <span>BOOK A TEST</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('home-collection')}
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
            <span>HOME COLLECTION</span>
          </Button>

          <button
            type="button"
            onClick={logout}
            className="p-2 text-slate-500 hover:text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. QUICK ACTIONS BAR (BOOK A TEST, ADD PATIENT, MY BOOKINGS, MY REPORTS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('book')}
          className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-4 text-left flex items-center justify-between transition-colors shadow-2xs cursor-pointer group"
        >
          <div>
            <span className="text-xs font-bold text-[#0F294A] block">BOOK A TEST</span>
            <span className="text-[11px] text-slate-500">Schedule sample collection</span>
          </div>
          <Calendar className="w-5 h-5 text-emerald-600 shrink-0 group-hover:scale-105 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('patients')}
          className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-4 text-left flex items-center justify-between transition-colors shadow-2xs cursor-pointer group"
        >
          <div>
            <span className="text-xs font-bold text-[#0F294A] block">ADD PATIENT</span>
            <span className="text-[11px] text-slate-500">
              {patients.length} saved profile(s)
            </span>
          </div>
          <Plus className="w-5 h-5 text-emerald-600 shrink-0 group-hover:scale-105 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('bookings')}
          className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-4 text-left flex items-center justify-between transition-colors shadow-2xs cursor-pointer group"
        >
          <div>
            <span className="text-xs font-bold text-[#0F294A] block">MY BOOKINGS</span>
            <span className="text-[11px] text-slate-500 tabular-nums">
              {bookings.length} total booking(s)
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('reports')}
          className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-4 text-left flex items-center justify-between transition-colors shadow-2xs cursor-pointer group"
        >
          <div>
            <span className="text-xs font-bold text-[#0F294A] block">MY REPORTS</span>
            <span className="text-[11px] text-slate-500 tabular-nums">
              {readyReports.length} report(s) ready
            </span>
          </div>
          <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
        </button>
      </div>

      {/* Dashboard Navigation Tabs */}
      <div
        className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2 text-xs"
        role="tablist"
        aria-label="Patient dashboard sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'dashboard'}
          onClick={() => setCurrentTab('dashboard')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            currentTab === 'dashboard'
              ? 'bg-[#0F294A] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Overview
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'bookings'}
          onClick={() => setCurrentTab('bookings')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            currentTab === 'bookings'
              ? 'bg-[#0F294A] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
          <span>My Bookings ({bookings.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'reports'}
          onClick={() => setCurrentTab('reports')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            currentTab === 'reports'
              ? 'bg-[#0F294A] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Reports ({readyReports.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'patients'}
          onClick={() => setCurrentTab('patients')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            currentTab === 'patients'
              ? 'bg-[#0F294A] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Patient Profiles ({patients.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'notifications'}
          onClick={() => setCurrentTab('notifications')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors relative cursor-pointer ${
            currentTab === 'notifications'
              ? 'bg-[#0F294A] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Notifications</span>
          {notifications.some((n) => !n.isRead) && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'profile'}
          onClick={() => setCurrentTab('profile')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            currentTab === 'profile'
              ? 'bg-[#0F294A] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Account Profile</span>
        </button>
      </div>

      {/* LOADING SKELETON */}
      {loading ? (
        <SkeletonList rows={4} />
      ) : (
        <>
          {/* TAB: OVERVIEW */}
          {currentTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 8 Cols: Upcoming Bookings & Recent Bookings */}
              <div className="lg:col-span-8 space-y-6">
                {/* Upcoming Bookings */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold text-[#0F294A]">
                      Upcoming Appointments ({upcomingBookings.length})
                    </h2>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('bookings')}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  {upcomingBookings.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No upcoming appointments scheduled.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {upcomingBookings.slice(0, 3).map((b) => (
                        <div
                          key={b.booking_id}
                          className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-[#0F294A] tabular-nums">
                              {b.booking_id}
                            </span>
                            <p className="text-slate-700 font-semibold mt-0.5">
                              {b.patient_name_snapshot} ·{' '}
                              {b.items.map((i) => i.test_name_snapshot).join(', ')}
                            </p>
                            <p className="text-slate-500 tabular-nums">
                              {b.booking_date} · {b.time_slot} (
                              {b.collection_type === 'HOME_COLLECTION'
                                ? 'Home Collection'
                                : 'Center Visit'}
                              )
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            {renderBookingStatusBadge(b.status)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBookingDetailId(b.booking_id)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Bookings */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold text-[#0F294A]">Recent Bookings</h2>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('bookings')}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      All Bookings
                    </button>
                  </div>

                  {bookings.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No diagnostic bookings placed yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {bookings.slice(0, 4).map((b) => (
                        <div
                          key={b.booking_id}
                          className="py-3 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-slate-900 tabular-nums">
                              {b.booking_id}
                            </span>
                            <p className="text-slate-600">
                              {b.patient_name_snapshot} · {b.booking_date}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {renderBookingStatusBadge(b.status)}
                            <button
                              type="button"
                              onClick={() => setSelectedBookingDetailId(b.booking_id)}
                              className="text-xs font-bold text-[#0F294A] hover:underline cursor-pointer"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right 4 Cols: Reports Ready & Patient Profiles */}
              <div className="lg:col-span-4 space-y-6">
                {/* Reports Ready */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold text-[#0F294A]">
                      Reports Ready ({readyReports.length})
                    </h2>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('reports')}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      All Reports
                    </button>
                  </div>

                  {readyReports.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3">
                      No diagnostic reports released yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {readyReports.slice(0, 3).map((r) => (
                        <div
                          key={r.booking_id}
                          className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {r.patient_name_snapshot}
                            </span>
                            <span className="text-[11px] font-mono text-slate-600">
                              {r.booking_id}
                            </span>
                          </div>
                          <a
                            href={r.report_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-800 font-bold hover:underline flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patient Profiles Summary */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold text-[#0F294A]">
                      Patient Profiles ({patients.length})
                    </h2>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('patients')}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>

                  {patients.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">
                      Add patient profiles for faster booking.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {patients.slice(0, 4).map((p) => (
                        <div
                          key={p.patient_id}
                          className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {p.full_name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {p.age} Yrs · {p.gender} · {p.relation}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: MY BOOKINGS (/dashboard/bookings) */}
          {currentTab === 'bookings' && (
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <EmptyState
                  title="No Bookings Found"
                  description="Schedule diagnostic pathology tests or health packages for yourself or family members."
                  actionText="BOOK A TEST"
                  onAction={() => onNavigate('book')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookings.map((b) => (
                    <div
                      key={b.booking_id}
                      className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                          <div>
                            <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                              Booking ID
                            </span>
                            <span className="font-mono font-bold text-sm text-[#0F294A] tabular-nums">
                              {b.booking_id}
                            </span>
                          </div>
                          {renderBookingStatusBadge(b.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[11px] text-slate-500 block">Patient Name</span>
                            <span className="font-bold text-slate-900">
                              {b.patient_name_snapshot}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-500 block">
                              Collection Type
                            </span>
                            <span className="font-semibold text-emerald-800">
                              {b.collection_type === 'HOME_COLLECTION'
                                ? 'Home Collection'
                                : 'Center Visit'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-500 block">Date</span>
                            <span className="font-semibold text-slate-800 tabular-nums">
                              {b.booking_date}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-500 block">Time</span>
                            <span className="font-semibold text-slate-800">
                              {b.time_slot}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs pt-1">
                          <span className="text-[11px] text-slate-500 block">Test(s)</span>
                          <p className="font-medium text-slate-800 line-clamp-1">
                            {b.items.map((it) => it.test_name_snapshot).join(', ')}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                        <span className="font-extrabold text-sm text-[#0F294A] tabular-nums">
                          ₹{b.total_amount}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBookingDetailId(b.booking_id)}
                        >
                          <span>View Details</span>
                          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: REPORTS (/dashboard/reports) */}
          {currentTab === 'reports' && (
            <UserReportsView
              onNavigateToBooking={(bId) => {
                setSelectedBookingDetailId(bId);
                setCurrentTab('bookings');
              }}
            />
          )}

          {/* TAB: PATIENT PROFILES (/dashboard/patients) */}
          {currentTab === 'patients' && <PatientManager />}

          {/* TAB: NOTIFICATIONS */}
          {currentTab === 'notifications' && (
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <EmptyState
                  title="No Notifications"
                  description="You have no unread appointment or report updates."
                />
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 rounded-xl border text-xs cursor-pointer transition-colors ${
                      n.isRead
                        ? 'bg-white border-slate-200'
                        : 'bg-emerald-50/70 border-emerald-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-900">{n.title}</h3>
                        <p className="text-slate-600 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block tabular-nums">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: PROFILE */}
          {currentTab === 'profile' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-lg space-y-4 text-xs shadow-2xs">
              <h2 className="text-sm font-bold text-[#0F294A]">
                Patient Account Information
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Account ID:</span>
                  <span className="font-mono text-slate-800">{user.userId || user.id || user.uid}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Full Name:</span>
                  <span className="font-bold text-slate-900">{user.name || user.displayName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Mobile Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 tabular-nums">
                      {user.mobile_number || user.phone || 'Not provided'}
                    </span>
                    <Badge variant="green">OTP Verified</Badge>
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Last Login:</span>
                  <span className="text-slate-700 tabular-nums">
                    {user.last_login_at || user.lastLogin
                      ? new Date(user.last_login_at || user.lastLogin!).toLocaleString()
                      : 'Active Session'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Role:</span>
                  <Badge variant="navy">{user.role}</Badge>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
