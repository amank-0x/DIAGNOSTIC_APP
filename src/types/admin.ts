import { BookingWorkflowStatus, CollectionType } from './bookingSystem';
import { UserRole } from './auth';

export type AdminRoute =
  | 'dashboard'
  | 'users'
  | 'patients'
  | 'tests'
  | 'categories'
  | 'packages'
  | 'bookings'
  | 'home-collection'
  | 'reports'
  | 'leads'
  | 'contact-enquiries'
  | 'google-sheets'
  | 'analytics'
  | 'audit-logs'
  | 'settings';

export type GoogleSheetTabName =
  | 'Users'
  | 'Patients'
  | 'Tests'
  | 'Test_Categories'
  | 'Packages'
  | 'Package_Items'
  | 'Bookings'
  | 'Booking_Items'
  | 'Home_Collection'
  | 'Reports'
  | 'Leads'
  | 'Contact_Enquiries'
  | 'Notifications'
  | 'Analytics'
  | 'Audit_Logs'
  | 'Sync_Log';

export type SyncOperationType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'MANUAL_SYNC'
  | 'INBOUND_IMPORT'
  | 'RETRY'
  | 'FULL_SYNC';

export interface SyncLogRecord {
  sync_id: string;
  entity_type: GoogleSheetTabName | string;
  entity_id: string;
  operation: SyncOperationType;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  attempt_count: number;
  last_attempt_at: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminDashboardMetrics {
  totalUsers: number;
  totalBookings: number;
  todayBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  homeCollectionRequests: number;
  newLeads: number;
  contactEnquiries: number;
}

export interface DatabaseAnalyticsSummary {
  generatedAt: string;
  overview: {
    totalUsers: number;
    totalPatients: number;
    totalTestsActive: number;
    totalTestsInactive: number;
    totalPackages: number;
    totalBookings: number;
    totalRevenueBooked: number;
    completedRevenue: number;
    homeCollectionCount: number;
    centerVisitCount: number;
    totalReportsUploaded: number;
    totalLeads: number;
    totalEnquiries: number;
  };
  bookingsByStatus:
    | { status: string; count: number; revenue: number }[]
    | Record<string, number>;
  bookingsByCollectionType:
    | { type: string; count: number; percentage: number }[]
    | Record<string, number>;
  topBookedTests: {
    testId: string;
    testName: string;
    category?: string;
    count: number;
    totalValue?: number;
    revenue?: number;
  }[];
  categoryBreakdown: {
    category: string;
    count?: number;
    totalTests?: number;
    activeTests?: number;
    avgGeneralPrice?: number;
    avgCorporatePrice?: number;
  }[];
  leadsByStatus?: { status: string; count: number }[] | Record<string, number>;
  leadsBySource: { source: string; count: number }[] | Record<string, number>;
  patientDemographics?: {
    genderCounts: { gender: string; count: number }[];
    ageGroups: { label: string; count: number }[];
  };
  recentDailyBookings?: { date: string; count: number; revenue: number }[];
}

export interface AdminUserListItem {
  uid: string;
  userId?: string;
  email: string;
  displayName: string;
  phone: string;
  mobile_number?: string;
  role: UserRole;
  isActive: boolean;
  status?: string;
  registrationDate?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  patientsCount?: number;
  bookingsCount?: number;
}

export interface AdminPatientListItem {
  patient_id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  full_name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  relation: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  bookingsCount?: number;
}

export interface AdminCategoryItem {
  id: string;
  name: string;
  description: string;
  totalTests: number;
  activeTests: number;
  iconName?: string;
}

export type LeadSource =
  | 'CONTACT_FORM'
  | 'HOME_COLLECTION'
  | 'CALLBACK_REQUEST'
  | 'WEBSITE'
  | 'PHONE_CALL'
  | 'WALK_IN';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';

export interface Lead {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  serviceType: string;
  preferredDate?: string;
  address?: string;
  notes?: string;
  status: LeadStatus;
  internalNotes?: string;
  source: LeadSource;
  createdAt: string;
  updatedAt: string;
}

export interface ContactEnquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED';
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneralAuditLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType:
    | 'USER'
    | 'TEST'
    | 'PACKAGE'
    | 'BOOKING'
    | 'REPORT'
    | 'LEAD'
    | 'ENQUIRY'
    | 'SETTINGS'
    | 'SHEETS';
  entityId: string;
  details: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface GoogleSheetsSyncState {
  connectionStatus?: 'CONNECTED' | 'STANDBY_QUEUE_MODE' | 'ERROR';
  spreadsheetTitle?: string;
  spreadsheetIdConfigured?: boolean;
  serviceAccountConfigured?: boolean;
  serviceAccountEmailMasked?: string;
  lastSyncTimestamp?: string;
  syncStatus: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
  totalSynced: number;
  failedCount: number;
  pendingCount?: number;
  lastError?: string | null;
  webhookUrl?: string;
  syncLogs?: SyncLogRecord[];
  syncHistory: {
    id: string;
    timestamp: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    recordsProcessed: number;
    details: string;
    entityType?: string;
    entityId?: string;
    operation?: string;
    attemptCount?: number;
    errorMessage?: string | null;
  }[];
}

export interface CenterSettings {
  centerName: string;
  tagline: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  address: string;
  pincode: string;
  timingsWeekday: string;
  timingsSunday: string;
  homeCollectionPincodes: string;
  homeCollectionNoticeHours: number;
  enableHomeCollection: boolean;
  googleSheetsWebhookUrl?: string;
  operationalNotice?: string;
  available_time_slots?: string[];
}
