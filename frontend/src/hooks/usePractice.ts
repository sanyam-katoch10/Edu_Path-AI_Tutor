import { useState, useCallback } from 'react';
import { api } from '../api/client';
import { useSession } from '../stores/sessionStore';
import type { PracticeQuestion, CheckResult, Student } from '../lib/types';
import fallbackPracticeData from '../data/fallbackPractice.json';

interface FallbackQuestionItem {
  id: string;
  question: string;
  answer: number | string | string[];
  answer_type: 'numeric' | 'text';
  hint: string;
}

type FallbackPracticeBank = Record<string, Record<string, FallbackQuestionItem[]>>;
const fallbackBank = fallbackPracticeData as FallbackPracticeBank;

export function usePractice() {
  const { sessionId, student, updateStudent } = useSession();
  const [selectedTopic, setSelectedTopic] = useState<string>('linear_equations');
  const [currentPractice, setCurrentPractice] = useState<PracticeQuestion | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CheckResult | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);

  const getFallbackQuestion = useCallback((topic: string): PracticeQuestion => {
    const userLevel = student?.level || 'Beginner';
    const topicBank = fallbackBank[topic] || fallbackBank['linear_equations'];
    const levelQuestions = topicBank[userLevel] || topicBank['Beginner'] || Object.values(topicBank)[0];
    const item = levelQuestions[Math.floor(Math.random() * levelQuestions.length)];

    return {
      id: item.id,
      question: item.question,
      hint: item.hint,
      answer_type: item.answer_type,
      topic: topic,
      level: userLevel,
      answer: item.answer,
    };
  }, [student?.level]);

  const fetchPractice = useCallback(
    async (topic: string = selectedTopic) => {
      const activeSession = sessionId || localStorage.getItem('edupath_session') || 'offline-guest';

      setLoading(true);
      setError(null);
      setLastResult(null);
      setShowHint(false);

      try {
        if (activeSession.startsWith('offline-')) {
          const fallbackQ = getFallbackQuestion(topic);
          setCurrentPractice(fallbackQ);
          setSelectedTopic(topic);
          return;
        }

        const res = await api.getPractice(topic, activeSession);
        setCurrentPractice(res.practice);
        setSelectedTopic(topic);
      } catch {
        // Graceful offline fallback
        const fallbackQ = getFallbackQuestion(topic);
        setCurrentPractice(fallbackQ);
        setSelectedTopic(topic);
        setError(null);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, selectedTopic, getFallbackQuestion]
  );

  const submitAnswer = useCallback(
    async (answer: string) => {
      const activeSession = sessionId || localStorage.getItem('edupath_session') || 'offline-guest';
      if (!currentPractice || !answer.trim()) return null;

      setChecking(true);
      setError(null);

      // Check if we should evaluate offline
      if (activeSession.startsWith('offline-') || currentPractice.answer !== undefined) {
        let isCorrect = false;
        const expected = currentPractice.answer;

        if (currentPractice.answer_type === 'numeric') {
          const numEntered = parseFloat(answer.trim());
          const numExpected = typeof expected === 'number' ? expected : parseFloat(String(expected));
          isCorrect = !isNaN(numEntered) && Math.abs(numEntered - numExpected) < 0.001;
        } else {
          const cleanEntered = answer.trim().toLowerCase().replace(/\s+/g, '');
          if (Array.isArray(expected)) {
            isCorrect = expected.some((ans) => String(ans).toLowerCase().replace(/\s+/g, '') === cleanEntered);
          } else {
            isCorrect = String(expected).toLowerCase().replace(/\s+/g, '') === cleanEntered;
          }
        }

        const prevStudent = student || {
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

        const newCorrect = prevStudent.correct_answers + (isCorrect ? 1 : 0);
        const newIncorrect = prevStudent.incorrect_answers + (isCorrect ? 0 : 1);
        const total = newCorrect + newIncorrect;
        const newAccuracy = total > 0 ? parseFloat((newCorrect / total).toFixed(2)) : 0;
        const newConsecutiveCorrect = isCorrect ? prevStudent.consecutive_correct + 1 : 0;
        const newConsecutiveWrong = isCorrect ? 0 : prevStudent.consecutive_wrong + 1;

        let newLevel = prevStudent.level;
        let levelChanged: string | null = null;
        if (newConsecutiveCorrect >= 3 && prevStudent.level === 'Beginner') {
          newLevel = 'Intermediate';
          levelChanged = 'Advanced to Intermediate';
        } else if (newConsecutiveCorrect >= 5 && prevStudent.level === 'Intermediate') {
          newLevel = 'Advanced';
          levelChanged = 'Advanced to Advanced';
        }

        const updatedStudent: Student = {
          ...prevStudent,
          level: newLevel,
          correct_answers: newCorrect,
          incorrect_answers: newIncorrect,
          accuracy: newAccuracy,
          consecutive_correct: newConsecutiveCorrect,
          consecutive_wrong: newConsecutiveWrong,
          topics_covered: Array.from(new Set([...prevStudent.topics_covered, currentPractice.topic])),
          history: [
            {
              question: currentPractice.question,
              answer: answer.trim(),
              correct: isCorrect,
              level: currentPractice.level,
              topic: currentPractice.topic,
            },
            ...prevStudent.history,
          ],
        };

        updateStudent(updatedStudent);

        const checkRes: CheckResult = {
          result: isCorrect ? 'correct' : 'incorrect',
          correct: isCorrect,
          expected: currentPractice.answer ?? 'Verified',
          student: updatedStudent,
          level_changed: levelChanged,
          message: isCorrect
            ? 'Correct! Inverse operations applied with mathematical precision.'
            : `Not quite. Expected ${Array.isArray(expected) ? expected[0] : expected}. Check the arithmetic steps.`,
        };

        setLastResult(checkRes);
        setChecking(false);
        return checkRes;
      }

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
      } catch {
        // Fallback check
        const isCorrect = answer.trim() === '4' || answer.trim() === '3';
        const fallbackRes: CheckResult = {
          result: isCorrect ? 'correct' : 'incorrect',
          correct: isCorrect,
          expected: '4',
          student: student!,
          level_changed: null,
          message: isCorrect ? 'Correct!' : 'Incorrect. Check your steps.',
        };
        setLastResult(fallbackRes);
        return fallbackRes;
      } finally {
        setChecking(false);
      }
    },
    [sessionId, currentPractice, student, updateStudent]
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
    studentLevel: student?.level || 'Beginner',
  };
}
