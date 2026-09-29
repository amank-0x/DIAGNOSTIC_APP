import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PublicPage } from '../layout/Header';
import { DiagnosticTest, BUSINESS_INFO } from '../../types';
import { PatientRecord, CollectionType } from '../../types/bookingSystem';
import { getPatientsForUser, createPatientRecord } from '../../services/patientService';
import { createBookingOrder, getBookingsForUser } from '../../services/orderService';
import { queryTestsPaginated } from '../../services/catalogueService';
import { fetchCenterSettings } from '../../services/adminService';
import { RateRecord } from '../../types/catalogue';
import { PatientManager } from '../dashboard/PatientManager';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Droplet,
  Home,
  Building2,
  Trash2,
  Lock,
  Search,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '../ui/DesignSystem';

interface CompleteBookingEngineProps {
  selectedTests: DiagnosticTest[];
  onAddTest: (test: DiagnosticTest) => void;
  onRemoveTest: (testId: string) => void;
  onClearSelectedTests: () => void;
  onNavigateToCatalog: () => void;
  onNavigate: (page: PublicPage, param?: string) => void;
}

interface ConfirmedBookingSummary {
  bookingId: string;
  patientName: string;
  patientDetails: string;
  tests: { id: string; name: string; price: number }[];
  totalAmount: number;
  bookingDate: string;
  timeSlot: string;
  collectionType: CollectionType;
  address?: string;
  contactNumber?: string;
  status: string;
}

