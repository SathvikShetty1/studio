
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
  Reopened = 'Reopened',
}

export interface ComplaintAttachment {
  id: string; // Will be MongoDB _id string for subdocument
  fileName: string;
  fileType: string;
  url: string; // Data URI or future file storage URL
}

export interface ComplaintNote {
  id: string; // Will be MongoDB _id string for subdocument
  userId: string; // User ID (MongoDB _id string) of the staff member
  userName: string;
  timestamp: Date;
  text: string;
  isInternal: boolean;
}

export interface Complaint {
  id: string; // Will be MongoDB _id string
  customerId: string; // User ID (MongoDB _id string)
  customerName: string;
  category: ComplaintCategory;
  description: string;
  attachments?: ComplaintAttachment[];
  submittedAt: Date;
  updatedAt: Date;
  status: ComplaintStatus;
  priority?: ComplaintPriority;
  assignedTo?: string; // Engineer's User ID (MongoDB _id string)
  assignedToName?: string;
  currentHandlerLevel?: EngineerLevel;
  resolutionTimeline?: Date;
  resolvedAt?: Date;
  resolutionDetails?: string;
  internalNotes?: ComplaintNote[];
  customerFeedback?: {
    rating: number;
    comment?: string;
  };
}
