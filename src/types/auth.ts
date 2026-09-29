export type UserRole = 'USER' | 'STAFF' | 'ADMIN';

export interface UserProfile {
  // Primary Mobile + OTP Database Schema Fields
  id: string; // UUID
  mobile_number: string; // Normalized E.164 Indian format: +919649183422
  name: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string;

  // Backward-compatible aliases used across dashboard, booking, and admin components
  userId?: string; // Formatted User ID (e.g. USER-183422)
  uid: string; // Same as id
  mobileNumber?: string; // Same as mobile_number
  phone: string; // Normalized mobile number (+919649183422)
  displayName: string; // Same as name
  email: string; // Optional / empty string (no email login requirement)
  isVerified?: boolean;
  isActive: boolean;
  registrationDate?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyPatient {
  id: string;
  userId: string; // foreign key to UserProfile.id / uid
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  relation: 'Self' | 'Father' | 'Mother' | 'Spouse' | 'Child' | 'Other';
  phone?: string;
  bloodGroup?: string;
  createdAt: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'BOOKING' | 'REPORT' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface AuthSession {
  user: UserProfile | null;
  token: string | null;
  expiresAt: number | null; // epoch timestamp
}
