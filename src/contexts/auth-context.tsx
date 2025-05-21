
"use client";

import type { User } from '@/types';
import { UserRole } from '@/types';
import { getAllMockUsers } from '@/lib/mock-data'; // Changed import
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  login: (email: string, password?: string, roleOverride?: UserRole) => boolean; 
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log("[AuthProvider] useEffect triggered to check stored user.");
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      console.log("[AuthProvider] Found storedUserId:", storedUserId);
      const allUsers = getAllMockUsers();
      const loggedInUser = allUsers.find(u => u.id === storedUserId);
      if (loggedInUser) {
        console.log("[AuthProvider] User found from localStorage ID:", loggedInUser);
        setUser(loggedInUser);
        setRole(loggedInUser.role);
      } else {
        console.warn("[AuthProvider] StoredUserId found, but no matching user in mock data. Clearing localStorage.");
        localStorage.removeItem('currentUserId'); // Clear invalid stored ID
      }
    } else {
      console.log("[AuthProvider] No storedUserId found.");
    }
    setIsLoading(false);
    console.log("[AuthProvider] Initial loading complete. isLoading set to false.");
  }, []);

  useEffect(() => {
    if (!isLoading) {
      console.log("[AuthProvider] Routing check. User:", user ? user.id : 'null', "Pathname:", pathname);
      if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/register') && pathname !== '/') {
        console.log("[AuthProvider] No user, not on auth pages or landing. Redirecting to /login.");
        router.push('/login');
      } else if (user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
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

  const login = (email: string, password?: string, roleOverride?: UserRole): boolean => {
    console.log(`[AuthProvider] Login attempt for email: ${email}, roleOverride: ${roleOverride}`);
    const allUsers = getAllMockUsers(); // Use function to get users
    const foundUser = allUsers.find(u => u.email === email);

    if (foundUser) {
      // In a real app with passwords, you'd verify the password here.
      // For this localStorage version, we're skipping password check.
      const userToLogin = { ...foundUser };
      if (roleOverride) { // This roleOverride is mainly for easier initial testing without full registration
        userToLogin.role = roleOverride;
      }
      
      console.log("[AuthProvider] User found for login:", userToLogin);
      setUser(userToLogin);
      setRole(userToLogin.role);
      localStorage.setItem('currentUserId', userToLogin.id);
      console.log("[AuthProvider] Stored currentUserId:", userToLogin.id);
      redirectToDashboard(userToLogin.role);
      return true;
    }
    console.warn("[AuthProvider] Login failed: User not found with email:", email);
    return false;
  };

  const logout = () => {
    console.log("[AuthProvider] Logout called.");
    setUser(null);
    setRole(null);
    localStorage.removeItem('currentUserId');
    console.log("[AuthProvider] Cleared currentUserId from localStorage.");
    router.push('/login');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><p>Loading application...</p></div>;
  }

  return (
    <AuthContext.Provider value={{ user, role, login, logout, isLoading }}>
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
