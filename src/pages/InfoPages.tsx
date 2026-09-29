import React, { useState } from 'react';
import { BUSINESS_INFO } from '../types';
import { PublicPage } from '../components/layout/Header';
import { ContentRequiredBadge, Button } from '../components/ui/DesignSystem';
import { 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Microscope, 
  Droplet, 
  FlaskConical, 
  Activity, 
  ShieldCheck, 
  Calendar, 
  Home,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { submitContactEnquiry } from '../services/adminService';
import { DIAGNOSTIC_IMAGES } from '../constants/diagnosticImages';

interface InfoPagesProps {
  type: 'about' | 'services' | 'contact' | 'faq' | 'login' | 'register';
  onNavigate: (page: PublicPage) => void;
}

export const InfoPages: React.FC<InfoPagesProps> = ({ type, onNavigate }) => {
  const [enqName, setEnqName] = useState('');
  const [enqPhone, setEnqPhone] = useState('');
  const [enqMsg, setEnqMsg] = useState('');
  const [enqSubmitting, setEnqSubmitting] = useState(false);
  const [enqSuccess, setEnqSuccess] = useState(false);
  const [enqError, setEnqError] = useState<string | null>(null);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enqName.trim() || !enqPhone.trim() || !enqMsg.trim()) return;
    setEnqSubmitting(true);
    setEnqError(null);
    try {
      await submitContactEnquiry({
        name: enqName.trim(),
        phone: enqPhone.trim(),
        message: enqMsg.trim()
      });
      setEnqSuccess(true);
      setEnqName('');
      setEnqPhone('');
      setEnqMsg('');
    } catch (err: any) {
      console.error('Failed to submit enquiry:', err);
      setEnqError(err.message || 'Unable to submit enquiry. Please call 9649183422 directly.');
    } finally {
      setEnqSubmitting(false);
    }
  };

  if (type === 'about') {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        {/* About Header Banner with Diagnostic Laboratory Visual */}
        <div className="bg-[#0F294A] text-white rounded-2xl p-6 sm:p-10 border border-slate-800 shadow-2xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-3">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-md">
              <Microscope className="w-3.5 h-3.5" />
              About Our Diagnostic Center
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {BUSINESS_INFO.name}
            </h1>
            <p className="text-base sm:text-lg font-semibold text-emerald-400">
              &ldquo;{BUSINESS_INFO.tagline}&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Dedicated clinical pathology and diagnostic testing laboratory located near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur - 302033.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-white/15 bg-slate-900 shadow-sm">
              <div className="aspect-16/10 w-full overflow-hidden">
                <img
                  src={DIAGNOSTIC_IMAGES.centerFacility.src}
                  alt={DIAGNOSTIC_IMAGES.centerFacility.alt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-[#0B1F38] px-4 py-2 text-[11px] text-slate-300">
                {DIAGNOSTIC_IMAGES.centerFacility.caption}
              </div>
            </div>
          </div>
        </div>

        {/* Center Overview & Quality */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-extrabold text-[#0F294A]">
              Clinical Pathology & Patient-Centered Testing
            </h2>
            <p>
              <strong>{BUSINESS_INFO.name}</strong> serves individuals, families, and senior citizens in Pratap Nagar, Jaipur with verified routine and specialized pathology testing. Our diagnostic catalog covers hematology, clinical biochemistry, thyroid and hormone assays, infectious disease serology, and preventive health checkup packages.
            </p>
            <p>
              We follow strict specimen collection and barcoding protocols—whether samples are collected at our Kumbha Marg laboratory or through our doorstep home sample collection service.
            </p>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h3 className="font-bold text-[#0F294A]">Center Mission & Diagnostic Standards</h3>
              <p>
                To deliver accurate, timely, and transparently priced diagnostic laboratory reports that support reliable clinical decision-making and preventive health monitoring.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h3 className="font-bold text-[#0F294A]">Accreditations & Registrations</h3>
              <p className="text-xs text-slate-500">
                Official registration certificates & accreditation documents: <ContentRequiredBadge text="[CONTENT REQUIRED]" />
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
              <h3 className="font-bold text-[#0F294A] text-sm border-b border-slate-100 pb-2.5">
                Confirmed Center Details
              </h3>
              <div className="space-y-3 text-slate-600">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">Address:</strong>
                    Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur - 302033
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">Direct Helpline:</strong>
                    <a href={`tel:${BUSINESS_INFO.phone}`} className="text-emerald-700 font-bold hover:underline">
                      +91 {BUSINESS_INFO.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block">Working Hours:</strong>
                    {BUSINESS_INFO.timings}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button variant="primary" size="sm" onClick={() => onNavigate('book')} className="flex-1">
                  Book A Test
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onNavigate('home-collection')} className="flex-1">
                  Home Collection
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'services') {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        {/* Services Header Banner */}
        <div className="bg-[#0F294A] text-white rounded-2xl p-6 sm:p-10 border border-slate-800 shadow-2xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-3">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-md">
              <FlaskConical className="w-3.5 h-3.5" />
              Clinical Pathology & Specimen Testing
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Diagnostic Laboratory Services
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl">
              Confirmed diagnostic testing departments at {BUSINESS_INFO.name}, Pratap Nagar, Jaipur. Browse tests by department or schedule home sample collection.
            </p>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-xl overflow-hidden border border-white/15 bg-slate-900 p-2.5 flex items-center gap-3">
              <img
                src={DIAGNOSTIC_IMAGES.pathologyTesting.src}
                alt={DIAGNOSTIC_IMAGES.pathologyTesting.alt}
                className="w-28 h-20 object-cover rounded-lg border border-white/10 shrink-0"
              />
              <div className="space-y-1 text-xs">
                <span className="text-emerald-400 font-bold block">Same-Day Reports</span>
                <p className="text-slate-200 text-[11px] leading-snug">
                  Routine hematology & biochemistry completed in 4–6 hours.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#0F294A]/10 text-[#0F294A] flex items-center justify-center">
              <Droplet className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Hematology & Complete Blood Counts</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              CBC with 5-part differential, ESR, Hemoglobin, Platelet counts, Peripheral blood smear, Reticulocyte count, and ABO/Rh blood grouping.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#0F294A]/10 text-[#0F294A] flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Biochemistry & Metabolic Panels</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fasting & Post-Prandial Blood Glucose, HbA1c, Liver Function Tests (LFT), Kidney Function Tests (KFT), Lipid Profile, Uric Acid, and Serum Calcium.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#0F294A]/10 text-[#0F294A] flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Endocrine, Thyroid & Vitamins</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Total & Free Thyroid Profile (T3, T4, Ultra-TSH), 25-OH Vitamin D, Vitamin B12, Ferritin, Iron Studies, and reproductive hormone assays.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#0F294A]/10 text-[#0F294A] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Serology & Infectious Disease</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Widal Typhoid agglutination, Dengue NS1 Antigen & IgG/IgM, Malaria Antigen, CRP (Quantitative), Rheumatoid Factor (RA), and ASO Titre.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#0F294A]/10 text-[#0F294A] flex items-center justify-center">
              <Microscope className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Clinical Pathology & Urine Analysis</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Urine Routine & Microscopic Examination (Urine R/M), Urine Microalbumin, Stool Routine & Microscopy, and Occult Blood testing.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 text-base">Radiology / Ultrasound / ECG</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Additional imaging and non-pathology diagnostic equipment status:
              </p>
            </div>
            <div>
              <ContentRequiredBadge text="[CONTENT REQUIRED]" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#0F294A]">Ready to schedule a diagnostic test?</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Browse our complete 427-test rate list or request doorstep sample collection in Pratap Nagar.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" size="sm" onClick={() => onNavigate('tests')}>
              Browse All Tests
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onNavigate('home-collection')}>
              Home Collection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'contact') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F294A]">Contact & Center Location</h1>
          <p className="text-xs text-slate-500 mt-1">Get in touch with {BUSINESS_INFO.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Center Information</h3>
            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Address:</span>
                  <span>{BUSINESS_INFO.address}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Direct Call:</span>
                  <a href={`tel:${BUSINESS_INFO.phone}`} className="font-semibold text-emerald-700 hover:underline">
                    +91 {BUSINESS_INFO.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Center Operating Hours:</span>
                  <span>{BUSINESS_INFO.timings}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Send an Enquiry</h3>
            {enqError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{enqError}</span>
              </div>
            )}
            {enqSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-800 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Enquiry Received
                </div>
                <p>Thank you! Your message has been logged directly with our center team.</p>
                <button
                  type="button"
                  onClick={() => setEnqSuccess(false)}
                  className="text-xs font-semibold text-emerald-700 underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Your Full Name"
                  value={enqName}
                  onChange={(e) => setEnqName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
                <input
                  type="tel"
                  required
                  placeholder="10-digit Phone Number"
                  value={enqPhone}
                  onChange={(e) => setEnqPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
                <textarea
                  rows={3}
                  required
                  placeholder="Inquiry, test requirements, or home visit query..."
                  value={enqMsg}
                  onChange={(e) => setEnqMsg(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
                <Button variant="primary" size="sm" type="submit" disabled={enqSubmitting} className="w-full">
                  {enqSubmitting ? 'Sending Enquiry...' : 'Submit Enquiry'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'faq') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="bg-[#0F294A] text-white rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-2">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-md">
            <HelpCircle className="w-3.5 h-3.5" />
            Patient Help & Guidelines
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Frequently Asked Questions</h1>
          <p className="text-xs sm:text-sm text-slate-200">
            Common questions regarding diagnostic tests, fasting preparation, home sample collection, and reports at {BUSINESS_INFO.name}.
          </p>
        </div>

        <div className="space-y-3">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            <h3 className="text-sm font-bold text-[#0F294A]">1. How do I book a home sample collection in Pratap Nagar?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Click on &ldquo;Book A Test&rdquo; or &ldquo;Home Collection&rdquo;, select your required diagnostic tests or health package, choose the Home Collection option, and enter your address in Pratap Nagar / Jaipur. You can also call <strong>9649183422</strong> directly.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            <h3 className="text-sm font-bold text-[#0F294A]">2. Do I need to pay online when booking a test?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No. B.L. Diagnostic Center operates a simple appointment request model with zero online payment required. You pay directly at the time of sample collection at your home or during your visit to our Kumbha Marg center.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            <h3 className="text-sm font-bold text-[#0F294A]">3. Which tests require overnight fasting?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fasting Blood Sugar (FBS), Lipid Profile, and most Preventive Health Checkup Packages require 8 to 12 hours of overnight fasting (plain water is permitted). Each test card in our catalogue clearly states sample and fasting instructions.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            <h3 className="text-sm font-bold text-[#0F294A]">4. How long does it take to receive diagnostic reports?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Routine hematology and biochemistry tests (such as CBC, Blood Sugar, LFT, KFT, Urine R/M) are typically reported on the same day within 4–6 hours. Specialized hormone or culture tests report within 24–48 hours as listed in the test catalogue.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
            <h3 className="text-sm font-bold text-[#0F294A]">5. How can I download my test reports online?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sign in to your Patient Account using your registered email and password, open &ldquo;My Account&rdquo; → &ldquo;Diagnostic Reports&rdquo;, and view or download your PDF laboratory report securely.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
