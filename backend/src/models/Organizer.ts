import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganizer extends Document {
  name: string;
  email: string;
  password: string;
  organization: string;
  role: 'organizer' | 'admin';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizerSchema = new Schema<IOrganizer>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    organization: { type: String, required: true, trim: true },
    role: { type: String, enum: ['organizer', 'admin'], default: 'organizer' },
    phone: { type: String },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IOrganizer>('Organizer', OrganizerSchema);
