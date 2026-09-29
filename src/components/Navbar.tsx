import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  MapPin, 
  Calendar, 
  Search, 
  ClipboardCheck, 
  ShieldCheck, 
  Home, 
  Menu, 
  X,
  FileText,
  UserCheck
} from 'lucide-react';
import { BUSINESS_INFO } from '../types';

interface NavbarProps {
  activeTab: 'catalog' | 'booking' | 'tracking' | 'admin';
  setActiveTab: (tab: 'catalog' | 'booking' | 'tracking' | 'admin') => void;
  selectedTestsCount: number;
  onOpenBookingModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedTestsCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      {/* Top emergency & contact bar */}
      <div className="bg-[#0F294A] text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <MapPin className="w-3.5 h-3.5" />
              {BUSINESS_INFO.address}
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-300">
              <Calendar className="w-3.5 h-3.5" />
              {BUSINESS_INFO.timings}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-emerald-600/90 text-white font-semibold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">
              Home Collection Available
            </span>
            <a 
              href={`tel:${BUSINESS_INFO.phone}`} 
              className="flex items-center gap-1.5 font-bold text-white hover:text-emerald-300 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              +91 {BUSINESS_INFO.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => setActiveTab('catalog')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0F294A] to-[#1E3A8A] flex items-center justify-center text-white shadow-md border-2 border-emerald-500/30">
              <span className="text-xl font-black tracking-tight text-white">B.L.</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-[#0F294A] tracking-tight">
                  {BUSINESS_INFO.name}
                </span>
              </div>
              <p className="text-xs font-medium text-emerald-700 tracking-wide">
                &ldquo;{BUSINESS_INFO.tagline}&rdquo;
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'catalog'
                  ? 'bg-slate-100 text-[#0F294A] font-semibold'
                  : 'text-slate-600 hover:text-[#0F294A] hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4 text-emerald-600" />
              Tests & Rates
            </button>

            <button
              onClick={() => setActiveTab('booking')}
              className={`px-3.5 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 relative ${
                activeTab === 'booking'
                  ? 'bg-slate-100 text-[#0F294A] font-semibold'
                  : 'text-slate-600 hover:text-[#0F294A] hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-600" />
              Book Appointment
              {selectedTestsCount > 0 && (
                <span className="ml-1 bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {selectedTestsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-3.5 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'tracking'
                  ? 'bg-slate-100 text-[#0F294A] font-semibold'
                  : 'text-slate-600 hover:text-[#0F294A] hover:bg-slate-50'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              Track Booking & Reports
            </button>

            <div className="h-6 w-[1px] bg-slate-200 mx-2" />

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-[#0F294A] text-white font-semibold'
                  : 'text-slate-600 hover:text-[#0F294A] hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              Admin Panel
            </button>
          </nav>

          {/* Mobile hamburger menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <button
            onClick={() => { setActiveTab('catalog'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between ${
              activeTab === 'catalog' ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-emerald-600" />
              Diagnostic Test Catalog & Rates
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('booking'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between ${
              activeTab === 'booking' ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Book Appointment
            </span>
            {selectedTestsCount > 0 && (
              <span className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {selectedTestsCount} selected
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('tracking'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 ${
              activeTab === 'tracking' ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-slate-700'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-600" />
            Track Booking & Reports
          </button>

          <button
            onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 ${
              activeTab === 'admin' ? 'bg-[#0F294A] text-white font-bold' : 'text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Admin Processing Panel
          </button>
        </div>
      )}
    </header>
  );
};
