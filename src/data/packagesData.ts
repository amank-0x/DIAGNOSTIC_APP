import { HealthPackage } from '../types/packages';

/**
 * INITIAL PACKAGES DATA:
 * Contains confirmed B.L. Diagnostic packages (PKG01, PKG02, PKG03)
 * AND the imported poster packages (Swasth Fit Super-1 to Super-4) marked with:
 * needs_review: true, review_reason: "Supplied poster branding references another center and phone number; pending confirmation"
 * strictly avoiding attributing foreign branding/phones to B.L. Diagnostic Center.
 */
export const INITIAL_PACKAGES_DATA: HealthPackage[] = [
  // Confirmed B.L. Diagnostic Center Packages
  {
    package_id: 'BLD-PKG01',
    package_name: 'Basic Health Checkup Package',
    description: 'Essential preventive profile covering blood counts, glucose metabolism, renal filtration, and urinary parameters.',
    price: 850,
    is_active: true,
    needs_review: false,
    fasting_required: true,
    fasting_hours: 10,
    turnaround_time: 'Same Day',
    items: [
      { item_id: 'item-01', test_id: 'BLD-T001', test_name: 'Complete Blood Count (CBC) with ESR', category: 'Hematology' },
      { item_id: 'item-02', test_id: 'BLD-T006', test_name: 'Blood Sugar Fasting (FBS)', category: 'Biochemistry' },
      { item_id: 'item-03', test_id: 'BLD-T014', test_name: 'Urine Routine & Microscopic Examination', category: 'Clinical Pathology' },
      { item_id: 'item-04', test_id: 'BLD-T010', test_name: 'Serum Creatinine', category: 'Biochemistry' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-09-28T00:00:00.000Z'
  },
  {
    package_id: 'BLD-PKG02',
    package_name: 'Comprehensive Health Package',
    description: 'Comprehensive screening evaluation including complete blood counts, long-term glycemic control, liver and kidney metabolic panels, and lipid profile.',
    price: 1800,
    is_active: true,
    needs_review: false,
    fasting_required: true,
    fasting_hours: 12,
    turnaround_time: 'Same Day',
    items: [
      { item_id: 'item-05', test_id: 'BLD-T001', test_name: 'Complete Blood Count (CBC) with ESR', category: 'Hematology' },
      { item_id: 'item-06', test_id: 'BLD-T006', test_name: 'Blood Sugar Fasting (FBS)', category: 'Biochemistry' },
      { item_id: 'item-07', test_id: 'BLD-T008', test_name: 'HbA1c (Glycated Hemoglobin)', category: 'Biochemistry' },
      { item_id: 'item-08', test_id: 'BLD-T009', test_name: 'Liver Function Test (LFT - 11 Parameters)', category: 'Biochemistry' },
      { item_id: 'item-09', test_id: 'BLD-T010', test_name: 'Kidney Function Test (KFT - 8 Parameters)', category: 'Biochemistry' },
      { item_id: 'item-10', test_id: 'BLD-T011', test_name: 'Lipid Profile (Cholesterol & Triglycerides)', category: 'Biochemistry' },
      { item_id: 'item-11', test_id: 'BLD-T014', test_name: 'Urine Routine & Microscopic Examination', category: 'Clinical Pathology' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-09-28T00:00:00.000Z'
  },
  {
    package_id: 'BLD-PKG03',
    package_name: 'Senior Citizen Health Package',
    description: 'Specialized profile for age 50+: cardiovascular, endocrine, electrolyte, bone, and metabolic organ wellness evaluation.',
    price: 2400,
    is_active: true,
    needs_review: false,
    fasting_required: true,
    fasting_hours: 12,
    turnaround_time: 'Same Day',
    items: [
      { item_id: 'item-12', test_id: 'BLD-T001', test_name: 'Complete Blood Count (CBC) with ESR', category: 'Hematology' },
      { item_id: 'item-13', test_id: 'BLD-T006', test_name: 'Blood Sugar Fasting (FBS)', category: 'Biochemistry' },
      { item_id: 'item-14', test_id: 'BLD-T008', test_name: 'HbA1c', category: 'Biochemistry' },
      { item_id: 'item-15', test_id: 'BLD-T009', test_name: 'Liver Function Test (LFT)', category: 'Biochemistry' },
      { item_id: 'item-16', test_id: 'BLD-T010', test_name: 'Kidney Function Test with Electrolytes', category: 'Biochemistry' },
      { item_id: 'item-17', test_id: 'BLD-T011', test_name: 'Lipid Profile', category: 'Biochemistry' },
      { item_id: 'item-18', test_id: 'BLD-T021', test_name: 'Thyroid Stimulating Hormone (TSH)', category: 'Thyroid & Hormones' },
      { item_id: 'item-19', test_id: 'BLD-T013', test_name: 'Serum Calcium', category: 'Biochemistry' },
      { item_id: 'item-20', test_id: 'BLD-T012', test_name: 'Serum Uric Acid', category: 'Biochemistry' },
      { item_id: 'item-21', test_id: 'BLD-T014', test_name: 'Urine Routine & Microscopic', category: 'Clinical Pathology' }
    ],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-09-28T00:00:00.000Z'
  },

  // POSTER REFERENCE PACKAGES (Swasth Fit Super-1 to Super-4)
  // MARKED STRICTLY AS REVIEW REQUIRED (Branding & phone on poster belong to another entity)
  {
    package_id: 'PST-SFS01',
    package_name: 'Swasth Fit Super-1',
    description: 'Preventive screening profile extracted from poster reference.',
    price: 999,
    is_active: false, // Default inactive pending review
    needs_review: true,
    review_reason: 'REVIEW REQUIRED: Poster branding appears to reference another diagnostic center and phone number; pending B.L. Diagnostic confirmation.',
    source_notes: 'Imported from reference poster image.',
    fasting_required: true,
    fasting_hours: 10,
    turnaround_time: '24 Hours',
    items: [
      { item_id: 'p-01', test_name: 'Complete Hemogram (CBC, ESR)', test_id: 'BLD-T001', category: 'Hematology' },
      { item_id: 'p-02', test_name: 'Blood Sugar Fasting (FBS)', test_id: 'BLD-T006', category: 'Biochemistry' },
      { item_id: 'p-03', test_name: 'Lipid Screen (Cholesterol, Triglycerides)', category: 'Biochemistry' },
      { item_id: 'p-04', test_name: 'Kidney Screen (Urea, Creatinine)', category: 'Biochemistry' },
      { item_id: 'p-05', test_name: 'Urine Routine Examination', test_id: 'BLD-T014', category: 'Clinical Pathology' }
    ],
    created_at: '2026-09-28T00:00:00.000Z',
    updated_at: '2026-09-28T00:00:00.000Z'
  },
  {
    package_id: 'PST-SFS02',
    package_name: 'Swasth Fit Super-2',
    description: 'Expanded metabolic and organ screening profile extracted from poster reference.',
    price: 1499,
    is_active: false,
    needs_review: true,
    review_reason: 'REVIEW REQUIRED: Poster branding appears to reference another diagnostic center and phone number; pending B.L. Diagnostic confirmation.',
    source_notes: 'Imported from reference poster image.',
    fasting_required: true,
    fasting_hours: 10,
    turnaround_time: '24 Hours',
    items: [
      { item_id: 'p-06', test_name: 'Complete Hemogram (CBC, ESR)', test_id: 'BLD-T001', category: 'Hematology' },
      { item_id: 'p-07', test_name: 'Blood Sugar Fasting & HbA1c', category: 'Biochemistry' },
      { item_id: 'p-08', test_name: 'Liver Function Test (LFT Complete)', test_id: 'BLD-T009', category: 'Biochemistry' },
      { item_id: 'p-09', test_name: 'Kidney Function Test (KFT Complete)', test_id: 'BLD-T010', category: 'Biochemistry' },
      { item_id: 'p-10', test_name: 'Lipid Profile Comprehensive', test_id: 'BLD-T011', category: 'Biochemistry' },
      { item_id: 'p-11', test_name: 'Thyroid Stimulating Hormone (TSH)', test_id: 'BLD-T021', category: 'Thyroid & Hormones' },
      { item_id: 'p-12', test_name: 'Urine Routine Examination', test_id: 'BLD-T014', category: 'Clinical Pathology' }
    ],
    created_at: '2026-09-28T00:00:00.000Z',
    updated_at: '2026-09-28T00:00:00.000Z'
  },
  {
    package_id: 'PST-SFS03',
    package_name: 'Swasth Fit Super-3',
    description: 'Advanced wellness profile including vitamin and hormonal parameters extracted from poster reference.',
    price: 2199,
    is_active: false,
    needs_review: true,
    review_reason: 'REVIEW REQUIRED: Poster branding appears to reference another diagnostic center and phone number; pending B.L. Diagnostic confirmation.',
    source_notes: 'Imported from reference poster image.',
    fasting_required: true,
    fasting_hours: 12,
    turnaround_time: '24 Hours',
    items: [
      { item_id: 'p-13', test_name: 'Complete Blood Count (CBC, ESR)', test_id: 'BLD-T001', category: 'Hematology' },
      { item_id: 'p-14', test_name: 'Diabetic Screen (FBS, HbA1c)', category: 'Biochemistry' },
      { item_id: 'p-15', test_name: 'Liver Function Test Complete', test_id: 'BLD-T009', category: 'Biochemistry' },
      { item_id: 'p-16', test_name: 'Kidney Function Test Complete', test_id: 'BLD-T010', category: 'Biochemistry' },
      { item_id: 'p-17', test_name: 'Lipid Profile Complete', test_id: 'BLD-T011', category: 'Biochemistry' },
      { item_id: 'p-18', test_name: 'Thyroid Profile Total (T3, T4, TSH)', test_id: 'BLD-T022', category: 'Thyroid & Hormones' },
      { item_id: 'p-19', test_name: 'Vitamin D (25-OH)', test_id: 'BLD-T023', category: 'Thyroid & Hormones' },
      { item_id: 'p-20', test_name: 'Urine Routine & Microscopic', test_id: 'BLD-T014', category: 'Clinical Pathology' }
    ],
    created_at: '2026-09-28T00:00:00.000Z',
    updated_at: '2026-09-28T00:00:00.000Z'
  },
  {
    package_id: 'PST-SFS04',
    package_name: 'Swasth Fit Super-4',
    description: 'Comprehensive executive profile with vitamins and cardiac/inflammatory risk markers extracted from poster reference.',
    price: 2999,
    is_active: false,
    needs_review: true,
    review_reason: 'REVIEW REQUIRED: Poster branding appears to reference another diagnostic center and phone number; pending B.L. Diagnostic confirmation.',
    source_notes: 'Imported from reference poster image.',
    fasting_required: true,
    fasting_hours: 12,
    turnaround_time: '24-48 Hours',
    items: [
      { item_id: 'p-21', test_name: 'Complete Blood Count (CBC, ESR)', test_id: 'BLD-T001', category: 'Hematology' },
      { item_id: 'p-22', test_name: 'Diabetic Screen (FBS, HbA1c)', category: 'Biochemistry' },
      { item_id: 'p-23', test_name: 'Liver Function Test Complete', test_id: 'BLD-T009', category: 'Biochemistry' },
      { item_id: 'p-24', test_name: 'Kidney Function Test Complete', test_id: 'BLD-T010', category: 'Biochemistry' },
      { item_id: 'p-25', test_name: 'Lipid Profile Complete', test_id: 'BLD-T011', category: 'Biochemistry' },
      { item_id: 'p-26', test_name: 'Thyroid Profile Total (T3, T4, TSH)', test_id: 'BLD-T022', category: 'Thyroid & Hormones' },
      { item_id: 'p-27', test_name: 'Vitamin D (25-OH)', test_id: 'BLD-T023', category: 'Thyroid & Hormones' },
      { item_id: 'p-28', test_name: 'Vitamin B12', test_id: 'BLD-T024', category: 'Thyroid & Hormones' },
      { item_id: 'p-29', test_name: 'Serum Electrolytes (Na, K, Cl)', category: 'Biochemistry' },
      { item_id: 'p-30', test_name: 'Serum Calcium & Uric Acid', category: 'Biochemistry' },
      { item_id: 'p-31', test_name: 'Urine Routine & Microscopic', test_id: 'BLD-T014', category: 'Clinical Pathology' }
    ],
    created_at: '2026-09-28T00:00:00.000Z',
    updated_at: '2026-09-28T00:00:00.000Z'
  }
];
