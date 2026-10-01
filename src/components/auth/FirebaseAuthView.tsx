import React, { useState } from 'react';
import {
  registerUser,
  loginUser,
  signOut,
  validatePassword,
  validateMobile,
} from '../../services/firebaseAuthService';
import { useAuth } from '../../contexts/AuthContext';
import { PublicPage } from '../layout/Header';
import {
  Phone,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Microscope,
  User,
  Lock,
  MapPin,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '../ui/DesignSystem';

interface FirebaseAuthViewProps {
  initialMode?: 'login' | 'register';
  onNavigate: (page: PublicPage, param?: string) => void;
  onSuccess?: () => void;
}

export const FirebaseAuthView: React.FC<FirebaseAuthViewProps> = ({
  initialMode = 'login',
  onNavigate,
  onSuccess,
}) => {
  const { refreshUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form state
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(digitsOnly);
    if (errorMessage) setErrorMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validate mobile
    const mobileValidation = validateMobile(mobile);
    if (!mobileValidation.isValid) {
      setErrorMessage(mobileValidation.error || 'Invalid mobile number');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required');
      return;
    }

    setIsLoading(true);
    try {
      await loginUser(mobile, password);
      await refreshUser();
      setSuccessMessage('Login successful! Redirecting...');

      if (onSuccess) {
        onSuccess();
      } else {
        onNavigate('dashboard');
      }
    } catch (err: any) {
      const errorCode = err.code;
      if (errorCode === 'auth/invalid-credential') {
        setErrorMessage('Invalid mobile number or password');
      } else if (errorCode === 'auth/user-not-found') {
        setErrorMessage('User not found. Please register first.');
      } else if (errorCode === 'auth/wrong-password') {
        setErrorMessage('Incorrect password');
      } else {
        setErrorMessage(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validate mobile
    const mobileValidation = validateMobile(mobile);
    if (!mobileValidation.isValid) {
      setErrorMessage(mobileValidation.error || 'Invalid mobile number');
      return;
    }

    // Validate name
    if (!name.trim()) {
      setErrorMessage('Name is required');
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setErrorMessage(passwordValidation.errors.join('. '));
      return;
    }

    setIsLoading(true);
    try {
      await registerUser(name, mobile, address, password);
      await refreshUser();
      setSuccessMessage('Registration successful! Redirecting...');

      if (onSuccess) {
        onSuccess();
      } else {
        onNavigate('dashboard');
      }
    } catch (err: any) {
      const errorCode = err.code;
      if (errorCode === 'auth/email-already-in-use') {
        setErrorMessage('This mobile number is already registered. Please login.');
      } else if (errorCode === 'auth/weak-password') {
        setErrorMessage('Password is too weak. Please use a stronger password.');
      } else {
        setErrorMessage(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setErrorMessage('');
    setSuccessMessage('');
    setPassword('');
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 px-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-lg bg-[#0F294A] text-white flex items-center justify-center mx-auto shadow-2xs">
            <Microscope className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-[#0F294A]">
            {mode === 'login' ? 'Login' : 'Register'}
          </h1>
          <p className="text-xs text-slate-600">
            {mode === 'login'
              ? 'Enter your mobile number and password to login'
              : 'Create your account to get started'}
          </p>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-lg flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3.5 rounded-lg flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="login-mobile"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Mobile Number <span className="text-red-600">*</span>
              </label>
              <div className="flex items-stretch rounded-lg border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-[#0F294A] focus-within:border-[#0F294A] overflow-hidden">
                <div className="px-3.5 py-2.5 bg-slate-50 border-r border-slate-300 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0F294A] select-none shrink-0">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>+91</span>
                </div>
                <input
                  id="login-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  required
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChange={handleMobileChange}
                  className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 bg-white focus:outline-hidden tabular-nums tracking-wide"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Password <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full py-2.5"
            >
              Login
            </Button>

            <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-100">
              <span>Don&apos;t have an account? </span>
              <button
                type="button"
                onClick={toggleMode}
                className="text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                Register
              </button>
            </div>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="register-name"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Full Name <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <User
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="register-mobile"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Mobile Number <span className="text-red-600">*</span>
              </label>
              <div className="flex items-stretch rounded-lg border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-[#0F294A] focus-within:border-[#0F294A] overflow-hidden">
                <div className="px-3.5 py-2.5 bg-slate-50 border-r border-slate-300 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0F294A] select-none shrink-0">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>+91</span>
                </div>
                <input
                  id="register-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  required
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChange={handleMobileChange}
                  className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 bg-white focus:outline-hidden tabular-nums tracking-wide"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="register-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Password <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Create a password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Password must be at least 6 characters long
              </p>
            </div>

            <div>
              <label
                htmlFor="register-address"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <MapPin
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="register-address"
                  type="text"
                  autoComplete="street-address"
                  placeholder="Enter your address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A]"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600">
              <p className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  By registering, you agree to be contacted by B.L. Diagnostic Center for test
                  bookings and updates.
                </span>
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full py-2.5"
            >
              Register
            </Button>

            <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-100">
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={toggleMode}
                className="text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                Login
              </button>
            </div>
          </form>
        )}

        {/* Privacy reassurance */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>Secure Firebase Authentication · B.L. Diagnostic Center Patient Portal</span>
        </div>
      </div>
    </div>
  );
};
