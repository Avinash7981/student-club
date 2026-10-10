import express from 'express';
import { authenticate } from '../middleware/auth';
import { register, login, me } from '../controllers/authController';
import { registerStudent, loginStudent } from '../controllers/studentAuthController';
import Student from '../models/Student';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);

router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);
router.get('/student/me', authenticate, async (req: any, res) => {
  try {
    // req.organizerId is actually just user ID from token
    const student = await Student.findById(req.organizerId).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, student: { id: student._id, name: student.name, email: student.email, rollNumber: student.rollNumber, role: student.role } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

export default router;
