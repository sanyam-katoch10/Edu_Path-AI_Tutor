import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Flame,
  ArrowRight,
  CheckCircle2,
  Compass,
  Play,
  Lock,
  Sparkles,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useSession } from '../stores/sessionStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressRing } from '../components/ui/ProgressRing';
import type { JourneyTopicNode, TopicStatus } from '../components/three/JourneyWorld';
import JourneyWorld from '../components/three/JourneyWorld';

// 11 authentic Algebra 1 topic groups ascending toward the summit synthesis citadel
const ISLAND_NODES: JourneyTopicNode[] = [
  { id: 'foundations', title: 'Foundations & Real Numbers', shortTitle: 'Foundations', stage: '01', desc: 'Real number properties, absolute values, fractions, and order of operations' },
  { id: 'linear_equations', title: 'Linear Equations', shortTitle: 'Linear Equations', stage: '02', desc: 'Inverse operations, single-variable balancing, and algebraic isolation' },
  { id: 'multi_variable', title: 'Equations with Variables', shortTitle: 'Multi-Variable', stage: '03', desc: 'Distributive property, combining like terms, and variable relocation' },
  { id: 'equation_behavior', title: 'Identities & Contradictions', shortTitle: 'Equation Behavior', stage: '04', desc: 'No solution vs infinite solutions logical classification' },
  { id: 'inequalities', title: 'Linear Inequalities', shortTitle: 'Inequalities', stage: '05', desc: 'Ray graphs, boundary conditions, and sign reversal across division' },
  { id: 'functions', title: 'Functions & Graphs', shortTitle: 'Functions', stage: '06', desc: 'Domain, range, function notation, and Cartesian plane coordinate mapping' },
  { id: 'slope', title: 'Slope & Linear Forms', shortTitle: 'Slope & Forms', stage: '07', desc: 'Rate of change, slope-intercept, point-slope, and standard linear forms' },
  { id: 'systems', title: 'Systems of Equations', shortTitle: 'Systems', stage: '08', desc: 'Linear combinations, substitution, elimination, and unique intersection points' },
  { id: 'exponents', title: 'Exponents & Scientific Notation', shortTitle: 'Exponents', stage: '09', desc: 'Product, quotient, and power rules, negative indices, and magnitude modeling' },
  { id: 'polynomials', title: 'Polynomials & Factoring', shortTitle: 'Polynomials', stage: '10', desc: 'Trinomial factoring, difference of squares, greatest common factor, and grouping' },
  { id: 'general_algebra', title: 'Algebraic Synthesis Citadel', shortTitle: 'Synthesis', stage: '11', desc: 'Holistic algebraic modeling, cross-domain synthesis, and real-world problem solving' },
];

/**
 * Canonical Stage Status Resolver:
 * Ensures 100% consistent status calculation across 3D milestones, stepper dock,
 * selected-stage inspector, domain cards, and mobile view.
 */
