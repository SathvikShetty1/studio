import type { User, Complaint } from '@/types';
import { UserRole, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '@/types';

export const mockUsers: User[] = [
  { id: 'user-cust1', name: 'Alice Wonderland', email: 'alice@example.com', role: UserRole.Customer, avatar: 'https://picsum.photos/seed/alice/40/40' },
  { id: 'user-cust2', name: 'Bob The Builder', email: 'bob@example.com', role: UserRole.Customer, avatar: 'https://picsum.photos/seed/bob/40/40' },
  { id: 'user-admin1', name: 'Charlie Admin', email: 'charlie@example.com', role: UserRole.Admin, avatar: 'https://picsum.photos/seed/charlie/40/40' },
  { id: 'user-eng1', name: 'Diana Engineer', email: 'diana@example.com', role: UserRole.Engineer, avatar: 'https://picsum.photos/seed/diana/40/40' },
  { id: 'user-eng2', name: 'Edward Scissorhands', email: 'edward@example.com', role: UserRole.Engineer, avatar: 'https://picsum.photos/seed/edward/40/40' },
];

export const mockComplaints: Complaint[] = [
  {
    id: 'complaint-001',
    customerId: 'user-cust1',
    customerName: 'Alice Wonderland',
    category: ComplaintCategory.Product,
    description: 'The new SuperWidget X is not turning on. I followed all instructions, but it seems to be dead on arrival. Very frustrating experience.',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: ComplaintStatus.PendingAssignment,
    priority: ComplaintPriority.High,
    attachments: [
      { id: 'attach-001', fileName: 'widget_photo.jpg', fileType: 'image/jpeg', url: 'https://picsum.photos/seed/widget/200/300' }
    ],
    internalNotes: [
      { id: 'note-001', userId: 'user-admin1', userName: 'Charlie Admin', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), text: 'Customer seems very upset. Needs quick attention.', isInternal: true}
    ]
  },
  {
    id: 'complaint-002',
    customerId: 'user-cust2',
    customerName: 'Bob The Builder',
    category: ComplaintCategory.Service,
    description: 'The support team took 3 days to respond to my previous query. This is unacceptable for a premium service subscription.',
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: ComplaintStatus.Assigned,
    priority: ComplaintPriority.Medium,
    assignedTo: 'user-eng1',
    assignedToName: 'Diana Engineer',
    resolutionTimeline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
  },
  {
    id: 'complaint-003',
    customerId: 'user-cust1',
    customerName: 'Alice Wonderland',
    category: ComplaintCategory.General,
    description: 'The website is very slow to load, especially the account dashboard page. It makes managing my services difficult.',
    submittedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    updatedAt: new Date(Date.now() - 10 * 60 * 1000),
    status: ComplaintStatus.Submitted,
  },
];
