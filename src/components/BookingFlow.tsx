import React, { useState } from 'react';
import { 
  DiagnosticTest, 
  PatientInfo, 
  Booking,
  BUSINESS_INFO 
} from '../types';
import { TIME_SLOTS, OFFICIAL_RATE_LIST } from '../data/rateList';
import { createBooking } from '../services/bookingService';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Download,
  Info,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BookingFlowProps {
  selectedTests: DiagnosticTest[];
  onAddTest: (test: DiagnosticTest) => void;
  onRemoveTest: (testId: string) => void;
  onClearSelectedTests: () => void;
  onNavigateToCatalog: () => void;
  onNavigateToTracking: (bookingId: string) => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  selectedTests,
  onAddTest,
  onRemoveTest,
  onClearSelectedTests,
  onNavigateToCatalog,
  onNavigateToTracking
}) => {
  // Step navigation: 1: Test, 2: Patient, 3: Date, 4: Time, 5: Collection Mode, 6: Address, 7: Review, 8: Confirmed
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Form states
  const [patient, setPatient] = useState<PatientInfo>({
    fullName: '',
    age: 28,
    gender: 'Male',
    phone: '',
    email: '',
    relation: 'Self'
  });

  // Default to tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [bookingDate, setBookingDate] = useState<string>(defaultDateStr);
  const [timeSlot, setTimeSlot] = useState<string>(TIME_SLOTS[0]);
  const [collectionType, setCollectionType] = useState<'Home Collection' | 'Center Visit'>('Home Collection');
  
  const [address, setAddress] = useState({
    street: '',
    landmark: '',
    pincode: '302033', // Default local pincode for Pratap Nagar
    city: 'Jaipur'
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const totalAmount = selectedTests.reduce((acc, t) => acc + t.price, 0);

  // Step 1 Validation
  const validateStep1 = () => {
    if (selectedTests.length === 0) {
      setFormErrors({ tests: 'Please select at least one test to proceed.' });
      return false;
    }
    setFormErrors({});
    return true;
  };

  // Step 2 Validation (Patient)
  const validateStep2 = () => {
    const errors: { [key: string]: string } = {};
    if (!patient.fullName.trim()) errors.fullName = 'Full Name is required.';
    if (!patient.age || patient.age < 1 || patient.age > 120) errors.age = 'Enter a valid age (1-120).';
    if (!patient.phone.trim() || !/^\d{10}$/.test(patient.phone.replace(/\D/g, ''))) {
      errors.phone = 'Valid 10-digit mobile number required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 3 Validation (Date)
  const validateStep3 = () => {
    if (!bookingDate) {
      setFormErrors({ date: 'Please choose an appointment date.' });
      return false;
    }
    setFormErrors({});
    return true;
  };

  // Step 4 Validation (Time Slot)
  const validateStep4 = () => {
    if (!timeSlot) {
      setFormErrors({ timeSlot: 'Please choose an appointment time slot.' });
      return false;
    }
    setFormErrors({});
    return true;
  };

  // Step 5 & 6 Validation (Address if Home Collection)
  const validateAddress = () => {
    if (collectionType === 'Home Collection') {
      const errors: { [key: string]: string } = {};
      if (!address.street.trim()) errors.street = 'Street address / house number is required.';
      if (!address.pincode.trim() || address.pincode.length < 6) errors.pincode = 'Valid 6-digit pincode is required.';
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    }
    setFormErrors({});
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;
    if (currentStep === 5) {
      // If Center Visit, skip Address step directly to Review (step 7)
      if (collectionType === 'Center Visit') {
        setCurrentStep(7);
        return;
      }
    }
    if (currentStep === 6 && !validateAddress()) return;

    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep === 7 && collectionType === 'Center Visit') {
      setCurrentStep(5);
      return;
    }
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    try {
      const newBooking = await createBooking({
        tests: selectedTests,
        patient,
        bookingDate,
        timeSlot,
        collectionType,
        address: collectionType === 'Home Collection' ? address : undefined,
        totalAmount
      });

      setConfirmedBooking(newBooking);
      setCurrentStep(8);
      onClearSelectedTests();

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore confetti failure
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      alert('Unable to submit booking. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = [
    '1. Select Test',
    '2. Patient',
    '3. Date',
    '4. Time',
    '5. Collection Mode',
    '6. Address',
    '7. Review',
    '8. Confirm'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Stepper Progress Bar */}
      {currentStep < 8 && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Step {currentStep} of 7: {stepLabels[currentStep - 1]}</span>
            <span className="text-emerald-700 font-bold">{Math.round((currentStep / 7) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 7) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* STEP 1: SELECT TEST */}
      {currentStep === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Step 1: Select Diagnostic Tests</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review your selected tests or add more from the official rate list.
              </p>
            </div>
            <button
              onClick={onNavigateToCatalog}
              className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Browse Full Catalog
            </button>
          </div>

          {selectedTests.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-slate-50 rounded-xl p-6 border border-dashed border-slate-300">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No tests selected yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Please pick at least one test or health package from the catalog to book an appointment.
              </p>
              <button
                onClick={onNavigateToCatalog}
                className="bg-[#0F294A] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#16365D] transition-all inline-block"
              >
                Go to Test Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {selectedTests.map(test => (
                  <div key={test.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{test.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{test.code}</span>
                        <span>{test.sampleType}</span>
                        {test.fastingRequired && (
                          <span className="text-amber-700 font-medium">Fasting Req.</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-base font-extrabold text-[#0F294A]">₹{test.price}</span>
                      <button
                        onClick={() => onRemoveTest(test.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                        title="Remove Test"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Total Rate ({selectedTests.length} tests):</span>
                <span className="text-xl font-black text-[#0F294A]">₹{totalAmount}</span>
              </div>
            </div>
          )}

          {formErrors.tests && (
            <p className="text-xs text-red-600 font-semibold">{formErrors.tests}</p>
          )}

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleNext}
              disabled={selectedTests.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-xs"
            >
              Continue to Patient Info
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT PATIENT */}
      {currentStep === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Step 2: Patient Information</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter patient details accurately for sample labeling and report generation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar Sharma"
                value={patient.fullName}
                onChange={(e) => setPatient({ ...patient, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F294A] focus:outline-hidden"
              />
              {formErrors.fullName && <p className="text-xs text-red-600 mt-1">{formErrors.fullName}</p>}
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age (Years) *
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={patient.age || ''}
                onChange={(e) => setPatient({ ...patient, age: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F294A] focus:outline-hidden"
              />
              {formErrors.age && <p className="text-xs text-red-600 mt-1">{formErrors.age}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender *
              </label>
              <select
                value={patient.gender}
                onChange={(e) => setPatient({ ...patient, gender: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F294A] focus:outline-hidden bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                10-Digit Mobile Number *
              </label>
              <input
                type="tel"
                placeholder="e.g. 9829012345"
                maxLength={10}
                value={patient.phone}
                onChange={(e) => setPatient({ ...patient, phone: e.target.value.replace(/\D/g, '') })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F294A] focus:outline-hidden"
              />
              {formErrors.phone && <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>}
            </div>

            {/* Relation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relation
              </label>
              <select
                value={patient.relation}
                onChange={(e) => setPatient({ ...patient, relation: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F294A] focus:outline-hidden bg-white"
              >
                <option value="Self">Self</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={handleBack}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-xs"
            >
              Select Appointment Date
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SELECT DATE */}
      {currentStep === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Step 3: Select Appointment Date</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose your preferred date for sample collection.
            </p>
          </div>

          <div className="max-w-md space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Appointment Date *
            </label>
            <div className="relative">
              <CalendarIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-[#0F294A] focus:outline-hidden"
              />
            </div>
            {formErrors.date && <p className="text-xs text-red-600">{formErrors.date}</p>}
            <p className="text-xs text-slate-500">
              Center Timings: {BUSINESS_INFO.timings}
            </p>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={handleBack}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-xs"
            >
              Select Time Slot
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SELECT TIME */}
      {currentStep === 4 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Step 4: Select Preferred Time Slot</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Morning slots are recommended for fasting blood samples (sugar, lipid, LFT).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TIME_SLOTS.map((slot) => {
              const isSelected = timeSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTimeSlot(slot)}
                  className={`p-3.5 rounded-xl text-left border text-xs font-semibold flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {slot}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
              );
            })}
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={handleBack}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-xs"
            >
              Choose Collection Mode
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: HOME COLLECTION / CENTER VISIT */}
      {currentStep === 5 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Step 5: Sample Collection Mode</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose whether you want our phlebotomist to collect samples at your home or visit our center.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Home Collection Option */}
            <div
              onClick={() => setCollectionType('Home Collection')}
              className={`cursor-pointer p-5 rounded-2xl border-2 transition-all ${
                collectionType === 'Home Collection'
                  ? 'bg-emerald-50/60 border-emerald-600 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-700" />
                </div>
                {collectionType === 'Home Collection' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-3">Home Sample Collection</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Trained phlebotomist visits your doorstep with sterile collection kit.
              </p>
              <span className="inline-block mt-3 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Available in Pratap Nagar & nearby Jaipur
              </span>
            </div>

            {/* Center Visit Option */}
            <div
              onClick={() => setCollectionType('Center Visit')}
              className={`cursor-pointer p-5 rounded-2xl border-2 transition-all ${
                collectionType === 'Center Visit'
                  ? 'bg-[#0F294A]/5 border-[#0F294A] shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#0F294A]" />
                </div>
                {collectionType === 'Center Visit' && (
                  <CheckCircle2 className="w-5 h-5 text-[#0F294A]" />
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-3">Center Visit</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Visit B.L. Diagnostic Center directly at Kumbha Marg, Pratap Nagar.
              </p>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                {BUSINESS_INFO.address}
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={handleBack}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-xs"
            >
              {collectionType === 'Home Collection' ? 'Enter Home Address' : 'Review Appointment'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: ADDRESS (If Home Collection) */}
      {currentStep === 6 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Step 6: Home Collection Address</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Provide exact address details for phlebotomist arrival.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                House / Flat No., Building, Street Name *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Flat 302, Green Avenue, Sector 11, Kumbha Marg"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F294A] focus:outline-hidden"
              />
              {formErrors.street && <p className="text-xs text-red-600 mt-1">{formErrors.street}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Post Office / Sector 11 Market"
                  value={address.landmark}
                  onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F294A] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0F294A] focus:outline-hidden"
                />
                {formErrors.pincode && <p className="text-xs text-red-600 mt-1">{formErrors.pincode}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  readOnly
                  value={address.city}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={handleBack}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-xs"
            >
              Review Booking
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: REVIEW SUMMARY & CONFIRM */}
      {currentStep === 7 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Step 7: Review Appointment Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Please verify all details before submitting your booking request.
            </p>
          </div>

          {/* Review sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient & Appointment Details */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Patient & Timing
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient Name:</span>
                  <span className="font-bold text-slate-900">{patient.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Age & Gender:</span>
                  <span className="font-semibold text-slate-800">{patient.age} Yrs / {patient.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile Phone:</span>
                  <span className="font-semibold text-slate-800">+91 {patient.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Appointment Date:</span>
                  <span className="font-semibold text-emerald-800">{bookingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time Slot:</span>
                  <span className="font-semibold text-slate-800">{timeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Collection Mode:</span>
                  <span className="font-bold text-emerald-700">{collectionType}</span>
                </div>
              </div>

              {collectionType === 'Home Collection' && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Collection Address:</span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {address.street}
                    {address.landmark && `, Landmark: ${address.landmark}`}
                    , {address.city} - {address.pincode}
                  </p>
                </div>
              )}

              {collectionType === 'Center Visit' && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Center Address:</span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {BUSINESS_INFO.address}
                  </p>
                </div>
              )}
            </div>

            {/* Test Selection & Payment Rule Notice */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Selected Tests ({selectedTests.length})
                </h3>
                <div className="max-h-44 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                  {selectedTests.map(t => (
                    <div key={t.id} className="pt-1.5 first:pt-0 flex justify-between text-xs">
                      <span className="font-medium text-slate-800">{t.name}</span>
                      <span className="font-bold text-[#0F294A]">₹{t.price}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">Total Payable:</span>
                  <span className="text-xl font-black text-[#0F294A]">₹{totalAmount}</span>
                </div>
              </div>

              {/* Strict No Online Payment Rule Box */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Request Model (Pay at Collection / Visit)
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  There is <strong>no online payment</strong> required on this portal. 
                  Payment of <span className="font-bold">₹{totalAmount}</span> will be collected directly in cash or upon sample collection at your home or during center visit.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-between border-t border-slate-100">
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
              className="bg-[#0F294A] hover:bg-[#16365D] disabled:opacity-60 text-white font-bold px-8 py-3 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              {isSubmitting ? (
                <span>Generating Booking ID...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Confirm Booking Request
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 8: CONFIRMATION & BOOKING ID */}
      {currentStep === 8 && confirmedBooking && (
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-emerald-200 shadow-lg space-y-8 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div className="space-y-2">
            <span className="inline-block bg-emerald-100 text-emerald-900 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              Booking Request Received
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Appointment Successfully Booked
            </h2>
            <p className="text-xs text-slate-500">
              Our team at {BUSINESS_INFO.name} has registered your request.
            </p>
          </div>

          {/* Booking ID Highlight Card */}
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Your Unique Booking ID
            </span>
            <div className="text-3xl sm:text-4xl font-black tracking-wider text-[#0F294A] font-mono select-all">
              {confirmedBooking.id}
            </div>
            <p className="text-xs text-slate-500">
              Save this ID to track sample processing status and download reports.
            </p>
          </div>

          {/* Quick Summary Grid */}
          <div className="text-left bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <span className="font-bold text-slate-800">{confirmedBooking.patient.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Scheduled Date & Time:</span>
              <span className="font-semibold text-slate-800">{confirmedBooking.bookingDate} ({confirmedBooking.timeSlot})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mode:</span>
              <span className="font-bold text-emerald-800">{confirmedBooking.collectionType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Amount Due:</span>
              <span className="font-extrabold text-[#0F294A] text-sm">₹{confirmedBooking.totalAmount} (Pay at Collection)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => onNavigateToTracking(confirmedBooking.id)}
              className="bg-[#0F294A] text-white hover:bg-[#16365D] font-bold px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              Track Status & Reports
            </button>
            <button
              onClick={() => window.print()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-slate-600" />
              Print / Save Slip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
