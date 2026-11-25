import React, { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AdaptiveDpr, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export interface WorldCanvasProps {
  children: ReactNode;
  className?: string;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  fov?: number;
  fogColor?: string;
  fogNear?: number;
  fogFar?: number;
  backgroundColor?: string;
  enableParallax?: boolean;
  parallaxStrength?: number;
  enableOrbit?: boolean;
  enableZoom?: boolean;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  minAzimuthAngle?: number;
  maxAzimuthAngle?: number;
  minDistance?: number;
  maxDistance?: number;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  loadingLabel?: string;
  ariaLabel?: string;
}

function isWebGLSupported(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WorldErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[EduPath 3D World] Falling back gracefully:', error.message);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/* Smooth, restrained camera parallax that preserves user focus and never induces motion sickness */
function GentleCameraRig({
  basePosition,
  target,
  enabled,
  strength,
}: {
  basePosition: [number, number, number];
  target: [number, number, number];
  enabled: boolean;
  strength: number;
}) {
  const pointer = useRef({ x: 0, y: 0 });
  const lookVec = useRef(new THREE.Vector3(...target));

  useEffect(() => {
    lookVec.current.set(...target);
  }, [target]);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [enabled]);

  useFrame((state, delta) => {
    const t = Math.min(delta * 2.4, 0.08);
    const desiredX = basePosition[0] + (enabled ? pointer.current.x * strength : 0);
    const desiredY = basePosition[1] + (enabled ? -pointer.current.y * (strength * 0.55) : 0);
    const cam = state.camera;
    cam.position.set(
      THREE.MathUtils.lerp(cam.position.x, desiredX, t),
      THREE.MathUtils.lerp(cam.position.y, desiredY, t),
      THREE.MathUtils.lerp(cam.position.z, basePosition[2], t)
    );
    cam.lookAt(lookVec.current);
  });

  return null;
}

function StaticFallback({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-[#071A11] to-[#040F09] text-[#FFFDF7]">
      <span className="text-[11px] font-mono uppercase tracking-widest text-[#E8C97A] mb-2">
        Interactive 3D Environment
      </span>
      <h3 className="font-editorial text-2xl font-semibold text-[#FFFDF7]">{title}</h3>
      <p className="text-xs sm:text-sm text-[#C6C3B7] max-w-md mt-2 leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}

export const WorldCanvas: React.FC<WorldCanvasProps> = ({
  children,
  className = '',
  cameraPosition = [0, 6, 18],
  cameraTarget = [0, 1, 0],
  fov = 42,
  fogColor = '#05150D',
  fogNear = 18,
  fogFar = 58,
  backgroundColor = '#05150D',
  enableParallax = true,
  parallaxStrength = 0.9,
  enableOrbit = false,
  enableZoom = false,
  minPolarAngle = Math.PI * 0.22,
  maxPolarAngle = Math.PI * 0.48,
  minAzimuthAngle = -Math.PI * 0.25,
  maxAzimuthAngle = Math.PI * 0.25,
  minDistance = 8,
  maxDistance = 26,
  fallbackTitle = 'EduPath 3D Environment',
  fallbackSubtitle = 'WebGL is unavailable on this device. All learning controls remain fully accessible below.',
  loadingLabel = 'Loading 3D environment...',
  ariaLabel = 'Interactive 3D mathematical learning environment',
}) => {
  const [webGL] = useState<boolean>(() => isWebGLSupported());
  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const fallbackNode = <StaticFallback title={fallbackTitle} subtitle={fallbackSubtitle} />;

  if (!webGL) {
    return <div className={`relative w-full h-full ${className}`}>{fallbackNode}</div>;
  }

  return (
    <div
      className={`relative w-full h-full select-none ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      <WorldErrorBoundary fallback={fallbackNode}>
        <Suspense
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#05150D] text-[#E8C97A] gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#E8C97A]/30 border-t-[#E8C97A] animate-spin" />
              <span className="text-xs font-mono tracking-wider uppercase">{loadingLabel}</span>
            </div>
          }
        >
          <Canvas
            shadows
            dpr={[1, 1.25]}
            performance={{ min: 0.5 }}
            camera={{ position: cameraPosition, fov, near: 0.2, far: 140 }}
            style={{ touchAction: enableOrbit ? 'none' : 'pan-y' }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance',
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.15,
            }}
          >
            <AdaptiveDpr pixelated={false} />
            <color attach="background" args={[backgroundColor]} />
            <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

            {/* Offline procedural HDR reflections — zero network latency */}
            <Environment resolution={256} frames={1}>
              <Lightformer
                form="rect"
                intensity={2.6}
                color="#FFF0C8"
                scale={[14, 8, 1]}
                position={[6, 12, 8]}
                target={[0, 0, 0]}
              />
              <Lightformer
                form="circle"
                intensity={3.6}
                color="#F8DDA0"
                scale={6}
                position={[10, 8, -10]}
                target={[0, 0, 0]}
              />
              <Lightformer
                form="rect"
                intensity={1.8}
                color="#40916C"
                scale={[12, 10, 1]}
                position={[-12, 4, 4]}
                target={[0, 0, 0]}
              />
              <Lightformer
                form="ring"
                intensity={1.6}
                color="#74C69D"
                scale={10}
                position={[0, 4, -14]}
                target={[0, 0, 0]}
              />
              <Lightformer
                form="rect"
                intensity={0.9}
                color="#B08968"
                scale={[16, 10, 1]}
                position={[0, -8, 4]}
                target={[0, 0, 0]}
              />
            </Environment>

            {enableOrbit ? (
              <OrbitControls
                makeDefault
                target={cameraTarget}
                enablePan={false}
                enableZoom={enableZoom}
                enableDamping
                dampingFactor={0.06}
                minPolarAngle={minPolarAngle}
                maxPolarAngle={maxPolarAngle}
                minAzimuthAngle={minAzimuthAngle}
                maxAzimuthAngle={maxAzimuthAngle}
                minDistance={minDistance}
                maxDistance={maxDistance}
                rotateSpeed={0.55}
                zoomSpeed={0.6}
              />
            ) : enableParallax ? (
              <GentleCameraRig
                basePosition={cameraPosition}
                target={cameraTarget}
                enabled={!reducedMotion}
                strength={parallaxStrength}
              />
            ) : null}

            <Suspense fallback={null}>{children}</Suspense>
          </Canvas>
        </Suspense>
      </WorldErrorBoundary>
    </div>
  );
};
