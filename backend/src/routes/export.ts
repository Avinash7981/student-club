import express from 'express';
import { authenticate } from '../middleware/auth';
import { exportRegistrations, exportAttendance } from '../controllers/exportController';

const router = express.Router();

router.get('/event/:eventId/registrations', authenticate, exportRegistrations);
router.get('/event/:eventId/attendance', authenticate, exportAttendance);

export default router;
