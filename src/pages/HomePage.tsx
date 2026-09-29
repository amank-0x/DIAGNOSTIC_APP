import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Phone,
  Clock,
  Home as HomeIcon,
  Calendar,
  ArrowRight,
  Check,
  Droplet,
  Microscope,
  FlaskConical,
  FileText,
  User,
  X,
  ClipboardCheck,
  ShieldCheck,
  Navigation,
} from 'lucide-react';
import { DiagnosticTest, BUSINESS_INFO } from '../types';
import { RateRecord } from '../types/catalogue';
import { HealthPackage } from '../types/packages';
import { queryTestsPaginated, getCatalogueFilters } from '../services/catalogueService';
import { getAllPackagesFromDB } from '../services/packageService';
import { PublicPage } from '../components/layout/Header';
import { ContentRequiredBadge } from '../components/ui/DesignSystem';
import { DIAGNOSTIC_IMAGES } from '../constants/diagnosticImages';
import { LaboratoryMap } from '../components/map/LaboratoryMap';

interface HomePageProps {
  onNavigate: (page: PublicPage, param?: string) => void;
  onSelectTestAndBook: (test: DiagnosticTest) => void;
  onToggleTest: (test: DiagnosticTest) => void;
  selectedTests: DiagnosticTest[];
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectTestAndBook,
  onToggleTest,
  selectedTests,
}) => {
  // Dynamic Database Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<RateRecord[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Database-Driven Popular Tests Preview State (Limited Query)
  const [previewTests, setPreviewTests] = useState<RateRecord[]>([]);
  const [loadingTests, setLoadingTests] = useState<boolean>(true);

  // Database-Driven Approved Health Packages State
  const [approvedPackages, setApprovedPackages] = useState<HealthPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    getCatalogueFilters()
      .then((filters) => {
        if (isMounted) setAvailableCategories(filters.categories);
      })
      .catch(() => {});

    setLoadingTests(true);
    queryTestsPaginated({
      page: 1,
      pageSize: 8,
      activeOnly: true,
      sortBy: 'name',
    })
      .then((res) => {
        if (isMounted) {
          setPreviewTests(res.items);
          setLoadingTests(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingTests(false);
      });

    setLoadingPackages(true);
    getAllPackagesFromDB(true)
      .then((pkgs) => {
        if (isMounted) {
          setApprovedPackages(pkgs.filter((p) => p.is_active));
          setLoadingPackages(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingPackages(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced dynamic database search
  useEffect(() => {
    const hasSearchInput = searchQuery.trim().length > 0 || selectedCategory !== 'All';
    if (!hasSearchInput) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let isCancelled = false;
    setIsSearching(true);

    const timer = setTimeout(() => {
      queryTestsPaginated({
        page: 1,
        pageSize: 8,
        search: searchQuery.trim(),
        category: selectedCategory,
        activeOnly: true,
        sortBy: 'name',
      })
        .then((res) => {
          if (!isCancelled) {
            setSearchResults(res.items);
            setIsSearching(false);
          }
        })
        .catch(() => {
          if (!isCancelled) setIsSearching(false);
        });
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory]);

  const convertRateRecordToTest = (record: RateRecord): DiagnosticTest => ({
    id: record.test_id,
    name: record.test_name,
    category: record.category as any,
    code: record.test_id,
    price: record.general_price ?? 0,
    sampleType: (
      record.sample?.includes('Urine')
        ? 'Urine'
        : record.sample?.includes('Serum')
        ? 'Serum'
        : 'Blood'
    ) as any,
    fastingRequired: record.sample_instructions
      ? record.sample_instructions.toLowerCase().includes('fasting')
      : false,
    turnaroundTime: record.reporting_time || 'Same Day',
    description: record.clinical_information || record.test_name,
  });

  const handleBookRateRecord = (record: RateRecord) => {
    onSelectTestAndBook(convertRateRecordToTest(record));
  };

  const handleBookHealthPackage = (pkg: HealthPackage) => {
    const pkgTestObj: DiagnosticTest = {
      id: pkg.package_id,
      name: pkg.package_name,
      category: 'Preventive Health Packages',
      code: pkg.package_id,
      price: pkg.price,
      sampleType: 'Blood',
      fastingRequired: pkg.fasting_required,
      fastingHours: pkg.fasting_hours,
      turnaroundTime: pkg.turnaround_time || 'Same Day',
      description: pkg.description || pkg.package_name,
    };
    onSelectTestAndBook(pkgTestObj);
  };

  const hasActiveSearch = searchQuery.trim().length > 0 || selectedCategory !== 'All';

  return (
    <div className="space-y-16 pb-16">
      {/* =====================================================================
          HERO SECTION
          Left: Trusted badge, "Accurate Diagnosis, Better Health" (green highlight),
                description, Book a Test -> & Request Home Collection, 3 indicators.
          Right: Diagnostic laboratory image with rounded framing.
      ===================================================================== */}
      <section
        aria-labelledby="hero-heading"
        className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 lg:p-12 shadow-2xs"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT SIDE */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide border border-emerald-200">
              <Microscope className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span>Trusted Diagnostic Center in Pratap Nagar</span>
            </div>

            <div className="space-y-2">
              <h1
                id="hero-heading"
                className="text-3xl sm:text-5xl font-extrabold text-[#0F294A] tracking-tight leading-[1.12]"
              >
                Accurate Diagnosis,{' '}
                <span className="text-[#059669] block sm:inline">Better Health</span>
              </h1>
            </div>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
              Convenient diagnostic testing with online booking and home sample collection in Pratap Nagar, Jaipur.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('book')}
                className="bg-[#059669] hover:bg-[#047857] text-white font-bold px-6 py-3.5 rounded-lg text-xs sm:text-sm transition-colors shadow-2xs flex items-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#059669]"
              >
                <span>Book a Test</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('home-collection')}
                className="bg-[#0F294A] hover:bg-[#16365D] text-white font-semibold px-6 py-3.5 rounded-lg text-xs sm:text-sm transition-colors shadow-2xs flex items-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A]"
              >
                <HomeIcon className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Request Home Collection</span>
              </button>
            </div>

            {/* 3 Feature Indicators */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs sm:text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                </span>
                <span>Online Booking</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                </span>
                <span>Home Sample Collection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                </span>
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Diagnostic / Laboratory Image */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
              <div className="aspect-16/11 w-full overflow-hidden">
                <img
                  src={DIAGNOSTIC_IMAGES.heroLab.src}
                  alt={DIAGNOSTIC_IMAGES.heroLab.alt}
                  width={800}
                  height={550}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          BOOK YOUR TEST (PROMINENT TEST SEARCH & BOOKING ENTRY)
      ===================================================================== */}
      <section
        aria-labelledby="test-search-heading"
        className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
              Quick Online Booking
            </span>
            <h2
              id="test-search-heading"
              className="text-xl sm:text-2xl font-bold text-[#0F294A] mt-0.5"
            >
              Book Your Test
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Search by test name, category, or common keywords to check details and book immediately.
            </p>
          </div>

          {selectedTests.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('book')}
              className="bg-[#059669] hover:bg-[#047857] text-white font-bold px-5 py-2.5 rounded-lg text-xs sm:text-sm flex items-center gap-2 shadow-2xs cursor-pointer shrink-0"
            >
              <span>Continue Booking ({selectedTests.length})</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Search Input + Category Filter */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <label htmlFor="homepage-test-search" className="sr-only">
              Search Test
            </label>
            <Search
              className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="homepage-test-search"
              type="text"
              placeholder="Search for CBC, Thyroid, Blood Sugar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {availableCategories.length > 0 && (
            <div className="md:w-64">
              <label htmlFor="homepage-category-filter" className="sr-only">
                Filter by category
              </label>
              <select
                id="homepage-category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-full px-4 py-3.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-xs sm:text-sm font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#0F294A]"
              >
                <option value="All">All Categories</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Dynamic Search Results Dropdown / Card Interface */}
        {hasActiveSearch && (
          <div className="pt-2">
            {isSearching ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
                Searching diagnostic test catalogue...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span>No matching tests found for "{searchQuery}".</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Clear Filter
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                {searchResults.map((record) => {
                  const testObj = convertRateRecordToTest(record);
                  const isSelected = selectedTests.some((t) => t.id === record.test_id);
                  return (
                    <div
                      key={record.test_id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-[#0F294A]">
                            {record.test_name}
                          </h3>
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            Home Collection Available
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <Droplet className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                            Sample: {record.sample || 'Blood'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                            Report Time: {record.reporting_time || 'Same Day'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <div className="text-right mr-2">
                          {record.general_price !== null ? (
                            <span className="text-base font-extrabold text-[#0F294A] tabular-nums">
                              ₹{record.general_price}
                            </span>
                          ) : (
                            <ContentRequiredBadge text="[CONTENT REQUIRED]" />
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onToggleTest(testObj)}
                          className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                              : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {isSelected ? '✓ Selected' : '+ Select'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBookRateRecord(record)}
                          className="px-4 py-2 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* =====================================================================
          POPULAR TESTS SECTION
          Database-driven test cards with icon, Home Collection badge,
          Test Name, Sample type, Report time, Price, View Details, Book Now.
      ===================================================================== */}
      <section aria-labelledby="popular-tests-heading" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2
              id="popular-tests-heading"
              className="text-xl sm:text-2xl font-bold text-[#0F294A]"
            >
              Popular Tests
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Book from our most requested diagnostic tests
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('tests')}
            className="text-xs sm:text-sm font-bold text-[#0F294A] hover:text-emerald-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer uppercase tracking-wide"
          >
            <span>VIEW ALL TESTS</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {loadingTests ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            aria-busy="true"
          >
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-xl border border-slate-200 h-60 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                  <div className="h-5 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                </div>
                <div className="h-9 w-full bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {previewTests.map((record) => (
              <div
                key={record.test_id}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-600/50 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Row: Test Icon + Home Collection Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-[#0F294A] flex items-center justify-center shrink-0">
                      <FlaskConical className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Home Collection
                    </span>
                  </div>

                  {/* Test Name */}
                  <h3 className="text-base font-bold text-[#0F294A] leading-snug line-clamp-2">
                    {record.test_name}
                  </h3>

                  {/* Sample & Report Time */}
                  <div className="space-y-1.5 pt-1 text-xs text-slate-600 border-t border-slate-100">
                    <p className="flex items-center gap-1.5">
                      <Droplet className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                      <span>
                        <strong className="text-slate-700">Sample:</strong>{' '}
                        {record.sample || 'Blood'}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span>
                        <strong className="text-slate-700">Report:</strong>{' '}
                        {record.reporting_time || 'Same day'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">Test Price</span>
                    {record.general_price !== null ? (
                      <span className="text-xl font-extrabold text-[#0F294A] tabular-nums">
                        ₹{record.general_price}
                      </span>
                    ) : (
                      <ContentRequiredBadge text="[CONTENT REQUIRED]" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('test-details', record.test_id)}
                      className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer text-center"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBookRateRecord(record)}
                      className="px-2.5 py-2 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================================
          HEALTH PACKAGES SECTION
          Database-driven packages with Package Name, Price, Home Collection badge,
          Included Tests, View Package, Book Package.
      ===================================================================== */}
      <section aria-labelledby="health-packages-heading" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2
              id="health-packages-heading"
              className="text-xl sm:text-2xl font-bold text-[#0F294A]"
            >
              Health Packages
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Preventive and routine diagnostic health checkup packages
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('packages')}
            className="text-xs sm:text-sm font-bold text-[#0F294A] hover:text-emerald-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer uppercase tracking-wide"
          >
            <span>VIEW ALL PACKAGES</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {loadingPackages ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-busy="true">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-slate-200 h-64 animate-pulse"
              />
            ))}
          </div>
        ) : approvedPackages.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>Health package details:</span>
            <ContentRequiredBadge text="[CONTENT REQUIRED]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {approvedPackages.slice(0, 6).map((pkg) => (
              <div
                key={pkg.package_id}
                className="bg-white rounded-xl border border-slate-200 hover:border-emerald-600/50 p-6 flex flex-col justify-between space-y-5 shadow-2xs transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                      Home Collection Available
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {pkg.items.length} Tests
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-[#0F294A]">
                    {pkg.package_name}
                  </h3>

                  {pkg.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {pkg.description}
                    </p>
                  )}

                  {/* Included Tests */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Included Tests ({pkg.items.length}):
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {pkg.items.slice(0, 4).map((it, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 truncate">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                          <span className="truncate">{it.test_name}</span>
                        </li>
                      ))}
                      {pkg.items.length > 4 && (
                        <li className="text-[11px] font-semibold text-emerald-700 pl-5">
                          + {pkg.items.length - 4} more tests
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 font-medium">Package Price</span>
                    <span className="text-2xl font-extrabold text-[#0F294A] tabular-nums">
                      ₹{pkg.price}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => onNavigate('packages', pkg.package_id)}
                      className="px-3 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer text-center"
                    >
                      View Package
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBookHealthPackage(pkg)}
                      className="px-3.5 py-2.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      Book Package
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================================
          HOME SAMPLE COLLECTION SECTION
          Two-column layout: Left = Diagnostic collection image,
          Right = Badge, Heading, Description, 4 Feature items, CTA
      ===================================================================== */}
      <section
        aria-labelledby="home-collection-heading"
        className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-2xs"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT: Diagnostic Collection Image */}
          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
              <div className="aspect-4/3 w-full overflow-hidden">
                <img
                  src={DIAGNOSTIC_IMAGES.homeCollection.src}
                  alt={DIAGNOSTIC_IMAGES.homeCollection.alt}
                  loading="lazy"
                  width={600}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Content & Features */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-md text-xs font-bold tracking-wide">
              <HomeIcon className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span>Home Collection Available</span>
            </div>

            <h2
              id="home-collection-heading"
              className="text-2xl sm:text-3xl font-extrabold text-[#0F294A] tracking-tight"
            >
              Home Sample Collection
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
              Book a convenient diagnostic sample collection from the comfort of your home.
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700 font-medium">
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                </span>
                <span>Scheduled collection at preferred date and time</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                </span>
                <span>Address-based booking</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                </span>
                <span>Available time slots</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                </span>
                <span>Safe sample handling</span>
              </li>
            </ul>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('book')}
                className="bg-[#059669] hover:bg-[#047857] text-white font-bold px-6 py-3.5 rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <span>Book Home Collection</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <a
                href={`tel:${BUSINESS_INFO.phone}`}
                className="bg-slate-100 hover:bg-slate-200 text-[#0F294A] font-bold px-5 py-3.5 rounded-lg text-xs sm:text-sm inline-flex items-center gap-2 transition-colors tabular-nums"
              >
                <Phone className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <span>Call {BUSINESS_INFO.phone}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          WHY CHOOSE B.L. DIAGNOSTIC? (NAVY SECTION)
          4 Cards: Easy Online Booking, Home Collection, Digital Reports, Secure & Private
      ===================================================================== */}
      <section
        aria-labelledby="why-choose-heading"
        className="bg-[#0F294A] text-white rounded-2xl p-6 sm:p-10 lg:p-12 border border-slate-800 space-y-8"
      >
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 id="why-choose-heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Why Choose B.L. Diagnostic?
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm">
            We make diagnostic testing convenient, accessible, and reliable
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
            <div className="w-11 h-11 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-white">Easy Online Booking</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Search diagnostic tests, select patient profiles, and schedule appointments online in minutes.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
            <div className="w-11 h-11 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <HomeIcon className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-white">Home Collection</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Convenient doorstep sample collection at your preferred date and available time slot.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
            <div className="w-11 h-11 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-white">Digital Reports</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Access and download released diagnostic reports directly from your patient dashboard.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
            <div className="w-11 h-11 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-white">Secure &amp; Private</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Authenticated patient accounts ensure your family profiles, bookings, and reports remain private.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          HOW BOOKING WORKS (VISUAL 4-STEP SECTION)
          Step 1: Choose Test | Step 2: Select Patient | Step 3: Pick Date & Time | Step 4: Confirm Booking
      ===================================================================== */}
      <section
        aria-labelledby="how-booking-works-heading"
        className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-2xs space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
              Simple 4-Step Process
            </span>
            <h2
              id="how-booking-works-heading"
              className="text-xl sm:text-2xl font-bold text-[#0F294A] mt-0.5"
            >
              How Booking Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Schedule your diagnostic test online for Center Visit or Home Collection.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('book')}
            className="bg-[#059669] hover:bg-[#047857] text-white font-bold px-5 py-2.5 rounded-lg text-xs sm:text-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <span>Book a Test</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          <li className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full bg-[#059669] text-white text-xs font-extrabold flex items-center justify-center tabular-nums">
                1
              </span>
              <FlaskConical className="w-5 h-5 text-[#0F294A]" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-[#0F294A]">Choose Test</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Search and select your required diagnostic tests or health package.
            </p>
          </li>

          <li className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full bg-[#059669] text-white text-xs font-extrabold flex items-center justify-center tabular-nums">
                2
              </span>
              <User className="w-5 h-5 text-[#0F294A]" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-[#0F294A]">Select Patient</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose yourself or add a family member profile for the appointment.
            </p>
          </li>

          <li className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full bg-[#0F294A] text-white text-xs font-extrabold flex items-center justify-center tabular-nums">
                3
              </span>
              <Calendar className="w-5 h-5 text-[#0F294A]" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-[#0F294A]">Pick Date &amp; Time</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Select Center Visit or Home Collection along with your preferred date and slot.
            </p>
          </li>

          <li className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full bg-slate-200 text-[#0F294A] text-xs font-extrabold flex items-center justify-center tabular-nums">
                4
              </span>
              <ClipboardCheck className="w-5 h-5 text-emerald-700" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-[#0F294A]">Confirm Booking</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Review your booking summary and confirm to receive your Booking ID immediately.
            </p>
          </li>
        </ol>
      </section>

      {/* =====================================================================
          VISIT OUR CENTER / CONTACT SECTION
      ===================================================================== */}
      <section
        aria-labelledby="contact-location-heading"
        className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
              Location &amp; Contact
            </span>
            <h2
              id="contact-location-heading"
              className="text-xl sm:text-2xl font-bold text-[#0F294A] mt-0.5"
            >
              Visit Our Center
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {BUSINESS_INFO.name} — Pratap Nagar, Jaipur
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`tel:${BUSINESS_INFO.phone}`}
              className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5 transition-colors tabular-nums"
            >
              <Phone className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Call Now: {BUSINESS_INFO.phone}</span>
            </a>

            <a
              href="https://www.google.com/maps/dir/?api=1&destination=26.7981,75.8245"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-100 hover:bg-slate-200 text-[#0F294A] text-xs font-bold px-4 py-2.5 rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span>Get Directions</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-[#0F294A] text-white flex items-center justify-center">
              <MapPin className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-[#0F294A]">Center Address</h3>
            <address className="not-italic text-xs text-slate-700 leading-relaxed">
              Near Post Office, Kumbha Marg,
              <br />
              Sector 11, Pratap Nagar,
              <br />
              Jaipur - 302033
            </address>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-[#0F294A] text-white flex items-center justify-center">
              <Phone className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-[#0F294A]">24/7 Support Phone</h3>
            <p className="text-xs text-slate-600">Call for test inquiries or appointments:</p>
            <a
              href={`tel:${BUSINESS_INFO.phone}`}
              className="text-base font-extrabold text-emerald-700 hover:underline block pt-0.5 tabular-nums"
            >
              {BUSINESS_INFO.phone}
            </a>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-[#059669] text-white flex items-center justify-center">
              <HomeIcon className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-[#0F294A]">Home Collection</h3>
            <p className="text-xs text-slate-700 font-medium">
              Home Sample Collection Available
            </p>
            <button
              type="button"
              onClick={() => onNavigate('book')}
              className="text-xs font-bold text-emerald-700 hover:underline pt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Book Home Collection</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Interactive Google Map */}
        <LaboratoryMap heightClassName="h-[340px]" />
      </section>

      {/* =====================================================================
          FINAL BOOKING CTA
      ===================================================================== */}
      <section
        aria-labelledby="final-cta-heading"
        className="bg-[#0F294A] text-white rounded-2xl p-6 sm:p-10 border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-xl">
          <h2 id="final-cta-heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Book Your Diagnostic Test Today
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Schedule your diagnostic test online or request home sample collection with {BUSINESS_INFO.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3.5">
          <button
            type="button"
            onClick={() => onNavigate('book')}
            className="bg-[#059669] hover:bg-[#047857] text-white font-bold px-6 py-3.5 rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <span>Book a Test</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('home-collection')}
            className="bg-white text-[#0F294A] hover:bg-slate-100 font-bold px-6 py-3.5 rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <HomeIcon className="w-4 h-4 text-emerald-700" aria-hidden="true" />
            <span>Home Collection</span>
          </button>

          <a
            href={`tel:${BUSINESS_INFO.phone}`}
            className="bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold px-5 py-3.5 rounded-lg text-xs sm:text-sm inline-flex items-center gap-2 transition-colors tabular-nums"
          >
            <Phone className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span>{BUSINESS_INFO.phone}</span>
          </a>
        </div>
      </section>
    </div>
  );
};
