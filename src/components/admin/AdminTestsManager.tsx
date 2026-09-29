import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  EyeOff, 
  Eye, 
  RefreshCw, 
  Check, 
  Clock, 
  Tag, 
  DollarSign,
  AlertCircle,
  FlaskConical,
  Info
} from 'lucide-react';
import { RateRecord } from '../../types/catalogue';
import { fetchAdminTests, saveTestRecord, toggleTestStatus } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

export const AdminTestsManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [tests, setTests] = useState<RateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewTest, setIsNewTest] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<RateRecord>>({});

  const loadTests = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminTests();
      setTests(data);
    } catch (err) {
      console.error('Failed to load tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  const categories = Array.from(new Set(tests.map(t => t.category).filter(Boolean)));

  const filteredTests = tests.filter(t => {
    const q = search.toLowerCase();
    const matchesSearch = 
      t.test_name.toLowerCase().includes(q) ||
      t.test_id.toLowerCase().includes(q) ||
      (t.method && t.method.toLowerCase().includes(q)) ||
      (t.sample && t.sample.toLowerCase().includes(q));

    const matchesCat = categoryFilter === 'ALL' || t.category === categoryFilter;
    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && t.is_active) ||
      (statusFilter === 'INACTIVE' && !t.is_active);

    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setIsNewTest(true);
    setEditFormData({
      test_id: `BLD-T${Math.floor(100 + Math.random() * 900)}`,
      test_name: '',
      category: 'Clinical Pathology',
      general_price: 250,
      corporate_price: 200,
      sample: 'Blood',
      method: 'Automated Analyzer',
      reporting_time: 'Same Day (4-6 hrs)',
      sample_instructions: 'Fasting 10-12 hours overnight required.',
      clinical_information: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: RateRecord) => {
    setIsNewTest(false);
    setEditFormData({ ...t });
    setIsModalOpen(true);
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!editFormData.test_name?.trim()) {
      alert('Test name is required.');
      return;
    }
    if (editFormData.general_price === undefined || Number(editFormData.general_price) < 0) {
      alert('Valid general price is required.');
      return;
    }

    setProcessingId(editFormData.test_id || 'new');
    try {
      const saved = await saveTestRecord(editFormData, isNewTest, {
        uid: currentUser.uid,
        email: currentUser.email,
        role: currentUser.role
      });

      if (isNewTest) {
        setTests(prev => [saved, ...prev]);
      } else {
        setTests(prev => prev.map(t => t.test_id === saved.test_id ? saved : t));
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error saving test: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleActive = async (t: RateRecord) => {
    if (!currentUser) return;
    const newStatus = !t.is_active;
    const promptText = newStatus 
      ? `Re-activate test "${t.test_name}"? It will become bookable by patients.`
      : `Soft-deactivate test "${t.test_name}"? Historical bookings will remain intact, but it will be hidden from new orders.`;

    if (!window.confirm(promptText)) return;

    setProcessingId(t.test_id);
    try {
      await toggleTestStatus(t.test_id, newStatus, {
        uid: currentUser.uid,
        email: currentUser.email,
        role: currentUser.role
      });
      setTests(prev => prev.map(item => item.test_id === t.test_id ? { ...item, is_active: newStatus } : item));
    } catch (err: any) {
      alert(`Error updating test status: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-emerald-600" />
            Diagnostic Tests & Pathology Catalogue
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Maintain official rate list, pricing, sample requirements, methods, and soft deactivation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadTests}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenAddModal}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add New Test
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search test name, code, method, or sample..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-700 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active (Bookable)</option>
            <option value="INACTIVE">Inactive (Hidden)</option>
          </select>
        </div>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Test Code & Name</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Sample / Method</th>
                <th className="px-4 py-3.5 text-right">General Price</th>
                <th className="px-4 py-3.5 text-right">Corporate Price</th>
                <th className="px-4 py-3.5">Reporting Time</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading official test catalogue...
                  </td>
                </tr>
              ) : filteredTests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No diagnostic tests found matching filters.
                  </td>
                </tr>
              ) : (
                filteredTests.map((t) => (
                  <tr key={t.test_id} className={`hover:bg-slate-50/70 transition-colors ${!t.is_active ? 'bg-slate-50/50 opacity-70' : ''}`}>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{t.test_name}</div>
                      <div className="text-[10px] text-emerald-700 font-mono font-bold mt-0.5">
                        {t.test_id}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {t.category}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{t.sample || 'Blood'}</div>
                      <div className="text-[10px] text-slate-400">{t.method || 'Automated'}</div>
                    </td>

                    <td className="px-4 py-3.5 text-right font-black text-slate-900 text-sm">
                      ₹{t.general_price ?? 'N/A'}
                    </td>

                    <td className="px-4 py-3.5 text-right font-bold text-slate-500 text-xs">
                      {t.corporate_price !== null && t.corporate_price !== undefined ? `₹${t.corporate_price}` : '—'}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {t.reporting_time || 'Same Day'}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        t.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(t)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
                      >
                        Edit
                      </button>

                      <button
                        disabled={processingId === t.test_id}
                        onClick={() => handleToggleActive(t)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                          t.is_active
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                        title={t.is_active ? 'Soft-deactivate (preserves history)' : 'Re-activate'}
                      >
                        {t.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Test Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isNewTest ? 'Add New Diagnostic Test' : `Edit Test: ${editFormData.test_name}`}
                </h3>
                <span className="text-xs text-emerald-700 font-mono font-bold">
                  Test Code: {editFormData.test_id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveTest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Test Code */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Test Code / ID</label>
                  <input
                    type="text"
                    required
                    value={editFormData.test_id || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, test_id: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase bg-slate-50"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diagnostic Category</label>
                  <input
                    type="text"
                    required
                    list="category-suggestions"
                    value={editFormData.category || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                  <datalist id="category-suggestions">
                    <option value="Clinical Pathology" />
                    <option value="Hematology" />
                    <option value="Biochemistry" />
                    <option value="Thyroid & Hormones" />
                    <option value="Serology & Immunology" />
                    <option value="Diabetes Care" />
                    <option value="Lipid & Cardiac" />
                  </datalist>
                </div>

                {/* Test Name */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Test Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete Blood Count (CBC with ESR)"
                    value={editFormData.test_name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, test_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                {/* General Price */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">General Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editFormData.general_price ?? ''}
                    onChange={(e) => setEditFormData({ ...editFormData, general_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                  />
                </div>

                {/* Corporate Price */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Corporate / Clinic Price (₹ INR)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Optional discounted rate"
                    value={editFormData.corporate_price ?? ''}
                    onChange={(e) => setEditFormData({ 
                      ...editFormData, 
                      corporate_price: e.target.value ? Number(e.target.value) : null 
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                {/* Sample Type */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Specimen / Sample Type</label>
                  <select
                    value={editFormData.sample || 'Blood'}
                    onChange={(e) => setEditFormData({ ...editFormData, sample: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800"
                  >
                    <option value="Blood">Blood (EDTA Whole Blood)</option>
                    <option value="Serum">Serum (Clot Activator)</option>
                    <option value="Plasma">Plasma (Fluoride/Heparin)</option>
                    <option value="Urine">Urine (Random / First Morning)</option>
                    <option value="Stool">Stool Sample</option>
                    <option value="Swab">Throat / Nasal Swab</option>
                  </select>
                </div>

                {/* Method */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Analytical Method</label>
                  <input
                    type="text"
                    placeholder="e.g. Flow Cytometry, CLIA, Enzymatic"
                    value={editFormData.method || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, method: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                {/* Reporting Time */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Reporting / Turnaround Time</label>
                  <input
                    type="text"
                    placeholder="e.g. Same Day (4-6 hrs), Next Day 12:00 PM"
                    value={editFormData.reporting_time || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, reporting_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                {/* Sample Instructions */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Patient Fasting & Preparation Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 10 to 12 hours overnight fasting mandatory. Plain water permitted."
                    value={editFormData.sample_instructions || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, sample_instructions: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                {/* Clinical Information */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Clinical Significance / Description</label>
                  <textarea
                    rows={2}
                    placeholder="Clinical purpose of test (e.g. screening for anemia, infection, platelet disorder)..."
                    value={editFormData.clinical_information || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, clinical_information: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="test_active_checkbox"
                    checked={editFormData.is_active ?? true}
                    onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                  />
                  <label htmlFor="test_active_checkbox" className="text-xs font-semibold text-slate-700">
                    Active & Available for Online / Center Booking
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingId !== null}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs"
                  >
                    {processingId ? 'Saving...' : isNewTest ? 'Add Test' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
