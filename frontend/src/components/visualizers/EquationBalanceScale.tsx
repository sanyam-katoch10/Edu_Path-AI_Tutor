import React, { useState, useMemo, useEffect } from 'react';
import { RotateCcw, Sparkles, Check, ChevronRight, ChevronLeft, Scale } from 'lucide-react';
import { Button } from '../ui/Button';
import { parseLinearEquation } from '../../lib/practiceModel';
import type { ParsedLinearEquation } from '../../lib/practiceModel';

interface EquationBalanceScaleProps {
  equationLabel?: string;
  parsedModel?: ParsedLinearEquation | null;
  initialLeftWeight?: number;
  initialRightWeight?: number;
  targetX?: number;
  compact?: boolean;
}

export const EquationBalanceScale: React.FC<EquationBalanceScaleProps> = ({
  equationLabel = '2x + 4 = 10',
  parsedModel = null,
  targetX: propTargetX,
  compact = false,
}) => {
  // Derive or parse model from props
  const model: ParsedLinearEquation = useMemo(() => {
    if (parsedModel) return parsedModel;
    const parsed = parseLinearEquation(equationLabel);
    if (parsed) return parsed;
    // Fallback default
    return {
      type: 'linear_equation',
      rawEquation: equationLabel,
      a: 2,
      b: 4,
      c: 0,
      d: 10,
      targetX: propTargetX ?? 3,
      steps: [
        {
          stepNumber: 1,
          action: 'Original Equation',
          equation: equationLabel,
          leftLabel: '2x + 4',
          rightLabel: '10',
          leftCoeff: 2,
          leftConst: 4,
          rightCoeff: 0,
          rightConst: 10,
          note: 'Both brass pans hold equal value. Left holds 2x + 4; right holds 10.',
        },
        {
          stepNumber: 2,
          action: 'Subtract 4 from both sides',
          equation: '2x = 6',
          leftLabel: '2x',
          rightLabel: '6',
          leftCoeff: 2,
          leftConst: 0,
          rightCoeff: 0,
          rightConst: 6,
          note: 'Removing 4 from both sides maintains balance: 2x = 6.',
        },
        {
          stepNumber: 3,
          action: 'Divide both sides by 2',
          equation: 'x = 3',
          leftLabel: 'x',
          rightLabel: '3',
          leftCoeff: 1,
          leftConst: 0,
          rightCoeff: 0,
          rightConst: 3,
          note: 'Dividing both sides by 2 isolates a single unknown: x = 3.',
        },
      ],
      sliderMin: 0,
      sliderMax: 6,
      sliderStep: 1,
    };
  }, [equationLabel, parsedModel, propTargetX]);

  const effectiveTargetX = model.targetX;
  const steps = model.steps;

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [testedX, setTestedX] = useState<number>(model.targetX);
  const [mode, setMode] = useState<'algebraic' | 'interactive'>('algebraic');

  // Reset current step when problem changes
  useEffect(() => {
    setCurrentStep(0);
    setTestedX(model.targetX);
  }, [model.rawEquation, model.targetX]);

  const activeStep = steps[currentStep] || steps[0];

  // Dynamic left and right weight calculation
  const leftTotal = useMemo(() => {
    if (mode === 'interactive') {
      return model.a * testedX + model.b;
    }
    return activeStep.leftCoeff * effectiveTargetX + activeStep.leftConst;
  }, [mode, model.a, model.b, testedX, activeStep, effectiveTargetX]);

  const rightTotal = useMemo(() => {
    if (mode === 'interactive') {
      return model.c * testedX + model.d;
    }
    return activeStep.rightCoeff * effectiveTargetX + activeStep.rightConst;
  }, [mode, model.c, model.d, testedX, activeStep, effectiveTargetX]);

  const diff = leftTotal - rightTotal;
  const tiltAngle = Math.max(-13, Math.min(13, diff * 2.8));

  // Determine pan display labels
  const leftVariableLabel = useMemo(() => {
    const coeff = mode === 'interactive' ? model.a : activeStep.leftCoeff;
    if (coeff === 0) return null;
    if (coeff === 1) return 'x';
    if (coeff === -1) return '-x';
    return `${coeff}x`;
  }, [mode, model.a, activeStep.leftCoeff]);

  const leftConstantLabel = useMemo(() => {
    const c = mode === 'interactive' ? model.b : activeStep.leftConst;
    if (c === 0) return null;
    return c > 0 ? `+${c}` : `${c}`;
  }, [mode, model.b, activeStep.leftConst]);

  const rightVariableLabel = useMemo(() => {
    const coeff = mode === 'interactive' ? model.c : activeStep.rightCoeff;
    if (coeff === 0) return null;
    if (coeff === 1) return 'x';
    if (coeff === -1) return '-x';
    return `${coeff}x`;
  }, [mode, model.c, activeStep.rightCoeff]);

  const rightConstantLabel = useMemo(() => {
    const d = mode === 'interactive' ? model.d : activeStep.rightConst;
    if (d === 0) return null;
    return `${d}`;
  }, [mode, model.d, activeStep.rightConst]);

  return (
    <div
      className={`w-full rounded-2xl ${
        compact ? 'bg-transparent p-0' : 'glass-panel p-5 sm:p-7'
      } relative overflow-hidden`}
    >
      {/* ── Visualizer Header & Mode Switch ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8C97A]/15">
        <div>
          <span className="text-[10px] font-mono font-semibold tracking-widest text-[#E8C97A] uppercase flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-[#F5E3B3]" />
            Interactive Balance Scale · Mathematical Lab
          </span>
          <h4 className="font-editorial text-lg sm:text-xl font-semibold text-[#FFFDF7] mt-0.5">
            Balancing: <span className="text-[#F5E3B3] font-mono">{model.rawEquation}</span>
          </h4>
        </div>

        <div className="flex items-center gap-1 bg-[#05140D]/85 p-1 rounded-full border border-[#E8C97A]/22 self-start sm:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setMode('algebraic')}
            className={`px-3.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
              mode === 'algebraic'
                ? 'bg-gradient-to-r from-[#2D7554] to-[#1A4B35] text-[#FFFDF7] border border-[#74C69D]/45 shadow-[0_0_12px_rgba(82,183,136,0.3)]'
                : 'text-[#A8A69B] hover:text-[#FFFDF7]'
            }`}
          >
            Step Elimination
          </button>
          <button
            type="button"
            onClick={() => setMode('interactive')}
            className={`px-3.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
              mode === 'interactive'
                ? 'bg-gradient-to-r from-[#2D7554] to-[#1A4B35] text-[#FFFDF7] border border-[#74C69D]/45 shadow-[0_0_12px_rgba(82,183,136,0.3)]'
                : 'text-[#A8A69B] hover:text-[#FFFDF7]'
            }`}
          >
            Test Value Slider
          </button>
        </div>
      </div>

      {/* ── Ornate Golden Brass Scale SVG ── */}
      <div className="py-4 sm:py-5 flex flex-col items-center justify-center select-none relative">
        {/* Soft golden backlight behind fulcrum */}
        <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-36 bg-radial from-[#E8C97A]/15 via-[#52B788]/10 to-transparent blur-2xl pointer-events-none" />

        <svg
          viewBox="0 0 540 245"
          className="w-full max-w-[500px] h-auto overflow-visible relative z-10"
        >
          <defs>
            <linearGradient id="brassGold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9E7B38" />
              <stop offset="30%" stopColor="#F5E3B3" />
              <stop offset="55%" stopColor="#D4A653" />
              <stop offset="80%" stopColor="#F8EAC4" />
              <stop offset="100%" stopColor="#8F6D2E" />
            </linearGradient>
            <linearGradient id="brassVertical" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7A5B24" />
              <stop offset="45%" stopColor="#F4DFA8" />
              <stop offset="70%" stopColor="#C89D4A" />
              <stop offset="100%" stopColor="#6D501E" />
            </linearGradient>
            <linearGradient id="emeraldCube" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#74F0B0" stopOpacity="0.86" />
              <stop offset="50%" stopColor="#2D8A5E" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0E3825" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="goldCube" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FAF0D2" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#D7AE5E" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#7A5A20" stopOpacity="0.92" />
            </linearGradient>
            <filter id="warmBrassGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#E8C97A" floodOpacity="0.4" />
            </filter>
            <filter id="emeraldGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#52B788" floodOpacity="0.55" />
            </filter>
          </defs>

          {/* Pedestal Ground Glow */}
          <ellipse cx="270" cy="224" rx="95" ry="10" fill="#E8C97A" opacity="0.14" />

          {/* Ornate Brass Column & Stepped Base */}
          <path
            d="M 263 82 L 260 202 L 280 202 L 277 82 Z"
            fill="url(#brassVertical)"
            filter="url(#warmBrassGlow)"
          />
          {/* Column decorative rings */}
          <ellipse cx="270" cy="112" rx="11" ry="4" fill="url(#brassGold)" />
          <ellipse cx="270" cy="196" rx="18" ry="5" fill="url(#brassGold)" />
          {/* Base Plinth */}
          <path d="M 225 204 Q 270 198 315 204 L 326 218 Q 270 226 214 218 Z" fill="url(#brassGold)" />
          <ellipse cx="270" cy="218" rx="56" ry="7" fill="#7D5E24" opacity="0.7" />
          {/* Top Finial Crown */}
          <circle cx="270" cy="70" r="8" fill="url(#brassGold)" filter="url(#warmBrassGlow)" />
          <circle cx="270" cy="84" r="5" fill="#F8EAC4" />

          {/* Tilting Ornate Crossbeam Group */}
          <g
            style={{
              transformOrigin: '270px 92px',
              transform: `rotate(${tiltAngle}deg)`,
              transition: 'transform 0.65s cubic-bezier(0.34, 1.4, 0.64, 1)',
            }}
          >
            {/* Sculpted Curved Brass Crossbeam */}
            <path
              d="M 105 94 Q 188 76 270 92 Q 352 76 435 94"
              fill="none"
              stroke="url(#brassGold)"
              strokeWidth="6.5"
              strokeLinecap="round"
              filter="url(#warmBrassGlow)"
            />
            <circle cx="105" cy="94" r="5.5" fill="#F5E3B3" />
            <circle cx="435" cy="94" r="5.5" fill="#F5E3B3" />

            {/* Left Chains & Brass Pan */}
            <line x1="105" y1="98" x2="62" y2="174" stroke="#E8C97A" strokeWidth="1.6" opacity="0.75" />
            <line x1="105" y1="98" x2="148" y2="174" stroke="#E8C97A" strokeWidth="1.6" opacity="0.75" />
            <line x1="105" y1="98" x2="105" y2="174" stroke="#E8C97A" strokeWidth="1.1" opacity="0.4" />
            {/* Left Golden Pan */}
            <path
              d="M 52 174 Q 105 198 158 174 Z"
              fill="url(#brassGold)"
              filter="url(#warmBrassGlow)"
            />
            <ellipse cx="105" cy="174" rx="53" ry="5" fill="#F8EAC4" opacity="0.55" />

            {/* Left Translucent Glass Blocks */}
            <g transform="translate(105, 166)">
              {/* Unknown Variable Emerald Block */}
              {leftVariableLabel && (
                <g filter="url(#emeraldGlow)">
                  <rect
                    x={leftConstantLabel ? -44 : -22}
                    y="-42"
                    width={leftConstantLabel ? '42' : '44'}
                    height="42"
                    rx="8"
                    fill="url(#emeraldCube)"
                    stroke="#B7F4D0"
                    strokeWidth="1.6"
                  />
                  <line
                    x1={leftConstantLabel ? -38 : -16}
                    y1="-36"
                    x2={leftConstantLabel ? -8 : 14}
                    y2="-36"
                    stroke="#FFFFFF"
                    strokeOpacity="0.5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <text
                    x={leftConstantLabel ? -23 : 0}
                    y="-15"
                    fill="#FFFDF7"
                    fontSize="15"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {leftVariableLabel}
                  </text>
                </g>
              )}

              {/* Constant Gold Block */}
              {leftConstantLabel && (
                <g filter="url(#warmBrassGlow)">
                  <rect
                    x={leftVariableLabel ? 4 : -20}
                    y="-38"
                    width={leftVariableLabel ? '38' : '40'}
                    height="38"
                    rx="7"
                    fill="url(#goldCube)"
                    stroke="#FFF4D6"
                    strokeWidth="1.5"
                  />
                  <text
                    x={leftVariableLabel ? 23 : 0}
                    y="-14"
                    fill="#142B1E"
                    fontSize="14"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {leftConstantLabel}
                  </text>
                </g>
              )}
            </g>

            {/* Right Chains & Brass Pan */}
            <line x1="435" y1="98" x2="392" y2="174" stroke="#E8C97A" strokeWidth="1.6" opacity="0.75" />
            <line x1="435" y1="98" x2="478" y2="174" stroke="#E8C97A" strokeWidth="1.6" opacity="0.75" />
            <line x1="435" y1="98" x2="435" y2="174" stroke="#E8C97A" strokeWidth="1.1" opacity="0.4" />
            {/* Right Golden Pan */}
            <path
              d="M 382 174 Q 435 198 488 174 Z"
              fill="url(#brassGold)"
              filter="url(#warmBrassGlow)"
            />
            <ellipse cx="435" cy="174" rx="53" ry="5" fill="#F8EAC4" opacity="0.55" />

            {/* Right Translucent Blocks */}
            <g transform="translate(435, 166)">
              {/* Right Variable Block (if any, e.g. 2x on right) */}
              {rightVariableLabel && (
                <g filter="url(#emeraldGlow)">
                  <rect
                    x={rightConstantLabel ? -44 : -22}
                    y="-42"
                    width={rightConstantLabel ? '42' : '44'}
                    height="42"
                    rx="8"
                    fill="url(#emeraldCube)"
                    stroke="#B7F4D0"
                    strokeWidth="1.6"
                  />
                  <text
                    x={rightConstantLabel ? -23 : 0}
                    y="-15"
                    fill="#FFFDF7"
                    fontSize="15"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {rightVariableLabel}
                  </text>
                </g>
              )}

              {/* Right Constant Emerald/Gold Block */}
              {rightConstantLabel && (
                <g filter="url(#emeraldGlow)">
                  <rect
                    x={rightVariableLabel ? 4 : -24}
                    y="-44"
                    width={rightVariableLabel ? '40' : '48'}
                    height="44"
                    rx="8"
                    fill="url(#emeraldCube)"
                    stroke="#B7F4D0"
                    strokeWidth="1.6"
                  />
                  <line
                    x1={rightVariableLabel ? 10 : -17}
                    y1="-37"
                    x2={rightVariableLabel ? 38 : 17}
                    y2="-37"
                    stroke="#FFFFFF"
                    strokeOpacity="0.5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <text
                    x={rightVariableLabel ? 24 : 0}
                    y="-16"
                    fill="#FFFDF7"
                    fontSize="16"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {rightConstantLabel}
                  </text>
                </g>
              )}
            </g>
          </g>

          {/* Equilibrium Status Pill */}
          <g transform="translate(270, 36)">
            <rect
              x="-60"
              y="-13"
              width="120"
              height="26"
              rx="13"
              fill={diff === 0 ? 'rgba(13, 39, 27, 0.94)' : 'rgba(62, 27, 19, 0.94)'}
              stroke={diff === 0 ? '#74C69D' : '#E07A5F'}
              strokeWidth="1.4"
              filter="url(#warmBrassGlow)"
            />
            <text
              x="0"
              y="4"
              fill={diff === 0 ? '#B7F4D0' : '#EB9A85'}
              fontSize="10"
              fontWeight="800"
              letterSpacing="0.8"
              textAnchor="middle"
            >
              {diff === 0 ? 'EQUILIBRIUM' : diff > 0 ? 'LEFT HEAVIER' : 'RIGHT HEAVIER'}
            </text>
          </g>
        </svg>
      </div>

      {/* ── Mode 1: Polished Step-by-Step Progression (No Truncation) ── */}
      {mode === 'algebraic' ? (
        <div className="space-y-4 pt-3 border-t border-[#E8C97A]/15">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#E8C97A] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#F5E3B3]" />
              Algebraic Step Progression
            </span>
            <span className="text-[11px] font-mono text-[#D6D3C7]">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          {/* Full-width responsive step progression cards */}
          <div className="space-y-2">
            {steps.map((st, idx) => {
              const isActive = currentStep === idx;
              const isDone = idx < currentStep;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    isActive
                      ? 'bg-[#17402D]/90 border-[#E8C97A] text-[#FFFDF7] shadow-[0_0_18px_rgba(232,201,122,0.22)] ring-1 ring-[#F8EAC4]'
                      : isDone
                      ? 'bg-[#0A261A]/75 border-[#52B788]/40 text-[#C7F5DC] hover:border-[#52B788]'
                      : 'bg-black/30 border-white/10 text-[#8E8C82] hover:border-white/20 hover:text-[#D8D4C7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${
                        isActive
                          ? 'bg-[#E8C97A] text-[#091B12]'
                          : isDone
                          ? 'bg-[#52B788] text-[#05120B]'
                          : 'border border-white/20 text-white/40'
                      }`}
                    >
                      {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                    </span>
                    <span className="font-semibold text-xs text-[#FFFDF7]">
                      {st.action}
                    </span>
                  </div>

                  <span className="font-mono text-xs font-bold text-[#F5E3B3] shrink-0 bg-black/40 px-2.5 py-1 rounded-md border border-white/10 self-start sm:self-auto">
                    {st.equation}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Explanatory note for the currently selected step */}
          <div className="p-3.5 rounded-xl bg-[#05140D]/85 border border-[#E8C97A]/22 text-xs text-[#E3DFD3] leading-relaxed shadow-sm">
            <strong className="text-[#F5E3B3] mr-1 font-semibold">Why this preserves balance:</strong>
            {activeStep.note}
          </div>

          {/* Step progression navigation controls */}
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(0)}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              disabled={currentStep === 0}
            >
              Reset to Start
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                disabled={currentStep === steps.length - 1}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                {currentStep === steps.length - 2 ? 'Final Isolation' : 'Next Step'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Mode 2: Test Value Slider ── */
        <div className="space-y-4 pt-3 border-t border-[#E8C97A]/15">
          <div className="flex items-center justify-between text-xs text-[#E3DFD3]">
            <span>
              Test arbitrary values for unknown <strong className="text-[#95D5B2] font-mono">x</strong>:
            </span>
            <span className="font-mono text-sm font-bold text-[#F5E3B3] bg-[#143626]/90 px-3.5 py-1 rounded-full border border-[#E8C97A]/35 shadow-inner">
              x = {testedX}
            </span>
          </div>

          <input
            type="range"
            min={model.sliderMin}
            max={model.sliderMax}
            step={model.sliderStep}
            value={testedX}
            onChange={(e) => setTestedX(Number(e.target.value))}
            className="w-full h-2.5 bg-black/45 rounded-lg appearance-none cursor-pointer accent-[#E8C97A]"
          />

          <div className="flex items-center justify-between text-[11px] text-[#A8A69B] font-mono">
            <span>x = {model.sliderMin}</span>
            <span className="text-[#95D5B2] font-semibold">Solution: x = {effectiveTargetX}</span>
            <span>x = {model.sliderMax}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-[#E3DFD3] leading-relaxed">
            {testedX === effectiveTargetX ? (
              <span className="text-[#A7E4C4] font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-[#52B788] stroke-[3]" />
                Perfect Equilibrium! When x = {effectiveTargetX}, left pan ({leftTotal}) equals right pan ({rightTotal}).
              </span>
            ) : testedX < effectiveTargetX ? (
              <span className="text-[#F5E3B3]">
                Left pan is lighter: left total is {leftTotal} while right total is {rightTotal}. Try increasing x.
              </span>
            ) : (
              <span className="text-[#EB9A85]">
                Left pan is heavier: left total is {leftTotal} while right total is {rightTotal}. Try decreasing x.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
