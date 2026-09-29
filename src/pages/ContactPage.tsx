import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  PhoneCall, 
  ShieldCheck, 
  ExternalLink
} from 'lucide-react';
import { PublicPage } from '../components/layout/Header';
import { submitContactEnquiry, submitCallbackRequest } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { DIAGNOSTIC_IMAGES } from '../constants/diagnosticImages';
import { LaboratoryMap } from '../components/map/LaboratoryMap';

interface ContactPageProps {
  onNavigate: (page: PublicPage, param?: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const { isStaffOrAdmin } = useAuth();

  // Contact form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Quick callback modal state
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [cbName, setCbName] = useState('');
  const [cbPhone, setCbPhone] = useState('');
  const [cbSubmitting, setCbSubmitting] = useState(false);
  const [cbSuccess, setCbSuccess] = useState(false);
  const [cbError, setCbError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await submitContactEnquiry({
        name,
        phone,
        email: email || undefined,
        message
      });

      setSubmitSuccess(true);
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit contact enquiry. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCbSubmitting(true);
    setCbError(null);
    try {
      await submitCallbackRequest({
        fullName: cbName || 'Patient Visitor',
        phone: cbPhone,
        serviceInterest: 'Urgent Contact Callback'
      });
      setCbSuccess(true);
      setCbName('');
      setCbPhone('');
      setTimeout(() => {
        setShowCallbackModal(false);
        setCbSuccess(false);
      }, 3500);
    } catch (err: any) {
      setCbError(err.message || 'Failed to request callback. Please call 9649183422 directly.');
    } finally {
      setCbSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Top Banner with Location / Center Visual */}
      <div className="bg-[#0F294A] text-white rounded-2xl p-6 sm:p-10 border border-slate-800 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-3">
            <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-md uppercase tracking-wider inline-block">
              Center Helpdesk & Location
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Contact B.L. Diagnostic Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl">
              Have questions regarding diagnostic pathology tests, sample collection, or report delivery? Reach our Pratap Nagar laboratory desk directly or submit an online enquiry.
            </p>

            {isStaffOrAdmin && (
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('admin', 'contact-enquiries')}
                  className="bg-white/10 hover:bg-white/20 text-emerald-300 text-xs font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 transition-colors border border-white/15 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Manage Enquiries (/admin/contact-enquiries)
                </button>
              </div>
            )}
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
              <div className="bg-[#0B1F38] px-4 py-2 text-[11px] text-slate-300 flex items-center justify-between">
                <span>Kumbha Marg, Sector 11, Pratap Nagar</span>
                <span className="text-emerald-400 font-semibold">Jaipur - 302033</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Confirmed Business Info (Left 5 cols) + Contact Form (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Confirmed Business Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0F294A] text-white rounded-2xl p-6 sm:p-7 shadow-2xs space-y-5 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center font-black text-lg border border-white/20">
                B.L.
              </div>
              <div>
                <h2 className="text-lg font-extrabold leading-tight">B.L. Diagnostic Center</h2>
                <span className="text-xs text-emerald-400 font-semibold">Accurate Diagnosis, Better Health</span>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-200 pt-2 border-t border-white/10">
              {/* Phone */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Direct Call / Helpdesk
                  </span>
                  <a 
                    href="tel:9649183422" 
                    className="text-base sm:text-lg font-extrabold text-white hover:text-emerald-300 transition-colors block mt-0.5"
                  >
                    9649183422
                  </a>
                  <span className="text-[11px] text-slate-400">Available during center operating hours</span>
                </div>
              </div>

              {/* Physical Address */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Confirmed Center Address
                  </span>
                  <p className="font-semibold text-white leading-relaxed mt-0.5">
                    Near Post Office,<br />
                    Kumbha Marg,<br />
                    Sector 11,<br />
                    Pratap Nagar,<br />
                    Jaipur - 302033
                  </p>
                </div>
              </div>

              {/* Center Timings */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Operating Timings
                  </span>
                  <span className="font-bold text-white block mt-0.5">
                    Mon - Sat: 07:00 AM - 08:00 PM
                  </span>
                  <span className="text-[11px] text-slate-300 block">
                    Sunday: 07:00 AM - 02:00 PM
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <a
                href="tel:9649183422"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Call: 9649183422
              </a>

              <button
                type="button"
                onClick={() => setShowCallbackModal(true)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors border border-white/20 text-center cursor-pointer"
              >
                Request Callback
              </button>
            </div>
          </div>

          {/* Directions & Home Collection Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0F294A]">Google Maps Directions</span>
              <a
                href="https://maps.google.com/?q=Post+Office+Kumbha+Marg+Sector+11+Pratap+Nagar+Jaipur"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
              >
                Open Map <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="leading-relaxed">
              Located near the Post Office on Kumbha Marg, Sector 11, Pratap Nagar, Jaipur - 302033. Doorstep sample collection is also available.
            </p>
            <LaboratoryMap heightClassName="h-[260px]" />
            <button
              onClick={() => onNavigate('home-collection')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline block cursor-pointer"
            >
              Request Home Sample Collection →
            </button>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-[#0F294A]">Send an Online Enquiry</h2>
            <p className="text-xs text-slate-600 mt-1">
              Fill out this form to inquire about test pricing, sample collection, or report status. Your message is logged directly with our laboratory desk.
            </p>
          </div>

          {submitSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-emerald-950">Enquiry Received Successfully</h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                Thank you! Your inquiry has been securely stored in our center database. Our team at B.L. Diagnostic Center will contact you shortly.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSubmitSuccess(false)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Message / Required Test Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Specify diagnostic tests required, home collection address, or general inquiry..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] bg-white leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#0F294A] hover:bg-[#16365D] text-white font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-emerald-400" />
                  {isSubmitting ? 'Submitting Enquiry...' : 'Submit Contact Enquiry'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Fast Callback Request Modal */}
      {showCallbackModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-[#0F294A]">Request a Center Callback</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your mobile number and our reception desk will call you back.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCallbackModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {cbError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cbError}</span>
              </div>
            )}

            {cbSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-800 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <span className="font-bold block">Callback Request Logged!</span>
                <p>Our reception desk has received your request and will call you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleCallbackSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your full name"
                    value={cbName}
                    onChange={(e) => setCbName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">10-Digit Mobile Number</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9649183422"
                    value={cbPhone}
                    onChange={(e) => setCbPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCallbackModal(false)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={cbSubmitting}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
                  >
                    {cbSubmitting ? 'Requesting...' : 'Request Callback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
