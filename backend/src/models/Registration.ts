import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamMember {
  fullName: string;
  rollNumber: string;
  email: string;
  phone?: string;
  department: string;
  year: string;
  attendanceStatus: 'not_checked' | 'present' | 'absent';
  checkInTime?: Date;
}

export interface IRegistration extends Document {
  event: mongoose.Types.ObjectId;
  teamName: string;
  teamId: string;
  registrationId: string;
  teamLeader: ITeamMember;
  members: ITeamMember[];
  status: 'registered' | 'confirmed' | 'cancelled';
  registrationTime: Date;
  teamAttendanceStatus: 'not_started' | 'partial' | 'full' | 'absent';
  presentCount: number;
  totalCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>({
  fullName: { type: String, required: true, trim: true },
  rollNumber: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String },
  department: { type: String, required: true },
  year: { type: String, required: true },
  attendanceStatus: { type: String, enum: ['not_checked', 'present', 'absent'], default: 'not_checked' },
  checkInTime: { type: Date },
}, { _id: true });

const RegistrationSchema = new Schema<IRegistration>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    teamName: { type: String, required: true, trim: true },
    teamId: { type: String, required: true, unique: true },
    registrationId: { type: String, required: true, unique: true },
    teamLeader: { type: TeamMemberSchema, required: true },
    members: [TeamMemberSchema],
    status: { type: String, enum: ['registered', 'confirmed', 'cancelled'], default: 'registered' },
    registrationTime: { type: Date, default: Date.now },
    teamAttendanceStatus: {
      type: String,
      enum: ['not_started', 'partial', 'full', 'absent'],
      default: 'not_started',
    },
    presentCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Index for fast lookup
RegistrationSchema.index({ event: 1, teamId: 1 });
RegistrationSchema.index({ 'teamLeader.rollNumber': 1 });
RegistrationSchema.index({ 'members.rollNumber': 1 });

export default mongoose.model<IRegistration>('Registration', RegistrationSchema);
