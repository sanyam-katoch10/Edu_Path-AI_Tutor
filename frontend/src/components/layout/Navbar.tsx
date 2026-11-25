import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Award,
  RefreshCw,
  BrainCircuit,
  PenTool,
  Route as RouteIcon,
  BookOpen,
  Home,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useSession } from '../../stores/sessionStore';

const NAV_LINKS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/tutor', label: 'AI Studio', icon: BrainCircuit },
  { path: '/practice', label: 'Practice', icon: PenTool },
  { path: '/progress', label: 'Journey', icon: RouteIcon },
  { path: '/library', label: 'Library', icon: BookOpen },
];

/**
 * Miniature Emerald & Champagne-Gold Astrolabe Crest echoing the 3D LearningOrb
 */
const ObservatoryCrest: React.FC = () => (
  <div className="relative w-8 h-8 rounded-full flex items-center justify-center shrink-0">
    {/* Outer emerald jewel housing */}
    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#256647] via-[#103323] to-[#06150E] border border-[#E8C97A]/50 shadow-[0_0_18px_rgba(82,183,136,0.3),inset_0_1px_1px_rgba(255,248,224,0.28)] group-hover:border-[#F5E3B3]/80 group-hover:shadow-[0_0_24px_rgba(232,201,122,0.38)] transition-all duration-500" />

    {/* Concentric rotating outer gold compass ring (separate square SVG so rotation is mathematically centered) */}
    <svg
      viewBox="0 0 32 32"
      className="absolute inset-0 w-full h-full animate-orbit-slow group-hover:[animation-duration:8s] pointer-events-none"
      aria-hidden="true"
    >
      <circle
        cx="16"
        cy="16"
        r="13"
        fill="none"
        stroke="#E8C97A"
        strokeWidth="0.75"
        strokeOpacity="0.52"
        strokeDasharray="14 5 2.5 5"
      />
      <circle cx="16" cy="3" r="1.15" fill="#F8EAC4" />
      <circle cx="16" cy="29" r="0.85" fill="#74C69D" />
    </svg>

    {/* Tilted inner elliptical orbit */}
    <svg
      viewBox="0 0 32 32"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      <ellipse
        cx="16"
        cy="16"
        rx="10"
        ry="4.6"
        transform="rotate(-28 16 16)"
        fill="none"
        stroke="#74C69D"
        strokeWidth="0.8"
        strokeOpacity="0.55"
      />
    </svg>

    {/* Crisp calligraphic π core */}
    <span className="relative z-10 font-editorial text-[15px] font-bold text-[#FFF5D6] drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] group-hover:scale-110 transition-transform duration-300 leading-none pb-0.5">
      π
    </span>
  </div>
);

/**
 * Gossamer champagne-gold & emerald sightline filament bridging adjacent capsules
 */
const BridgeFilament: React.FC = () => (
  <div
    className="hidden lg:flex flex-1 items-center min-w-[14px] max-w-[90px] xl:max-w-none px-1 pointer-events-none select-none"
    aria-hidden="true"
  >
    <span className="w-1 h-1 rotate-45 bg-[#E8C97A]/45 shrink-0" />
    <span className="h-[1px] flex-1 bg-gradient-to-r from-[#E8C97A]/30 via-[#74C69D]/18 to-[#E8C97A]/30" />
    <span className="w-1 h-1 rotate-45 bg-[#E8C97A]/45 shrink-0" />
  </div>
);

/* ═══════════════════════════════════════════════════════════════
 *  Navbar — Sculpted Tri-Capsule Observatory Bridge
 *
 *  Preserves EduPath's frosted emerald glass & champagne-gold
 *  aesthetic while elevating the composition into three height-locked
 *  architectural glass capsules linked by delicate sightline filaments
 *  with spring-gliding route selection.
 * ═══════════════════════════════════════════════════════════════ */
