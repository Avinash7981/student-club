// API service layer
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function getToken(): string | null {
  return localStorage.getItem('sc_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    request<{ success: boolean; token: string; organizer: Organizer }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { name: string; email: string; password: string; organization: string; phone?: string }) =>
    request<{ success: boolean; token: string; organizer: Organizer }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  me: () => request<{ success: boolean; organizer: Organizer }>('/auth/me'),

  studentLogin: (email: string, password: string) =>
    request<{ success: boolean; token: string; student: Student }>('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  studentRegister: (data: { name: string; email: string; password: string; rollNumber: string; department: string; year: string }) =>
    request<{ success: boolean; token: string; student: Student }>('/auth/student/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  studentMe: () => request<{ success: boolean; student: Student }>('/auth/student/me'),
};

// Events
export const eventsAPI = {
  getPublished: (params?: { search?: string; category?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.category) q.set('category', params.category);
    if (params?.page) q.set('page', String(params.page));
    return request<{ success: boolean; events: Event[]; total: number }>(`/events?${q}`);
  },
  getBySlug: (slug: string) =>
    request<{ success: boolean; event: Event }>(`/events/slug/${slug}`),
  getMyEvents: () =>
    request<{ success: boolean; events: Event[] }>('/events/organizer/my-events'),
  getById: (id: string) =>
    request<{ success: boolean; event: Event }>(`/events/organizer/${id}`),
  create: (data: Partial<Event>) =>
    request<{ success: boolean; event: Event }>('/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Event>) =>
    request<{ success: boolean; event: Event }>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/events/${id}`, { method: 'DELETE' }),
  publish: (id: string) =>
    request<{ success: boolean; event: Event }>(`/events/${id}/publish`, { method: 'PATCH' }),
  unpublish: (id: string) =>
    request<{ success: boolean; event: Event }>(`/events/${id}/unpublish`, { method: 'PATCH' }),
  startAttendance: (id: string) =>
    request<{ success: boolean; event: Event }>(`/events/${id}/start-attendance`, { method: 'PATCH' }),
  endAttendance: (id: string) =>
    request<{ success: boolean; event: Event }>(`/events/${id}/end-attendance`, { method: 'PATCH' }),
  getStats: () =>
    request<{ success: boolean; stats: OrganizerStats }>('/events/organizer/stats'),
  markAttendance: (id: string, token: string) =>
    request<{ success: boolean; message: string }>(`/events/${id}/attendance/mark`, {
      method: 'POST',
      body: JSON.stringify({ token })
    }),
};

// Registrations
export const registrationsAPI = {
  register: (data: RegistrationPayload) =>
    request<{ success: boolean; registration: Registration }>('/registrations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByTeamId: (teamId: string) =>
    request<{ success: boolean; registration: Registration }>(`/registrations/team/${teamId}`),
  getByRoll: (rollNumber: string) =>
    request<{ success: boolean; registrations: Registration[] }>(`/registrations/student/${rollNumber}`),
  getEventRegistrations: (eventId: string, params?: { search?: string; status?: string; sort?: string; order?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    if (params?.sort) q.set('sort', params.sort);
    if (params?.order) q.set('order', params.order);
    return request<{ success: boolean; registrations: Registration[]; total: number }>(`/registrations/event/${eventId}?${q}`);
  },
  getAttendanceStats: (eventId: string) =>
    request<{ success: boolean; stats: AttendanceStats }>(`/registrations/event/${eventId}/attendance-stats`),
  markAttendance: (data: { registrationId: string; memberIndex: number; status: string }) =>
    request<{ success: boolean; registration: Registration }>('/registrations/attendance', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  qrCheckIn: (data: { eventId: string; rollNumber: string }) =>
    request<{ success: boolean; studentName: string; teamName: string; checkInTime: string }>('/registrations/qr-checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Export
export const exportAPI = {
  downloadRegistrations: (eventId: string, format: string = 'xlsx') => {
    const token = getToken();
    // Better approach using fetch with auth header
    return fetch(`${BASE_URL}/export/event/${eventId}/registrations?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `registrations.${format}`;
      if (contentDisposition && contentDisposition.includes('filename="')) {
        filename = contentDisposition.split('filename="')[1].split('"')[0];
      }
      a.download = filename;
      
      a.click();
      URL.revokeObjectURL(url);
    });
  },
  downloadAttendance: (eventId: string, format: string = 'xlsx') => {
    const token = getToken();
    return fetch(`${BASE_URL}/export/event/${eventId}/attendance?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `attendance.${format}`;
      if (contentDisposition && contentDisposition.includes('filename="')) {
        filename = contentDisposition.split('filename="')[1].split('"')[0];
      }
      a.download = filename;

      a.click();
      URL.revokeObjectURL(url);
    });
  },
};

// Types
export interface Organizer {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: 'organizer' | 'admin';
}

export interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  department?: string;
  year?: string;
  role: 'student';
}

export interface Event {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  organizerName: string;
  banner?: string;
  venue: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  maxTeams: number;
  minTeamSize: number;
  maxTeamSize: number;
  registrationCount: number;
  rules: string[];
  eligibility: string;
  tags: string[];
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  attendanceStatus: 'not_started' | 'active' | 'ended';
  attendanceQRCode?: string;
  attendanceToken?: string;
  category: string;
  prizes?: string;
  registrationFee: number;
  roadmap?: {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    venue: string;
    type: string;
    order: number;
  }[];
  createdAt: string;
}

export interface TeamMember {
  _id?: string;
  fullName: string;
  rollNumber: string;
  email: string;
  phone?: string;
  department: string;
  year: string;
  attendanceStatus: 'not_checked' | 'present' | 'absent';
  checkInTime?: string;
}

export interface Registration {
  _id: string;
  event: string | Event;
  teamName: string;
  teamId: string;
  registrationId: string;
  teamLeader: TeamMember;
  members: TeamMember[];
  status: 'registered' | 'confirmed' | 'cancelled';
  registrationTime: string;
  teamAttendanceStatus: 'not_started' | 'partial' | 'full' | 'absent';
  presentCount: number;
  totalCount: number;
}

export interface RegistrationPayload {
  eventId: string;
  teamName: string;
  teamLeader: Omit<TeamMember, '_id' | 'attendanceStatus' | 'checkInTime'>;
  members: Omit<TeamMember, '_id' | 'attendanceStatus' | 'checkInTime'>[];
}

export interface OrganizerStats {
  totalEvents: number;
  activeEvents: number;
  registeredTeams: number;
  totalParticipants: number;
  present: number;
  absent: number;
}

export interface AttendanceStats {
  registeredTeams: number;
  totalParticipants: number;
  present: number;
  absent: number;
  notChecked: number;
  attendanceRate: number;
  attendanceStatus: 'not_started' | 'active' | 'ended';
}
