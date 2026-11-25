import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface GeometricShapesProps {
  variant?: 'torus-knot' | 'icosahedron' | 'coordinate-prism' | 'cluster';
  accent?: 'green' | 'coral' | 'sage' | 'amber';
  scale?: number;
  speed?: number;
  interactive?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/* ═══════════════════════════════════════════════════════════════
 *  ✦ HEADMASTER'S ARITHMANCY ORRERY & TIME-TURNER ARTEFACTS ✦
 *  Ultra-Premium Enchanted Academic Sculptures
 *
 *  - Nested counter-rotating 3D antique-brass Time-Turner gimbal
 *    rings with etched astronomical ticks, glyphs & pivot pins
 *  - Glowing radial arithmancy astrolabe dial beneath the prism
 *  - Soft 4-point starlight spell-dust sprites (zero blocky dots)
 *  - Blown emerald crystal & spun-gold sculptural cores across
 *    all 4 variants (coordinate-prism, torus-knot, icosahedron, cluster)
 * ═══════════════════════════════════════════════════════════════ */

const ACCENT_COLORS = {
  green: '#2D6A4F',
  coral: '#E07A5F',
  sage: '#58B98A',
  amber: '#E8C068',
};

/* ───────────────────────────────────────────────────────────────
 *  Extruded 3D Antique-Gold Pi (π) Crest
 * ─────────────────────────────────────────────────────────────── */
function createPiGeometry(): THREE.ExtrudeGeometry {
  const s = new THREE.Shape();
  s.moveTo(-0.34, 0.26);
  s.lineTo(0.36, 0.26);
  s.lineTo(0.34, 0.15);
  s.lineTo(0.19, 0.15);
  s.lineTo(0.19, -0.22);
  s.quadraticCurveTo(0.19, -0.3, 0.26, -0.3);
  s.lineTo(0.26, -0.36);
  s.quadraticCurveTo(0.08, -0.37, 0.08, -0.21);
  s.lineTo(0.08, 0.15);
  s.lineTo(-0.08, 0.15);
  s.lineTo(-0.08, -0.35);
  s.lineTo(-0.2, -0.35);
  s.lineTo(-0.2, 0.15);
  s.lineTo(-0.36, 0.15);
  s.closePath();

  return new THREE.ExtrudeGeometry(s, {
    depth: 0.085,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.018,
    bevelSegments: 5,
  });
}

/* ───────────────────────────────────────────────────────────────
 *  Procedural Etched Antique-Brass Ring Band Texture
 *  (Astronomical ticks + mathematical/celestial glyphs)
 * ─────────────────────────────────────────────────────────────── */
function createEtchedBrassBandTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#B98C36');
  grad.addColorStop(0.22, '#F3D68A');
  grad.addColorStop(0.5, '#DFB55B');
  grad.addColorStop(0.78, '#F0CE7C');
  grad.addColorStop(1, '#9E7428');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 128);

  // Dark engraved border rails
  ctx.fillStyle = 'rgba(42, 28, 10, 0.55)';
  ctx.fillRect(0, 14, 1024, 5);
  ctx.fillRect(0, 109, 1024, 5);

  // Fine astronomical vernier ticks
  for (let i = 0; i < 64; i++) {
    const x = (i / 64) * 1024;
    const tall = i % 4 === 0;
    ctx.fillStyle = 'rgba(38, 24, 8, 0.65)';
    ctx.fillRect(x, 20, tall ? 3 : 1.5, tall ? 24 : 12);
    ctx.fillRect(x, tall ? 84 : 96, tall ? 3 : 1.5, tall ? 24 : 12);
  }

  // Engraved mathematical & celestial glyphs along the band
  const glyphs = ['π', '✦', 'φ', '☽', '∑', '✦', '∞', '☀', 'Δ', '✦', '∫', '☽', 'θ', '✦', 'Ω', '☀'];
  ctx.fillStyle = 'rgba(34, 20, 6, 0.85)';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  glyphs.forEach((g, idx) => {
    const x = ((idx + 0.5) / glyphs.length) * 1024;
    ctx.fillText(g, x, 64);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/* ───────────────────────────────────────────────────────────────
 *  Procedural Glowing Arithmancy Astrolabe Compass Dial Texture
 * ─────────────────────────────────────────────────────────────── */
function createAstrolabeDialTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 512, 512);
  const cx = 256;
  const cy = 256;

  // Soft warm golden-emerald core haze
  const glow = ctx.createRadialGradient(cx, cy, 12, cx, cy, 246);
  glow.addColorStop(0, 'rgba(116, 240, 176, 0.24)');
  glow.addColorStop(0.5, 'rgba(242, 204, 114, 0.14)');
  glow.addColorStop(1, 'rgba(242, 204, 114, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 512);

  // Concentric golden compass rings
  [240, 226, 172, 118, 62].forEach((r, idx) => {
    ctx.strokeStyle = idx < 2 ? 'rgba(255, 224, 138, 0.88)' : 'rgba(245, 212, 126, 0.45)';
    ctx.lineWidth = idx === 0 ? 3 : 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Coordinate crosshairs & 12 astronomical spokes
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const isAxis = i % 3 === 0;
    ctx.strokeStyle = isAxis ? 'rgba(255, 232, 162, 0.72)' : 'rgba(128, 242, 185, 0.32)';
    ctx.lineWidth = isAxis ? 2.2 : 1.1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 62, cy + Math.sin(a) * 62);
    ctx.lineTo(cx + Math.cos(a) * 226, cy + Math.sin(a) * 226);
    ctx.stroke();
  }

  // Degree ticks
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    ctx.strokeStyle = 'rgba(255, 226, 148, 0.82)';
    ctx.lineWidth = i % 3 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 226, cy + Math.sin(a) * 226);
    ctx.lineTo(cx + Math.cos(a) * 240, cy + Math.sin(a) * 240);
    ctx.stroke();
  }

  // Inscribed golden triangle + inverted triangle (classic geometry compass)
  ctx.strokeStyle = 'rgba(255, 224, 138, 0.36)';
  ctx.lineWidth = 1.5;
  [0, Math.PI].forEach((offset) => {
    ctx.beginPath();
    for (let i = 0; i <= 3; i++) {
      const a = offset - Math.PI / 2 + (i * Math.PI * 2) / 3;
      const x = cx + Math.cos(a) * 172;
      const y = cy + Math.sin(a) * 172;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ───────────────────────────────────────────────────────────────
 *  Soft 4-Point Starlight Sprite Texture (No Blocky Squares!)
 * ─────────────────────────────────────────────────────────────── */
function createStarSpriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 253, 236, 1)');
    grad.addColorStop(0.28, 'rgba(255, 224, 138, 0.85)');
    grad.addColorStop(0.65, 'rgba(232, 184, 76, 0.24)');
    grad.addColorStop(1, 'rgba(232, 184, 76, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    ctx.fillStyle = 'rgba(255, 252, 230, 0.85)';
    ctx.beginPath();
    ctx.moveTo(32, 3);
    ctx.lineTo(34.5, 29.5);
    ctx.lineTo(61, 32);
    ctx.lineTo(34.5, 34.5);
    ctx.lineTo(32, 61);
    ctx.lineTo(29.5, 34.5);
    ctx.lineTo(3, 32);
    ctx.lineTo(29.5, 29.5);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createStarMotePositions(count: number, radius: number) {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.65 + Math.random() * radius;
    arr[i * 3] = Math.cos(a) * r;
    arr[i * 3 + 1] = (Math.random() - 0.5) * radius * 1.45;
    arr[i * 3 + 2] = Math.sin(a) * r * 0.78;
  }
  return arr;
}

/* ───────────────────────────────────────────────────────────────
 *  Delicate Sweeping Filigree Wing-Arc Geometry (for cluster orb)
 * ─────────────────────────────────────────────────────────────── */
function createFiligreeArcGeometry(side: 1 | -1): THREE.TubeGeometry {
  const pts = [
    new THREE.Vector3(side * 0.18, 0.02, 0),
    new THREE.Vector3(side * 0.42, 0.18, -0.05),
    new THREE.Vector3(side * 0.68, 0.22, -0.08),
    new THREE.Vector3(side * 0.82, 0.06, -0.04),
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, 24, 0.014, 8, false);
}

/* ───────────────────────────────────────────────────────────────
 *  Sculpted 3D Golden Crescent Moon Finial (Astronomy Tower Vibe)
 * ─────────────────────────────────────────────────────────────── */
function createCrescentMoonGeometry(): THREE.ExtrudeGeometry {
  const s = new THREE.Shape();
  s.absarc(0, 0, 0.115, 0.55, Math.PI * 2 - 0.55, false);
  s.absarc(0.052, 0, 0.088, Math.PI * 2 - 0.82, 0.82, true);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, {
    depth: 0.022,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.005,
    bevelSegments: 3,
  });
}

/* ───────────────────────────────────────────────────────────────
 *  Sculpted 3D Golden Four-Point Celestial Star Finial
 * ─────────────────────────────────────────────────────────────── */
function createStarFinialGeometry(): THREE.ExtrudeGeometry {
  const s = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const r = i % 2 === 0 ? 0.12 : 0.038;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return new THREE.ExtrudeGeometry(s, {
    depth: 0.022,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.005,
    bevelSegments: 2,
  });
}

/* ═══════════════════════════════════════════════════════════════
 *  ✦ GEOMETRIC SHAPES COMPONENT ✦
 * ═══════════════════════════════════════════════════════════════ */
export const GeometricShapes: React.FC<GeometricShapesProps> = ({
  variant = 'torus-knot',
  accent = 'sage',
  scale = 1,
  speed = 1.0,
  interactive = true,
  position = [0, 0, 0],
  rotation = [0.22, -0.35, 0],
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const meshA = useRef<THREE.Mesh>(null);
  const meshB = useRef<THREE.Mesh>(null);
  const meshC = useRef<THREE.Mesh>(null);
  const moonletRef = useRef<THREE.Group>(null);
  const outerGimbalRef = useRef<THREE.Group>(null);
  const innerGimbalRef = useRef<THREE.Group>(null);
  const celestialArcRef = useRef<THREE.Group>(null);
  const wispsRef = useRef<THREE.Group>(null);
  const dialRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

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

  const accentHex = ACCENT_COLORS[accent] || ACCENT_COLORS.sage;

  /* ── Procedural Textures ── */
  const brassBandTex = useMemo(() => createEtchedBrassBandTexture(), []);
  const dialTex = useMemo(() => createAstrolabeDialTexture(), []);
  const starTex = useMemo(() => createStarSpriteTexture(), []);

  /* ── Geometries (cleanly disposing temporary primitives) ── */
  const piGeom = useMemo(() => createPiGeometry(), []);
  const pyramidEdgesGeom = useMemo(() => {
    const tmp = new THREE.ConeGeometry(0.55, 0.86, 4);
    const edges = new THREE.EdgesGeometry(tmp);
    tmp.dispose();
    return edges;
  }, []);
  const cubeEdgesGeom = useMemo(() => {
    const tmp = new THREE.BoxGeometry(0.46, 0.46, 0.46);
    const edges = new THREE.EdgesGeometry(tmp);
    tmp.dispose();
    return edges;
  }, []);
  const icoEdgesGeom = useMemo(() => {
    const tmp = new THREE.IcosahedronGeometry(0.84, 0);
    const edges = new THREE.EdgesGeometry(tmp);
    tmp.dispose();
    return edges;
  }, []);
  const wingLeftGeom = useMemo(() => createFiligreeArcGeometry(-1), []);
  const wingRightGeom = useMemo(() => createFiligreeArcGeometry(1), []);
  const crescentGeom = useMemo(() => createCrescentMoonGeometry(), []);
  const starFinialGeom = useMemo(() => createStarFinialGeometry(), []);
  const particlePositions = useMemo(() => createStarMotePositions(84, 1.42), []);

  /* ── Materials ── */
  const crystalGlassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#D4F5E2',
        roughness: 0.04,
        metalness: 0.02,
        transmission: 0.92,
        thickness: 1.0,
        ior: 1.52,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        specularIntensity: 1.15,
        specularColor: new THREE.Color('#FFF8E4'),
        envMapIntensity: 1.55,
        attenuationColor: new THREE.Color('#235E45'),
        attenuationDistance: 1.5,
        transparent: true,
        opacity: 0.95,
      }),
    [],
  );

  const emeraldGlassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: accentHex,
        roughness: 0.06,
        metalness: 0.08,
        transmission: 0.82,
        thickness: 0.85,
        ior: 1.5,
        clearcoat: 0.95,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.45,
        attenuationColor: new THREE.Color('#163B2B'),
        attenuationDistance: 1.1,
        transparent: true,
        opacity: 0.92,
      }),
    [accentHex],
  );

  const goldMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#F0CC74',
        emissive: new THREE.Color('#C99430'),
        emissiveIntensity: 0.28,
        roughness: 0.16,
        metalness: 0.95,
        clearcoat: 0.85,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.65,
      }),
    [],
  );

  const etchedBrassBandMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: brassBandTex,
        emissive: new THREE.Color('#9E7324'),
        emissiveIntensity: 0.18,
        roughness: 0.24,
        metalness: 0.92,
        clearcoat: 0.65,
        side: THREE.DoubleSide,
      }),
    [brassBandTex],
  );

  const goldEdgeLineMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#FFE59A',
        transparent: true,
        opacity: 0.92,
      }),
    [],
  );

  const dialMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: dialTex,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [dialTex],
  );

  const starMoteMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: starTex,
        color: '#FFE6A2',
        size: 0.12,
        transparent: true,
        opacity: 0.92,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [starTex],
  );

  /* ── GPU Cleanup on Unmount ── */
  useEffect(() => {
    return () => {
      [brassBandTex, dialTex, starTex].forEach((t) => t.dispose());
      [
        piGeom,
        pyramidEdgesGeom,
        cubeEdgesGeom,
        icoEdgesGeom,
        wingLeftGeom,
        wingRightGeom,
        crescentGeom,
        starFinialGeom,
      ].forEach((g) => g.dispose());
      [
        crystalGlassMat,
        emeraldGlassMat,
        goldMat,
        etchedBrassBandMat,
        goldEdgeLineMat,
        dialMat,
        starMoteMat,
      ].forEach((m) => m.dispose());
    };
  }, [
    brassBandTex,
    dialTex,
    starTex,
    piGeom,
    pyramidEdgesGeom,
    cubeEdgesGeom,
    icoEdgesGeom,
    wingLeftGeom,
    wingRightGeom,
    crescentGeom,
    starFinialGeom,
    crystalGlassMat,
    emeraldGlassMat,
    goldMat,
    etchedBrassBandMat,
    goldEdgeLineMat,
    dialMat,
    starMoteMat,
  ]);

  /* ── Smooth Enchanted Orrery Animation ── */
  useFrame((state, delta) => {
    if (!rootRef.current || reducedMotion) return;
    const elapsed = state.clock.getElapsedTime() * speed;
    const hoverBoost = hovered ? 1.5 : 1.0;

    rootRef.current.position.y = position[1] + Math.sin(elapsed * 1.1) * 0.055;

    // Counter-rotating Time-Turner brass gimbals
    if (outerGimbalRef.current) {
      outerGimbalRef.current.rotation.y += delta * 0.24 * speed * hoverBoost;
      outerGimbalRef.current.rotation.z = 0.22 + Math.sin(elapsed * 0.45) * 0.1;
    }
    if (innerGimbalRef.current) {
      innerGimbalRef.current.rotation.x -= delta * 0.34 * speed * hoverBoost;
      innerGimbalRef.current.rotation.y -= delta * 0.18 * speed;
    }
    if (celestialArcRef.current) {
      celestialArcRef.current.rotation.z += delta * 0.16 * speed * hoverBoost;
      celestialArcRef.current.rotation.y -= delta * 0.12 * speed;
    }
    if (wispsRef.current) {
      wispsRef.current.rotation.y += delta * 0.55 * speed;
      wispsRef.current.rotation.x = Math.sin(elapsed * 0.6) * 0.25;
    }
    if (dialRef.current) {
      dialRef.current.rotation.z += delta * 0.2 * speed;
    }

    if (variant === 'torus-knot') {
      if (meshA.current) {
        meshA.current.rotation.y += delta * 0.26 * speed * hoverBoost;
        meshA.current.rotation.x = Math.sin(elapsed * 0.45) * 0.16;
      }
    } else if (variant === 'icosahedron') {
      if (meshA.current) {
        meshA.current.rotation.x += delta * 0.18 * speed;
        meshA.current.rotation.y += delta * 0.32 * speed * hoverBoost;
      }
      if (meshB.current) {
        meshB.current.rotation.x -= delta * 0.26 * speed;
        meshB.current.rotation.y -= delta * 0.2 * speed;
      }
    } else if (variant === 'coordinate-prism' || variant === 'cluster') {
      rootRef.current.rotation.y = rotation[1] + Math.sin(elapsed * 0.35) * 0.26;
      if (meshA.current) meshA.current.rotation.y += delta * 0.28 * speed;
      if (meshB.current) {
        meshB.current.rotation.x += delta * 0.22 * speed;
        meshB.current.rotation.y += delta * 0.3 * speed;
      }
      if (meshC.current) {
        meshC.current.position.y = 0.26 + Math.sin(elapsed * 1.45) * 0.06;
      }
      if (moonletRef.current) {
        moonletRef.current.rotation.y += delta * 1.15 * speed;
      }
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.07;
    }

    const baseTarget = scale * 0.85;
    const targetScale = hovered ? baseTarget * 1.07 : baseTarget;
    const nextScale = THREE.MathUtils.lerp(
      rootRef.current.scale.x,
      targetScale,
      Math.min(delta * 6, 1),
    );
    rootRef.current.scale.setScalar(nextScale);
  });

  return (
    <group
      ref={rootRef}
      scale={scale * 0.85}
      position={position}
      rotation={rotation}
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
      {/* Warm candlelight key + emerald arcane rim light */}
      <pointLight position={[1.4, 1.5, 1.6]} intensity={2.6} color="#FFE09C" distance={5.5} decay={2} />
      <pointLight position={[-1.4, -0.5, 1.4]} intensity={1.85} color="#52E5A0" distance={5.5} decay={2} />
      <pointLight position={[0, 0.2, -1.5]} intensity={0.9} color="#FFCC70" distance={4.5} decay={2} />

      {/* Soft 4-Point Enchanted Starlight Motes */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <primitive object={starMoteMat} attach="material" />
      </points>

      {/* ── Outer Astronomy-Tower Celestial Meridian with 3D Crescent Moon & Star Finials ── */}
      <group ref={celestialArcRef} rotation={[0.18, 0.3, -0.35]}>
        <mesh>
          <torusGeometry args={[1.48, 0.012, 12, 96]} />
          <primitive object={goldMat} attach="material" />
        </mesh>
        {/* Sculpted 3D Golden Crescent Moon orbiting on top pole */}
        <mesh geometry={crescentGeom} material={goldMat} position={[0, 1.48, -0.011]} />
        {/* Sculpted 3D Golden 4-Point Celestial Star on opposite pole */}
        <mesh geometry={starFinialGeom} material={goldMat} position={[0, -1.48, -0.011]} />
      </group>

      {/* ── Two Warm Orbiting Lumos Firefly Wisps ── */}
      <group ref={wispsRef}>
        <group position={[1.42, 0.42, 0.32]}>
          <mesh>
            <sphereGeometry args={[0.036, 12, 12]} />
            <meshBasicMaterial color="#FFF6CC" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshBasicMaterial
              color="#FFC85E"
              transparent
              opacity={0.34}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
        <group position={[-1.38, -0.34, -0.26]}>
          <mesh>
            <sphereGeometry args={[0.03, 12, 12]} />
            <meshBasicMaterial color="#D8FFF0" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.095, 16, 16]} />
            <meshBasicMaterial
              color="#58E8A2"
              transparent
              opacity={0.3}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      </group>

      {/* ── Nested 3D Engraved Antique-Brass Time-Turner Gimbal Rings ── */}
      <group ref={outerGimbalRef} rotation={[0.28, 0.15, 0.22]}>
        {/* Outer etched flat brass astronomical band */}
        <mesh>
          <cylinderGeometry args={[1.34, 1.34, 0.11, 72, 1, true]} />
          <primitive object={etchedBrassBandMat} attach="material" />
        </mesh>
        {/* Top & bottom beveled gold rims on the band */}
        <mesh position={[0, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.34, 0.015, 10, 72]} />
          <primitive object={goldMat} attach="material" />
        </mesh>
        <mesh position={[0, -0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.34, 0.015, 10, 72]} />
          <primitive object={goldMat} attach="material" />
        </mesh>
        {/* 4 Cardinal brass Time-Turner pivot studs */}
        {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((a, idx) => (
          <mesh key={idx} position={[Math.cos(a) * 1.35, 0, Math.sin(a) * 1.35]}>
            <sphereGeometry args={[0.042, 14, 14]} />
            <primitive object={goldMat} attach="material" />
          </mesh>
        ))}

        {/* Inner counter-rotating meridian brass gimbal */}
        <group ref={innerGimbalRef} rotation={[0.72, 0.4, -0.35]}>
          <mesh>
            <torusGeometry args={[1.16, 0.022, 14, 80]} />
            <primitive object={goldMat} attach="material" />
          </mesh>
          {/* Sleek cardinal brass gimbal studs mounted cleanly on the inner ring */}
          <mesh position={[1.16, 0, 0]}>
            <sphereGeometry args={[0.044, 14, 14]} />
            <primitive object={goldMat} attach="material" />
          </mesh>
          <mesh position={[-1.16, 0, 0]}>
            <sphereGeometry args={[0.044, 14, 14]} />
            <primitive object={goldMat} attach="material" />
          </mesh>
          {/* Tiny glowing emerald jewel node orbiting the inner ring */}
          <mesh position={[0, 1.16, 0]}>
            <octahedronGeometry args={[0.052, 0]} />
            <meshStandardMaterial
              color="#74F0B0"
              emissive="#40E090"
              emissiveIntensity={1.6}
              roughness={0.18}
            />
          </mesh>
        </group>
      </group>

      {/* ════════════════════════════════════════════════════════
       *  1. COORDINATE PRISM — Crystal Pyramid, Golden π, Cube,
       *     Prophecy Sphere & Glowing Arithmancy Astrolabe Dial
       * ════════════════════════════════════════════════════════ */}
      {variant === 'coordinate-prism' && (
        <group position={[0, -0.06, 0]}>
          {/* Translucent Emerald Pyramid with gilded edges + glowing golden heart */}
          <group position={[-0.44, 0.34, -0.05]}>
            <mesh ref={meshA} castShadow>
              <coneGeometry args={[0.55, 0.86, 4]} />
              <primitive object={emeraldGlassMat} attach="material" />
            </mesh>
            <lineSegments geometry={pyramidEdgesGeom} material={goldEdgeLineMat} />
            <mesh position={[0, -0.08, 0]}>
              <octahedronGeometry args={[0.16, 0]} />
              <primitive object={goldMat} attach="material" />
            </mesh>
          </group>

          {/* Extruded Antique-Gold 3D Pi (π) Crest */}
          <mesh
            ref={meshC}
            geometry={piGeom}
            material={goldMat}
            position={[0.18, 0.26, 0.08]}
            castShadow
          />

          {/* Faceted Crystal Cube with golden wireframe */}
          <group position={[0.56, -0.16, -0.16]} rotation={[0.35, 0.55, 0.15]}>
            <mesh ref={meshB} castShadow>
              <boxGeometry args={[0.46, 0.46, 0.46]} />
              <primitive object={crystalGlassMat} attach="material" />
            </mesh>
            <lineSegments geometry={cubeEdgesGeom} material={goldEdgeLineMat} />
          </group>

          {/* Mini Prophecy Crystal Sphere with orbiting golden moonlet */}
          <group position={[0.04, -0.32, 0.36]}>
            <mesh castShadow>
              <sphereGeometry args={[0.32, 48, 48]} />
              <primitive object={crystalGlassMat} attach="material" />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.13, 24, 24]} />
              <meshStandardMaterial
                color="#74F0B0"
                emissive="#45D68E"
                emissiveIntensity={2.0}
                roughness={0.18}
              />
            </mesh>
            <group ref={moonletRef} rotation={[0.4, 0, 0.25]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.44, 0.008, 8, 48]} />
                <primitive object={goldMat} attach="material" />
              </mesh>
              <mesh position={[0.44, 0, 0]}>
                <sphereGeometry args={[0.032, 12, 12]} />
                <primitive object={goldMat} attach="material" />
              </mesh>
            </group>
          </group>

          {/* Glowing Rotating Arithmancy Astrolabe Compass Base */}
          <mesh ref={dialRef} position={[-0.04, -0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.88, 1.88]} />
            <primitive object={dialMat} attach="material" />
          </mesh>
        </group>
      )}

      {/* ════════════════════════════════════════════════════════
       *  2. TORUS KNOT — Crystal & Spun-Gold Filigree Topology Knot
       * ════════════════════════════════════════════════════════ */}
      {variant === 'torus-knot' && (
        <group ref={meshA}>
          <mesh castShadow receiveShadow>
            <torusKnotGeometry args={[0.64, 0.18, 148, 24, 2, 3]} />
            <primitive object={crystalGlassMat} attach="material" />
          </mesh>
          <mesh>
            <torusKnotGeometry args={[0.63, 0.085, 128, 16, 2, 3]} />
            <primitive object={emeraldGlassMat} attach="material" />
          </mesh>
          {/* Delicate spun-gold filigree core winding through the glass knot */}
          <mesh>
            <torusKnotGeometry args={[0.64, 0.028, 148, 12, 2, 3]} />
            <primitive object={goldMat} attach="material" />
          </mesh>
        </group>
      )}

      {/* ════════════════════════════════════════════════════════
       *  3. ICOSAHEDRON — Caged Divination Crystal & Golden Core
       * ════════════════════════════════════════════════════════ */}
      {variant === 'icosahedron' && (
        <group>
          <group ref={meshA}>
            <mesh castShadow>
              <icosahedronGeometry args={[0.82, 0]} />
              <primitive object={crystalGlassMat} attach="material" />
            </mesh>
            <lineSegments geometry={icoEdgesGeom} material={goldEdgeLineMat} />
          </group>
          <mesh ref={meshB} scale={0.52}>
            <dodecahedronGeometry args={[0.8, 0]} />
            <primitive object={emeraldGlassMat} attach="material" />
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.24, 0]} />
            <primitive object={goldMat} attach="material" />
          </mesh>
        </group>
      )}

      {/* ════════════════════════════════════════════════════════
       *  4. CLUSTER — Enchanted Relic Composition with Winged Gold Orb
       * ════════════════════════════════════════════════════════ */}
      {variant === 'cluster' && (
        <group>
          <mesh ref={meshA} position={[-0.34, -0.06, 0]} rotation={[0.55, 0.18, 0]} castShadow>
            <torusGeometry args={[0.46, 0.135, 24, 64]} />
            <primitive object={crystalGlassMat} attach="material" />
          </mesh>
          <group position={[0.42, 0.24, 0.1]}>
            <mesh ref={meshB} castShadow>
              <coneGeometry args={[0.34, 0.64, 4]} />
              <primitive object={emeraldGlassMat} attach="material" />
            </mesh>
          </group>
          {/* Alchemical golden sphere with delicate filigree wing-arcs */}
          <group ref={meshC} position={[-0.08, 0.38, 0.18]}>
            <mesh castShadow>
              <sphereGeometry args={[0.2, 32, 32]} />
              <primitive object={goldMat} attach="material" />
            </mesh>
            <mesh geometry={wingLeftGeom} material={goldMat} />
            <mesh geometry={wingRightGeom} material={goldMat} />
          </group>
          <mesh ref={dialRef} position={[0, -0.68, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.72, 1.72]} />
            <primitive object={dialMat} attach="material" />
          </mesh>
        </group>
      )}
    </group>
  );
};
