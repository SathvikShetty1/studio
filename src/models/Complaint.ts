
// src/models/Complaint.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
// Import enums as values
import { 
  ComplaintCategory, 
  ComplaintStatus, 
  ComplaintPriority, 
  EngineerLevel 
} from '@/types'; 
// Import interfaces/types as types
import type { 
  Complaint as ComplaintType, 
  ComplaintAttachment as ComplaintAttachmentType, // Renamed for clarity within this file
  ComplaintNote as ComplaintNoteType // Renamed for clarity
} from '@/types';

export interface ComplaintDocument extends Omit<ComplaintType, 'id' | 'customerId' | 'assignedTo' | 'internalNotes'>, Document {
  _id: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId; 
  assignedTo?: mongoose.Types.ObjectId; 
  internalNotes?: Array<Omit<ComplaintNoteType, 'id' | 'userId'> & {
    _id?: mongoose.Types.ObjectId; 
    userId: mongoose.Types.ObjectId; 
  }>;
}

const ComplaintAttachmentSchemaStructure = new Schema<ComplaintAttachmentType>({
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  url: { type: String, required: true }, 
}, { _id: true }); 

const ComplaintNoteSchemaStructure = new Schema<Omit<ComplaintNoteType, 'id' | 'userId'> & { userId: mongoose.Types.ObjectId }>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  timestamp: { type: Date, required: true },
  text: { type: String, required: true },
  isInternal: { type: Boolean, required: true },
}, { _id: true });


const ComplaintSchema = new Schema<ComplaintDocument>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    category: { type: String, enum: Object.values(ComplaintCategory), required: true },
    description: { type: String, required: true },
    attachments: [ComplaintAttachmentSchemaStructure], // Use the renamed structure
    submittedAt: { type: Date, default: Date.now, required: true },
    status: { type: String, enum: Object.values(ComplaintStatus), required: true },
    priority: { type: String, enum: Object.values(ComplaintPriority), sparse: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
    assignedToName: { type: String, sparse: true },
    currentHandlerLevel: { type: String, enum: Object.values(EngineerLevel), sparse: true },
    resolutionTimeline: { type: Date, sparse: true },
    resolvedAt: { type: Date, sparse: true },
    resolutionDetails: { type: String, sparse: true },
    internalNotes: [ComplaintNoteSchemaStructure], // Use the renamed structure
    customerFeedback: {
      rating: { type: Number },
      comment: { type: String },
    },
  },
  { timestamps: true } 
);

ComplaintSchema.pre('save', function(next) {
  if (this.isModified()) { 
    this.updatedAt = new Date();
  }
  next();
});

const ComplaintModel: Model<ComplaintDocument> = models.Complaint || mongoose.model<ComplaintDocument>('Complaint', ComplaintSchema);

export default ComplaintModel;
