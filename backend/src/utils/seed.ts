import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Organizer from '../models/Organizer';
import Event from '../models/Event';
import Registration from '../models/Registration';
import slugify from './slugify';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-club';

async function seed(): Promise<void> {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clean
  await Organizer.deleteMany({});
  await Event.deleteMany({});
  await Registration.deleteMany({});

  // Create organizers
  const password = await bcrypt.hash('password123', 12);

  const techOrg = await Organizer.create({
    name: 'Technical Club Admin',
    email: 'tech@college.edu',
    password,
    organization: 'Technical Club',
    role: 'organizer',
  });

  const culturalOrg = await Organizer.create({
    name: 'Cultural Club Admin',
    email: 'cultural@college.edu',
    password,
    organization: 'Cultural Club',
    role: 'organizer',
  });

  const admin = await Organizer.create({
    name: 'System Admin',
    email: 'admin@college.edu',
    password,
    organization: 'Student Club Platform',
    role: 'admin',
  });

  console.log('Organizers created');

  // Create events
  const now = new Date();
  const addDays = (d: number) => new Date(now.getTime() + d * 86400000);

  const hackathon = await Event.create({
    title: 'AI Hackathon 2026',
    slug: slugify('AI Hackathon 2026') + '-2026',
    shortDescription: 'Build AI-powered solutions for real-world problems in 8 hours.',
    description: `Join us for the most anticipated tech event of the year! Teams will compete to build innovative AI/ML solutions addressing real-world challenges. Mentors from industry will guide participants throughout the event.\n\nThis hackathon is open to all engineering students. Bring your laptops, ideas, and energy!`,
    organizer: techOrg._id,
    organizerName: 'Technical Club',
    venue: 'MRTC Auditorium, Block A',
    startDate: addDays(7),
    endDate: addDays(7),
    startTime: '9:00 AM',
    endTime: '5:00 PM',
    registrationDeadline: addDays(5),
    maxTeams: 100,
    minTeamSize: 2,
    maxTeamSize: 4,
    registrationCount: 0,
    rules: [
      'Teams must consist of 2–4 members.',
      'All team members must be enrolled students.',
      'Participants must bring their own laptops.',
      'Internet access will be provided.',
      'Plagiarism will result in immediate disqualification.',
      'Judges\' decisions are final.',
    ],
    eligibility: 'Open to all B.Tech / M.Tech students',
    tags: ['hackathon', 'AI', 'ML', 'tech'],
    status: 'published',
    category: 'Technical',
    prizes: '1st: ₹15,000 | 2nd: ₹10,000 | 3rd: ₹5,000',
    registrationFee: 0,
  });

  const designEvent = await Event.create({
    title: 'UI/UX Design Sprint',
    slug: slugify('UI/UX Design Sprint') + '-2026',
    shortDescription: 'Design beautiful, user-friendly interfaces for modern apps.',
    description: `A 6-hour design challenge where teams tackle real product design problems. Participants will use Figma to design complete UI flows and present to a panel of judges.\n\nBoth individual and team participation is welcome.`,
    organizer: techOrg._id,
    organizerName: 'Technical Club',
    venue: 'Computer Lab 3, Block C',
    startDate: addDays(14),
    endDate: addDays(14),
    startTime: '10:00 AM',
    endTime: '4:00 PM',
    registrationDeadline: addDays(12),
    maxTeams: 50,
    minTeamSize: 1,
    maxTeamSize: 2,
    registrationCount: 0,
    rules: [
      'Teams of 1–2 members only.',
      'Must use Figma for design submissions.',
      'No pre-made templates allowed.',
    ],
    eligibility: 'Open to all students',
    tags: ['design', 'UI/UX', 'figma'],
    status: 'published',
    category: 'Design',
    prizes: '1st: ₹8,000 | 2nd: ₹5,000',
    registrationFee: 0,
  });

  const culturalFest = await Event.create({
    title: 'Rhythm & Soul — Cultural Fest 2026',
    slug: slugify('Rhythm Soul Cultural Fest') + '-2026',
    shortDescription: 'The biggest cultural extravaganza of the year. Dance, music, art & more.',
    description: `Rhythm & Soul is the annual cultural festival bringing together talent from across the campus. Events include group dance, solo singing, stand-up comedy, short film competition, and street art.\n\nRegister your team for your chosen event category.`,
    organizer: culturalOrg._id,
    organizerName: 'Cultural Club',
    venue: 'Open Air Amphitheatre',
    startDate: addDays(21),
    endDate: addDays(23),
    startTime: '5:00 PM',
    endTime: '10:00 PM',
    registrationDeadline: addDays(18),
    maxTeams: 80,
    minTeamSize: 2,
    maxTeamSize: 10,
    registrationCount: 0,
    rules: [
      'Performances must be original or properly licensed.',
      'Time limit: 8 minutes per team.',
      'Props must be arranged by participants.',
    ],
    eligibility: 'Open to all undergraduate students',
    tags: ['cultural', 'dance', 'music', 'art'],
    status: 'published',
    category: 'Cultural',
    prizes: 'Trophies + Certificates for all categories',
    registrationFee: 0,
  });

  const codeQuiz = await Event.create({
    title: 'Code & Conquer — Programming Quiz',
    slug: slugify('Code Conquer Programming Quiz') + '-2026',
    shortDescription: 'Test your coding knowledge in this competitive quiz format.',
    description: `A multi-round programming quiz covering data structures, algorithms, system design, and competitive programming. Teams progress through elimination rounds.\n\nPast winners have gone on to crack top tech interviews!`,
    organizer: techOrg._id,
    organizerName: 'Technical Club',
    venue: 'Seminar Hall 2, Block B',
    startDate: addDays(3),
    endDate: addDays(3),
    startTime: '2:00 PM',
    endTime: '6:00 PM',
    registrationDeadline: addDays(2),
    maxTeams: 40,
    minTeamSize: 2,
    maxTeamSize: 3,
    registrationCount: 0,
    rules: [
      'Teams of 2–3 members.',
      'No external resources during quiz.',
      'Cheating leads to disqualification.',
    ],
    eligibility: 'CSE, IT, AIDS, ECE students only',
    tags: ['quiz', 'programming', 'competitive'],
    status: 'published',
    category: 'Technical',
    prizes: '1st: ₹5,000 | 2nd: ₹3,000',
    registrationFee: 0,
  });

  console.log('Events created');

  // Seed some registrations for AI Hackathon
  const teams = [
    {
      teamName: "Storm Chasers",
      teamLeader: { fullName: 'Avinash Kumar', rollNumber: '25MVCSDR0186', email: 'avinash@college.edu', phone: '9876543210', department: 'CSE', year: '3rd Year' },
      members: [
        { fullName: 'Rehan Siddiqi', rollNumber: '25MVCSDR0234', email: 'rehan@college.edu', department: 'CSE', year: '3rd Year' },
        { fullName: 'Sneha Siri', rollNumber: '25MVCSDR0274', email: 'sneha@college.edu', department: 'IT', year: '3rd Year' },
        { fullName: 'Kathroju Gamani', rollNumber: '25MVCSDR0305', email: 'gamani@college.edu', department: 'CSE', year: '2nd Year' },
      ],
    },
    {
      teamName: "Nova Minds",
      teamLeader: { fullName: 'Priya Sharma', rollNumber: '25MVCSDR0112', email: 'priya@college.edu', phone: '9876541234', department: 'AIDS', year: '3rd Year' },
      members: [
        { fullName: 'Ravi Teja', rollNumber: '25MVCSDR0145', email: 'ravi@college.edu', department: 'AIDS', year: '3rd Year' },
        { fullName: 'Ananya Reddy', rollNumber: '25MVCSDR0167', email: 'ananya@college.edu', department: 'CSE', year: '2nd Year' },
        { fullName: 'Kiran Babu', rollNumber: '25MVCSDR0189', email: 'kiran@college.edu', department: 'IT', year: '3rd Year' },
      ],
    },
    {
      teamName: "Code Warriors",
      teamLeader: { fullName: 'Sai Kiran', rollNumber: '25MVCSDR0221', email: 'saikiran@college.edu', phone: '9876549876', department: 'CSE', year: '4th Year' },
      members: [
        { fullName: 'Meghana Rao', rollNumber: '25MVCSDR0256', email: 'meghana@college.edu', department: 'CSE', year: '4th Year' },
        { fullName: 'Vishnu Vardhan', rollNumber: '25MVCSDR0278', email: 'vishnu@college.edu', department: 'ECE', year: '3rd Year' },
      ],
    },
    {
      teamName: "Quantum Leap",
      teamLeader: { fullName: 'Divya Nair', rollNumber: '25MVCSDR0301', email: 'divya@college.edu', phone: '9876547654', department: 'IT', year: '2nd Year' },
      members: [
        { fullName: 'Arjun Patel', rollNumber: '25MVCSDR0323', email: 'arjun@college.edu', department: 'IT', year: '2nd Year' },
        { fullName: 'Rohit Verma', rollNumber: '25MVCSDR0345', email: 'rohit@college.edu', department: 'CSE', year: '2nd Year' },
        { fullName: 'Swati Gupta', rollNumber: '25MVCSDR0367', email: 'swati@college.edu', department: 'AIDS', year: '3rd Year' },
      ],
    },
    {
      teamName: "Neural Ninjas",
      teamLeader: { fullName: 'Akash Singh', rollNumber: '25MVCSDR0389', email: 'akash@college.edu', phone: '9876543456', department: 'CSE', year: '3rd Year' },
      members: [
        { fullName: 'Tanvi Mehta', rollNumber: '25MVCSDR0401', email: 'tanvi@college.edu', department: 'IT', year: '3rd Year' },
      ],
    },
  ];

  let teamCounter = 0;
  for (const t of teams) {
    const year = new Date().getFullYear();
    const num = Math.floor(10000 + Math.random() * 90000);
    await Registration.create({
      event: hackathon._id,
      teamName: t.teamName,
      teamId: 'TEAM-' + String(teamCounter + 1).padStart(3, '0'),
      registrationId: `REG-${year}-${num}`,
      teamLeader: { ...t.teamLeader, attendanceStatus: 'not_checked' },
      members: t.members.map((m) => ({ ...m, attendanceStatus: 'not_checked' })),
      totalCount: 1 + t.members.length,
      presentCount: 0,
    });
    teamCounter++;
  }

  hackathon.registrationCount = teams.length;
  await hackathon.save();

  console.log(`Seeded ${teams.length} registrations for AI Hackathon 2026`);
  console.log('\n=== SEED COMPLETE ===');
  console.log('Organizer logins:');
  console.log('  tech@college.edu / password123');
  console.log('  cultural@college.edu / password123');
  console.log('  admin@college.edu / password123 (admin)');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
