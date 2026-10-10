import mongoose from 'mongoose';
import Event from './backend/src/models/Event';
import Registration from './backend/src/models/Registration';
import Organizer from './backend/src/models/Organizer';

async function test() {
  await mongoose.connect('mongodb://localhost:27017/student-club');
  const e = await Event.findOne();
  if(!e) { console.log('No events'); process.exit(0); }
  const r = await Registration.find({ event: e._id });
  console.log('Event:', e.title);
  console.log('Registrations:', r.length);
  process.exit(0);
}
test().catch(console.error);
