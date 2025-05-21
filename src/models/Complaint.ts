
// src/models/Complaint.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
// Import enums as values, and other types as types
import { 
  ComplaintCategory, 
  ComplaintStatus, 
  ComplaintPriority, 
  EngineerLevel 
} from '@/types'; // Ensure this is a value import for enums
import type { 
  Complaint as ComplaintType, 
  ComplaintAttachment as ComplaintAttachmentType,
  ComplaintNote as ComplaintNoteType
} from '@/types';

export interface ComplaintDocument extends Omit<ComplaintType, 'id' | 'customerId' | 'assignedTo' | 'internalNotes'>, Document {
  _id: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId; // Reference to User model
  assignedTo?: mongoose.Types.ObjectId; // Reference to User model (engineer)
  internalNotes?: Array<Omit<ComplaintNoteType, 'id' | 'userId'> & {
    _id?: mongoose.Types.ObjectId; // Mongoose adds _id to subdocuments by default
    userId: mongoose.Types.ObjectId; // Reference to User model
  }>;
  // createdAt and updatedAt are handled by timestamps: true
}

const ComplaintAttachmentSchema = new Schema<ComplaintAttachmentType>({
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  url: { type: String, required: true }, 
}, { _id: true }); 

const ComplaintNoteSchema = new Schema<Omit<ComplaintNoteType, 'id' | 'userId'> & { userId: mongoose.Types.ObjectId }>({
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
    attachments: [ComplaintAttachmentSchema],
    submittedAt: { type: Date, default: Date.now, required: true },
    // updatedAt will be handled by timestamps: true and pre-save/pre-update hooks
    status: { type: String, enum: Object.values(ComplaintStatus), required: true },
    priority: { type: String, enum: Object.values(ComplaintPriority), sparse: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
    assignedToName: { type: String, sparse: true },
    currentHandlerLevel: { type: String, enum: Object.values(EngineerLevel), sparse: true },
    resolutionTimeline: { type: Date, sparse: true },
    resolvedAt: { type: Date, sparse: true },
    resolutionDetails: { type: String, sparse: true },
    internalNotes: [ComplaintNoteSchema],
    customerFeedback: {
      rating: { type: Number },
      comment: { type: String },
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

// Middleware to update `updatedAt` on save/update operations if not automatically handled sufficiently by {timestamps: true} for all cases
ComplaintSchema.pre('save', function(next) {
  if (this.isModified()) { // only update if document changed to avoid unnecessary updates
    this.updatedAt = new Date();
  }
  next();
});

// For findOneAndUpdate, updateOne, etc. this needs to be handled differently if you want to trigger middleware.
// However, {timestamps: true} often suffices. If specific updates are not triggering `updatedAt`,
// you might need to explicitly set it in those update operations in your API routes.
// The pre 'save' hook above primarily affects new documents and full document updates via .save().


const ComplaintModel: Model<ComplaintDocument> = models.Complaint || mongoose.model<ComplaintDocument>('Complaint', ComplaintSchema);

export default ComplaintModel;
