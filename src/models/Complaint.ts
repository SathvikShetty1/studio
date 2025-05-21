
// src/models/Complaint.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { Complaint as ComplaintType, ComplaintCategory, ComplaintStatus, ComplaintPriority, ComplaintAttachment, ComplaintNote, EngineerLevel } from '@/types';

export interface ComplaintDocument extends Omit<ComplaintType, 'id' | 'customerId' | 'assignedTo' | 'internalNotes'>, Document {
  _id: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId; // Reference to User model
  assignedTo?: mongoose.Types.ObjectId; // Reference to User model (engineer)
  internalNotes?: Array<Omit<ComplaintNote, 'id' | 'userId'> & {
    _id?: mongoose.Types.ObjectId; // Mongoose adds _id to subdocuments by default
    userId: mongoose.Types.ObjectId; // Reference to User model
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

const ComplaintAttachmentSchema = new Schema<ComplaintAttachment>({
  // id is not needed as _id will be generated if made a subdocument, or manage manually if not
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  url: { type: String, required: true }, // Will store data URI or future file storage URL
}, { _id: true }); // Mongoose adds _id to subdocuments by default, can be set to false if not desired

const ComplaintNoteSchema = new Schema<Omit<ComplaintNote, 'id' | 'userId'> & { userId: mongoose.Types.ObjectId }>({
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
    updatedAt: { type: Date, default: Date.now, required: true },
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
  { timestamps: true } // Adds createdAt and updatedAt
);

ComplaintSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

ComplaintSchema.pre('updateOne', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});
ComplaintSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});


const ComplaintModel: Model<ComplaintDocument> = models.Complaint || mongoose.model<ComplaintDocument>('Complaint', ComplaintSchema);

export default ComplaintModel;
