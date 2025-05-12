
'use server';
import type { Complaint } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';

// Helper to convert Firestore Timestamps to Dates in a complaint object
const convertComplaintTimestamps = (complaintData: any): Complaint => {
  const newComplaint = { ...complaintData };
  // Check if the field exists and is a Timestamp before converting
  if (newComplaint.submittedAt && newComplaint.submittedAt instanceof Timestamp) {
    newComplaint.submittedAt = newComplaint.submittedAt.toDate();
  } else if (typeof newComplaint.submittedAt === 'string') { // Handle if already stringified date
    newComplaint.submittedAt = new Date(newComplaint.submittedAt);
  } else if (newComplaint.submittedAt && typeof newComplaint.submittedAt.seconds === 'number') { // Handle object form of Timestamp
    newComplaint.submittedAt = new Timestamp(newComplaint.submittedAt.seconds, newComplaint.submittedAt.nanoseconds).toDate();
  }


  if (newComplaint.updatedAt && newComplaint.updatedAt instanceof Timestamp) {
    newComplaint.updatedAt = newComplaint.updatedAt.toDate();
  } else if (typeof newComplaint.updatedAt === 'string') {
    newComplaint.updatedAt = new Date(newComplaint.updatedAt);
  } else if (newComplaint.updatedAt && typeof newComplaint.updatedAt.seconds === 'number') {
    newComplaint.updatedAt = new Timestamp(newComplaint.updatedAt.seconds, newComplaint.updatedAt.nanoseconds).toDate();
  }

  if (newComplaint.resolutionTimeline && newComplaint.resolutionTimeline instanceof Timestamp) {
    newComplaint.resolutionTimeline = newComplaint.resolutionTimeline.toDate();
  } else if (typeof newComplaint.resolutionTimeline === 'string') {
    newComplaint.resolutionTimeline = new Date(newComplaint.resolutionTimeline);
  } else if (newComplaint.resolutionTimeline && typeof newComplaint.resolutionTimeline.seconds === 'number') {
    newComplaint.resolutionTimeline = new Timestamp(newComplaint.resolutionTimeline.seconds, newComplaint.resolutionTimeline.nanoseconds).toDate();
  }


  if (newComplaint.resolvedAt && newComplaint.resolvedAt instanceof Timestamp) {
    newComplaint.resolvedAt = newComplaint.resolvedAt.toDate();
  } else if (typeof newComplaint.resolvedAt === 'string') {
    newComplaint.resolvedAt = new Date(newComplaint.resolvedAt);
  } else if (newComplaint.resolvedAt && typeof newComplaint.resolvedAt.seconds === 'number') {
    newComplaint.resolvedAt = new Timestamp(newComplaint.resolvedAt.seconds, newComplaint.resolvedAt.nanoseconds).toDate();
  }


  if (newComplaint.internalNotes && Array.isArray(newComplaint.internalNotes)) {
    newComplaint.internalNotes = newComplaint.internalNotes.map((note: any) => {
      if (note.timestamp && note.timestamp instanceof Timestamp) {
        return { ...note, timestamp: note.timestamp.toDate() };
      } else if (note.timestamp && typeof note.timestamp === 'string') {
        return { ...note, timestamp: new Date(note.timestamp) };
      } else if (note.timestamp && typeof note.timestamp.seconds === 'number') {
        return { ...note, timestamp: new Timestamp(note.timestamp.seconds, note.timestamp.nanoseconds).toDate()};
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
    console.log("[complaintService][addComplaint] Adding complaint with data:", JSON.stringify(complaintData, null, 2)); // Log input data
    const docRef = await addDoc(collection(db, 'complaints'), complaintWithTimestamps);
    console.log("[complaintService][addComplaint] Complaint added with ID:", docRef.id);
    const newDocSnap = await getDoc(docRef);
    if (newDocSnap.exists()) {
      const newComplaint = convertComplaintTimestamps({ id: newDocSnap.id, ...newDocSnap.data() });
      console.log("[complaintService][addComplaint] Returning new complaint:", JSON.stringify(newComplaint, null, 2));
      return newComplaint;
    }
    console.warn("[complaintService][addComplaint] Newly added complaint not found immediately after creation:", docRef.id);
    return null;
  } catch (error) {
    console.error("[complaintService][addComplaint] Error adding complaint: ", error);
    return null;
  }
}

export async function getUserComplaints(userId: string): Promise<Complaint[]> {
  try {
    if (typeof userId !== 'string' || userId.trim() === '') {
      console.error("[complaintService][getUserComplaints] Invalid or empty userId provided:", userId);
      return [];
    }

    const complaintsCol = collection(db, 'complaints');
    const q = query(complaintsCol, where('customerId', '==', userId), orderBy('submittedAt', 'desc'));
    
    console.log(`[complaintService][getUserComplaints] Executing Firestore query for customerId: "${userId}"`);
    const complaintSnapshot = await getDocs(q);
    
    console.log(`[complaintService][getUserComplaints] Firestore query for customerId "${userId}" returned ${complaintSnapshot.size} documents. Is empty: ${complaintSnapshot.empty}`);

    if (complaintSnapshot.empty) {
      return [];
    }
    
    const fetchedComplaints = complaintSnapshot.docs.map(docNode => {
      const rawData = docNode.data();
      // Log the raw customerId from the document to ensure it matches the queried userId
      console.log(`[complaintService][getUserComplaints] Raw data for doc ${docNode.id} (Firestore customerId: ${rawData.customerId}):`, JSON.stringify(rawData));
      try {
        const converted = convertComplaintTimestamps({ id: docNode.id, ...rawData });
        return converted;
      } catch (e) {
        console.error(`[complaintService][getUserComplaints] Error converting document ${docNode.id}:`, e, "Raw data was:", rawData);
        return null; 
      }
    }).filter(complaint => complaint !== null) as Complaint[]; // Filter out any nulls from conversion errors
    
    console.log(`[complaintService][getUserComplaints] Successfully processed and returning ${fetchedComplaints.length} complaints for customerId "${userId}".`);
    return fetchedComplaints;

  } catch (error) {
    console.error(`[complaintService][getUserComplaints] General error fetching user complaints for ID "${userId}":`, error);
    return [];
  }
}

export async function getAllComplaints(): Promise<Complaint[]> {
  try {
    const complaintsCol = collection(db, 'complaints');
    const q = query(complaintsCol, orderBy('submittedAt', 'desc'));
    console.log(`[complaintService][getAllComplaints] Executing query for all complaints.`);
    const complaintSnapshot = await getDocs(q);
    console.log(`[complaintService][getAllComplaints] Query for all complaints found ${complaintSnapshot.size} documents.`);
    return complaintSnapshot.docs.map(docNode => convertComplaintTimestamps({ id: docNode.id, ...docNode.data() }));
  } catch (error) {
    console.error("[complaintService][getAllComplaints] Error fetching all complaints: ", error);
    return [];
  }
}

export async function getEngineerComplaints(engineerId: string): Promise<Complaint[]> {
  try {
    const complaintsCol = collection(db, 'complaints');
    const q = query(complaintsCol, where('assignedTo', '==', engineerId), orderBy('updatedAt', 'desc'));
    console.log(`[complaintService][getEngineerComplaints] Executing query for engineerId: ${engineerId}`);
    const complaintSnapshot = await getDocs(q);
    console.log(`[complaintService][getEngineerComplaints] Query for engineer ${engineerId} found ${complaintSnapshot.size} documents.`);
    return complaintSnapshot.docs.map(docNode => convertComplaintTimestamps({ id: docNode.id, ...docNode.data() }));
  } catch (error) {
    console.error("[complaintService][getEngineerComplaints] Error fetching engineer complaints for ID " + engineerId + ":", error);
    return [];
  }
}

export async function updateComplaint(complaintId: string, updates: Partial<Complaint>): Promise<boolean> {
  try {
    const complaintDocRef = doc(db, 'complaints', complaintId);
    const updatesWithTimestamp = { ...updates, updatedAt: serverTimestamp() };
    console.log(`[complaintService][updateComplaint] Updating complaint ${complaintId} with data:`, JSON.stringify(updatesWithTimestamp, null, 2));
    await updateDoc(complaintDocRef, updatesWithTimestamp);
    console.log(`[complaintService][updateComplaint] Complaint ${complaintId} updated successfully.`);
    return true;
  } catch (error) {
    console.error(`[complaintService][updateComplaint] Error updating complaint ${complaintId}: `, error);
    return false;
  }
}

export async function deleteComplaint(complaintId: string): Promise<boolean> {
  try {
    const complaintDocRef = doc(db, 'complaints', complaintId);
    console.log(`[complaintService][deleteComplaint] Deleting complaint ${complaintId}.`);
    await deleteDoc(complaintDocRef);
    console.log(`[complaintService][deleteComplaint] Complaint ${complaintId} deleted successfully.`);
    return true;
  } catch (error) {
    console.error(`[complaintService][deleteComplaint] Error deleting complaint ${complaintId}: `, error);
    return false;
  }
}

export async function getComplaintById(complaintId: string): Promise<Complaint | null> {
  try {
    const complaintDocRef = doc(db, 'complaints', complaintId);
    console.log(`[complaintService][getComplaintById] Fetching complaint by ID: ${complaintId}.`);
    const docSnap = await getDoc(complaintDocRef);
    if (docSnap.exists()) {
      console.log(`[complaintService][getComplaintById] Complaint ${complaintId} found.`);
      return convertComplaintTimestamps({ id: docSnap.id, ...docSnap.data() });
    }
    console.log(`[complaintService][getComplaintById] Complaint ${complaintId} not found.`);
    return null;
  } catch (error) {
    console.error(`[complaintService][getComplaintById] Error fetching complaint by ID ${complaintId}: `, error);
    return null;
  }
}
