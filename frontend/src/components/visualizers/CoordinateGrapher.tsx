import React, { useState } from 'react';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import type { ParsedSystem, ParsedFunctionOrSlope } from '../../lib/practiceModel';
import { MathRenderer } from '../ui/MathRenderer';

interface CoordinateGrapherProps {
  initialSlope?: number;
  initialIntercept?: number;
  label?: string;
  systemModel?: ParsedSystem | null;
  functionModel?: ParsedFunctionOrSlope | null;
}

export const CoordinateGrapher: React.FC<CoordinateGrapherProps> = ({
  initialSlope = 2,
  initialIntercept = -1,
  label,
  systemModel = null,
  functionModel = null,
}) => {
  const isSystem = !!systemModel;
  const isSlopePoints = !!(functionModel?.point1 && functionModel?.point2);

  const slope = functionModel?.slope ?? initialSlope;
  const intercept = functionModel?.intercept ?? initialIntercept;
  const [showSlopeTriangle, setShowSlopeTriangle] = useState<boolean>(true);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  // Dynamic bounds calculation
  let minX = -4;
  let maxX = 8;
  let minY = -4;
  let maxY = 8;

  if (isSystem && systemModel) {
    minX = Math.min(-1, systemModel.targetX - 4);
    maxX = Math.max(9, systemModel.targetX + 4);
    minY = Math.min(-1, systemModel.targetY - 4);
    maxY = Math.max(9, systemModel.targetY + 4);
  } else if (isSlopePoints && functionModel?.point1 && functionModel?.point2) {
    minX = Math.min(0, functionModel.point1.x, functionModel.point2.x) - 1;
    maxX = Math.max(functionModel.point1.x, functionModel.point2.x) + 2;
    minY = Math.min(0, functionModel.point1.y, functionModel.point2.y) - 1;
    maxY = Math.max(functionModel.point1.y, functionModel.point2.y) + 2;
  } else if (functionModel?.highlightPoint) {
    const hp = functionModel.highlightPoint;
    minX = Math.min(-2, hp.x - 3);
    maxX = Math.max(8, hp.x + 3);
    minY = Math.min(-6, intercept - 2, hp.y - 3);
    maxY = Math.max(8, intercept + 2, hp.y + 4);
  }

  const rangeX = Math.max(1, maxX - minX);
  const rangeY = Math.max(1, maxY - minY);

  // SVG Dimensions: 440 x 440
  const size = 440;
  const padding = 38;
  const plotSize = size - 2 * padding;

  const toSvgX = (x: number) => padding + ((x - minX) / rangeX) * plotSize;
  const toSvgY = (y: number) => padding + ((maxY - y) / rangeY) * plotSize; // Invert y for SVG

  // System lines
  const m1 = systemModel ? systemModel.m1 : slope;
  const b1 = systemModel ? systemModel.b1 : intercept;
  const m2 = systemModel ? systemModel.m2 : 0;
  const b2 = systemModel ? systemModel.b2 : 0;

  // Compute step increments for grid
  const stepX = rangeX > 16 ? 4 : rangeX > 8 ? 2 : 1;
  const stepY = rangeY > 16 ? 4 : rangeY > 8 ? 2 : 1;

  const ticksX: number[] = [];
  const startTickX = Math.ceil(minX / stepX) * stepX;
  for (let x = startTickX; x <= maxX; x += stepX) {
    ticksX.push(x);
  }

  const ticksY: number[] = [];
  const startTickY = Math.ceil(minY / stepY) * stepY;
  for (let y = startTickY; y <= maxY; y += stepY) {
    ticksY.push(y);
  }

  // Handle pointer move over SVG to inspect coordinates
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * size;
    const xVal = Math.round((((svgX - padding) / plotSize) * rangeX + minX) * 2) / 2;
    if (xVal >= minX && xVal <= maxX) {
      setHoverCoord({ x: xVal, y: Math.round((m1 * xVal + b1) * 10) / 10 });
    }
  };

  const steps = isSystem
    ? systemModel.steps
    : functionModel
    ? functionModel.steps
    : null;

  // Slope points
  const p1 = functionModel?.point1;
  const p2 = functionModel?.point2;
  const rise = functionModel?.rise ?? (p1 && p2 ? p2.y - p1.y : slope);
  const run = functionModel?.run ?? (p1 && p2 ? p2.x - p1.x : 1);
  const simplifiedRise = functionModel?.simplifiedRise;
  const simplifiedRun = functionModel?.simplifiedRun;

  return (
    <div className="w-full rounded-2xl bg-[#06150F]/90 border border-[#52B788]/25 p-5 sm:p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#E6C794] uppercase flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#F5E6BE]" />
            {isSystem
              ? 'System of Linear Equations · Intersection Lab'
              : isSlopePoints
              ? 'Rate of Change · Slope Visualizer'
              : 'Cartesian Coordinate Graph · Function Lab'}
          </span>
          <h4 className="text-base font-bold text-[#FFFDF7] mt-0.5 font-mono">
            {isSystem ? (
              <span className="text-xs sm:text-sm">
                ① <span className="text-[#E8C97A]">{systemModel.eq1Raw}</span> &nbsp; ② <span className="text-[#74F0B0]">{systemModel.eq2Raw}</span>
              </span>
            ) : label ? (
              <span className="text-[#95D5B2]">{label}</span>
            ) : (
              <span className="text-[#95D5B2]">
                y = {slope}x {intercept >= 0 ? `+ ${intercept}` : `- ${Math.abs(intercept)}`}
              </span>
            )}
          </h4>
        </div>

        {!isSystem && (
          <button
            type="button"
            onClick={() => setShowSlopeTriangle(!showSlopeTriangle)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-[#E2DFD6] hover:text-[#FFFDF7] hover:bg-white/10 cursor-pointer transition-colors self-start sm:self-auto"
          >
            {showSlopeTriangle ? <EyeOff className="w-3.5 h-3.5 text-[#52B788]" /> : <Eye className="w-3.5 h-3.5 text-[#A6A49C]" />}
            <span>{showSlopeTriangle ? 'Hide Triangle' : 'Show Rise / Run'}</span>
          </button>
        )}
      </div>

      {/* SVG Coordinate Grid */}
      <div className="py-2 flex flex-col items-center justify-center select-none relative">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverCoord(null)}
          className="w-full max-w-[420px] h-auto overflow-visible cursor-crosshair"
        >
          <defs>
            {/* SVG ClipPath restricting all drawn lines to the exact rectangular plotting boundary */}
            <clipPath id="graphClipArea">
              <rect x={padding} y={padding} width={plotSize} height={plotSize} rx="8" />
            </clipPath>

            <linearGradient id="lineGlow1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E8C97A" />
              <stop offset="100%" stopColor="#F5E3B3" />
            </linearGradient>
            <linearGradient id="lineGlow2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#52B788" />
              <stop offset="100%" stopColor="#74F0B0" />
            </linearGradient>
            <filter id="plotGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#52B788" floodOpacity="0.5" />
            </filter>
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#E8C97A" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Grid Background */}
          <rect x={padding} y={padding} width={plotSize} height={plotSize} fill="#030C08" rx="8" stroke="rgba(255,255,255,0.06)" />

          {/* Vertical Grid Lines & Numbers */}
          {ticksX.map((xVal) => {
            const isOrigin = xVal === 0;
            const sx = toSvgX(xVal);
            return (
              <g key={`x-${xVal}`}>
                <line
                  x1={sx}
                  y1={padding}
                  x2={sx}
                  y2={size - padding}
                  stroke={isOrigin ? '#95D5B2' : 'rgba(255,255,255,0.08)'}
                  strokeWidth={isOrigin ? '2' : '1'}
                />
                {xVal !== 0 && sx >= padding + 10 && sx <= size - padding - 10 && (
                  <text
                    x={sx}
                    y={Math.min(size - padding + 14, Math.max(padding - 6, toSvgY(0) + 14))}
                    fill="#A6A49C"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {xVal}
                  </text>
                )}
              </g>
            );
          })}

          {/* Horizontal Grid Lines & Numbers */}
          {ticksY.map((yVal) => {
            const isOrigin = yVal === 0;
            const sy = toSvgY(yVal);
            return (
              <g key={`y-${yVal}`}>
                <line
                  x1={padding}
                  y1={sy}
                  x2={size - padding}
                  y2={sy}
                  stroke={isOrigin ? '#95D5B2' : 'rgba(255,255,255,0.08)'}
                  strokeWidth={isOrigin ? '2' : '1'}
                />
                {yVal !== 0 && sy >= padding + 10 && sy <= size - padding - 10 && (
                  <text
                    x={Math.max(padding - 8, Math.min(size - padding + 14, toSvgX(0) - 8))}
                    y={sy + 3}
                    fill="#A6A49C"
                    fontSize="9"
                    textAnchor="end"
                  >
                    {yVal}
                  </text>
                )}
              </g>
            );
          })}

          {/* Origin Label */}
          {minX <= 0 && maxX >= 0 && minY <= 0 && maxY >= 0 && (
            <text x={toSvgX(0) - 8} y={toSvgY(0) + 14} fill="#95D5B2" fontSize="9" fontWeight="bold">
              0
            </text>
          )}

          {/* ══════════════════════════════════════════════════════════════
           * CLIPPED GRAPH LAYER — Lines NEVER extend outside plotting area
           * ══════════════════════════════════════════════════════════════ */}
          <g clipPath="url(#graphClipArea)">
            {/* Primary Plotted Line */}
            <line
              x1={toSvgX(minX - 50)}
              y1={toSvgY(m1 * (minX - 50) + b1)}
              x2={toSvgX(maxX + 50)}
              y2={toSvgY(m1 * (maxX + 50) + b1)}
              stroke={isSystem ? 'url(#lineGlow1)' : 'url(#lineGlow2)'}
              strokeWidth="3.2"
              strokeLinecap="round"
              filter="url(#plotGlow)"
            />

            {/* Secondary Plotted Line (Systems) */}
            {isSystem && (
              <line
                x1={toSvgX(minX - 50)}
                y1={toSvgY(m2 * (minX - 50) + b2)}
                x2={toSvgX(maxX + 50)}
                y2={toSvgY(m2 * (maxX + 50) + b2)}
                stroke="url(#lineGlow2)"
                strokeWidth="3.2"
                strokeLinecap="round"
                filter="url(#plotGlow)"
              />
            )}

            {/* Slope Triangle Segments */}
            {!isSystem && showSlopeTriangle && (
              <>
                {isSlopePoints && p1 && p2 ? (
                  <>
                    {/* Horizontal Run dashed line */}
                    <line
                      x1={toSvgX(p1.x)}
                      y1={toSvgY(p1.y)}
                      x2={toSvgX(p2.x)}
                      y2={toSvgY(p1.y)}
                      stroke="#E8C97A"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                    />
                    {/* Vertical Rise dashed line */}
                    <line
                      x1={toSvgX(p2.x)}
                      y1={toSvgY(p1.y)}
                      x2={toSvgX(p2.x)}
                      y2={toSvgY(p2.y)}
                      stroke="#E07A5F"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                    />
                  </>
                ) : (
                  <>
                    {/* Standard Run=1 / Rise=slope triangle */}
                    <line
                      x1={toSvgX(0)}
                      y1={toSvgY(intercept)}
                      x2={toSvgX(1)}
                      y2={toSvgY(intercept)}
                      stroke="#E8C97A"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                    <line
                      x1={toSvgX(1)}
                      y1={toSvgY(intercept)}
                      x2={toSvgX(1)}
                      y2={toSvgY(intercept + slope)}
                      stroke="#E07A5F"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                  </>
                )}
              </>
            )}
          </g>

          {/* ══════════════════════════════════════════════════════════════
           * UNCLIPPED ANNOTATION LAYER — Labels & Badges stay fully readable
           * ══════════════════════════════════════════════════════════════ */}

          {/* System Intersection Point */}
          {isSystem && systemModel && (
            <g transform={`translate(${toSvgX(systemModel.targetX)}, ${toSvgY(systemModel.targetY)})`}>
              <circle r="9" fill="none" stroke="#F8EAC4" strokeWidth="2.5" className="animate-pulse" />
              <circle r="5" fill="#E8C97A" filter="url(#goldGlow)" />
              <rect x="10" y="-18" width="80" height="22" rx="6" fill="#0A2417" stroke="#E8C97A" strokeWidth="1" />
              <text x="50" y="-4" fill="#FFFDF7" fontSize="10" fontWeight="bold" textAnchor="middle">
                ({systemModel.targetX}, {systemModel.targetY})
              </text>
            </g>
          )}

          {/* Slope Two-Point Visualizer: (2, 5) and (5, 14) */}
          {!isSystem && isSlopePoints && p1 && p2 && (
            <>
              {/* Point 1 */}
              <g transform={`translate(${toSvgX(p1.x)}, ${toSvgY(p1.y)})`}>
                <circle r="8" fill="none" stroke="#E8C97A" strokeWidth="2" className="animate-pulse" />
                <circle r="4.5" fill="#F5E3B3" />
                <rect x="-35" y="-24" width="70" height="20" rx="5" fill="#0A2417" stroke="#E8C97A" strokeWidth="1" />
                <text x="0" y="-10" fill="#FFFDF7" fontSize="10" fontWeight="bold" textAnchor="middle">
                  {p1.label}
                </text>
              </g>

              {/* Point 2 */}
              <g transform={`translate(${toSvgX(p2.x)}, ${toSvgY(p2.y)})`}>
                <circle r="8" fill="none" stroke="#52B788" strokeWidth="2" className="animate-pulse" />
                <circle r="4.5" fill="#B7E4C7" />
                <rect x="-35" y="-24" width="70" height="20" rx="5" fill="#0A2417" stroke="#52B788" strokeWidth="1" />
                <text x="0" y="-10" fill="#FFFDF7" fontSize="10" fontWeight="bold" textAnchor="middle">
                  {p2.label}
                </text>
              </g>

              {/* Run & Rise Labels */}
              {showSlopeTriangle && (
                <>
                  {/* Horizontal Run Label */}
                  <g transform={`translate(${toSvgX((p1.x + p2.x) / 2)}, ${toSvgY(p1.y) + 18})`}>
                    <rect x="-42" y="-12" width="84" height="20" rx="4" fill="#132B1E" stroke="#E8C97A" strokeWidth="1" />
                    <text x="0" y="2" fill="#F8EAC4" fontSize="10" fontWeight="bold" textAnchor="middle">
                      Run = {p2.x} - {p1.x} = {run}
                    </text>
                  </g>

                  {/* Vertical Rise Label */}
                  <g transform={`translate(${toSvgX(p2.x) + 48}, ${toSvgY((p1.y + p2.y) / 2)})`}>
                    <rect x="-44" y="-12" width="88" height="20" rx="4" fill="#2C120B" stroke="#E07A5F" strokeWidth="1" />
                    <text x="0" y="2" fill="#FCD5CE" fontSize="10" fontWeight="bold" textAnchor="middle">
                      Rise = {p2.y} - {p1.y} = {rise}
                    </text>
                  </g>
                </>
              )}
            </>
          )}

          {/* Function Highlighted Point (e.g. f(4) = 3) */}
          {!isSystem && !isSlopePoints && functionModel?.highlightPoint && (
            <g transform={`translate(${toSvgX(functionModel.highlightPoint.x)}, ${toSvgY(functionModel.highlightPoint.y)})`}>
              <circle r="8" fill="none" stroke="#74F0B0" strokeWidth="2" className="animate-pulse" />
              <circle r="5" fill="#F5E3B3" />
              <rect x="10" y="-18" width="80" height="22" rx="6" fill="#0A2417" stroke="#74F0B0" strokeWidth="1" />
              <text x="50" y="-4" fill="#FFFDF7" fontSize="10" fontWeight="bold" textAnchor="middle">
                {functionModel.highlightPoint.label}
              </text>
            </g>
          )}

          {/* Standard Slope Triangle Labels */}
          {!isSystem && !isSlopePoints && showSlopeTriangle && (
            <g opacity="0.95">
              <text x={toSvgX(0.5)} y={toSvgY(intercept) + (slope >= 0 ? 14 : -6)} fill="#F5E6BE" fontSize="10" fontWeight="bold" textAnchor="middle">
                Run = 1
              </text>
              <text x={toSvgX(1) + 8} y={toSvgY(intercept + slope / 2) + 3} fill="#EB9A85" fontSize="10" fontWeight="bold">
                Rise = {slope}
              </text>
            </g>
          )}

          {/* Hover Coordinate Crosshair */}
          {hoverCoord && (
            <g transform={`translate(${toSvgX(hoverCoord.x)}, ${toSvgY(hoverCoord.y)})`}>
              <circle r="4" fill="#52B788" />
              <rect x="8" y="-22" width="65" height="18" rx="4" fill="#142B1E" stroke="#52B788" strokeWidth="1" />
              <text x="40.5" y="-9" fill="#FFFDF7" fontSize="9" fontWeight="bold" textAnchor="middle">
                ({hoverCoord.x}, {hoverCoord.y})
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Slope Calculation Badge for (2, 5) & (5, 14) */}
      {!isSystem && isSlopePoints && (
        <div className="p-3 rounded-xl bg-[#031109]/90 border border-[#E8C97A]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#E8C97A] font-semibold">Slope Calculation:</span>
            <span className="font-mono text-[#FFFDF7]">
              m = Rise / Run = {rise} / {run} = <strong className="text-[#F5E3B3]">{slope}</strong>
            </span>
          </div>
          {simplifiedRun && simplifiedRun !== run && (
            <div className="text-[11px] text-[#A6C4B0] bg-black/40 px-2.5 py-1 rounded-md border border-white/10 font-mono">
              Simplified equivalent ratio: {simplifiedRise}/{simplifiedRun}
            </div>
          )}
        </div>
      )}

      {/* Step progression for Systems / Functions / Slope */}
      {steps && steps.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <span className="text-xs font-semibold text-[#E8C97A] uppercase tracking-wider block">
            Mathematical Derivation
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
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-semibold text-[#FFFDF7]">{st.action}</span>
                      <span className="font-mono text-[11px] text-[#F5E3B3]">
                        <MathRenderer content={st.statement} />
                      </span>
                    </div>
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