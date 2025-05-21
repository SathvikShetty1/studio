
// /src/app/api/users/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import bcrypt from 'bcryptjs';
import type { User, UserRole, EngineerLevel } from '@/types';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { name, email, password, role, engineerLevel, avatar } = await req.json() as {
        name: string;
        email: string;
        password?: string; // Password might not be sent if using OAuth later
        role: UserRole;
        engineerLevel?: EngineerLevel;
        avatar?: string;
    };

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
      avatar: avatar || `https://picsum.photos/seed/${email}/40/40`, // Default avatar
    });

    await newUser.save();
    
    // Don't send passwordHash back to client
    const userResponse = {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
        engineerLevel: newUser.engineerLevel,
    };

    return NextResponse.json({ message: 'User registered successfully', user: userResponse }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    let errorMessage = 'An unexpected error occurred during registration.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: 'Server error during registration', error: errorMessage }, { status: 500 });
  }
}
