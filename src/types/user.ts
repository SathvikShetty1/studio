
export enum UserRole {
  Customer = 'customer',
  Admin = 'admin',
  Engineer = 'engineer',
}

export enum EngineerLevel {
  Junior = 'Junior',
  Senior = 'Senior',
  Executive = 'Executive',
}

export interface User {
  id: string; // Will be MongoDB _id string
  name: string;
  email: string;
  role: UserRole;
  avatar?: string; // URL to avatar image
  engineerLevel?: EngineerLevel;
  // passwordHash should not be part of the frontend User type
}
