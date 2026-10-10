import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Student from '../models/Student';

export const registerStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, rollNumber, department, year } = req.body;
    const existing = await Student.findOne({ email });
    const existingRoll = await Student.findOne({ rollNumber });
    
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }
    if (existingRoll) {
      res.status(409).json({ success: false, message: 'Roll number already registered' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const student = await Student.create({ name, email, password: hashed, rollNumber, department, year, role: 'student' });
    
    const token = jwt.sign(
      { id: student._id, role: student.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      student: { id: student._id, name: student.name, email: student.email, rollNumber: student.rollNumber, role: student.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

export const loginStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const student = await Student.findOne({ email });
    if (!student) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const match = await bcrypt.compare(password, student.password);
    if (!match) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign(
      { id: student._id, role: student.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    res.json({
      success: true,
      token,
      student: { id: student._id, name: student.name, email: student.email, rollNumber: student.rollNumber, role: student.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};
