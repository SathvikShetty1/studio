export enum UserRole {
  Customer = 'customer',
  Admin = 'admin',
  Engineer = 'engineer',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string; // URL to avatar image
}
