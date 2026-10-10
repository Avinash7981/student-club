import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import slugify from '../utils/slugify';
import Event from '../models/Event';
import Registration from '../models/Registration';
import { AuthRequest } from '../middleware/auth';

// Helper
function generateSlug(title: string): string {
  return slugify(title) + '-' + Date.now().toString(36);
}

// ─── Public ───────────────────────────────────────────────────────────────────

export const getPublishedEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const query: Record<string, unknown> = { status: { $in: ['published', 'ongoing'] } };
    if (search) query.title = { $regex: search, $options: 'i' };
    if (category && category !== 'all') query.category = category;
    const events = await Event.find(query)
      .sort({ startDate: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    const total = await Event.countDocuments(query);
    res.json({ success: true, events, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
};

export const getEventBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findOne({ slug: req.params.slug }).lean();
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({ success: true, event });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch event' });
  }
};

// ─── Organizer ────────────────────────────────────────────────────────────────

export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizerData = req.body;
    const slug = generateSlug(organizerData.title);
    const event = await Event.create({
      ...organizerData,
      slug,
      organizer: req.organizerId,
      registrationCount: 0,
    });
    res.status(201).json({ success: true, event });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create event';
    res.status(500).json({ success: false, message: msg });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, organizer: req.organizerId },
      req.body,
      { new: true }
    );
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found or unauthorized' });
      return;
    }
    res.json({ success: true, event });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
};

export const getOrganizerEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const events = await Event.find({ organizer: req.organizerId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, events });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
};

export const getOrganizerEventById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query: any = { _id: req.params.id };
    if (req.organizerRole !== 'admin') {
      query.organizer = req.organizerId;
    }
    const event = await Event.findOne(query).lean();
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({ success: true, event });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch event' });
  }
};

export const publishEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, organizer: req.organizerId },
      { status: 'published' },
      { new: true }
    );
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({ success: true, event });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to publish event' });
  }
};

export const unpublishEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, organizer: req.organizerId },
      { status: 'draft' },
      { new: true }
    );
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({ success: true, event });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to unpublish event' });
  }
};

export const startAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizer: req.organizerId });
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    if (event.attendanceStatus === 'active') {
      res.json({ success: true, event, message: 'Attendance already active' });
      return;
    }
    // Generate QR payload
    const token = uuidv4();
    const qrPayload = JSON.stringify({ eventId: event._id.toString(), token });
    const qrCode = await QRCode.toDataURL(qrPayload);
    event.attendanceStatus = 'active';
    event.attendanceQRCode = qrCode;
    event.attendanceToken = token;
    event.status = 'ongoing';
    await event.save();
    res.json({ success: true, event });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to start attendance' });
  }
};

export const endAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, organizer: req.organizerId },
      { attendanceStatus: 'ended', status: 'completed' },
      { new: true }
    );
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    
    // Mark unchecked as absent
    const registrations = await Registration.find({ event: event._id });
    for (const reg of registrations) {
      let modified = false;
      const allMembers = [reg.teamLeader, ...reg.members];
      allMembers.forEach(m => {
        if (!m.attendanceStatus) {
          m.attendanceStatus = 'absent';
          modified = true;
        }
      });
      if (modified) {
        reg.markModified('teamLeader');
        reg.markModified('members');
        await reg.save();
      }
    }

    res.json({ success: true, event });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to end attendance' });
  }
};

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    if (event.attendanceStatus !== 'active' || event.attendanceToken !== token) {
      res.status(400).json({ success: false, message: 'Invalid or inactive attendance session' });
      return;
    }

    const studentId = req.organizerId; // from auth middleware
    const reg = await Registration.findOne({
      event: event._id,
      $or: [
        { 'teamLeader.studentId': studentId },
        { 'members.studentId': studentId }
      ]
    });

    if (!reg) {
      res.status(403).json({ success: false, message: 'You are not registered for this event' });
      return;
    }

    let marked = false;
    let alreadyMarked = false;

    if (reg.teamLeader.studentId === studentId) {
      if (reg.teamLeader.attendanceStatus === 'present') alreadyMarked = true;
      else {
        reg.teamLeader.attendanceStatus = 'present';
        reg.teamLeader.checkInTime = new Date();
        reg.markModified('teamLeader');
        marked = true;
      }
    } else {
      const member = reg.members.find(m => m.studentId === studentId);
      if (member) {
        if (member.attendanceStatus === 'present') alreadyMarked = true;
        else {
          member.attendanceStatus = 'present';
          member.checkInTime = new Date();
          reg.markModified('members');
          marked = true;
        }
      }
    }

    if (alreadyMarked) {
      res.json({ success: true, message: 'Attendance already recorded' });
      return;
    }

    if (marked) {
      await reg.save();
      res.json({ success: true, message: 'Attendance marked successfully' });
      return;
    }

    res.status(400).json({ success: false, message: 'Failed to mark attendance' });
  } catch(e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error marking attendance' });
  }
};

export const getOrganizerStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const events = await Event.find({ organizer: req.organizerId });
    const eventIds = events.map((e) => e._id);
    const registrations = await Registration.find({ event: { $in: eventIds } });

    let totalParticipants = 0;
    let present = 0;
    let absent = 0;

    registrations.forEach((reg) => {
      const all = [reg.teamLeader, ...reg.members];
      totalParticipants += all.length;
      all.forEach((m) => {
        if (m.attendanceStatus === 'present') present++;
        if (m.attendanceStatus === 'absent') absent++;
      });
    });

    res.json({
      success: true,
      stats: {
        totalEvents: events.length,
        activeEvents: events.filter((e) => e.status === 'published' || e.status === 'ongoing').length,
        registeredTeams: registrations.length,
        totalParticipants,
        present,
        absent,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, organizer: req.organizerId });
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({ success: true, message: 'Event deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
};
