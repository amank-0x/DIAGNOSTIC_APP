import React, { useState, useEffect } from 'react';
import {
  AdminRoute,
  AdminDashboardMetrics,
  DatabaseAnalyticsSummary,
} from '../types/admin';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchAdminMetrics,
  fetchDatabaseAnalyticsSummary,
} from '../services/adminService';

// Existing Admin Sub-views
import { AdminDashboardOverview } from './admin/AdminDashboardOverview';
import { AdminBookingsManager } from './admin/AdminBookingsManager';
import { AdminPatientsManager } from './admin/AdminPatientsManager';
import { AdminUsersManager } from './admin/AdminUsersManager';
import { AdminTestsManager } from './admin/AdminTestsManager';
import { AdminCategoriesManager } from './admin/AdminCategoriesManager';
import { AdminPackageEditor } from './admin/AdminPackageEditor';
import { AdminReportsManager } from './admin/AdminReportsManager';
import { AdminLeadsManager } from './admin/AdminLeadsManager';
import { AdminContactEnquiriesManager } from './admin/AdminContactEnquiriesManager';
import { AdminGoogleSheetsSyncManager } from './admin/AdminGoogleSheetsSyncManager';
import { AdminSettingsManager } from './admin/AdminSettingsManager';
import { AdminAuditLogsManager } from './admin/AdminAuditLogsManager';

import {
  LayoutDashboard,
  ClipboardList,
  Home,
  Users,
  UserCog,
  FlaskConical,
  Package,
  FileCheck2,
  FileSpreadsheet,
  BarChart3,
  MessageSquare,
  Settings,
  History,
  ShieldCheck,
  Lock,
  LogOut,
  Menu,
  X,
  FolderTree,
  RefreshCw,
} from 'lucide-react';
import { Button, SkeletonGrid } from './ui/DesignSystem';

