import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage';
import MyRegistrationsPage from './pages/MyRegistrationsPage';
import OrganizerLoginPage from './pages/OrganizerLoginPage';
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import MyEventsPage from './pages/organizer/MyEventsPage';
import CreateEventPage from './pages/organizer/CreateEventPage';
import EventManagePage from './pages/organizer/EventManagePage';
import AuthLandingPage from './pages/AuthLandingPage';
import StudentLoginPage from './pages/StudentLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentAttendancePage from './pages/StudentAttendancePage';
import StudentDashboard from './pages/StudentDashboard';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'student' | 'organizer' | 'admin' }) {
  const { organizer, student, isLoading } = useAuth();
  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );
  if (role === 'admin') {
    if (!organizer || organizer.role !== 'admin') return <Navigate to="/auth/organizer/login" replace />;
  } else if (role === 'organizer') {
    if (!organizer) return <Navigate to="/auth/organizer/login" replace />;
  } else if (role === 'student') {
    if (!student) return <Navigate to="/auth/student/login" replace />;
  } else if (!role && !organizer && !student) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/events/:slug" element={<EventDetailPage />} />
            <Route path="/my-registrations" element={<MyRegistrationsPage />} />
            <Route path="/auth" element={<AuthLandingPage />} />
            <Route path="/auth/student/login" element={<StudentLoginPage />} />
            <Route path="/auth/student/register" element={<StudentLoginPage />} />
            <Route path="/auth/organizer/login" element={<OrganizerLoginPage />} />
            <Route path="/auth/organizer/register" element={<OrganizerLoginPage />} />

            {/* Protected Student */}
            <Route path="/student/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/attendance/:id" element={<ProtectedRoute role="student"><StudentAttendancePage /></ProtectedRoute>} />

            {/* Protected Organizer */}
            <Route path="/organizer" element={<ProtectedRoute role="organizer"><OrganizerDashboard /></ProtectedRoute>} />
            <Route path="/organizer/events" element={<ProtectedRoute role="organizer"><MyEventsPage /></ProtectedRoute>} />
            <Route path="/organizer/create-event" element={<ProtectedRoute role="organizer"><CreateEventPage /></ProtectedRoute>} />
            <Route path="/organizer/events/:id" element={<ProtectedRoute role="organizer"><EventManagePage /></ProtectedRoute>} />

            {/* Protected Admin */}
            <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
