import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Award,
  AlertCircle,
  RotateCcw,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Scale,
  Hash,
  LineChart,
  Lightbulb,
} from 'lucide-react';
import { usePractice } from '../hooks/usePractice';
import { useSession } from '../stores/sessionStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MathRenderer } from '../components/ui/MathRenderer';
import { Skeleton } from '../components/ui/Skeleton';
import { EquationBalanceScale } from '../components/visualizers/EquationBalanceScale';
import { InequalityNumberLine } from '../components/visualizers/InequalityNumberLine';
import { CoordinateGrapher } from '../components/visualizers/CoordinateGrapher';
import { MultiVariableVisualizer } from '../components/visualizers/MultiVariableVisualizer';
import { ConceptRuleVisualizer } from '../components/visualizers/ConceptRuleVisualizer';
import { parseActiveProblem } from '../lib/practiceModel';
import type { ParsedPracticeModel } from '../lib/practiceModel';

const TOPICS = [
  { id: 'linear_equations', label: 'Linear Equations', tool: 'scale' },
  { id: 'multi_variable', label: 'Multi-Variable', tool: 'multivar' },
  { id: 'equation_behavior', label: 'Equation Behavior', tool: 'scale' },
  { id: 'inequalities', label: 'Inequalities', tool: 'numberline' },
  { id: 'functions', label: 'Functions & Graphs', tool: 'graph' },
  { id: 'slope', label: 'Slope & Linear Forms', tool: 'graph' },
  { id: 'systems', label: 'Systems of Equations', tool: 'graph' },
  { id: 'exponents', label: 'Exponents', tool: 'concept' },
  { id: 'polynomials', label: 'Polynomials', tool: 'concept' },
  { id: 'foundations', label: 'Foundations', tool: 'concept' },
  { id: 'general_algebra', label: 'General Algebra', tool: 'scale' },
];

