
// /src/app/api/complaints/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ComplaintModel from '@/models/Complaint';
import type { Complaint as ComplaintType, ComplaintAttachment as ComplaintAttachmentType } from '@/types';
import mongoose from 'mongoose';

// Helper to convert DB doc to frontend type (can be shared)
const mapComplaintToFrontend = (doc: any): ComplaintType => {
  const complaint = doc.toObject({ virtuals: true });
  return {
    ...complaint,
    id: complaint._id.toString(),
    customerId: complaint.customerId?.toString(),
    assignedTo: complaint.assignedTo?._id?.toString() || complaint.assignedTo?.toString(),
    assignedToName: complaint.assignedTo?.name || complaint.assignedToName,
    internalNotes: complaint.internalNotes?.map((note: any) => ({
      ...note,
      id: note._id?.toString(),
      userId: note.userId?._id?.toString() || note.userId?.toString(),
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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: Add auth
  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid complaint ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const complaintDoc = await ComplaintModel.findById(id)
      .populate('customerId', 'name email')
      .populate('assignedTo', 'name email engineerLevel')
      .populate('internalNotes.userId', 'name email');

    if (!complaintDoc) {
      return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
    }
    return NextResponse.json(mapComplaintToFrontend(complaintDoc), { status: 200 });
  } catch (error) {
    console.error(`Error fetching complaint ${id}:`, error);
    return NextResponse.json({ message: 'Server error fetching complaint' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: Add auth and role-based logic for who can update what
  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid complaint ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const updateData = await req.json();

    // Ensure updatedAt is always fresh
    updateData.updatedAt = new Date();

    // Handle attachments carefully if they are part of updateData
    if (updateData.attachments) {
        // IMPORTANT: For production, if new files are uploaded, handle their storage (e.g., to S3)
        // and update URLs. For now, assuming data URIs are passed.
        updateData.attachments = updateData.attachments.map((att: Omit<ComplaintAttachmentType, 'id'> & {id?:string}) => ({
            fileName: att.fileName,
            fileType: att.fileType,
            url: att.url, // data URI
        }));
    }
    
    // Convert string IDs to ObjectIds for references if they are being updated
    if (updateData.assignedTo && typeof updateData.assignedTo === 'string' && mongoose.Types.ObjectId.isValid(updateData.assignedTo)) {
        updateData.assignedTo = new mongoose.Types.ObjectId(updateData.assignedTo);
    } else if (updateData.assignedTo === '_UNASSIGNED_' || updateData.assignedTo === null || updateData.assignedTo === '') {
        updateData.assignedTo = undefined;
        updateData.assignedToName = undefined;
        updateData.currentHandlerLevel = undefined;
    }


    const updatedComplaintDoc = await ComplaintModel.findByIdAndUpdate(id, updateData, { new: true })
      .populate('customerId', 'name email')
      .populate('assignedTo', 'name email engineerLevel')
      .populate('internalNotes.userId', 'name email');

    if (!updatedComplaintDoc) {
      return NextResponse.json({ message: 'Complaint not found to update' }, { status: 404 });
    }
    return NextResponse.json(mapComplaintToFrontend(updatedComplaintDoc), { status: 200 });
  } catch (error) {
    console.error(`Error updating complaint ${id}:`, error);
    let errorMessage = 'Server error updating complaint.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
     if (error.code === 11000) { // Mongoose duplicate key error
        errorMessage = "Update failed due to a duplicate key constraint. Please check unique fields."
    }
    return NextResponse.json({ message: errorMessage, details: error }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: Add auth (likely admin only)
  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Invalid complaint ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const deletedComplaint = await ComplaintModel.findByIdAndDelete(id);

    if (!deletedComplaint) {
      return NextResponse.json({ message: 'Complaint not found to delete' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Complaint deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting complaint ${id}:`, error);
    return NextResponse.json({ message: 'Server error deleting complaint' }, { status: 500 });
  }
}