export const Navbar: React.FC = () => {
  const { student, sessionId, loading, createSession } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isOnTutor = location.pathname.startsWith('/tutor');

  const capsuleSurface = scrolled
    ? 'bg-gradient-to-b from-[#0B2318]/94 via-[#071810]/96 to-[#040E09]/98 border-[#E8C97A]/30 shadow-[0_20px_48px_-10px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,248,224,0.18)]'
    : 'bg-gradient-to-b from-[#0C261B]/78 via-[#071A11]/76 to-[#05120B]/84 border-[#E8C97A]/22 shadow-[0_16px_42px_-12px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,248,224,0.14)]';

  return (
    <header className="fixed top-0 inset-x-0 z-[100] pointer-events-none">
      {/* Soft top edge atmospheric readability scrim */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 transition-opacity duration-500"
        style={{
          background:
            'linear-gradient(180deg, rgba(4, 12, 8, 0.72) 0%, rgba(4, 12, 8, 0.24) 55%, rgba(4, 12, 8, 0) 100%)',
          opacity: scrolled ? 0.95 : 0.65,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 sm:pt-4 flex items-center justify-between gap-2 lg:gap-0">
        {/* ── 1. Left Capsule: Brand Astrolabe Tablet ── */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className={`pointer-events-auto relative group flex items-center gap-2.5 p-1.5 pr-4 sm:pr-5 rounded-full backdrop-blur-2xl border transition-all duration-300 cursor-pointer select-none shrink-0 text-left hover:border-[#E8C97A]/45 ${capsuleSurface}`}
        >
          {/* Subtle top specular catchlight */}
          <span className="pointer-events-none absolute top-0 left-5 right-5 h-[1px] bg-gradient-to-r from-transparent via-[#F8EAC4]/45 to-transparent" />

          <ObservatoryCrest />

          <div className="flex flex-col justify-center h-8">
            <span className="font-editorial font-semibold text-[17px] sm:text-[18px] tracking-tight text-[#FFFDF7] group-hover:text-[#F5E3B3] transition-colors leading-none">
              EduPath
            </span>
            <span className="hidden sm:block text-[8.5px] font-mono uppercase tracking-[0.22em] text-[#74C69D]/85 group-hover:text-[#E8C97A]/90 transition-colors leading-none mt-1">
              AI Atelier
            </span>
          </div>
        </button>

        <BridgeFilament />

        {/* ── 2. Center Crown: Sculpted Navigation Dock ── */}
        <nav
          aria-label="Primary Navigation"
          className={`pointer-events-auto hidden lg:flex items-center relative p-1.5 rounded-full backdrop-blur-2xl border transition-all duration-300 shrink-0 ${capsuleSurface}`}
        >
          {/* Top bezel champagne filament reflection */}
          <span className="pointer-events-none absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-[#F8EAC4]/50 to-transparent" />

          {/* Left decorative brass reticle pip */}
          <span className="hidden xl:block w-1 h-1 rounded-full bg-[#E8C97A]/45 ml-2 mr-1 shrink-0" />

          <div className="flex items-center gap-0.5 xl:gap-1">
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className="relative h-8 px-3 xl:px-4 rounded-full flex items-center gap-1.5 xl:gap-2 text-[12px] xl:text-[13px] font-medium transition-colors duration-200 whitespace-nowrap group/item select-none"
                >
                  {/* Spring-gliding emerald crystal capsule behind active item */}
                  {isActive && (
                    <motion.span
                      layoutId="navbar-active-gem"
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 32,
                        mass: 0.85,
                      }}
                      className="absolute inset-0 rounded-full bg-gradient-to-b from-[#236345]/95 via-[#15422D]/95 to-[#0C291C]/98 border border-[#8CDAB2]/45 shadow-[0_6px_22px_-2px_rgba(82,183,136,0.34),inset_0_1px_1px_rgba(255,253,247,0.2)]"
                    >
                      {/* Bottom champagne-gold filament glow */}
                      <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-7 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#F8EAC4] to-transparent shadow-[0_0_10px_#E8C97A]" />
                    </motion.span>
                  )}

                  {/* Soft emerald hover glow for inactive items */}
                  {!isActive && (
                    <span className="absolute inset-0 rounded-full bg-[#194A33]/0 group-hover/item:bg-[#194A33]/45 border border-transparent group-hover/item:border-[#E8C97A]/18 transition-all duration-200" />
                  )}

                  <Icon
                    className={`relative z-10 w-3.5 h-3.5 transition-colors duration-200 ${isActive
                      ? 'text-[#F5E3B3]'
                      : 'text-[#6BA889] group-hover/item:text-[#E8C97A]'
                      }`}
                  />
                  <span
                    className={`relative z-10 transition-colors duration-200 ${isActive
                      ? 'text-[#FFFDF7] font-semibold'
                      : 'text-[#CFCBC0] group-hover/item:text-[#FFFDF7]'
                      }`}
                  >
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </div>

          {/* Right decorative brass reticle pip */}
          <span className="hidden xl:block w-1 h-1 rounded-full bg-[#E8C97A]/45 mr-2 ml-1 shrink-0" />
        </nav>

        <BridgeFilament />

        {/* ── 3. Right Capsule: Telemetry & Action Cluster ── */}
        <div
          className={`pointer-events-auto relative flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-full backdrop-blur-2xl border transition-all duration-300 shrink-0 ${capsuleSurface}`}
        >
          {/* Subtle top specular catchlight */}
          <span className="pointer-events-none absolute top-0 left-5 right-5 h-[1px] bg-gradient-to-r from-transparent via-[#F8EAC4]/40 to-transparent" />

          {/* Recessed Obsidian Telemetry Pill (Engine Status + Adaptive Level) */}
          <div
            className="hidden sm:flex items-center gap-2 h-8 pl-2.5 pr-3 rounded-full bg-[#04100A]/78 border border-white/[0.08] shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]"
            title={
              sessionId
                ? `Live AI Engine Connected · Adaptive Tier: ${student?.level || 'Beginner'}`
                : `Backend Offline · Adaptive Tier: ${student?.level || 'Beginner'}`
            }
          >
            {/* Pulsing status beacon */}
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px]">
              <span className="relative flex h-2 w-2">
                {sessionId && (
                  <span className="animate-ping absolute inset-0 rounded-full bg-[#52B788]/70" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${sessionId
                    ? 'bg-[#52B788] shadow-[0_0_8px_#52B788]'
                    : 'bg-[#E07A5F] shadow-[0_0_8px_#E07A5F]'
                    }`}
                />
              </span>
              <span className="hidden xl:inline text-[#C8C5B8] font-medium">
                {sessionId ? 'Live' : 'Offline'}
              </span>
            </span>

            <span className="hidden md:block w-[1px] h-3 bg-[#E8C97A]/20" />

            {/* Student Adaptive Tier */}
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#F5E3B3]">
              <Award className="w-3.5 h-3.5 text-[#E8C97A]" />
              <span>{student?.level || 'Beginner'}</span>
            </span>
          </div>

          {/* Mobile compact status dot + tier when < sm */}
          <div
            className="sm:hidden flex items-center gap-1.5 h-8 pl-2.5 pr-1.5 text-[10px] font-medium text-[#F5E3B3]"
            title={sessionId ? 'Connected' : 'Offline'}
          >
            <span
              className={`w-2 h-2 rounded-full ${sessionId
                ? 'bg-[#52B788] shadow-[0_0_8px_#52B788]'
                : 'bg-[#E07A5F]'
                }`}
            />
            <span>{student?.level || 'Beginner'}</span>
          </div>

          {/* Reset Session Action */}
          <button
            type="button"
            onClick={() => createSession()}
            disabled={loading}
            title="Reset student session"
            aria-label="Reset student session"
            className="group/reset w-8 h-8 rounded-full flex items-center justify-center bg-[#0B2217]/80 hover:bg-[#17422E] border border-white/[0.09] hover:border-[#E8C97A]/45 text-[#CFCBC0] hover:text-[#F5E3B3] transition-all duration-300 cursor-pointer disabled:opacity-45"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 transition-transform duration-500 ${loading ? 'animate-spin' : 'group-hover/reset:rotate-180'
                }`}
            />
          </button>

          {/* Primary Champagne Gold CTA */}
          <button
            type="button"
            onClick={() => navigate(isOnTutor ? '/practice' : '/tutor')}
            className="hidden sm:inline-flex items-center gap-1.5 h-8 relative overflow-hidden px-3.5 xl:px-4 rounded-full text-xs font-semibold btn-champagne transition-all duration-300 cursor-pointer group/cta"
          >
            {/* Satin light sweep across gold button on hover */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover/cta:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/45 to-transparent skew-x-[-20deg]" />

            {isOnTutor ? (
              <>
                <PenTool className="relative z-10 w-3 h-3" />
                <span className="relative z-10">Practice</span>
              </>
            ) : (
              <>
                <Sparkles className="relative z-10 w-3 h-3" />
                <span className="relative z-10">Get Started</span>
              </>
            )}
            <ArrowRight className="relative z-10 w-3 h-3 opacity-75 group-hover/cta:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
};
