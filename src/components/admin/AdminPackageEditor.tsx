import React, { useState, useEffect } from 'react';
import { HealthPackage, PackageItem } from '../../types/packages';
import { 
  getAllPackagesFromDB, 
  saveHealthPackageToDB, 
  togglePackageActiveStatus, 
  deletePackageFromDB 
} from '../../services/packageService';
import { INITIAL_RATE_LIST_RECORDS } from '../../data/rateListRecords';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  Eye, 
  Power, 
  Sparkles,
  RefreshCw,
  Search,
  HelpCircle
} from 'lucide-react';
import { Button, Badge } from '../ui/DesignSystem';

export const AdminPackageEditor: React.FC = () => {
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [previewPackage, setPreviewPackage] = useState<HealthPackage | null>(null);

  // Form State
  const [packageId, setPackageId] = useState('');
  const [packageName, setPackageName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(1000);
  const [isActive, setIsActive] = useState(true);
  const [needsReview, setNeedsReview] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [fastingRequired, setFastingRequired] = useState(true);
  const [fastingHours, setFastingHours] = useState<number>(10);
  const [turnaroundTime, setTurnaroundTime] = useState('Same Day');
  const [items, setItems] = useState<PackageItem[]>([]);

  // Item addition state
  const [testSearch, setTestSearch] = useState('');
  const [manualItemName, setManualItemName] = useState('');

  const loadPackages = async () => {
    setLoading(true);
    const list = await getAllPackagesFromDB(false);
    setPackages(list);
    setLoading(false);
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleStartCreate = () => {
    const newId = `BLD-PKG${String(packages.length + 1).padStart(2, '0')}`;
    setPackageId(newId);
    setPackageName('');
    setDescription('');
    setPrice(999);
    setIsActive(true);
    setNeedsReview(false);
    setReviewReason('');
    setFastingRequired(true);
    setFastingHours(10);
    setTurnaroundTime('Same Day');
    setItems([]);
    setIsEditing(true);
  };

  const handleStartEdit = (pkg: HealthPackage) => {
    setPackageId(pkg.package_id);
    setPackageName(pkg.package_name);
    setDescription(pkg.description || '');
    setPrice(pkg.price);
    setIsActive(pkg.is_active);
    setNeedsReview(pkg.needs_review);
    setReviewReason(pkg.review_reason || '');
    setFastingRequired(pkg.fasting_required);
    setFastingHours(pkg.fasting_hours || 10);
    setTurnaroundTime(pkg.turnaround_time || 'Same Day');
    setItems([...pkg.items]);
    setIsEditing(true);
  };

  const handleToggleStatus = async (pkg: HealthPackage) => {
    await togglePackageActiveStatus(pkg.package_id, !pkg.is_active);
    await loadPackages();
  };

  const handleDelete = async (pkgId: string) => {
    if (confirm(`Are you sure you want to delete package ${pkgId}?`)) {
      await deletePackageFromDB(pkgId);
      await loadPackages();
    }
  };

  const handleAddTestReference = (test: typeof INITIAL_RATE_LIST_RECORDS[0]) => {
    const newItem: PackageItem = {
      item_id: `it-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      test_id: test.test_id,
      test_name: test.test_name,
      category: test.category
    };
    setItems([...items, newItem]);
    setTestSearch('');
  };

  const handleAddManualItem = () => {
    if (!manualItemName.trim()) return;
    const newItem: PackageItem = {
      item_id: `it-${Date.now()}`,
      test_name: manualItemName.trim(),
      category: 'Clinical Pathology'
    };
    setItems([...items, newItem]);
    setManualItemName('');
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageName.trim() || !packageId.trim()) {
      alert('Package name and ID are required.');
      return;
    }

    const payload: HealthPackage = {
      package_id: packageId.trim(),
      package_name: packageName.trim(),
      description: description.trim() || null,
      price: Number(price),
      is_active: isActive,
      needs_review: needsReview,
      review_reason: needsReview ? reviewReason.trim() : undefined,
      fasting_required: fastingRequired,
      fasting_hours: fastingRequired ? Number(fastingHours) : undefined,
      turnaround_time: turnaroundTime.trim() || undefined,
      items,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await saveHealthPackageToDB(payload);
    setIsEditing(false);
    await loadPackages();
  };

  const filteredTestsToAdd = INITIAL_RATE_LIST_RECORDS.filter(t => {
    if (!testSearch.trim()) return false;
    return t.test_name.toLowerCase().includes(testSearch.toLowerCase()) ||
      t.test_id.toLowerCase().includes(testSearch.toLowerCase());
  }).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Console Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Health Package Management
          </h2>
          <p className="text-xs text-slate-500">
            Create, edit, change prices, attach tests, or configure review-required flags for poster packages.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleStartCreate}
        >
          <Plus className="w-4 h-4" />
          Create New Package
        </Button>
      </div>

      {/* Package Form Modal / Drawer */}
      {isEditing && (
        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-emerald-500/50 shadow-md space-y-5">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              {packages.some(p => p.package_id === packageId) ? `Edit Package: ${packageId}` : 'Create New Package'}
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSavePackage} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Package ID *</label>
                <input
                  type="text"
                  required
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Package Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Diagnostic scope and parameters covered..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Turnaround Time</label>
                <input
                  type="text"
                  value={turnaroundTime}
                  onChange={(e) => setTurnaroundTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fasting Hours</label>
                <input
                  type="number"
                  value={fastingHours}
                  disabled={!fastingRequired}
                  onChange={(e) => setFastingHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="flex flex-col justify-end space-y-1">
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  Active / Visible
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-amber-800">
                  <input
                    type="checkbox"
                    checked={needsReview}
                    onChange={(e) => setNeedsReview(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  Mark Review Required
                </label>
              </div>
            </div>

            {needsReview && (
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  Review Required Reason / Source Notice:
                </label>
                <input
                  type="text"
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="e.g. Poster branding references another center; pending confirmation."
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-amber-300 bg-white"
                />
              </div>
            )}

            {/* Test Items Inclusion Section */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Manage Included Diagnostic Tests ({items.length})
              </span>

              {/* Add from Catalogue Search */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search test to add from rate catalogue (e.g. CBC, HbA1c, LFT)..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                {filteredTestsToAdd.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg p-2 space-y-1 divide-y divide-slate-100 shadow-xs">
                    {filteredTestsToAdd.map(t => (
                      <div key={t.test_id} className="pt-1 flex items-center justify-between text-xs">
                        <span>{t.test_name} ({t.test_id})</span>
                        <button
                          type="button"
                          onClick={() => handleAddTestReference(t)}
                          className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded hover:bg-emerald-100"
                        >
                          + Add Test
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-200 bg-white rounded-lg border border-slate-200 max-h-48 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No tests currently linked to this package.
                  </div>
                ) : (
                  items.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{it.test_name}</span>
                        {it.test_id && <span className="ml-2 font-mono text-[10px] text-slate-400">{it.test_id}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700 text-xs px-1"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <Button type="submit" variant="primary" size="sm">
                Save Package to Database
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Packages Table Listing */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th className="p-3.5">Code</th>
              <th className="p-3.5">Package Name</th>
              <th className="p-3.5">Price</th>
              <th className="p-3.5">Tests Count</th>
              <th className="p-3.5">Audit / Review</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {packages.map(pkg => (
              <tr key={pkg.package_id} className="hover:bg-slate-50">
                <td className="p-3.5 font-mono font-bold text-slate-700">{pkg.package_id}</td>
                <td className="p-3.5 font-semibold text-slate-900">{pkg.package_name}</td>
                <td className="p-3.5 font-bold text-[#0F294A] text-sm">₹{pkg.price}</td>
                <td className="p-3.5 text-slate-600">{pkg.items.length} tests</td>
                <td className="p-3.5">
                  {pkg.needs_review ? (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      REVIEW REQUIRED
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      VERIFIED
                    </span>
                  )}
                </td>
                <td className="p-3.5">
                  <button
                    onClick={() => handleToggleStatus(pkg)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      pkg.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {pkg.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-3.5 text-right space-x-2">
                  <button
                    onClick={() => handleStartEdit(pkg)}
                    className="text-xs font-semibold text-[#0F294A] hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.package_id)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
