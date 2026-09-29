import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  DocumentData, 
  QueryDocumentSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RateRecord, PaginationParams, PaginatedResult, ImportValidationReport } from '../types/catalogue';
import { INITIAL_RATE_LIST_RECORDS } from '../data/rateListRecords';

const CATALOGUE_COLLECTION = 'test_catalogue';

/**
 * Initializes the database catalogue with the structured rate list if empty
 */
export async function initializeCatalogueDatabase(): Promise<void> {
  try {
    const snap = await getDocs(query(collection(db, CATALOGUE_COLLECTION), limit(1)));
    if (snap.empty) {
      console.log('Seeding RateRecord collection in database...');
      const batch = writeBatch(db);
      for (const record of INITIAL_RATE_LIST_RECORDS) {
        const ref = doc(db, CATALOGUE_COLLECTION, record.test_id);
        batch.set(ref, record);
      }
      await batch.commit();
      console.log('Catalogue seed complete.');
    }
  } catch (error) {
    console.warn('Catalogue database initialize notice:', error);
  }
}

/**
 * Fetch a single test by ID directly from the database
 */
export async function getTestByIdFromDB(testId: string): Promise<RateRecord | null> {
  try {
    const docRef = doc(db, CATALOGUE_COLLECTION, testId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as RateRecord;
    }

    // Secondary fallback search by matching test_id in INITIAL_RATE_LIST_RECORDS
    const local = INITIAL_RATE_LIST_RECORDS.find(r => r.test_id === testId);
    return local || null;
  } catch (err) {
    console.error('Error fetching test by ID:', err);
    return INITIAL_RATE_LIST_RECORDS.find(r => r.test_id === testId) || null;
  }
}

/**
 * Server-side style database query with pagination, category filter, method filter, and sorting.
 */
