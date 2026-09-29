export interface DiagnosticTest {
  id: string;
  name: string;
  category: 'Hematology' | 'Biochemistry' | 'Clinical Pathology' | 'Serology & Immunology' | 'Thyroid & Hormones' | 'Preventive Health Packages';
  code: string;
  price: number;
  sampleType: 'Blood' | 'Serum' | 'Urine' | 'Plasma' | 'Stool' | 'Swab';
  fastingRequired: boolean;
  fastingHours?: number;
  turnaroundTime: string; // e.g. "Same Day (4-6 hrs)"
  description: string;
}

export type BookingStatus = 
  | 'Requested'
  | 'Confirmed'
  | 'Sample Collected'
  | 'Processing in Lab'
  | 'Report Ready'
  | 'Completed'
  | 'Cancelled';

export interface PatientInfo {
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  relation: 'Self' | 'Father' | 'Mother' | 'Spouse' | 'Child' | 'Other';
}

export interface Booking {
  id: string; // e.g. BLD-2026-9481
  tests: DiagnosticTest[];
  patient: PatientInfo;
  bookingDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "07:30 AM - 08:30 AM"
  collectionType: 'Home Collection' | 'Center Visit';
  address?: {
    street: string;
    landmark?: string;
    pincode: string;
    city: string;
  };
  totalAmount: number;
  paymentMode: 'Pay at Collection / Visit'; // Strictly no online payment
  paymentStatus: 'Pending' | 'Paid at Center' | 'Paid to Phlebotomist';
  status: BookingStatus;
  statusHistory: {
    status: BookingStatus;
    timestamp: string;
    note?: string;
  }[];
  phlebotomistNotes?: string;
  assignedPhlebotomist?: string;
  reportUrl?: string; // Report link or identifier
  reportUploadedAt?: string;
  syncedToSheets?: boolean;
  sheetsRowId?: number;
  createdAt: string;
}

export const BUSINESS_INFO = {
  name: "B.L. Diagnostic Center",
  tagline: "Accurate Diagnosis, Better Health",
  phone: "9649183422",
  address: "Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur - 302033",
  homeCollectionAvailable: true,
  timings: "Mon - Sat: 07:00 AM - 08:00 PM | Sun: 07:00 AM - 02:00 PM",
  email: "bldiagnosticcentre@gmail.com",
};