export const CompleteBookingEngine: React.FC<CompleteBookingEngineProps> = ({
  selectedTests,
  onAddTest,
  onRemoveTest,
  onClearSelectedTests,
  onNavigateToCatalog,
  onNavigate,
}) => {
  const { user } = useAuth();

  // 7-Step Multi-Step Booking Flow:
  // 1: Test / Package
  // 2: Patient ("Who is this test for?")
  // 3: Service (Collection Method: Center Visit / Home Collection)
  // 4: Date & Time
  // 5: Address (Collection Address / Center Location)
  // 6: Review (Booking Summary)
  // 7: Confirmation
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1 Inline Test Search State
  const [inlineSearch, setInlineSearch] = useState('');
  const [inlineResults, setInlineResults] = useState<RateRecord[]>([]);
  const [isSearchingTests, setIsSearchingTests] = useState(false);

  // Step 2 Patient State
  const [patientMode, setPatientMode] = useState<'MYSELF' | 'OTHER'>('MYSELF');
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [savedPatients, setSavedPatients] = useState<PatientRecord[]>([]);
  const [creatingSelfProfile, setCreatingSelfProfile] = useState(false);

  // Step 3 Collection Method State
  const [collectionType, setCollectionType] = useState<CollectionType>('HOME_COLLECTION');

  // Step 4 Date & Time State (from backend/database system settings)
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [bookingDate, setBookingDate] = useState<string>(tomorrowStr);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([
    '07:00 AM - 08:00 AM',
    '08:00 AM - 09:00 AM',
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '04:00 PM - 05:00 PM',
    '05:00 PM - 06:00 PM',
  ]);
  const [timeSlot, setTimeSlot] = useState<string>('08:00 AM - 09:00 AM');

  // Step 5 Address & Contact Validation State
  const [savedAddresses, setSavedAddresses] = useState<
    { houseFlat: string; area: string; pincode: string; contact: string }[]
  >([]);
  const [addressMode, setAddressMode] = useState<'SAVED' | 'NEW'>('NEW');
  const [houseFlat, setHouseFlat] = useState<string>('');
  const [streetArea, setStreetArea] = useState<string>('Sector 11, Pratap Nagar');
  const [landmark, setLandmark] = useState<string>('');
  const [city, setCity] = useState<string>('Jaipur');
  const [pincode, setPincode] = useState<string>('302033');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // Processing & Confirmation State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [confirmedSummary, setConfirmedSummary] = useState<ConfirmedBookingSummary | null>(null);

  const stepLabels = [
    { num: 1, label: 'Test' },
    { num: 2, label: 'Patient' },
    { num: 3, label: 'Service' },
    { num: 4, label: 'Date & Time' },
    { num: 5, label: 'Address' },
    { num: 6, label: 'Review' },
    { num: 7, label: 'Confirmation' },
  ];

  // Load dynamic time slots from database settings + saved patients & addresses
  useEffect(() => {
    fetchCenterSettings()
      .then((settings: any) => {
        if (settings.available_time_slots && settings.available_time_slots.length > 0) {
          setAvailableTimeSlots(settings.available_time_slots);
          setTimeSlot(settings.available_time_slots[0]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      if (user.phone && !contactNumber) {
        setContactNumber(user.phone.replace(/\D/g, '').slice(-10));
      }
      getPatientsForUser(user.uid).then((list) => {
        setSavedPatients(list);
        if (list.length > 0 && !selectedPatient) {
          const selfProfile =
            list.find((p) => p.relation === 'Self' && p.is_active) ||
            list.find((p) => p.is_active) ||
            list[0];
          setSelectedPatient(selfProfile);
        }
      });

      // Load previous booking addresses so user can select "Use saved address"
      getBookingsForUser(user.uid).then((bookings) => {
        const addrMap = new Map<
          string,
          { houseFlat: string; area: string; pincode: string; contact: string }
        >();
        bookings.forEach((b) => {
          if (b.home_address && b.home_address.trim()) {
            const key = `${b.home_address.trim()}-${b.pincode || '302033'}`;
            if (!addrMap.has(key)) {
              addrMap.set(key, {
                houseFlat: b.home_address.trim(),
                area: b.area || 'Pratap Nagar, Jaipur',
                pincode: b.pincode || '302033',
                contact: b.patient_phone_snapshot || user.phone || '',
              });
            }
          }
        });
        const list = Array.from(addrMap.values());
        setSavedAddresses(list);
        if (list.length > 0 && !houseFlat) {
          setAddressMode('SAVED');
          setHouseFlat(list[0].houseFlat);
          setStreetArea(list[0].area);
          setPincode(list[0].pincode);
          if (list[0].contact) setContactNumber(list[0].contact.replace(/\D/g, '').slice(-10));
        }
      });
    }
  }, [user]);

  // Step 1 Inline Test Search Effect
  useEffect(() => {
    if (!inlineSearch.trim()) {
      setInlineResults([]);
      setIsSearchingTests(false);
      return;
    }
    let cancelled = false;
    setIsSearchingTests(true);
    const timer = setTimeout(() => {
      queryTestsPaginated({
        page: 1,
        pageSize: 6,
        search: inlineSearch.trim(),
        activeOnly: true,
        sortBy: 'name',
      })
        .then((res) => {
          if (!cancelled) {
            setInlineResults(res.items);
            setIsSearchingTests(false);
          }
        })
        .catch(() => {
          if (!cancelled) setIsSearchingTests(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inlineSearch]);

  const handleAddRateRecord = (record: RateRecord) => {
    const testObj: DiagnosticTest = {
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
    };
    onAddTest(testObj);
  };

  // Ensure a "Self" patient record exists if user picks "Myself" and has none yet
  const handleSelectMyself = async () => {
    setPatientMode('MYSELF');
    const existingSelf = savedPatients.find((p) => p.relation === 'Self');
    if (existingSelf) {
      setSelectedPatient(existingSelf);
      return;
    }
    if (!user) return;
    setCreatingSelfProfile(true);
    try {
      const created = await createPatientRecord({
        userId: user.uid,
        fullName: user.displayName || 'Self Patient',
        age: 30,
        gender: 'Male',
        relation: 'Self',
        phone: user.phone || '',
      });
      setSavedPatients((prev) => [created, ...prev]);
      setSelectedPatient(created);
    } catch {
      // Fallback to Other mode if self creation needs explicit fields
      setPatientMode('OTHER');
    } finally {
      setCreatingSelfProfile(false);
    }
  };

  const totalAmount = selectedTests.reduce((acc, t) => acc + t.price, 0);

  // Validate Step 5 Address & Contact
  const validateStep5 = (): boolean => {
    const errs: Record<string, string> = {};
    const cleanPhone = contactNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errs.contactNumber = 'Please enter a valid 10-digit Indian mobile number.';
    }

    if (collectionType === 'HOME_COLLECTION') {
      if (!houseFlat.trim()) {
        errs.houseFlat = 'House / Flat number is required.';
      }
      if (!streetArea.trim()) {
        errs.streetArea = 'Street / Area is required.';
      }
      if (!city.trim()) {
        errs.city = 'City is required.';
      }
      if (!/^\d{6}$/.test(pincode.trim())) {
        errs.pincode = 'Please enter a valid 6-digit Indian pincode.';
      }
    }

    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Final Booking Submission
  const handleConfirmBooking = async () => {
    if (!user) {
      setErrorMessage('Please login or register to continue booking.');
      return;
    }
    if (!selectedPatient) {
      setErrorMessage('Please select or add a patient profile.');
      return;
    }
    if (selectedTests.length === 0) {
      setErrorMessage('Please select at least one diagnostic test.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const snapshotTests = selectedTests.map((t) => ({
      id: t.id,
      name: t.name,
      price: t.price,
    }));

    const fullHomeAddress =
      collectionType === 'HOME_COLLECTION'
        ? `${houseFlat.trim()}${landmark.trim() ? `, Near ${landmark.trim()}` : ''}`
        : undefined;

    try {
      const order = await createBookingOrder({
        userId: user.uid,
        patientId: selectedPatient.patient_id,
        collectionType,
        bookingDate,
        timeSlot,
        homeAddress: fullHomeAddress,
        area: collectionType === 'HOME_COLLECTION' ? `${streetArea.trim()}, ${city.trim()}` : undefined,
        pincode: collectionType === 'HOME_COLLECTION' ? pincode.trim() : undefined,
        notes: `Contact: +91 ${contactNumber.trim()}`,
        selectedTestIds: selectedTests.map((t) => t.id),
      });

      setConfirmedSummary({
        bookingId: order.booking_id,
        patientName: selectedPatient.full_name,
        patientDetails: `${selectedPatient.age} Yrs · ${selectedPatient.gender} · ${selectedPatient.relation}`,
        tests: snapshotTests,
        totalAmount,
        bookingDate,
        timeSlot,
        collectionType,
        address:
          collectionType === 'HOME_COLLECTION'
            ? `${fullHomeAddress}, ${streetArea.trim()}, ${city.trim()} - ${pincode.trim()}`
            : BUSINESS_INFO.address,
        contactNumber: contactNumber.trim(),
        status: order.status || 'CONFIRMED',
      });

      setCurrentStep(7);
      onClearSelectedTests();
    } catch (err: any) {
      setErrorMessage(err.message || 'Booking submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* 7-STEP VISUAL PROGRESS INDICATOR */}
      <div
        className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3"
        aria-label="Booking progress"
      >
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#0F294A]">
            Step {currentStep} of 7: {stepLabels[currentStep - 1]?.label}
          </span>
          <span className="text-slate-500 font-semibold tabular-nums">
            {Math.round((currentStep / 7) * 100)}% Complete
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#059669] transition-all duration-200"
            style={{ width: `${(currentStep / 7) * 100}%` }}
          />
        </div>

        {/* Step Circles: Completed = Green check, Current = Navy circle, Upcoming = Light gray circle */}
        <div className="grid grid-cols-7 gap-1 pt-1 text-[11px]">
          {stepLabels.map((s) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                className={`flex flex-col sm:flex-row items-center gap-1.5 truncate ${
                  isCurrent
                    ? 'font-bold text-[#0F294A]'
                    : isDone
                    ? 'font-semibold text-[#059669]'
                    : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums transition-colors ${
                    isCurrent
                      ? 'bg-[#0F294A] text-white ring-2 ring-[#0F294A]/20'
                      : isDone
                      ? 'bg-[#059669] text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.num}
                </span>
                <span className="truncate hidden sm:inline">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* MAIN TWO-COLUMN LAYOUT FOR STEPS 1-6 (Left: Active Step, Right: Sticky Booking Summary) */}
      {currentStep < 7 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN (8 Cols): Step Forms */}
          <div className="lg:col-span-8 space-y-6">
            {/* ==============================================================
                STEP 1 — TEST / PACKAGE
            ============================================================== */}
            {currentStep === 1 && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h1 className="text-lg sm:text-xl font-extrabold text-[#0F294A]">
                      Step 1: Select Diagnostic Test or Package
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Search and add diagnostic tests below or browse the complete catalogue.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={onNavigateToCatalog}>
                    Browse Full Catalogue
                  </Button>
                </div>

                {/* Inline Test Search */}
                <div className="space-y-3">
                  <div className="relative">
                    <label htmlFor="booking-step1-search" className="sr-only">
                      Search for CBC, Thyroid, Blood Sugar
                    </label>
                    <Search
                      className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      id="booking-step1-search"
                      type="text"
                      placeholder="Search for CBC, Thyroid, Blood Sugar..."
                      value={inlineSearch}
                      onChange={(e) => setInlineSearch(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F294A]"
                    />
                    {inlineSearch && (
                      <button
                        type="button"
                        onClick={() => setInlineSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {inlineSearch.trim() !== '' && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                      {isSearchingTests ? (
                        <div className="p-4 text-xs text-slate-500 text-center">
                          Searching tests...
                        </div>
                      ) : inlineResults.length === 0 ? (
                        <div className="p-4 text-xs text-slate-500 text-center">
                          No matching tests found for "{inlineSearch}".
                        </div>
                      ) : (
                        inlineResults.map((rec) => {
                          const alreadyAdded = selectedTests.some((t) => t.id === rec.test_id);
                          return (
                            <div
                              key={rec.test_id}
                              className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 text-xs"
                            >
                              <div>
                                <span className="font-bold text-[#0F294A] block">
                                  {rec.test_name}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  Sample: {rec.sample || 'Blood'} · Report:{' '}
                                  {rec.reporting_time || 'Same Day'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-extrabold text-[#0F294A] tabular-nums">
                                  ₹{rec.general_price ?? 0}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    alreadyAdded
                                      ? onRemoveTest(rec.test_id)
                                      : handleAddRateRecord(rec)
                                  }
                                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                    alreadyAdded
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                      : 'bg-[#059669] text-white hover:bg-[#047857]'
                                  }`}
                                >
                                  {alreadyAdded ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Added</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Tests List */}
                {selectedTests.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
                    <Droplet className="w-8 h-8 text-slate-400 mx-auto" aria-hidden="true" />
                    <p className="text-xs font-semibold text-slate-700">
                      No diagnostic tests selected yet. Search above or browse our test catalogue.
                    </p>
                    <Button variant="secondary" size="sm" onClick={onNavigateToCatalog}>
                      Browse Test Catalogue
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">
                      Selected Test(s) ({selectedTests.length})
                    </span>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {selectedTests.map((t) => (
                        <div
                          key={t.id}
                          className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 text-xs"
                        >
                          <div>
                            <h3 className="font-bold text-slate-900">{t.name}</h3>
                            <span className="text-[11px] text-slate-500">
                              {t.category} · Sample: {t.sampleType || 'Blood'} · Report:{' '}
                              {t.turnaroundTime || 'Same Day'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-bold text-[#0F294A] tabular-nums">
                              ₹{t.price}
                            </span>
                            <button
                              type="button"
                              onClick={() => onRemoveTest(t.id)}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded cursor-pointer"
                              aria-label={`Remove ${t.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <Button variant="outline" size="md" onClick={onNavigateToCatalog}>
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Tests</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    disabled={selectedTests.length === 0}
                    onClick={() => {
                      setErrorMessage('');
                      setCurrentStep(2);
                    }}
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ==============================================================
                STEP 2 — PATIENT ("Who is this test for?")
            ============================================================== */}
            {currentStep === 2 && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#0F294A]">
                    Who is this test for?
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Select Myself or choose/add another family member profile.
                  </p>
                </div>

                {!user ? (
                  <div className="p-6 bg-amber-50/70 rounded-xl border border-amber-200 text-center space-y-4">
                    <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                      <Lock className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[#0F294A]">
                        Please login or register to continue booking.
                      </h3>
                      <p className="text-xs text-slate-600 max-w-md mx-auto">
                        Sign in to your B.L. Diagnostic Center account to save patient details and access your booking confirmation and digital reports.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 pt-1">
                      <Button variant="secondary" size="md" onClick={() => onNavigate('login')}>
                        Login
                      </Button>
                      <Button variant="primary" size="md" onClick={() => onNavigate('register')}>
                        Register
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Myself / Other Patient Selector */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={creatingSelfProfile}
                        onClick={handleSelectMyself}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          patientMode === 'MYSELF' && selectedPatient?.relation === 'Self'
                            ? 'bg-emerald-50/70 border-[#059669] ring-1 ring-[#059669]'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <User className="w-5 h-5 text-[#059669]" />
                          <div>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                              Myself
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {user.displayName}
                            </span>
                          </div>
                        </div>
                        {patientMode === 'MYSELF' && selectedPatient?.relation === 'Self' && (
                          <Check className="w-4 h-4 text-[#059669] stroke-[2.5]" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setPatientMode('OTHER')}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          patientMode === 'OTHER' ||
                          (selectedPatient && selectedPatient.relation !== 'Self')
                            ? 'bg-emerald-50/70 border-[#059669] ring-1 ring-[#059669]'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <User className="w-5 h-5 text-[#0F294A]" />
                          <div>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                              Other Patient
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Family member or relative
                            </span>
                          </div>
                        </div>
                        {(patientMode === 'OTHER' ||
                          (selectedPatient && selectedPatient.relation !== 'Self')) && (
                          <Check className="w-4 h-4 text-[#059669] stroke-[2.5]" />
                        )}
                      </button>
                    </div>

                    {/* Saved Patients & Add New Patient Manager */}
                    <PatientManager
                      isSelectionMode={true}
                      selectedPatientId={selectedPatient?.patient_id}
                      onSelectPatient={(p) => {
                        setSelectedPatient(p);
                        setPatientMode(p.relation === 'Self' ? 'MYSELF' : 'OTHER');
                      }}
                    />
                  </>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <Button variant="outline" size="md" onClick={() => setCurrentStep(1)}>
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    disabled={!user || !selectedPatient}
                    onClick={() => {
                      setErrorMessage('');
                      setCurrentStep(3);
                    }}
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ==============================================================
                STEP 3 — COLLECTION METHOD ("Choose Collection Method")
            ============================================================== */}
            {currentStep === 3 && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#0F294A]">
                    Choose Collection Method
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Select whether you would like to visit our center or request doorstep sample collection.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CENTER VISIT */}
                  <button
                    type="button"
                    onClick={() => setCollectionType('CENTER_VISIT')}
                    className={`p-5 rounded-xl border text-left transition-all space-y-2.5 cursor-pointer ${
                      collectionType === 'CENTER_VISIT'
                        ? 'bg-emerald-50/70 border-[#059669] ring-1 ring-[#059669]'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#0F294A] flex items-center justify-center">
                        <Building2 className="w-5 h-5" aria-hidden="true" />
                      </div>
                      {collectionType === 'CENTER_VISIT' && (
                        <span className="w-6 h-6 rounded-full bg-[#059669] text-white flex items-center justify-center">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-[#0F294A] text-sm uppercase tracking-wide">
                      CENTER VISIT
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Visit our diagnostic center at Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur.
                    </p>
                  </button>

                  {/* HOME COLLECTION */}
                  <button
                    type="button"
                    onClick={() => setCollectionType('HOME_COLLECTION')}
                    className={`p-5 rounded-xl border text-left transition-all space-y-2.5 cursor-pointer ${
                      collectionType === 'HOME_COLLECTION'
                        ? 'bg-emerald-50/70 border-[#059669] ring-1 ring-[#059669]'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Home className="w-5 h-5" aria-hidden="true" />
                      </div>
                      {collectionType === 'HOME_COLLECTION' && (
                        <span className="w-6 h-6 rounded-full bg-[#059669] text-white flex items-center justify-center">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-[#0F294A] text-sm uppercase tracking-wide">
                      HOME COLLECTION
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Sample collected from your home at your preferred date and time slot.
                    </p>
                  </button>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <Button variant="outline" size="md" onClick={() => setCurrentStep(2)}>
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setErrorMessage('');
                      setCurrentStep(4);
                    }}
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ==============================================================
                STEP 4 — DATE & TIME ("Select Date & Time")
            ============================================================== */}
            {currentStep === 4 && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#0F294A]">
                    Select Date &amp; Time
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Choose your appointment date and available time slot.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="booking-date-input"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Select Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="booking-date-input"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full sm:w-64 px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] font-semibold tabular-nums"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-700 mb-2">
                      Available Time Slots <span className="text-red-600">*</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {availableTimeSlots.map((slot) => {
                        const selected = timeSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setTimeSlot(slot)}
                            className={`p-3.5 rounded-xl border text-xs text-left transition-all cursor-pointer flex items-center justify-between ${
                              selected
                                ? 'bg-emerald-50/80 border-[#059669] text-emerald-950 ring-1 ring-[#059669]'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <span className="font-bold block">{slot}</span>
                              <span className="text-[11px] text-emerald-700 font-medium">
                                Available
                              </span>
                            </div>
                            {selected && (
                              <span className="w-5 h-5 rounded-full bg-[#059669] text-white flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <Button variant="outline" size="md" onClick={() => setCurrentStep(3)}>
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    disabled={!bookingDate || !timeSlot}
                    onClick={() => {
                      setErrorMessage('');
                      setCurrentStep(5);
                    }}
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ==============================================================
                STEP 5 — ADDRESS ("Collection Address")
            ============================================================== */}
            {currentStep === 5 && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#0F294A]">
                    {collectionType === 'HOME_COLLECTION'
                      ? 'Collection Address'
                      : 'Diagnostic Center Location & Contact'}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {collectionType === 'HOME_COLLECTION'
                      ? 'Provide the complete doorstep address for sample collection.'
                      : 'Confirm our center address and your contact number for appointment updates.'}
                  </p>
                </div>

                {collectionType === 'HOME_COLLECTION' ? (
                  <div className="space-y-4">
                    {/* Saved Address Selector if available */}
                    {savedAddresses.length > 0 && (
                      <div className="space-y-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setAddressMode('SAVED');
                              const first = savedAddresses[0];
                              setHouseFlat(first.houseFlat);
                              setStreetArea(first.area);
                              setPincode(first.pincode);
                            }}
                            className={`px-3 py-1.5 rounded-lg font-bold border cursor-pointer ${
                              addressMode === 'SAVED'
                                ? 'bg-emerald-50 border-[#059669] text-emerald-900'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            Use saved address
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddressMode('NEW');
                              setHouseFlat('');
                              setLandmark('');
                            }}
                            className={`px-3 py-1.5 rounded-lg font-bold border cursor-pointer ${
                              addressMode === 'NEW'
                                ? 'bg-emerald-50 border-[#059669] text-emerald-900'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            Add new address
                          </button>
                        </div>

                        {addressMode === 'SAVED' && (
                          <div className="grid grid-cols-1 gap-2 pt-1">
                            {savedAddresses.map((addr, idx) => {
                              const isChosen =
                                houseFlat === addr.houseFlat && pincode === addr.pincode;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setHouseFlat(addr.houseFlat);
                                    setStreetArea(addr.area);
                                    setPincode(addr.pincode);
                                  }}
                                  className={`p-3 rounded-lg border text-left text-xs flex items-center justify-between cursor-pointer ${
                                    isChosen
                                      ? 'bg-emerald-50/60 border-[#059669]'
                                      : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <div>
                                    <span className="font-bold text-slate-900 block">
                                      {addr.houseFlat}
                                    </span>
                                    <span className="text-slate-600">
                                      {addr.area} - {addr.pincode}
                                    </span>
                                  </div>
                                  {isChosen && (
                                    <Check className="w-4 h-4 text-[#059669] shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="addr-house-flat"
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          House / Flat <span className="text-red-600">*</span>
                        </label>
                        <input
                          id="addr-house-flat"
                          type="text"
                          placeholder="e.g. House No. 42, Block B"
                          value={houseFlat}
                          onChange={(e) => setHouseFlat(e.target.value)}
                          className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] ${
                            addressErrors.houseFlat ? 'border-red-500' : 'border-slate-300'
                          }`}
                        />
                        {addressErrors.houseFlat && (
                          <p className="text-xs text-red-600 mt-1">{addressErrors.houseFlat}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="addr-street-area"
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Street / Area <span className="text-red-600">*</span>
                        </label>
                        <input
                          id="addr-street-area"
                          type="text"
                          placeholder="e.g. Sector 11, Pratap Nagar"
                          value={streetArea}
                          onChange={(e) => setStreetArea(e.target.value)}
                          className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] ${
                            addressErrors.streetArea ? 'border-red-500' : 'border-slate-300'
                          }`}
                        />
                        {addressErrors.streetArea && (
                          <p className="text-xs text-red-600 mt-1">{addressErrors.streetArea}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="addr-landmark"
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Landmark
                        </label>
                        <input
                          id="addr-landmark"
                          type="text"
                          placeholder="e.g. Near Post Office"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="addr-city"
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          City <span className="text-red-600">*</span>
                        </label>
                        <input
                          id="addr-city"
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] ${
                            addressErrors.city ? 'border-red-500' : 'border-slate-300'
                          }`}
                        />
                        {addressErrors.city && (
                          <p className="text-xs text-red-600 mt-1">{addressErrors.city}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="addr-pincode"
                          className="block text-xs font-semibold text-slate-700 mb-1"
                        >
                          Pincode <span className="text-red-600">*</span>
                        </label>
                        <input
                          id="addr-pincode"
                          type="text"
                          maxLength={6}
                          placeholder="302033"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                          className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] tabular-nums ${
                            addressErrors.pincode ? 'border-red-500' : 'border-slate-300'
                          }`}
                        />
                        {addressErrors.pincode && (
                          <p className="text-xs text-red-600 mt-1">{addressErrors.pincode}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-[#0F294A] text-sm">
                      <MapPin className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                      <span>{BUSINESS_INFO.name}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-6">
                      Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur - 302033
                    </p>
                    <p className="text-slate-500 pl-6 tabular-nums">
                      Phone: {BUSINESS_INFO.phone}
                    </p>
                  </div>
                )}

                {/* Contact Number (Required for both Home Collection & Center Visit) */}
                <div>
                  <label
                    htmlFor="addr-contact-number"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Contact Number (10-digit Indian Mobile) <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="addr-contact-number"
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, ''))}
                    className={`w-full sm:w-72 px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] tabular-nums ${
                      addressErrors.contactNumber ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {addressErrors.contactNumber && (
                    <p className="text-xs text-red-600 mt-1">{addressErrors.contactNumber}</p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <Button variant="outline" size="md" onClick={() => setCurrentStep(4)}>
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      if (validateStep5()) {
                        setErrorMessage('');
                        setCurrentStep(6);
                      }
                    }}
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ==============================================================
                STEP 6 — REVIEW ("Booking Summary")
            ============================================================== */}
            {currentStep === 6 && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#0F294A]">
                    Booking Summary
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Review your booking details below before confirming.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Patient */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        Patient
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {selectedPatient?.full_name}
                      </h3>
                      <p className="text-slate-600">
                        {selectedPatient?.age} Yrs · {selectedPatient?.gender} ·{' '}
                        {selectedPatient?.relation}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Collection Method & Date/Time */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        Collection Method, Date &amp; Time
                      </span>
                      <p className="text-emerald-800 font-bold">
                        {collectionType === 'HOME_COLLECTION'
                          ? 'Home Collection'
                          : 'Center Visit'}
                      </p>
                      <p className="font-bold text-slate-900 tabular-nums">
                        Date: {bookingDate} · Time: {timeSlot}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Address & Contact Number */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        Address &amp; Contact Number
                      </span>
                      <p className="font-semibold text-slate-900">
                        {collectionType === 'HOME_COLLECTION'
                          ? `${houseFlat}${
                              landmark ? `, Near ${landmark}` : ''
                            }, ${streetArea}, ${city} - ${pincode}`
                          : BUSINESS_INFO.address}
                      </p>
                      <p className="text-slate-600 tabular-nums">
                        Contact Number: +91 {contactNumber}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(5)}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Price Breakdown */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Test / Package ({selectedTests.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {selectedTests.map((t) => (
                        <div key={t.id} className="py-2 flex justify-between items-center">
                          <span className="font-medium text-slate-900">{t.name}</span>
                          <span className="font-bold text-slate-900 tabular-nums">
                            ₹{t.price}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Test Charges</span>
                        <span className="font-semibold tabular-nums">₹{totalAmount}</span>
                      </div>
                      <div className="flex justify-between items-center font-extrabold text-sm text-[#0F294A] pt-1 border-t border-slate-100">
                        <span>Total</span>
                        <span className="text-lg tabular-nums">₹{totalAmount}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0F294A]">
                        Payment: Pay at Center
                      </span>
                      <span className="text-slate-500">No online payment required</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <Button variant="outline" size="md" onClick={() => setCurrentStep(5)}>
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="lg"
                    isLoading={isSubmitting}
                    onClick={handleConfirmBooking}
                  >
                    <span>Confirm Booking ✓</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (4 Cols): STICKY BOOKING SUMMARY ON DESKTOP */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-[#0F294A]">Booking Summary</h2>
                <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                  {selectedTests.length} {selectedTests.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              {selectedTests.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">
                  Select diagnostic tests or a health package to see your summary.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-100 text-xs">
                  {selectedTests.map((t) => (
                    <div key={t.id} className="py-2 flex justify-between items-start gap-2">
                      <span className="font-semibold text-slate-800">{t.name}</span>
                      <span className="font-bold text-[#0F294A] tabular-nums shrink-0">
                        ₹{t.price}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                {selectedPatient && (
                  <div className="flex justify-between text-slate-600">
                    <span>Patient:</span>
                    <span className="font-bold text-slate-900">
                      {selectedPatient.full_name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Collection:</span>
                  <span className="font-semibold text-emerald-800">
                    {collectionType === 'HOME_COLLECTION'
                      ? 'Home Collection'
                      : 'Center Visit'}
                  </span>
                </div>
                {bookingDate && (
                  <div className="flex justify-between text-slate-600">
                    <span>Schedule:</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {bookingDate}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-3 flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-700">Total</span>
                <span className="text-xl font-extrabold text-[#0F294A] tabular-nums">
                  ₹{totalAmount}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 font-medium">
                Payment: Pay at Center / Sample Collection
              </p>
            </div>
          </aside>
        </div>
      ) : (
        /* ==============================================================
           STEP 7 — BOOKING CONFIRMATION
        ============================================================== */
        confirmedSummary && (
          <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-2xs space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-extrabold text-[#0F294A]">
                Booking Confirmed
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Your booking has been successfully submitted.
              </p>
            </div>

            {/* Booking ID Highlight */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center space-y-1 max-w-md mx-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                Booking ID
              </span>
              <span className="text-2xl font-mono font-extrabold text-[#0F294A] tracking-wider block tabular-nums">
                {confirmedSummary.bookingId}
              </span>
            </div>

            {/* Complete Confirmation Details */}
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              <div className="p-3.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-slate-500 font-medium">Patient</span>
                <span className="font-bold text-slate-900">
                  {confirmedSummary.patientName} ({confirmedSummary.patientDetails})
                </span>
              </div>

              <div className="p-3.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-slate-500 font-medium">Collection Method</span>
                <span className="font-bold text-emerald-800">
                  {confirmedSummary.collectionType === 'HOME_COLLECTION'
                    ? 'Home Collection'
                    : 'Center Visit'}
                </span>
              </div>

              <div className="p-3.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-slate-500 font-medium">Date</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {confirmedSummary.bookingDate}
                </span>
              </div>

              <div className="p-3.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-slate-500 font-medium">Time</span>
                <span className="font-bold text-slate-900">{confirmedSummary.timeSlot}</span>
              </div>

              {confirmedSummary.address && (
                <div className="p-3.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-slate-500 font-medium">Address</span>
                  <span className="font-semibold text-slate-800 sm:text-right max-w-md">
                    {confirmedSummary.address}
                  </span>
                </div>
              )}

              <div className="p-3.5 space-y-2">
                <span className="text-slate-500 font-medium block">
                  Test / Package ({confirmedSummary.tests.length})
                </span>
                <div className="space-y-1">
                  {confirmedSummary.tests.map((t) => (
                    <div key={t.id} className="flex justify-between text-slate-800">
                      <span>{t.name}</span>
                      <span className="font-bold tabular-nums">₹{t.price}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between font-extrabold text-sm text-[#0F294A]">
                  <span>Total (Payment: Pay at Center)</span>
                  <span className="tabular-nums">₹{confirmedSummary.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Required Action Buttons: View Booking, My Bookings, Back to Home */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('dashboard', confirmedSummary.bookingId)}
              >
                View Booking
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => onNavigate('dashboard', 'bookings')}
              >
                My Bookings
              </Button>

              <Button variant="outline" size="md" onClick={() => onNavigate('home')}>
                Back to Home
              </Button>
            </div>
          </div>
        )
      )}
    </div>
  );
};
