import { Request, Response } from 'express';
import Registration from '../models/Registration';
import Event from '../models/Event';
import { AuthRequest } from '../middleware/auth';
import Counter from '../models/Counter';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getNextTeamId(): Promise<string> {
  const counterId = 'teamId';
  
  let counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: false }
  );

  if (!counter) {
    const regs = await Registration.find({ teamId: /^TEAM-\d+$/ }, 'teamId');
    let maxSeq = 0;
    for (const r of regs) {
      const match = r.teamId.match(/^TEAM-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }

    try {
      await Counter.create({ _id: counterId, seq: maxSeq + 1 });
      counter = { seq: maxSeq + 1 } as any;
    } catch (err: any) {
      if (err.code === 11000) {
        counter = await Counter.findByIdAndUpdate(
          counterId,
          { $inc: { seq: 1 } },
          { new: true }
        );
      } else {
        throw err;
      }
    }
  }
  
  return 'TEAM-' + String(counter!.seq).padStart(3, '0');
}

function genRegistrationId(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(10000 + Math.random() * 90000);
  return `REG-${year}-${num}`;
}

function calcTeamAttendance(reg: { teamLeader: { attendanceStatus: string }; members: { attendanceStatus: string }[] }): { status: string; presentCount: number } {
  const all = [reg.teamLeader, ...reg.members];
  const present = all.filter((m) => m.attendanceStatus === 'present').length;
  let status = 'not_started';
  if (present === 0 && all.some((m) => m.attendanceStatus !== 'not_checked')) status = 'absent';
  else if (present === all.length) status = 'full';
  else if (present > 0) status = 'partial';
  return { status, presentCount: present };
}

// ─── Public: Register ─────────────────────────────────────────────────────────

export const registerTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId, teamName, teamLeader, members } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    if (event.status !== 'published' && event.status !== 'ongoing') {
      res.status(400).json({ success: false, message: 'Event registration is not open' });
      return;
    }
    if (new Date() > event.registrationDeadline) {
      res.status(400).json({ success: false, message: 'Registration deadline has passed' });
      return;
    }
    if (event.registrationCount >= event.maxTeams) {
      res.status(400).json({ success: false, message: 'Event is full' });
      return;
    }

    // Check duplicate roll numbers
    const allRolls = [teamLeader.rollNumber, ...(members || []).map((m: { rollNumber: string }) => m.rollNumber)];
    const existingRegs = await Registration.find({ event: eventId });
    for (const reg of existingRegs) {
      const existingRolls = [reg.teamLeader.rollNumber, ...reg.members.map((m) => m.rollNumber)];
      const dup = allRolls.find((r) => existingRolls.includes(r));
      if (dup) {
        res.status(409).json({ success: false, message: `Roll number ${dup} is already registered` });
        return;
      }
    }

    const teamId = await getNextTeamId();
    const registrationId = genRegistrationId();
    const totalCount = 1 + (members?.length || 0);

    let registration;
    try {
      registration = await Registration.create({
        event: eventId,
        teamName,
        teamId,
        registrationId,
        teamLeader: { ...teamLeader, attendanceStatus: 'not_checked' },
        members: (members || []).map((m: Record<string, unknown>) => ({ ...m, attendanceStatus: 'not_checked' })),
        totalCount,
        presentCount: 0,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        console.error('Duplicate key error during registration:', err.message);
        res.status(409).json({ success: false, message: 'A duplicate registration identifier was generated. Please try again.' });
        return;
      }
      throw err;
    }

    // Increment count
    event.registrationCount += 1;
    await event.save();

    res.status(201).json({
      success: true,
      registration: {
        teamId: registration.teamId,
        registrationId: registration.registrationId,
        teamName: registration.teamName,
        teamLeader: registration.teamLeader,
        members: registration.members,
        status: registration.status,
        registrationTime: registration.registrationTime,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed';
    res.status(500).json({ success: false, message: msg });
  }
};

export const getRegistrationByTeamId = async (req: Request, res: Response): Promise<void> => {
  try {
    const reg = await Registration.findOne({ teamId: req.params.teamId }).populate('event', 'title startDate venue');
    if (!reg) {
      res.status(404).json({ success: false, message: 'Registration not found' });
      return;
    }
    res.json({ success: true, registration: reg });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch registration' });
  }
};

export const getRegistrationsByRoll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rollNumber } = req.params;
    const regs = await Registration.find({
      $or: [
        { 'teamLeader.rollNumber': rollNumber },
        { 'members.rollNumber': rollNumber },
      ],
    }).populate('event', 'title startDate endDate venue status banner organizerName slug');
    res.json({ success: true, registrations: regs });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch registrations' });
  }
};

// ─── Organizer ────────────────────────────────────────────────────────────────

