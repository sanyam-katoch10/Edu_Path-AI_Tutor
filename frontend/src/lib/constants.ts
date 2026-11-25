export const TOPIC_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  linear_equations: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  multi_variable: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  equation_behavior: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  systems: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  inequalities: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  functions: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  slope: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  exponents: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  polynomials: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  foundations: { bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-200' },
  general_algebra: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

export const LEVEL_CONFIG: Record<string, { color: string; bg: string; stars: number }> = {
  Beginner: { color: 'text-emerald-600', bg: 'bg-emerald-50', stars: 1 },
  Intermediate: { color: 'text-amber-600', bg: 'bg-amber-50', stars: 2 },
  Advanced: { color: 'text-violet-600', bg: 'bg-violet-50', stars: 3 },
};

export const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
    ? 'http://127.0.0.1:8000'
    : '');

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/tutor', label: 'AI Tutor', icon: 'BrainCircuit' },
  { path: '/practice', label: 'Practice', icon: 'PenTool' },
  { path: '/progress', label: 'Progress', icon: 'TrendingUp' },
  { path: '/library', label: 'Library', icon: 'BookOpen' },
] as const;
