/**
 * Google Sheets Schema & Entity Mapper (`googleSheetsMapper`)
 *
 * Primary Database (PostgreSQL / Firestore) -> Operational & Reporting Google Sheets Layer
 *
 * Official 9 Required Tabs:
 * 1. Users
 * 2. Patients
 * 3. Bookings
 * 4. Home Collection
 * 5. Leads
 * 6. Tests
 * 7. Packages
 * 8. Time Slots
 * 9. Sync Logs
 *
 * SECURITY INVARIANT:
 * - NEVER maps or uploads passwords, password hashes, OTP codes, session tokens,
 *   authentication secrets, or service account keys into Google Sheets.
 * - Only operational and business reporting fields are mapped.
 */

export type CanonicalTabName =
  | 'Users'
  | 'Patients'
  | 'Bookings'
  | 'Home Collection'
  | 'Leads'
  | 'Tests'
  | 'Packages'
  | 'Time Slots'
  | 'Sync Logs';

export type WorksheetTabName =
  | CanonicalTabName
  | 'Home_Collection'
  | 'Sync_Log'
  | 'Time_Slots'
  | 'Booking_Items'
  | 'Reports'
  | 'Audit_Logs'
  | 'Contact_Enquiries';

export const OFFICIAL_CANONICAL_TABS: CanonicalTabName[] = [
  'Users',
  'Patients',
  'Bookings',
  'Home Collection',
  'Leads',
  'Tests',
  'Packages',
  'Time Slots',
  'Sync Logs',
];

export const WORKSHEET_TABS: WorksheetTabName[] = [
  'Users',
  'Patients',
  'Bookings',
  'Home Collection',
  'Leads',
  'Tests',
  'Packages',
  'Time Slots',
  'Sync Logs',
  'Home_Collection',
  'Sync_Log',
  'Time_Slots',
  'Booking_Items',
  'Reports',
  'Audit_Logs',
  'Contact_Enquiries',
];

/**
 * Normalizes tab names so both "Home Collection" & "Home_Collection",
 * "Sync Logs" & "Sync_Log", "Time Slots" & "Time_Slots" are recognized and reused.
 */
export function normalizeTabName(name: string): CanonicalTabName | string {
  const trimmed = (name || '').trim();
  const lower = trimmed.toLowerCase().replace(/[\s_-]+/g, '');

  if (lower === 'users') return 'Users';
  if (lower === 'patients') return 'Patients';
  if (lower === 'bookings') return 'Bookings';
  if (lower === 'homecollection') return 'Home Collection';
  if (lower === 'leads') return 'Leads';
  if (lower === 'tests') return 'Tests';
  if (lower === 'packages') return 'Packages';
  if (lower === 'timeslots') return 'Time Slots';
  if (lower === 'synclogs' || lower === 'synclog') return 'Sync Logs';

  return trimmed;
}

