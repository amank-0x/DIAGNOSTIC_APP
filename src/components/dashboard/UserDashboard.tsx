import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PublicPage } from '../layout/Header';
import { Booking, BUSINESS_INFO } from '../../types';
import { FamilyPatient, UserNotification } from '../../types/auth';
import { 
  getPatientsForUser, 
  addPatientForUser, 
  deletePatientForUser, 
  getNotificationsForUser, 
  markNotificationAsRead 
} from '../../services/userService';
import { subscribeToBookings } from '../../services/bookingService';
import { 
  User, 
  Users, 
  Calendar, 
  FileText, 
  Bell, 
  LogOut, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Download,
  ShieldCheck,
  Phone,
  Mail
} from 'lucide-react';
import { Button, Badge } from '../ui/DesignSystem';

interface UserDashboardProps {
  onNavigate: (page: PublicPage, param?: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'patients' | 'bookings' | 'reports' | 'notifications'>('bookings');

  // State
  const [patients, setPatients] = useState<FamilyPatient[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Patient Form State
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState(30);
  const [newPatientGender, setNewPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newPatientRelation, setNewPatientRelation] = useState<FamilyPatient['relation']>('Father');
  const [newPatientPhone, setNewPatientPhone] = useState('');

  useEffect(() => {
    if (!user) return;

    // Load family patients
    getPatientsForUser(user.uid).then(setPatients);

    // Load notifications
    getNotificationsForUser(user.uid).then(setNotifications);

    // Subscribe to bookings and filter by user's phone or patient full name
    const unsub = subscribeToBookings((allBookings) => {
      const userBookings = allBookings.filter(b => 
        (user.phone && b.patient.phone === user.phone) ||
        (user.displayName && b.patient.fullName.toLowerCase().includes(user.displayName.toLowerCase()))
      );
      setBookings(userBookings);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPatientName.trim()) return;

    const created = await addPatientForUser({
      userId: user.uid,
      fullName: newPatientName.trim(),
      age: Number(newPatientAge),
      gender: newPatientGender,
      relation: newPatientRelation,
      phone: newPatientPhone.trim() || undefined
    });

    setPatients([...patients, created]);
    setShowAddPatient(false);
    setNewPatientName('');
  };

  const handleDeletePatient = async (patientId: string) => {
    if (confirm('Are you sure you want to remove this family member?')) {
      await deletePatientForUser(patientId);
      setPatients(patients.filter(p => p.id !== patientId));
    }
  };

  const handleMarkNotification = async (notifId: string) => {
    await markNotificationAsRead(notifId);
    setNotifications(notifications.map(n => n.id === notifId ? { ...n, isRead: true } : n));
  };

  if (!user) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Sign In Required</h2>
        <p className="text-xs text-slate-500">Please sign in to access your personal dashboard and reports.</p>
        <Button variant="primary" size="md" onClick={() => onNavigate('login')}>
          Go to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Top Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#0F294A] text-white flex items-center justify-center font-bold text-lg">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user.displayName}</h1>
              <Badge variant="navy">{user.role}</Badge>
            </div>
            <p className="text-xs text-slate-500">{user.email} {user.phone && `• +91 ${user.phone}`}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('book')}
          >
            <Calendar className="w-3.5 h-3.5" />
            Book New Test
          </Button>

          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'bookings'
              ? 'bg-[#0F294A] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          My Bookings ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-[#0F294A] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Diagnostic Reports ({bookings.filter(b => b.status === 'Report Ready' || b.status === 'Completed').length})
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'patients'
              ? 'bg-[#0F294A] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Family Patients ({patients.length})
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap relative ${
            activeTab === 'notifications'
              ? 'bg-[#0F294A] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifications
          {notifications.some(n => !n.isRead) && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-[#0F294A] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          Profile Settings
        </button>
      </div>

      {/* TAB 1: MY BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Bookings Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Schedule a routine health checkup or diagnostic test with home collection or center visit.
              </p>
              <Button variant="primary" size="sm" onClick={() => onNavigate('book')}>
                Book Diagnostic Test
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map(b => (
                <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-[#0F294A]">{b.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      b.status === 'Completed' || b.status === 'Report Ready'
                        ? 'bg-emerald-100 text-emerald-800'
                        : b.status === 'Requested'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{b.patient.fullName}</h4>
                    <p className="text-xs text-slate-500">
                      {b.tests.length} tests • {b.bookingDate} ({b.timeSlot})
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="font-bold text-[#0F294A]">₹{b.totalAmount} (Pay at Collection)</span>
                    <button
                      onClick={() => onNavigate('dashboard', b.id)}
                      className="text-emerald-700 font-semibold text-xs hover:underline flex items-center gap-1"
                    >
                      Track Details <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIAGNOSTIC REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {bookings.filter(b => b.status === 'Report Ready' || b.status === 'Completed').length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Reports Available Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once our lab pathologists certify your test specimens, downloadable reports will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {bookings.filter(b => b.status === 'Report Ready' || b.status === 'Completed').map(b => (
                <div key={b.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{b.patient.fullName} — Diagnostic Report</h4>
                      <p className="text-xs text-slate-500">Booking {b.id} • Date: {b.bookingDate}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`Downloading verified lab report for ${b.id}\nPatient: ${b.patient.fullName}\nCertified by Pathologist at ${BUSINESS_INFO.name}`)}
                    className="bg-[#0F294A] hover:bg-[#16365D] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FAMILY PATIENTS */}
      {activeTab === 'patients' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Saved Patient Profiles</h3>
              <p className="text-xs text-slate-500">Manage family members to quickly autofill booking appointments.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddPatient(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Family Member
            </Button>
          </div>

          {showAddPatient && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Add New Patient</h4>
              <form onSubmit={handleAddPatientSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Patient name"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Age (Years) *</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={newPatientGender}
                    onChange={(e) => setNewPatientGender(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Relation *</label>
                  <select
                    value={newPatientRelation}
                    onChange={(e) => setNewPatientRelation(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Self">Self</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddPatient(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <Button type="submit" variant="primary" size="sm">
                    Save Profile
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-start">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{p.fullName}</span>
                    <Badge variant="green">{p.relation}</Badge>
                  </div>
                  <p className="text-slate-500">{p.age} Yrs • {p.gender}</p>
                </div>
                <button
                  onClick={() => handleDeletePatient(p.id)}
                  className="text-slate-400 hover:text-red-600 p-1"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-2">
              <Bell className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No notifications at this time.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleMarkNotification(n.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-colors flex justify-between items-start ${
                  n.isRead ? 'bg-white border-slate-200' : 'bg-emerald-50/60 border-emerald-300'
                }`}
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{n.title}</span>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                  </div>
                  <p className="text-slate-600">{n.message}</p>
                  <span className="text-[10px] text-slate-400 block">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-xl space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Account Credentials & Verification</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Account ID (UID):</span>
              <span className="font-mono text-slate-700">{user.uid}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Verified Email:</span>
              <span className="font-bold text-slate-900">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Registered Phone:</span>
              <span className="font-bold text-slate-900">+91 {user.phone || 'Not registered'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Account Access Role:</span>
              <span className="font-bold text-emerald-800">{user.role}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Member Since:</span>
              <span className="text-slate-700">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
