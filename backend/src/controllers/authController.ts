import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Organizer from '../models/Organizer';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, organization, phone } = req.body;
    const existing = await Organizer.findOne({ email });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    const organizer = await Organizer.create({ name, email, password: hashed, organization, phone });
    const token = jwt.sign(
      { id: organizer._id, role: organizer.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    res.status(201).json({
      success: true,
      token,
      organizer: { id: organizer._id, name: organizer.name, email: organizer.email, organization: organizer.organization, role: organizer.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const organizer = await Organizer.findOne({ email });
    if (!organizer) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const match = await bcrypt.compare(password, organizer.password);
    if (!match) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign(
      { id: organizer._id, role: organizer.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    res.json({
      success: true,
      token,
      organizer: { id: organizer._id, name: organizer.name, email: organizer.email, organization: organizer.organization, role: organizer.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const me = async (req: Request & { organizerId?: string }, res: Response): Promise<void> => {
  try {
    const organizer = await Organizer.findById(req.organizerId).select('-password');
    if (!organizer) {
      res.status(404).json({ success: false, message: 'Not found' });
      return;
    }
    res.json({ success: true, organizer });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
};
