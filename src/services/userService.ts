// src/lib/mock-data.ts
// This file is now deprecated for runtime data management.
// MongoDB Atlas is the source of truth.
// The initial data can be used for seeding the MongoDB database if needed.

import type { User, Complaint } from '@/types';
import { UserRole, ComplaintCategory, ComplaintPriority, ComplaintStatus, EngineerLevel } from '@/types';

// --- Initial hardcoded data (for reference or seeding) ---
export const initialMockUsers: User[] = [
  { id: 'user-cust1', name: 'Alice Wonderland', email: 'alice@example.com', role: UserRole.Customer, avatar: 'https://picsum.photos/seed/alice/40/40' },
  { id: 'user-cust2', name: 'Bob The Builder', email: 'bob@example.com', role: UserRole.Customer, avatar: 'https://picsum.photos/seed/bob/40/40' },
  { id: 'user-admin1', name: 'Charlie Admin', email: 'charlie@example.com', role: UserRole.Admin, avatar: 'https://picsum.photos/seed/charlie/40/40' },
  { id: 'user-eng-jun1', name: 'Diana JuniorEng', email: 'diana@example.com', role: UserRole.Engineer, engineerLevel: EngineerLevel.Junior, avatar: 'https://picsum.photos/seed/diana/40/40' },
  { id: 'user-eng-sen1', name: 'Edward SeniorEng', email: 'edward@example.com', role: UserRole.Engineer, engineerLevel: EngineerLevel.Senior, avatar: 'https://picsum.photos/seed/edward/40/40' },
  { id: 'user-eng-exec1', name: 'Fiona ExecutiveEng', email: 'fiona@example.com', role: UserRole.Engineer, engineerLevel: EngineerLevel.Executive, avatar: 'https://picsum.photos/seed/fiona/40/40' },
];

export const initialMockComplaints: Omit<Complaint, 'id' | 'attachments' | 'internalNotes'>[] & { attachments?: any[], internalNotes?: any[] } = [
  {
    customerId: 'user-cust1', // This would need to be mapped to a MongoDB ObjectId if seeding
    customerName: 'Alice Wonderland',
    category: ComplaintCategory.Product,
    description: 'The new SuperWidget X is not turning on.',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: ComplaintStatus.PendingAssignment,
    priority: ComplaintPriority.High,
    attachments: [
      { fileName: 'widget_photo.jpg', fileType: 'image/jpeg', url: 'https://picsum.photos/seed/widget/200/300' }
    ],
    internalNotes: [
      { userId: 'user-admin1', userName: 'Charlie Admin', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), text: 'Customer seems very upset.', isInternal: true}
    ]
  },
  // Add more initial complaints if needed for seeding
];

// Functions below are deprecated as data is now managed via API and MongoDB.
// They are left here as stubs to prevent build errors if still imported,
// but they should not be used for actual data operations.

export function getAllMockUsers(): User[] {
  console.warn("getAllMockUsers from mock-data.ts is DEPRECATED. Fetch users from API.");
  return []; // Return empty or throw error
}

export function getMockUserById(userId: string): User | undefined {
  console.warn("getMockUserById from mock-data.ts is DEPRECATED.");
  return undefined;
}

export function addMockUser(user: User): void {
  console.warn("addMockUser from mock-data.ts is DEPRECATED. Register user via API.");
}

export function updateMockUser(userId: string, updatedUserData: Partial<User>): void {
 console.warn("updateMockUser from mock-data.ts is DEPRECATED. Update user via API.");
}

export function deleteMockUser(userId: string): void {
  console.warn("deleteMockUser from mock-data.ts is DEPRECATED. Delete user via API.");
}


export function getAllMockComplaints(): Complaint[] {
  console.warn("getAllMockComplaints from mock-data.ts is DEPRECATED. Fetch complaints from API.");
  return [];
}

export function getMockComplaintById(complaintId: string): Complaint | undefined {
 console.warn("getMockComplaintById from mock-data.ts is DEPRECATED.");
  return undefined;
}

export function addComplaintToMock(complaint: Complaint): void {
  console.warn("addComplaintToMock from mock-data.ts is DEPRECATED. Create complaint via API.");
}

export function updateMockComplaint(complaintId: string, updatedComplaintData: Partial<Complaint>): boolean {
  console.warn("updateMockComplaint from mock-data.ts is DEPRECATED. Update complaint via API.");
  return false;
}

export function deleteMockComplaint(complaintId: string): void {
   console.warn("deleteMockComplaint from mock-data.ts is DEPRECATED. Delete complaint via API.");
}