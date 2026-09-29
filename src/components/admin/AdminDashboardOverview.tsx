import React from 'react';
import {
  AdminDashboardMetrics,
  AdminRoute,
  DatabaseAnalyticsSummary,
} from '../../types/admin';
import {
  ClipboardList,
  CalendarCheck,
  Clock,
  Home,
  CheckCircle2,
  Users,
  UserCheck,
  FileCheck2,
  FileSpreadsheet,
  RefreshCw,
  Plus,
  Upload,
  MessageSquare,
} from 'lucide-react';
import { Button, SkeletonGrid } from '../ui/DesignSystem';

interface AdminDashboardOverviewProps {
  metrics: AdminDashboardMetrics | null;
  analytics?: DatabaseAnalyticsSummary | null;
  loading: boolean;
  onNavigate: (route: AdminRoute) => void;
  onRefresh: () => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  metrics,
  analytics,
  loading,
  onNavigate,
  onRefresh,
}) => {
  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#0F294A]">
            Laboratory Operations Overview
          </h2>
        </div>
        <SkeletonGrid count={9} columns={3} />
      </div>
    );
  }

  const totalPatients = (analytics as any)?.totalPatients ?? 0;
  const reportsUploaded = (analytics as any)?.totalReportsUploaded ?? 0;

  const kpiCards: {
    label: string;
    value: string | number;
    subtext: string;
    icon: React.FC<{ className?: string }>;
    route: AdminRoute;
    tone: 'navy' | 'green' | 'amber';
  }[] = [
    {
      label: 'Total Users',
      value: metrics.totalUsers,
      subtext: 'Registered accounts',
      icon: UserCheck,
      route: 'users',
      tone: 'navy',
    },
    {
      label: 'Total Patients',
      value: totalPatients,
      subtext: 'Saved patient profiles',
      icon: Users,
      route: 'patients',
      tone: 'navy',
    },
    {
      label: 'Total Bookings',
      value: metrics.totalBookings,
      subtext: 'All diagnostic appointments',
      icon: ClipboardList,
      route: 'bookings',
      tone: 'navy',
    },
    {
      label: "Today's Bookings",
      value: metrics.todayBookings,
      subtext: 'Scheduled for today',
      icon: CalendarCheck,
      route: 'bookings',
      tone: 'green',
    },
    {
      label: 'Pending Bookings',
      value: metrics.pendingBookings,
      subtext: 'Awaiting confirmation',
      icon: Clock,
      route: 'bookings',
      tone: 'amber',
    },
    {
      label: 'Completed Bookings',
      value: metrics.completedBookings,
      subtext: 'Processed & closed',
      icon: CheckCircle2,
      route: 'bookings',
      tone: 'green',
    },
    {
      label: 'Home Collection Bookings',
      value: metrics.homeCollectionRequests,
      subtext: 'Doorstep sample collection',
      icon: Home,
      route: 'home-collection',
      tone: 'green',
    },
    {
      label: 'Reports Uploaded',
      value: reportsUploaded,
      subtext: 'Digital reports released',
      icon: FileCheck2,
      route: 'reports',
      tone: 'navy',
    },
    {
      label: 'Contact Enquiries',
      value: metrics.contactEnquiries,
      subtext: 'Customer support messages',
      icon: MessageSquare,
      route: 'contact-enquiries',
      tone: 'amber',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Quick Operational Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
            B.L. Diagnostic Center · Operations
          </span>
          <h2 className="text-xl font-extrabold text-[#0F294A]">
            Admin Dashboard
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => onNavigate('tests')}>
            <Plus className="w-3.5 h-3.5" />
            <span>Manage Tests</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onNavigate('reports')}>
            <Upload className="w-3.5 h-3.5" />
            <span>Manage Reports</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('google-sheets')}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Google Sheets Sync</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* 9-CARD KPI GRID (100% Real Database Values) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          const iconColors = {
            navy: 'bg-[#0F294A]/10 text-[#0F294A]',
            green: 'bg-emerald-50 text-emerald-700',
            amber: 'bg-amber-50 text-amber-700',
          };
          return (
            <button
              key={i}
              type="button"
              onClick={() => onNavigate(card.route)}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs text-left transition-all flex items-start justify-between gap-3 cursor-pointer"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 block">
                  {card.label}
                </span>
                <span className="text-2xl font-extrabold text-[#0F294A] block tabular-nums">
                  {card.value}
                </span>
                <span className="text-[11px] text-slate-500 block">{card.subtext}</span>
              </div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconColors[card.tone]}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
