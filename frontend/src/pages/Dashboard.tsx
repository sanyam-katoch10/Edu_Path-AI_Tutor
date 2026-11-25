import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  BrainCircuit,
  PenTool,
  Route as RouteIcon,
  BookOpen,
  CheckCircle2,
  Cpu,
  Compass,
  Scale,
  Play,
  Layers,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useSession } from '../stores/sessionStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SceneContainer } from '../components/three/SceneContainer';
import { FloatingBook } from '../components/three/FloatingBook';
import { MathRenderer } from '../components/ui/MathRenderer';
import { EquationBalanceScale } from '../components/visualizers/EquationBalanceScale';

/* ═══════════════════════════════════════════════════════════════
 *  DATA: 3 Pedagogical Calibration Tiers (Section 03)
 * ═══════════════════════════════════════════════════════════════ */
const LEVEL_PREVIEWS = {
  Beginner: {
    tierNum: '01',
    tierName: 'Foundational Intuition',
    badge: 'Tier I · Beginner',
    roman: 'I',
    headline: 'Core mechanics & single-step inverse operations',
    description:
      'Grounded in physical balance beam analogies, undoing operations in reverse sequence, and diagnosing root arithmetic misconceptions before cognitive overload occurs.',
    sampleEquation: '2x + 4 = 10 \\implies 2x = 6 \\implies x = 3',
    keyAxiom: 'Inverse operations cancel symmetrically across the equal sign.',
    features: [
      'Physical balance beam weight analogies',
      'Step-by-step arithmetic prompts',
      'Visual equality preservation checks',
    ],
  },
  Intermediate: {
    tierNum: '02',
    tierName: 'Compound Algebra',
    badge: 'Tier II · Intermediate',
    roman: 'II',
    headline: 'Distributive reasoning & multi-variable systems',
    description:
      'Challenges you with parenthesis expansion, collecting like terms across equal signs, rational coefficients, and simultaneous linear equation elimination.',
    sampleEquation: '3(x + 2) - 5 = 2x + 7 \\implies x = 6',
    keyAxiom: 'Distributive law expands area models into unified linear expressions.',
    features: [
      'Distributive property area drills',
      'Simultaneous 2-variable linear systems',
      'Fraction clearing & strategic shortcuts',
    ],
  },
  Advanced: {
    tierNum: '03',
    tierName: 'Abstract Synthesis',
    badge: 'Tier III · Advanced',
    roman: 'III',
    headline: 'Rational expressions & non-trivial behaviour',
    description:
      'Synthesizes algebraic modeling, special equation behavior (identities vs contradictions), and multi-step formal proof formulation across varied domains.',
    sampleEquation: '\\frac{2x - 3}{4} + \\frac{x + 1}{2} = 5 \\implies x = 5.25',
    keyAxiom: 'Logical classification distinguishes unique roots from empty and identity sets.',
    features: [
      'Contradiction (0 = 5) & identity (x = x) proofs',
      'Compound rational expression clearing',
      'Self-directed multi-step synthesis',
    ],
  },
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { student } = useSession();
  const [selectedLevel, setSelectedLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');

  const activeLevelData = LEVEL_PREVIEWS[selectedLevel];

  const scrollToLaboratory = () => {
    const el = document.getElementById('observatory-laboratory');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full flex flex-col space-y-28 sm:space-y-40 overflow-x-hidden">
      {/* ════════════════════════════════════════════════════════════
       *  SECTION 01 — HERO: THE GRAND ENTRANCE
       *  Cinematic depth · Untouched 3D FloatingBook · Refined surroundings
       * ════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[82vh] lg:min-h-[86vh] flex items-center px-4 sm:px-8 max-w-7xl mx-auto w-full">
        {/* Cinematic Atmospheric Light Corona behind 3D Tome */}
        <div
          className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full pointer-events-none -z-10"
          style={{
            background:
              'radial-gradient(circle, rgba(245, 217, 145, 0.18) 0%, rgba(82, 183, 136, 0.12) 44%, transparent 72%)',
            filter: 'blur(52px)',
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center w-full py-4">
          {/* Left Column: Editorial Display Typography (6 cols) */}
          <div className="lg:col-span-6 flex flex-col space-y-6 sm:space-y-8 z-10">
            {/* Minimal Eyebrow */}
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-[#081F15]/85 border border-[#74C69D]/30 backdrop-blur-xl">
              <Sparkles className="w-3.5 h-3.5 text-[#F5E3B3]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#D8F3DC]">
                The Emerald Observatory
              </span>
            </div>

            {/* Display Headline */}
            <h1 className="font-editorial text-5xl sm:text-6xl xl:text-[4.65rem] font-semibold text-[#FFFDF7] leading-[1.06] tracking-tight drop-shadow-[0_8px_30px_rgba(0,0,0,0.7)]">
              Learn differently.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFFDF7] via-[#F8EAC4] to-[#D4AF63]">
                Think deeper.
              </span>
            </h1>

            {/* Meaningful Pedagogical Description */}
            <p className="text-base sm:text-lg text-[#E3DFD3] max-w-lg leading-relaxed font-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
              An intelligent learning companion that adapts to your understanding — grounded in 23 knowledge sections across 6 OpenStax Algebra modules and powered by local private AI.
            </p>

            {/* Two Beautiful CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Button
                variant="gold"
                size="lg"
                onClick={() => navigate('/tutor')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Start Learning
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={scrollToLaboratory}
                leftIcon={<Play className="w-3.5 h-3.5 fill-current text-[#F5E3B3]" />}
              >
                Explore Observatory
              </Button>
            </div>

            {/* Quiet Academic Credibility Strip */}
            <div className="pt-6 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-[#C8C5B8] border-t border-[#E8C97A]/18 max-w-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#52B788] shadow-[0_0_8px_#52B788]" />
                <span>
                  Adaptive Level: <strong className="text-[#F5E3B3] font-semibold">{student?.level || 'Beginner'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#E8C97A]" />
                <span>Qwen3 4B + Nomic RAG</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#95D5B2]" />
                <span>23 Sections · 6 Modules</span>
              </div>
            </div>
          </div>

          {/* Right Column: Untouched 3D FloatingBook Centerpiece (6 cols) */}
          <div className="lg:col-span-6 h-[420px] sm:h-[520px] lg:h-[620px] w-full flex items-center justify-center relative">
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[76%] h-24 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse, rgba(232, 201, 122, 0.2) 0%, transparent 72%)',
                filter: 'blur(26px)',
              }}
            />
            <SceneContainer
              className="w-full h-full"
              minHeight="420px"
              cameraPosition={[0, 0.8, 5.5]}
              fov={38}
              enableTilt={true}
              fallbackTitle="OpenStax Algebra Core"
              fallbackSubtitle="3D Hardbound Mathematical Artifact"
            >
              <FloatingBook
                scale={1.0}
                floatingSpeed={1.0}
                floatingIntensity={0.35}
                coverColor="#1E5C42"
                pagesColor="#FCF7EB"
                ribbonColor="#2D8A5E"
                accentColor="#E8C97A"
                rotation={[0.16, -0.26, 0.04]}
                position={[0, 0.05, 0]}
              />
            </SceneContainer>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
       *  SECTION 02 — TACTILE MATHEMATICAL INTUITION
       *  Expansive Laboratory · Prominent Brass Scale · Sophisticated Layout
       * ════════════════════════════════════════════════════════════ */}
      <section
        id="observatory-laboratory"
        className="px-4 sm:px-8 max-w-7xl mx-auto w-full scroll-mt-28 sm:scroll-mt-32"
      >
        <div className="relative rounded-3xl p-6 sm:p-12 lg:p-14 bg-gradient-to-b from-[#0A261A]/92 via-[#061910]/95 to-[#030E07]/98 border border-[#E8C97A]/24 shadow-[0_28px_80px_-15px_rgba(0,0,0,0.85)] overflow-hidden space-y-10">
          {/* Subtle Ambient Radial Backlight */}
          <div
            className="absolute top-0 right-1/4 w-[600px] h-[350px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(82, 183, 136, 0.12) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />

          {/* Section Header Banner: Instrument Header & Theorem Callout */}
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E8C97A]/18">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#123825]/75 border border-[#74C69D]/30 text-[11px] font-mono text-[#D8F3DC]">
                <Scale className="w-3.5 h-3.5 text-[#E8C97A]" />
                <span>OBSERVATORY INSTRUMENT 01 · TACTILE INTUITION</span>
              </div>
              <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-[#FFFDF7] tracking-tight">
                Understand the why, not just the formula.
              </h2>
            </div>
            <p className="text-sm text-[#D0CDC0] max-w-md leading-relaxed">
              Equations become physical golden balance scales in dynamic equilibrium. Manipulate operations step by step below to experience the fundamental symmetry of algebra.
            </p>
          </div>

          {/* The Working Laboratory Stage */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Center/Left: The Prominent Balance Scale Component (8 cols) */}
            <div className="lg:col-span-8 rounded-2xl bg-[#030F08]/85 border border-[#E8C97A]/20 p-5 sm:p-7 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/8 text-xs text-[#A8A69B]">
                <span className="font-mono text-[#E8C97A] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#52B788] animate-pulse" />
                  Live Fulcrum Simulator
                </span>
                <span className="text-[#D8F3DC] font-mono">Governing Target: 2x + 4 = 10</span>
              </div>

              {/* Working Interactive Component */}
              <EquationBalanceScale
                equationLabel="2x + 4 = 10"
                initialLeftWeight={10}
                initialRightWeight={10}
                targetX={3}
                compact={false}
              />
            </div>

            {/* Right: Architectural Mechanics Ledger (4 cols) */}
            <div className="lg:col-span-4 flex flex-col space-y-4">
              <div className="p-5 rounded-2xl bg-[#061D12]/80 border border-[#E8C97A]/18 space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#E8C97A] block">
                  The Axiom of Equality
                </span>
                <h3 className="font-editorial text-lg font-semibold text-[#FFFDF7]">
                  Equilibrium is Preserved
                </h3>
                <p className="text-xs sm:text-sm text-[#C8C5B8] leading-relaxed">
                  Whatever transformation is applied to the left pan must be identically applied to the right pan. Subtraction cancels mass; division scales weight uniformly.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#04110A]/80 border border-white/8 space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#74C69D] block">
                  Step Progression Ledger
                </span>
                <div className="space-y-2 text-xs text-[#E3DFD3]">
                  <div className="p-2.5 rounded-lg bg-[#082215]/60 border border-white/5 flex items-center justify-between">
                    <span>1. Initial State</span>
                    <span className="font-mono text-[#F5E3B3]">2x + 4 = 10</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#082215]/60 border border-white/5 flex items-center justify-between">
                    <span>2. Subtract Constant (4)</span>
                    <span className="font-mono text-[#F5E3B3]">2x = 6</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0E3522]/80 border border-[#74C69D]/30 flex items-center justify-between font-semibold text-[#FFFDF7]">
                    <span>3. Divide by Coefficient (2)</span>
                    <span className="font-mono text-[#52B788]">x = 3</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="gold"
                  size="md"
                  onClick={() => navigate('/practice')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full justify-center"
                >
                  Explore Practice Arena
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
       *  SECTION 03 — ADAPTIVE DIFFICULTY CALIBRATION
       *  Editorial Progression Path · 3 Ascending Tiers · Distinct Composition
       * ════════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E8C97A]/18">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#74C69D] flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#E8C97A]" />
              Pedagogical Calibration · 3 Ascending Tiers
            </span>
            <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-[#FFFDF7] tracking-tight">
              Designed for your exact level of mastery.
            </h2>
          </div>
          <p className="text-sm text-[#D0CDC0] max-w-md leading-relaxed">
            EduPath continuously evaluates answer precision and reasoning latency, dynamically adjusting explanation depth across three distinct intellectual tiers.
          </p>
        </div>

        {/* The 3-Tier Stepped Progression Rail */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(['Beginner', 'Intermediate', 'Advanced'] as const).map((tierKey) => {
            const isSelected = selectedLevel === tierKey;
            const data = LEVEL_PREVIEWS[tierKey];

            return (
              <button
                key={tierKey}
                type="button"
                onClick={() => setSelectedLevel(tierKey)}
                className={`relative p-6 sm:p-7 rounded-3xl text-left transition-all duration-300 border cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#133A27]/95 via-[#0A2619]/95 to-[#05180F]/98 border-[#E8C97A]/50 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.8)] scale-[1.02]'
                    : 'bg-[#061810]/60 border-white/8 hover:bg-[#0A2418]/70 hover:border-[#E8C97A]/25'
                }`}
              >
                {/* Top indicator tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-7 h-7 rounded-full font-editorial font-bold text-xs flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#E8C97A] text-[#05120B]'
                          : 'bg-[#0C2B1C] text-[#E8C97A] border border-[#E8C97A]/30'
                      }`}
                    >
                      {data.roman}
                    </span>
                    <span className="text-xs font-mono text-[#E8C97A] uppercase tracking-wider">
                      {data.tierName}
                    </span>
                  </div>
                  <Badge variant={isSelected ? 'forest' : 'outline'} size="sm">
                    {tierKey}
                  </Badge>
                </div>

                <div className="space-y-2 mb-6">
                  <h3 className="font-editorial text-xl font-semibold text-[#FFFDF7] group-hover:text-[#F5E3B3] transition-colors">
                    {data.headline}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#C8C5B8] leading-relaxed line-clamp-3">
                    {data.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/8 flex items-center justify-between text-xs font-semibold">
                  <span className={isSelected ? 'text-[#F5E3B3]' : 'text-[#74C69D]'}>
                    {isSelected ? '● Active Calibration' : 'Select Tier'}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? 'text-[#E8C97A] translate-x-1' : 'text-[#A8A69B]'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Tier Editorial Showcase Tablet */}
        <div className="rounded-3xl bg-gradient-to-br from-[#082216]/90 via-[#05160E]/94 to-[#020A05]/98 border border-[#E8C97A]/22 p-6 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="amber" size="md">
                {activeLevelData.badge}
              </Badge>
              <span className="text-xs font-mono text-[#74C69D]">
                Representative Curriculum Scope
              </span>
            </div>

            <h3 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#FFFDF7]">
              {activeLevelData.headline}
            </h3>

            <p className="text-sm text-[#D0CDC0] leading-relaxed">
              {activeLevelData.description}
            </p>

            <div className="p-4 rounded-xl bg-[#030C07] border border-[#E8C97A]/18 space-y-1">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#A8A69B] block">
                Representative Equation Architecture
              </span>
              <div className="text-base sm:text-lg font-mono text-[#F5E3B3]">
                <MathRenderer content={`$$${activeLevelData.sampleEquation}$$`} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-2xl bg-[#071F14]/75 border border-[#E8C97A]/16 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#F5E3B3] block">
                Calibrated Pedagogical Features
              </span>
              <div className="space-y-2.5">
                {activeLevelData.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-[#E3DFD3]">
                    <CheckCircle2 className="w-4 h-4 text-[#52B788] shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/8 flex items-center justify-between">
              <span className="text-xs text-[#A8A69B]">
                Active Profile: <strong className="text-[#F5E3B3]">{student?.level || 'Beginner'}</strong>
              </span>
              <Button
                variant="gold"
                size="sm"
                onClick={() => navigate('/practice')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Practice {selectedLevel}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
       *  SECTION 04 — FOUR INTEGRATED LEARNING WORLDS
       *  Asymmetric Editorial Showcase · Distinctive Treatment for Each
       * ════════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E8C97A]/18">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#E8C97A] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#74C69D]" />
              The Observatory Domains
            </span>
            <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-[#FFFDF7] tracking-tight">
              Four Integrated Learning Worlds
            </h2>
          </div>
          <p className="text-sm text-[#D0CDC0] max-w-md leading-relaxed">
            Every room in the observatory shares your live student profile, diagnostic attempt history, and the 23 peer-reviewed OpenStax curriculum sections.
          </p>
        </div>

        {/* Asymmetrical 2x2 Editorial Mosaic */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* World 1: AI Studio (7 cols - Featured Deep Editorial) */}
          <div
            onClick={() => navigate('/tutor')}
            className="lg:col-span-7 rounded-3xl p-7 sm:p-9 bg-gradient-to-br from-[#0F3523]/92 via-[#092418]/94 to-[#04120B]/98 border border-[#74C69D]/35 hover:border-[#E8C97A]/60 shadow-[0_16px_45px_-10px_rgba(0,0,0,0.7)] transition-all duration-300 cursor-pointer group flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-[#174A32] border border-[#74C69D]/40 flex items-center justify-center text-[#74C69D] group-hover:scale-105 transition-transform">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono text-[#E8C97A] uppercase tracking-wider">
                  01 // Socratic Dialogue
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#FFFDF7] group-hover:text-[#F5E3B3] transition-colors">
                  AI Studio · The Reasoning Sanctum
                </h3>
                <p className="text-sm text-[#D0CDC0] leading-relaxed max-w-xl">
                  Converse in real time beside the 3D Learning Orb. Receive step-by-step mathematical derivations with KaTeX typesetting and inspectable OpenStax citations.
                </p>
              </div>

              {/* Editorial Specimen Motif */}
              <div className="p-4 rounded-xl bg-[#030D07]/80 border border-white/6 flex items-center justify-between text-xs text-[#E3DFD3]">
                <span className="font-mono text-[#74C69D]">Local Qwen3 4B Pedagogical Engine</span>
                <span className="text-[#A8A69B]">Zero Cloud Data Leakage</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/8 flex items-center justify-between text-xs font-semibold text-[#F5E3B3]">
              <span>Enter Socratic Studio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* World 2: Practice Arena (5 cols - Mechanics Atelier) */}
          <div
            onClick={() => navigate('/practice')}
            className="lg:col-span-5 rounded-3xl p-7 sm:p-9 bg-gradient-to-br from-[#0B2519]/88 via-[#061810]/92 to-[#030E08]/96 border border-[#E8C97A]/22 hover:border-[#E8C97A]/60 shadow-[0_16px_45px_-10px_rgba(0,0,0,0.7)] transition-all duration-300 cursor-pointer group flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-[#17422E] border border-[#E8C97A]/30 flex items-center justify-center text-[#F5E3B3] group-hover:scale-105 transition-transform">
                  <PenTool className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-[#74C69D] uppercase tracking-wider">
                  02 // Tactile Mechanics
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-editorial text-2xl font-semibold text-[#FFFDF7] group-hover:text-[#F5E3B3] transition-colors">
                  Practice Arena
                </h3>
                <p className="text-sm text-[#C8C5B8] leading-relaxed">
                  Interactive brass balance scales, Cartesian slope coordinate graphers, and instant algorithmic grading with deterministic feedback.
                </p>
              </div>

              {/* Mathematical Motif */}
              <div className="p-3.5 rounded-xl bg-[#030D07]/80 border border-white/6 text-center font-mono text-xs text-[#F5E3B3]">
                <MathRenderer content="$$\Delta W = 0 \iff \text{Fulcrum in Equilibrium}$$" />
              </div>
            </div>

            <div className="pt-4 border-t border-white/8 flex items-center justify-between text-xs font-semibold text-[#F5E3B3]">
              <span>Open Practice Arena</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* World 3: Learning Journey (5 cols - Celestial Trail) */}
          <div
            onClick={() => navigate('/progress')}
            className="lg:col-span-5 rounded-3xl p-7 sm:p-9 bg-gradient-to-br from-[#0B2519]/88 via-[#061810]/92 to-[#030E08]/96 border border-[#E8C97A]/22 hover:border-[#E8C97A]/60 shadow-[0_16px_45px_-10px_rgba(0,0,0,0.7)] transition-all duration-300 cursor-pointer group flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-[#17422E] border border-[#E8C97A]/30 flex items-center justify-center text-[#E8C97A] group-hover:scale-105 transition-transform">
                  <RouteIcon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-[#E8C97A] uppercase tracking-wider">
                  03 // Ascension Trail
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-editorial text-2xl font-semibold text-[#FFFDF7] group-hover:text-[#F5E3B3] transition-colors">
                  Learning Journey
                </h3>
                <p className="text-sm text-[#C8C5B8] leading-relaxed">
                  Trace your cognitive progression across 11 floating 3D curriculum islands ascending toward the summit algebraic synthesis citadel.
                </p>
              </div>

              {/* Milestone Count Motif */}
              <div className="p-3.5 rounded-xl bg-[#030D07]/80 border border-white/6 flex items-center justify-between text-xs text-[#E3DFD3]">
                <span>11 Connected Stages</span>
                <span className="font-mono text-[#74C69D]">01 Foundations → 11 Citadel</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/8 flex items-center justify-between text-xs font-semibold text-[#F5E3B3]">
              <span>View Ascension Map</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* World 4: Knowledge Library (7 cols - OpenStax Corpus) */}
          <div
            onClick={() => navigate('/library')}
            className="lg:col-span-7 rounded-3xl p-7 sm:p-9 bg-gradient-to-br from-[#0F3523]/92 via-[#092418]/94 to-[#04120B]/98 border border-[#74C69D]/35 hover:border-[#E8C97A]/60 shadow-[0_16px_45px_-10px_rgba(0,0,0,0.7)] transition-all duration-300 cursor-pointer group flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-[#174A32] border border-[#74C69D]/40 flex items-center justify-center text-[#95D5B2] group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono text-[#95D5B2] uppercase tracking-wider">
                  04 // Hardbound Corpus
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#FFFDF7] group-hover:text-[#F5E3B3] transition-colors">
                  Knowledge Library · OpenStax Archive
                </h3>
                <p className="text-sm text-[#D0CDC0] leading-relaxed max-w-xl">
                  Browse 23 peer-reviewed knowledge sections across 6 curated volumes, indexed for semantic RAG retrieval and immediate student study.
                </p>
              </div>

              {/* Library Scope Motif */}
              <div className="p-4 rounded-xl bg-[#030D07]/80 border border-white/6 flex items-center justify-between text-xs text-[#E3DFD3]">
                <span className="font-mono text-[#F5E3B3]">6 Hardbound Volumes</span>
                <span className="text-[#A8A69B]">Direct OpenStax Literature Citations</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/8 flex items-center justify-between text-xs font-semibold text-[#F5E3B3]">
              <span>Explore Corpus</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
       *  SECTION 05 — TECHNICAL FOUNDATION
       *  Elegant Architectural Blueprint Strip · Custom SVG Motifs
       * ════════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="relative py-12 px-6 sm:px-12 rounded-3xl bg-[#030E07]/90 border-y border-[#E8C97A]/22 border-x border-white/6 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/8">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#E8C97A] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#74C69D]" />
              SYSTEM ARCHITECTURE // TECHNICAL FOUNDATION
            </span>
            <span className="text-xs font-mono text-[#A8A69B]">
              Verified Pedagogical Infrastructure
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Capability 01 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#082215] border border-[#E8C97A]/30 flex items-center justify-center text-[#E8C97A]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#74C69D] uppercase tracking-wider block">
                    SYS // 01 · RETRIEVAL
                  </span>
                  <h4 className="font-semibold text-base text-[#FFFDF7]">
                    Dense Semantic Retrieval
                  </h4>
                </div>
              </div>

              <p className="text-xs text-[#C6C3B7] leading-relaxed">
                Nomic Embed Text & NumPy cosine similarity isolate exact OpenStax theorems across 23 sections before every generation.
              </p>

              <div className="p-3 rounded-lg bg-[#020804] border border-white/6 font-mono text-[11px] text-[#A8A69B]">
                <MathRenderer content="$$\cos(\theta) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|} \ge 0.88$$" />
              </div>
            </div>

            {/* Capability 02 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#082215] border border-[#E8C97A]/30 flex items-center justify-center text-[#E8C97A]">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#74C69D] uppercase tracking-wider block">
                    SYS // 02 · REASONING
                  </span>
                  <h4 className="font-semibold text-base text-[#FFFDF7]">
                    Local Qwen3 4B Engine
                  </h4>
                </div>
              </div>

              <p className="text-xs text-[#C6C3B7] leading-relaxed">
                Runs privately on-device through Ollama with reproducible pedagogical scaffolding, zero telemetry leakage, and instant response streaming.
              </p>

              <div className="p-3 rounded-lg bg-[#020804] border border-white/6 font-mono text-[11px] text-[#A8A69B]">
                <MathRenderer content="$$\text{Latency} \le 18\text{ms} \quad (\text{On-Device Offline})$$" />
              </div>
            </div>

            {/* Capability 03 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#082215] border border-[#E8C97A]/30 flex items-center justify-center text-[#E8C97A]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#74C69D] uppercase tracking-wider block">
                    SYS // 03 · VERIFICATION
                  </span>
                  <h4 className="font-semibold text-base text-[#FFFDF7]">
                    Algorithmic Verification
                  </h4>
                </div>
              </div>

              <p className="text-xs text-[#C6C3B7] leading-relaxed">
                Deterministic mathematical checks verify numeric and symbolic solutions independently of the language model to eliminate hallucinations.
              </p>

              <div className="p-3 rounded-lg bg-[#020804] border border-white/6 font-mono text-[11px] text-[#A8A69B]">
                <MathRenderer content="$$\text{Verify}(f(x)) \equiv \text{Eval}(x^*) \implies \text{True}$$" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
       *  SECTION 06 — CLOSING INVITATION
       *  Visual Climax · Full-width Panoramic Atmosphere · Oversized Typography
       * ════════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-8 max-w-5xl mx-auto w-full pb-16">
        <div className="relative rounded-3xl p-8 sm:p-14 lg:p-16 text-center bg-gradient-to-br from-[#082216]/92 via-[#05160E]/95 to-[#020A05]/98 border border-[#E8C97A]/26 shadow-[0_28px_80px_-15px_rgba(0,0,0,0.85)] flex flex-col items-center space-y-7 overflow-hidden">
          {/* Panoramic Ambient Light Corona */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 45%, rgba(245, 217, 145, 0.14) 0%, rgba(82, 183, 136, 0.08) 38%, transparent 70%)',
            }}
          />

          <div className="relative z-10 space-y-3 max-w-xl">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#E8C97A]">
              Step into the Atelier
            </span>
            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-medium text-[#FFFDF7] tracking-tight">
              Begin your mathematical journey.
            </h2>
            <p className="text-sm sm:text-base text-[#D0CDC0] leading-relaxed">
              Ask a conceptual question in the AI Studio, manipulate equilibrium on the balance scale, or ascend the 11 curriculum milestones.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Button
              variant="gold"
              size="lg"
              onClick={() => navigate('/tutor')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Enter AI Studio
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/practice')}
              rightIcon={<PenTool className="w-4 h-4 text-[#F5E3B3]" />}
            >
              Practice Arena
            </Button>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/8 w-full flex flex-wrap items-center justify-between text-xs text-[#A8A69B] max-w-xl">
            <span>EduPath · The Emerald Observatory</span>
            <span>Private Local Intelligence</span>
            <span>OpenStax Algebra 2e</span>
          </div>
        </div>
      </section>
    </div>
  );
};
