
// /src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import type { User } from '@/types';

export async function GET(req: NextRequest) {
  // TODO: Add authentication and authorization (only admins should access this)
  try {
    await dbConnect();
    const usersFromDb = await UserModel.find({}).select('-passwordHash'); // Exclude passwordHash

    const users: User[] = usersFromDb.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        engineerLevel: user.engineerLevel
    }));
    
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching all users:', error);
    return NextResponse.json({ message: 'Server error fetching users' }, { status: 500 });
  }
}
