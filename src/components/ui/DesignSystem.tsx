import React from 'react';
import { Loader2, AlertCircle, Inbox, HelpCircle, X } from 'lucide-react';

// ============================================================================
// B.L. DIAGNOSTIC CENTER — UNIFIED DESIGN SYSTEM
// Primary: Navy Blue (#0F294A)
// Secondary: Green (#059669)
// Background: White (#FFFFFF) / Light Neutral (#F8FAFC)
// ============================================================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'tertiary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer whitespace-nowrap';

  const sizeStyles = {
    sm: 'px-3.5 py-2 text-xs gap-1.5 min-h-[36px]',
    md: 'px-4 py-2.5 text-xs sm:text-sm gap-2 min-h-[40px]',
    lg: 'px-6 py-3 text-sm sm:text-base gap-2.5 min-h-[44px]',
  };

  const variantStyles = {
    primary:
      'bg-[#0F294A] text-white hover:bg-[#16365D] focus-visible:outline-[#0F294A] shadow-2xs',
    secondary:
      'bg-[#059669] text-white hover:bg-[#047857] focus-visible:outline-[#059669] shadow-2xs',
    outline:
      'border border-slate-300 text-slate-800 bg-white hover:bg-slate-50 hover:border-slate-400 focus-visible:outline-[#0F294A]',
    tertiary:
      'border border-[#0F294A]/20 text-[#0F294A] bg-slate-50 hover:bg-slate-100 focus-visible:outline-[#0F294A]',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600 shadow-2xs',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-slate-400',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />}
      {children}
    </button>
  );
};

// Semantic Status Badge (Used for interactive/workflow statuses: Pending, Confirmed, Completed, Cancelled)
export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'navy' | 'green' | 'amber' | 'slate' | 'red';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    navy: 'bg-[#0F294A]/10 text-[#0F294A] border border-[#0F294A]/20',
    green: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    red: 'bg-red-50 text-red-700 border border-red-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md whitespace-nowrap ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// Consistent Surface Card
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}> = ({ children, className = '', padding = 'md' }) => {
  const padMap = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-2xs ${padMap[padding]} ${className}`}
    >
      {children}
    </div>
  );
};

// Section Header
export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-[#0F294A] tracking-tight">
        {title}
      </h2>
      {subtitle && <p className="text-xs sm:text-sm text-slate-600 mt-1">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

// Accessible Form Input
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, required, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
            {label} {required && <span className="text-red-600">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
          className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] transition-colors ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'
          } ${className}`}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600 font-medium">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-help`} className="text-[11px] text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// Content Required / Placeholder Notice
export const ContentRequiredBadge: React.FC<{ text?: string }> = ({
  text = '[CONTENT REQUIRED]',
}) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-300">
    <HelpCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
    <span>{text}</span>
  </span>
);

// Skeleton Loaders for Tests, Packages, Bookings, Dashboard, and Reports
export const SkeletonGrid: React.FC<{ count?: number; columns?: 2 | 3 }> = ({
  count = 6,
  columns = 3,
}) => {
  const gridCols =
    columns === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  return (
    <div className={`grid ${gridCols} gap-5`} role="status" aria-label="Loading items">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 animate-pulse"
        >
          <div className="flex justify-between items-center">
            <div className="h-3.5 w-28 bg-slate-200 rounded" />
            <div className="h-3.5 w-16 bg-slate-100 rounded" />
          </div>
          <div className="h-5 w-3/4 bg-slate-200 rounded" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-100 rounded" />
            <div className="h-3 w-2/3 bg-slate-100 rounded" />
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <div className="h-6 w-16 bg-slate-200 rounded" />
            <div className="h-9 w-28 bg-slate-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonList: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-3" role="status" aria-label="Loading records">
    {Array.from({ length: rows }).map((_, idx) => (
      <div
        key={idx}
        className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-pulse"
      >
        <div className="space-y-2 w-full sm:w-2/3">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="h-8 w-24 bg-slate-200 rounded-lg" />
      </div>
    ))}
  </div>
);

// Loading State
export const LoadingState: React.FC<{ message?: string; useSkeleton?: boolean }> = ({
  message = 'Loading diagnostic data...',
  useSkeleton = true,
}) => (
  <div className="space-y-4 py-6" role="status" aria-live="polite">
    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
      <Loader2 className="w-4 h-4 text-[#0F294A] animate-spin" aria-hidden="true" />
      <span>{message}</span>
    </div>
    {useSkeleton && <SkeletonList rows={3} />}
  </div>
);

// Empty State
export const EmptyState: React.FC<{
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ title, description, actionText, onAction }) => (
  <div className="py-12 px-6 text-center rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
    <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
      <Inbox className="w-5 h-5" aria-hidden="true" />
    </div>
    <h4 className="text-sm font-bold text-slate-900">{title}</h4>
    {description && <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">{description}</p>}
    {actionText && onAction && (
      <div className="pt-1">
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      </div>
    )}
  </div>
);

// Error Alert State
export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <div
    role="alert"
    className="p-4 rounded-xl border border-red-200 bg-red-50 flex items-start gap-3 text-red-800 text-xs"
  >
    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
    <div className="flex-1 space-y-1">
      <p className="font-semibold">Unable to complete action</p>
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-bold underline mt-1 block cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

// Confirmation Dialog for Destructive Actions
export const ConfirmDialog: React.FC<{
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg max-w-md w-full p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 id="confirm-dialog-title" className="text-base font-bold text-slate-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
            aria-label="Close confirmation dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{description}</p>
        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
