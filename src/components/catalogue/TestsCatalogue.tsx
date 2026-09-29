import React, { useState, useEffect } from 'react';
import { RateRecord } from '../../types/catalogue';
import { queryTestsPaginated, getCatalogueFilters } from '../../services/catalogueService';
import { PublicPage } from '../layout/Header';
import {
  Search,
  Check,
  Plus,
  Droplet,
  Clock,
  X,
  ArrowRight,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
} from 'lucide-react';
import { Button, SkeletonGrid, EmptyState, ContentRequiredBadge } from '../ui/DesignSystem';

interface TestsCatalogueProps {
  onNavigate: (page: PublicPage, param?: string) => void;
  selectedTestIds: string[];
  onToggleTestById: (record: RateRecord) => void;
  onProceedToBooking: () => void;
}

export const TestsCatalogue: React.FC<TestsCatalogueProps> = ({
  onNavigate,
  selectedTestIds,
  onToggleTestById,
  onProceedToBooking,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc'>('name');
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;

  const [records, setRecords] = useState<RateRecord[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getCatalogueFilters()
      .then((res) => {
        setCategories(['All', ...res.categories]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const timer = setTimeout(() => {
      queryTestsPaginated({
        page,
        pageSize,
        search: searchQuery.trim(),
        category: selectedCategory,
        sortBy,
        activeOnly: true,
      })
        .then((res) => {
          if (!cancelled) {
            setRecords(res.items);
            setTotalItems(res.total);
            setTotalPages(res.totalPages);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [page, searchQuery, selectedCategory, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedCategory !== 'All' || sortBy !== 'name';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortBy('name');
    setPage(1);
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header Banner */}
      <div className="bg-[#0F294A] rounded-2xl p-6 sm:p-10 text-white border border-slate-800">
        <div className="max-w-3xl space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block">
            B.L. Diagnostic Center · Pathology Directory
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Diagnostic Tests Catalogue
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Search diagnostic pathology tests by name or category, view sample requirements, and book online for Home Collection or Center Visit.
          </p>
        </div>
      </div>

      {/* Search, Category Filter, Sort & Clear Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <label htmlFor="catalogue-search-input" className="sr-only">
              Search diagnostic tests
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="catalogue-search-input"
              type="text"
              placeholder="Search for CBC, Thyroid, Blood Sugar..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Select */}
          <div className="sm:w-52">
            <label htmlFor="catalogue-sort-select" className="sr-only">
              Sort tests
            </label>
            <select
              id="catalogue-sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#0F294A]"
            >
              <option value="name">Sort: Name (A - Z)</option>
              <option value="price_asc">Sort: Price (Low to High)</option>
              <option value="price_desc">Sort: Price (High to Low)</option>
            </select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="md"
              onClick={handleClearFilters}
              className="shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear Filters</span>
            </Button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 pt-1"
          role="tablist"
          aria-label="Filter tests by category"
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer border ${
                  active
                    ? 'bg-[#0F294A] text-white border-[#0F294A]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-[#0F294A]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Result Count & Selection Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div>
            Showing{' '}
            <span className="font-bold text-[#0F294A] tabular-nums">
              {records.length}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-800 tabular-nums">
              {totalItems}
            </span>{' '}
            diagnostic tests
            {selectedCategory !== 'All' && (
              <span>
                {' '}
                in <strong className="text-[#0F294A]">{selectedCategory}</strong>
              </span>
            )}
          </div>

          {selectedTestIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-800 tabular-nums">
                {selectedTestIds.length} test(s) selected for booking
              </span>
              <button
                type="button"
                onClick={onProceedToBooking}
                className="font-bold text-[#059669] underline hover:text-emerald-800 cursor-pointer"
              >
                Proceed to Booking →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading State / Test Grid / Empty Search State */}
      {isLoading ? (
        <SkeletonGrid count={6} columns={3} />
      ) : records.length === 0 ? (
        <EmptyState
          title="No Matching Diagnostic Tests Found"
          description={
            searchQuery
              ? `No diagnostic tests matched "${searchQuery}" in ${
                  selectedCategory === 'All' ? 'any category' : selectedCategory
                }.`
              : 'No diagnostic tests found for the selected filter.'
          }
          actionText="Clear Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {records.map((rec) => {
              const selected = selectedTestIds.includes(rec.test_id);
              return (
                <article
                  key={rec.test_id}
                  className={`bg-white rounded-xl border p-5 flex flex-col justify-between transition-all ${
                    selected
                      ? 'border-[#059669] bg-emerald-50/20 ring-1 ring-[#059669]/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Test Icon + Category + Home Collection Badge */}
                    <div className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-slate-100 text-[#0F294A] flex items-center justify-center shrink-0">
                          <FlaskConical className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                        </div>
                        <span className="font-bold text-[#0F294A] truncate">
                          {rec.category}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                        Home Collection
                      </span>
                    </div>

                    {/* Test Name */}
                    <div>
                      <h2 className="text-base font-bold text-[#0F294A] leading-snug">
                        {rec.test_name}
                      </h2>
                      <div className="space-y-1 pt-2 text-xs text-slate-600">
                        <p className="flex items-center gap-1.5">
                          <Droplet
                            className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-slate-700">Sample:</strong>{' '}
                            {rec.sample || 'Blood'}
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Clock
                            className="w-3.5 h-3.5 text-slate-400 shrink-0"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="text-slate-700">Report Time:</strong>{' '}
                            {rec.reporting_time || 'Same day'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="pt-4 mt-5 border-t border-slate-100 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Test Price
                      </span>
                      {rec.general_price !== null ? (
                        <span className="text-xl font-extrabold text-[#0F294A] tabular-nums">
                          ₹{rec.general_price}
                        </span>
                      ) : (
                        <ContentRequiredBadge text="[CONTENT REQUIRED]" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate('test-details', rec.test_id)}
                        className="w-full"
                      >
                        View Details
                      </Button>

                      <Button
                        variant={selected ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => onToggleTestById(rec)}
                        className="w-full"
                      >
                        {selected ? (
                          <>
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Book Now</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <span className="text-slate-600 font-medium tabular-nums">
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Sticky Bottom Selection Bar */}
      {selectedTestIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-20 max-w-3xl mx-auto bg-[#0F294A] text-white p-4 rounded-xl shadow-xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 z-40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#059669] text-white font-black flex items-center justify-center text-sm tabular-nums shrink-0">
              {selectedTestIds.length}
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {selectedTestIds.length} Diagnostic{' '}
                {selectedTestIds.length === 1 ? 'Test' : 'Tests'} Selected
              </p>
              <p className="text-[11px] text-emerald-300">
                Ready for online booking (Center Visit or Home Collection)
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={onProceedToBooking}
            className="w-full sm:w-auto"
          >
            <span>Continue Booking</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
};
