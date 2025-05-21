
// /src/app/api/users/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import bcrypt from 'bcryptjs';
import type { User, UserRole, EngineerLevel } from '@/types';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json() as {
        name: string;
        email: string;
        password?: string;
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

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new UserModel({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      engineerLevel: role === UserRole.Engineer ? engineerLevel : undefined,
      avatar: avatar || `https://picsum.photos/seed/${encodeURIComponent(email)}/40/40`, // Default avatar
    });

    await newUser.save();
    
    const userResponse: User = {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
        engineerLevel: newUser.engineerLevel,
    };

    return NextResponse.json({ message: 'User registered successfully', user: userResponse }, { status: 201 });
  } catch (error) {
    console.error('Registration API Error:', error); // More specific log prefix
    let detail = 'An unexpected error occurred during registration.';
    if (error instanceof Error) {
        detail = error.message;
    } else if (typeof error === 'string') {
        detail = error;
    } else if (typeof error === 'object' && error !== null && 'toString' in error) {
        // Attempt to get a string representation of the error
        detail = (error as { toString: () => string }).toString();
    }

    // Ensure the object passed to NextResponse.json is always simple
    const errorResponsePayload = {
        message: 'Server error during registration.',
        errorDetail: detail,
    };
    console.error('Sending error response payload:', errorResponsePayload);
    return NextResponse.json(errorResponsePayload, { status: 500 });
  }
}
