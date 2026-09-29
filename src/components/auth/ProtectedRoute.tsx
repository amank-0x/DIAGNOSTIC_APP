import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PublicPage } from '../layout/Header';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/DesignSystem';
import { UserRole } from '../../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  onNavigate: (page: PublicPage) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  onNavigate,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#0F294A] border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-600">Verifying session authorization...</p>
      </div>
    );
  }

  // If user is not authenticated, prompt login
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 bg-white p-8 rounded-2xl border border-slate-200">
        <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Authentication Required</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          You must be logged in to view this portal. Passwords and credentials are encrypted.
        </p>
        <Button variant="primary" size="md" onClick={() => onNavigate('login')}>
          Sign In / Register
        </Button>
      </div>
    );
  }

  // If user role is not authorized
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 bg-white p-8 rounded-2xl border border-red-200">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-red-900">Access Denied (403)</h2>
        <p className="text-xs text-red-700 leading-relaxed">
          Your account role (<strong className="uppercase">{user.role}</strong>) does not have authorization to access this administrative area.
        </p>
        <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')}>
          Return to Patient Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
