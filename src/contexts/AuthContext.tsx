import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '../types/auth';
import { fetchCurrentSessionUser, logoutUser } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: null;
  isLoading: boolean;
  role: UserRole | null;
  isStaffOrAdmin: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  isLoading: true,
  role: null,
  isStaffOrAdmin: false,
  isAdmin: false,
  refreshUser: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadSession = useCallback(async () => {
    try {
      const profile = await fetchCurrentSessionUser();
      setUser(profile);
    } catch (e) {
      console.error('Failed to load session in AuthProvider:', e);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const refreshUser = async () => {
    await loadSession();
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  const role = user?.role || null;
  const isAdmin = role === 'ADMIN';
  const isStaffOrAdmin = role === 'ADMIN' || role === 'STAFF';

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser: null,
        isLoading,
        role,
        isStaffOrAdmin,
        isAdmin,
        refreshUser,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
