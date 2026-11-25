import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Sparkles,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Award,
  RefreshCw,
  RotateCcw,
  Cpu,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useTutor } from '../hooks/useTutor';
import { useSession } from '../stores/sessionStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MathRenderer } from '../components/ui/MathRenderer';
import { SceneContainer } from '../components/three/SceneContainer';
import { LearningOrb } from '../components/three/LearningOrb';
import { api } from '../api/client';
import type { Source, HealthResponse } from '../lib/types';

interface SuggestedQuestion {
  id: string;
  topic: string;
  title: string;
  formula: string;
  prompt: string;
}

const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    id: 'linear-equations',
    topic: 'Linear Equations',
    title: 'Equation Equality & Balance',
    formula: '2x + 4 = 10',
    prompt: 'Why do we perform the same operation on both sides when solving an equation? Explain with 2x + 4 = 10.',
  },
  {
    id: 'functions',
    topic: 'Functions',
    title: 'Function Meaning & Evaluation',
    formula: 'f(x) = 2x + 1',
    prompt: 'What does f(x) actually mean? Explain using a real-life example and calculate f(3) when f(x) = 2x + 1.',
  },
  {
    id: 'slope',
    topic: 'Slope and Graphs',
    title: 'Direction & Steepness',
    formula: 'y = 2x + 3',
    prompt: 'How does the slope of a line affect its direction and steepness? Explain using y = 2x + 3.',
  },
  {
    id: 'systems',
    topic: 'Systems of Equations',
    title: 'Simultaneous Substitution',
    formula: '{y = 2x + 1, x + y = 7}',
    prompt: 'How can we solve two simultaneous equations using substitution? Demonstrate with a complete example.',
  },
];

interface ParsedSection {
  title: string | null;
  key: string;
  content: string;
}

/**
 * Organizes available tutor response content into distinct educational sections
 * (Concept, Personalized Explanation, Worked Example / Step-by-Step Solution, Verification).
 * Preserves the exact mathematical content without inventing missing sections.
 */
