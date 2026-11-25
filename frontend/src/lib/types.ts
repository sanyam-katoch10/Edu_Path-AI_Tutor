// API types matching the FastAPI backend

export interface Student {
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  correct_answers: number;
  incorrect_answers: number;
  accuracy: number;
  consecutive_correct: number;
  consecutive_wrong: number;
  history: HistoryItem[];
  observations: Observation[];
  support_needed: boolean;
  practice_counts: Record<string, number>;
  topics_covered: string[];
}

export interface HistoryItem {
  question: string;
  answer: string;
  correct: boolean;
  level: string;
  topic: string;
  feedback_category?: string | null;
}

export interface Observation {
  question: string;
  stage: string;
  topic: string;
  category: string;
  note: string;
}

export interface SessionResponse {
  session_id: string;
  student: Student;
  created_at: string;
  last_active?: string;
  conversation_count?: number;
}

export interface TutorResponse {
  response: string;
  topic: string;
  topic_label: string;
  level: string;
  sources: Source[];
  student: Student;
}

export interface Source {
  heading: string;
  score: number;
  module: string;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  hint: string;
  answer_type: 'numeric' | 'text';
  topic: string;
  level: string;
  answer?: unknown;
}

export interface PracticeResponse {
  practice: PracticeQuestion;
  student_level: string;
}

export interface CheckResult {
  result: 'correct' | 'incorrect' | 'unparseable';
  correct: boolean;
  expected: unknown;
  student: Student;
  level_changed: string | null;
  message?: string;
}

export interface LibrarySection {
  index: number;
  heading: string;
  module: string;
  content: string;
  openstax_url: string | null;
}

export interface LibraryResponse {
  modules: Record<string, LibrarySection[]>;
  total_sections: number;
  total_modules: number;
}

export interface TopicsResponse {
  topics: Record<string, string>;
  levels: string[];
}

export interface HealthResponse {
  status: string;
  llm_model: string;
  embedding_model: string;
  knowledge_sections: number;
}

export interface ConversationEntry {
  id: string;
  question: string;
  response: string;
  topic: string;
  topic_label: string;
  level: string;
  sources: Source[];
  timestamp: string;
}
