import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { HealthPackage, PackageItem } from '../types/packages';
import { INITIAL_PACKAGES_DATA } from '../data/packagesData';

const PACKAGES_COLLECTION = 'packages';

/**
 * Initialize Packages collection in Firestore
 */
export async function initializePackagesDatabase(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, PACKAGES_COLLECTION));
    if (snap.empty) {
      console.log('Seeding initial Health Packages collection...');
      const batch = writeBatch(db);
      for (const pkg of INITIAL_PACKAGES_DATA) {
        const ref = doc(db, PACKAGES_COLLECTION, pkg.package_id);
        batch.set(ref, pkg);
      }
      await batch.commit();
      console.log('Packages collection initialized.');
    }
  } catch (err) {
    console.warn('Packages database initialization notice:', err);
  }
}

/**
 * Fetch all health packages (Admin view sees all; Public view can filter by is_active)
 */
export async function getAllPackagesFromDB(activeOnly = false): Promise<HealthPackage[]> {
  try {
    const snap = await getDocs(collection(db, PACKAGES_COLLECTION));
    if (!snap.empty) {
      let list: HealthPackage[] = [];
      snap.forEach(d => list.push(d.data() as HealthPackage));
      if (activeOnly) {
        list = list.filter(p => p.is_active);
      }
      return list;
    }
    // Fallback to local
    return activeOnly 
      ? INITIAL_PACKAGES_DATA.filter(p => p.is_active)
      : INITIAL_PACKAGES_DATA;
  } catch (err) {
    console.error('Error fetching packages:', err);
    return activeOnly 
      ? INITIAL_PACKAGES_DATA.filter(p => p.is_active)
      : INITIAL_PACKAGES_DATA;
  }
}

/**
 * Fetch single package by ID
 */
export async function getPackageByIdFromDB(packageId: string): Promise<HealthPackage | null> {
  try {
    const docRef = doc(db, PACKAGES_COLLECTION, packageId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as HealthPackage;
    }
    return INITIAL_PACKAGES_DATA.find(p => p.package_id === packageId) || null;
  } catch (err) {
    console.error('Error fetching package by ID:', err);
    return INITIAL_PACKAGES_DATA.find(p => p.package_id === packageId) || null;
  }
}

/**
 * Save / Update health package
 */
export async function saveHealthPackageToDB(pkg: HealthPackage): Promise<void> {
  const docRef = doc(db, PACKAGES_COLLECTION, pkg.package_id);
  const now = new Date().toISOString();
  await setDoc(docRef, {
    ...pkg,
    updated_at: now
  }, { merge: true });
}

/**
 * Toggle Active status
 */
export async function togglePackageActiveStatus(packageId: string, isActive: boolean): Promise<void> {
  const docRef = doc(db, PACKAGES_COLLECTION, packageId);
  const now = new Date().toISOString();
  await updateDoc(docRef, {
    is_active: isActive,
    updated_at: now
  });
}

/**
 * Delete package
 */
export async function deletePackageFromDB(packageId: string): Promise<void> {
  const docRef = doc(db, PACKAGES_COLLECTION, packageId);
  await deleteDoc(docRef);
}
