import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FamilyPatient, UserNotification } from '../types/auth';
import { syncEntityToGoogleSheets } from './sheetsService';

const PATIENTS_COLLECTION = 'patients';
const NOTIFICATIONS_COLLECTION = 'notifications';

export async function getPatientsForUser(userId: string): Promise<FamilyPatient[]> {
  try {
    const q = query(collection(db, PATIENTS_COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    const list: FamilyPatient[] = [];
    snap.forEach((d) => list.push(d.data() as FamilyPatient));
    return list;
  } catch (err) {
    console.error('Error fetching patients for user:', err);
    return [];
  }
}

export async function addPatientForUser(
  patient: Omit<FamilyPatient, 'id' | 'createdAt'>
): Promise<FamilyPatient> {
  const id = `PAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();
  const fullPatient: FamilyPatient = {
    ...patient,
    id,
    createdAt: now,
  };
  await setDoc(doc(db, PATIENTS_COLLECTION, id), fullPatient);

  syncEntityToGoogleSheets({
    entityType: 'Patients',
    entityId: id,
    operation: 'CREATE',
    record: {
      id,
      user_id: fullPatient.userId,
      patient_name: fullPatient.fullName,
      date_of_birth: `Age: ${fullPatient.age}`,
      gender: fullPatient.gender,
      phone: fullPatient.phone || '',
      relationship: fullPatient.relation,
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    },
  }).catch(() => {});

  return fullPatient;
}

export async function deletePatientForUser(patientId: string): Promise<void> {
  await deleteDoc(doc(db, PATIENTS_COLLECTION, patientId));
}

export async function getNotificationsForUser(userId: string): Promise<UserNotification[]> {
  try {
    const q = query(collection(db, NOTIFICATIONS_COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    const list: UserNotification[] = [];
    snap.forEach((d) => list.push(d.data() as UserNotification));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), { isRead: true });
}

export async function createUserNotification(
  notification: Omit<UserNotification, 'id' | 'createdAt' | 'isRead'>
): Promise<void> {
  const id = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();
  const record: UserNotification = {
    ...notification,
    id,
    isRead: false,
    createdAt: now,
  };
  await setDoc(doc(db, NOTIFICATIONS_COLLECTION, id), record);

  syncEntityToGoogleSheets({
    entityType: 'Notifications',
    entityId: id,
    operation: 'CREATE',
    record: {
      id,
      user_id: record.userId,
      type: record.type,
      title: record.title,
      message: record.message,
      read_status: 'UNREAD',
      created_at: now,
    },
  }).catch(() => {});
}
