
"use client";

import type { User } from '@/types';
import { UserRole } from '@/types';
import { auth, db } from '@/lib/firebase'; // Import Firebase instances
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUserById } from '@/services/userService';


interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null; // Store Firebase user object
  role: UserRole | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null); // Our app's User type
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null); // Firebase Auth User
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        // Fetch additional user details from Firestore
        const userDetails = await getUserById(fbUser.uid);
        if (userDetails) {
          setUser(userDetails);
          setRole(userDetails.role);
        } else {
          // This case might happen if Firestore data is missing, handle appropriately
          console.warn("User details not found in Firestore for UID:", fbUser.uid);
          setUser(null); // Or set a minimal user object based on fbUser
          setRole(null);
          // Potentially log out if critical details are missing
          // await firebaseSignOut(auth);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
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

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting user and role state
      // Forcing a fetch here might be redundant but ensures immediate update if needed
      const userDetails = await getUserById(userCredential.user.uid);
      if (userDetails) {
        setUser(userDetails);
        setRole(userDetails.role);
         // Redirect after login
        switch (userDetails.role) {
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
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Firebase login error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will clear user, firebaseUser, and role
      router.push('/login');
    } catch (error) {
      console.error("Firebase logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, role, login, logout, isLoading }}>
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
