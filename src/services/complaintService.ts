
'use server';
import type { Complaint } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';

// Helper to convert Firestore Timestamps to Dates in a complaint object
const convertComplaintTimestamps = (complaintData: any): Complaint => {
  const newComplaint = { ...complaintData };
  if (newComplaint.submittedAt instanceof Timestamp) {
    newComplaint.submittedAt = newComplaint.submittedAt.toDate();
  }
  if (newComplaint.updatedAt instanceof Timestamp) {
    newComplaint.updatedAt = newComplaint.updatedAt.toDate();
  }
  if (newComplaint.resolutionTimeline instanceof Timestamp) {
    newComplaint.resolutionTimeline = newComplaint.resolutionTimeline.toDate();
  }
  if (newComplaint.resolvedAt instanceof Timestamp) {
    newComplaint.resolvedAt = newComplaint.resolvedAt.toDate();
  }
  if (newComplaint.internalNotes) {
    newComplaint.internalNotes = newComplaint.internalNotes.map((note: any) => {
      if (note.timestamp instanceof Timestamp) {
        return { ...note, timestamp: note.timestamp.toDate() };
      }
      return note;
    });
  }
  return newComplaint as Complaint;
};


export async function addComplaint(complaintData: Omit<Complaint, 'id' | 'submittedAt' | 'updatedAt'>): Promise<Complaint | null> {
  try {
    const complaintWithTimestamps = {
      ...complaintData,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'complaints'), complaintWithTimestamps);
    // Fetch the newly added document to get the server-generated timestamps as Date objects
    const newDocSnap = await getDoc(docRef);
    if (newDocSnap.exists()) {
      return convertComplaintTimestamps({ id: newDocSnap.id, ...newDocSnap.data() });
    }
    return null;
  } catch (error) {
    console.error("Error adding complaint: ", error);
    return null;
  }
}

export async function getUserComplaints(userId: string): Promise<Complaint[]> {
  try {
    const complaintsCol = collection(db, 'complaints');
    const q = query(complaintsCol, where('customerId', '==', userId), orderBy('submittedAt', 'desc'));
    const complaintSnapshot = await getDocs(q);
    return complaintSnapshot.docs.map(doc => convertComplaintTimestamps({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching user complaints: ", error);
    return [];
  }
}

export async function getAllComplaints(): Promise<Complaint[]> {
  try {
    const complaintsCol = collection(db, 'complaints');
    const q = query(complaintsCol, orderBy('submittedAt', 'desc'));
    const complaintSnapshot = await getDocs(q);
    return complaintSnapshot.docs.map(doc => convertComplaintTimestamps({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all complaints: ", error);
    return [];
  }
}

export async function getEngineerComplaints(engineerId: string): Promise<Complaint[]> {
  try {
    const complaintsCol = collection(db, 'complaints');
    const q = query(complaintsCol, where('assignedTo', '==', engineerId), orderBy('updatedAt', 'desc'));
    const complaintSnapshot = await getDocs(q);
    return complaintSnapshot.docs.map(doc => convertComplaintTimestamps({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching engineer complaints: ", error);
    return [];
  }
}

export async function updateComplaint(complaintId: string, updates: Partial<Complaint>): Promise<boolean> {
  try {
    const complaintDocRef = doc(db, 'complaints', complaintId);
    // Ensure updatedAt is updated
    const updatesWithTimestamp = { ...updates, updatedAt: serverTimestamp() };
    await updateDoc(complaintDocRef, updatesWithTimestamp);
    return true;
  } catch (error) {
    console.error("Error updating complaint: ", error);
    return false;
  }
}

export async function deleteComplaint(complaintId: string): Promise<boolean> {
  try {
    const complaintDocRef = doc(db, 'complaints', complaintId);
    await deleteDoc(complaintDocRef);
    return true;
  } catch (error) {
    console.error("Error deleting complaint: ", error);
    return false;
  }
}

export async function getComplaintById(complaintId: string): Promise<Complaint | null> {
  try {
    const complaintDocRef = doc(db, 'complaints', complaintId);
    const docSnap = await getDoc(complaintDocRef);
    if (docSnap.exists()) {
      return convertComplaintTimestamps({ id: docSnap.id, ...docSnap.data() });
    }
    return null;
  } catch (error) {
    console.error("Error fetching complaint by ID: ", error);
    return null;
  }
}
