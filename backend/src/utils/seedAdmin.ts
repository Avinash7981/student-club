import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Organizer from '../models/Organizer';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-club';

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'admin@studentclub.edu';
    
    const existing = await Organizer.findOne({ email: adminEmail });
    if (existing) {
      console.log('Admin already exists.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await Organizer.create({
      name: 'System Administrator',
      email: adminEmail,
      organization: 'Student Club Administration',
      password: hashedPassword,
      role: 'admin',
    });

    console.log('✅ Admin account seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed admin:', err);
    process.exit(1);
  }
}

seedAdmin();
