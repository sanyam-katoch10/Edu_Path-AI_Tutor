import { useState, useCallback } from 'react';
import { api } from '../api/client';
import { useSession } from '../stores/sessionStore';
import type { ConversationEntry, TutorResponse } from '../lib/types';
import fallbackTutorData from '../data/fallbackTutor.json';

type FallbackTutorMap = Record<
  string,
  {
    topic: string;
    topic_label: string;
    level: string;
    sources: { heading: string; module: string; score: number }[];
    response: string;
  }
>;

const fallbackTutor = fallbackTutorData as FallbackTutorMap;

export function useTutor() {
  const { sessionId, student, updateStudent } = useSession();
  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);

  const getFallbackResponse = useCallback(
    (questionText: string): TutorResponse => {
      const q = questionText.toLowerCase();
      let match = fallbackTutor['linear-equations'];

      if (q.includes('f(x)') || q.includes('function')) {
        match = fallbackTutor['functions'];
      } else if (q.includes('slope') || q.includes('steepness') || q.includes('graph')) {
        match = fallbackTutor['slope'];
      } else if (q.includes('system') || q.includes('simultaneous') || q.includes('substitution')) {
        match = fallbackTutor['systems'];
      }

      const activeStudent = student || {
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

      return {
        response: match.response,
        topic: match.topic,
        topic_label: match.topic_label,
        level: match.level,
        sources: match.sources,
        student: activeStudent,
      };
    },
    [student]
  );

  const ask = useCallback(
    async (question: string) => {
      const activeSession = sessionId || localStorage.getItem('edupath_session') || 'offline-guest';
      if (!question.trim()) return null;

      setLoading(true);
      setError(null);

      // If active session is an offline guest session, answer with fallback directly
      if (activeSession.startsWith('offline-')) {
        const res = getFallbackResponse(question.trim());
        const newEntry: ConversationEntry = {
          id: `conv-${Date.now()}`,
          question: question.trim(),
          response: res.response,
          topic: res.topic,
          topic_label: res.topic_label,
          level: res.level,
          sources: res.sources,
          timestamp: new Date().toISOString(),
        };
        setConversations((prev) => [newEntry, ...prev]);
        setLoading(false);
        return res;
      }

      try {
        const res = await api.ask(activeSession, question.trim());
        updateStudent(res.student);

        const newEntry: ConversationEntry = {
          id: `conv-${Date.now()}`,
          question: question.trim(),
          response: res.response,
          topic: res.topic,
          topic_label: res.topic_label,
          level: res.level,
          sources: res.sources,
          timestamp: new Date().toISOString(),
        };

        setConversations((prev) => [newEntry, ...prev]);
        return res;
      } catch {
        // Gracefully fall back to local curated response if LLM is offline/timed out
        const res = getFallbackResponse(question.trim());
        const newEntry: ConversationEntry = {
          id: `conv-${Date.now()}`,
          question: question.trim(),
          response: res.response,
          topic: res.topic,
          topic_label: res.topic_label,
          level: res.level,
          sources: res.sources,
          timestamp: new Date().toISOString(),
        };

        setConversations((prev) => [newEntry, ...prev]);
        setError(null);
        return res;
      } finally {
        setLoading(false);
      }
    },
    [sessionId, updateStudent, getFallbackResponse]
  );

  const submitFeedback = useCallback(
    async (question: string, feedback: string, topic: string) => {
      if (!sessionId || !feedback.trim()) return null;
      setSubmittingFeedback(question);

      try {
        const res = await api.feedback(sessionId, question, feedback.trim(), topic);
        updateStudent(res.student);
        return res;
      } catch (err: unknown) {
        console.error('Feedback submission failed:', err);
        return null;
      } finally {
        setSubmittingFeedback(null);
      }
    },
    [sessionId, updateStudent]
  );

  const clearHistory = useCallback(() => {
    setConversations([]);
  }, []);

  return {
    conversations,
    loading,
    error,
    submittingFeedback,
    ask,
    submitFeedback,
    clearHistory,
  };
}
