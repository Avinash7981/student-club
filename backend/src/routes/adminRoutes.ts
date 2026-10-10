import express from 'express';
import { requireAdmin, authenticate } from '../middleware/auth';
import Student from '../models/Student';
import Organizer from '../models/Organizer';
import Event from '../models/Event';
import Registration from '../models/Registration';
import AuditLog from '../models/AuditLog';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalOrganizers = await Organizer.countDocuments();
    const totalEvents = await Event.countDocuments();
    const publishedEvents = await Event.countDocuments({ status: 'published' });
    const totalRegistrations = await Registration.countDocuments();

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalOrganizers,
        totalEvents,
        publishedEvents,
        totalRegistrations,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
  }
});

router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const students = await Student.find().select('-password');
    const organizers = await Organizer.find().select('-password');
    res.json({ success: true, students, organizers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

export default router;
