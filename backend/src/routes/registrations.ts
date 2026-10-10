import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  registerTeam,
  getRegistrationByTeamId,
  getRegistrationsByRoll,
  getEventRegistrations,
  getAttendanceStats,
  markAttendance,
  qrCheckIn,
} from '../controllers/registrationController';

const router = express.Router();

// Public
router.post('/', registerTeam);
router.get('/team/:teamId', getRegistrationByTeamId);
router.get('/student/:rollNumber', getRegistrationsByRoll);
router.post('/qr-checkin', qrCheckIn);

// Organizer
router.get('/event/:eventId', authenticate, getEventRegistrations);
router.get('/event/:eventId/attendance-stats', authenticate, getAttendanceStats);
router.patch('/attendance', authenticate, markAttendance);

export default router;