export const Practice: React.FC = () => {
  const {
    selectedTopic,
    setSelectedTopic,
    currentPractice,
    loading,
    checking,
    error,
    lastResult,
    fetchPractice,
    submitAnswer,
    nextQuestion,
    clearResult,
    studentLevel,
  } = usePractice();

  const { student } = useSession();
  const [searchParams] = useSearchParams();
  const [answerInput, setAnswerInput] = useState('');
  const [hintStage, setHintStage] = useState<number>(0); // 0: closed, 1: conceptual, 2: detailed
  const [inputError, setInputError] = useState<string | null>(null);

  const topicParam = searchParams.get('topic');

  // Synchronize URL topic query parameter with Practice selection
  useEffect(() => {
    if (topicParam && TOPICS.some((t) => t.id === topicParam)) {
      if (selectedTopic !== topicParam) {
        setSelectedTopic(topicParam);
        setAnswerInput('');
        setHintStage(0);
        fetchPractice(topicParam);
      }
    }
  }, [topicParam, selectedTopic, setSelectedTopic, fetchPractice]);

  // Initial load
  useEffect(() => {
    if (!currentPractice && !loading) {
      fetchPractice(selectedTopic);
    }
  }, [currentPractice, loading, fetchPractice, selectedTopic]);

  const handleTopicChange = (topicId: string) => {
    setSelectedTopic(topicId);
    setAnswerInput('');
    setHintStage(0);
    setInputError(null);
    fetchPractice(topicId);

    // Scroll smoothly to ensure stage is visible below navbar
    const stage = document.getElementById('practice-arena-stage');
    if (stage) {
      stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Derive mathematical model from active problem (single source of truth)
  const parsedModel: ParsedPracticeModel | null = useMemo(() => {
    if (!currentPractice) return null;
    return parseActiveProblem(selectedTopic, currentPractice.question);
  }, [selectedTopic, currentPractice]);

  // Dynamic Contextual Placeholder matching specific topic requirements
  const contextualPlaceholder = useMemo(() => {
    if (!currentPractice) return 'Enter answer...';
    const q = currentPractice.question;
    const t = selectedTopic;

    if (t === 'multi_variable') {
      const match = q.match(/find\s+([a-zA-Z])/i);
      const varName = match ? match[1] : 'y';
      return `Enter ${varName} (e.g. 6)...`;
    }
    if (t === 'slope') {
      return 'Enter the slope (e.g. 3)...';
    }
    if (t === 'functions') {
      const fnMatch = q.match(/find\s+(f\(-?\d+\))/i);
      if (fnMatch) return `Enter ${fnMatch[1]} (e.g. 3)...`;
      return 'Enter f(4) (e.g. 3)...';
    }
    if (t === 'exponents') {
      return 'Enter numerical answer (e.g. 32)...';
    }
    if (t === 'polynomials') {
      return 'Enter degree (e.g. 5)...';
    }
    if (t === 'inequalities') {
      return 'Enter solution (e.g. x ≤ 4)...';
    }
    if (t === 'equation_behavior') {
      return 'Enter solution (e.g. infinitely many, none, one)...';
    }
    if (t === 'systems') {
      return 'Enter x (e.g. 5)...';
    }
    if (t === 'linear_equations' || t === 'general_algebra') {
      return 'Enter x (e.g. 4)...';
    }
    return currentPractice.answer_type === 'numeric'
      ? 'Enter numerical value...'
      : 'Enter solution...';
  }, [currentPractice, selectedTopic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    const trimmed = answerInput.trim();
    if (!trimmed || checking) return;

    let answerToSend = trimmed;

    // Numerical validation if answer_type is numeric
    if (currentPractice?.answer_type === 'numeric') {
      // Allow prefixes like "y = 6", "x = 4", "m = 3", "f(4) = 3"
      const prefixMatch = trimmed.match(/^(?:[a-zA-Z](?:\([^)]*\))?|[a-zA-Z])\s*=\s*(.+)$/);
      const cleanNum = prefixMatch ? prefixMatch[1].trim() : trimmed;

      if (isNaN(Number(cleanNum))) {
        setInputError(
          selectedTopic === 'multi_variable'
            ? 'Please enter a valid numeric value for y (e.g. 6 or y = 6)'
            : 'Please enter a valid number (e.g. 16 or 4)'
        );
        return;
      }
      // Send the clean numeric string so backend numeric equality checks succeed
      answerToSend = cleanNum;
    } else if (selectedTopic === 'inequalities') {
      // Validate inequality format
      const hasIneq =
        trimmed.includes('<') ||
        trimmed.includes('>') ||
        trimmed.includes('≤') ||
        trimmed.includes('≥');
      if (!hasIneq) {
        setInputError('Please enter an inequality statement (e.g. x ≤ 4 or x <= 4)');
        return;
      }
    }

    await submitAnswer(answerToSend);
  };

  const handleNext = () => {
    setAnswerInput('');
    setHintStage(0);
    setInputError(null);
    nextQuestion();
  };

  const handleTryAgain = () => {
    setAnswerInput('');
    setInputError(null);
    clearResult();
    const inputEl = document.getElementById('practice-answer-input');
    if (inputEl) inputEl.focus();
  };

  const handleResetInput = () => {
    setAnswerInput('');
    setHintStage(0);
    setInputError(null);
    clearResult();
  };

  const activeTopicObj = TOPICS.find((t) => t.id === selectedTopic);
  const totalSolved = student?.correct_answers || 0;
  const totalAttempts = (student?.correct_answers || 0) + (student?.incorrect_answers || 0);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 space-y-6 sm:space-y-8">
      {/* ════════════════════════════════════════════════════════════
       *  ARENA EDITORIAL HEADER
       * ════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#E8C97A] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#F5E3B3]" />
            Algorithmic Practice & Discovery
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#FFFDF7] drop-shadow-[0_4px_22px_rgba(0,0,0,0.65)]">
            Practice Arena
          </h1>
          <p className="text-xs sm:text-sm text-[#E2DFD4]">
            Build mathematical intuition with synchronized visualizers, step elimination, and instant verified feedback.
          </p>
        </div>

        {/* Honest Session Progress & Tier */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-xs font-medium text-[#E3DFD3]">
              {totalAttempts > 0
                ? `${totalSolved} solved of ${totalAttempts} attempts`
                : 'No attempts yet'}
            </p>
            <div className="flex items-center justify-end gap-1.5 mt-1.5">
              {[0, 1, 2, 3, 4].map((dot) => {
                const filled = dot < Math.min(5, totalSolved);
                return (
                  <span
                    key={dot}
                    className={`h-2 rounded-full transition-all ${
                      filled
                        ? 'w-5 bg-gradient-to-r from-[#52B788] to-[#E8C97A]'
                        : 'w-2 bg-white/20'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <Badge
            variant={
              studentLevel === 'Advanced'
                ? 'forest'
                : studentLevel === 'Intermediate'
                ? 'amber'
                : 'sage'
            }
            size="md"
          >
            <Award className="w-3.5 h-3.5 mr-1 text-[#F5E3B3]" />
            {studentLevel}
          </Badge>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
       *  RESPONSIVE TOPIC NAVIGATION (Clean Wrap, No Horizontal Scrollbar)
       * ════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {TOPICS.map((t) => {
          const isSelected = selectedTopic === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTopicChange(t.id)}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border backdrop-blur-md flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-gradient-to-r from-[#17422E] to-[#0E2C1F] text-[#F8EAC4] border-[#E8C97A]/65 shadow-[0_0_18px_rgba(232,201,122,0.22)] font-semibold scale-[1.02]'
                  : 'bg-[#071810]/75 border-white/10 text-[#CFCBC0] hover:text-[#FFFDF7] hover:border-[#E8C97A]/35 hover:bg-[#0E281C]/80'
              }`}
            >
              {t.tool === 'scale' && <Scale className="w-3 h-3 text-[#E8C97A]" />}
              {t.tool === 'multivar' && <Scale className="w-3 h-3 text-[#F5E3B3]" />}
              {t.tool === 'numberline' && <Hash className="w-3 h-3 text-[#74C69D]" />}
              {t.tool === 'graph' && <LineChart className="w-3 h-3 text-[#52B788]" />}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#E07A5F]/18 border border-[#EB9A85]/45 flex items-center gap-3 text-sm text-[#EB9A85] backdrop-blur-xl">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPractice(selectedTopic)}
            className="ml-auto"
          >
            Retry
          </Button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
       *  TRANSLUCENT STUDY HALL ARENA STAGE
       *  Interactive Visual LEFT · Active Challenge & Tight Input RIGHT
       * ════════════════════════════════════════════════════════════ */}
      <div
        id="practice-arena-stage"
        className="rounded-3xl bg-[#071B12]/78 backdrop-blur-2xl border border-[#E8C97A]/22 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.75)] p-5 sm:p-7 relative overflow-hidden scroll-mt-28 sm:scroll-mt-32"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-start relative z-10">
          {/* LEFT COLUMN (7 cols): Mathematical Visualization Lab */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#133827]/90 border border-[#74C69D]/35 text-[11px] font-semibold text-[#B7E4C7]">
                <Sparkles className="w-3 h-3 text-[#F5E3B3]" />
                {activeTopicObj?.label || 'Algebra Practice'}
              </span>
              {currentPractice && (
                <span className="text-[11px] font-mono text-[#E8C97A]">
                  Problem #{currentPractice.id} · {currentPractice.level}
                </span>
              )}
            </div>

            {/* Dynamic Visualizer matching the active challenge precisely */}
            <div className="flex-1 flex flex-col justify-center">
              {parsedModel?.type === 'linear_equation' && (
                <EquationBalanceScale
                  equationLabel={parsedModel.rawEquation}
                  parsedModel={parsedModel}
                  targetX={parsedModel.targetX}
                  compact={true}
                />
              )}

              {parsedModel?.type === 'multi_variable' && (
                <MultiVariableVisualizer model={parsedModel} />
              )}

              {parsedModel?.type === 'inequality' && (
                <InequalityNumberLine
                  boundary={parsedModel.boundary}
                  operator={parsedModel.operator}
                  variableName={parsedModel.variable}
                  inequalityModel={parsedModel}
                />
              )}

              {parsedModel?.type === 'system' && (
                <CoordinateGrapher
                  systemModel={parsedModel}
                  label="System Intersection"
                />
              )}

              {parsedModel?.type === 'function_or_slope' && (
                <CoordinateGrapher
                  functionModel={parsedModel}
                  label={parsedModel.label}
                />
              )}

              {parsedModel?.type === 'concept_rule' && (
                <ConceptRuleVisualizer model={parsedModel} />
              )}

              {!parsedModel && !loading && (
                <div className="p-8 rounded-2xl bg-[#05140D]/65 border border-[#E8C97A]/16 text-sm text-[#E3DFD3] flex flex-col items-center justify-center text-center gap-3 min-h-[260px]">
                  <Scale className="w-8 h-8 text-[#E8C97A]" />
                  <p className="font-editorial text-xl text-[#FFFDF7]">
                    Ready to Practice
                  </p>
                  <p className="text-xs text-[#C6C3B7] max-w-sm leading-relaxed">
                    Select a topic above or load a challenge to begin dynamic mathematical exploration.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (5 cols): Compact, Tightly Integrated Challenge Experience */}
          <div className="lg:col-span-5 lg:border-l lg:border-[#E8C97A]/16 lg:pl-7 flex flex-col space-y-4">
            {loading ? (
              <div className="space-y-4 py-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-10 w-2/3" />
              </div>
            ) : currentPractice ? (
              <>
                {/* A. Active Challenge Header */}
                <div className="space-y-2 pb-3 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#E8C97A] flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#F5E3B3]" />
                      Active Challenge
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 border border-white/10 text-[#CFCBC0]">
                        {currentPractice.answer_type === 'numeric' ? 'Numeric Value' : 'Expression'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#163D2B] border border-[#52B788]/40 text-[#A7E4C4]">
                        {currentPractice.level}
                      </span>
                    </div>
                  </div>

                  <div className="text-lg sm:text-xl font-semibold text-[#FFFDF7] leading-relaxed pt-1">
                    <MathRenderer content={currentPractice.question} />
                  </div>
                </div>

                {/* B. Collapsible Progressive Hint Area */}
                {currentPractice.hint && (
                  <div className="rounded-xl border border-[#E8C97A]/28 bg-[#05140D]/90 overflow-hidden shadow-sm transition-all">
                    <button
                      type="button"
                      onClick={() => setHintStage((prev) => (prev === 0 ? 1 : 0))}
                      className="w-full p-3 text-left flex items-center justify-between gap-2 text-xs font-semibold text-[#F5E3B3] hover:text-[#FFFDF7] cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-[#E8C97A]" />
                        <span>Need a Hint?</span>
                      </span>
                      {hintStage > 0 ? (
                        <ChevronUp className="w-4 h-4 text-[#E8C97A]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#E8C97A]" />
                      )}
                    </button>

                    {hintStage > 0 && (
                      <div className="p-3.5 pt-0 space-y-2.5 text-xs text-[#E3DFD3] border-t border-white/8">
                        {/* Stage 1: Conceptual Guidance */}
                        <div className="p-2.5 rounded-lg bg-[#0E281C]/80 border border-[#52B788]/25 text-[#B7E4C7]">
                          <strong className="text-[#FFFDF7] block mb-0.5">Conceptual Strategy:</strong>
                          Isolate the unknown term by applying inverse operations. Keep the scale balanced by performing every action symmetrically.
                        </div>

                        {/* Stage 2: Direct Problem Hint */}
                        {hintStage === 1 ? (
                          <button
                            type="button"
                            onClick={() => setHintStage(2)}
                            className="text-[11px] font-semibold text-[#E8C97A] hover:text-[#FFFDF7] underline decoration-dotted cursor-pointer flex items-center gap-1"
                          >
                            <span>Reveal specific problem clue →</span>
                          </button>
                        ) : (
                          <div className="p-2.5 rounded-lg bg-[#1F190B]/90 border border-[#E8C97A]/40 text-[#F5E3B3]">
                            <strong className="text-[#FFFDF7] block mb-0.5">Specific Clue:</strong>
                            {currentPractice.hint}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* C. Solution Input & Verify Action Tightly Grouped Together */}
                <form id="practice-answer-form" onSubmit={handleSubmit} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="practice-answer-input" className="text-xs font-semibold text-[#E2DFD4] block">
                      Your Solution
                    </label>
                    {answerInput && !lastResult && (
                      <button
                        type="button"
                        onClick={handleResetInput}
                        className="text-[11px] text-[#A6A49C] hover:text-[#FFFDF7] cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-stretch gap-2">
                    <div className="relative flex-1">
                      <input
                        id="practice-answer-input"
                        type="text"
                        value={answerInput}
                        onChange={(e) => {
                          setAnswerInput(e.target.value);
                          setInputError(null);
                        }}
                        placeholder={contextualPlaceholder}
                        disabled={checking || !!lastResult}
                        className="w-full rounded-xl border border-[#E8C97A]/28 bg-[#040F0A]/75 px-3.5 py-3 text-sm text-[#FFFDF7] placeholder:text-[#8E8C82] focus:border-[#74C69D] focus:outline-none focus:ring-2 focus:ring-[#52B788]/25 transition-all font-mono"
                      />
                    </div>

                    {!lastResult && (
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={!answerInput.trim() || checking}
                        isLoading={checking}
                        className="shrink-0"
                        rightIcon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Verify Answer
                      </Button>
                    )}
                  </div>

                  {inputError && (
                    <p className="text-xs text-[#EB9A85] flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{inputError}</span>
                    </p>
                  )}
                </form>

                {/* D. Submitted-Answer Feedback & Action Controls directly below input */}
                {lastResult && (
                  <div className="space-y-3 pt-1">
                    {lastResult.result === 'correct' ? (
                      <div className="p-4 rounded-xl bg-[#52B788]/18 border border-[#74C69D]/55 space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-sm text-[#B7F4D0]">
                          <CheckCircle2 className="w-5 h-5 text-[#74F0B0]" />
                          <span>Exact Match! Outstanding work.</span>
                        </div>
                        <p className="text-xs text-[#E3DFD3] leading-relaxed">
                          Verified answer: <strong className="font-mono text-[#F5E3B3]">{answerInput}</strong>.
                          Mathematical equilibrium confirmed across both sides.
                        </p>
                      </div>
                    ) : lastResult.result === 'unparseable' ? (
                      <div className="p-4 rounded-xl bg-[#E8C97A]/15 border border-[#E8C97A]/45 space-y-1.5">
                        <div className="flex items-center gap-2 font-semibold text-sm text-[#F5E3B3]">
                          <AlertCircle className="w-5 h-5" />
                          <span>Unrecognized Format</span>
                        </div>
                        <p className="text-xs text-[#E3DFD3]">
                          {lastResult.message || 'Please enter a clear numeric value or inequality statement.'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-[#E07A5F]/18 border border-[#EB9A85]/50 space-y-2.5">
                        <div className="flex items-center gap-2 font-semibold text-sm text-[#EB9A85]">
                          <XCircle className="w-5 h-5 text-[#E07A5F]" />
                          <span>Not quite yet</span>
                        </div>
                        <p className="text-xs text-[#E3DFD3]">
                          You entered: <span className="font-mono text-[#EB9A85]">{answerInput}</span>.
                          Inspect the guided step derivation on the left to verify inverse operations.
                        </p>
                        {lastResult.expected !== undefined && (
                          <div className="p-2.5 rounded-lg bg-black/45 border border-white/10 text-xs flex items-center justify-between">
                            <span className="text-[#A8A69B]">Expected:</span>
                            <strong className="font-mono text-[#F5E3B3]">
                              {Array.isArray(lastResult.expected)
                                ? lastResult.expected.join(' or ')
                                : String(lastResult.expected)}
                            </strong>
                          </div>
                        )}
                      </div>
                    )}

                    {lastResult.level_changed && (
                      <div className="p-3 rounded-xl bg-[#52B788]/18 border border-[#52B788]/40 flex items-center gap-2 text-xs text-[#FFFDF7]">
                        <Zap className="w-4 h-4 text-[#F5E3B3] shrink-0" />
                        <span>{lastResult.level_changed}</span>
                      </div>
                    )}

                    {/* Integrated Action Buttons right below feedback */}
                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      {lastResult.result !== 'correct' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="md"
                          onClick={handleTryAgain}
                          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        >
                          Try Again
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="gold"
                        size="md"
                        onClick={handleNext}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        Next Challenge
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-4">
                <p className="font-editorial text-xl text-[#FFFDF7]">
                  Practice Engine Ready
                </p>
                <p className="text-xs sm:text-sm text-[#D6D3C7] max-w-xs leading-relaxed">
                  Select any algebraic domain above to load a live adaptive challenge.
                </p>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => fetchPractice(selectedTopic)}
                >
                  Load Challenge
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Practice;