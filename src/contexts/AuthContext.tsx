import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile, UserRole } from '../types/auth';
import { fetchCurrentSessionUser, logoutUser } from '../services/authService';
import { getUserProfileFromFirebaseUser } from '../services/firebaseAuthService';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize auth state with Firebase Auth and fallback to OTP session
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          const profile = await getUserProfileFromFirebaseUser(fbUser);
          if (isMounted) {
            setUser(profile);
            setFirebaseUser(fbUser);
          }
        } else {
          // Check for active OTP session fallback
          const otpUser = await fetchCurrentSessionUser();
          if (isMounted) {
            setUser(otpUser);
            setFirebaseUser(null);
          }
        }
      } catch (err) {
        console.error('Auth state change resolution error:', err);
        if (isMounted) {
          setUser(null);
          setFirebaseUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      if (auth.currentUser) {
        const profile = await getUserProfileFromFirebaseUser(auth.currentUser);
        setUser(profile);
        setFirebaseUser(auth.currentUser);
      } else {
        const otpUser = await fetchCurrentSessionUser();
        setUser(otpUser);
        setFirebaseUser(null);
      }
    } catch (e) {
      console.error('Failed to refresh user in AuthProvider:', e);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Firebase sign out error:', e);
    }
    try {
      await logoutUser();
    } catch (e) {
      console.error('OTP session logout error:', e);
    }
    setUser(null);
    setFirebaseUser(null);
    setIsLoading(false);
  }, []);

  const role = user?.role || null;
  const isAdmin = role === 'ADMIN';
  const isStaffOrAdmin = role === 'ADMIN' || role === 'STAFF';

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
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
