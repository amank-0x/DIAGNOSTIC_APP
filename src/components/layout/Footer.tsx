import React from 'react';
import { Phone, MapPin, Microscope, Home } from 'lucide-react';
import { BUSINESS_INFO } from '../../types';
import { PublicPage } from './Header';

interface FooterProps {
  onNavigate: (page: PublicPage, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <>
      <footer
        className="bg-[#0F294A] text-slate-300 border-t border-slate-800 mt-16"
        aria-label="Site Footer"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* COLUMN 1: B.L. Diagnostic Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <Microscope className="w-5 h-5" aria-hidden="true" />
                </div>
                <span className="text-base font-extrabold text-white tracking-tight">
                  {BUSINESS_INFO.name}
                </span>
              </div>
              <p className="text-xs font-semibold text-emerald-400">
                "{BUSINESS_INFO.tagline}"
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-200 bg-white/5 border border-white/10 px-2.5 py-1 rounded">
                <Home className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span>Home Collection Available</span>
              </div>
            </div>

            {/* COLUMN 2: Quick Links */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Quick Links
              </h2>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('tests')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Diagnostic Tests
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('packages')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Health Packages
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('home-collection')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Home Collection
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('book')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Book a Test
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('about')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            {/* COLUMN 3: Account / Patient Portal */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Patient Portal
              </h2>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Login
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('register')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Register
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Patient Dashboard
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard', 'bookings')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    My Bookings
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard', 'reports')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    My Reports
                  </button>
                </li>
              </ul>
            </div>

            {/* COLUMN 4: Contact */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Contact
              </h2>
              <div className="space-y-2.5 text-xs">
                <a
                  href={`tel:${BUSINESS_INFO.phone}`}
                  className="flex items-center gap-2 font-bold text-emerald-400 hover:text-emerald-300 transition-colors tabular-nums"
                >
                  <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{BUSINESS_INFO.phone}</span>
                </a>
                <div className="flex items-start gap-2 text-slate-300 leading-relaxed">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <address className="not-italic">
                    Near Post Office, Kumbha Marg,
                    <br />
                    Sector 11, Pratap Nagar,
                    <br />
                    Jaipur - 302033
                  </address>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>
              &copy; {new Date().getFullYear()} {BUSINESS_INFO.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span>Pratap Nagar, Jaipur - 302033</span>
            </div>
          </div>
        </div>
      </footer>

      {/* FLOATING CIRCULAR GREEN PHONE BUTTON (Bottom-Right) */}
      <a
        href={`tel:${BUSINESS_INFO.phone}`}
        aria-label={`Call ${BUSINESS_INFO.name} at ${BUSINESS_INFO.phone}`}
        title={`Call ${BUSINESS_INFO.phone}`}
        className="fixed bottom-5 right-5 z-40 w-13 h-13 rounded-full bg-[#059669] hover:bg-[#047857] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#059669]"
      >
        <Phone className="w-5 h-5" aria-hidden="true" />
      </a>
    </>
  );
};
