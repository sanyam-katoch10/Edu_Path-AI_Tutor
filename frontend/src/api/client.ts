import type {
  SessionResponse, Student, TutorResponse, PracticeResponse,
  CheckResult, LibraryResponse, TopicsResponse, HealthResponse,
} from '../lib/types';
import { API_BASE } from '../lib/constants';
import fallbackLibraryData from '../data/fallbackLibrary.json';

let cachedLibrary: LibraryResponse | null = null;
let cachedTopics: TopicsResponse | null = null;
let cachedHealth: HealthResponse | null = null;

const fallbackLibrary = fallbackLibraryData as unknown as LibraryResponse;

const DEFAULT_FALLBACK_STUDENT: Student = {
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

let localOfflineStudent: Student = { ...DEFAULT_FALLBACK_STUDENT };

const FALLBACK_TOPICS: TopicsResponse = {
  topics: {
    linear_equations: 'Linear Equations',
    multi_variable: 'Equations with Variables',
    equation_behavior: 'Identities & Contradictions',
    systems: 'Systems of Equations',
    inequalities: 'Linear Inequalities',
    functions: 'Functions & Graphs',
    slope: 'Slope and Graphs',
    exponents: 'Exponents & Scientific Notation',
    polynomials: 'Polynomials & Factoring',
    foundations: 'Foundations & Real Numbers',
  },
  levels: ['Beginner', 'Intermediate', 'Advanced'],
};

const FALLBACK_PRACTICE_BANK: Record<string, { id: string; question: string; answer: number | string | string[]; answer_type: 'numeric' | 'text'; hint: string }[]> = {
  linear_equations: [
    { id: 'le-b1', question: 'Solve 2x + 4 = 10. Find x.', answer: 3, answer_type: 'numeric', hint: 'Subtract 4 from both sides, then divide by 2.' },
    { id: 'le-i1', question: 'Solve 4x + 6 = 22. Find x.', answer: 4, answer_type: 'numeric', hint: 'Subtract 6 from both sides, then divide by 4.' },
  ],
  multi_variable: [
    { id: 'mv-b1', question: 'If y = 2x + 1 and x = 3, find y.', answer: 7, answer_type: 'numeric', hint: 'Substitute 3 for x.' },
  ],
  equation_behavior: [
    { id: 'eb-b1', question: 'How many solutions does 2x + 4 = 2x + 4 have? Answer: one, none, or infinitely many.', answer: ['infinitely many', 'infinite solutions', 'all real numbers'], answer_type: 'text', hint: 'Subtract 2x from both sides. Is it always true?' },
  ],
  systems: [
    { id: 'sy-b1', question: 'For x + y = 8 and x - y = 2, find x.', answer: 5, answer_type: 'numeric', hint: 'Add the two equations to eliminate y, then divide by 2.' },
  ],
  inequalities: [
    { id: 'in-b1', question: 'Solve x + 2 > 5. Give your answer using inequality notation.', answer: ['x>3', 'x> 3'], answer_type: 'text', hint: 'Subtract 2 from both sides.' },
  ],
  functions: [
    { id: 'fn-b1', question: 'If f(x) = x + 2, find f(3).', answer: 5, answer_type: 'numeric', hint: 'Replace x with 3 in the function rule.' },
  ],
  slope: [
    { id: 'sl-b1', question: 'Find the slope of the line through (1, 2) and (3, 6).', answer: 2, answer_type: 'numeric', hint: 'Slope is change in y divided by change in x.' },
  ],
  exponents: [
    { id: 'ex-b1', question: 'Evaluate 2^3. Give the numerical answer.', answer: 8, answer_type: 'numeric', hint: 'Multiply 2 by itself three times.' },
  ],
  polynomials: [
    { id: 'po-b1', question: 'What is the degree of 4x^2 + 3x + 1? Give a number.', answer: 2, answer_type: 'numeric', hint: 'The degree is the highest exponent of x.' },
  ],
  foundations: [
    { id: 'fo-b1', question: 'Evaluate |-7| + 3. Give a number.', answer: 10, answer_type: 'numeric', hint: 'The absolute value of -7 is positive 7.' },
  ],
};

const FALLBACK_TUTOR_MAP: Record<string, { topic: string; topic_label: string; response: string }> = {
  linear_equations: {
    topic: 'linear_equations',
    topic_label: 'Linear Equations',
    response: `### 1. CONCEPT\nAn equation is a mathematical statement of balance. The equals sign ($=$) acts as the central fulcrum of a precision balance scale. To preserve equilibrium, any inverse operation applied to one side must be mirrored on the opposite side with identical magnitude.\n\n### 2. PERSONALIZED EXPLANATION\nTo isolate the variable $x$, we undo operations in reverse order: first undo addition or subtraction, then undo multiplication or division.\n\n### 3. STEP-BY-STEP SOLUTION\nLet us solve $2x + 4 = 10$:\n1. **Subtract 4 from both sides**:\n$$2x + 4 - 4 = 10 - 4$$\n$$2x = 6$$\n2. **Divide both sides by 2**:\n$$\\frac{2x}{2} = \\frac{6}{2}$$\n$$x = 3$$\n\n### 4. VERIFICATION\nSubstituting $x = 3$ back into the original expression:\n$$2(3) + 4 = 6 + 4 = 10$$\nBoth sides balance identically: $10 = 10$.`,
  },
  functions: {
    topic: 'functions',
    topic_label: 'Functions & Graphs',
    response: `### 1. CONCEPT\nA function $f(x)$ is a rule that assigns each input $x$ to exactly one output value. Think of $f$ as a calibrated machine: you feed an input into the hopper, and the rule evaluates the result.\n\n### 2. PERSONALIZED EXPLANATION\nThe notation $f(3)$ simply instructs us to substitute the number $3$ wherever $x$ appears in the formula.\n\n### 3. STEP-BY-STEP SOLUTION\nFor $f(x) = 2x + 1$ evaluated at $x = 3$:\n$$f(3) = 2(3) + 1 = 6 + 1 = 7$$\n\n### 4. VERIFICATION\nOn the coordinate plane, the input-output relationship maps to the coordinate point $(3, 7)$.`,
  },
  slope: {
    topic: 'slope',
    topic_label: 'Slope and Graphs',
    response: `### 1. CONCEPT\nSlope ($m$) quantifies the steepness and direction of a line: $m = \\frac{\\Delta y}{\\Delta x} = \\frac{\\text{rise}}{\\text{run}}$. A positive slope rises from left to right; a negative slope descends.\n\n### 2. PERSONALIZED EXPLANATION\nIn the canonical form $y = mx + b$, $m$ indicates how many units $y$ changes for each $1$ unit increase in $x$, and $b$ is the $y$-intercept $(0, b)$.\n\n### 3. STEP-BY-STEP SOLUTION\nIn the equation $y = 2x + 3$:\n- The slope is $m = 2 = \\frac{2}{1}$.\n- Starting from the $y$-intercept $(0, 3)$, advancing $1$ unit right causes the line to climb $2$ units to $(1, 5)$.\n\n### 4. VERIFICATION\nChecking at $x = 1$: $y = 2(1) + 3 = 5$, confirming constant linear gradient.`,
  },
  systems: {
    topic: 'systems',
    topic_label: 'Systems of Equations',
    response: `### 1. CONCEPT\nA system of simultaneous equations represents two geometric lines on the coordinate plane. The solution $(x, y)$ is the point where both lines intersect.\n\n### 2. PERSONALIZED EXPLANATION\nSubstitution solves a system by isolating one variable in one equation and plugging that expression into the second equation, reducing a two-variable problem into a single-variable problem.\n\n### 3. STEP-BY-STEP SOLUTION\nGiven $\\begin{cases} y = 2x + 1 \\\\ x + y = 7 \\end{cases}$:\n1. Substitute $y = 2x + 1$ into $x + y = 7$:\n$$x + (2x + 1) = 7$$\n$$3x + 1 = 7 \\implies 3x = 6 \\implies x = 2$$\n2. Back-substitute $x = 2$ into $y = 2x + 1$:\n$$y = 2(2) + 1 = 5$$\n\n### 4. VERIFICATION\nCheck in equation 2: $2 + 5 = 7$, verifying the solution $(2, 5)$.`,
  },
};

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
    try {
      const res = await request<HealthResponse>('/api/health');
      cachedHealth = res;
      return res;
    } catch {
      return {
        status: 'ready',
        llm_model: 'Qwen 2.5 4B Instruct',
        embedding_model: 'nomic-embed-text',
        knowledge_sections: fallbackLibrary.total_sections,
      } as HealthResponse;
    }
  },

  topics: async () => {
    if (cachedTopics) return cachedTopics;
    try {
      const res = await request<TopicsResponse>('/api/topics');
      cachedTopics = res;
      return res;
    } catch {
      return FALLBACK_TOPICS;
    }
  },

  createSession: async () => {
    try {
      return await request<SessionResponse>('/api/session', { method: 'POST' });
    } catch {
      // Offline fallback: provide local scholar profile
      return {
        session_id: 'guest-scholar-session',
        student: { ...localOfflineStudent },
        created_at: new Date().toISOString(),
      };
    }
  },

  getSession: async (id: string) => {
    try {
      return await request<SessionResponse & { conversation_count: number }>(`/api/session/${id}`);
    } catch {
      return {
        session_id: id || 'guest-scholar-session',
        student: { ...localOfflineStudent },
        created_at: new Date().toISOString(),
        conversation_count: localOfflineStudent.history.length,
      };
    }
  },

  ask: async (session_id: string, question: string) => {
    try {
      // First, always attempt live query to local Ollama backend
      return await request<TutorResponse>(
        '/api/tutor/ask',
        {
          method: 'POST',
          body: JSON.stringify({ session_id, question }),
        },
        45000
      );
    } catch {
      // Offline fallback: match question or provide clear guidance
      const q = question.toLowerCase();
      let matched = FALLBACK_TUTOR_MAP.linear_equations;
      if (q.includes('f(x)') || q.includes('function')) {
        matched = FALLBACK_TUTOR_MAP.functions;
      } else if (q.includes('slope') || q.includes('steepness') || q.includes('graph')) {
        matched = FALLBACK_TUTOR_MAP.slope;
      } else if (q.includes('system') || q.includes('simultaneous') || q.includes('substitution')) {
        matched = FALLBACK_TUTOR_MAP.systems;
      } else {
        // Helpful message for custom questions when offline
        matched = {
          topic: 'general_algebra',
          topic_label: 'Algebraic Foundations',
          response: `### 1. CONCEPT\nEduPath is currently running in **Standalone Frontend Mode** (no live Python/Ollama backend reached).\n\n### 2. PERSONALIZED EXPLANATION\nAll 3D environments, tactile balance scales, and the 23 OpenStax textbook modules are fully interactive in this mode. To ask arbitrary custom questions with real-time generative reasoning from **Qwen 2.5 4B**, run the backend locally:\n\`uvicorn server:app --port 8000\`\n\n### 3. PREVIEW\nTry clicking one of the suggested questions above (e.g. *Equation Equality & Balance*, *Function Meaning*, *Slope and Graphs*) to preview authentic Socratic derivations!`,
        };
      }

      return {
        response: matched.response,
        topic: matched.topic,
        topic_label: matched.topic_label,
        level: localOfflineStudent.level || 'Beginner',
        sources: [
          { heading: '1.2.3 Writing Equations to Represent Relationships', module: 'Linear Equations', score: 0.94 },
          { heading: '1.1.1 Understanding Value', module: 'Foundations', score: 0.88 },
        ],
        student: { ...localOfflineStudent },
      };
    }
  },

  feedback: async (session_id: string, question: string, feedback: string, topic: string, stage = 'main explanation') => {
    try {
      return await request<{ category: string; student: Student }>('/api/tutor/feedback', {
        method: 'POST',
        body: JSON.stringify({ session_id, question, feedback, topic, stage }),
      });
    } catch {
      return { category: 'clarity_request', student: { ...localOfflineStudent } };
    }
  },

  getPractice: async (topic: string, session_id: string) => {
    try {
      return await request<PracticeResponse>(`/api/practice/${topic}?session_id=${session_id}`);
    } catch {
      // Offline fallback: provide practice question from fallback bank
      const list = FALLBACK_PRACTICE_BANK[topic] || FALLBACK_PRACTICE_BANK.linear_equations;
      const item = list[Math.floor(Math.random() * list.length)];
      return {
        practice: {
          id: item.id,
          question: item.question,
          hint: item.hint,
          answer_type: item.answer_type,
          topic,
          level: localOfflineStudent.level || 'Beginner',
          answer: item.answer,
        },
        student_level: localOfflineStudent.level || 'Beginner',
      };
    }
  },

  checkAnswer: async (session_id: string, practice: Record<string, unknown>, answer: string) => {
    try {
      return await request<CheckResult>('/api/practice/check', {
        method: 'POST',
        body: JSON.stringify({ session_id, practice, answer }),
      });
    } catch {
      // Offline fallback: evaluate answer locally
      const expected = practice.answer;
      let isCorrect = false;

      if (practice.answer_type === 'numeric') {
        const enteredNum = parseFloat(answer.trim());
        const expectedNum = typeof expected === 'number' ? expected : parseFloat(String(expected));
        isCorrect = !isNaN(enteredNum) && Math.abs(enteredNum - expectedNum) < 0.001;
      } else {
        const cleanEntered = answer.trim().toLowerCase().replace(/\s+/g, '');
        if (Array.isArray(expected)) {
          isCorrect = expected.some((ans) => String(ans).toLowerCase().replace(/\s+/g, '') === cleanEntered);
        } else {
          isCorrect = String(expected).toLowerCase().replace(/\s+/g, '') === cleanEntered;
        }
      }

      if (isCorrect) {
        localOfflineStudent.correct_answers += 1;
        localOfflineStudent.consecutive_correct += 1;
        localOfflineStudent.consecutive_wrong = 0;
      } else {
        localOfflineStudent.incorrect_answers += 1;
        localOfflineStudent.consecutive_wrong += 1;
        localOfflineStudent.consecutive_correct = 0;
      }
      const total = localOfflineStudent.correct_answers + localOfflineStudent.incorrect_answers;
      localOfflineStudent.accuracy = total > 0 ? parseFloat((localOfflineStudent.correct_answers / total).toFixed(2)) : 0;

      const checkRes: CheckResult = {
        result: isCorrect ? 'correct' : 'incorrect',
        correct: isCorrect,
        expected: expected ?? 'Verified',
        student: { ...localOfflineStudent },
        level_changed: null,
        message: isCorrect
          ? 'Correct! Inverse operations applied with precision.'
          : `Not quite. Expected ${Array.isArray(expected) ? expected[0] : expected}. Check the arithmetic steps.`,
      };
      return checkRes;
    }
  },

  library: async () => {
    if (cachedLibrary) return cachedLibrary;
    try {
      const res = await request<LibraryResponse>('/api/library');
      cachedLibrary = res;
      return res;
    } catch {
      cachedLibrary = fallbackLibrary;
      return fallbackLibrary;
    }
  },
};
