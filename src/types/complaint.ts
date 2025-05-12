
import type { EngineerLevel } from './user';

export enum ComplaintCategory {
  Product = 'Product',
  Service = 'Service',
  General = 'General',
}

export enum ComplaintPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Escalated = 'Escalated',
}

export enum ComplaintStatus {
  Submitted = 'Submitted',
  InProgress = 'In Progress',
  PendingAssignment = 'Pending Assignment',
  Assigned = 'Assigned',
  Resolved = 'Resolved',
  Unresolved = 'Unresolved',
  Closed = 'Closed',
  Escalated = 'Escalated',
}

export interface ComplaintAttachment {
  id: string;
  fileName: string;
  fileType: string;
  url: string; 
}

export interface ComplaintNote {
  id: string;
  userId: string; 
  userName: string; 
  timestamp: Date; // Firestore Timestamps will be converted to Date objects by service layer
  text: string;
  isInternal: boolean;
}

export interface Complaint {
  id: string;
  customerId: string;
  customerName: string;
  category: ComplaintCategory;
  description: string;
  attachments?: ComplaintAttachment[];
  submittedAt: Date; // Firestore Timestamps will be converted to Date objects
  updatedAt: Date;   // Firestore Timestamps will be converted to Date objects
  status: ComplaintStatus;
  priority?: ComplaintPriority;
  assignedTo?: string; 
  assignedToName?: string;
  currentHandlerLevel?: EngineerLevel; 
  resolutionTimeline?: Date; // Firestore Timestamps will be converted to Date objects
  resolvedAt?: Date;         // Firestore Timestamps will be converted to Date objects
  resolutionDetails?: string;
  internalNotes?: ComplaintNote[];
  customerFeedback?: {
    rating: number; 
    comment?: string;
  };
}
