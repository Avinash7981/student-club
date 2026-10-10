import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  name: string;
  email: string;
  password: string;
  rollNumber: string;
  department: string;
  year: string;
  role: 'student';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    rollNumber: { type: String, required: true, unique: true, uppercase: true },
    department: { type: String },
    year: { type: String },
    role: { type: String, default: 'student' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IStudent>('Student', StudentSchema);
