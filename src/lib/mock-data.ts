
import type { User, Complaint } from '@/types';
import { UserRole, ComplaintCategory, ComplaintPriority, ComplaintStatus, EngineerLevel } from '@/types';

// Keys for localStorage
const USERS_STORAGE_KEY = 'complaintCentralUsers';
const COMPLAINTS_STORAGE_KEY = 'complaintCentralComplaints';

// --- Helper function to get data from localStorage ---
function getFromStorage<T>(key: string, defaultValue: T[]): T[] {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  const storedValue = localStorage.getItem(key);
  if (storedValue) {
    try {
      return JSON.parse(storedValue) as T[];
    } catch (e) {
      console.error(`Error parsing ${key} from localStorage`, e);
      return defaultValue;
    }
  }
  return defaultValue;
}

// --- Helper function to save data to localStorage ---
function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
}

// --- Initial hardcoded data (used if localStorage is empty) ---
const initialMockUsers: User[] = [
  { id: 'user-cust1', name: 'Alice Wonderland', email: 'alice@example.com', role: UserRole.Customer, avatar: 'https://picsum.photos/seed/alice/40/40' },
  { id: 'user-cust2', name: 'Bob The Builder', email: 'bob@example.com', role: UserRole.Customer, avatar: 'https://picsum.photos/seed/bob/40/40' },
  { id: 'user-admin1', name: 'Charlie Admin', email: 'charlie@example.com', role: UserRole.Admin, avatar: 'https://picsum.photos/seed/charlie/40/40' },
  { id: 'user-eng-jun1', name: 'Diana JuniorEng', email: 'diana@example.com', role: UserRole.Engineer, engineerLevel: EngineerLevel.Junior, avatar: 'https://picsum.photos/seed/diana/40/40' },
  { id: 'user-eng-sen1', name: 'Edward SeniorEng', email: 'edward@example.com', role: UserRole.Engineer, engineerLevel: EngineerLevel.Senior, avatar: 'https://picsum.photos/seed/edward/40/40' },
  { id: 'user-eng-exec1', name: 'Fiona ExecutiveEng', email: 'fiona@example.com', role: UserRole.Engineer, engineerLevel: EngineerLevel.Executive, avatar: 'https://picsum.photos/seed/fiona/40/40' },
  { id: 'user-eng-jun2', name: 'Gary JuniorEng', email: 'gary@example.com', role: UserRole.Engineer, engineerLevel: EngineerLevel.Junior, avatar: 'https://picsum.photos/seed/gary/40/40' },
  { id: 'user-eng-sen2', name: 'Helen SeniorEng', email: 'helen@example.com', role: UserRole.Engineer, engineerLevel: EngineerLevel.Senior, avatar: 'https://picsum.photos/seed/helen/40/40' },
];

const initialMockComplaints: Complaint[] = [
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
    assignedTo: 'user-eng-jun1', 
    assignedToName: 'Diana JuniorEng',
    currentHandlerLevel: EngineerLevel.Junior,
    resolutionTimeline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 
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
    status: ComplaintStatus.Unresolved, 
    priority: ComplaintPriority.Medium,
    assignedTo: 'user-eng-jun2', 
    assignedToName: 'Gary JuniorEng',
    currentHandlerLevel: EngineerLevel.Junior,
    internalNotes: [
      { id: 'note-002', userId: 'user-eng-jun2', userName: 'Gary JuniorEng', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), text: 'Cannot resolve with current knowledge. Needs senior input on Feature X.', isInternal: true}
    ]
  },
];

// --- User Data Management ---
let MOCK_USERS_STORE: User[] = getFromStorage<User>(USERS_STORAGE_KEY, initialMockUsers);

export function getAllMockUsers(): User[] {
  // Ensure dates are Date objects if they are stored as strings
  return MOCK_USERS_STORE.map(user => ({ ...user }));
}

export function getMockUserById(userId: string): User | undefined {
  return MOCK_USERS_STORE.find(user => user.id === userId);
}

export function addMockUser(user: User): void {
  MOCK_USERS_STORE.push(user);
  saveToStorage(USERS_STORAGE_KEY, MOCK_USERS_STORE);
}

export function updateMockUser(userId: string, updatedUserData: Partial<User>): void {
  MOCK_USERS_STORE = MOCK_USERS_STORE.map(user =>
    user.id === userId ? { ...user, ...updatedUserData } : user
  );
  saveToStorage(USERS_STORAGE_KEY, MOCK_USERS_STORE);
}

export function deleteMockUser(userId: string): void {
  MOCK_USERS_STORE = MOCK_USERS_STORE.filter(user => user.id !== userId);
  saveToStorage(USERS_STORAGE_KEY, MOCK_USERS_STORE);
}

