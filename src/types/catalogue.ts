export interface RateRecord {
  test_id: string;
  test_name: string;
  category: string;
  method: string | null;
  sample: string | null;
  sample_instructions: string | null;
  clinical_information: string | null;
  reporting_time: string | null;
  general_price: number | null;
  corporate_price: number | null;
  is_active: boolean;
  needs_review?: boolean;
  review_reason?: string;
  created_at: string;
  updated_at: string;
}

// Validation report for the import mechanism
export interface ImportValidationReport {
  totalRecords: number;
  validRecords: number;
  duplicateNames: { name: string; occurrences: number }[];
  missingNames: number;
  missingPrices: { test_id: string; test_name: string }[];
  malformedRecords: { row: number; reason: string; data: any }[];
  conflictingValues: { test_name: string; conflict: string }[];
  unclearRecords: { test_name: string; reason: string }[];
  recordsToImport: RateRecord[];
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
  method?: string;
  sortBy?: 'name' | 'price_asc' | 'price_desc' | 'reporting_time';
  activeOnly?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
