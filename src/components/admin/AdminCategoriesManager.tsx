import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  Layers, 
  Search, 
  RefreshCw, 
  ArrowRight, 
  FlaskConical, 
  CheckCircle2, 
  Plus,
  Tag
} from 'lucide-react';
import { AdminCategoryItem, AdminRoute } from '../../types/admin';
import { fetchAdminCategories } from '../../services/adminService';

interface AdminCategoriesManagerProps {
  onNavigateTab: (tab: AdminRoute) => void;
}

export const AdminCategoriesManager: React.FC<AdminCategoriesManagerProps> = ({ onNavigateTab }) => {
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const name = newCatName.trim();
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert('This category already exists.');
      return;
    }

    const newItem: AdminCategoryItem = {
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name,
      description: `Diagnostic pathology and specimen panels categorized under ${name}.`,
      totalTests: 0,
      activeTests: 0
    };

    setCategories(prev => [newItem, ...prev]);
    setNewCatName('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Diagnostic Categories & Specialty Panels
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Group diagnostic tests into organized clinical specialties (Hematology, Biochemistry, Hormones, Serology, etc.).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCategories}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Add Category Form Inline */}
      {isAdding && (
        <form onSubmit={handleAddCategory} className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            required
            placeholder="New Category Name (e.g. Molecular Biology, Toxic Panels)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg"
            >
              Create Category
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading categories...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No diagnostic categories match the filter.
          </div>
        ) : (
          filteredCategories.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    {c.activeTests} Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {c.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  {c.totalTests} total tests
                </span>
                <button
                  onClick={() => onNavigateTab('tests')}
                  className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  Manage tests <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
