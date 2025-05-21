
"use client";

import type { User } from '@/types';
import { UserRole } from '@/types';
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  role: UserRole | null; // Kept for convenience, derived from user
  login: (email: string, password?: string) => Promise<boolean>; 
  logout: () => void;
  isLoading: boolean;
  fetchUserDetails: (userId: string) => Promise<User | null>; // Added for fetching user details
}

const SESSION_STORAGE_KEY = 'complaintCentralUser';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserDetails = async (userId: string): Promise<User | null> => {
    if (!userId) return null;
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const userData: User = await response.json();
        return userData;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch user details", error);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      console.log("[AuthProvider] useEffect triggered to check stored user session.");
      setIsLoading(true);
      const storedUserSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (storedUserSession) {
        try {
          const sessionUser: User = JSON.parse(storedUserSession);
          // Optionally re-fetch user details for freshness or validation
          const freshUser = await fetchUserDetails(sessionUser.id);
          if (freshUser) {
            console.log("[AuthProvider] User found from sessionStorage:", freshUser);
            setUser(freshUser);
            setRole(freshUser.role);
          } else {
             console.warn("[AuthProvider] Stored session user ID not found in DB or fetch failed. Clearing session.");
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
          }
        } catch (e) {
          console.error("[AuthProvider] Error parsing stored user session. Clearing.", e);
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } else {
        console.log("[AuthProvider] No stored user session found.");
      }
      setIsLoading(false);
      console.log("[AuthProvider] Initial loading complete. isLoading set to false.");
    };
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      console.log("[AuthProvider] Routing check. User:", user ? user.id : 'null', "Pathname:", pathname);
      const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
      const isLandingPage = pathname === '/';

      if (!user && !isAuthPage && !isLandingPage) {
        console.log("[AuthProvider] No user, not on auth/landing. Redirecting to /login.");
        router.push('/login');
      } else if (user && isAuthPage) {
        console.log("[AuthProvider] User logged in, but on auth page. Redirecting to dashboard.");
        redirectToDashboard(user.role);
      }
    }
  }, [user, isLoading, pathname, router]);

  const redirectToDashboard = (userRole: UserRole) => {
    switch (userRole) {
      case UserRole.Admin:
        router.push('/dashboard/admin');
        break;
      case UserRole.Engineer:
        router.push('/dashboard/engineer');
        break;
      case UserRole.Customer:
      default:
        router.push('/dashboard/customer');
        break;
    }
  };

  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!password) { // Basic check, password should always be provided for this flow
        console.warn("[AuthProvider] Login attempt without password.");
        return false;
    }
    console.log(`[AuthProvider] Login attempt for email: ${email}`);
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const { user: loggedInUser } = await response.json() as { user: User };
        console.log("[AuthProvider] User logged in via API:", loggedInUser);
        setUser(loggedInUser);
        setRole(loggedInUser.role);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(loggedInUser));
        redirectToDashboard(loggedInUser.role);
        setIsLoading(false);
        return true;
      } else {
        const errorData = await response.json();
        console.warn("[AuthProvider] Login failed via API:", errorData.message || response.statusText);
        setUser(null);
        setRole(null);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error("[AuthProvider] Network or other error during login:", error);
      setUser(null);
      setRole(null);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    console.log("[AuthProvider] Logout called.");
    setUser(null);
    setRole(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    console.log("[AuthProvider] Cleared user session from sessionStorage.");
    router.push('/login');
  };

  if (isLoading && !user) { // Show loading only if not already showing user content
    return <div className="flex items-center justify-center h-screen"><p>Loading application...</p></div>;
  }

  return (
    <AuthContext.Provider value={{ user, role, login, logout, isLoading, fetchUserDetails }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
