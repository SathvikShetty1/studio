
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
  Reopened = 'Reopened', // Added Reopened status
}

export interface ComplaintAttachment {
  id: string;
  fileName: string;
  fileType: string;
  url: string; // URL to the uploaded file
}

export interface ComplaintNote {
  id: string;
  userId: string; // ID of the staff member who added the note
  userName: string;
  timestamp: Date;
  text: string;
  isInternal: boolean; // True for staff-only notes
}

export interface Complaint {
  id: string;
  customerId: string;
  customerName: string;
  category: ComplaintCategory;
  description: string;
  attachments?: ComplaintAttachment[];
  submittedAt: Date;
  updatedAt: Date;
  status: ComplaintStatus;
  priority?: ComplaintPriority;
  assignedTo?: string; // Engineer's User ID
  assignedToName?: string;
  currentHandlerLevel?: EngineerLevel; // Level of the currently assigned engineer
  resolutionTimeline?: Date; // Expected resolution date
  resolvedAt?: Date;
  resolutionDetails?: string;
  internalNotes?: ComplaintNote[];
  customerFeedback?: {
    rating: number; // e.g., 1-5 stars
    comment?: string;
  };
}
