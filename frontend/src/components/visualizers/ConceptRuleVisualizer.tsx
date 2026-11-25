import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { ParsedConceptRule } from '../../lib/practiceModel';
import { MathRenderer } from '../ui/MathRenderer';

interface ConceptRuleVisualizerProps {
  model: ParsedConceptRule;
}

export const ConceptRuleVisualizer: React.FC<ConceptRuleVisualizerProps> = ({ model }) => {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  const formatMath = (str: string) => {
    if (str.includes('$') || str.includes('\\')) {
      return str.startsWith('$') ? str : `$${str}$`;
    }
    return `$${str}$`;
  };

  return (
    <div className="w-full rounded-2xl bg-[#06150F]/90 border border-[#52B788]/25 p-5 sm:p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#E6C794] uppercase flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#F5E6BE]" />
            Algebraic Principle · Concept Lab
          </span>
          <h4 className="text-base font-bold text-[#FFFDF7] mt-0.5 font-editorial">
            {model.ruleTitle}
          </h4>
        </div>

        <span className="px-3 py-1 rounded-full bg-[#133827]/90 border border-[#74C69D]/35 text-[11px] font-semibold text-[#B7E4C7] self-start sm:self-auto">
          {model.topic}
        </span>
      </div>

      {/* Governing Formula Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#031109]/95 border border-[#E8C97A]/28 shadow-inner flex flex-col items-center justify-center text-center space-y-2">
        <span className="text-[10px] font-mono font-bold text-[#E8C97A] uppercase tracking-wider">
          Universal Algebraic Rule
        </span>
        <div className="py-1 px-4 rounded-xl bg-black/40 border border-white/10">
          <MathRenderer
            content={formatMath(model.formula)}
            className="text-base sm:text-lg font-bold text-[#F5E3B3]"
          />
        </div>
        <p className="text-xs text-[#D8D4C7] max-w-md leading-relaxed">
          {model.explanation}
        </p>
      </div>

      {/* Step Progression */}
      <div className="space-y-2 pt-2">
        <span className="text-xs font-semibold text-[#E8C97A] uppercase tracking-wider block">
          Guided Problem-Solving Methodology
        </span>
        <div className="space-y-2">
          {model.steps.map((st, idx) => {
            const isActive = activeStepIdx === idx;
            return (
              <div
                key={idx}
                onClick={() => setActiveStepIdx(idx)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                  isActive
                    ? 'bg-[#153D2A]/90 border-[#E8C97A] text-[#FFFDF7] shadow-[0_0_14px_rgba(232,201,122,0.18)]'
                    : 'bg-black/30 border-white/8 text-[#A8A69B] hover:text-[#FFFDF7]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                    isActive
                      ? 'bg-[#E8C97A] text-[#091B12]'
                      : 'bg-white/10 text-white/50 border border-white/15'
                  }`}
                >
                  {st.stepNumber}
                </span>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-semibold text-[#FFFDF7]">{st.action}</span>
                    <span className="font-mono text-xs text-[#F5E3B3] bg-black/30 px-2 py-0.5 rounded border border-white/8 self-start sm:self-auto">
                      <MathRenderer content={formatMath(st.statement)} />
                    </span>
                  </div>
                  <p className="text-[11px] text-[#CFCBC0] leading-relaxed">{st.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};