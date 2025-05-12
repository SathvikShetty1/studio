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
    console.log("[complaintService] Adding complaint with data:", JSON.stringify(complaintWithTimestamps, null, 2));
    const docRef = await addDoc(collection(db, 'complaints'), complaintWithTimestamps);
    console.log("[complaintService] Complaint added with ID:", docRef.id);
    const newDocSnap = await getDoc(docRef);
    if (newDocSnap.exists()) {
      return convertComplaintTimestamps({ id: newDocSnap.id, ...newDocSnap.data() });
    }
    console.warn("[complaintService] Newly added complaint not found immediately after creation:", docRef.id);
    return null;
  } catch (error) {
    console.error("[complaintService] Error adding complaint: ", error);
    return null;
  }
}

export async function getUserComplaints(userId: string): Promise<Complaint[]> {
  try {
    const complaintsCol = collection(db, 'complaints');
    const q = query(complaintsCol, where('customerId', '==', userId), orderBy('submittedAt', 'desc'));
    console.log(`[complaintService] Executing query for customerId: ${userId}`);
    const complaintSnapshot = await getDocs(q);
    console.log(`[complaintService] Query for ${userId} found ${complaintSnapshot.size} documents. Empty: ${complaintSnapshot.empty}`);
    
    if (complaintSnapshot.empty) {
      return [];
    }
    
    return complaintSnapshot.docs.map(docNode => {
      const data = docNode.data();
      // console.log(`[complaintService] Raw data for doc ${docNode.id}:`, JSON.stringify(data, null, 2));
      const converted = convertComplaintTimestamps({ id: docNode.id, ...data });
      // console.log(`[complaintService] Converted data for doc ${docNode.id}:`, JSON.stringify(converted, null, 2));
      return converted;
    });
  } catch (error) {
    console.error("[complaintService] Error fetching user complaints for ID " + userId + ":", error);
    return [];
  }
}

export async function getAllComplaints(): Promise<Complaint[]> {
  try {
    const complaintsCol = collection(db, 'complaints');
    const q = query(complaintsCol, orderBy('submittedAt', 'desc'));
    console.log(`[complaintService] Executing query for all complaints.`);
    const complaintSnapshot = await getDocs(q);
    console.log(`[complaintService] Query for all complaints found ${complaintSnapshot.size} documents.`);
    return complaintSnapshot.docs.map(docNode => convertComplaintTimestamps({ id: docNode.id, ...docNode.data() }));
  } catch (error) {
    console.error("[complaintService] Error fetching all complaints: ", error);
    return [];
  }
}

export async function getEngineerComplaints(engineerId: string): Promise<Complaint[]> {
  try {
    const complaintsCol = collection(db, 'complaints');
    const q = query(complaintsCol, where('assignedTo', '==', engineerId), orderBy('updatedAt', 'desc'));
    console.log(`[complaintService] Executing query for engineerId: ${engineerId}`);
    const complaintSnapshot = await getDocs(q);
    console.log(`[complaintService] Query for engineer ${engineerId} found ${complaintSnapshot.size} documents.`);
    return complaintSnapshot.docs.map(docNode => convertComplaintTimestamps({ id: docNode.id, ...docNode.data() }));
  } catch (error) {
    console.error("[complaintService] Error fetching engineer complaints for ID " + engineerId + ":", error);
    return [];
  }
}

export async function updateComplaint(complaintId: string, updates: Partial<Complaint>): Promise<boolean> {
  try {
    const complaintDocRef = doc(db, 'complaints', complaintId);
    const updatesWithTimestamp = { ...updates, updatedAt: serverTimestamp() };
    console.log(`[complaintService] Updating complaint ${complaintId} with data:`, JSON.stringify(updatesWithTimestamp, null, 2));
    await updateDoc(complaintDocRef, updatesWithTimestamp);
    console.log(`[complaintService] Complaint ${complaintId} updated successfully.`);
    return true;
  } catch (error) {
    console.error(`[complaintService] Error updating complaint ${complaintId}: `, error);
    return false;
  }
}

export async function deleteComplaint(complaintId: string): Promise<boolean> {
  try {
    const complaintDocRef = doc(db, 'complaints', complaintId);
    console.log(`[complaintService] Deleting complaint ${complaintId}.`);
    await deleteDoc(complaintDocRef);
    console.log(`[complaintService] Complaint ${complaintId} deleted successfully.`);
    return true;
  } catch (error) {
    console.error(`[complaintService] Error deleting complaint ${complaintId}: `, error);
    return false;
  }
}

export async function getComplaintById(complaintId: string): Promise<Complaint | null> {
  try {
    const complaintDocRef = doc(db, 'complaints', complaintId);
    console.log(`[complaintService] Fetching complaint by ID: ${complaintId}.`);
    const docSnap = await getDoc(complaintDocRef);
    if (docSnap.exists()) {
      console.log(`[complaintService] Complaint ${complaintId} found.`);
      return convertComplaintTimestamps({ id: docSnap.id, ...docSnap.data() });
    }
    console.log(`[complaintService] Complaint ${complaintId} not found.`);
    return null;
  } catch (error) {
    console.error(`[complaintService] Error fetching complaint by ID ${complaintId}: `, error);
    return null;
  }
}