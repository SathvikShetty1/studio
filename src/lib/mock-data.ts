import type { User, Complaint } from '@/types';
import { UserRole, ComplaintCategory, ComplaintPriority, ComplaintStatus, EngineerLevel } from '@/types';

export const mockUsers: User[] = [
  { id: 'user-cust1', name: 'Alice Wonderland', email: 'alice@example.com', role: UserRole.Customer, avatar: 'https://picsum.photos/seed/alice/40/40' },
  { id: 'user-cust2', name: 'Bob The Builder', email: 'bob@example.com', role: UserRole.Customer, avatar: 'https://picsum.photos/seed/bob/40/40' },
  { id: 'user-admin1', name: 'Charlie Admin', email: 'charlie@example.com', role: UserRole.Admin, avatar: 'https://picsum.photos/seed/charlie/40/40' },
  { id: 'user-eng-jun1', name: 'Diana JuniorEng', email: 'diana@example.com', role: UserRole.Engineer, engineerLevel: EngineerLevel.Junior, avatar: 'https://picsum.photos/seed/diana/40/40' },
  { id: 'user-eng-sen1', name: 'Edward SeniorEng', email: 'edward@example.com', role: UserRole.Engineer, engineerLevel: EngineerLevel.Senior, avatar: 'https://picsum.photos/seed/edward/40/40' },
  { id: 'user-eng-exec1', name: 'Fiona ExecutiveEng', email: 'fiona@example.com', role: UserRole.Engineer, engineerLevel: EngineerLevel.Executive, avatar: 'https://picsum.photos/seed/fiona/40/40' },
  { id: 'user-eng-jun2', name: 'Gary JuniorEng', email: 'gary@example.com', role: UserRole.Engineer, engineerLevel: EngineerLevel.Junior, avatar: 'https://picsum.photos/seed/gary/40/40' },
  { id: 'user-eng-sen2', name: 'Helen SeniorEng', email: 'helen@example.com', role: UserRole.Engineer, engineerLevel: EngineerLevel.Senior, avatar: 'https://picsum.photos/seed/helen/40/40' },
];

export let mockComplaints: Complaint[] = [
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
    assignedTo: 'user-eng-jun1', // Diana JuniorEng
    assignedToName: 'Diana JuniorEng',
    currentHandlerLevel: EngineerLevel.Junior,
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
   {
    id: 'complaint-004',
    customerId: 'user-cust2',
    customerName: 'Bob The Builder',
    category: ComplaintCategory.Product,
    description: 'Product documentation is unclear about feature X. Needs better explanation.',
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: ComplaintStatus.Unresolved, // Marked as unresolved by a junior engineer
    priority: ComplaintPriority.Medium,
    assignedTo: 'user-eng-jun2', // Gary JuniorEng
    assignedToName: 'Gary JuniorEng',
    currentHandlerLevel: EngineerLevel.Junior,
    internalNotes: [
      { id: 'note-002', userId: 'user-eng-jun2', userName: 'Gary JuniorEng', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), text: 'Cannot resolve with current knowledge. Needs senior input on Feature X.', isInternal: true}
    ]
  },
];
