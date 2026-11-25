import React, { Suspense, useEffect, useState, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import './three.css';

export interface SceneContainerProps {
  children: ReactNode;
  className?: string;
  cameraPosition?: [number, number, number];
  fov?: number;
  shadows?: boolean;
  contactShadowColor?: string;
  contactShadowOpacity?: number;
  enableTilt?: boolean;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  minHeight?: string;
  showContactShadows?: boolean;
}

/* ───────────────────────────────────────────────────────────────
 *  WebGL availability check
 * ─────────────────────────────────────────────────────────────── */
function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')),
    );
  } catch {
    return false;
  }
}

/* ───────────────────────────────────────────────────────────────
 *  Gentle parallax tilt rig — smooth lerp mouse tracking
 * ─────────────────────────────────────────────────────────────── */
function ParallaxRig({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      target.current = { x: y * 0.1, y: x * 0.15 };
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [enabled]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const speed = Math.min(delta * 2.2, 0.08);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      target.current.x,
      speed,
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      target.current.y,
      speed,
    );
  });

  return <group ref={groupRef}>{children}</group>;
}

/* ═══════════════════════════════════════════════════════════════
 *  SceneContainer — Cinematic Studio 3D Canvas Wrapper
 * ═══════════════════════════════════════════════════════════════ */
export const SceneContainer: React.FC<SceneContainerProps> = ({
  children,
  className = '',
  cameraPosition = [0, 0.4, 4.2],
  fov = 42,
  shadows = true,
  contactShadowColor = '#04120B',
  contactShadowOpacity = 0.55,
  enableTilt = true,
  fallbackTitle = 'EduPath 3D Interactive Space',
  fallbackSubtitle = 'Visualizing foundational algebra concepts in 3D.',
  minHeight = '320px',
  showContactShadows = true,
}) => {
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    setWebGLSupported(isWebGLAvailable());

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (event: MediaQueryListEvent) =>
      setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  if (!webGLSupported) {
    return (
      <div className={`edupath-scene-container ${className}`} style={{ minHeight }}>
        <div className="edupath-3d-fallback">
          <div className="edupath-fallback-icon-pulse">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
          </div>
          <span className="edupath-fallback-badge">Interactive Module</span>
          <h3 className="edupath-fallback-title">{fallbackTitle}</h3>
          <p className="edupath-fallback-desc">{fallbackSubtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`edupath-scene-container ${className}`} style={{ minHeight }}>
      <div className="edupath-canvas-wrapper">
        <Canvas
          shadows={shadows}
          camera={{ position: cameraPosition, fov }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.18,
          }}
        >
          {/* ── Procedural Studio HDR Environment (Offline, Zero-Latency Reflections) ── */}
          <Environment resolution={256} frames={1}>
            {/* Warm champagne-gold overhead softbox */}
            <Lightformer
              form="rect"
              intensity={3.2}
              color="#FFF1D0"
              scale={[8, 4, 1]}
              position={[2, 5, 3]}
              target={[0, 0, 0]}
            />
            {/* Key specular strip on upper right for glass & gold gleam */}
            <Lightformer
              form="circle"
              intensity={4.5}
              color="#FFE5A3"
              scale={2.5}
              position={[4, 3, 4]}
              target={[0, 0, 0]}
            />
            {/* Rich emerald fill panel on left */}
            <Lightformer
              form="rect"
              intensity={2.2}
              color="#52B788"
              scale={[6, 6, 1]}
              position={[-5, 1, 2]}
              target={[0, 0, 0]}
            />
            {/* Deep jade rim panel behind */}
            <Lightformer
              form="ring"
              intensity={2.6}
              color="#74C69D"
              scale={5}
              position={[0, 2, -5]}
              target={[0, 0, 0]}
            />
            {/* Warm bounce strip below */}
            <Lightformer
              form="rect"
              intensity={1.4}
              color="#D4A373"
              scale={[8, 4, 1]}
              position={[0, -4, 2]}
              target={[0, 0, 0]}
            />
          </Environment>

          {/* ── Studio Lighting Rig ── */}
          <ambientLight intensity={0.45} color="#E8F5EE" />

          {/* Warm champagne key light */}
          <directionalLight
            position={[4.5, 6.5, 4.5]}
            intensity={2.1}
            color="#FFF4D6"
            castShadow={shadows}
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0002}
          />

          {/* Emerald studio fill */}
          <directionalLight position={[-4.5, 2.5, 1]} intensity={0.9} color="#74C69D" />

          {/* Champagne rim accent */}
          <pointLight position={[2.5, 2.5, -2.5]} intensity={2.2} color="#F5D08A" distance={10} decay={2} />

          {/* Soft emerald under-glow */}
          <pointLight position={[-2, -2.2, 2]} intensity={1.1} color="#40916C" distance={8} decay={2} />

          <Suspense fallback={null}>
            <ParallaxRig enabled={enableTilt && !prefersReducedMotion}>
              {children}
            </ParallaxRig>

            {showContactShadows && (
              <ContactShadows
                position={[0, -1.35, 0]}
                opacity={contactShadowOpacity}
                scale={6}
                blur={2.4}
                far={4}
                color={contactShadowColor}
              />
            )}
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
};
