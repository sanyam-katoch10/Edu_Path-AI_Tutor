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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create session');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await api.getSession(sessionId);
      setStudent(res.student);
    } catch {
      localStorage.removeItem('edupath_session');
      setSessionId(null);
      setStudent(null);
    }
  }, [sessionId]);

  const updateStudent = useCallback((s: Student) => setStudent(s), []);

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
