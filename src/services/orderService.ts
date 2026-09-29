import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  runTransaction 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  BookingRecord, 
  BookingItemSnapshot, 
  BookingWorkflowStatus,
  CollectionType 
} from '../types/bookingSystem';
import { getPatientById } from './patientService';
import { getTestByIdFromDB } from './catalogueService';
import { getPackageByIdFromDB } from './packageService';
import { createUserNotification } from './userService';
import { syncEntityToGoogleSheets } from './sheetsService';

const BOOKINGS_COLLECTION = 'bookings';
const COUNTER_DOC = 'booking_counter';

/**
 * Generate human-readable booking ID in format: BL-YYYY-000001
 */
export async function generateBookingNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const counterRef = doc(db, 'system_metadata', `${COUNTER_DOC}_${currentYear}`);

  try {
    let nextNum = 1;
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterRef);
      if (snap.exists()) {
        nextNum = (snap.data().last_seq || 0) + 1;
        transaction.update(counterRef, { last_seq: nextNum });
      } else {
        transaction.set(counterRef, { last_seq: 1, year: currentYear });
      }
    });

    const padded = String(nextNum).padStart(6, '0');
    return `BL-${currentYear}-${padded}`;
  } catch (e) {
    // Fallback pseudo-sequential ID if transaction is restricted
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    return `BL-${currentYear}-${randomSeq}`;
  }
}

/**
 * Submit Booking: Creates historic immutable snapshots of patient and test pricing
 */
export async function createBookingOrder(params: {
  userId: string;
  patientId: string;
  collectionType: CollectionType;
  bookingDate: string;
  timeSlot: string;
  homeAddress?: string;
  area?: string;
  pincode?: string;
  notes?: string;
  selectedTestIds: string[];
}): Promise<BookingRecord> {
  const {
    userId,
    patientId,
    collectionType,
    bookingDate,
    timeSlot,
    homeAddress,
    area,
    pincode,
    notes,
    selectedTestIds
  } = params;

  // Validation
  if (!selectedTestIds || selectedTestIds.length === 0) {
    throw new Error('Please select at least one diagnostic test or package.');
  }

  if (collectionType === 'HOME_COLLECTION') {
    if (!homeAddress || !homeAddress.trim()) {
      throw new Error('Home collection requires delivery address.');
    }
  }

  // IDOR check: verify patient belongs to user
  const patient = await getPatientById(patientId, userId);
  if (!patient) {
    throw new Error('Selected patient does not exist or unauthorized.');
  }

  // Build immutable historical item snapshots
  const items: BookingItemSnapshot[] = [];
  let totalAmount = 0;

  for (const tid of selectedTestIds) {
    // Check catalogue
    const test = await getTestByIdFromDB(tid);
    if (test) {
      const price = test.general_price ?? 0;
      totalAmount += price;
      items.push({
        booking_item_id: `item-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
        booking_id: '',
        test_id: test.test_id,
        test_name_snapshot: test.test_name,
        category_snapshot: test.category,
        price_snapshot: price
      });
    } else {
      // Check package
      const pkg = await getPackageByIdFromDB(tid);
      if (pkg) {
        totalAmount += pkg.price;
        items.push({
          booking_item_id: `item-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
          booking_id: '',
          test_id: pkg.package_id,
          test_name_snapshot: pkg.package_name,
          category_snapshot: 'Preventive Health Packages',
          price_snapshot: pkg.price
        });
      }
    }
  }

  const bookingId = await generateBookingNumber();
  items.forEach(it => { it.booking_id = bookingId; });

  const now = new Date().toISOString();
  const bookingRecord: BookingRecord = {
    booking_id: bookingId,
    user_id: userId,
    patient_id: patientId,
    patient_name_snapshot: patient.full_name,
    patient_age_snapshot: patient.age,
    patient_gender_snapshot: patient.gender,
    patient_phone_snapshot: patient.phone || '',
    collection_type: collectionType,
    home_address: homeAddress?.trim() || undefined,
    area: area?.trim() || undefined,
    pincode: pincode?.trim() || undefined,
    booking_date: bookingDate,
    time_slot: timeSlot,
    status: 'CONFIRMED',
    notes: notes?.trim() || undefined,
    items,
    total_amount: totalAmount,
    created_at: now,
    updated_at: now
  };

  // 1. Write booking to primary database first (Source of Truth)
  await setDoc(doc(db, BOOKINGS_COLLECTION, bookingId), bookingRecord);

  // 2. Non-blocking Google Sheets Operational Sync (Bookings, Booking_Items, Home_Collection)
  // NEVER fails or deletes the database record if Google Sheets API encounters an issue
  syncEntityToGoogleSheets({
    entityType: 'Bookings',
    entityId: bookingId,
    operation: 'CREATE',
    record: {
      id: bookingId,
      booking_number: bookingId,
      user_id: userId,
      patient_id: patientId,
      booking_date: bookingDate,
      booking_time: timeSlot,
      collection_type: collectionType,
      address:
        collectionType === 'HOME_COLLECTION'
          ? `${homeAddress || ''}, ${area || ''} ${pincode || ''}`.trim()
          : 'Center Visit (Pratap Nagar, Jaipur)',
      status: 'CONFIRMED',
      patient_name: patient.full_name,
      phone: patient.phone || '',
      items,
      total_amount: totalAmount,
      created_at: now,
      updated_at: now
    }
  }).catch(() => {});

  if (items.length > 0) {
    syncEntityToGoogleSheets({
      entityType: 'Booking_Items',
      entityId: `${bookingId}-ITEMS`,
      operation: 'CREATE',
      record: items.map(it => ({
        id: it.booking_item_id,
        booking_id: bookingId,
        test_id: it.test_id,
        test_name_snapshot: it.test_name_snapshot,
        price_snapshot: it.price_snapshot,
        created_at: now
      }))
    }).catch(() => {});
  }

  if (collectionType === 'HOME_COLLECTION') {
    syncEntityToGoogleSheets({
      entityType: 'Home_Collection',
      entityId: `HC-${bookingId}`,
      operation: 'CREATE',
      record: {
        id: `HC-${bookingId}`,
        booking_id: bookingId,
        patient_id: patientId,
        address: homeAddress?.trim() || '',
        area: area?.trim() || '',
        pincode: pincode?.trim() || '',
        status: 'CONFIRMED',
        created_at: now,
        updated_at: now
      }
    }).catch(() => {});
  }

  // 3. Send in-app notification to user
  await createUserNotification({
    userId,
    title: `Booking Confirmed: ${bookingId}`,
    message: `Your booking for ${patient.full_name} (${items.length} tests) on ${bookingDate} at ${timeSlot} has been received.`,
    type: 'BOOKING',
    link: `/dashboard/bookings/${bookingId}`
  });

  return bookingRecord;
}