function parseTutorResponse(text: string): ParsedSection[] {
  const sectionKeywords = [
    { key: 'concept', pattern: /(?:^|\n)(?:###?\s*|\*\*)?(?:1[\.\)]\s*)?CONCEPT(?:\*\*)?:?\s*/i, title: 'Concept Explanation' },
    { key: 'explanation', pattern: /(?:^|\n)(?:###?\s*|\*\*)?(?:2[\.\)]\s*)?PERSONALIZED EXPLANATION(?:\*\*)?:?\s*/i, title: 'Personalized Explanation' },
    { key: 'solution', pattern: /(?:^|\n)(?:###?\s*|\*\*)?(?:3[\.\)]\s*)?(?:SOLUTION TO THE EXACT QUESTION|STEP-BY-STEP SOLUTION|WORKED EXAMPLE|SOLUTION)(?:\*\*)?:?\s*/i, title: 'Step-by-Step Solution' },
    { key: 'verification', pattern: /(?:^|\n)(?:###?\s*|\*\*)?(?:4[\.\)]\s*)?VERIFICATION(?:\s*,\s*when applicable)?(?:\*\*)?:?\s*/i, title: 'Verification' },
    { key: 'sources', pattern: /(?:^|\n)(?:###?\s*|\*\*)?(?:5[\.\)]\s*)?SOURCES(?:\*\*)?:?\s*/i, title: 'Sources' },
  ];

  const matches: { key: string; title: string; index: number; length: number }[] = [];
  for (const sk of sectionKeywords) {
    const match = sk.pattern.exec(text);
    if (match) {
      matches.push({ key: sk.key, title: sk.title, index: match.index, length: match[0].length });
    }
  }

  // If response doesn't follow standard 5-part structure, return single body
  if (matches.length < 2) {
    return [{ title: null, key: 'body', content: text }];
  }

  matches.sort((a, b) => a.index - b.index);

  const sections: ParsedSection[] = [];
  if (matches[0].index > 0) {
    const intro = text.slice(0, matches[0].index).trim();
    if (intro) sections.push({ title: null, key: 'intro', content: intro });
  }

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const startIndex = cur.index + cur.length;
    const endIndex = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const content = text.slice(startIndex, endIndex).trim();
    // Sources are rendered separately via the dedicated OpenStax drawer
    if (content && cur.key !== 'sources') {
      sections.push({ title: cur.title, key: cur.key, content });
    }
  }

  return sections.length > 0 ? sections : [{ title: null, key: 'body', content: text }];
}

export const Tutor: React.FC = () => {
  const navigate = useNavigate();
  const { conversations, loading, error, ask, submitFeedback, clearHistory } = useTutor();
  const { student, sessionId, createSession } = useSession();

  const [question, setQuestion] = useState('');
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [submittedFeedbackIds, setSubmittedFeedbackIds] = useState<Record<string, boolean>>({});
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [healthInfo, setHealthInfo] = useState<HealthResponse | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);

  // Fetch telemetry/model details on mount
  useEffect(() => {
    api.health().then(setHealthInfo).catch(() => { });
  }, []);

  // Compute LearningOrb status strictly matching the approved states
  const orbStatus: 'idle' | 'thinking' | 'explaining' = loading
    ? 'thinking'
    : conversations.length > 0
      ? 'explaining'
      : 'idle';

  // Chronological order: earliest message at top, newest at bottom
  const chronologicalConversations = useMemo(
    () => [...conversations].reverse(),
    [conversations]
  );

  // Handle user scroll to avoid interrupting reading when scrolled up
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    isNearBottomRef.current = scrollHeight - (scrollTop + clientHeight) < 120;
  }, []);

  // Auto-scroll ONLY the conversation container, preventing full-page jumping
  useEffect(() => {
    if (isNearBottomRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [chronologicalConversations.length, loading, pendingQuestion]);

  // Submit question with duplicate prevention and error preservation
  const handleSendQuestion = async (queryText?: string) => {
    const textToSend = (queryText ?? question).trim();
    if (!textToSend || loading) return;

    if (!sessionId) {
      await createSession();
    }

    const previousQuestion = textToSend;
    if (!queryText) {
      setQuestion('');
    }
    setPendingQuestion(textToSend);
    isNearBottomRef.current = true;

    try {
      const result = await ask(textToSend);
      if (!result && !queryText) {
        setQuestion(previousQuestion);
      }
    } finally {
      setPendingQuestion(null);
    }
  };

  // Expose test hook for automated verification suites
  useEffect(() => {
    (window as unknown as { __testAsk?: (q: string) => Promise<void> }).__testAsk = handleSendQuestion;
  }, [handleSendQuestion]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleSendQuestion();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFeedback = async (
    convId: string,
    questionText: string,
    topic: string,
    feedbackType: 'clear and helpful' | 'too fast or confusing' | 'too easy'
  ) => {
    await submitFeedback(questionText, feedbackType, topic);
    setSubmittedFeedbackIds((prev) => ({ ...prev, [convId]: true }));
  };

  const toggleSources = (id: string) => {
    setExpandedSources((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleClearHistory = () => {
    clearHistory();
    setPendingQuestion(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ════════════════════════════════════════════════════════════
       *  MAIN LAYOUT: TWO PERSISTENT COLUMNS
       *  Left Column: Persistent Sticky Orb Observatory
       *  Right Column: Independently Scrolling Live Learning Workspace
       * ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start lg:h-[calc(100vh-10.25rem)] lg:min-h-[600px] lg:max-h-[780px]">

        {/* ──────────────────────────────────────────────────────────
         *  LEFT COLUMN — Orb Observatory (lg:col-span-5 xl:col-span-4)
         *  - Persistent & sticky on desktop
         *  - Vertically centered full-size 3D LearningOrb
         *  - Live system status, local model, OpenStax RAG & learning level
         *  - NEVER disappears when a question is asked or scrolled
         * ────────────────────────────────────────────────────────── */}
        <aside
          aria-label="Orb Observatory"
          className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28 rounded-3xl bg-[#061810]/80 border border-[#E8C97A]/22 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col justify-between h-auto lg:h-full overflow-hidden"
        >
          {/* Masthead Header */}
          <div className="space-y-1.5 shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#E8C97A]">
              <Sparkles className="w-3.5 h-3.5 text-[#E8C97A]" />
              <span>YOUR PERSONAL MATHEMATICS INTELLIGENCE</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#FFFDF7] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)]">
              AI Learning Studio
            </h1>
            <p className="text-xs text-[#C6C3B7] leading-relaxed">
              Real-time cognitive guidance and step-by-step mathematical derivations.
            </p>
          </div>

          {/* Vertically Centered Full-Size LearningOrb */}
          <div className="flex-1 my-auto flex flex-col items-center justify-center relative py-2 sm:py-3">
            {/* Ambient lighting & restrained particle glow fields */}
            <div
              className={`absolute w-[280px] sm:w-[320px] h-[280px] sm:h-[320px] rounded-full blur-[65px] pointer-events-none transition-all duration-1000 -z-10 ${loading
                ? 'bg-[#52B788]/30 scale-110 animate-pulse'
                : orbStatus === 'explaining'
                  ? 'bg-[#E8C97A]/22 scale-105'
                  : 'bg-[#2D7554]/22 scale-100'
                }`}
            />
            <div className="absolute w-[180px] h-[180px] rounded-full blur-[35px] bg-[#E8C97A]/12 pointer-events-none -z-10" />

            {/* UNMODIFIED ORIGINAL FULL-SIZE 3D LEARNING ORB */}
            <div className="observatory-orb-container">
              <SceneContainer
                className="w-full h-full"
                cameraPosition={[0, 0, 3.4]}
                enableTilt={true}
                minHeight="260px"
                fallbackTitle="Observatory Astrolabe"
                fallbackSubtitle="Cognitive Geometry Engine"
              >
                <LearningOrb
                  status={orbStatus}
                  size="lg"
                  coreColor="#2D6A4F"
                  haloColor="#D4A373"
                />
              </SceneContainer>
            </div>
          </div>

          {/* System Telemetry Underneath the Orb */}
          <div className="w-full space-y-2.5 shrink-0 pt-2 border-t border-white/[0.06]">
            {/* System Status Indicator */}
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#082015]/90 border border-white/[0.08] backdrop-blur-md">
              <span className="text-[11px] text-[#A8A69B]">System Status</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                {loading ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#F3B05A] animate-ping" />
                    <span className="text-[#F5E3B3]">Reasoning...</span>
                  </>
                ) : orbStatus === 'explaining' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#74F0B0]" />
                    <span className="text-[#74C69D]">Explaining</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#52B788]" />
                    <span className="text-[#A7E4C4]">Ready</span>
                  </>
                )}
              </span>
            </div>

            {/* Model, RAG & Adaptive Level Details */}
            <div className="px-3.5 py-2 rounded-xl bg-[#071B11]/80 border border-white/[0.06] text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-[#A8A69B]">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#74C69D]" /> Local Model
                </span>
                <span className="font-mono text-[#D8F3DC]">{healthInfo?.llm_model || 'Qwen 2.5 4B Instruct'}</span>
              </div>
              <div className="flex items-center justify-between text-[#A8A69B]">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#E8C97A]" /> OpenStax RAG
                </span>
                <span className="text-[#F5E3B3] font-medium">Grounded (23 Sec)</span>
              </div>
              <div className="flex items-center justify-between text-[#A8A69B]">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#74C69D]" /> Adaptive Level
                </span>
                <span className="text-[10px] font-semibold text-[#74C69D] px-2 py-0.5 rounded-full bg-[#143D2A] border border-[#74C69D]/30">
                  {student?.level || 'Beginner'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* ──────────────────────────────────────────────────────────
         *  RIGHT COLUMN — Live Learning Workspace (lg:col-span-7 xl:col-span-8)
         *  - Complete tutor conversation
         *  - Clean structured AI response (Concept, Explanation, Solution, Verification, Sources)
         *  - Only this conversation area scrolls independently
         *  - Fixed message input area permanently at bottom
         * ────────────────────────────────────────────────────────── */}
        <main
          aria-label="Live Learning Workspace"
          className="lg:col-span-7 xl:col-span-8 lg:h-full flex flex-col rounded-3xl bg-[#061810]/85 border border-[#E8C97A]/22 backdrop-blur-2xl shadow-[0_24px_70px_-15px_rgba(0,0,0,0.8)] overflow-hidden min-h-[560px]"
        >
          {/* Workspace Pinned Top Header */}
          <div className="px-5 py-3.5 border-b border-white/[0.08] bg-[#05130C]/90 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1C543A] to-[#0E2E20] border border-[#74C69D]/45 flex items-center justify-center shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#A7E4C4]" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-[#FFFDF7] flex items-center gap-2">
                  EduPath Tutor
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#113824]/90 text-[#74C69D] border border-[#74C69D]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#74F0B0] animate-pulse" />
                    Live
                  </span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[#E8C97A]">
                <BookOpen className="w-3 h-3 text-[#E8C97A]" />
                <span className="hidden sm:inline">Grounded in</span> OpenStax Algebra
              </span>

              {chronologicalConversations.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-[#123826] border border-white/10 hover:border-[#E8C97A]/40 text-[11px] text-[#D6D3C7] hover:text-[#FFFDF7] transition-all cursor-pointer"
                  title="Start a new investigation"
                >
                  <RotateCcw className="w-3 h-3 text-[#E8C97A]" />
                  <span className="hidden md:inline">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Independent Scrolling Conversation Area */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6"
          >
            {error && (
              <div className="p-3.5 rounded-2xl bg-[#E07A5F]/18 border border-[#EB9A85]/45 flex items-center gap-2.5 text-xs text-[#EB9A85]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* EMPTY STATE: Welcome message and proper suggested learning questions */}
            {chronologicalConversations.length === 0 && !pendingQuestion ? (
              <div className="h-full min-h-[360px] flex flex-col justify-center py-4 space-y-5">
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#E8C97A]">
                    <Sparkles className="w-3.5 h-3.5 text-[#E8C97A]" />
                    <span>Welcome to the Tutor Workspace</span>
                  </div>
                  <h3 className="font-editorial text-xl sm:text-2xl font-semibold text-[#FFFDF7]">
                    What mathematical concept would you like to explore?
                  </h3>
                  <p className="text-xs sm:text-sm text-[#B5B2A6] max-w-2xl leading-relaxed">
                    Select one of the foundational investigations below or type any question into the composer. The AI tutor provides step-by-step solutions verified against OpenStax textbooks.
                  </p>
                </div>

                {/* The Four Meaningful Clickable Suggested Questions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {SUGGESTED_QUESTIONS.map((sq, idx) => (
                    <button
                      key={sq.id}
                      type="button"
                      disabled={loading}
                      onClick={() => handleSendQuestion(sq.prompt)}
                      className="group p-3.5 rounded-2xl bg-[#061A11]/60 hover:bg-[#103322]/90 border border-[#E8C97A]/20 hover:border-[#E8C97A]/50 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-sm hover:shadow-[0_8px_25px_rgba(0,0,0,0.5)] disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#E8C97A] font-semibold">
                          0{idx + 1} — {sq.topic}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#E8C97A] opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                      <div className="text-xs text-[#EDEAE0] group-hover:text-[#FFFDF7] font-medium leading-snug line-clamp-2">
                        {sq.prompt}
                      </div>
                      <div className="pt-1">
                        <span className="text-[10px] font-mono text-[#74C69D] bg-[#0E281C] px-2 py-0.5 rounded border border-[#74C69D]/20">
                          {sq.formula}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ACTIVE CONVERSATION MESSAGES */
              chronologicalConversations.map((entry) => {
                const isSourcesOpen = expandedSources[entry.id];
                const isFeedbackSent = submittedFeedbackIds[entry.id];
                const organizedSections = parseTutorResponse(entry.response);

                return (
                  <div key={entry.id} className="space-y-4">
                    {/* User Question Bubble (Right-Aligned) */}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] bg-gradient-to-r from-[#143B28] to-[#1C4E36] border border-[#74C69D]/35 text-[#FFFDF7] px-4 sm:px-5 py-2.5 rounded-2xl rounded-tr-sm shadow-md text-xs sm:text-sm font-medium leading-relaxed">
                        {entry.question}
                      </div>
                    </div>

                    {/* Tutor Structured Response (Left-Aligned) */}
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#15412C] border border-[#74C69D]/45 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_12px_rgba(82,183,136,0.22)]">
                        <Sparkles className="w-3.5 h-3.5 text-[#A7E4C4]" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Meta Header */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-[#FFFDF7]">EduPath Tutor</span>
                          <Badge variant="forest" size="sm">
                            {entry.topic_label}
                          </Badge>
                          <Badge variant="amber" size="sm">
                            {entry.level}
                          </Badge>
                        </div>

                        {/* Structured Educational Sections */}
                        <div className="space-y-3">
                          {organizedSections.map((sec, secIdx) => {
                            if (!sec.title) {
                              return (
                                <div
                                  key={secIdx}
                                  className="text-xs sm:text-sm leading-relaxed text-[#EDEAE0] bg-[#05130C]/80 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-inner"
                                >
                                  <MathRenderer content={sec.content} />
                                </div>
                              );
                            }

                            return (
                              <div
                                key={secIdx}
                                className={`rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${sec.key === 'concept'
                                  ? 'bg-[#061810]/75 border border-[#74C69D]/25'
                                  : sec.key === 'solution'
                                    ? 'bg-[#081F15]/85 border border-[#E8C97A]/28 shadow-sm'
                                    : sec.key === 'verification'
                                      ? 'bg-[#061C12]/80 border border-[#74F0B0]/30'
                                      : 'bg-[#05140D]/80 border border-white/10'
                                  }`}
                              >
                                <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-white/[0.06]">
                                  {sec.key === 'concept' && <BookOpen className="w-3.5 h-3.5 text-[#74C69D]" />}
                                  {sec.key === 'explanation' && <Sparkles className="w-3.5 h-3.5 text-[#E8C97A]" />}
                                  {sec.key === 'solution' && <Layers className="w-3.5 h-3.5 text-[#F5E3B3]" />}
                                  {sec.key === 'verification' && <CheckCircle2 className="w-3.5 h-3.5 text-[#74F0B0]" />}
                                  <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-[#F5E3B3]">
                                    {sec.title}
                                  </span>
                                </div>
                                <div className="text-[#EDEAE0]">
                                  <MathRenderer content={sec.content} />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Grounded OpenStax Sources Drawer */}
                        {entry.sources && entry.sources.length > 0 && (
                          <div className="rounded-xl border border-white/[0.08] bg-[#061810]/50 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleSources(entry.id)}
                              className="flex items-center justify-between w-full text-xs font-medium text-[#D0CDC0] hover:text-[#F5E3B3] px-3.5 py-2.5 cursor-pointer transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-[#E8C97A]" />
                                Retrieved OpenStax Sources ({entry.sources.length})
                              </span>
                              {isSourcesOpen ? (
                                <ChevronUp className="w-4 h-4 text-[#A8A69B]" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-[#A8A69B]" />
                              )}
                            </button>

                            {isSourcesOpen && (
                              <div className="p-3 pt-0 space-y-2 border-t border-white/[0.06]">
                                {entry.sources.map((src: Source, sIdx: number) => (
                                  <div
                                    key={sIdx}
                                    className="flex items-center justify-between text-xs text-[#E3DFD3] bg-white/[0.03] px-3 py-2 rounded-lg border border-white/[0.04]"
                                  >
                                    <div className="truncate mr-3">
                                      <p className="font-semibold text-[#FFFDF7] truncate">{src.heading}</p>
                                      <p className="text-[11px] text-[#A8A69B]">{src.module}</p>
                                    </div>
                                    <span className="text-[10px] font-mono bg-[#1A4B35]/70 text-[#F5E3B3] px-2 py-0.5 rounded-full shrink-0 border border-[#E8C97A]/20">
                                      Sim {Math.round(src.score * 100)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Feedback & Practice Topic Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-[#B5B2A6]">
                          {isFeedbackSent ? (
                            <span className="text-[#74C69D] font-medium flex items-center gap-1 text-[11px]">
                              <Check className="w-3.5 h-3.5" /> Feedback registered
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleFeedback(entry.id, entry.question, entry.topic, 'clear and helpful')
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-[#194732]/80 border border-white/10 hover:border-[#74C69D]/40 text-[#D6D3C7] hover:text-[#FFFDF7] transition-all cursor-pointer text-[11px]"
                              >
                                <ThumbsUp className="w-3 h-3 text-[#74C69D]" /> Helpful
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleFeedback(entry.id, entry.question, entry.topic, 'too fast or confusing')
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-[#3E1B13]/80 border border-white/10 hover:border-[#E07A5F]/40 text-[#D6D3C7] hover:text-[#FFFDF7] transition-all cursor-pointer text-[11px]"
                              >
                                <ThumbsDown className="w-3 h-3 text-[#E07A5F]" /> More steps
                              </button>
                            </div>
                          )}

                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => navigate('/practice')}
                            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                          >
                            Practice Topic
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Pending Question & Reasoning Indicator */}
            {loading && (
              <div className="space-y-4 pt-1">
                {pendingQuestion && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-gradient-to-r from-[#143B28] to-[#1C4E36] border border-[#74C69D]/35 text-[#FFFDF7] px-4 sm:px-5 py-2.5 rounded-2xl rounded-tr-sm shadow-md text-xs sm:text-sm font-medium leading-relaxed">
                      {pendingQuestion}
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#15412C] border border-[#74C69D]/45 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_12px_rgba(82,183,136,0.22)]">
                    <Sparkles className="w-3.5 h-3.5 text-[#A7E4C4] animate-spin" />
                  </div>
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#05130C]/75 border border-[#52B788]/25 text-xs text-[#A7E4C4]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#74C69D]" />
                    <span>Retrieving OpenStax knowledge & formulating step-by-step guidance...</span>
                  </div>
                </div>
              </div>
            )}

            <div className="h-2" />
          </div>

          {/* Fixed Bottom Message Input Area */}
          <div className="p-3 sm:p-4 border-t border-white/[0.08] bg-[#05130C]/95 shrink-0">
            <form
              onSubmit={handleSubmit}
              className="relative flex items-center gap-2 rounded-2xl bg-[#082015]/95 border border-[#E8C97A]/25 focus-within:border-[#74C69D]/70 focus-within:ring-2 focus-within:ring-[#52B788]/20 px-3.5 py-2 transition-all shadow-inner"
            >
              <textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={
                  loading
                    ? 'Formulating response grounded in OpenStax...'
                    : 'Ask a mathematical question or follow-up...'
                }
                disabled={loading}
                className="flex-1 bg-transparent text-xs sm:text-sm text-[#FFFDF7] placeholder:text-[#8E8B80] focus:outline-none resize-none max-h-28 py-1 leading-relaxed"
              />
              <button
                type="submit"
                disabled={!question.trim() || loading}
                aria-label="Send question to AI Tutor"
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#52B788] to-[#2D6A4F] hover:from-[#74C69D] hover:to-[#40916C] text-[#05120B] flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(82,183,136,0.32)] disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer group"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 text-[#05120B] animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-[#05120B] group-hover:translate-x-0.5 transition-transform" />
                )}
              </button>
            </form>
            <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] text-[#8E8B80]">
              <span>
                Press <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-[#C6C3B7] font-mono">Enter ↵</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-[#C6C3B7] font-mono">Shift + Enter</kbd> for new line
              </span>
              <span className="hidden sm:inline font-mono text-[#E8C97A]/80">
                Qwen 2.5 4B · OpenStax Grounded
              </span>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
};