export const WORKSHEET_HEADERS: Record<CanonicalTabName, string[]> = {
  Users: [
    'User ID',
    'Customer Name',
    'Mobile Number',
    'Mobile Verified',
    'Email',
    'Account Status',
    'Registration Date',
    'Last Login',
    'Total Bookings',
    'Created At',
    'Updated At',
  ],
  Patients: [
    'Patient ID',
    'User ID',
    'Patient Name',
    'Relationship',
    'Gender',
    'Date of Birth / Age',
    'Mobile Number',
    'Address',
    'Created At',
    'Updated At',
    'Status',
  ],
  Bookings: [
    'Booking ID',
    'Booking Date',
    'Booking Time',
    'Customer Name',
    'Mobile Number',
    'Patient Name',
    'Relationship',
    'Test / Package',
    'Test ID',
    'Collection Method',
    'Appointment Date',
    'Time Slot',
    'House / Flat',
    'Street / Area',
    'Landmark',
    'City',
    'Pincode',
    'Contact Number',
    'Test Charges',
    'Home Collection Fee',
    'Total Amount',
    'Payment Method',
    'Booking Status',
    'Created At',
    'Updated At',
    'Sheet Sync Status',
    'Sync Last Attempt',
  ],
  'Home Collection': [
    'Booking ID',
    'Customer Name',
    'Patient Name',
    'Mobile Number',
    'Contact Number',
    'Collection Date',
    'Time Slot',
    'House / Flat',
    'Street / Area',
    'Landmark',
    'City',
    'Pincode',
    'Collection Status',
    'Assigned To',
    'Remarks',
    'Created At',
    'Updated At',
  ],
  Leads: [
    'Lead ID',
    'Lead Date',
    'Lead Time',
    'Name',
    'Mobile Number',
    'Email',
    'Lead Source',
    'Lead Type',
    'Message',
    'Interested Service',
    'Preferred Date',
    'Preferred Time',
    'City',
    'Pincode',
    'Status',
    'Assigned To',
    'Admin Remarks',
    'Created At',
    'Updated At',
  ],
  Tests: [
    'Test ID',
    'Test Name',
    'Category',
    'Method',
    'Sample',
    'Sample Instructions',
    'Clinical Information',
    'Reporting Time',
    'General Price',
    'Corporate Price',
    'Status',
    'Created At',
    'Updated At',
  ],
  Packages: [
    'Package ID',
    'Package Name',
    'Description',
    'Price',
    'Status',
    'Created At',
    'Updated At',
  ],
  'Time Slots': [
    'Slot ID',
    'Date',
    'Start Time',
    'End Time',
    'Capacity',
    'Booked Count',
    'Available Count',
    'Status',
    'Updated At',
  ],
  'Sync Logs': [
    'Sync ID',
    'Entity Type',
    'Entity ID',
    'Operation',
    'Status',
    'Attempt Count',
    'Error Message',
    'Last Attempt',
    'Synced At',
    'Created At',
    'Updated At',
  ],
};

function cleanCell(val: unknown): string | number {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 'ACTIVE' : 'INACTIVE';
  const str = String(val).trim();
  // Prevent spreadsheet formula injection (=, +, -, @)
  if (/^[=+\-@]/.test(str) && isNaN(Number(str))) {
    return `'${str}`;
  }
  return str;
}

/**
 * Maps a database record into the exact array of cell values matching the tab's column headers.
 */
