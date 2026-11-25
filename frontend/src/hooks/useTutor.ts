import { useState, useCallback } from 'react';
import { api } from '../api/client';
import { useSession } from '../stores/sessionStore';
import type { ConversationEntry } from '../lib/types';

export function useTutor() {
  const { sessionId, updateStudent } = useSession();
  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);

  const ask = useCallback(
    async (question: string) => {
      if (!sessionId) {
        setError('No active session. Please start or refresh your session.');
        return null;
      }
      if (!question.trim()) return null;

      setLoading(true);
      setError(null);

      try {
        const res = await api.ask(sessionId, question.trim());
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
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to query AI tutor';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [sessionId, updateStudent]
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
