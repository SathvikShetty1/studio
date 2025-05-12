
// Types and Enums are still defined in src/types/
// Mock user and complaint data arrays are removed as data will be live from Firestore.

// If you need placeholder data for UI development without hitting Firestore during certain tests,
// you can re-create minimal mock arrays here, but they won't be the source of truth for the app.

// For example, if you had specific test users or scenarios:
// export const exampleTestUsers: User[] = [
//   { id: 'test-user1', name: 'Test Customer', email: 'test@example.com', role: UserRole.Customer },
// ];
// export const exampleTestComplaints: Complaint[] = [
//   { id: 'test-complaint1', customerId: 'test-user1', customerName: 'Test Customer', ... }
// ];

// But for the live application, these are no longer used.
// The mockUsers and mockComplaints arrays that were previously mutated are removed.
// All data will be fetched from and written to Firestore.