export function mapEntityToSheetRow(
  rawTab: WorksheetTabName,
  record: Record<string, any>
): (string | number)[] {
  const tab = normalizeTabName(rawTab) as CanonicalTabName;
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const currentTime = now.slice(11, 19);

  switch (tab) {
    case 'Users': {
      const userId = record.userId || record.user_id || record.id || '';
      const name = record.fullName || record.full_name || record.name || record.customer_name || '';
      const phone = record.phone || record.mobile_number || record.mobile || '';
      const verified = record.is_verified === false || record.mobile_verified === false ? 'NO' : 'YES';
      const email = record.email || '';
      const status =
        record.accountStatus ||
        record.account_status ||
        record.status ||
        (record.is_active === false ? 'DEACTIVATED' : 'ACTIVE');
      const regDate = record.registrationDate || record.registration_date || record.created_at || today;
      const lastLogin = record.lastLogin || record.last_login_at || record.last_login || record.updated_at || '';
      const totalBookings = Number(record.totalBookings ?? record.total_bookings ?? record.booking_count ?? 0);

      return [
        cleanCell(userId),
        cleanCell(name),
        cleanCell(phone),
        cleanCell(verified),
        cleanCell(email),
        cleanCell(status),
        cleanCell(regDate),
        cleanCell(lastLogin),
        totalBookings,
        cleanCell(record.created_at || record.createdAt || now),
        cleanCell(record.updated_at || record.updatedAt || now),
      ];
    }

    case 'Patients': {
      const patientId = record.id || record.patient_id || '';
      const userId = record.user_id || record.userId || '';
      const patientName = record.patient_name || record.fullName || record.name || '';
      const relationship = record.relationship || record.relation || 'Self';
      const gender = record.gender || 'Other';
      const ageStr = record.dob_or_age || (record.age ? `${record.age} Yrs` : record.dateOfBirth || '');
      const phone = record.mobile_number || record.phone || '';
      const address = record.address || '';
      const status = record.status || (record.is_active === false ? 'INACTIVE' : 'ACTIVE');

      return [
        cleanCell(patientId),
        cleanCell(userId),
        cleanCell(patientName),
        cleanCell(relationship),
        cleanCell(gender),
        cleanCell(ageStr),
        cleanCell(phone),
        cleanCell(address),
        cleanCell(record.created_at || record.createdAt || now),
        cleanCell(record.updated_at || record.updatedAt || now),
        cleanCell(status),
      ];
    }

    case 'Bookings': {
      const bookingId = record.id || record.booking_id || record.booking_number || '';
      const bDate = record.booking_date || record.appointment_date || record.bookingDate || today;
      const bTime = record.booking_time || record.time_slot || record.timeSlot || '';
      const custName =
        record.customer_name || record.user_name || record.patient_name || record.patient?.fullName || '';
      const mobile =
        record.mobile_number || record.customer_phone || record.phone || record.patient?.phone || '';
      const patName = record.patient_name || record.patient?.fullName || custName;
      const relation = record.relationship || record.patient?.relationship || record.patient?.relation || 'Self';

      // Test / Package description
      const testPackageNames =
        record.test_package ||
        record.test_or_package_names ||
        (Array.isArray(record.tests) ? record.tests.map((t: any) => t.name).join(', ') : record.test_name || '');
      const testIds =
        record.test_id ||
        record.test_ids ||
        (Array.isArray(record.tests) ? record.tests.map((t: any) => t.id || t.code).join(', ') : '');

      const colTypeRaw = String(record.collection_type || record.collectionType || 'CENTER').toUpperCase();
      const colMethod = colTypeRaw.includes('HOME') ? 'HOME_COLLECTION' : 'CENTER_VISIT';

      const apptDate = record.appointment_date || record.booking_date || record.bookingDate || bDate;
      const timeSlot = record.time_slot || record.timeSlot || bTime;

      // Address fields
      const houseFlat =
        record.house_flat || record.houseFlat || record.address?.house || record.address?.street || '';
      const streetArea =
        record.street_area || record.streetArea || record.address?.area || record.address?.street || '';
      const landmark =
        record.landmark || record.address?.landmark || 'Near Post Office, Kumbha Marg';
      const city = record.city || record.address?.city || 'Jaipur';
      const pincode = record.pincode || record.address?.pincode || '302033';
      const contactNum = record.contact_number || record.phone || mobile;

      const testCharges = Number(record.test_charges ?? record.total_amount ?? record.totalAmount ?? 0);
      const homeFee = Number(record.home_collection_fee ?? 0);
      const totalAmount = Number(record.total_amount ?? record.totalAmount ?? testCharges + homeFee);
      const payMethod = record.payment_method || 'PAY_AT_CENTER';
      const status = record.status || 'CONFIRMED';
      const syncStatus = record.sheet_sync_status || 'SUCCESS';
      const syncLastAttempt = record.sync_last_attempt || now;

      return [
        cleanCell(bookingId),
        cleanCell(bDate),
        cleanCell(bTime),
        cleanCell(custName),
        cleanCell(mobile),
        cleanCell(patName),
        cleanCell(relation),
        cleanCell(testPackageNames),
        cleanCell(testIds),
        cleanCell(colMethod),
        cleanCell(apptDate),
        cleanCell(timeSlot),
        cleanCell(houseFlat),
        cleanCell(streetArea),
        cleanCell(landmark),
        cleanCell(city),
        cleanCell(pincode),
        cleanCell(contactNum),
        testCharges,
        homeFee,
        totalAmount,
        cleanCell(payMethod),
        cleanCell(status),
        cleanCell(record.created_at || record.createdAt || now),
        cleanCell(record.updated_at || record.updatedAt || now),
        cleanCell(syncStatus),
        cleanCell(syncLastAttempt),
      ];
    }

    case 'Home Collection': {
      const bookingId = record.booking_id || record.id || '';
      const custName = record.customer_name || record.patient_name || '';
      const patName = record.patient_name || record.patient?.fullName || custName;
      const mobile = record.mobile_number || record.phone || '';
      const contactNum = record.contact_number || record.phone || mobile;
      const colDate = record.collection_date || record.appointment_date || record.booking_date || today;
      const timeSlot = record.time_slot || record.timeSlot || '';
      const houseFlat =
        record.house_flat || record.houseFlat || record.address?.house || record.address?.street || record.address || '';
      const streetArea =
        record.street_area || record.streetArea || record.address?.area || record.area || 'Sector 11, Pratap Nagar';
      const landmark = record.landmark || record.address?.landmark || 'Near Post Office';
      const city = record.city || record.address?.city || 'Jaipur';
      const pincode = record.pincode || record.address?.pincode || '302033';
      const colStatus = record.collection_status || record.status || 'REQUESTED';
      const assignedTo = record.assigned_to || record.assigned_phlebotomist || 'Unassigned';
      const remarks = record.remarks || record.notes || '';

      return [
        cleanCell(bookingId),
        cleanCell(custName),
        cleanCell(patName),
        cleanCell(mobile),
        cleanCell(contactNum),
        cleanCell(colDate),
        cleanCell(timeSlot),
        cleanCell(houseFlat),
        cleanCell(streetArea),
        cleanCell(landmark),
        cleanCell(city),
        cleanCell(pincode),
        cleanCell(colStatus),
        cleanCell(assignedTo),
        cleanCell(remarks),
        cleanCell(record.created_at || now),
        cleanCell(record.updated_at || now),
      ];
    }

    case 'Leads': {
      const leadId = record.id || record.lead_id || '';
      const leadDate =
        record.lead_date || (record.createdAt ? record.createdAt.slice(0, 10) : today);
      const leadTime =
        record.lead_time || (record.createdAt ? record.createdAt.slice(11, 19) : currentTime);
      const name = record.name || record.fullName || '';
      const mobile = record.phone || record.mobile || record.mobile_number || '';
      const email = record.email || '';
      const source = record.source || record.lead_source || 'Website';
      const leadType =
        record.lead_type || (record.source ? record.source.replace(/_/g, ' ') : 'General Enquiry');
      const message = record.message || record.notes || '';
      const service = record.serviceType || record.interested_service || '';
      const prefDate = record.preferredDate || record.preferred_date || '';
      const prefTime = record.preferredTime || record.preferred_time || '';
      const city = record.city || 'Jaipur';
      const pincode = record.pincode || '302033';
      const status = record.status || 'NEW';
      const assignedTo = record.assigned_to || record.assignedTo || 'Unassigned';
      const adminRemarks = record.admin_remarks || record.internalNotes || '';

      return [
        cleanCell(leadId),
        cleanCell(leadDate),
        cleanCell(leadTime),
        cleanCell(name),
        cleanCell(mobile),
        cleanCell(email),
        cleanCell(source),
        cleanCell(leadType),
        cleanCell(message),
        cleanCell(service),
        cleanCell(prefDate),
        cleanCell(prefTime),
        cleanCell(city),
        cleanCell(pincode),
        cleanCell(status),
        cleanCell(assignedTo),
        cleanCell(adminRemarks),
        cleanCell(record.created_at || record.createdAt || now),
        cleanCell(record.updated_at || record.updatedAt || now),
      ];
    }

    case 'Tests': {
      const testId = record.id || record.test_id || '';
      const testName = record.test_name || record.name || '';
      const category = record.category || 'Clinical Pathology';
      const method = record.method || '';
      const sample = record.sample || record.sampleType || 'Blood';
      const instructions = record.sample_instructions || '';
      const clinical = record.clinical_information || record.description || '';
      const reportTime = record.reporting_time || record.turnaroundTime || 'Same Day';
      const genPrice = Number(record.general_price ?? record.price ?? 0);
      const corpPrice = Number(record.corporate_price ?? '') || '';
      const status = record.status || (record.is_active === false ? 'INACTIVE' : 'ACTIVE');

      return [
        cleanCell(testId),
        cleanCell(testName),
        cleanCell(category),
        cleanCell(method),
        cleanCell(sample),
        cleanCell(instructions),
        cleanCell(clinical),
        cleanCell(reportTime),
        genPrice,
        corpPrice,
        cleanCell(status),
        cleanCell(record.created_at || now),
        cleanCell(record.updated_at || now),
      ];
    }

    case 'Packages': {
      const pkgId = record.id || record.package_id || '';
      const pkgName = record.package_name || record.name || '';
      const desc = record.description || '';
      const price = Number(record.price ?? 0);
      const status = record.status || (record.is_active === false ? 'INACTIVE' : 'ACTIVE');

      return [
        cleanCell(pkgId),
        cleanCell(pkgName),
        cleanCell(desc),
        price,
        cleanCell(status),
        cleanCell(record.created_at || now),
        cleanCell(record.updated_at || now),
      ];
    }

    case 'Time Slots': {
      const slotId = record.id || record.slot_id || '';
      const date = record.date || today;
      const startTime = record.start_time || record.startTime || '07:00 AM';
      const endTime = record.end_time || record.endTime || '08:00 AM';
      const capacity = Number(record.capacity ?? 10);
      const booked = Number(record.booked_count ?? record.bookedCount ?? 0);
      const available = Number(record.available_count ?? Math.max(0, capacity - booked));
      const status = record.status || 'AVAILABLE';

      return [
        cleanCell(slotId),
        cleanCell(date),
        cleanCell(startTime),
        cleanCell(endTime),
        capacity,
        booked,
        available,
        cleanCell(status),
        cleanCell(record.updated_at || now),
      ];
    }

    case 'Sync Logs': {
      const syncId = record.sync_id || record.id || '';
      const entityType = record.entity_type || '';
      const entityId = record.entity_id || '';
      const operation = record.operation || 'CREATE';
      const status = record.status || 'PENDING';
      const attemptCount = Number(record.attempt_count ?? 1);
      const errMsg = record.error_message || '';
      const lastAttempt = record.last_attempt_at || record.last_attempt || now;
      const syncedAt = status === 'SUCCESS' ? (record.synced_at || now) : '';

      return [
        cleanCell(syncId),
        cleanCell(entityType),
        cleanCell(entityId),
        cleanCell(operation),
        cleanCell(status),
        attemptCount,
        cleanCell(errMsg),
        cleanCell(lastAttempt),
        cleanCell(syncedAt),
        cleanCell(record.created_at || now),
        cleanCell(record.updated_at || now),
      ];
    }

    default:
      return Object.values(record).map((v) => cleanCell(v));
  }
}