// --- Complaint Data Management ---
let MOCK_COMPLAINTS_STORE: Complaint[] = getFromStorage<Complaint>(COMPLAINTS_STORAGE_KEY, initialMockComplaints).map(complaint => ({
  ...complaint,
  submittedAt: new Date(complaint.submittedAt),
  updatedAt: new Date(complaint.updatedAt),
  resolutionTimeline: complaint.resolutionTimeline ? new Date(complaint.resolutionTimeline) : undefined,
  resolvedAt: complaint.resolvedAt ? new Date(complaint.resolvedAt) : undefined,
  internalNotes: complaint.internalNotes?.map(note => ({...note, timestamp: new Date(note.timestamp)}))
}));


export function getAllMockComplaints(): Complaint[] {
 return MOCK_COMPLAINTS_STORE.map(complaint => ({
    ...complaint,
    submittedAt: new Date(complaint.submittedAt),
    updatedAt: new Date(complaint.updatedAt),
    resolutionTimeline: complaint.resolutionTimeline ? new Date(complaint.resolutionTimeline) : undefined,
    resolvedAt: complaint.resolvedAt ? new Date(complaint.resolvedAt) : undefined,
    internalNotes: complaint.internalNotes?.map(note => ({...note, timestamp: new Date(note.timestamp)}))
  }));
}

export function getMockComplaintById(complaintId: string): Complaint | undefined {
  const complaint = MOCK_COMPLAINTS_STORE.find(c => c.id === complaintId);
  if (complaint) {
    return {
        ...complaint,
        submittedAt: new Date(complaint.submittedAt),
        updatedAt: new Date(complaint.updatedAt),
        resolutionTimeline: complaint.resolutionTimeline ? new Date(complaint.resolutionTimeline) : undefined,
        resolvedAt: complaint.resolvedAt ? new Date(complaint.resolvedAt) : undefined,
        internalNotes: complaint.internalNotes?.map(note => ({...note, timestamp: new Date(note.timestamp)}))
    };
  }
  return undefined;
}

export function addComplaintToMock(complaint: Complaint): void {
  const newComplaint = {
    ...complaint,
    submittedAt: new Date(complaint.submittedAt),
    updatedAt: new Date(complaint.updatedAt),
  };
  MOCK_COMPLAINTS_STORE.unshift(newComplaint); // Add to the beginning of the array
  saveToStorage(COMPLAINTS_STORAGE_KEY, MOCK_COMPLAINTS_STORE);
}

export function updateMockComplaint(complaintId: string, updatedComplaintData: Partial<Complaint>): void {
  MOCK_COMPLAINTS_STORE = MOCK_COMPLAINTS_STORE.map(complaint =>
    complaint.id === complaintId ? { 
        ...complaint, 
        ...updatedComplaintData, 
        updatedAt: new Date(), // Always update the 'updatedAt' timestamp
        // Ensure date fields remain Date objects
        submittedAt: new Date(updatedComplaintData.submittedAt || complaint.submittedAt),
        resolutionTimeline: updatedComplaintData.resolutionTimeline ? new Date(updatedComplaintData.resolutionTimeline) : (complaint.resolutionTimeline ? new Date(complaint.resolutionTimeline) : undefined),
        resolvedAt: updatedComplaintData.resolvedAt ? new Date(updatedComplaintData.resolvedAt) : (complaint.resolvedAt ? new Date(complaint.resolvedAt) : undefined),
      } 
      : complaint
  );
  saveToStorage(COMPLAINTS_STORAGE_KEY, MOCK_COMPLAINTS_STORE);
}

export function deleteMockComplaint(complaintId: string): void {
  MOCK_COMPLAINTS_STORE = MOCK_COMPLAINTS_STORE.filter(complaint => complaint.id !== complaintId);
  saveToStorage(COMPLAINTS_STORAGE_KEY, MOCK_COMPLAINTS_STORE);
}

// --- Initialize stores from localStorage on load (client-side only) ---
if (typeof window !== 'undefined') {
  MOCK_USERS_STORE = getFromStorage<User>(USERS_STORAGE_KEY, initialMockUsers);
  MOCK_COMPLAINTS_STORE = getFromStorage<Complaint>(COMPLAINTS_STORAGE_KEY, initialMockComplaints).map(complaint => ({
    ...complaint,
    submittedAt: new Date(complaint.submittedAt),
    updatedAt: new Date(complaint.updatedAt),
    resolutionTimeline: complaint.resolutionTimeline ? new Date(complaint.resolutionTimeline) : undefined,
    resolvedAt: complaint.resolvedAt ? new Date(complaint.resolvedAt) : undefined,
    internalNotes: complaint.internalNotes?.map(note => ({...note, timestamp: new Date(note.timestamp)}))
  }));
}
