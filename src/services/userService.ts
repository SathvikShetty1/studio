
'use server';
import type { User } from '@/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';

export async function getAllUsers(): Promise<User[]> {
  try {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    return userList;
  } catch (error) {
    console.error("Error fetching all users: ", error);
    return [];
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user by ID: ", error);
    return null;
  }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<boolean> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, updates);
    return true;
  } catch (error) {
    console.error("Error updating user: ", error);
    return false;
  }
}

// Deleting a user in Firestore. Firebase Auth user deletion is separate and more complex.
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);
    return true;
  } catch (error) {
    console.error("Error deleting user: ", error);
    return false;
  }
}

// This function is used during registration to store user details
export async function createUserDetails(userId: string, userDetails: Omit<User, 'id'>): Promise<boolean> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, userDetails);
    return true;
  } catch (error) {
    console.error("Error creating user details in Firestore: ", error);
    return false;
  }
}
