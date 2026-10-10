import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  organizer: mongoose.Types.ObjectId;
  organizerName: string;
  banner?: string;
  venue: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  registrationDeadline: Date;
  maxTeams: number;
  minTeamSize: number;
  maxTeamSize: number;
  registrationCount: number;
  rules: string[];
  eligibility: string;
  tags: string[];
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  attendanceStatus: 'not_started' | 'active' | 'ended';
  attendanceQRCode?: string;
  attendanceToken?: string;
  category: string;
  prizes?: string;
  registrationFee: number;
  roadmap?: {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    venue: string;
    type: string;
    order: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
    organizer: { type: Schema.Types.ObjectId, ref: 'Organizer', required: true },
    organizerName: { type: String, required: true },
    banner: { type: String },
    venue: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    registrationDeadline: { type: Date, required: true },
    maxTeams: { type: Number, required: true, default: 100 },
    minTeamSize: { type: Number, default: 1 },
    maxTeamSize: { type: Number, default: 4 },
    registrationCount: { type: Number, default: 0 },
    rules: [{ type: String }],
    eligibility: { type: String, default: 'Open to all students' },
    tags: [{ type: String }],
    status: { type: String, enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'], default: 'draft' },
    attendanceStatus: { type: String, enum: ['not_started', 'active', 'ended'], default: 'not_started' },
    attendanceQRCode: { type: String },
    attendanceToken: { type: String },
    category: { type: String, default: 'Technical' },
    prizes: { type: String },
    registrationFee: { type: Number, default: 0 },
    roadmap: [
      {
        id: { type: String },
        title: { type: String },
        description: { type: String },
        startTime: { type: String },
        endTime: { type: String },
        venue: { type: String },
        type: { type: String },
        order: { type: Number },
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IEvent>('Event', EventSchema);
