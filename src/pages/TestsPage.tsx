import React, { useState } from 'react';
import { DiagnosticTest, BUSINESS_INFO } from '../types';
import { OFFICIAL_RATE_LIST, CATEGORIES } from '../data/rateList';
import { PublicPage } from '../components/layout/Header';
import { Search, Filter, Droplet, Clock, AlertCircle, Plus, Check } from 'lucide-react';
import { Badge } from '../components/ui/DesignSystem';

interface TestsPageProps {
  onNavigate: (page: PublicPage, param?: string) => void;
  selectedTests: DiagnosticTest[];
  onToggleTest: (test: DiagnosticTest) => void;
  onProceedToBooking: () => void;
}

export const TestsPage: React.FC<TestsPageProps> = ({
  onNavigate,
  selectedTests,
  onToggleTest,
  onProceedToBooking,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All Tests');

  const filteredTests = OFFICIAL_RATE_LIST.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(search.toLowerCase()) ||
      test.code.toLowerCase().includes(search.toLowerCase()) ||
      test.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'All Tests' || test.category === category;
    return matchesSearch && matchesCat;
  });

  const isSelected = (id: string) => selectedTests.some(t => t.id === id);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Diagnostic Tests Directory & Rate List
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Source of truth rate list for {BUSINESS_INFO.name}. Transparent rates and specimen requirements.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search test name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-[#0F294A]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                category === cat ? 'bg-[#0F294A] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTests.map(test => {
          const selected = isSelected(test.id);
          return (
            <div
              key={test.id}
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                selected ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-slate-200'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <Badge variant="green">{test.category}</Badge>
                  <span className="font-mono text-slate-400">{test.code}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{test.name}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">{test.description}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                  <span>{test.sampleType}</span>
                  <span>•</span>
                  <span>{test.turnaroundTime}</span>
                  {test.fastingRequired && (
                    <span className="text-amber-700 font-semibold">• Fasting Req.</span>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Verified Rate</span>
                  <span className="text-lg font-black text-[#0F294A]">₹{test.price}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('test-details', test.id)}
                    className="text-xs text-slate-600 hover:text-slate-900 underline"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => onToggleTest(test)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      selected
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {selected ? 'Added' : 'Add to Booking'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Proceed Floating Bar */}
      {selectedTests.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-2xl mx-auto">
          <div className="bg-[#0F294A] text-white p-3.5 rounded-xl shadow-xl border border-slate-600 flex items-center justify-between">
            <span className="text-xs font-semibold">
              {selectedTests.length} tests selected (₹{selectedTests.reduce((a, b) => a + b.price, 0)})
            </span>
            <button
              onClick={onProceedToBooking}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs"
            >
              Proceed to Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
