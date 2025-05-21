
// /src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import UserModel from '@/models/User';
import type { User } from '@/types';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: Add authentication and authorization
  const { id } = params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const userDoc = await UserModel.findById(id).select('-passwordHash');

    if (!userDoc) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user: User = {
      id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      avatar: userDoc.avatar,
      engineerLevel: userDoc.engineerLevel,
    };

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error(`Error fetching user by ID ${id}:`, error);
    return NextResponse.json({ message: 'Server error fetching user' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: Add authentication and authorization (only admin or user themselves for certain fields)
  const { id } = params;
   if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const updateData = await req.json();
    
    // Prevent passwordHash from being updated directly through this route
    if (updateData.passwordHash) delete updateData.passwordHash;
    if (updateData.password) delete updateData.password; // if client sends plain password

    const updatedUserDoc = await UserModel.findByIdAndUpdate(id, updateData, { new: true }).select('-passwordHash');

    if (!updatedUserDoc) {
      return NextResponse.json({ message: 'User not found to update' }, { status: 404 });
    }
    
    const userResponse: User = {
      id: updatedUserDoc._id.toString(),
      name: updatedUserDoc.name,
      email: updatedUserDoc.email,
      role: updatedUserDoc.role,
      avatar: updatedUserDoc.avatar,
      engineerLevel: updatedUserDoc.engineerLevel,
    };

    return NextResponse.json({ message: 'User updated successfully', user: userResponse }, { status: 200 });
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    return NextResponse.json({ message: 'Server error updating user' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: Add authentication and authorization (only admin)
  const { id } = params;
   if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const deletedUser = await UserModel.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ message: 'User not found to delete' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    return NextResponse.json({ message: 'Server error deleting user' }, { status: 500 });
  }
}
