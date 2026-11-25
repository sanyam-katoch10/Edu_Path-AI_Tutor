import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface LearningOrbProps {
  status?: 'idle' | 'thinking' | 'explaining';
  size?: 'sm' | 'md' | 'lg';
  coreColor?: string;
  haloColor?: string;
  interactive?: boolean;
  showHalo?: boolean;
  scale?: number;
  position?: [number, number, number];
}

/* ═══════════════════════════════════════════════════════════════
 *  ✦ THE ENCHANTED PROPHECY ORB ✦
 *  Ultra-Premium Divination & Knowledge Crystal
 *
 *  - Animated GLSL swirling prophecy-mist nebula inside blown crystal
 *    (smoothly transitions color, brightness & turbulence across
 *     idle / thinking / explaining with ZERO shader leaks)
 *  - Sculpted 4-claw antique-brass gothic scroll cradle sweeping up
 *    from an octagonal obsidian & engraved-brass plinth
 *  - Counter-rotating etched astronomical Time-Turner gimbal rings
 *  - Soft 4-point starlight motes swirling inside & around the glass
 * ═══════════════════════════════════════════════════════════════ */

const SCALE_MAP = { sm: 0.44, md: 0.6, lg: 0.68 };

/* ───────────────────────────────────────────────────────────────
 *  Parametric Swirling Luminous Energy Filament
 * ─────────────────────────────────────────────────────────────── */
function createEnergyWaveGeometry(
  radius: number,
  turns: number,
  amplitude: number,
  tubeRadius: number,
  phaseOffset = 0,
) {
  const points: THREE.Vector3[] = [];
  const count = 100;
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const angle = (t - 0.5) * Math.PI * 1.85;
    const x = Math.sin(angle) * radius * 0.9;
    const y = Math.sin(t * Math.PI * turns + phaseOffset) * amplitude * Math.cos(angle * 0.5);
    const z = Math.cos(angle * 1.4 + phaseOffset) * radius * 0.45 * Math.sin(t * Math.PI);
    points.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, 100, tubeRadius, 12, false);
}

/* ───────────────────────────────────────────────────────────────
 *  Sculpted Sweeping Gothic Brass Cradle Prong Geometry
 *  (One of 4 elegant curved claws rising from the pedestal)
 * ─────────────────────────────────────────────────────────────── */
function createCradleProngGeometry(): THREE.TubeGeometry {
  const pts = [
    new THREE.Vector3(0.68, 0.08, 0),
    new THREE.Vector3(0.92, 0.24, 0),
    new THREE.Vector3(1.06, 0.58, 0),
    new THREE.Vector3(1.04, 0.94, 0),
    new THREE.Vector3(0.96, 1.12, 0),
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, 32, 0.038, 12, false);
}

/* ───────────────────────────────────────────────────────────────
 *  Custom Animated GLSL Swirling Prophecy-Mist Nebula Shader
 *  (Hall-of-Prophecy curling smoke ribbons inside the crystal)
 * ─────────────────────────────────────────────────────────────── */
function createProphecyMistMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPrimaryColor: { value: new THREE.Color('#4AE6A2') },
      uSecondaryColor: { value: new THREE.Color('#D8FFF0') },
      uIntensity: { value: 1.0 },
    },
    vertexShader: `
      varying vec3 vPos;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vPos = position;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uPrimaryColor;
      uniform vec3 uSecondaryColor;
      uniform float uIntensity;
      varying vec3 vPos;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      // Smooth 3D trigonometric billowing mist (fast, WebGL1/2 clean)
      float swirl(vec3 p, float t) {
        float w1 = sin(p.x * 3.8 + t * 1.1 + cos(p.y * 3.2 - t * 0.8));
        float w2 = cos(p.y * 4.4 - t * 0.9 + sin(p.z * 3.6 + t * 0.7));
        float w3 = sin((p.x + p.z) * 3.1 + t * 0.65 - cos(p.y * 2.6 + t * 0.5));
        return (w1 + w2 + w3) / 3.0;
      }

      void main() {
        vec3 p = normalize(vPos) * 1.45;
        float n1 = swirl(p, uTime * 0.85);
        float n2 = swirl(p * 1.85 + vec3(n1 * 0.55), -uTime * 0.6);
        float mist = smoothstep(-0.35, 0.78, n1 * 0.55 + n2 * 0.45);
        float wisp = pow(clamp(mist, 0.0, 1.0), 1.65);

        float ndv = max(dot(normalize(vViewDir), normalize(vNormal)), 0.0);
        float rimFade = smoothstep(0.05, 0.75, ndv);

        vec3 col = mix(uPrimaryColor, uSecondaryColor, smoothstep(0.35, 0.92, wisp));
        float alpha = wisp * rimFade * 0.62 * uIntensity;
        gl_FragColor = vec4(col * (1.15 + wisp * 0.65), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
}

/* ───────────────────────────────────────────────────────────────
 *  Fresnel Crystal Caustic Rim Shader (smoothly uniform-updated)
 * ─────────────────────────────────────────────────────────────── */
function createFresnelMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color('#74F0B0') },
      uIntensity: { value: 0.78 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.7);
        gl_FragColor = vec4(uColor, fresnel * uIntensity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
}

/* ───────────────────────────────────────────────────────────────
 *  Procedural Etched Brass Astrolabe Band Texture
 * ─────────────────────────────────────────────────────────────── */
function createEtchedBandTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createLinearGradient(0, 0, 0, 96);
  grad.addColorStop(0, '#A87D2D');
  grad.addColorStop(0.25, '#F2D488');
  grad.addColorStop(0.5, '#D8AD50');
  grad.addColorStop(0.75, '#EFC974');
  grad.addColorStop(1, '#8E6720');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 96);

  ctx.fillStyle = 'rgba(38, 24, 8, 0.6)';
  ctx.fillRect(0, 10, 1024, 4);
  ctx.fillRect(0, 82, 1024, 4);

  const glyphs = ['✦', 'π', '☽', 'φ', '✦', '∑', '☀', '∞', '✦', 'Δ', '☽', '∫', '✦', 'θ', '☀', 'Ω'];
  ctx.fillStyle = 'rgba(32, 18, 5, 0.85)';
  ctx.font = 'bold 28px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  glyphs.forEach((g, i) => {
    ctx.fillText(g, ((i + 0.5) / glyphs.length) * 1024, 48);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/* ───────────────────────────────────────────────────────────────
 *  Procedural Glowing Prophecy Pedestal Sigil Dish Texture
 * ─────────────────────────────────────────────────────────────── */
function createPedestalRuneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 256, 256);
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 120);
  g.addColorStop(0, 'rgba(128, 248, 190, 0.55)');
  g.addColorStop(0.6, 'rgba(248, 212, 122, 0.28)');
  g.addColorStop(1, 'rgba(248, 212, 122, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(255, 228, 148, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(128, 128, 108, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(128, 248, 190, 0.72)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(128, 128, 82, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(a) * 82, 128 + Math.sin(a) * 82);
    ctx.lineTo(128 + Math.cos(a) * 108, 128 + Math.sin(a) * 108);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ───────────────────────────────────────────────────────────────
 *  Procedural Hall-of-Prophecy Shelf Nameplate Texture
 * ─────────────────────────────────────────────────────────────── */
function createProphecyPlaqueTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createLinearGradient(0, 0, 512, 160);
  grad.addColorStop(0, '#30220E');
  grad.addColorStop(0.5, '#1F1609');
  grad.addColorStop(1, '#30220E');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = '#E8C46A';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 140);
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, 472, 120);

  ctx.fillStyle = '#FCE6A4';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦  PROPHECY  ✦', 256, 76);

  ctx.fillStyle = '#D9B25A';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText('Row XCII · π · ∞', 256, 118);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ───────────────────────────────────────────────────────────────
 *  Soft 4-Point Starlight Sparkle Sprite Texture
 * ─────────────────────────────────────────────────────────────── */
function createGlowDotTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.22, 'rgba(232, 255, 242, 0.9)');
    grad.addColorStop(0.55, 'rgba(88, 210, 152, 0.35)');
    grad.addColorStop(1, 'rgba(88, 210, 152, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    ctx.fillStyle = 'rgba(255, 252, 232, 0.8)';
    ctx.beginPath();
    ctx.moveTo(32, 6);
    ctx.lineTo(34, 30);
    ctx.lineTo(58, 32);
    ctx.lineTo(34, 34);
    ctx.lineTo(32, 58);
    ctx.lineTo(30, 34);
    ctx.lineTo(6, 32);
    ctx.lineTo(30, 30);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createMotePositions(count: number, minR: number, maxR: number) {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = minR + Math.random() * (maxR - minR);
    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    arr[i * 3 + 2] = r * Math.cos(phi);
  }
  return arr;
}

/* ═══════════════════════════════════════════════════════════════
 *  ✦ LEARNING ORB COMPONENT ✦
 * ═══════════════════════════════════════════════════════════════ */
export const LearningOrb: React.FC<LearningOrbProps> = ({
  status = 'idle',
  size = 'md',
  coreColor = '#2D6A4F',
  haloColor = '#D4A373',
  interactive = true,
  showHalo = true,
  scale: customScale,
  position = [0, 0, 0],
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const orbGroupRef = useRef<THREE.Group>(null);
  const waveGroupRef = useRef<THREE.Group>(null);
  const mistMeshRef = useRef<THREE.Mesh>(null);
  const innerMistMeshRef = useRef<THREE.Mesh>(null);
  const wispsRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const innerLightRef = useRef<THREE.PointLight>(null);
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const ring3Ref = useRef<THREE.Group>(null);
  const motesRef = useRef<THREE.Points>(null);
  const outerMotesRef = useRef<THREE.Points>(null);
  const runeDishRef = useRef<THREE.Mesh>(null);

  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const baseScale = (customScale || 1.0) * SCALE_MAP[size];

  /* ── Geometries & Textures (created once, zero leaks on status change) ── */
  const wave1Geom = useMemo(() => createEnergyWaveGeometry(0.76, 2.2, 0.25, 0.032, 0), []);
  const wave2Geom = useMemo(() => createEnergyWaveGeometry(0.72, 2.5, 0.21, 0.019, Math.PI), []);
  const wave3Geom = useMemo(() => createEnergyWaveGeometry(0.62, 1.8, 0.28, 0.013, Math.PI * 0.5), []);
  const wave4Geom = useMemo(() => createEnergyWaveGeometry(0.54, 3.0, 0.16, 0.011, Math.PI * 1.3), []);
  const prongGeom = useMemo(() => createCradleProngGeometry(), []);
  const innerMotePositions = useMemo(() => createMotePositions(85, 0.14, 0.78), []);
  const outerMotePositions = useMemo(() => createMotePositions(52, 1.05, 1.55), []);
  const glowTexture = useMemo(() => createGlowDotTexture(), []);
  const bandTexture = useMemo(() => createEtchedBandTexture(), []);
  const runeDishTex = useMemo(() => createPedestalRuneTexture(), []);
  const plaqueTex = useMemo(() => createProphecyPlaqueTexture(), []);

  /* ── Materials (stable across status transitions — mutated smoothly in useFrame!) ── */
  const crystalGlassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#88DFB4',
        roughness: 0.04,
        metalness: 0.04,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        specularIntensity: 1.25,
        specularColor: new THREE.Color('#FFF8E4'),
        envMapIntensity: 1.75,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      }),
    [],
  );

  const prophecyMistMat = useMemo(() => createProphecyMistMaterial(), []);
  const fresnelRimMat = useMemo(() => createFresnelMaterial(), []);

  const innerNebulaMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: coreColor,
        emissive: new THREE.Color('#2DC67A'),
        emissiveIntensity: 0.95,
        roughness: 0.28,
        transparent: true,
        opacity: 0.44,
        depthWrite: false,
      }),
    [coreColor],
  );

  const primaryWaveMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#EAFFF2',
        emissive: new THREE.Color('#6FFFB0'),
        emissiveIntensity: 2.3,
        roughness: 0.08,
        transparent: true,
        opacity: 0.92,
      }),
    [],
  );

  const secondaryWaveMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#C2F7D8',
        emissive: new THREE.Color('#34D399'),
        emissiveIntensity: 1.7,
        roughness: 0.12,
        transparent: true,
        opacity: 0.8,
      }),
    [],
  );

  const goldenWaveMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FFF5D4',
        emissive: new THREE.Color('#F5C45E'),
        emissiveIntensity: 1.5,
        roughness: 0.1,
        transparent: true,
        opacity: 0.68,
      }),
    [],
  );

  const goldRingMat = useMemo(() => {
    const baseGold = new THREE.Color(haloColor).lerp(new THREE.Color('#F3D078'), 0.55);
    return new THREE.MeshPhysicalMaterial({
      color: baseGold,
      emissive: baseGold,
      emissiveIntensity: 0.26,
      roughness: 0.15,
      metalness: 0.95,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.65,
    });
  }, [haloColor]);

  const etchedBandMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: bandTexture,
        emissive: new THREE.Color('#9A7022'),
        emissiveIntensity: 0.2,
        roughness: 0.22,
        metalness: 0.92,
        clearcoat: 0.65,
        side: THREE.DoubleSide,
      }),
    [bandTexture],
  );

  const pedestalStoneMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#0D291C',
        roughness: 0.22,
        metalness: 0.18,
        clearcoat: 0.78,
        clearcoatRoughness: 0.14,
        envMapIntensity: 1.2,
      }),
    [],
  );

  const runeDishMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: runeDishTex,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [runeDishTex],
  );

  const plaqueMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: plaqueTex,
        roughness: 0.34,
        metalness: 0.72,
      }),
    [plaqueTex],
  );

  const moteMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: glowTexture,
        color: '#B8FFD8',
        size: 0.085,
        transparent: true,
        opacity: 0.92,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [glowTexture],
  );

  const outerMoteMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: glowTexture,
        color: '#FFE59A',
        size: 0.095,
        transparent: true,
        opacity: 0.78,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [glowTexture],
  );

  /* ── Reusable Target Colors (zero per-frame allocations) ── */
  const colorTargets = useMemo(
    () => ({
      mistPrimaryIdle: new THREE.Color('#38D894'),
      mistPrimaryThink: new THREE.Color('#68FFBE'),
      mistPrimaryExplain: new THREE.Color('#F2B84B'),
      mistSecIdle: new THREE.Color('#D4FFF0'),
      mistSecThink: new THREE.Color('#FFF6CC'),
      mistSecExplain: new THREE.Color('#FFF0BD'),
      fresnelEmerald: new THREE.Color('#74F0B0'),
      fresnelGold: new THREE.Color('#FFE094'),
      waveEmerald: new THREE.Color('#6FFFB0'),
      waveGold: new THREE.Color('#FFE08A'),
      moteEmerald: new THREE.Color('#B4FFD8'),
      moteGold: new THREE.Color('#FFE49C'),
      lightEmerald: new THREE.Color('#52F2A0'),
      lightGold: new THREE.Color('#FFD275'),
    }),
    [],
  );

  /* ── GPU Cleanup on Unmount ── */
  useEffect(() => {
    return () => {
      [glowTexture, bandTexture, runeDishTex, plaqueTex].forEach((t) => t.dispose());
      [wave1Geom, wave2Geom, wave3Geom, wave4Geom, prongGeom].forEach((g) => g.dispose());
      [
        crystalGlassMat,
        prophecyMistMat,
        fresnelRimMat,
        innerNebulaMat,
        primaryWaveMat,
        secondaryWaveMat,
        goldenWaveMat,
        goldRingMat,
        etchedBandMat,
        pedestalStoneMat,
        runeDishMat,
        plaqueMat,
        moteMat,
        outerMoteMat,
      ].forEach((m) => m.dispose());
    };
  }, [
    glowTexture,
    bandTexture,
    runeDishTex,
    plaqueTex,
    wave1Geom,
    wave2Geom,
    wave3Geom,
    wave4Geom,
    prongGeom,
    crystalGlassMat,
    prophecyMistMat,
    fresnelRimMat,
    innerNebulaMat,
    primaryWaveMat,
    secondaryWaveMat,
    goldenWaveMat,
    goldRingMat,
    etchedBandMat,
    pedestalStoneMat,
    runeDishMat,
    plaqueMat,
    moteMat,
    outerMoteMat,
  ]);

  /* ── Smooth Enchanted Prophecy Animation + Smooth Status Transitions ── */
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const lerpAlpha = Math.min(dt * 3.5, 1);

    // Smoothly transition shader uniforms & emissive palette between statuses
    const targetPrimaryMist =
      status === 'explaining'
        ? colorTargets.mistPrimaryExplain
        : status === 'thinking'
        ? colorTargets.mistPrimaryThink
        : colorTargets.mistPrimaryIdle;
    const targetSecMist =
      status === 'explaining'
        ? colorTargets.mistSecExplain
        : status === 'thinking'
        ? colorTargets.mistSecThink
        : colorTargets.mistSecIdle;
    const targetFresnel =
      status === 'explaining' ? colorTargets.fresnelGold : colorTargets.fresnelEmerald;
    const targetWave =
      status === 'explaining' ? colorTargets.waveGold : colorTargets.waveEmerald;
    const targetMote =
      status === 'explaining' ? colorTargets.moteGold : colorTargets.moteEmerald;

    prophecyMistMat.uniforms.uPrimaryColor.value.lerp(targetPrimaryMist, lerpAlpha);
    prophecyMistMat.uniforms.uSecondaryColor.value.lerp(targetSecMist, lerpAlpha);
    prophecyMistMat.uniforms.uIntensity.value = THREE.MathUtils.lerp(
      prophecyMistMat.uniforms.uIntensity.value,
      status === 'thinking' ? 1.38 : status === 'explaining' ? 1.18 : 0.96,
      lerpAlpha,
    );

    fresnelRimMat.uniforms.uColor.value.lerp(targetFresnel, lerpAlpha);
    fresnelRimMat.uniforms.uIntensity.value = THREE.MathUtils.lerp(
      fresnelRimMat.uniforms.uIntensity.value,
      status === 'thinking' ? 1.05 : 0.78,
      lerpAlpha,
    );

    primaryWaveMat.emissive.lerp(targetWave, lerpAlpha);
    primaryWaveMat.emissiveIntensity = THREE.MathUtils.lerp(
      primaryWaveMat.emissiveIntensity,
      status === 'thinking' ? 3.4 : 2.35,
      lerpAlpha,
    );
    goldenWaveMat.emissiveIntensity = THREE.MathUtils.lerp(
      goldenWaveMat.emissiveIntensity,
      status === 'explaining' ? 2.4 : 1.35,
      lerpAlpha,
    );
    moteMat.color.lerp(targetMote, lerpAlpha);
    moteMat.size = THREE.MathUtils.lerp(
      moteMat.size,
      status === 'thinking' ? 0.11 : 0.085,
      lerpAlpha,
    );

    if (innerLightRef.current) {
      innerLightRef.current.color.lerp(
        status === 'explaining' ? colorTargets.lightGold : colorTargets.lightEmerald,
        lerpAlpha,
      );
      innerLightRef.current.intensity = THREE.MathUtils.lerp(
        innerLightRef.current.intensity,
        status === 'thinking' ? 4.6 : status === 'explaining' ? 3.3 : 2.7,
        lerpAlpha,
      );
    }

    if (!rootRef.current || reducedMotion) return;

    const elapsed = state.clock.getElapsedTime();
    const spd = status === 'thinking' ? 2.15 : status === 'explaining' ? 1.35 : 0.85;

    // Advance dual counter-swirling prophecy mist shaders
    prophecyMistMat.uniforms.uTime.value += dt * spd;
    if (mistMeshRef.current) {
      mistMeshRef.current.rotation.y += dt * 0.28 * spd;
    }
    if (innerMistMeshRef.current) {
      innerMistMeshRef.current.rotation.y -= dt * 0.42 * spd;
      innerMistMeshRef.current.rotation.z += dt * 0.22 * spd;
    }
    if (wispsRef.current) {
      wispsRef.current.rotation.y += dt * 0.5 * spd;
      wispsRef.current.rotation.x = Math.sin(elapsed * 0.65) * 0.2;
    }

    // Gentle levitation inside the brass cradle
    if (orbGroupRef.current) {
      orbGroupRef.current.position.y =
        0.18 +
        Math.sin(elapsed * 1.35) * 0.055 +
        Math.sin(elapsed * 0.48) * 0.02 +
        (hovered ? 0.055 : 0);
    }

    if (waveGroupRef.current) {
      waveGroupRef.current.rotation.y += dt * 0.48 * spd;
      waveGroupRef.current.rotation.z = Math.sin(elapsed * 0.85 * spd) * 0.26;
      waveGroupRef.current.rotation.x = Math.cos(elapsed * 0.6 * spd) * 0.16;
    }

    if (coreRef.current) {
      const rate = status === 'thinking' ? 3.6 : 1.65;
      const amp = status === 'thinking' ? 0.15 : 0.065;
      coreRef.current.scale.setScalar(1 + Math.sin(elapsed * rate) * amp);
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += dt * 0.3 * spd;
      ring1Ref.current.rotation.y += dt * 0.16 * spd;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x -= dt * 0.24 * spd;
      ring2Ref.current.rotation.z -= dt * 0.18 * spd;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y -= dt * 0.36 * spd;
    }
    if (runeDishRef.current) {
      runeDishRef.current.rotation.z += dt * 0.28 * spd;
    }

    if (motesRef.current) {
      motesRef.current.rotation.y += dt * 0.2 * spd;
      motesRef.current.rotation.x = Math.sin(elapsed * 0.5) * 0.12;
    }
    if (outerMotesRef.current) {
      outerMotesRef.current.rotation.y -= dt * 0.1 * spd;
    }
  });

  return (
    <group
      ref={rootRef}
      scale={baseScale}
      position={position}
      onPointerOver={
        interactive
          ? (e) => {
              e.stopPropagation();
              setHovered(true);
              document.body.style.cursor = 'pointer';
            }
          : undefined
      }
      onPointerOut={
        interactive
          ? () => {
              setHovered(false);
              document.body.style.cursor = 'auto';
            }
          : undefined
      }
    >
      {/* ════════════════════════════════════════════════════════
       *  1. FLOATING CRYSTAL PROPHECY SPHERE + SWIRLING MIST
       * ════════════════════════════════════════════════════════ */}
      <group ref={orbGroupRef} position={[0, 0.18, 0]}>
        <pointLight
          ref={innerLightRef}
          position={[0, 0, 0]}
          intensity={2.7}
          color="#52F2A0"
          distance={4.8}
          decay={2}
        />
        <pointLight position={[0.9, 0.6, 0.9]} intensity={1.3} color="#FFE0A0" distance={3.5} decay={2} />

        {/* Blown crystal glass sphere */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.92, 64, 64]} />
          <primitive object={crystalGlassMat} attach="material" />
        </mesh>

        {/* Fresnel glowing caustic rim */}
        <mesh scale={1.016}>
          <sphereGeometry args={[0.92, 48, 48]} />
          <primitive object={fresnelRimMat} attach="material" />
        </mesh>

        {/* Dual Counter-Swirling GLSL Prophecy Mist Shells */}
        <mesh ref={mistMeshRef}>
          <sphereGeometry args={[0.84, 48, 48]} />
          <primitive object={prophecyMistMat} attach="material" />
        </mesh>
        <mesh ref={innerMistMeshRef} rotation={[0.9, 1.4, 0.5]}>
          <sphereGeometry args={[0.64, 36, 36]} />
          <primitive object={prophecyMistMat} attach="material" />
        </mesh>

        {/* Orbiting Warm Lumos Firefly Wisps */}
        <group ref={wispsRef}>
          <group position={[1.38, 0.35, 0.2]}>
            <mesh>
              <sphereGeometry args={[0.036, 12, 12]} />
              <meshBasicMaterial color="#FFF6CC" />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.11, 16, 16]} />
              <meshBasicMaterial
                color="#FFC85E"
                transparent
                opacity={0.36}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
          <group position={[-1.34, -0.25, -0.24]}>
            <mesh>
              <sphereGeometry args={[0.032, 12, 12]} />
              <meshBasicMaterial color="#D8FFF0" />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshBasicMaterial
                color="#58E8A2"
                transparent
                opacity={0.34}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        </group>

        {/* Pulsing inner nebula core + luminous soul nucleus */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[0.36, 32, 32]} />
          <primitive object={innerNebulaMat} attach="material" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshBasicMaterial color="#F2FFF8" transparent opacity={0.95} />
        </mesh>

        {/* Swirling bioluminescent + golden energy filaments */}
        <group ref={waveGroupRef}>
          <mesh geometry={wave1Geom} material={primaryWaveMat} />
          <mesh geometry={wave2Geom} material={secondaryWaveMat} rotation={[0.45, 0.8, 0.2]} />
          <mesh geometry={wave3Geom} material={primaryWaveMat} rotation={[-0.6, -0.5, 0.8]} />
          <mesh geometry={wave4Geom} material={goldenWaveMat} rotation={[0.3, -0.9, 0.5]} />
        </group>

        {/* Sparkling starlight motes inside the prophecy glass */}
        <points ref={motesRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[innerMotePositions, 3]} />
          </bufferGeometry>
          <primitive object={moteMat} attach="material" />
        </points>

        {/* Outer gentle ambient gold stardust */}
        <points ref={outerMotesRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[outerMotePositions, 3]} />
          </bufferGeometry>
          <primitive object={outerMoteMat} attach="material" />
        </points>

        {/* Engraved Time-Turner Brass Astrolabe Rings */}
        {showHalo && (
          <>
            {/* Primary etched flat antique-brass astronomical band */}
            <group ref={ring1Ref} rotation={[0.52, 0.25, -0.2]}>
              <mesh>
                <cylinderGeometry args={[1.22, 1.22, 0.085, 72, 1, true]} />
                <primitive object={etchedBandMat} attach="material" />
              </mesh>
              <mesh position={[0, 0.042, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.22, 0.012, 10, 72]} />
                <primitive object={goldRingMat} attach="material" />
              </mesh>
              <mesh position={[0, -0.042, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.22, 0.012, 10, 72]} />
                <primitive object={goldRingMat} attach="material" />
              </mesh>
              <mesh position={[1.23, 0, 0]}>
                <sphereGeometry args={[0.052, 16, 16]} />
                <primitive object={goldRingMat} attach="material" />
              </mesh>
              <mesh position={[-1.23, 0, 0]}>
                <sphereGeometry args={[0.038, 16, 16]} />
                <primitive object={goldRingMat} attach="material" />
              </mesh>
            </group>

            {/* Secondary opposing brushed-gold meridian orbit */}
            <group ref={ring2Ref} rotation={[-0.68, -0.35, 0.42]}>
              <mesh>
                <torusGeometry args={[1.32, 0.016, 16, 96]} />
                <primitive object={goldRingMat} attach="material" />
              </mesh>
              <mesh position={[0, 1.32, 0]}>
                <octahedronGeometry args={[0.056, 0]} />
                <meshStandardMaterial
                  color="#74F0B0"
                  emissive="#45E095"
                  emissiveIntensity={1.6}
                  roughness={0.2}
                />
              </mesh>
            </group>

            {/* Delicate horizontal crown halo */}
            <group ref={ring3Ref} rotation={[1.38, 0.12, 0]}>
              <mesh>
                <torusGeometry args={[1.12, 0.01, 12, 96]} />
                <primitive object={goldRingMat} attach="material" />
              </mesh>
            </group>
          </>
        )}
      </group>

      {/* ════════════════════════════════════════════════════════
       *  2. SCULPTED 4-CLAW ANTIQUE-BRASS CRADLE & OCTAGONAL PLINTH
       * ════════════════════════════════════════════════════════ */}
      <group position={[0, -1.08, 0]}>
        {/* Wide stepped brass plinth footing */}
        <mesh position={[0, -0.08, 0]} receiveShadow>
          <cylinderGeometry args={[1.02, 1.1, 0.09, 8]} />
          <primitive object={goldRingMat} attach="material" />
        </mesh>
        {/* Main octagonal obsidian-emerald stone drum */}
        <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[0.92, 0.99, 0.15, 8]} />
          <primitive object={pedestalStoneMat} attach="material" />
        </mesh>
        {/* Engraved antique-brass prophecy nameplate band wrapped around base */}
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.96, 0.96, 0.075, 48, 1, true]} />
          <primitive object={etchedBandMat} attach="material" />
        </mesh>
        {/* Upper gold bevel collar */}
        <mesh position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.9, 0.024, 12, 64]} />
          <primitive object={goldRingMat} attach="material" />
        </mesh>
        {/* Upper recessed stone dish */}
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.72, 0.78, 0.06, 48]} />
          <primitive object={pedestalStoneMat} attach="material" />
        </mesh>
        {/* Glowing rotating prophecy rune circle in the pedestal dish */}
        <mesh ref={runeDishRef} position={[0, 0.176, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.38, 1.38]} />
          <primitive object={runeDishMat} attach="material" />
        </mesh>

        {/* Hall-of-Prophecy Brass Shelf Nameplate mounted on the front bevel */}
        <group position={[0, -0.02, 0.99]} rotation={[-0.32, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.64, 0.21, 0.035]} />
            <primitive object={goldRingMat} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[0.6, 0.175]} />
            <primitive object={plaqueMat} attach="material" />
          </mesh>
        </group>

        {/* 4 Sculpted Sweeping Antique-Brass Gothic Cradle Prongs */}
        {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, idx) => (
          <group key={idx} rotation={[0, angle + Math.PI / 4, 0]}>
            <mesh geometry={prongGeom} material={goldRingMat} castShadow />
            {/* Decorative scrolled brass knuckle at base of prong */}
            <mesh position={[0.72, 0.14, 0]}>
              <sphereGeometry args={[0.062, 14, 14]} />
              <primitive object={goldRingMat} attach="material" />
            </mesh>
            {/* Polished golden pearl finial at tip of each claw */}
            <mesh position={[0.96, 1.13, 0]}>
              <sphereGeometry args={[0.055, 16, 16]} />
              <primitive object={goldRingMat} attach="material" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};
