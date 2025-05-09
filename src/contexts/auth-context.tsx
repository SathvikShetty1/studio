"use client";

import type { User } from '@/types';
import { UserRole } from '@/types';
import { mockUsers } from '@/lib/mock-data';
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  login: (email: string, roleOverride?: UserRole) => boolean; // roleOverride for easy testing
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
    // Simulate checking for a logged-in user from localStorage or a cookie
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      setUser(parsedUser);
      setRole(parsedUser.role);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && !user && !pathname.startsWith('/login') && !pathname.startsWith('/register') && pathname !== '/') {
      router.push('/login');
    } else if (!isLoading && user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
       switch (user.role) {
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
    }
  }, [user, isLoading, pathname, router]);

  const login = (email: string, roleOverride?: UserRole): boolean => {
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser) {
      const userToLogin = { ...foundUser };
      if (roleOverride) {
        userToLogin.role = roleOverride;
      }
      setUser(userToLogin);
      setRole(userToLogin.role);
      localStorage.setItem('currentUser', JSON.stringify(userToLogin));
      
      // Redirect after login
      switch (userToLogin.role) {
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
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  if (isLoading) {
    // You can return a loading spinner here if needed
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
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
