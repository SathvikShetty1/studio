
// /src/app/api/complaints/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ComplaintModel from '@/models/Complaint';
import UserModel from '@/models/User'; // For populating user details
import type { Complaint as ComplaintType, ComplaintAttachment as ComplaintAttachmentType } from '@/types';
import mongoose from 'mongoose';

// Helper to convert DB doc to frontend type
const mapComplaintToFrontend = (doc: any): ComplaintType => {
  const complaint = doc.toObject({ virtuals: true });
  return {
    ...complaint,
    id: complaint._id.toString(),
    customerId: complaint.customerId?.toString(), // if populated, it's an object, otherwise just ID
    assignedTo: complaint.assignedTo?._id?.toString() || complaint.assignedTo?.toString(), // Handle populated or just ID
    assignedToName: complaint.assignedTo?.name || complaint.assignedToName, // Use populated name if available
    internalNotes: complaint.internalNotes?.map((note: any) => ({
      ...note,
      id: note._id?.toString(),
      userId: note.userId?._id?.toString() || note.userId?.toString(), // Handle populated or just ID
      userName: note.userId?.name || note.userName,
      timestamp: new Date(note.timestamp),
    })) || [],
    attachments: complaint.attachments?.map((att: any) => ({
      ...att,
      id: att._id?.toString(),
    })) || [],
    submittedAt: new Date(complaint.submittedAt),
    updatedAt: new Date(complaint.updatedAt),
    resolutionTimeline: complaint.resolutionTimeline ? new Date(complaint.resolutionTimeline) : undefined,
    resolvedAt: complaint.resolvedAt ? new Date(complaint.resolvedAt) : undefined,
  };
};


export async function POST(req: NextRequest) {
  // TODO: Ensure user is authenticated to submit a complaint
  try {
    await dbConnect();
    const body = await req.json();

    const { customerId, customerName, category, description, attachments, status, priority } = body;

    if (!customerId || !customerName || !category || !description || !status) {
        return NextResponse.json({ message: 'Missing required fields for complaint' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return NextResponse.json({ message: 'Invalid customerId' }, { status: 400 });
    }
    
    // IMPORTANT: For production, upload attachments to a file storage (S3, Cloudinary, Firebase Storage)
    // and store the URL or file key here. Storing base64 directly in MongoDB is not recommended for large files.
    // For now, we'll assume `attachments.url` contains the data URI as per current setup.
    const processedAttachments = attachments?.map((att: Omit<ComplaintAttachmentType, 'id'>) => ({
      fileName: att.fileName,
      fileType: att.fileType,
      url: att.url, // This is the data URI
    })) || [];

    const newComplaint = new ComplaintModel({
      ...body,
      attachments: processedAttachments,
      submittedAt: new Date(),
      updatedAt: new Date(),
    });

    await newComplaint.save();
    const populatedComplaint = await ComplaintModel.findById(newComplaint._id)
      .populate('customerId', 'name email') // Example population
      .populate('assignedTo', 'name email');
      
    return NextResponse.json(mapComplaintToFrontend(populatedComplaint), { status: 201 });
  } catch (error) {
    console.error('Error creating complaint:', error);
    let errorMessage = 'Server error creating complaint.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage, details: error }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // TODO: Add authentication and role-based authorization
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const assignedTo = searchParams.get('assignedTo'); // Engineer's User ID (MongoDB _id)
    const role = searchParams.get('role'); // e.g., 'admin', 'customer', 'engineer'

    let query = {};

    if (role === 'customer' && customerId) {
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
          return NextResponse.json({ message: 'Invalid customerId for filtering' }, { status: 400 });
      }
      query = { customerId: new mongoose.Types.ObjectId(customerId) };
    } else if (role === 'engineer' && assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
          return NextResponse.json({ message: 'Invalid assignedTo ID for filtering' }, { status: 400 });
      }
      query = { assignedTo: new mongoose.Types.ObjectId(assignedTo) };
    } else if (role === 'admin') {
      // Admin gets all complaints, no specific filter needed here based on ID
      query = {};
    } else if (customerId) { // Fallback if role not specified but customerId is
       if (!mongoose.Types.ObjectId.isValid(customerId)) {
          return NextResponse.json({ message: 'Invalid customerId for filtering' }, { status: 400 });
      }
      query = { customerId: new mongoose.Types.ObjectId(customerId) };
    }
     // Add more sophisticated filtering/auth as needed

    const complaintsFromDb = await ComplaintModel.find(query)
      .sort({ updatedAt: -1 }) // Sort by most recently updated
      .populate('customerId', 'name email') // Populate customer details
      .populate('assignedTo', 'name email engineerLevel') // Populate engineer details
      .populate('internalNotes.userId', 'name email'); // Populate user details in notes

    const complaints: ComplaintType[] = complaintsFromDb.map(mapComplaintToFrontend);
    
    return NextResponse.json(complaints, { status: 200 });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ message: 'Server error fetching complaints' }, { status: 500 });
  }
}
