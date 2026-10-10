import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPublishedEvents,
  getEventBySlug,
  createEvent,
  updateEvent,
  getOrganizerEvents,
  getOrganizerEventById,
  publishEvent,
  unpublishEvent,
  startAttendance,
  endAttendance,
  markAttendance,
  getOrganizerStats,
  deleteEvent,
} from '../controllers/eventController';

const router = express.Router();

// Public
router.get('/', getPublishedEvents);
router.get('/slug/:slug', getEventBySlug);

// Organizer
router.get('/organizer/stats', authenticate, getOrganizerStats);
router.get('/organizer/my-events', authenticate, getOrganizerEvents);
router.get('/organizer/:id', authenticate, getOrganizerEventById);
router.post('/', authenticate, createEvent);
router.put('/:id', authenticate, updateEvent);
router.delete('/:id', authenticate, deleteEvent);
router.patch('/:id/publish', authenticate, publishEvent);
router.patch('/:id/unpublish', authenticate, unpublishEvent);
router.patch('/:id/start-attendance', authenticate, startAttendance);
router.patch('/:id/end-attendance', authenticate, endAttendance);
router.post('/:id/attendance/mark', authenticate, markAttendance);

export default router;
