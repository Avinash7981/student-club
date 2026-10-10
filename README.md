# Student Club Event Management System

A comprehensive event management platform tailored for college clubs, organizers, and students. The platform streamlines the complete lifecycle of campus events—from event creation and multi-member team registrations to live QR-based check-ins and performance export reporting.

## 🚀 Key Features

### For Students
- **Dedicated Dashboard:** Browse available events, track registered events, and view upcoming schedules.
- **Team Registrations:** Easily register for events solo or form teams up to the event's capacity.
- **Digital Check-In:** Use your mobile device to check in via QR code or a unique session token for live events.

### For Organizers & Admins
- **Role-Based Authentication:** Distinct login experiences and permissions for Organizers and System Admins.
- **Event Lifecycle Management:** Create, publish, draft, and cancel events, specifying venue, team sizes, and deadlines.
- **Live Attendance Dashboard:** Monitor real-time statistics of students checking in during an active event window.
- **Reports & Exporting:** Generate detailed participant lists and attendance reports as Excel (.xlsx), CSV, and PDF formats.

### System-Wide
- **Modern Interface:** Premium warm-editorial styling with seamless Light & Dark Mode.
- **Idempotent Seeding:** Fully configured demo environment mimicking a live university ecosystem.

## 🛠 Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB & Mongoose
- **File Generation:** ExcelJS, PDFKit

## 📦 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (Running locally on `mongodb://localhost:27017` or a cloud cluster)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Avinash7981/student-club.git
   cd student-club
   ```

2. **Setup the Backend**
   ```bash
   cd backend
   npm install
   
   # Add your environment variables (e.g. JWT_SECRET, MONGODB_URI, PORT=5001) in backend/.env
   
   # Seed the database with demo accounts & events
   npm run seed
   
   # Start the backend server
   npm run dev
   ```

3. **Setup the Frontend**
   ```bash
   cd ../frontend
   npm install
   
   # Start the frontend dev server (runs on port 5173 by default)
   npm run dev
   ```

## 🔐 Demo Credentials

After running the seed script, the following accounts are available for testing:

**Organizers:**
- `tech@college.edu` / `password123`
- `cultural@college.edu` / `password123`

**System Admin:**
- `admin@college.edu` / `password123`

## 📄 License
This project is for educational and internal campus purposes.