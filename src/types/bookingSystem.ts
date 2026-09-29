export type BookingWorkflowStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'COLLECTION_ASSIGNED'
  | 'SAMPLE_COLLECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type CollectionType = 'HOME_COLLECTION' | 'CENTER_VISIT';

export type PatientGender = 'Male' | 'Female' | 'Other';

export type PatientRelation = 'Self' | 'Father' | 'Mother' | 'Spouse' | 'Child' | 'Other';

export interface BookingItemSnapshot {
  booking_item_id: string;
  booking_id: string;
  test_id: string;
  test_name_snapshot: string;
  category_snapshot: string;
  price_snapshot: number;
}

export interface BookingRecord {
  booking_id: string; // Human-readable format: BL-YYYY-000001
  user_id: string; // Foreign key to authenticated user
  patient_id: string; // Foreign key to patient
  patient_name_snapshot: string;
  patient_age_snapshot: number;
  patient_gender_snapshot: string;
  patient_phone_snapshot: string;
  collection_type: CollectionType;
  
  // Home collection address (minimum required fields)
  home_address?: string;
  area?: string;
  pincode?: string;

  booking_date: string; // YYYY-MM-DD
  time_slot: string; // e.g. "07:00 AM - 08:00 AM"
  status: BookingWorkflowStatus;
  notes?: string;
  
  // Historical snapshots & calculations
  items: BookingItemSnapshot[];
  total_amount: number;
  
  // Report attachment
  report_url?: string;
  report_notes?: string;
  report_released_at?: string;

  created_at: string;
  updated_at: string;
}

export interface PatientRecord {
  patient_id: string;
  user_id: string; // strictly owned by user
  full_name: string;
  age: number;
  gender: PatientGender;
  relation: PatientRelation;
  phone?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingSubmissionInput {
  patient_id: string;
  collection_type: CollectionType;
  booking_date: string;
  time_slot: string;
  home_address?: string;
  area?: string;
  pincode?: string;
  notes?: string;
  test_ids: string[];
}