export const getEventRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, sort = 'registrationTime', order = 'asc' } = req.query;
    const event = await Event.findOne({ _id: req.params.eventId, organizer: req.organizerId });
    if (!event) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    let query: Record<string, unknown> = { event: req.params.eventId };
    if (status && status !== 'all') query.status = status;
    if (search) {
      const s = search as string;
      query = {
        ...query,
        $or: [
          { teamName: { $regex: s, $options: 'i' } },
          { 'teamLeader.fullName': { $regex: s, $options: 'i' } },
          { 'teamLeader.rollNumber': { $regex: s, $options: 'i' } },
          { 'members.fullName': { $regex: s, $options: 'i' } },
          { 'members.rollNumber': { $regex: s, $options: 'i' } },
        ],
      };
    }

    const sortDir = order === 'desc' ? -1 : 1;
    const registrations = await Registration.find(query).sort({ [sort as string]: sortDir });
    res.json({ success: true, registrations, total: registrations.length });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch registrations' });
  }
};

export const getAttendanceStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findOne({ _id: req.params.eventId, organizer: req.organizerId });
    if (!event) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const regs = await Registration.find({ event: req.params.eventId });
    let totalParticipants = 0, present = 0, absent = 0, notChecked = 0;
    regs.forEach((reg) => {
      [reg.teamLeader, ...reg.members].forEach((m) => {
        totalParticipants++;
        if (m.attendanceStatus === 'present') present++;
        else if (m.attendanceStatus === 'absent') absent++;
        else notChecked++;
      });
    });
    res.json({
      success: true,
      stats: {
        registeredTeams: regs.length,
        totalParticipants,
        present,
        absent,
        notChecked,
        attendanceRate: totalParticipants ? Math.round((present / totalParticipants) * 100) : 0,
        attendanceStatus: event.attendanceStatus,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance stats' });
  }
};

// ─── Mark Attendance ──────────────────────────────────────────────────────────

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { registrationId, memberIndex, status } = req.body;
    // memberIndex: -1 = leader, 0+ = members array index
    const reg = await Registration.findById(registrationId);
    if (!reg) {
      res.status(404).json({ success: false, message: 'Registration not found' });
      return;
    }

    const event = await Event.findOne({ _id: reg.event, organizer: req.organizerId });
    if (!event) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const checkInTime = status === 'present' ? new Date() : undefined;
    if (memberIndex === -1) {
      reg.teamLeader.attendanceStatus = status;
      reg.teamLeader.checkInTime = checkInTime;
    } else {
      if (!reg.members[memberIndex]) {
        res.status(400).json({ success: false, message: 'Member not found' });
        return;
      }
      reg.members[memberIndex].attendanceStatus = status;
      reg.members[memberIndex].checkInTime = checkInTime;
    }

    // Recalculate team attendance
    const { status: teamStatus, presentCount } = calcTeamAttendance(reg);
    reg.teamAttendanceStatus = teamStatus as 'not_started' | 'partial' | 'full' | 'absent';
    reg.presentCount = presentCount;
    await reg.save();

    res.json({ success: true, registration: reg });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to mark attendance' });
  }
};

// ─── QR Attendance ────────────────────────────────────────────────────────────

export const qrCheckIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId, rollNumber } = req.body;

    const event = await Event.findById(eventId);
    if (!event || event.attendanceStatus !== 'active') {
      res.status(400).json({ success: false, message: 'Attendance session is not active' });
      return;
    }

    const reg = await Registration.findOne({
      event: eventId,
      $or: [{ 'teamLeader.rollNumber': rollNumber }, { 'members.rollNumber': rollNumber }],
    });

    if (!reg) {
      res.status(404).json({ success: false, message: 'Student not registered for this event' });
      return;
    }

    let memberName = '';
    let alreadyCheckedIn = false;

    if (reg.teamLeader.rollNumber === rollNumber) {
      if (reg.teamLeader.attendanceStatus === 'present') alreadyCheckedIn = true;
      else {
        reg.teamLeader.attendanceStatus = 'present';
        reg.teamLeader.checkInTime = new Date();
        memberName = reg.teamLeader.fullName;
      }
    } else {
      const member = reg.members.find((m) => m.rollNumber === rollNumber);
      if (!member) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }
      if (member.attendanceStatus === 'present') alreadyCheckedIn = true;
      else {
        member.attendanceStatus = 'present';
        member.checkInTime = new Date();
        memberName = member.fullName;
      }
    }

    if (alreadyCheckedIn) {
      res.status(409).json({ success: false, message: 'Already checked in' });
      return;
    }

    const { status: teamStatus, presentCount } = calcTeamAttendance(reg);
    reg.teamAttendanceStatus = teamStatus as 'not_started' | 'partial' | 'full' | 'absent';
    reg.presentCount = presentCount;
    await reg.save();

    res.json({
      success: true,
      message: 'Attendance recorded',
      studentName: memberName,
      teamName: reg.teamName,
      checkInTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
  } catch {
    res.status(500).json({ success: false, message: 'QR check-in failed' });
  }
};