/**
 * Returns the primary key column index for duplicate identification.
 * In all 9 tabs:
 * Column 0 is the primary unique ID:
 * - Users: User ID (Col 0), plus Mobile Number (Col 2)
 * - Patients: Patient ID (Col 0)
 * - Bookings: Booking ID (Col 0)
 * - Home Collection: Booking ID (Col 0)
 * - Leads: Lead ID (Col 0)
 * - Tests: Test ID (Col 0)
 * - Packages: Package ID (Col 0)
 * - Time Slots: Slot ID (Col 0)
 * - Sync Logs: Sync ID (Col 0)
 */
export function getPrimaryKeyIndices(rawTab: WorksheetTabName): {
  primaryColIndex: number;
  secondaryColIndex?: number;
} {
  const tab = normalizeTabName(rawTab);
  if (tab === 'Users') {
    return { primaryColIndex: 0, secondaryColIndex: 2 }; // User ID (0), Mobile Number (2)
  }
  return { primaryColIndex: 0 };
}

/**
 * Extract the primary ID string from a record for lookup.
 */
export function getRecordUniqueId(rawTab: WorksheetTabName, record: Record<string, any>): string {
  const tab = normalizeTabName(rawTab);
  switch (tab) {
    case 'Users':
      return String(record.userId || record.user_id || record.id || '').trim();
    case 'Patients':
      return String(record.patientId || record.patient_id || record.id || '').trim();
    case 'Bookings':
    case 'Home Collection':
      return String(record.bookingId || record.booking_id || record.booking_number || record.id || '').trim();
    case 'Leads':
      return String(record.leadId || record.lead_id || record.id || '').trim();
    case 'Tests':
      return String(record.testId || record.test_id || record.id || '').trim();
    case 'Packages':
      return String(record.packageId || record.package_id || record.id || '').trim();
    case 'Time Slots':
      return String(record.slotId || record.slot_id || record.id || '').trim();
    case 'Sync Logs':
      return String(record.syncId || record.sync_id || record.id || '').trim();
    default:
      return String(record.id || '').trim();
  }
}
