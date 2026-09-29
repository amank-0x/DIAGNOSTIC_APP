import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Booking, BookingStatus } from '../types';
import { OFFICIAL_RATE_LIST } from '../data/rateList';
import { syncEntityToGoogleSheets } from './sheetsService';

const BOOKINGS_COLLECTION = 'bookings';
const TESTS_COLLECTION = 'tests';

// Seed default rate list into Firestore if not present
export async function initializeDatabaseSeed() {
  try {
    const testSnap = await getDocs(collection(db, TESTS_COLLECTION));
    if (testSnap.empty) {
      for (const test of OFFICIAL_RATE_LIST) {
        await setDoc(doc(db, TESTS_COLLECTION, test.id), test);
      }
    }
  } catch (error) {
    console.warn('Database seed notice:', error);
  }
}

// Generate human-readable booking ID: BLD-YYYY-XXXX
export function generateBookingId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `BLD-${year}-${randomNum}`;
}

/**
 * Save a new booking (NO online payment, Pay at collection/visit).
 * Strictly executes primary database write FIRST, then performs non-blocking Google Sheets synchronization.
 */
export async function createBooking(
  bookingData: Omit<
    Booking,
    'id' | 'createdAt' | 'status' | 'statusHistory' | 'paymentStatus' | 'paymentMode'
  >
): Promise<Booking> {
  const id = generateBookingId();
  const now = new Date().toISOString();

  const newBooking: Booking = {
    ...bookingData,
    id,
    createdAt: now,
    status: 'Requested',
    paymentMode: 'Pay at Collection / Visit',
    paymentStatus: 'Pending',
    statusHistory: [
      {
        status: 'Requested',
        timestamp: now,
        note: `Booking created via portal for ${bookingData.collectionType}.`,
      },
    ],
    syncedToSheets: false,
  };

  // 1. Primary Database Write First (Source of Truth)
  await setDoc(doc(db, BOOKINGS_COLLECTION, id), newBooking);

  // 2. Non-blocking Google Sheets Sync to 'Bookings', 'Booking_Items', and 'Home_Collection'
  const isHome = String(bookingData.collectionType || '').toUpperCase().includes('HOME');
  const formattedAddress = isHome
    ? bookingData.address
      ? `${bookingData.address.street || ''}, ${bookingData.address.landmark || ''}, ${
          bookingData.address.pincode || ''
        }, ${bookingData.address.city || 'Jaipur'}`
      : 'Pratap Nagar, Jaipur'
    : 'Center Visit (Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur)';

  syncEntityToGoogleSheets({
    entityType: 'Bookings',
    entityId: id,
    operation: 'CREATE',
    record: {
      id,
      booking_id: id,
      user_id: (bookingData as any).userId || '',
      patient_id: (bookingData.patient as any)?.id || '',
      patient_name: bookingData.patient.fullName,
      phone: bookingData.patient.phone,
      booking_date: bookingData.bookingDate,
      booking_time: bookingData.timeSlot,
      collection_type: isHome ? 'HOME_COLLECTION' : 'CENTER_VISIT',
      address: formattedAddress,
      status: 'Requested',
      created_at: now,
      updated_at: now,
    },
  }).catch(() => {});

  if (Array.isArray(bookingData.tests) && bookingData.tests.length > 0) {
    syncEntityToGoogleSheets({
      entityType: 'Booking_Items',
      entityId: `${id}-ITEMS`,
      operation: 'CREATE',
      record: bookingData.tests.map((t, idx) => ({
        id: `${id}-ITEM-${idx + 1}`,
        booking_id: id,
        test_id: t.id,
        test_name_snapshot: t.name,
        quantity: 1,
        price_snapshot: t.price,
        created_at: now,
      })),
    }).catch(() => {});
  }

  if (isHome) {
    syncEntityToGoogleSheets({
      entityType: 'Home_Collection',
      entityId: `HC-${id}`,
      operation: 'CREATE',
      record: {
        id: `HC-${id}`,
        booking_id: id,
        user_id: (bookingData as any).userId || '',
        patient_id: (bookingData.patient as any)?.id || '',
        patient_name: bookingData.patient.fullName,
        phone: bookingData.patient.phone,
        address: formattedAddress,
        area: bookingData.address?.landmark || 'Pratap Nagar',
        pincode: bookingData.address?.pincode || '302033',
        status: 'Requested',
        created_at: now,
        updated_at: now,
      },
    }).catch(() => {});
  }

  return newBooking;
}

