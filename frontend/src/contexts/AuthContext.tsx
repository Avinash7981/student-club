import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, Organizer, Student } from '../api';

interface AuthContextType {
  organizer: Organizer | null;
  student: Student | null;
  user: Organizer | Student | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  studentLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sc_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('sc_token');
    const userRole = localStorage.getItem('sc_role');
    if (savedToken) {
      if (userRole === 'student') {
        authAPI
          .studentMe()
          .then((res) => setStudent(res.student))
          .catch(() => {
            localStorage.removeItem('sc_token');
            localStorage.removeItem('sc_role');
            setToken(null);
          })
          .finally(() => setIsLoading(false));
      } else {
        authAPI
          .me()
          .then((res) => setOrganizer(res.organizer))
          .catch(() => {
            localStorage.removeItem('sc_token');
            localStorage.removeItem('sc_role');
            setToken(null);
          })
          .finally(() => setIsLoading(false));
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    localStorage.setItem('sc_token', res.token);
    localStorage.setItem('sc_role', 'organizer');
    setToken(res.token);
    setOrganizer(res.organizer);
    setStudent(null);
  };

  const studentLogin = async (email: string, password: string) => {
    const res = await authAPI.studentLogin(email, password);
    localStorage.setItem('sc_token', res.token);
    localStorage.setItem('sc_role', 'student');
    setToken(res.token);
    setStudent(res.student);
    setOrganizer(null);
  };

  const logout = () => {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_role');
    setToken(null);
    setOrganizer(null);
    setStudent(null);
  };

  return (
    <AuthContext.Provider value={{ organizer, student, user: student || organizer, token, login, studentLogin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
