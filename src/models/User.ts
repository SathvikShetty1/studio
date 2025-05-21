
// src/models/User.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { User as UserType } from '@/types/user'; // Assuming your types are here
import { UserRole, EngineerLevel } from '@/types/user'; // Added this import

export interface UserDocument extends Omit<UserType, 'id'>, Document {
  _id: mongoose.Types.ObjectId; // MongoDB's default ID
  passwordHash: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    avatar: { type: String },
    engineerLevel: { type: String, enum: Object.values(EngineerLevel), sparse: true }, // sparse if only for engineers
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

// Prevent model overwrite in Next.js HMR
const UserModel: Model<UserDocument> = models.User || mongoose.model<UserDocument>('User', UserSchema);

export default UserModel;