// Fetch single booking by ID
export async function getBookingById(bookingId: string): Promise<Booking | null> {
  try {
    const cleanId = bookingId.trim().toUpperCase();
    const docSnap = await getDoc(doc(db, BOOKINGS_COLLECTION, cleanId));
    if (docSnap.exists()) {
      return docSnap.data() as Booking;
    }
    return null;
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    return null;
  }
}

// Subscribe to all bookings for Admin Dashboard
export function subscribeToBookings(callback: (bookings: Booking[]) => void) {
  const q = query(collection(db, BOOKINGS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Booking[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as Booking);
      });
      callback(items);
    },
    (err) => {
      console.warn('Bookings listener notice (fallback to local if offline):', err);
    }
  );
}

// Update booking status with history (DB first, then Google Sheets sync)
export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  note?: string,
  extraUpdates?: Partial<Booking>
): Promise<void> {
  const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    throw new Error('Booking not found: ' + bookingId);
  }

  const currentData = snap.data() as Booking;
  const now = new Date().toISOString();

  const updatedHistory = [
    ...(currentData.statusHistory || []),
    {
      status: newStatus,
      timestamp: now,
      note: note || `Status updated to ${newStatus}`,
    },
  ];

  // 1. Update primary database first
  await updateDoc(docRef, {
    status: newStatus,
    statusHistory: updatedHistory,
    ...(extraUpdates || {}),
  });

  // 2. Non-blocking sync to Google Sheets Bookings worksheet
  syncEntityToGoogleSheets({
    entityType: 'Bookings',
    entityId: bookingId,
    operation: 'UPDATE',
    record: {
      id: bookingId,
      booking_id: bookingId,
      patient_name: currentData.patient?.fullName || '',
      phone: currentData.patient?.phone || '',
      booking_date: currentData.bookingDate,
      booking_time: currentData.timeSlot,
      collection_type: currentData.collectionType,
      status: newStatus,
      created_at: currentData.createdAt || now,
      updated_at: now,
    },
  }).catch(() => {});
}

// Update payment status (Cash/Direct collected at visit or center)
export async function updatePaymentStatus(
  bookingId: string,
  paymentStatus: Booking['paymentStatus']
): Promise<void> {
  const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  await updateDoc(docRef, { paymentStatus });
}

// Attach laboratory report metadata (DB first, then Google Sheets Reports & Bookings sync)
export async function attachReportToBooking(
  bookingId: string,
  reportUrl: string,
  doctorRemarks?: string
): Promise<void> {
  const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  const now = new Date().toISOString();

  // 1. Update primary database first
  await updateDoc(docRef, {
    reportUrl,
    reportUploadedAt: now,
    status: 'Report Ready',
    statusHistory: [
      {
        status: 'Report Ready',
        timestamp: now,
        note: doctorRemarks
          ? `Report generated: ${doctorRemarks}`
          : 'Laboratory diagnostic report verified and attached.',
      },
    ],
  });

  // 2. Non-blocking sync to Google Sheets Reports & Bookings worksheets (metadata only)
  const snap = await getDoc(docRef);
  const booking = snap.exists() ? (snap.data() as Booking) : null;

  syncEntityToGoogleSheets({
    entityType: 'Reports',
    entityId: `REP-${bookingId}`,
    operation: 'CREATE',
    record: {
      report_id: `REP-${bookingId}`,
      booking_id: bookingId,
      patient_id: (booking?.patient as any)?.id || '',
      user_id: (booking as any)?.userId || '',
      report_name: `Diagnostic Report - ${bookingId}`,
      report_date: now.slice(0, 10),
      status: 'READY',
      file_reference: `Protected Reference (Booking ${bookingId})`,
      created_at: now,
      updated_at: now,
    },
  }).catch(() => {});
}
