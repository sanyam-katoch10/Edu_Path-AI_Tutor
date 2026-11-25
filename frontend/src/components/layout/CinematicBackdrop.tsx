import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface BackdropConfig {
  image: string;
  opacity: string;
  scrim: string;
  sunbeamClass: string;
  showForestEdges?: boolean;
}

const ROUTE_BACKDROPS: Record<string, BackdropConfig> = {
  '/': {
    image: '/backgrounds/bg-home.webp',
    opacity: 'opacity-90',
    scrim:
      'linear-gradient(95deg, rgba(4, 15, 9, 0.86) 0%, rgba(5, 18, 11, 0.62) 38%, rgba(5, 18, 11, 0.22) 70%, rgba(4, 14, 9, 0.48) 100%), linear-gradient(180deg, rgba(4, 14, 9, 0.55) 0%, rgba(4, 14, 9, 0.08) 32%, rgba(4, 14, 9, 0.72) 86%, #040E09 100%)',
    sunbeamClass: 'right-4 top-0 opacity-85',
    showForestEdges: true,
  },
  '/tutor': {
    image: '/backgrounds/bg-studio.webp',
    opacity: 'opacity-90',
    scrim:
      'linear-gradient(90deg, rgba(4, 14, 9, 0.28) 0%, rgba(5, 18, 11, 0.34) 44%, rgba(4, 14, 9, 0.72) 100%), linear-gradient(180deg, rgba(4, 14, 9, 0.62) 0%, rgba(4, 14, 9, 0.14) 38%, rgba(4, 14, 9, 0.86) 100%)',
    sunbeamClass: 'left-10 top-0 opacity-70',
  },
  '/practice': {
    image: '/backgrounds/bg-practice.webp',
    opacity: 'opacity-85',
    scrim:
      'radial-gradient(ellipse 85% 75% at 50% 42%, rgba(8, 28, 18, 0.28) 0%, rgba(4, 14, 9, 0.76) 76%, rgba(4, 11, 7, 0.92) 100%), linear-gradient(180deg, rgba(4, 14, 9, 0.58) 0%, rgba(4, 14, 9, 0.18) 40%, rgba(4, 14, 9, 0.88) 100%)',
    sunbeamClass: 'right-1/4 top-0 opacity-65',
  },
  '/progress': {
    image: '/backgrounds/bg-journey.webp',
    opacity: 'opacity-0',
    scrim:
      'linear-gradient(180deg, rgba(4, 14, 9, 0.88) 0%, rgba(4, 15, 10, 0.82) 50%, rgba(4, 14, 9, 0.96) 100%)',
    sunbeamClass: 'right-12 top-0 opacity-45',
  },
  '/library': {
    image: '/backgrounds/bg-library.webp',
    opacity: 'opacity-0',
    scrim:
      'radial-gradient(ellipse 80% 55% at 50% 18%, rgba(20, 56, 40, 0.28) 0%, rgba(5, 18, 11, 0.96) 72%, #05120B 100%)',
    sunbeamClass: 'left-1/2 -translate-x-1/2 top-0 opacity-25',
  },
};

const SUBTLE_MOTES = [
  { left: '16%', top: '28%', size: 4, delay: '0s', duration: '8.5s' },
  { left: '58%', top: '20%', size: 4, delay: '1.4s', duration: '9.2s' },
  { left: '76%', top: '38%', size: 5, delay: '2.6s', duration: '8s' },
  { left: '34%', top: '66%', size: 3, delay: '0.9s', duration: '10s' },
  { left: '82%', top: '64%', size: 3, delay: '3.2s', duration: '9.5s' },
];

export const CinematicBackdrop: React.FC = () => {
  const { pathname } = useLocation();
  const config = ROUTE_BACKDROPS[pathname] || ROUTE_BACKDROPS['/'];
  const layerRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Subtle layered cursor + scroll parallax for environmental depth
  useEffect(() => {
    if (reducedMotion) return;
    let rafId = 0;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const onMove = (e: MouseEvent) => {
      targetX = ((e.clientX / window.innerWidth) - 0.5) * -14;
      targetY = ((e.clientY / window.innerHeight) - 0.5) * -10;
    };

    const tick = () => {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      const scrollShift = Math.min(window.scrollY * 0.045, 36);
      if (layerRef.current) {
        layerRef.current.style.transform = `translate3d(${curX.toFixed(2)}px, ${(curY - scrollShift).toFixed(2)}px, 0) scale(1.06)`;
      }
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    rafId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  return (
    <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none select-none bg-[#040E09]">
      {/* Per-route optimized local WebP environment with subtle parallax */}
      <div
        ref={layerRef}
        key={config.image}
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 will-change-transform ${config.opacity}`}
        style={{
          backgroundImage: `url(${config.image})`,
          transform: 'scale(1.06)',
        }}
      />

      {/* Directional readability scrim preserving architectural & landscape highlights */}
      <div className="absolute inset-0" style={{ background: config.scrim }} />

      {/* Warm champagne volumetric sunbeams */}
      <div
        className={`absolute w-[860px] h-[640px] hero-sunbeams ${config.sunbeamClass}`}
      />

      {/* Soft misty lower horizon depth */}
      <div
        className="absolute inset-x-0 bottom-0 h-52 opacity-75"
        style={{
          background:
            'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(36, 98, 69, 0.24) 0%, rgba(4, 14, 9, 0) 75%)',
        }}
      />

      {/* Subtle tree silhouette & organic botanical foliage framing outer edges on Home */}
      {config.showForestEdges && (
        <>
          <svg
            viewBox="0 0 320 420"
            className="absolute bottom-0 left-0 w-56 sm:w-80 h-auto opacity-50"
            fill="none"
            aria-hidden="true"
          >
            {/* Distant soft tree trunk & canopy silhouette on far left */}
            <path
              d="M0,420 L0,110 C28,132 48,162 42,208 C64,218 82,248 74,284 C98,302 118,342 112,420 Z"
              fill="#061910"
              opacity="0.85"
            />
            <path
              d="M12,350 C44,322 86,326 116,356 C82,368 44,370 12,350 Z"
              fill="#143D29"
              opacity="0.72"
            />
            <path
              d="M28,286 C64,264 102,272 126,304 C90,310 54,308 28,286 Z"
              fill="#1C5238"
              opacity="0.58"
            />
          </svg>

          <svg
            viewBox="0 0 260 220"
            className="absolute -top-3 -left-3 w-48 sm:w-64 h-auto opacity-45"
            fill="none"
            aria-hidden="true"
          >
            <path d="M14,10 C56,12 88,36 106,68 C70,70 34,52 14,10 Z" fill="#1E583B" opacity="0.75" />
            <path d="M78,4 C118,8 148,28 164,54 C126,56 96,40 78,4 Z" fill="#2A6F4D" opacity="0.65" />
            <path d="M6,68 C42,70 72,92 86,126 C50,124 20,104 6,68 Z" fill="#15402B" opacity="0.85" />
          </svg>
        </>
      )}

      {/* Restrained warm champagne dust motes */}
      {SUBTLE_MOTES.map((mote, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-mote"
          style={{
            left: mote.left,
            top: mote.top,
            width: `${mote.size}px`,
            height: `${mote.size}px`,
            background: 'radial-gradient(circle, #FFF6D6 0%, #E8C97A 55%, transparent 100%)',
            boxShadow: '0 0 10px 1px rgba(232, 201, 122, 0.35)',
            animationDelay: mote.delay,
            animationDuration: mote.duration,
          }}
        />
      ))}
    </div>
  );
};