/**
 * Fetch all bookings for a user
 */
export async function getBookingsForUser(userId: string): Promise<BookingRecord[]> {
  try {
    const q = query(collection(db, BOOKINGS_COLLECTION), where('user_id', '==', userId));
    const snap = await getDocs(q);
    const list: BookingRecord[] = [];
    snap.forEach(d => list.push(d.data() as BookingRecord));
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.error('Error fetching bookings for user:', err);
    return [];
  }
}

/**
 * Fetch booking by ID with ownership or staff authorization check
 */
export async function getBookingById(bookingId: string, userId?: string, isStaffOrAdmin = false): Promise<BookingRecord | null> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() as BookingRecord;

    if (!isStaffOrAdmin && userId && data.user_id !== userId) {
      throw new Error('Unauthorized: cannot view another patient booking.');
    }
    return data;
  } catch (err) {
    console.error('Error fetching booking by ID:', err);
    return null;
  }
}

/**
 * Update workflow status (staff or admin only)
 */
export async function updateBookingWorkflowStatus(
  bookingId: string, 
  status: BookingWorkflowStatus,
  reportData?: { report_url: string; report_notes?: string }
): Promise<void> {
  const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  const now = new Date().toISOString();
  
  const updates: any = {
    status,
    updated_at: now
  };

  if (reportData) {
    updates.report_url = reportData.report_url;
    updates.report_notes = reportData.report_notes;
    updates.report_released_at = now;
  }

  await updateDoc(docRef, updates);

  // Notify user & sync updated booking to Google Sheets without creating duplicates
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const booking = snap.data() as BookingRecord;

    syncEntityToGoogleSheets({
      entityType: 'Bookings',
      entityId: booking.booking_id,
      operation: 'UPDATE',
      record: {
        id: booking.booking_id,
        booking_number: booking.booking_id,
        user_id: booking.user_id,
        patient_id: booking.patient_id,
        patient_name: booking.patient_name_snapshot,
        phone: booking.patient_phone_snapshot || '',
        booking_date: booking.booking_date,
        booking_time: booking.time_slot,
        collection_type: booking.collection_type,
        address:
          booking.collection_type === 'HOME_COLLECTION'
            ? `${booking.home_address || ''}, ${booking.area || ''} ${booking.pincode || ''}`.trim()
            : 'Center Visit (Pratap Nagar, Jaipur)',
        status: booking.status,
        created_at: booking.created_at,
        updated_at: now,
      },
    }).catch(() => {});

    if (booking.collection_type === 'HOME_COLLECTION') {
      syncEntityToGoogleSheets({
        entityType: 'Home_Collection',
        entityId: `HC-${booking.booking_id}`,
        operation: 'UPDATE',
        record: {
          id: `HC-${booking.booking_id}`,
          booking_id: booking.booking_id,
          user_id: booking.user_id,
          patient_id: booking.patient_id,
          patient_name: booking.patient_name_snapshot,
          phone: booking.patient_phone_snapshot || '',
          address: booking.home_address || '',
          area: booking.area || '',
          pincode: booking.pincode || '',
          status: booking.status,
          created_at: booking.created_at,
          updated_at: now,
        },
      }).catch(() => {});
    }

    if (status === 'COMPLETED' || reportData) {
      await createUserNotification({
        userId: booking.user_id,
        title: `Report Ready for ${booking.booking_id}`,
        message: `Certified laboratory report for ${booking.patient_name_snapshot} is now ready to download.`,
        type: 'REPORT',
        link: `/dashboard/reports`
      });
    }
  }
}
