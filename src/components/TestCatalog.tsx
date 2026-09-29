import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  Droplet, 
  AlertCircle, 
  Check, 
  Plus, 
  ArrowRight,
  ShieldAlert,
  Info,
  Sparkles
} from 'lucide-react';
import { DiagnosticTest, BUSINESS_INFO } from '../types';
import { OFFICIAL_RATE_LIST, CATEGORIES } from '../data/rateList';

interface TestCatalogProps {
  selectedTests: DiagnosticTest[];
  onToggleTest: (test: DiagnosticTest) => void;
  onProceedToBooking: () => void;
}

export const TestCatalog: React.FC<TestCatalogProps> = ({
  selectedTests,
  onToggleTest,
  onProceedToBooking
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Tests');

  const filteredTests = useMemo(() => {
    return OFFICIAL_RATE_LIST.filter(test => {
      const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All Tests' || test.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const isSelected = (testId: string) => selectedTests.some(t => t.id === testId);

  const totalSelectedPrice = selectedTests.reduce((acc, t) => acc + t.price, 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner Section */}
      <section className="bg-gradient-to-r from-[#0F294A] via-[#16365D] to-[#0A223E] text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-700/40 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Official Center Rate List • Pratap Nagar, Jaipur
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Accurate Diagnosis, <br className="hidden sm:inline" />
            <span className="text-emerald-400">Better Health</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Welcome to <strong className="text-white font-semibold">{BUSINESS_INFO.name}</strong>. 
            Explore verified pathology tests and health packages with transparent rates. 
            Book your convenient sample collection at home or center visit with our request model.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 px-4 border border-white/10 text-xs flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span><strong>Home Sample Collection:</strong> Available</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 px-4 border border-white/10 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400" />
              <span><strong>Pay on Collection:</strong> No online payment required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Category Filter Toolbar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tests by name (e.g. CBC, HbA1c, LFT, Lipid, Vitamin D)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] text-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 bg-slate-100 rounded px-1.5 py-0.5"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Counter */}
          <div className="text-xs font-semibold text-slate-500 whitespace-nowrap px-2">
            Showing <span className="text-[#0F294A] font-bold">{filteredTests.length}</span> verified tests
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1 mr-1" />
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-[#0F294A] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTests.map((test) => {
          const selected = isSelected(test.id);
          return (
            <div
              key={test.id}
              className={`relative flex flex-col justify-between rounded-2xl p-5 border transition-all duration-200 ${
                selected 
                  ? 'bg-emerald-50/50 border-emerald-500 shadow-md ring-1 ring-emerald-500' 
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Category & Code */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    {test.category}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-slate-400">
                    CODE: {test.code}
                  </span>
                </div>

                {/* Test Name */}
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {test.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {test.description}
                </p>

                {/* Badges: Fasting & Specimen */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    <Droplet className="w-3 h-3 text-red-500" />
                    {test.sampleType}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {test.turnaroundTime}
                  </span>
                  {test.fastingRequired && (
                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded font-medium">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Fasting {test.fastingHours ? `${test.fastingHours}h` : 'Req.'}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer: Price & Selection Action */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Verified Rate</span>
                  <span className="text-xl font-black text-[#0F294A]">
                    ₹{test.price}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleTest(test)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    selected
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                      : 'bg-slate-100 text-slate-800 hover:bg-[#0F294A] hover:text-white'
                  }`}
                >
                  {selected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Selected
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Add to Booking
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTests.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-slate-800">No matching diagnostic tests found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or filter category.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('All Tests'); }}
            className="text-xs font-semibold text-emerald-700 hover:underline pt-2 inline-block"
          >
            Reset all filters
          </button>
        </div>
      )}

      {/* Floating Sticky Bottom Bar when Tests are selected */}
      {selectedTests.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto">
          <div className="bg-[#0F294A] text-white p-4 rounded-2xl shadow-2xl border border-slate-600 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-white">
                {selectedTests.length}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {selectedTests.length} {selectedTests.length === 1 ? 'Test' : 'Tests'} Selected
                </p>
                <p className="text-xs text-slate-300">
                  Total Rate: <span className="font-bold text-emerald-400 text-sm">₹{totalSelectedPrice}</span> (Pay at collection/visit)
                </p>
              </div>
            </div>

            <button
              onClick={onProceedToBooking}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              Proceed with Booking
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
