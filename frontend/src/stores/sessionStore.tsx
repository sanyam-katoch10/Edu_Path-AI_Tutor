import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { api } from '../api/client';
import type { Student } from '../lib/types';

interface SessionState {
  sessionId: string | null;
  student: Student | null;
  loading: boolean;
  error: string | null;
  createSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateStudent: (s: Student) => void;
}

const DEFAULT_STUDENT: Student = {
  level: 'Beginner',
  correct_answers: 0,
  incorrect_answers: 0,
  accuracy: 0,
  consecutive_correct: 0,
  consecutive_wrong: 0,
  history: [],
  observations: [],
  support_needed: false,
  practice_counts: {},
  topics_covered: [],
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem('edupath_session'));
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.createSession();
      setSessionId(res.session_id);
      setStudent(res.student);
      localStorage.setItem('edupath_session', res.session_id);
      localStorage.setItem('edupath_local_student', JSON.stringify(res.student));
    } catch {
      // Standalone / Offline mode fallback: gracefully enable guest session
      const localId = 'offline-scholar-' + Date.now().toString(36);
      const savedStudent = localStorage.getItem('edupath_local_student');
      let fallbackStudent = DEFAULT_STUDENT;
      if (savedStudent) {
        try {
          fallbackStudent = JSON.parse(savedStudent);
        } catch {
          fallbackStudent = DEFAULT_STUDENT;
        }
      }
      setSessionId(localId);
      setStudent(fallbackStudent);
      localStorage.setItem('edupath_session', localId);
      localStorage.setItem('edupath_local_student', JSON.stringify(fallbackStudent));
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (!sessionId) return;
    if (sessionId.startsWith('offline-')) {
      const saved = localStorage.getItem('edupath_local_student');
      if (saved) {
        try {
          setStudent(JSON.parse(saved));
          return;
        } catch {}
      }
      setStudent(DEFAULT_STUDENT);
      return;
    }
    try {
      const res = await api.getSession(sessionId);
      setStudent(res.student);
      localStorage.setItem('edupath_local_student', JSON.stringify(res.student));
    } catch {
      // Backend unavailable; preserve existing or local student profile
      const saved = localStorage.getItem('edupath_local_student');
      if (saved) {
        try {
          setStudent(JSON.parse(saved));
          return;
        } catch {}
      }
      setStudent(DEFAULT_STUDENT);
    }
  }, [sessionId]);

  const updateStudent = useCallback((s: Student) => {
    setStudent(s);
    try {
      localStorage.setItem('edupath_local_student', JSON.stringify(s));
    } catch {}
  }, []);

  useEffect(() => {
    if (sessionId && !student) {
      refreshSession();
    } else if (!sessionId && !loading && !error) {
      createSession();
    }
  }, [sessionId, student, loading, error, refreshSession, createSession]);

  return (
    <SessionContext value={{ sessionId, student, loading, error, createSession, refreshSession, updateStudent }}>
      {children}
    </SessionContext>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
