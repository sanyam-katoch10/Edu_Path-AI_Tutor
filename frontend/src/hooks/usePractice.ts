import { useState, useCallback } from 'react';
import { api } from '../api/client';
import { useSession } from '../stores/sessionStore';
import type { PracticeQuestion, CheckResult } from '../lib/types';

export function usePractice() {
  const { sessionId, student, updateStudent } = useSession();
  const [selectedTopic, setSelectedTopic] = useState<string>('linear_equations');
  const [currentPractice, setCurrentPractice] = useState<PracticeQuestion | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CheckResult | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);

  const fetchPractice = useCallback(
    async (topic: string = selectedTopic) => {
      let activeSession = sessionId || localStorage.getItem('edupath_session');
      if (!activeSession) {
        try {
          const sRes = await api.createSession();
          activeSession = sRes.session_id;
          updateStudent(sRes.student);
          localStorage.setItem('edupath_session', sRes.session_id);
        } catch {
          setError('No active session.');
          return;
        }
      }

      setLoading(true);
      setError(null);
      setLastResult(null);
      setShowHint(false);

      try {
        const res = await api.getPractice(topic, activeSession);
        setCurrentPractice(res.practice);
        setSelectedTopic(topic);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch practice exercise';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, selectedTopic, updateStudent]
  );

  const submitAnswer = useCallback(
    async (answer: string) => {
      const activeSession = sessionId || localStorage.getItem('edupath_session');
      if (!activeSession || !currentPractice || !answer.trim()) return null;

      setChecking(true);
      setError(null);

      try {
        const res = await api.checkAnswer(
          activeSession,
          currentPractice as unknown as Record<string, unknown>,
          answer.trim()
        );
        setLastResult(res);
        if (res.student) {
          updateStudent(res.student);
        }
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to check answer';
        setError(msg);
        return null;
      } finally {
        setChecking(false);
      }
    },
    [sessionId, currentPractice, updateStudent]
  );

  const nextQuestion = useCallback(() => {
    fetchPractice(selectedTopic);
  }, [fetchPractice, selectedTopic]);

  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    selectedTopic,
    setSelectedTopic,
    currentPractice,
    loading,
    checking,
    error,
    lastResult,
    showHint,
    setShowHint,
    fetchPractice,
    submitAnswer,
    nextQuestion,
    clearResult,
    student,
    studentLevel: student?.level || 'Beginner',
  };
}
