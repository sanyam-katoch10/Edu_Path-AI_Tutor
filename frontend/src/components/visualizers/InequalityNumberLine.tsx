import React, { useState } from 'react';
import { Sparkles, Check, X, Info } from 'lucide-react';
import type { ParsedInequality } from '../../lib/practiceModel';

interface InequalityNumberLineProps {
  boundary?: number; // e.g. 4
  operator?: '<=' | '>=' | '<' | '>';
  variableName?: string;
  inequalityModel?: ParsedInequality | null;
}

export const InequalityNumberLine: React.FC<InequalityNumberLineProps> = ({
  boundary: propBoundary = 4,
  operator: propOperator = '<=',
  variableName: propVariableName = 'x',
  inequalityModel = null,
}) => {
  const boundary = inequalityModel ? inequalityModel.boundary : propBoundary;
  const operator = inequalityModel ? inequalityModel.operator : propOperator;
  const variableName = inequalityModel ? inequalityModel.variable : propVariableName;

  const [testedValue, setTestedValue] = useState<number>(boundary);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  // Dynamically center number line around boundary
  const minVal = Math.floor(boundary) - 5;
  const maxVal = Math.ceil(boundary) + 5;
  const range = maxVal - minVal;

  const isIncluded = operator === '<=' || operator === '>=';
  const isLeftRay = operator === '<=' || operator === '<';

  // Coordinate mapping function: maps number to SVG X coordinate (range [50, 470])
  const toX = (val: number) => {
    return 50 + ((val - minVal) / range) * 420;
  };

  const boundaryX = toX(boundary);
  const rayStartX = isLeftRay ? 35 : boundaryX;
  const rayEndX = isLeftRay ? boundaryX : 485;

  // Evaluation helper for abstract boundary
  const evaluateValue = (val: number): boolean => {
    switch (operator) {
      case '<=': return val <= boundary;
      case '>=': return val >= boundary;
      case '<': return val < boundary;
      case '>': return val > boundary;
      default: return false;
    }
  };

  const isTestTrue = evaluateValue(testedValue);
  const steps = inequalityModel?.steps;

  // Detailed verification against the ORIGINAL inequality (e.g. 3x - 4 <= 8)
  const coeffA = inequalityModel?.coeffA ?? 1;
  const constB = inequalityModel?.constB ?? 0;
  const rightD = inequalityModel?.rightD ?? boundary;
  const rawOp = inequalityModel?.rawOp ?? operator;

  const computedLeft = coeffA * testedValue + constB;
  const opSymbol = rawOp === '<=' ? '≤' : rawOp === '>=' ? '≥' : rawOp;
  const solOpSymbol = operator === '<=' ? '≤' : operator === '>=' ? '≥' : operator;

  const originalVerificationStr = coeffA !== 1 || constB !== 0
    ? `${coeffA !== 1 ? `${coeffA}(${testedValue})` : testedValue} ${constB >= 0 ? `+ ${constB}` : `- ${Math.abs(constB)}`} = ${computedLeft}`
    : `${testedValue}`;

  return (
    <div className="w-full rounded-2xl bg-[#06150F]/90 border border-[#52B788]/25 p-5 sm:p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#E6C794] uppercase flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#F5E6BE]" />
            Geometric Solution Set · Inequality Ray
          </span>
          <h4 className="text-base font-bold text-[#FFFDF7] mt-0.5">
            Solution Set: <span className="text-[#95D5B2] font-mono">{variableName} {solOpSymbol} {boundary}</span>
          </h4>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-black/40 border border-[#E8C97A]/24 text-[#E2DFD6]">
            Boundary: <strong className="text-[#FFFDF7]">{boundary}</strong> ({isIncluded ? 'Solid Circle • Included' : 'Hollow Circle ○ Excluded'})
          </span>
        </div>
      </div>

      {/* SVG Interactive Number Line */}
      <div className="py-4 flex flex-col items-center justify-center select-none">
        <svg
          viewBox="0 0 520 120"
          className="w-full max-w-[500px] h-auto overflow-visible cursor-pointer"
        >
          <defs>
            <linearGradient id="rayGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#52B788" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#E8C97A" stopOpacity="0.95" />
            </linearGradient>
            <filter id="rayGlow" x="-20%" y="-50%" width="140%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#52B788" floodOpacity="0.65" />
            </filter>
          </defs>

          {/* Shaded Solution Ray */}
          <line
            x1={rayStartX}
            y1="60"
            x2={rayEndX}
            y2="60"
            stroke="url(#rayGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            filter="url(#rayGlow)"
          />

          {/* Ray Direction Arrowhead */}
          {isLeftRay ? (
            <polygon points="30,60 44,53 44,67" fill="#52B788" filter="url(#rayGlow)" />
          ) : (
            <polygon points="490,60 476,53 476,67" fill="#E8C97A" filter="url(#rayGlow)" />
          )}

          {/* Main Axis Line */}
          <line x1="30" y1="60" x2="490" y2="60" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
          <polygon points="25,60 35,56 35,64" fill="rgba(255,255,255,0.4)" />
          <polygon points="495,60 485,56 485,64" fill="rgba(255,255,255,0.4)" />

          {/* Integer Ticks & Labels */}
          {Array.from({ length: range + 1 }, (_, i) => minVal + i).map((num) => {
            const x = toX(num);
            const isZero = num === 0;
            const isBoundary = num === boundary;
            const isSelected = num === testedValue;

            return (
              <g
                key={num}
                onClick={() => setTestedValue(num)}
                className="group/tick transition-transform cursor-pointer"
              >
                {/* Tick mark */}
                <line
                  x1={x}
                  y1={isZero || isBoundary ? '46' : '52'}
                  x2={x}
                  y2={isZero || isBoundary ? '74' : '68'}
                  stroke={isBoundary ? '#F5E6BE' : isZero ? '#95D5B2' : 'rgba(255,255,255,0.4)'}
                  strokeWidth={isBoundary ? '2.5' : isZero ? '2' : '1'}
                />

                {/* Number Label */}
                <text
                  x={x}
                  y="90"
                  fill={isBoundary ? '#F5E6BE' : isSelected ? '#52B788' : isZero ? '#FFFDF7' : '#A6A49C'}
                  fontSize={isBoundary || isSelected ? '12' : '10'}
                  fontWeight={isBoundary || isSelected || isZero ? 'bold' : 'normal'}
                  textAnchor="middle"
                >
                  {num}
                </text>

                {/* Invisible hit target for easy clicking */}
                <circle cx={x} cy="60" r="16" fill="transparent" />
              </g>
            );
          })}

          {/* Boundary Point Indicator (Solid or Hollow) */}
          {isIncluded ? (
            <circle
              cx={boundaryX}
              cy="60"
              r="8"
              fill="#F5E6BE"
              stroke="#05140D"
              strokeWidth="2.5"
            />
          ) : (
            <circle
              cx={boundaryX}
              cy="60"
              r="8"
              fill="#06150F"
              stroke="#F5E6BE"
              strokeWidth="3"
            />
          )}

          {/* Tested Value Probe Indicator */}
          <g transform={`translate(${toX(testedValue)}, 30)`}>
            <polygon points="0,18 -6,8 6,8" fill={isTestTrue ? '#52B788' : '#E07A5F'} />
            <circle cx="0" cy="4" r="9" fill={isTestTrue ? '#173528' : '#3E1B13'} stroke={isTestTrue ? '#52B788' : '#E07A5F'} strokeWidth="1.5" />
            <text x="0" y="7.5" fill={isTestTrue ? '#95D5B2' : '#EB9A85'} fontSize="9" fontWeight="bold" textAnchor="middle">
              {isTestTrue ? '✓' : '✗'}
            </text>
          </g>
        </svg>
      </div>

      {/* Interactive Value Probe Result Demonstrating ORIGINAL Inequality Verification */}
      <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#E2DFD6]">
            <Info className="w-4 h-4 text-[#95D5B2] shrink-0" />
            <span>Click any integer on the line to test verification against the original inequality.</span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 font-mono ${
              isTestTrue
                ? 'bg-[#10261C] border-[#52B788]/50 text-[#95D5B2]'
                : 'bg-[#3E1B13] border-[#E07A5F]/50 text-[#EB9A85]'
            }`}
          >
            {isTestTrue ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
            <span>
              x = {testedValue} is{' '}
              <strong>{isTestTrue ? 'TRUE (In Solution Set)' : 'FALSE (Outside Ray)'}</strong>
            </span>
          </div>
        </div>

        {/* Step-by-Step Original Inequality Substitution Card */}
        <div className="p-3 rounded-xl bg-[#040F0A]/90 border border-[#E8C97A]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#E8C97A] font-sans font-semibold">Original Verification:</span>
            <span className="text-[#FFFDF7]">
              {originalVerificationStr}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={isTestTrue ? 'text-[#B7F4D0] font-bold' : 'text-[#EB9A85] font-bold'}>
              {computedLeft} {opSymbol} {rightD} {isTestTrue ? '✓' : '✗'}
            </span>
            <span className="text-[11px] text-[#A6A49C] font-sans">
              ({testedValue} {solOpSymbol} {boundary})
            </span>
          </div>
        </div>
      </div>

      {/* Steps Progression if provided */}
      {steps && steps.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <span className="text-xs font-semibold text-[#E8C97A] uppercase tracking-wider block">
            Inequality Transformations
          </span>
          <div className="space-y-2">
            {steps.map((st, idx) => {
              const isActive = activeStepIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStepIdx(idx)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                    isActive
                      ? 'bg-[#153D2A]/90 border-[#E8C97A] text-[#FFFDF7]'
                      : 'bg-black/30 border-white/8 text-[#A8A69B] hover:text-[#FFFDF7]'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-[#E8C97A]/25 border border-[#E8C97A]/50 text-[#F5E3B3] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {st.stepNumber}
                  </span>
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-[#FFFDF7]">
                      {st.action}: <span className="font-mono text-[#F5E3B3]">{st.statement}</span>
                    </p>
                    <p className="text-[11px] text-[#CFCBC0]">{st.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};