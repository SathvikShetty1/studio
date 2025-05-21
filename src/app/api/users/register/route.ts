
// /src/app/api/users/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import bcrypt from 'bcryptjs';
import type { User, UserRole, EngineerLevel } from '@/types';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    console.log("[Register API] DB Connected.");

    const body = await req.json() as {
        name: string;
        email: string;
        password?: string; // Made password optional here if it's always expected
        role: UserRole;
        engineerLevel?: EngineerLevel;
        avatar?: string;
    };

    const { name, email, password, role, engineerLevel, avatar } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists with this email' }, { status: 409 });
    }
    
    console.log("[Register API] Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    console.log("[Register API] Password hashed. Creating new user model instance...");

    const newUser = new UserModel({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      engineerLevel: role === UserRole.Engineer ? engineerLevel : undefined,
      avatar: avatar || `https://picsum.photos/seed/${encodeURIComponent(email)}/40/40`, // Default avatar
    });

    console.log("[Register API] Saving new user...");
    await newUser.save();
    console.log("[Register API] User saved successfully:", newUser._id);
    
    const userResponse: User = {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
        engineerLevel: newUser.engineerLevel,
    };

    return NextResponse.json({ message: 'User registered successfully', user: userResponse }, { status: 201 });
  } catch (error: any) {
    console.error('Registration API Error:', error); 
    let detail = 'An unexpected error occurred during registration.';
    if (error instanceof Error) {
        detail = error.message;
        if (error.stack) {
            console.error("Stack trace:", error.stack);
        }
    } else if (typeof error === 'string') {
        detail = error;
    } else if (error && typeof error === 'object' && 'toString' in error) {
        detail = (error as { toString: () => string }).toString();
    }

    const errorResponsePayload = {
        message: 'Server error during registration.',
        errorDetail: detail,
        errorCode: error.code, // Include error code if available (e.g., from Mongoose)
        errorName: error.name, // Include error name if available
    };
    console.error('Sending error response payload:', errorResponsePayload);
    return NextResponse.json(errorResponsePayload, { status: 500 });
  }
}
