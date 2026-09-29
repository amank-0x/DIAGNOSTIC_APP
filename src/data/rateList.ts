import { DiagnosticTest } from '../types';

/**
 * SOURCE OF TRUTH: B.L. Diagnostic Center Rate List
 * No invented tests, no invented prices.
 */
export const OFFICIAL_RATE_LIST: DiagnosticTest[] = [
  // Hematology
  {
    id: 'cbc-01',
    name: 'Complete Blood Count (CBC) with ESR',
    category: 'Hematology',
    code: 'HEM001',
    price: 300,
    sampleType: 'Blood',
    fastingRequired: false,
    turnaroundTime: '4 - 6 Hours',
    description: 'Comprehensive evaluation of RBC, WBC, Platelets, Hemoglobin, Hematocrit and Erythrocyte Sedimentation Rate.'
  },
  {
    id: 'hb-02',
    name: 'Hemoglobin (Hb)',
    category: 'Hematology',
    code: 'HEM002',
    price: 100,
    sampleType: 'Blood',
    fastingRequired: false,
    turnaroundTime: '2 - 4 Hours',
    description: 'Measures the amount of hemoglobin in the blood to screen for anemia and oxygen transport capacity.'
  },
  {
    id: 'blood-group-03',
    name: 'Blood Grouping & Rh Typing',
    category: 'Hematology',
    code: 'HEM003',
    price: 150,
    sampleType: 'Blood',
    fastingRequired: false,
    turnaroundTime: '2 - 4 Hours',
    description: 'Identifies ABO blood group and Rh factor (positive or negative).'
  },
  {
    id: 'platelet-04',
    name: 'Platelet Count',
    category: 'Hematology',
    code: 'HEM004',
    price: 120,
    sampleType: 'Blood',
    fastingRequired: false,
    turnaroundTime: '2 - 4 Hours',
    description: 'Assessment of circulating blood platelets crucial for clotting mechanism and dengue evaluation.'
  },
  {
    id: 'esr-05',
    name: 'Erythrocyte Sedimentation Rate (ESR)',
    category: 'Hematology',
    code: 'HEM005',
    price: 100,
    sampleType: 'Blood',
    fastingRequired: false,
    turnaroundTime: '2 - 4 Hours',
    description: 'Nonspecific indicator of systemic inflammation, infection, or autoimmune activity.'
  },

  // Biochemistry & Metabolic
  {
    id: 'bld-sugar-f-06',
    name: 'Blood Sugar Fasting (FBS)',
    category: 'Biochemistry',
    code: 'BIO001',
    price: 80,
    sampleType: 'Blood',
    fastingRequired: true,
    fastingHours: 10,
    turnaroundTime: '3 - 5 Hours',
    description: 'Measures blood glucose levels after an overnight fast (8-10 hours) to detect diabetes or prediabetes.'
  },
  {
    id: 'bld-sugar-pp-07',
    name: 'Blood Sugar Post Prandial (PPBS)',
    category: 'Biochemistry',
    code: 'BIO002',
    price: 80,
    sampleType: 'Blood',
    fastingRequired: false,
    turnaroundTime: '3 - 5 Hours',
    description: 'Assesses blood glucose exactly 2 hours after a standard meal to evaluate glycemic response.'
  },
  {
    id: 'hba1c-08',
    name: 'HbA1c (Glycated Hemoglobin)',
    category: 'Biochemistry',
    code: 'BIO003',
    price: 400,
    sampleType: 'Blood',
    fastingRequired: false,
    turnaroundTime: 'Same Day',
    description: 'Reflects average blood sugar control over the past 2 to 3 months using standard HPLC methodology.'
  },
  {
    id: 'lft-09',
    name: 'Liver Function Test (LFT)',
    category: 'Biochemistry',
    code: 'BIO004',
    price: 650,
    sampleType: 'Serum',
    fastingRequired: true,
    fastingHours: 8,
    turnaroundTime: 'Same Day (6 hrs)',
    description: 'Includes Bilirubin Total/Direct/Indirect, SGOT/AST, SGPT/ALT, Alkaline Phosphatase, Total Protein, Albumin, Globulin & A:G Ratio.'
  },
  {
    id: 'kft-10',
    name: 'Kidney Function Test (KFT / RFT)',
    category: 'Biochemistry',
    code: 'BIO005',
    price: 650,
    sampleType: 'Serum',
    fastingRequired: true,
    fastingHours: 8,
    turnaroundTime: 'Same Day (6 hrs)',
    description: 'Includes Blood Urea, Serum Creatinine, Uric Acid, Blood Urea Nitrogen (BUN), and Electrolytes (Sodium, Potassium, Chloride).'
  },
  {
    id: 'lipid-11',
    name: 'Lipid Profile (Cholesterol Panel)',
    category: 'Biochemistry',
    code: 'BIO006',
    price: 550,
    sampleType: 'Serum',
    fastingRequired: true,
    fastingHours: 12,
    turnaroundTime: 'Same Day',
    description: 'Assesses cardiovascular risk: Total Cholesterol, HDL (Good), LDL (Bad), VLDL, and Triglycerides.'
  },
  {
    id: 'serum-uric-12',
    name: 'Serum Uric Acid',
    category: 'Biochemistry',
    code: 'BIO007',
    price: 150,
    sampleType: 'Serum',
    fastingRequired: false,
    turnaroundTime: '4 - 6 Hours',
    description: 'Diagnoses and monitors gout, hyperuricemia, and renal calculi risk.'
  },
  {
    id: 'serum-calcium-13',
    name: 'Serum Calcium',
    category: 'Biochemistry',
    code: 'BIO008',
    price: 180,
    sampleType: 'Serum',
    fastingRequired: false,
    turnaroundTime: '4 - 6 Hours',
    description: 'Evaluates bone metabolism, parathyroid function, and renal status.'
  },

  // Clinical Pathology
  {
    id: 'urine-re-14',
    name: 'Urine Routine & Microscopic Examination (Urine R/M)',
    category: 'Clinical Pathology',
    code: 'CP001',
    price: 150,
    sampleType: 'Urine',
    fastingRequired: false,
    turnaroundTime: '3 - 5 Hours',
    description: 'Physical, chemical, and microscopic analysis for detecting urinary tract infections (UTI), kidney disorders, and proteinuria.'
  },
  {
    id: 'stool-re-15',
    name: 'Stool Routine & Occult Blood',
    category: 'Clinical Pathology',
    code: 'CP002',
    price: 180,
    sampleType: 'Stool',
    fastingRequired: false,
    turnaroundTime: 'Same Day',
    description: 'Detects gastrointestinal parasites, intestinal infections, ova, cysts, and occult bleeding.'
  },

  // Serology & Immunology
  {
    id: 'widal-16',
    name: 'Widal Slide / Tube Agglutination Test (Typhoid)',
    category: 'Serology & Immunology',
    code: 'SER001',
    price: 180,
    sampleType: 'Serum',
    fastingRequired: false,
    turnaroundTime: '3 - 5 Hours',
    description: 'Diagnostic serological test for enteric/typhoid fever (Salmonella Typhi & Paratyphi).'
  },
  {
    id: 'dengue-ns1-17',
    name: 'Dengue NS1 Antigen & Antibody (IgG/IgM)',
    category: 'Serology & Immunology',
    code: 'SER002',
    price: 700,
    sampleType: 'Serum',
    fastingRequired: false,
    turnaroundTime: '3 - 4 Hours',
    description: 'Rapid confirmation for acute and early phase Dengue virus infection along with serological antibodies.'
  },
  {
    id: 'crp-18',
    name: 'C-Reactive Protein (CRP) Quantitative',
    category: 'Serology & Immunology',
    code: 'SER003',
    price: 350,
    sampleType: 'Serum',
    fastingRequired: false,
    turnaroundTime: '4 - 6 Hours',
    description: 'High sensitivity acute marker for inflammatory conditions and bacterial infections.'
  },
  {
    id: 'ra-factor-19',
    name: 'Rheumatoid Arthritis Factor (RA Factor)',
    category: 'Serology & Immunology',
    code: 'SER004',
    price: 300,
    sampleType: 'Serum',
    fastingRequired: false,
    turnaroundTime: 'Same Day',
    description: 'Evaluation of autoantibodies for rheumatoid arthritis and related collagen disorders.'
  },
  {
    id: 'vdrl-20',
    name: 'VDRL / RPR (Syphilis Screening)',
    category: 'Serology & Immunology',
    code: 'SER005',
    price: 150,
    sampleType: 'Serum',
    fastingRequired: false,
    turnaroundTime: 'Same Day',
    description: 'Serological test used as screening for treponemal infections.'
  },

  // Thyroid & Hormones
  {
    id: 'tsh-21',
    name: 'Thyroid Stimulating Hormone (TSH Ultrasensitive)',
    category: 'Thyroid & Hormones',
    code: 'HOR001',
    price: 200,
    sampleType: 'Serum',
    fastingRequired: true,
    fastingHours: 8,
    turnaroundTime: 'Same Day',
    description: 'Primary screening test for hypothyroidism and hyperthyroidism.'
  },
  {
    id: 'thyroid-profile-22',
    name: 'Thyroid Profile Total (T3, T4, TSH)',
    category: 'Thyroid & Hormones',
    code: 'HOR002',
    price: 450,
    sampleType: 'Serum',
    fastingRequired: true,
    fastingHours: 8,
    turnaroundTime: 'Same Day',
    description: 'Comprehensive hormonal panel assessing total Triiodothyronine (T3), Thyroxine (T4), and TSH levels.'
  },
  {
    id: 'vit-d-23',
    name: 'Vitamin D (25-OH Cholecalciferol)',
    category: 'Thyroid & Hormones',
    code: 'HOR003',
    price: 900,
    sampleType: 'Serum',
    fastingRequired: false,
    turnaroundTime: '24 Hours',
    description: 'Measurement of circulating Vitamin D status essential for bone health, immune function, and calcium balance.'
  },
  {
    id: 'vit-b12-24',
    name: 'Vitamin B12 (Cyanocobalamin)',
    category: 'Thyroid & Hormones',
    code: 'HOR004',
    price: 750,
    sampleType: 'Serum',
    fastingRequired: true,
    fastingHours: 8,
    turnaroundTime: 'Same Day',
    description: 'Measures Vitamin B12 levels essential for nerve function, neurological health, and red blood cell production.'
  },

  // Preventive Health Packages
  {
    id: 'basic-health-pkg-25',
    name: 'Basic Health Checkup Package',
    category: 'Preventive Health Packages',
    code: 'PKG001',
    price: 850,
    sampleType: 'Blood',
    fastingRequired: true,
    fastingHours: 10,
    turnaroundTime: 'Same Day',
    description: 'Includes CBC with ESR, Fasting Blood Sugar, Urine Routine, and Serum Creatinine.'
  },
  {
    id: 'complete-health-pkg-26',
    name: 'Comprehensive Health Package',
    category: 'Preventive Health Packages',
    code: 'PKG002',
    price: 1800,
    sampleType: 'Blood',
    fastingRequired: true,
    fastingHours: 12,
    turnaroundTime: 'Same Day',
    description: 'Includes CBC with ESR, Fasting Blood Sugar, HbA1c, Liver Function Test (LFT), Kidney Function Test (KFT), Lipid Profile, and Urine R/M.'
  },
  {
    id: 'senior-citizen-pkg-27',
    name: 'Senior Citizen Health Package',
    category: 'Preventive Health Packages',
    code: 'PKG003',
    price: 2400,
    sampleType: 'Blood',
    fastingRequired: true,
    fastingHours: 12,
    turnaroundTime: 'Same Day',
    description: 'Tailored for age 50+: CBC, Fasting Sugar, HbA1c, LFT, KFT with Electrolytes, Lipid Profile, TSH, Serum Calcium, Uric Acid & Urine R/M.'
  }
];

export const CATEGORIES = [
  'All Tests',
  'Hematology',
  'Biochemistry',
  'Clinical Pathology',
  'Serology & Immunology',
  'Thyroid & Hormones',
  'Preventive Health Packages'
] as const;

export const TIME_SLOTS = [
  '07:00 AM - 08:00 AM (Fasting Recommended)',
  '08:00 AM - 09:00 AM (Fasting Recommended)',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 02:00 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
  '06:00 PM - 07:30 PM'
];