interface AdminPanelProps {
  initialTab?: AdminRoute;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  initialTab = 'dashboard',
}) => {
  const { user, isStaffOrAdmin, isAdmin, logout } = useAuth();
  const [activeRoute, setActiveRoute] = useState<AdminRoute>(initialTab);
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [analytics, setAnalytics] = useState<DatabaseAnalyticsSummary | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setActiveRoute(initialTab);
  }, [initialTab]);

  const handleRouteSelect = (route: AdminRoute) => {
    setActiveRoute(route);
    setMobileSidebarOpen(false);
    window.location.hash = `admin/${route}`;
  };

  const loadMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const [mData, aData] = await Promise.all([
        fetchAdminMetrics(),
        fetchDatabaseAnalyticsSummary(),
      ]);
      setMetrics(mData);
      setAnalytics(aData);
    } catch (e) {
      console.error('Error loading admin metrics:', e);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (isStaffOrAdmin) {
      loadMetrics();
    }
  }, [isStaffOrAdmin]);

  if (!user || !isStaffOrAdmin) {
    return (
      <div className="max-w-md mx-auto py-20 px-4">
        <div className="bg-white rounded-xl border border-red-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Restricted Admin Access</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            This portal is restricted to authorized{' '}
            <strong>B.L. Diagnostic Center</strong> administrators and laboratory staff.
          </p>
        </div>
      </div>
    );
  }

  const navItems: {
    id: AdminRoute;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: UserCog },
    { id: 'patients', label: 'Patients', icon: Users },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: ClipboardList,
      badge: metrics?.pendingBookings || 0,
    },
    { id: 'tests', label: 'Tests', icon: FlaskConical },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'packages', label: 'Packages', icon: Package },
    { id: 'reports', label: 'Reports', icon: FileCheck2 },
    {
      id: 'home-collection',
      label: 'Home Collection',
      icon: Home,
      badge: metrics?.homeCollectionRequests || 0,
    },
    {
      id: 'contact-enquiries',
      label: 'Contact Enquiries',
      icon: MessageSquare,
      badge: metrics?.contactEnquiries || 0,
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'google-sheets', label: 'Google Sheets Sync', icon: FileSpreadsheet },
    { id: 'audit-logs', label: 'Audit Logs', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const activeNavLabel =
    navItems.find((item) => item.id === activeRoute)?.label || 'Dashboard';

  return (
    <div className="min-h-[84vh] bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col lg:flex-row">
      {/* LEFT SIDEBAR NAVIGATION (Desktop) */}
      <aside
        className="hidden lg:flex lg:w-64 bg-[#0F294A] text-white flex-col justify-between shrink-0 border-r border-slate-800"
        aria-label="Admin Sidebar Navigation"
      >
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#059669] text-white flex items-center justify-center font-black shrink-0">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight text-white leading-tight">
                  B.L. Diagnostic
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Admin Control Panel
                </span>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <span className="text-slate-400 text-[10px] block">Signed in as</span>
              <span className="font-bold text-white truncate block">{user.displayName}</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 ${
                isAdmin
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              {user.role}
            </span>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRouteSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#059669] text-white shadow-2xs'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded tabular-nums ${
                        isActive
                          ? 'bg-white text-slate-900'
                          : 'bg-slate-800 text-emerald-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            type="button"
            onClick={logout}
            className="w-full py-2 px-3 rounded-lg text-slate-300 hover:text-red-400 hover:bg-slate-900/60 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE ADMIN HEADER */}
      <div className="lg:hidden bg-[#0F294A] text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#059669] text-white flex items-center justify-center font-black">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <span className="font-bold text-xs block">B.L. Diagnostic Admin</span>
            <span className="text-[11px] text-emerald-400 font-semibold block">
              {activeNavLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 text-white cursor-pointer"
          aria-label="Toggle Admin Menu"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {mobileSidebarOpen && (
        <div className="lg:hidden bg-[#0F294A] text-white px-4 py-3 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleRouteSelect(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#059669] text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* MAIN ADMIN WORKSPACE */}
      <div className="flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {activeRoute === 'dashboard' && (
          <AdminDashboardOverview
            metrics={metrics}
            analytics={analytics}
            loading={loadingMetrics}
            onNavigate={handleRouteSelect}
            onRefresh={loadMetrics}
          />
        )}

        {activeRoute === 'bookings' && (
          <AdminBookingsManager filterMode="all" onNavigateTab={handleRouteSelect} />
        )}

        {activeRoute === 'home-collection' && (
          <AdminBookingsManager
            filterMode="home-collection"
            onNavigateTab={handleRouteSelect}
          />
        )}

        {activeRoute === 'patients' && <AdminPatientsManager />}

        {activeRoute === 'users' && <AdminUsersManager />}

        {activeRoute === 'tests' && <AdminTestsManager />}

        {activeRoute === 'categories' && (
          <AdminCategoriesManager onNavigateTab={handleRouteSelect} />
        )}

        {activeRoute === 'packages' && <AdminPackageEditor />}

        {activeRoute === 'reports' && <AdminReportsManager />}

        {activeRoute === 'leads' && <AdminLeadsManager />}

        {activeRoute === 'contact-enquiries' && <AdminContactEnquiriesManager />}

        {activeRoute === 'google-sheets' && <AdminGoogleSheetsSyncManager />}

        {activeRoute === 'settings' && <AdminSettingsManager />}

        {activeRoute === 'audit-logs' && <AdminAuditLogsManager />}

        {activeRoute === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Real Database Metrics
                </span>
                <h2 className="text-xl font-extrabold text-[#0F294A]">
                  Laboratory Analytics Overview
                </h2>
              </div>
              <Button variant="outline" size="sm" onClick={loadMetrics}>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Analytics</span>
              </Button>
            </div>

            {!analytics ? (
              <SkeletonGrid count={6} columns={3} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Collection Method Breakdown */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-[#0F294A]">
                    Bookings by Collection Method
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                      <span className="text-emerald-800 font-semibold block">
                        Home Collection
                      </span>
                      <span className="text-2xl font-extrabold text-[#0F294A] tabular-nums">
                        {(analytics as any).homeCollectionCount ?? 0}
                      </span>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-600 font-semibold block">
                        Center Visit
                      </span>
                      <span className="text-2xl font-extrabold text-[#0F294A] tabular-nums">
                        {(analytics as any).centerVisitCount ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Popular Booked Tests */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-[#0F294A]">
                    Most Booked Diagnostic Tests
                  </h3>
                  {((analytics as any).popularTests || []).length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No test booking records yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {((analytics as any).popularTests || []).map(
                        (t: any, idx: number) => (
                          <div
                            key={idx}
                            className="py-2.5 flex items-center justify-between"
                          >
                            <span className="font-semibold text-slate-800">
                              {t.testName}
                            </span>
                            <span className="font-bold text-[#0F294A] tabular-nums">
                              {t.count} booking(s)
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
