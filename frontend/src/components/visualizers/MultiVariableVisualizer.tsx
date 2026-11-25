import React, { useState } from 'react';
import { Sparkles, Check, CheckCircle2 } from 'lucide-react';
import type { ParsedMultiVariable } from '../../lib/practiceModel';
import { EquationBalanceScale } from './EquationBalanceScale';
import { MathRenderer } from '../ui/MathRenderer';

interface MultiVariableVisualizerProps {
  model: ParsedMultiVariable;
}

export const MultiVariableVisualizer: React.FC<MultiVariableVisualizerProps> = ({ model }) => {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [showScale, setShowScale] = useState<boolean>(true);

  return (
    <div className="w-full rounded-2xl bg-[#06150F]/90 border border-[#52B788]/25 p-5 sm:p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#E6C794] uppercase flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#F5E6BE]" />
            Multi-Variable Guided Methodology · Substitution Lab
          </span>
          <h4 className="text-base font-bold text-[#FFFDF7] mt-0.5 font-mono">
            {model.rawEquation}
          </h4>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono">
          <span className="px-3 py-1 rounded-full bg-[#133827]/90 border border-[#74C69D]/35 text-[#B7E4C7]">
            Known: <strong className="text-[#FFFDF7]">{model.knownVar} = {model.knownVal}</strong>
          </span>
          <span className="px-3 py-1 rounded-full bg-[#2A2311]/90 border border-[#E8C97A]/40 text-[#F5E3B3]">
            Target: <strong className="text-[#FFFDF7]">{model.targetVar} = {model.targetVal}</strong>
          </span>
        </div>
      </div>

      {/* Primary Mathematical Progression Overview */}
      <div className="p-3.5 rounded-xl bg-[#031109]/95 border border-[#E8C97A]/25 space-y-2">
        <span className="text-[10px] font-mono font-bold text-[#E8C97A] uppercase tracking-wider block">
          Step Transformation Progression
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex flex-col justify-between">
            <span className="text-[10px] text-[#A6A49C] block mb-1">1. Substituted</span>
            <span className="text-[#F5E3B3] font-semibold">{model.substEquation}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex flex-col justify-between">
            <span className="text-[10px] text-[#A6A49C] block mb-1">2. Simplified</span>
            <span className="text-[#B7E4C7] font-semibold">{model.simplifiedEquation}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#143525]/80 border border-[#52B788]/40 flex flex-col justify-between">
            <span className="text-[10px] text-[#95D5B2] block mb-1">3. Solved & Verified</span>
            <span className="text-[#FFFDF7] font-bold flex items-center justify-between">
              <span>{model.isolatedEquation}</span>
              <Check className="w-3.5 h-3.5 text-[#52B788]" />
            </span>
          </div>
        </div>
      </div>

      {/* Guided 6-Step Methodology Cards */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#E8C97A] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#F5E3B3]" />
            Guided 6-Step Methodology
          </span>
          <span className="text-[11px] font-mono text-[#D6D3C7]">
            Step {activeStepIdx + 1} of {model.steps.length}
          </span>
        </div>

        <div className="space-y-2">
          {model.steps.map((st, idx) => {
            const isActive = activeStepIdx === idx;
            const isCompleted = idx < activeStepIdx;
            return (
              <div
                key={idx}
                onClick={() => setActiveStepIdx(idx)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                  isActive
                    ? 'bg-[#153D2A]/90 border-[#E8C97A] text-[#FFFDF7] shadow-[0_0_16px_rgba(232,201,122,0.2)] ring-1 ring-[#F8EAC4]'
                    : isCompleted
                    ? 'bg-[#0B2519]/75 border-[#52B788]/40 text-[#C7F5DC]'
                    : 'bg-black/30 border-white/8 text-[#A8A69B] hover:text-[#FFFDF7]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                    isActive
                      ? 'bg-[#E8C97A] text-[#091B12]'
                      : isCompleted
                      ? 'bg-[#52B788] text-[#05120B]'
                      : 'bg-white/10 text-white/50 border border-white/15'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : st.stepNumber}
                </span>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-semibold text-[#FFFDF7]">{st.action}</span>
                    <span className="font-mono text-xs text-[#F5E3B3] bg-black/40 px-2 py-0.5 rounded border border-white/10 self-start sm:self-auto">
                      <MathRenderer content={st.statement} />
                    </span>
                  </div>
                  <p className="text-[11px] text-[#CFCBC0] leading-relaxed">{st.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verification Summary Card */}
      <div className="p-3.5 rounded-xl bg-[#04120A]/90 border border-[#52B788]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-[#95D5B2] font-semibold">
          <CheckCircle2 className="w-4 h-4 text-[#74F0B0]" />
          <span>Equivalence Verification:</span>
        </div>
        <div className="font-mono text-xs text-[#F5E3B3]">
          <MathRenderer content={model.verificationText} />
        </div>
      </div>

      {/* Substituted Balance Scale Toggle & Component */}
      {model.linearModel && (
        <div className="pt-3 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#E8C97A] uppercase tracking-wider">
              Post-Substitution Balance Scale ({model.simplifiedEquation})
            </span>
            <button
              type="button"
              onClick={() => setShowScale(!showScale)}
              className="text-xs text-[#95D5B2] hover:text-[#FFFDF7] underline cursor-pointer"
            >
              {showScale ? 'Hide Scale' : 'Show Scale'}
            </button>
          </div>

          {showScale && (
            <EquationBalanceScale
              parsedModel={model.linearModel}
              targetX={model.targetVal}
              compact={true}
            />
          )}
        </div>
      )}
    </div>
  );
};