import React from 'react';
import {
  Home,
  Phone,
  Calendar,
  MapPin,
  ClipboardCheck,
  TestTube,
  FileText,
  Check,
  ArrowRight,
} from 'lucide-react';
import { BUSINESS_INFO } from '../types';
import { PublicPage } from '../components/layout/Header';
import { Button } from '../components/ui/DesignSystem';
import { DIAGNOSTIC_IMAGES } from '../constants/diagnosticImages';

interface HomeCollectionPageProps {
  onNavigate: (page: PublicPage) => void;
}

export const HomeCollectionPage: React.FC<HomeCollectionPageProps> = ({
  onNavigate,
}) => {
  const steps = [
    {
      num: '01',
      title: 'Select Test or Call Us',
      desc: 'Choose your required diagnostic tests online or call 9649183422 to request a home sample collection appointment.',
      icon: ClipboardCheck,
    },
    {
      num: '02',
      title: 'Provide Address & Preferred Slot',
      desc: 'Select your preferred date and available sample collection slot and enter your residential address.',
      icon: Calendar,
    },
    {
      num: '03',
      title: 'Doorstep Sample Collection',
      desc: 'Sample collection is performed at your scheduled address using sterile vacutainers and sample collection supplies.',
      icon: TestTube,
    },
    {
      num: '04',
      title: 'Laboratory Processing & Report',
      desc: 'Samples are processed at B.L. Diagnostic Center and reports are made available in your account or at the center.',
      icon: FileText,
    },
  ];

  const features = [
    'Scheduled collection at preferred date and time',
    'Address-based booking',
    'Available time slots',
    'Safe sample handling',
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* HERO SECTION */}
      <section className="bg-[#0F294A] rounded-2xl overflow-hidden border border-slate-800 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 space-y-5">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
              <Home className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Home Collection Available</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Home Sample Collection
            </h1>

            <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-xl">
              Book a convenient diagnostic sample collection from the comfort of your home.
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs sm:text-sm text-slate-200">
              {features.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => onNavigate('book')}
              >
                <span>Book Home Collection</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>

              <a
                href={`tel:${BUSINESS_INFO.phone}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/20 text-sm font-semibold transition-colors tabular-nums"
              >
                <Phone className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Call {BUSINESS_INFO.phone}</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 h-full">
            <img
              src={DIAGNOSTIC_IMAGES.homeCollection.src}
              alt={DIAGNOSTIC_IMAGES.homeCollection.alt}
              className="w-full h-64 lg:h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* HOW HOME COLLECTION WORKS */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
            Step-by-Step Process
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F294A] mt-1">
            How Home Sample Collection Works
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#0F294A] flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-emerald-700" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      STEP {step.num}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0F294A]">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTACT, ADDRESS & BOOKING CTA */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <h2 className="text-xl font-bold text-[#0F294A]">
              Schedule Your Home Sample Collection
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Book online or call our laboratory desk directly. All samples are processed at {BUSINESS_INFO.name}.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-bold text-slate-900 block">Laboratory Address</span>
                  <span className="text-slate-600">
                    Near Post Office, Kumbha Marg, Sector 11, Pratap Nagar, Jaipur - 302033
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <Phone className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-bold text-slate-900 block">Direct Phone Booking</span>
                  <a
                    href={`tel:${BUSINESS_INFO.phone}`}
                    className="text-[#0F294A] font-extrabold hover:underline tabular-nums text-sm"
                  >
                    {BUSINESS_INFO.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('book')}
              className="w-full"
            >
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>BOOK HOME COLLECTION</span>
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => onNavigate('tests')}
              className="w-full"
            >
              Browse Diagnostic Tests
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