interface StageStatusInfo {
  type: TopicStatus;
  badgeLabel: string;
  dotColor: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

function getStageStatus(
  nodeId: string,
  idx: number,
  topicsCovered: string[],
  currentIdx: number,
  hasAttempts: boolean
): StageStatusInfo {
  if (topicsCovered.includes(nodeId)) {
    return {
      type: 'completed',
      badgeLabel: 'Completed',
      dotColor: 'bg-[#74F0B0]',
      bgColor: 'bg-[#52B788]/20',
      borderColor: 'border-[#74C69D]/50',
      textColor: 'text-[#B7F4D0]',
    };
  }

  if (idx === currentIdx) {
    const label = hasAttempts ? 'In Progress' : 'Available';
    return {
      type: 'in-progress',
      badgeLabel: label,
      dotColor: 'bg-[#F8EAC4]',
      bgColor: 'bg-[#E8C97A]/20',
      borderColor: 'border-[#E8C97A]/55',
      textColor: 'text-[#F8EAC4]',
    };
  }

  return {
    type: 'upcoming',
    badgeLabel: 'Upcoming',
    dotColor: 'bg-[#648473]',
    bgColor: 'bg-white/5',
    borderColor: 'border-white/15',
    textColor: 'text-[#C6C3B7]',
  };
}

export const Progress: React.FC = () => {
  const navigate = useNavigate();
  const { student } = useSession();

  const totalAnswered = (student?.correct_answers || 0) + (student?.incorrect_answers || 0);
  const hasAttempts = totalAnswered > 0;
  const accuracy = hasAttempts ? student?.accuracy || 0 : 0;
  const level = student?.level || 'Beginner';
  const history = student?.history || [];
  const observations = student?.observations || [];

  // Strictly truthful: zero completed topics when there are no recorded attempts
  const topicsCovered = useMemo(
    () => (hasAttempts ? student?.topics_covered || [] : []),
    [hasAttempts, student?.topics_covered]
  );

  const firstUncompletedIdx = ISLAND_NODES.findIndex(
    (node) => !topicsCovered.includes(node.id)
  );
  const currentIdx = firstUncompletedIdx === -1 ? ISLAND_NODES.length - 1 : firstUncompletedIdx;

  const topicStatuses = useMemo<Record<string, TopicStatus>>(() => {
    const map: Record<string, TopicStatus> = {};
    ISLAND_NODES.forEach((node, idx) => {
      map[node.id] = getStageStatus(node.id, idx, topicsCovered, currentIdx, hasAttempts).type;
    });
    return map;
  }, [topicsCovered, currentIdx, hasAttempts]);

  const [selectedIdx, setSelectedIdx] = useState<number>(currentIdx);
  const [resetSignal, setResetSignal] = useState<number>(0);
  const [scrollVeil, setScrollVeil] = useState<number>(0);
  const [hide3DLabels, setHide3DLabels] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const selectedNode = ISLAND_NODES[selectedIdx] || ISLAND_NODES[currentIdx];
  const selectedStatusInfo = useMemo(
    () => getStageStatus(selectedNode.id, selectedIdx, topicsCovered, currentIdx, hasAttempts),
    [selectedNode.id, selectedIdx, topicsCovered, currentIdx, hasAttempts]
  );

  // Passive scroll listener for smooth environmental readability veil & hiding 3D labels
  useEffect(() => {
    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const y = window.scrollY;
        // Hide floating 3D milestone labels when user scrolls below the 3D vista into content
        setHide3DLabels(y > 140);
        const progress = Math.min(1, Math.max(0, y / 540));
        setScrollVeil(progress);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const handleSelectStage = (idx: number, scrollIntoInspector = false) => {
    setSelectedIdx(idx);
    if (scrollIntoInspector) {
      const el = document.getElementById('selected-stage-inspector');
      if (el) {
        const rect = el.getBoundingClientRect();
        // If out of comfortable viewport framing, scroll with generous navbar clearance
        if (rect.top < 110 || rect.top > window.innerHeight - 150) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  const handleMilestoneClick = (topicId: string) => {
    const idx = ISLAND_NODES.findIndex((n) => n.id === topicId);
    if (idx !== -1) handleSelectStage(idx, false);
  };

  const handleResetCamera = () => {
    setResetSignal((n) => n + 1);
    setSelectedIdx(currentIdx);
  };

  // Honest status label — never claims mastery with 0 attempts
  const statusHeadline = !hasAttempts
    ? 'No Attempts Yet'
    : student?.support_needed
    ? 'Scaffolding Recommended'
    : accuracy >= 75
    ? 'Strong Progress'
    : 'Building Fluency';

  // Helper renderer for each stepper button in the 2-row layout
  const renderStepperButton = (node: JourneyTopicNode, idx: number) => {
    const statusInfo = getStageStatus(node.id, idx, topicsCovered, currentIdx, hasAttempts);
    const isSelected = selectedIdx === idx;
    return (
      <button
        key={node.id}
        type="button"
        role="tab"
        aria-selected={isSelected}
        onClick={() => handleSelectStage(idx, false)}
        className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-2 w-full justify-start ${
          isSelected
            ? 'bg-[#17422E] border-[#F8EAC4] text-[#FFFDF7] shadow-[0_0_16px_rgba(232,201,122,0.32)] ring-1 ring-[#F8EAC4] scale-[1.01]'
            : statusInfo.type === 'completed'
            ? 'bg-[#0C2B1D]/90 border-[#74C69D]/45 text-[#C7F5DC] hover:border-[#74C69D]'
            : statusInfo.type === 'in-progress'
            ? 'bg-[#153525]/90 border-[#E8C97A]/55 text-[#F8EAC4] hover:border-[#F8EAC4]'
            : 'bg-[#081A12]/80 border-white/10 text-[#B7B4A8] hover:border-[#E8C97A]/40 hover:text-[#FFFDF7]'
        }`}
      >
        {statusInfo.type === 'completed' ? (
          <Check className="w-3.5 h-3.5 text-[#74F0B0] stroke-[3] shrink-0" />
        ) : (
          <span className={`w-2 h-2 rounded-full shrink-0 ${statusInfo.dotColor}`} />
        )}
        <span className="font-mono text-[11px] font-bold text-[#E8C97A] shrink-0">{node.stage}</span>
        <span className="truncate text-left">{node.shortTitle}</span>
      </button>
    );
  };

  return (
    <div className="relative w-full min-h-screen">
      {/* ════════════════════════════════════════════════════════════
       *  CONTINUOUS FULL-ROUTE FIXED 3D LEARNING JOURNEY ENVIRONMENT
       *  Persistent across the entire scrollable Journey page
       * ════════════════════════════════════════════════════════════ */}
      {isDesktop && (
        <div className="hidden md:block fixed inset-0 z-0 w-screen h-screen bg-[#03120B]">
          <JourneyWorld
            topics={ISLAND_NODES}
            topicStatuses={topicStatuses}
            currentLevel={level}
            selectedTopic={selectedNode.id}
            onMilestoneClick={handleMilestoneClick}
            resetSignal={resetSignal}
            hideLabels={hide3DLabels}
          />

          {/* Soft upper atmospheric readability veil for pristine navbar & header legibility */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[44%]"
            style={{
              background:
                'radial-gradient(130% 70% at 50% 0%, rgba(3,18,11,0.68) 0%, rgba(3,18,11,0.24) 55%, transparent 100%)',
            }}
          />

          {/* Dynamic environmental darkness that deepens slightly as you scroll into history & stats */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              background:
                'linear-gradient(180deg, rgba(3,18,11,0.18) 0%, rgba(3,18,11,0.68) 40%, rgba(3,18,11,0.95) 100%)',
              opacity: 0.32 + scrollVeil * 0.62,
            }}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
       *  ACCESSIBLE HTML CONTENT LAYER (Scrolls Above 3D Canvas)
       *  Uses natural top padding from PageShell with generous clearance
       * ════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 space-y-8 sm:space-y-10 pb-20">
        {/* ── Redesigned Top Information Area (Airy Editorial HUD with Soft Readability Gradient) ── */}
        <header className="relative w-full">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            {/* Left side: hierarchy as specified */}
            <div className="space-y-1.5 max-w-xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#E8C97A] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                <Sparkles className="w-3.5 h-3.5 text-[#F5E3B3]" />
                Enchanted Learning Archipelago
              </span>
              <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#FFFDF7] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.92)]">
                Learning Journey
              </h1>
              <p className="text-xs sm:text-sm text-[#E6E2D6] leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
                Your personalized ascent across 11 Algebra 1 floating realms — every illuminated island directly reflects verified practice attempts.
              </p>
            </div>

            {/* Right side: dedicated controls & status cluster with helper badge safely below navigation */}
            <div className="flex flex-col items-start md:items-end gap-2.5 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap md:justify-end">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#071A11]/85 border border-[#E8C97A]/28 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                  <Award className="w-3.5 h-3.5 text-[#F5E3B3]" />
                  <span className="text-xs font-medium text-[#FFFDF7]">Level: {level}</span>
                </div>

                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#071A11]/85 border border-[#E8C97A]/24 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                  <span className="text-xs font-medium text-[#E3DFD3]">
                    {topicsCovered.length} / {ISLAND_NODES.length} explored
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleResetCamera}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-[#F5E3B3] bg-[#071A11]/85 hover:bg-[#0E2E20] active:scale-95 border border-[#E8C97A]/35 backdrop-blur-md transition-all cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-2 focus:ring-[#E8C97A]"
                  title="Reset camera view to full archipelago overview"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#E8C97A]" />
                  <span>Reset View</span>
                </button>
              </div>

              {/* Helper badge placed cleanly below the navigation & toolbar */}
              <div className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#05140D]/85 backdrop-blur-md border border-[#E8C97A]/24 text-[11px] text-[#D8D4C7] shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8C97A] animate-pulse" />
                <span>Interactive 3D Archipelago · Click any beacon or select a stage below</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Dedicated 3D Viewing Vista Zone (Unobstructed Desktop Window) ── */}
        <div className="hidden md:block h-[320px] lg:h-[360px] pointer-events-none" />

        {/* ── Interactive Selected-Milestone Showcase & Stepper Dock ── */}
        <section
          id="selected-stage-inspector"
          className="scroll-mt-32 sm:scroll-mt-36 lg:scroll-mt-40 glass-panel rounded-3xl p-5 sm:p-6 bg-[#05140D]/85 backdrop-blur-xl border border-[#E8C97A]/26 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.75)] space-y-5"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8C97A]">
                  Stage {selectedNode.stage} of {ISLAND_NODES.length}
                </span>
                <span
                  className={`text-[11px] font-semibold px-3 py-0.5 rounded-full border flex items-center gap-1.5 ${selectedStatusInfo.bgColor} ${selectedStatusInfo.borderColor} ${selectedStatusInfo.textColor}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedStatusInfo.dotColor}`} />
                  {selectedStatusInfo.badgeLabel}
                </span>
              </div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#FFFDF7]">
                {selectedNode.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#D8D4C7] max-w-2xl leading-relaxed">
                {selectedNode.desc}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="gold"
                size="md"
                onClick={() => navigate(`/practice?topic=${selectedNode.id}`)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shadow-[0_4px_20px_rgba(232,201,122,0.25)]"
              >
                {selectedStatusInfo.type === 'completed' ? 'Review Topic in Arena' : 'Practice This Stage'}
              </Button>
            </div>
          </div>

          {/* 11-Stage Stepper Dock — Clean 2-Row Layout, No Native Scrollbars */}
          <div className="pt-4 border-t border-[#E8C97A]/16 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#B7B4A8]">
              <span className="font-medium text-[#E8C97A] uppercase tracking-wider text-[11px]">
                Curriculum Progression Stepper
              </span>
              <div className="hidden sm:flex items-center gap-4 text-[11px]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#74F0B0]" />
                  Completed ({topicsCovered.length})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F8EAC4]" />
                  {hasAttempts ? 'In Progress' : 'Available'} (1)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#648473]" />
                  Upcoming ({Math.max(0, ISLAND_NODES.length - topicsCovered.length - 1)})
                </span>
              </div>
            </div>

            {/* Desktop 2-Row Stepper Layout (No horizontal scrollbars, 100% accessible) */}
            <div className="hidden md:block space-y-2">
              {/* Row 1: Stages 01 to 06 */}
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                {ISLAND_NODES.slice(0, 6).map((node, sliceIdx) => renderStepperButton(node, sliceIdx))}
              </div>
              {/* Row 2: Stages 07 to 11 */}
              <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
                {ISLAND_NODES.slice(6, 11).map((node, sliceIdx) => renderStepperButton(node, sliceIdx + 6))}
              </div>
            </div>

            {/* Mobile Responsive Wrapping Grid (Touch friendly, no native scrollbars) */}
            <div className="grid md:hidden grid-cols-2 gap-2">
              {ISLAND_NODES.map((node, idx) => renderStepperButton(node, idx))}
            </div>
          </div>
        </section>

        {/* ── Mobile Scenic List View (Shown on screens < 768px where WebGL canvas is hidden) ── */}
        <section className="md:hidden glass-panel rounded-3xl p-5 bg-[#05140D]/95 border border-[#E8C97A]/25 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#E8C97A]">
              11 Floating Realms
            </span>
            <span className="text-xs text-[#A8A69B]">
              {topicsCovered.length} of 11 Completed
            </span>
          </div>

          <div className="space-y-2.5">
            {ISLAND_NODES.map((node, idx) => {
              const statusInfo = getStageStatus(node.id, idx, topicsCovered, currentIdx, hasAttempts);
              const isSelected = selectedIdx === idx;
              return (
                <div
                  key={node.id}
                  onClick={() => handleSelectStage(idx, true)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#17422E] border-[#F8EAC4] shadow-[0_0_14px_rgba(232,201,122,0.25)]'
                      : statusInfo.type === 'completed'
                      ? 'bg-[#0E2E20]/90 border-[#74C69D]/45'
                      : statusInfo.type === 'in-progress'
                      ? 'bg-[#143928]/90 border-[#E8C97A]/55'
                      : 'bg-[#081A12]/80 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        statusInfo.type === 'completed'
                          ? 'bg-[#52B788] text-[#05120B]'
                          : statusInfo.type === 'in-progress'
                          ? 'bg-[#E8C97A] text-[#05120B]'
                          : 'bg-white/10 text-[#A8A69B]'
                      }`}
                    >
                      {statusInfo.type === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : statusInfo.type === 'in-progress' ? (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono text-[#E8C97A]">Realm {node.stage}</p>
                      <p className="text-xs sm:text-sm font-semibold text-[#FFFDF7] truncate">
                        {node.title}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold shrink-0 ${statusInfo.textColor}`}>
                    {statusInfo.badgeLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Mastery & Progress Summary Strip ── */}
        <section className="glass-panel rounded-3xl p-6 sm:p-7 bg-[#05140D]/90 backdrop-blur-xl border border-[#E8C97A]/24 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.65)]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 flex items-center gap-5">
              <ProgressRing
                progress={accuracy}
                size={104}
                strokeWidth={8}
                label={hasAttempts ? `${Math.round(accuracy)}%` : '—'}
                sublabel={hasAttempts ? 'Accuracy' : 'No Data'}
                color="#74C69D"
              />
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#E8C97A]">
                  Session Mastery Status
                </span>
                <h2 className="font-editorial text-2xl font-semibold text-[#FFFDF7] mt-0.5">
                  {statusHeadline}
                </h2>
                <p className="text-xs text-[#C6C3B7] mt-1 leading-relaxed">
                  {hasAttempts
                    ? `${student?.correct_answers || 0} correct out of ${totalAnswered} recorded challenges`
                    : 'Solve problems in the Practice Arena to establish your verified learning baseline.'}
                </p>
              </div>
            </div>

            <div className="md:col-span-7 grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#05130C]/80 border border-[#E8C97A]/18 text-center backdrop-blur-md">
                <span className="text-[11px] text-[#A8A69B] block">Current Streak</span>
                <span className="text-xl font-bold text-[#E07A5F] flex items-center justify-center gap-1.5 mt-1">
                  <Flame className="w-4 h-4 fill-current" />
                  {student?.consecutive_correct || 0}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#05130C]/80 border border-[#E8C97A]/18 text-center backdrop-blur-md">
                <span className="text-[11px] text-[#A8A69B] block">Domains Explored</span>
                <span className="text-xl font-bold text-[#FFFDF7] mt-1 block">
                  {topicsCovered.length}{' '}
                  <span className="text-xs text-[#A8A69B]">/ {ISLAND_NODES.length}</span>
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#05130C]/80 border border-[#E8C97A]/18 text-center backdrop-blur-md">
                <span className="text-[11px] text-[#A8A69B] block">Active Tier</span>
                <span className="text-base font-semibold text-[#F5E3B3] mt-1.5 block">
                  {level}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 11 Learning Domains Overview Grid (Comprehensive Curriculum Map) ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#FFFDF7]">
              Algebra 1 Domains ({ISLAND_NODES.length})
            </h2>
            <span className="text-xs text-[#C6C3B7]">
              Click any domain to focus the 3D realm
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ISLAND_NODES.map((node, idx) => {
              const statusInfo = getStageStatus(node.id, idx, topicsCovered, currentIdx, hasAttempts);
              const isSelected = selectedIdx === idx;
              return (
                <div
                  key={node.id}
                  onClick={() => handleSelectStage(idx, true)}
                  className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#0E2E20]/95 border-[#F8EAC4] shadow-[0_0_20px_rgba(232,201,122,0.22)] ring-1 ring-[#F8EAC4]'
                      : 'bg-[#05140D]/85 hover:bg-[#081F14]/90 border-[#E8C97A]/20 hover:border-[#E8C97A]/40'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#E8C97A]">
                        STAGE {node.stage}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.bgColor} ${statusInfo.borderColor} ${statusInfo.textColor}`}
                      >
                        {statusInfo.badgeLabel}
                      </span>
                    </div>
                    <h3 className="font-editorial text-lg font-semibold text-[#FFFDF7] leading-snug">
                      {node.title}
                    </h3>
                    <p className="text-xs text-[#C6C3B7] line-clamp-2 leading-relaxed">
                      {node.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/8 flex items-center justify-between text-xs text-[#E8C97A]">
                    <span className="hover:underline flex items-center gap-1 font-medium">
                      Focus Island
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Pedagogical Observations (Only when recorded) ── */}
        {observations.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#FFFDF7]">
              Recorded Pedagogical Observations ({observations.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {observations.map((obs, idx) => (
                <div
                  key={idx}
                  className="glass-panel p-5 rounded-2xl bg-[#05140D]/85 border-[#E8C97A]/26 space-y-2 text-xs sm:text-sm text-[#E3DFD3] backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between text-[#F5E3B3]">
                    <span className="font-semibold text-base capitalize">{obs.category}</span>
                    <Badge variant="amber" size="sm">
                      {obs.topic}
                    </Badge>
                  </div>
                  <p className="leading-relaxed text-[#D6D2C5]">{obs.note}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Recorded Learning History ── */}
        <section className="space-y-4 pb-12">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#FFFDF7]">
              Recorded Challenge History ({history.length})
            </h2>
          </div>

          {history.length === 0 ? (
            <div className="glass-panel py-12 px-6 text-center rounded-3xl bg-[#05140D]/85 border-[#E8C97A]/24 backdrop-blur-xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#133827] border border-[#E8C97A]/30 flex items-center justify-center mx-auto">
                <Compass className="w-6 h-6 text-[#F5E3B3]" />
              </div>
              <h3 className="font-editorial text-2xl font-semibold text-[#FFFDF7]">
                No challenges recorded yet
              </h3>
              <p className="text-xs sm:text-sm text-[#C6C3B7] max-w-md mx-auto leading-relaxed">
                Your archipelago remains in calm contemplation until you solve problems in the Practice Arena. Every verified answer updates this world live.
              </p>
              <Button
                variant="gold"
                size="md"
                onClick={() => navigate('/practice')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Start First Challenge
              </Button>
            </div>
          ) : (
            <div className="glass-panel rounded-3xl overflow-hidden bg-[#05140D]/85 border-[#E8C97A]/24 backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E8C97A]/18 text-[#C6C3B7]">
                      <th className="p-4 font-semibold">Problem</th>
                      <th className="p-4 font-semibold">Topic</th>
                      <th className="p-4 font-semibold">Level</th>
                      <th className="p-4 font-semibold">Answer</th>
                      <th className="p-4 font-semibold text-right">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {history.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.04] transition-colors">
                        <td className="p-4 font-medium text-[#FFFDF7] max-w-xs truncate">
                          {item.question}
                        </td>
                        <td className="p-4 text-[#C6C3B7] capitalize">
                          {item.topic.replace(/_/g, ' ')}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" size="sm">
                            {item.level}
                          </Badge>
                        </td>
                        <td className="p-4 font-mono text-[#F5E3B3]">{item.answer}</td>
                        <td className="p-4 text-right">
                          <Badge variant={item.correct ? 'forest' : 'coral'} size="sm">
                            {item.correct ? 'Correct' : 'Incorrect'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Progress;