export async function queryTestsPaginated(params: PaginationParams): Promise<PaginatedResult<RateRecord>> {
  const {
    page = 1,
    pageSize = 9,
    search = '',
    category,
    method,
    sortBy = 'name',
    activeOnly = true
  } = params;

  try {
    // Read from DB
    const qSnapshot = await getDocs(collection(db, CATALOGUE_COLLECTION));
    let allRecords: RateRecord[] = [];

    if (!qSnapshot.empty) {
      qSnapshot.forEach(docSnap => {
        allRecords.push(docSnap.data() as RateRecord);
      });
    } else {
      allRecords = [...INITIAL_RATE_LIST_RECORDS];
    }

    // Apply active filter
    if (activeOnly) {
      allRecords = allRecords.filter(r => r.is_active);
    }

    // Category filter
    if (category && category !== 'All') {
      allRecords = allRecords.filter(r => r.category === category);
    }

    // Method filter
    if (method && method !== 'All') {
      allRecords = allRecords.filter(r => r.method && r.method.toLowerCase().includes(method.toLowerCase()));
    }

    // Search query filter (search across test_name, test_id, clinical_information, method)
    if (search.trim()) {
      const q = search.toLowerCase();
      allRecords = allRecords.filter(r => 
        r.test_name.toLowerCase().includes(q) ||
        r.test_id.toLowerCase().includes(q) ||
        (r.category && r.category.toLowerCase().includes(q)) ||
        (r.clinical_information && r.clinical_information.toLowerCase().includes(q)) ||
        (r.method && r.method.toLowerCase().includes(q))
      );
    }

    // Sorting
    allRecords.sort((a, b) => {
      if (sortBy === 'price_asc') {
        return (a.general_price ?? 0) - (b.general_price ?? 0);
      }
      if (sortBy === 'price_desc') {
        return (b.general_price ?? 0) - (a.general_price ?? 0);
      }
      if (sortBy === 'reporting_time') {
        return (a.reporting_time || '').localeCompare(b.reporting_time || '');
      }
      // default: name
      return a.test_name.localeCompare(b.test_name);
    });

    const total = allRecords.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = allRecords.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.warn('Database query fallback to initial records:', error);
    // Fallback in case of network issue
    const filtered = INITIAL_RATE_LIST_RECORDS.filter(r => {
      if (activeOnly && !r.is_active) return false;
      if (category && category !== 'All' && r.category !== category) return false;
      if (search && !r.test_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize) || 1,
    };
  }
}

/**
 * Fetch distinct categories and methods from the database
 */
export async function getCatalogueFilters(): Promise<{ categories: string[]; methods: string[] }> {
  try {
    const qSnapshot = await getDocs(collection(db, CATALOGUE_COLLECTION));
    const categoriesSet = new Set<string>();
    const methodsSet = new Set<string>();

    const source = qSnapshot.empty ? INITIAL_RATE_LIST_RECORDS : qSnapshot.docs.map(d => d.data() as RateRecord);

    source.forEach(r => {
      if (r.category) categoriesSet.add(r.category);
      if (r.method) {
        // extract primary method keyword
        const primary = r.method.split('/')[0].split('(')[0].trim();
        if (primary && primary.length > 2) methodsSet.add(primary);
      }
    });

    return {
      categories: Array.from(categoriesSet).sort(),
      methods: Array.from(methodsSet).sort(),
    };
  } catch (e) {
    return {
      categories: ['Hematology', 'Biochemistry', 'Clinical Pathology', 'Serology & Immunology', 'Thyroid & Hormones', 'Preventive Health Packages'],
      methods: ['Automated', 'Spectrophotometric', 'HPLC', 'CLIA', 'Agglutination', 'Microscopy'],
    };
  }
}

/**
 * Import and Validation Engine
 * SOURCE -> EXTRACT -> STRUCTURE -> VALIDATE -> DUPLICATE CHECK -> PREVIEW -> APPROVE -> IMPORT -> VERIFY
 */
export function validateImportRecords(rawInput: any[]): ImportValidationReport {
  const duplicateCounts = new Map<string, number>();
  const duplicateNames: { name: string; occurrences: number }[] = [];
  const missingPrices: { test_id: string; test_name: string }[] = [];
  const malformedRecords: { row: number; reason: string; data: any }[] = [];
  const conflictingValues: { test_name: string; conflict: string }[] = [];
  const unclearRecords: { test_name: string; reason: string }[] = [];
  const recordsToImport: RateRecord[] = [];
  let missingNames = 0;

  rawInput.forEach((item, index) => {
    const rowNum = index + 1;

    // Check row format
    if (!item || typeof item !== 'object') {
      malformedRecords.push({ row: rowNum, reason: 'Record is not an object or row is empty', data: item });
      return;
    }

    const name = item.test_name || item.name || item['Test Name'] || item['TEST NAME'];
    if (!name || typeof name !== 'string' || !name.trim()) {
      missingNames++;
      malformedRecords.push({ row: rowNum, reason: 'Missing or empty test name', data: item });
      return;
    }

    const cleanName = name.trim();

    // Duplicate Check
    const count = (duplicateCounts.get(cleanName.toLowerCase()) || 0) + 1;
    duplicateCounts.set(cleanName.toLowerCase(), count);

    // Price Check
    const rawPrice = item.general_price ?? item.price ?? item['Rate'] ?? item['General Price'];
    const parsedPrice = rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice)) ? Number(rawPrice) : null;
    const testId = item.test_id || item.code || `BLD-T${String(100 + rowNum).padStart(3, '0')}`;

    if (parsedPrice === null) {
      missingPrices.push({ test_id: testId, test_name: cleanName });
    }

    // Corporate price
    const rawCorpPrice = item.corporate_price ?? item['Corporate Rate'] ?? null;
    const corporatePrice = rawCorpPrice !== null && !isNaN(Number(rawCorpPrice)) ? Number(rawCorpPrice) : null;

    // Conflicting / Unclear Values check
    if (corporatePrice !== null && parsedPrice !== null && corporatePrice > parsedPrice) {
      conflictingValues.push({
        test_name: cleanName,
        conflict: `Corporate price (₹${corporatePrice}) exceeds general price (₹${parsedPrice})`
      });
    }

    const category = item.category || item['Category'] || 'Clinical Pathology';
    const method = item.method || item['Method'] || null;
    const sample = item.sample || item['Sample'] || item.sampleType || null;
    const sampleInstructions = item.sample_instructions || item['Instructions'] || null;
    const clinicalInfo = item.clinical_information || item['Description'] || item.description || null;
    const reportingTime = item.reporting_time || item['Turnaround Time'] || item.turnaroundTime || null;
    const isActive = item.is_active !== undefined ? Boolean(item.is_active) : true;

    // Check if review required
    let needsReview = false;
    let reviewReason: string | undefined;

    if (!category || category === '[REVIEW REQUIRED]') {
      needsReview = true;
      reviewReason = 'Category classification unconfirmed';
      unclearRecords.push({ test_name: cleanName, reason: reviewReason });
    } else if (parsedPrice === null) {
      needsReview = true;
      reviewReason = 'Missing verified rate in source document';
    }

    const structuredRecord: RateRecord = {
      test_id: testId,
      test_name: cleanName,
      category,
      method,
      sample,
      sample_instructions: sampleInstructions,
      clinical_information: clinicalInfo,
      reporting_time: reportingTime,
      general_price: parsedPrice,
      corporate_price: corporatePrice,
      is_active: isActive,
      needs_review: needsReview,
      review_reason: reviewReason,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    recordsToImport.push(structuredRecord);
  });

  // Collect duplicate records
  duplicateCounts.forEach((occurrences, key) => {
    if (occurrences > 1) {
      const match = recordsToImport.find(r => r.test_name.toLowerCase() === key);
      duplicateNames.push({ name: match?.test_name || key, occurrences });
    }
  });

  return {
    totalRecords: rawInput.length,
    validRecords: recordsToImport.length,
    duplicateNames,
    missingNames,
    missingPrices,
    malformedRecords,
    conflictingValues,
    unclearRecords,
    recordsToImport
  };
}

/**
 * Execute batch import into the database
 */
export async function executeDatabaseImport(records: RateRecord[]): Promise<number> {
  const batch = writeBatch(db);
  let count = 0;

  for (const record of records) {
    const docRef = doc(db, CATALOGUE_COLLECTION, record.test_id);
    batch.set(docRef, record, { merge: true });
    count++;
  }

  await batch.commit();
  return count;
}
