import React, { useState, useEffect } from 'react';
import {
  Phone,
  Calendar,
  Menu,
  X,
  Home,
  ShieldCheck,
  User,
  Microscope,
  HeartPulse,
  MapPin,
} from 'lucide-react';
import { BUSINESS_INFO } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export type PublicPage =
  | 'home'
  | 'about'
  | 'services'
  | 'tests'
  | 'test-details'
  | 'packages'
  | 'package-details'
  | 'home-collection'
  | 'book'
  | 'contact'
  | 'faq'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'admin';

interface HeaderProps {
  currentPage: PublicPage;
  onNavigate: (page: PublicPage, param?: string) => void;
  selectedTestsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  selectedTestsCount,
}) => {
  const { user, isStaffOrAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (page: PublicPage, param?: string) => {
    onNavigate(page, param);
    setMobileMenuOpen(false);
  };

  const navLinks: { id: PublicPage; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'tests', label: 'Tests' },
    { id: 'packages', label: 'Health Packages' },
    { id: 'home-collection', label: 'Home Collection' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow duration-150 ${
        isScrolled
          ? 'border-b border-slate-200 shadow-sm'
          : 'border-b border-slate-200/80'
      }`}
    >
      {/* 1. TOP SUPPORT BAR */}
      <div className="bg-[#0F294A] text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
          {/* Left: Heart/medical icon + 24/7 Support: 9649183422 */}
          <div className="flex items-center gap-4">
            <a
              href={`tel:${BUSINESS_INFO.phone}`}
              className="flex items-center gap-1.5 font-semibold text-white hover:text-emerald-300 transition-colors tabular-nums"
              aria-label={`24/7 Support: ${BUSINESS_INFO.phone}`}
            >
              <HeartPulse className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>24/7 Support: {BUSINESS_INFO.phone}</span>
            </a>

            <span className="hidden sm:inline-flex items-center gap-1.5 text-emerald-300 font-medium border-l border-slate-700 pl-4">
              <Home className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>Home Collection Available</span>
            </span>
          </div>

          {/* Right: Pratap Nagar, Jaipur + Login/Account */}
          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center gap-1 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>Pratap Nagar, Jaipur</span>
            </span>

            <button
              type="button"
              onClick={() => handleNavClick(user ? 'dashboard' : 'login')}
              className="flex items-center gap-1 font-semibold text-emerald-300 hover:text-white transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{user ? 'My Account' : 'Login'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVBAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* LEFT: B.L. Diagnostic Logo + Name + Tagline */}
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] rounded-lg shrink-0"
            aria-label={`${BUSINESS_INFO.name} Home`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#0F294A] flex items-center justify-center text-white shrink-0 group-hover:bg-[#16365D] transition-colors shadow-2xs">
              <Microscope className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <span className="text-sm sm:text-lg font-extrabold text-[#0F294A] tracking-tight block leading-tight whitespace-nowrap">
                B.L. Diagnostic Center
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-emerald-700 block leading-tight">
                Accurate Diagnosis, Better Health
              </span>
            </div>
          </button>

          {/* CENTER: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5" aria-label="Main Navigation">
            {navLinks.map((item) => {
              const isActive =
                currentPage === item.id ||
                (item.id === 'tests' && currentPage === 'test-details') ||
                (item.id === 'packages' && currentPage === 'package-details');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`py-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] ${
                    isActive
                      ? 'text-[#0F294A] border-[#059669]'
                      : 'text-slate-600 border-transparent hover:text-[#0F294A] hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* RIGHT: Phone, Login / Account, Primary "Book a Test" Button (Medical Green) */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <a
              href={`tel:${BUSINESS_INFO.phone}`}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[#0F294A] hover:bg-slate-100 transition-colors tabular-nums"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span>{BUSINESS_INFO.phone}</span>
            </a>

            {user ? (
              <button
                type="button"
                onClick={() => handleNavClick('dashboard')}
                className={`px-3.5 py-2.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] ${
                  currentPage === 'dashboard'
                    ? 'bg-slate-100 text-[#0F294A] border-slate-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-[#0F294A]'
                }`}
              >
                <User className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <span>Account</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNavClick('login')}
                className={`px-3.5 py-2.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] ${
                  currentPage === 'login' || currentPage === 'register'
                    ? 'bg-slate-100 text-[#0F294A] border-slate-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-[#0F294A]'
                }`}
              >
                <User className="w-4 h-4 text-slate-600" aria-hidden="true" />
                <span>Login</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleNavClick('book')}
              className="bg-[#059669] hover:bg-[#047857] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-2xs cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#059669]"
            >
              <Calendar className="w-4 h-4 text-white" aria-hidden="true" />
              <span>Book a Test</span>
              {selectedTestsCount > 0 && (
                <span className="bg-white text-[#0F294A] px-1.5 py-0.5 rounded text-[10px] font-extrabold leading-none tabular-nums">
                  {selectedTestsCount}
                </span>
              )}
            </button>

            {isStaffOrAdmin && (
              <button
                type="button"
                onClick={() => handleNavClick('admin')}
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] ${
                  currentPage === 'admin'
                    ? 'bg-[#0F294A] text-white'
                    : 'bg-slate-100 text-[#0F294A] border border-slate-300 hover:bg-slate-200'
                }`}
                title="Admin Panel"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Admin</span>
              </button>
            )}
          </div>

          {/* MOBILE HEADER ACTIONS: Book a Test + Hamburger Menu */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleNavClick('book')}
              className="bg-[#059669] hover:bg-[#047857] text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer min-h-[40px] shadow-2xs"
            >
              <span>Book a Test</span>
              {selectedTestsCount > 0 && (
                <span className="bg-white text-[#0F294A] px-1.5 py-0.5 rounded text-[10px] font-black leading-none tabular-nums">
                  {selectedTestsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <nav
          id="mobile-navigation-menu"
          aria-label="Mobile Navigation"
          className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-md"
        >
          <div className="flex flex-col space-y-1">
            {navLinks.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-[#0F294A] font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {isStaffOrAdmin && (
              <button
                type="button"
                onClick={() => handleNavClick('admin')}
                className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-[#0F294A] hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Admin Panel</span>
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleNavClick('book')}
              className="w-full bg-[#059669] hover:bg-[#047857] text-white py-2.5 px-4 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-white" aria-hidden="true" />
              <span>Book a Test</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('home-collection')}
              className="w-full bg-[#0F294A] hover:bg-[#16365D] text-white py-2.5 px-4 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <Home className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>Home Collection</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick(user ? 'dashboard' : 'login')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-[#0F294A] py-2.5 px-4 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4 text-[#0F294A]" aria-hidden="true" />
              <span>{user ? 'My Account' : 'Login / Register'}</span>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};
