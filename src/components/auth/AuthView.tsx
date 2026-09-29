import React, { useState, useEffect, useRef } from 'react';
import {
  sendMobileOtp,
  resendMobileOtp,
  verifyMobileOtp,
} from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { PublicPage } from '../layout/Header';
import {
  Phone,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Microscope,
  ArrowLeft,
  User,
  KeyRound,
} from 'lucide-react';
import { Button } from '../ui/DesignSystem';
import {
  normalizeIndianMobileNumber,
  formatDisplayMobileNumber,
} from '../../lib/phoneUtils';

interface AuthModalOrPageProps {
  initialMode?: 'login' | 'register';
  onNavigate: (page: PublicPage, param?: string) => void;
  onSuccess?: () => void;
}

export const AuthView: React.FC<AuthModalOrPageProps> = ({
  onNavigate,
  onSuccess,
}) => {
  const { refreshUser } = useAuth();

  // Step 1: Mobile Input | Step 2: 6-Digit OTP Verification
  const [step, setStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
  const [mobileInput, setMobileInput] = useState('');
  const [normalizedMobile, setNormalizedMobile] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(true);
  const [fullName, setFullName] = useState('');

  // 6-digit OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown countdown (seconds)
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sandboxOtpHint, setSandboxOtpHint] = useState<string | undefined>(undefined);

  // Loading & feedback states
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Countdown timer effect for Resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileInput(digitsOnly);
    if (errorMessage) setErrorMessage('');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const normalized = normalizeIndianMobileNumber(mobileInput);
    if (!normalized) {
      setErrorMessage(
        'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).'
      );
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await sendMobileOtp(normalized);
      setNormalizedMobile(res.mobile_number);
      setIsExistingUser(res.isExistingUser);
      setResendCooldown(res.resendCooldownSeconds || 30);
      setSandboxOtpHint(res.sandboxOtp);
      setOtpDigits(['', '', '', '', '', '']);
      setStep('OTP');
      setSuccessMessage(`6-digit OTP sent to ${formatDisplayMobileNumber(res.mobile_number)}`);

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 80);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (errorMessage) setErrorMessage('');

    if (!clean) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    // Handle multi-digit paste or fast typing
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      const next = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        if (index + i < 6 && pasted[i]) {
          next[index + i] = pasted[i];
        }
      }
      setOtpDigits(next);
      const focusIdx = Math.min(5, index + pasted.length);
      otpInputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index]) {
        const next = [...otpDigits];
        next[index] = '';
        setOtpDigits(next);
      } else if (index > 0) {
        const next = [...otpDigits];
        next[index - 1] = '';
        setOtpDigits(next);
        otpInputRefs.current[index - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedDigits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedDigits) return;
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pastedDigits.length; i++) {
      next[i] = pastedDigits[i];
    }
    setOtpDigits(next);
    const focusIdx = Math.min(5, pastedDigits.length - 1);
    otpInputRefs.current[Math.max(0, focusIdx)]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const combinedOtp = otpDigits.join('');
    if (combinedOtp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the OTP.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const { profile } = await verifyMobileOtp({
        mobileInput: normalizedMobile || mobileInput,
        otp: combinedOtp,
        name: fullName.trim() || undefined,
      });

      await refreshUser();
      setSuccessMessage('Mobile number verified! Redirecting...');

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else if (profile.role === 'ADMIN' || profile.role === 'STAFF') {
          onNavigate('admin');
        } else {
          onNavigate('dashboard');
        }
      }, 450);
    } catch (err: any) {
      setErrorMessage(err?.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResendingOtp) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIsResendingOtp(true);

    try {
      const res = await resendMobileOtp(normalizedMobile || mobileInput);
      setResendCooldown(res.resendCooldownSeconds || 30);
      setSandboxOtpHint(res.sandboxOtp);
      setOtpDigits(['', '', '', '', '', '']);
      setSuccessMessage(`A new 6-digit OTP has been sent to ${formatDisplayMobileNumber(res.mobile_number)}.`);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 60);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not resend OTP right now.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 px-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-lg bg-[#0F294A] text-white flex items-center justify-center mx-auto shadow-2xs">
            <Microscope className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-[#0F294A]">Login / Register</h1>
          <p className="text-xs text-slate-600">
            {step === 'MOBILE'
              ? 'Enter your mobile number to continue'
              : `Enter the 6-digit OTP sent to ${formatDisplayMobileNumber(normalizedMobile)}`}
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

        {/* Sandbox / Preview OTP helper when live SMS API key is not configured */}
        {step === 'OTP' && sandboxOtpHint && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <KeyRound className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>
                Verification OTP:{' '}
                <strong className="font-mono text-sm text-[#0F294A] tracking-wider">
                  {sandboxOtpHint}
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setOtpDigits(sandboxOtpHint.split('').slice(0, 6));
                setErrorMessage('');
              }}
              className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              Auto-fill
            </button>
          </div>
        )}

        {/* STEP 1: MOBILE NUMBER INPUT */}
        {step === 'MOBILE' && (
          <form onSubmit={handleSendOtp} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="auth-mobile-number"
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
                  id="auth-mobile-number"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  required
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  value={mobileInput}
                  onChange={handleMobileChange}
                  className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 bg-white focus:outline-hidden tabular-nums tracking-wide"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                We will send a one-time 6-digit verification code to this number.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSendingOtp}
              className="w-full py-2.5"
            >
              Send OTP
            </Button>
          </form>
        )}

        {/* STEP 2: 6-DIGIT OTP VERIFICATION */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} noValidate className="space-y-5">
            <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span className="font-bold text-[#0F294A] tabular-nums">
                  {formatDisplayMobileNumber(normalizedMobile)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('MOBILE');
                  setErrorMessage('');
                  setSuccessMessage('');
                  setSandboxOtpHint(undefined);
                }}
                className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" aria-hidden="true" />
                <span>Change</span>
              </button>
            </div>

            {!isExistingUser && (
              <div>
                <label
                  htmlFor="auth-new-user-name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Your Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <User
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-new-user-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0F294A]"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="otp-digit-0"
                className="block text-xs font-semibold text-slate-700 mb-2"
              >
                Enter OTP <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-digit-${idx}`}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    aria-label={`OTP digit ${idx + 1}`}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className="w-full h-11 sm:h-12 text-center text-base sm:text-lg font-bold text-[#0F294A] rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 tabular-nums"
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isVerifyingOtp}
              className="w-full py-2.5"
            >
              Verify OTP
            </Button>

            {/* Resend OTP Section with Countdown */}
            <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-1.5">
              <span>Didn&apos;t receive OTP?</span>
              {resendCooldown > 0 ? (
                <span className="font-semibold text-slate-500 tabular-nums">
                  Resend OTP in {resendCooldown} seconds
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isResendingOtp}
                  onClick={handleResendOtp}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer disabled:opacity-50"
                >
                  {isResendingOtp ? 'Sending...' : 'Resend OTP'}
                </button>
              )}
            </div>
          </form>
        )}

        {/* Privacy reassurance */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>Secure Mobile OTP Login · B.L. Diagnostic Center Patient Portal</span>
        </div>
      </div>
    </div>
  );
};
