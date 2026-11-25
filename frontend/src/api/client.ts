import type {
  SessionResponse, Student, TutorResponse, PracticeResponse,
  CheckResult, LibraryResponse, TopicsResponse, HealthResponse,
} from '../lib/types';
import { API_BASE } from '../lib/constants';

let cachedLibrary: LibraryResponse | null = null;
let cachedTopics: TopicsResponse | null = null;
let cachedHealth: HealthResponse | null = null;

async function request<T>(path: string, options?: RequestInit, timeoutMs = 2500): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Request failed: ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Connection to backend timed out after ${timeoutMs}ms.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  health: async () => {
    if (cachedHealth) return cachedHealth;
    const res = await request<HealthResponse>('/api/health');
    cachedHealth = res;
    return res;
  },

  topics: async () => {
    if (cachedTopics) return cachedTopics;
    const res = await request<TopicsResponse>('/api/topics');
    cachedTopics = res;
    return res;
  },

  createSession: () => request<SessionResponse>('/api/session', { method: 'POST' }),

  getSession: (id: string) => request<SessionResponse & { conversation_count: number }>(`/api/session/${id}`),

  ask: (session_id: string, question: string) =>
    request<TutorResponse>(
      '/api/tutor/ask',
      {
        method: 'POST',
        body: JSON.stringify({ session_id, question }),
      },
      45000 // LLM generation can take longer
    ),

  feedback: (session_id: string, question: string, feedback: string, topic: string, stage = 'main explanation') =>
    request<{ category: string; student: Student }>('/api/tutor/feedback', {
      method: 'POST',
      body: JSON.stringify({ session_id, question, feedback, topic, stage }),
    }),

  getPractice: (topic: string, session_id: string) =>
    request<PracticeResponse>(`/api/practice/${topic}?session_id=${session_id}`),

  checkAnswer: (session_id: string, practice: Record<string, unknown>, answer: string) =>
    request<CheckResult>('/api/practice/check', {
      method: 'POST',
      body: JSON.stringify({ session_id, practice, answer }),
    }),

  library: async () => {
    if (cachedLibrary) return cachedLibrary;
    const res = await request<LibraryResponse>('/api/library');
    cachedLibrary = res;
    return res;
  },
};
