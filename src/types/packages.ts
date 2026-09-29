export interface PackageItem {
  item_id: string; // generated ID or test reference
  test_id?: string; // reference to test_catalogue test_id if linked
  test_name: string; // name of included test or parameter
  category?: string;
  notes?: string;
}

export interface HealthPackage {
  package_id: string;
  package_name: string;
  description: string | null;
  price: number;
  is_active: boolean;
  needs_review: boolean;
  review_reason?: string;
  source_notes?: string; // Record where this data came from (e.g., poster reference)
  fasting_required: boolean;
  fasting_hours?: number;
  turnaround_time?: string;
  items: PackageItem[];
  created_at: string;
  updated_at: string;
}
