import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PatientRecord } from '../types/bookingSystem';
import { syncEntityToGoogleSheets } from './sheetsService';

const PATIENTS_COLLECTION = 'patients';

/**
 * Fetch all patients for authenticated user (IDOR Protected: checks user_id)
 */
export async function getPatientsForUser(userId: string): Promise<PatientRecord[]> {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, PATIENTS_COLLECTION),
      where('user_id', '==', userId)
    );
    const snap = await getDocs(q);
    const list: PatientRecord[] = [];
    snap.forEach(d => list.push(d.data() as PatientRecord));
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.error('Error fetching patients for user:', err);
    return [];
  }
}

/**
 * Fetch single patient with IDOR ownership check
 */
export async function getPatientById(patientId: string, userId: string): Promise<PatientRecord | null> {
  try {
    const docRef = doc(db, PATIENTS_COLLECTION, patientId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() as PatientRecord;
    // IDOR verification
    if (data.user_id !== userId) {
      throw new Error('Unauthorized access: patient does not belong to user.');
    }
    return data;
  } catch (err) {
    console.error('Error fetching patient by ID:', err);
    return null;
  }
}

/**
 * Add patient under user account
 */
export async function createPatient(params: {
  user_id: string;
  full_name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  relation: 'Self' | 'Father' | 'Mother' | 'Spouse' | 'Child' | 'Other';
  phone?: string;
}): Promise<PatientRecord> {
  const patient_id = `PAT-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  // Clean, only required fields
  const record: PatientRecord = {
    patient_id,
    user_id: params.user_id,
    full_name: params.full_name.trim(),
    age: Math.max(1, Math.min(120, Number(params.age))),
    gender: params.gender,
    relation: params.relation,
    phone: params.phone?.trim() || undefined,
    is_active: true,
    created_at: now,
    updated_at: now
  };

  // 1. Primary DB Write
  await setDoc(doc(db, PATIENTS_COLLECTION, patient_id), record);

  // 2. Non-blocking Google Sheets Sync to Patients tab
  syncEntityToGoogleSheets({
    entityType: 'Patients',
    entityId: patient_id,
    operation: 'CREATE',
    record: {
      id: patient_id,
      user_id: record.user_id,
      patient_name: record.full_name,
      date_of_birth: `Age: ${record.age}`,
      gender: record.gender,
      phone: record.phone || '',
      status: 'ACTIVE',
      created_at: record.created_at,
      updated_at: record.updated_at
    }
  }).catch(() => {});

  return record;
}

/**
 * Update patient details (verifying ownership)
 */
export async function updatePatient(
  patientId: string,
  userId: string,
  updates: Partial<Pick<PatientRecord, 'full_name' | 'age' | 'gender' | 'relation' | 'phone' | 'address' | 'notes' | 'is_active'>>
): Promise<void> {
  const docRef = doc(db, PATIENTS_COLLECTION, patientId);
  const snap = await getDoc(docRef);
  if (!snap.exists() || snap.data()?.user_id !== userId) {
    throw new Error('Unauthorized: cannot edit patient that does not belong to you.');
  }

  const existing = snap.data() as PatientRecord;
  const now = new Date().toISOString();
  await updateDoc(docRef, {
    ...updates,
    updated_at: now
  });

  const merged: PatientRecord = { ...existing, ...updates, updated_at: now };
  syncEntityToGoogleSheets({
    entityType: 'Patients',
    entityId: patientId,
    operation: 'UPDATE',
    record: {
      id: patientId,
      user_id: merged.user_id,
      patient_name: merged.full_name,
      date_of_birth: `Age: ${merged.age}`,
      gender: merged.gender,
      phone: merged.phone || '',
      status: merged.is_active === false ? 'INACTIVE' : 'ACTIVE',
      created_at: merged.created_at,
      updated_at: now
    }
  }).catch(() => {});
}

/**
 * Deactivate or activate patient profile
 */
export async function togglePatientActive(patientId: string, userId: string, isActive: boolean): Promise<void> {
  await updatePatient(patientId, userId, { is_active: isActive });
}

export async function createPatientRecord(params: {
  userId: string;
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  relation: 'Self' | 'Father' | 'Mother' | 'Spouse' | 'Child' | 'Other';
  phone?: string;
  address?: string;
  notes?: string;
}): Promise<PatientRecord> {
  return createPatient({
    user_id: params.userId,
    full_name: params.fullName,
    age: params.age,
    gender: params.gender,
    relation: params.relation,
    phone: params.phone,
  });
}

export const updatePatientRecord = updatePatient;

export async function archivePatientRecord(patientId: string, userId: string): Promise<void> {
  await togglePatientActive(patientId, userId, false);
}

