import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Clone, ContactShadows, Sparkles, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { WorldCanvas } from './WorldCanvas';
import { InstancedGLB, type InstanceTransform } from './GLBAsset';
import { GeometricShapes } from './GeometricShapes';

export interface LibraryModuleItem {
  name: string;
  sectionCount: number;
}

export interface LibraryWorldProps {
  modules: LibraryModuleItem[];
  activeModule?: string;
  onModuleClick?: (moduleName: string) => void;
  resetSignal?: number;
  className?: string;
}

/* ── Verified Local CC0 GLB Models (see public/models/LICENSES.md) ── */
const MODEL_BOOKSHELF = '/models/library/bookshelf.glb';
const MODEL_BOOK_VOLUME = '/models/library/book_volume.glb';
const MODEL_LANTERN = '/models/library/lantern.glb';

interface ArchiveBookTheme {
  coverHex: string;
  bgHex: string;
  edgeHex: string;
  spineHex: string;
  titleHex: string;
  volHex: string;
  lineHex: string;
  accentHex: string;
  titleLines: string[];
  diagramType: 'foundations' | 'linear' | 'systems' | 'functions' | 'exponents' | 'polynomials';
  isLight: boolean;
}

/* Six unmistakable academic mathematics hardcover volumes matching the EduPath Archives palette */
const ARCHIVE_BOOK_THEMES: ArchiveBookTheme[] = [
  {
    // Vol. 01 — Deep Forest Emerald
    coverHex: '#154431',
    bgHex: '#0F3325',
    edgeHex: '#081F16',
    spineHex: '#0C291E',
    titleHex: '#FFF6DE',
    volHex: '#E8CA7A',
    lineHex: '#DFC070',
    accentHex: '#74C69D',
    titleLines: ['Foundations,', 'Expressions &', 'Equation Modeling'],
    diagramType: 'foundations',
    isLight: false,
  },
  {
    // Vol. 02 — Warm Academic Cream Ivory
    coverHex: '#F0E9D8',
    bgHex: '#E5DBC4',
    edgeHex: '#CFC2A6',
    spineHex: '#D4C7AC',
    titleHex: '#13241B',
    volHex: '#7C5D24',
    lineHex: '#9A7732',
    accentHex: '#1A4B35',
    titleLines: ['Linear', 'Equations &', 'Solution Behaviour'],
    diagramType: 'linear',
    isLight: true,
  },
  {
    // Vol. 03 — Deep Royal Oxford Navy
    coverHex: '#18304F',
    bgHex: '#11243D',
    edgeHex: '#0A1626',
    spineHex: '#0E1D31',
    titleHex: '#FFF7E4',
    volHex: '#E6CA82',
    lineHex: '#D8BA70',
    accentHex: '#8CC5E8',
    titleLines: ['Systems of', 'Equations &', 'Inequalities'],
    diagramType: 'systems',
    isLight: false,
  },
  {
    // Vol. 04 — Rich Scholarly Burgundy Crimson
    coverHex: '#5C1B20',
    bgHex: '#461317',
    edgeHex: '#2C0A0D',
    spineHex: '#3A1013',
    titleHex: '#FFF5DF',
    volHex: '#ECCE84',
    lineHex: '#DFBE6F',
    accentHex: '#F0B68A',
    titleLines: ['Relations,', 'Functions &', 'Linear Models'],
    diagramType: 'functions',
    isLight: false,
  },
  {
    // Vol. 05 — Warm Parchment Ivory
    coverHex: '#ECE4D2',
    bgHex: '#E1D6BE',
    edgeHex: '#C9BC9F',
    spineHex: '#D0C2A4',
    titleHex: '#15241C',
    volHex: '#7A5B22',
    lineHex: '#967430',
    accentHex: '#194935',
    titleLines: ['Exponents', '& Powers'],
    diagramType: 'exponents',
    isLight: true,
  },
  {
    // Vol. 06 — Deep Forest Emerald
    coverHex: '#144230',
    bgHex: '#0E3123',
    edgeHex: '#071D15',
    spineHex: '#0B271C',
    titleHex: '#FFF6DE',
    volHex: '#E8CA7A',
    lineHex: '#E0C172',
    accentHex: '#82D9AE',
    titleLines: ['Polynomials', '& Factoring'],
    diagramType: 'polynomials',
    isLight: false,
  },
];

function getThemeForModule(moduleName: string, fallbackIndex: number): ArchiveBookTheme {
  const lower = moduleName.toLowerCase();
  if (lower.includes('foundation') || lower.includes('expression')) return ARCHIVE_BOOK_THEMES[0];
  if (lower.includes('linear equation')) return ARCHIVE_BOOK_THEMES[1];
  if (lower.includes('system') || lower.includes('inequalit')) return ARCHIVE_BOOK_THEMES[2];
  if (lower.includes('function') || lower.includes('relation')) return ARCHIVE_BOOK_THEMES[3];
  if (lower.includes('exponent') || lower.includes('power')) return ARCHIVE_BOOK_THEMES[4];
  if (lower.includes('polynomial') || lower.includes('factor')) return ARCHIVE_BOOK_THEMES[5];
  return ARCHIVE_BOOK_THEMES[fallbackIndex % ARCHIVE_BOOK_THEMES.length];
}

/* ───────────────────────────────────────────────────────────────
 *  Crisp Academic Mathematical Cover Diagrams (Zero Religious Motifs)
 * ─────────────────────────────────────────────────────────────── */
function drawTextbookDiagram(
  ctx: CanvasRenderingContext2D,
  theme: ArchiveBookTheme,
  cx: number,
  cy: number,
  w: number,
  h: number
) {
  ctx.save();
  const left = cx - w / 2;
  const right = cx + w / 2;
  const top = cy - h / 2;
  const bottom = cy + h / 2;

  const drawAxes = (ox: number, oy: number) => {
    // Subtle precision graph grid
    ctx.strokeStyle = theme.isLight ? 'rgba(20, 42, 30, 0.12)' : 'rgba(255, 245, 215, 0.11)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 6; i++) {
      const gx = left + (w * i) / 6;
      ctx.beginPath();
      ctx.moveTo(gx, top);
      ctx.lineTo(gx, bottom);
      ctx.stroke();
    }
    for (let j = 1; j < 4; j++) {
      const gy = top + (h * j) / 4;
      ctx.beginPath();
      ctx.moveTo(left, gy);
      ctx.lineTo(right, gy);
      ctx.stroke();
    }

    // Crisp Cartesian coordinate axes with arrowheads
    ctx.strokeStyle = theme.lineHex;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(left + 14, oy);
    ctx.lineTo(right - 14, oy);
    ctx.moveTo(ox, bottom - 12);
    ctx.lineTo(ox, top + 12);
    ctx.stroke();
  };

  if (theme.diagramType === 'foundations') {
    // Smooth coordinate curve + equation y = mx + b (matching Vol. 01 in reference)
    drawAxes(cx - 10, cy + 32);
    ctx.strokeStyle = theme.titleHex;
    ctx.lineWidth = 7;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const t = (i / 60) * 2 - 1;
      const px = cx + t * (w * 0.41);
      const py = cy + 28 - Math.exp(-t * t * 3.2) * (h * 0.54) + t * 28;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.fillStyle = theme.lineHex;
    ctx.font = 'italic 600 44px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText('y = mx + b', right - 18, bottom - 18);
  } else if (theme.diagramType === 'linear') {
    // Classic brass algebraic balance scale (matching Vol. 02 in reference)
    const beamY = cy - 42;
    ctx.strokeStyle = theme.lineHex;
    ctx.fillStyle = theme.lineHex;
    ctx.lineWidth = 8;

    // Pedestal base & upright stem
    ctx.beginPath();
    ctx.moveTo(cx - 110, bottom - 28);
    ctx.lineTo(cx + 110, bottom - 28);
    ctx.moveTo(cx, bottom - 28);
    ctx.lineTo(cx, beamY - 26);
    ctx.stroke();

    // Horizontal balance beam
    ctx.beginPath();
    ctx.moveTo(cx - 195, beamY);
    ctx.lineTo(cx + 195, beamY);
    ctx.stroke();

    // Hanging chains & weighing pans
    [-168, 168].forEach((dx) => {
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(cx + dx, beamY);
      ctx.lineTo(cx + dx - 52, cy + 62);
      ctx.moveTo(cx + dx, beamY);
      ctx.lineTo(cx + dx + 52, cy + 62);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx + dx, cy + 62, 56, 0, Math.PI, false);
      ctx.fill();
    });

    ctx.beginPath();
    ctx.arc(cx, beamY, 16, 0, Math.PI * 2);
    ctx.fill();
  } else if (theme.diagramType === 'systems') {
    // Intersecting coordinate lines & inequality half-plane (matching Vol. 03 in reference)
    drawAxes(cx - 8, cy + 16);

    ctx.fillStyle = 'rgba(140, 197, 232, 0.16)';
    ctx.beginPath();
    ctx.moveTo(left + 20, bottom - 24);
    ctx.lineTo(right - 20, top + 28);
    ctx.lineTo(right - 20, top + 12);
    ctx.lineTo(left + 20, top + 12);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = theme.titleHex;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(left + 24, bottom - 26);
    ctx.lineTo(right - 22, top + 30);
    ctx.stroke();

    ctx.strokeStyle = theme.lineHex;
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(left + 32, top + 58);
    ctx.lineTo(right - 24, bottom - 34);
    ctx.stroke();

    ctx.fillStyle = theme.titleHex;
    ctx.beginPath();
    ctx.arc(cx + 14, cy + 6, 15, 0, Math.PI * 2);
    ctx.fill();
  } else if (theme.diagramType === 'functions') {
    // Smooth quadratic/function graph on Cartesian axes (matching Vol. 04 in reference)
    drawAxes(cx, bottom - 68);
    ctx.strokeStyle = theme.titleHex;
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const t = (i / 60) * 2 - 1;
      const px = cx + t * (w * 0.38);
      const py = bottom - 34 - t * t * (h * 0.72);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Dashed linear tangent / model line
    ctx.strokeStyle = theme.lineHex;
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 9]);
    ctx.beginPath();
    ctx.moveTo(left + 38, bottom - 28);
    ctx.lineTo(right - 34, top + 38);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (theme.diagramType === 'exponents') {
    // Crisp bold italic exponent identity (matching Vol. 05 in reference)
    ctx.fillStyle = theme.titleHex;
    ctx.font = 'italic bold 82px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('aᵐ · aⁿ = aᵐ⁺ⁿ', cx, cy + 8);
  } else {
    // Crisp factored polynomial identity (matching Vol. 06 in reference)
    ctx.fillStyle = theme.titleHex;
    ctx.font = 'italic bold 72px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('x² − 5x + 6', cx, cy - 42);
    ctx.fillStyle = theme.lineHex;
    ctx.font = 'italic bold 66px "Playfair Display", Georgia, serif';
    ctx.fillText('= (x − 2)(x − 3)', cx, cy + 52);
  }

  ctx.restore();
}

const ARCHIVE_TEXTURE_CACHE = new Map<string, THREE.CanvasTexture>();

function getOrCreateArchiveBookTexture(volumeNumber: number, theme: ArchiveBookTheme): THREE.CanvasTexture {
  const key = `${volumeNumber}-${theme.coverHex}`;
  let tex = ARCHIVE_TEXTURE_CACHE.get(key);
  if (!tex) {
    tex = createArchiveBookTexture(volumeNumber, theme);
    ARCHIVE_TEXTURE_CACHE.set(key, tex);
  }
  return tex;
}

/* ───────────────────────────────────────────────────────────────
 *  512×720 Academic Hardcover Book Texture (High-DPI Scaled, Fast Rasterization)
 * ─────────────────────────────────────────────────────────────── */
function createArchiveBookTexture(
  volumeNumber: number,
  theme: ArchiveBookTheme
): THREE.CanvasTexture {
  // High-performance 512x720 canvas (4x fewer pixels to rasterize than 1024x1440, saves ~27MB VRAM across 6 books)
  const W = 512;
  const H = 720;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Scale 2x down: all subsequent vector coords, bezier diagrams & typography scale cleanly
  ctx.scale(0.5, 0.5);

  // Rich cloth / leather hardcover base gradient (1024x1440 coordinate space)
  const grad = ctx.createLinearGradient(0, 0, 1024, 1440);
  grad.addColorStop(0, theme.coverHex);
  grad.addColorStop(0.58, theme.bgHex);
  grad.addColorStop(1, theme.edgeHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1440);

  // Realistic left bookbinding spine hinge shadow & ridge
  const hinge = ctx.createLinearGradient(0, 0, 96, 0);
  hinge.addColorStop(0, 'rgba(0,0,0,0.42)');
  hinge.addColorStop(0.42, 'rgba(0,0,0,0.16)');
  hinge.addColorStop(0.62, 'rgba(255,248,224,0.12)');
  hinge.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hinge;
  ctx.fillRect(0, 0, 96, 1440);

  // Clean restrained single academic press hairline border (NO religious rosettes/medallions)
  const padL = 94;
  const padR = 1024 - 54;
  const padT = 56;
  const padB = 1440 - 56;
  const centerX = (padL + padR) / 2;

  ctx.strokeStyle = theme.lineHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(padL, padT, padR - padL, padB - padT);

  // Minimal geometric corner ticks (classic European academic bookbinding, clean & restrained)
  const tick = 34;
  ctx.lineWidth = 6;
  const corners: [number, number, number, number][] = [
    [padL + 14, padT + 14, 1, 1],
    [padR - 14, padT + 14, -1, 1],
    [padL + 14, padB - 14, 1, -1],
    [padR - 14, padB - 14, -1, -1],
  ];
  corners.forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x, y + dy * tick);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * tick, y);
    ctx.stroke();
  });

  // Top Volume Label
  ctx.fillStyle = theme.volHex;
  ctx.font = '600 44px "Playfair Display", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`Vol. 0${volumeNumber}`, centerX, 166);

  // Crisp editorial serif title lines
  ctx.fillStyle = theme.titleHex;
  const isThreeLines = theme.titleLines.length >= 3;
  ctx.font = isThreeLines
    ? '700 80px "Playfair Display", Georgia, serif'
    : '700 94px "Playfair Display", Georgia, serif';
  const lineH = isThreeLines ? 102 : 114;
  const titleStartY = isThreeLines ? 305 : 350;
  theme.titleLines.forEach((line, idx) => {
    ctx.fillText(line, centerX, titleStartY + idx * lineH);
  });

  // Thin crisp horizontal separator
  const ruleY = titleStartY + theme.titleLines.length * lineH + 20;
  ctx.strokeStyle = theme.lineHex;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(centerX - 180, ruleY);
  ctx.lineTo(centerX + 180, ruleY);
  ctx.stroke();

  // Mathematical diagram / equation showcase
  drawTextbookDiagram(ctx, theme, centerX, 975, padR - padL - 120, 420);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/* ───────────────────────────────────────────────────────────────
 *  Emerald Velvet Banner with Academic Pi Emblem Texture
 * ─────────────────────────────────────────────────────────────── */
function createPiBannerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 256, 512);
    g.addColorStop(0, '#0E3826');
    g.addColorStop(0.5, '#164E37');
    g.addColorStop(1, '#092318');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 512);

    ctx.strokeStyle = '#DFBF72';
    ctx.lineWidth = 8;
    ctx.strokeRect(18, 18, 220, 476);

    ctx.fillStyle = '#EBD086';
    ctx.font = 'bold 148px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('π', 128, 240);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ───────────────────────────────────────────────────────────────
 *  Polished Dark Walnut Woodgrain Tabletop Texture (Optimized 512×256)
 * ─────────────────────────────────────────────────────────────── */
function createWalnutWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(0.5, 0.5);
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#2B1B11');
    g.addColorStop(0.5, '#3E2819');
    g.addColorStop(1, '#23160E');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 512);

    for (let i = 0; i < 28; i++) {
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(18,10,5,0.28)' : 'rgba(128,84,48,0.12)';
      ctx.lineWidth = 2 + (i % 4);
      ctx.beginPath();
      const y = (i / 28) * 512;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(320, y + Math.sin(i) * 8, 680, y - Math.cos(i) * 8, 1024, y);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ───────────────────────────────────────────────────────────────
 *  Tall Emerald Stained-Glass Pointed Gothic Lancet Windows
 * ─────────────────────────────────────────────────────────────── */
const GothicStainedGlassWindow: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
}> = ({ position, rotationY = 0, scale = 1 }) => {
  const { windowGeo, archRimGeo, shader } = useMemo(() => {
    const w = 1.55;
    const h = 4.2;
    const shape = new THREE.Shape();
    shape.moveTo(-w, 0);
    shape.lineTo(-w, h);
    shape.quadraticCurveTo(-w * 0.92, h + 1.55, 0, h + 2.35);
    shape.quadraticCurveTo(w * 0.92, h + 1.55, w, h);
    shape.lineTo(w, 0);
    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape, 20);

    // Pointed gothic stone arch outline curve
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const x = -w + t * w;
      const y = h + Math.sin((t * Math.PI) / 2) * 2.35;
      pts.push(new THREE.Vector3(x, y, 0.06));
    }
    for (let i = 1; i <= 24; i++) {
      const t = i / 24;
      const x = t * w;
      const y = h + Math.cos((t * Math.PI) / 2) * 2.35;
      pts.push(new THREE.Vector3(x, y, 0.06));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const rim = new THREE.TubeGeometry(curve, 36, 0.14, 8, false);

    const sh = {
      uniforms: {
        uDeep: { value: new THREE.Color('#092924') },
        uEmerald: { value: new THREE.Color('#277D6E') },
        uMoon: { value: new THREE.Color('#A8EFE2') },
      },
      vertexShader: `
        varying vec2 vPos;
        void main() {
          vPos = position.xy;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uDeep;
        uniform vec3 uEmerald;
        uniform vec3 uMoon;
        varying vec2 vPos;
        void main() {
          float ny = clamp(vPos.y / 6.5, 0.0, 1.0);
          float nx = abs(vPos.x) / 1.55;
          float glow = smoothstep(0.1, 0.85, ny) * (1.0 - nx * 0.45);
          // Subtle leaded stained-glass diamond pane pattern
          float d1 = abs(fract((vPos.x + vPos.y) * 2.1) - 0.5);
          float d2 = abs(fract((vPos.x - vPos.y) * 2.1) - 0.5);
          float lead = smoothstep(0.44, 0.49, max(d1, d2));
          vec3 col = mix(uDeep, uEmerald, glow);
          col = mix(col, uMoon, pow(glow, 2.2) * 0.65);
          col *= (1.0 - lead * 0.55);
          gl_FragColor = vec4(col, 0.92);
        }
      `,
    };

    return { windowGeo: geo, archRimGeo: rim, shader: sh };
  }, []);

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* Stained-glass lancet glass pane */}
      <mesh geometry={windowGeo}>
        <shaderMaterial args={[shader]} transparent />
      </mesh>
      {/* Stone Gothic pointed arch molding */}
      <mesh geometry={archRimGeo}>
        <meshStandardMaterial color="#18241E" roughness={0.82} metalness={0.1} />
      </mesh>
      {/* Dark iron vertical lancet mullions */}
      {[-0.52, 0.52].map((mx, i) => (
        <mesh key={i} position={[mx, 2.55, 0.06]}>
          <boxGeometry args={[0.07, 5.1, 0.08]} />
          <meshStandardMaterial color="#101B16" roughness={0.6} metalness={0.45} />
        </mesh>
      ))}
      {[1.5, 3.0, 4.35].map((my, i) => (
        <mesh key={`h-${i}`} position={[0, my, 0.06]}>
          <boxGeometry args={[3.05, 0.06, 0.08]} />
          <meshStandardMaterial color="#101B16" roughness={0.6} metalness={0.45} />
        </mesh>
      ))}
      {/* Gothic stone side jambs */}
      {[-1.58, 1.58].map((sx, i) => (
        <mesh key={`s-${i}`} position={[sx, 2.1, 0.06]}>
          <boxGeometry args={[0.24, 4.3, 0.24]} />
          <meshStandardMaterial color="#18241E" roughness={0.84} />
        </mesh>
      ))}
    </group>
  );
};

/* ───────────────────────────────────────────────────────────────
 *  Grand Spiral Staircase & Elevated Balcony Wing (Right Archive)
 * ─────────────────────────────────────────────────────────────── */
const SpiralStaircaseAndBalcony: React.FC = () => {
  const { steps, railGeo } = useMemo(() => {
    const count = 26;
    const stepList: { pos: [number, number, number]; rotY: number }[] = [];
    const railPts: THREE.Vector3[] = [];
    const radius = 1.65;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const angle = t * Math.PI * 1.9 + 0.4;
      const y = 0.2 + t * 5.2;
      stepList.push({
        pos: [Math.cos(angle) * (radius * 0.55), y, Math.sin(angle) * (radius * 0.55)],
        rotY: -angle,
      });
      railPts.push(new THREE.Vector3(Math.cos(angle) * radius, y + 0.92, Math.sin(angle) * radius));
    }
    const curve = new THREE.CatmullRomCurve3(railPts);
    const tube = new THREE.TubeGeometry(curve, 64, 0.045, 8, false);
    return { steps: stepList, railGeo: tube };
  }, []);

  return (
    <group position={[6.7, 0, -2.5]}>
      {/* Carved central spiral stone/walnut column */}
      <mesh position={[0, 3.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.3, 6.8, 16]} />
        <meshStandardMaterial color="#241912" roughness={0.62} metalness={0.14} />
      </mesh>

      {/* Helical wooden steps */}
      {steps.map((s, i) => (
        <group key={i} position={s.pos} rotation={[0, s.rotY, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.45, 0.08, 0.42]} />
            <meshStandardMaterial color="#3B271A" roughness={0.58} metalness={0.08} />
          </mesh>
          {/* Brass outer baluster post */}
          <mesh position={[0.72, 0.46, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.92, 6]} />
            <meshStandardMaterial color="#BFA058" roughness={0.34} metalness={0.82} />
          </mesh>
        </group>
      ))}

      {/* Continuous sweeping brass spiral handrail */}
      <mesh geometry={railGeo}>
        <meshStandardMaterial color="#D6B466" roughness={0.28} metalness={0.86} />
      </mesh>

      {/* Elevated horizontal curving mezzanine balcony wrapping upper right wing */}
      <group position={[-0.2, 4.35, -0.5]}>
        <mesh rotation={[Math.PI / 2, 0, 0.25]} receiveShadow>
          <torusGeometry args={[2.55, 0.16, 10, 36, Math.PI * 1.15]} />
          <meshStandardMaterial color="#2E1E14" roughness={0.58} />
        </mesh>
        <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0.25]}>
          <torusGeometry args={[2.52, 0.045, 8, 36, Math.PI * 1.15]} />
          <meshStandardMaterial color="#D8B668" roughness={0.28} metalness={0.85} />
        </mesh>
      </group>
    </group>
  );
};

/* ───────────────────────────────────────────────────────────────
 *  Gently Floating Wax Candles with Flickering Warm Flames
 * ─────────────────────────────────────────────────────────────── */
const CANDLE_SPECS: { pos: [number, number, number]; h: number; phase: number }[] = [
  { pos: [-5.8, 4.3, -2.6], h: 0.52, phase: 0.2 },
  { pos: [-4.6, 5.1, -3.5], h: 0.44, phase: 1.4 },
  { pos: [-3.9, 3.8, -3.0], h: 0.48, phase: 2.3 },
  { pos: [-2.8, 5.4, -4.2], h: 0.42, phase: 0.9 },
  { pos: [-3.2, 3.2, -3.6], h: 0.4, phase: 3.1 },
  { pos: [-5.2, 3.4, -1.8], h: 0.38, phase: 4.0 },
  { pos: [3.2, 5.2, -3.8], h: 0.46, phase: 1.8 },
  { pos: [4.1, 4.4, -3.2], h: 0.5, phase: 2.9 },
  { pos: [4.8, 5.5, -2.8], h: 0.42, phase: 0.5 },
  { pos: [3.5, 3.5, -2.9], h: 0.4, phase: 3.7 },
  { pos: [5.4, 4.2, -2.0], h: 0.48, phase: 1.1 },
  { pos: [2.4, 4.8, -4.5], h: 0.4, phase: 4.5 },
  { pos: [-1.8, 5.8, -4.8], h: 0.38, phase: 2.1 },
  { pos: [1.6, 5.9, -4.6], h: 0.4, phase: 5.2 },
];

const FloatingCandles: React.FC = () => {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const flameRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    CANDLE_SPECS.forEach((c, i) => {
      const grp = groupRefs.current[i];
      if (grp) {
        grp.position.y = c.pos[1] + Math.sin(t * 0.95 + c.phase) * 0.11;
      }
      const fl = flameRefs.current[i];
      if (fl) {
        const flick = 0.92 + Math.sin(t * 8.5 + c.phase * 3.1) * 0.1 + Math.cos(t * 13 + i) * 0.06;
        fl.scale.set(flick, 1.0 + (flick - 0.92) * 1.4, flick);
      }
    });
  });

  return (
    <group>
      {CANDLE_SPECS.map((c, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
          position={c.pos}
        >
          {/* Tapered warm translucent wax candle body with warm subsurface glow */}
          <mesh>
            <cylinderGeometry args={[0.042, 0.05, c.h, 10]} />
            <meshStandardMaterial
              color="#FFF4DF"
              emissive="#A87430"
              emissiveIntensity={0.42}
              roughness={0.55}
            />
          </mesh>
          {/* Bright warm golden-amber flickering flame */}
          <mesh
            ref={(el) => {
              flameRefs.current[i] = el;
            }}
            position={[0, c.h * 0.5 + 0.11, 0]}
          >
            <coneGeometry args={[0.048, 0.21, 8]} />
            <meshBasicMaterial color="#FFF4C2" />
          </mesh>
          {/* Warm amber candlelight aura (consolidated single mesh for optimal draw call count) */}
          <mesh position={[0, c.h * 0.5 + 0.1, 0]}>
            <sphereGeometry args={[0.22, 10, 10]} />
            <meshBasicMaterial color="#FFB03B" transparent opacity={0.34} depthWrite={false} />
          </mesh>
        </group>
      ))}

      {/* Pooled warm candlelight illumination (optimized light count) */}
      <pointLight position={[-4.5, 4.4, -2.6]} color="#FFD68A" intensity={14} distance={14} decay={2} />
      <pointLight position={[4.5, 4.5, -2.5]} color="#FFD68A" intensity={14} distance={14} decay={2} />
      <pointLight position={[0, 5.4, -3.2]} color="#FFE2A8" intensity={10} distance={14} decay={2} />
    </group>
  );
};

/* ───────────────────────────────────────────────────────────────
 *  Scholarly Desk Instruments (Left Armillary Sphere & Right Celestial Globe)
 * ─────────────────────────────────────────────────────────────── */
const BrassArmillarySphere: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.y += delta * 0.18;
    }
  });

  return (
    <group position={position}>
      {/* Turned brass pedestal base */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.34, 0.16, 20]} />
        <meshStandardMaterial color="#C8A252" roughness={0.32} metalness={0.86} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.045, 0.075, 0.36, 12]} />
        <meshStandardMaterial color="#D8B668" roughness={0.28} metalness={0.88} />
      </mesh>

      {/* Nested rotating brass celestial meridian rings */}
      <group ref={ringsRef} position={[0, 0.98, 0]}>
        <mesh>
          <torusGeometry args={[0.52, 0.028, 10, 40]} />
          <meshStandardMaterial color="#E5C474" roughness={0.24} metalness={0.9} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.5, 0.026, 10, 40]} />
          <meshStandardMaterial color="#D6B362" roughness={0.28} metalness={0.88} />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0.4, 0]}>
          <torusGeometry args={[0.45, 0.036, 10, 40]} />
          <meshStandardMaterial color="#E8CA7E" roughness={0.26} metalness={0.9} />
        </mesh>
        {/* Central golden axis rod & core sphere */}
        <mesh rotation={[0, 0, 0.42]}>
          <cylinderGeometry args={[0.016, 0.016, 1.12, 8]} />
          <meshStandardMaterial color="#C9A250" roughness={0.3} metalness={0.88} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial
            color="#F5DC9B"
            emissive="#C89B44"
            emissiveIntensity={0.45}
            roughness={0.22}
            metalness={0.88}
          />
        </mesh>
      </group>
    </group>
  );
};

const CelestialMathGlobe: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const coreRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y -= delta * 0.22;
    }
  });

  return (
    <group position={position}>
      {/* Carved pedestal stand */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.36, 0.28, 20]} />
        <meshStandardMaterial color="#2D1E14" roughness={0.55} metalness={0.14} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <torusGeometry args={[0.29, 0.025, 8, 28]} />
        <meshStandardMaterial color="#DFBF70" roughness={0.28} metalness={0.88} />
      </mesh>

      {/* Luminous translucent celestial crystal globe */}
      <group position={[0, 0.72, 0]}>
        <mesh>
          <sphereGeometry args={[0.44, 28, 28]} />
          <meshPhysicalMaterial
            color="#98D8E6"
            emissive="#2B6B82"
            emissiveIntensity={0.55}
            transparent
            opacity={0.46}
            roughness={0.1}
            metalness={0.05}
            clearcoat={1.0}
          />
        </mesh>
        <group ref={coreRef}>
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[0.31, 0.012, 8, 32]} />
            <meshBasicMaterial color="#FFF0BE" />
          </mesh>
          <mesh rotation={[-Math.PI / 5, Math.PI / 3, 0]}>
            <torusGeometry args={[0.25, 0.01, 8, 28]} />
            <meshBasicMaterial color="#BCEEF8" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshBasicMaterial color="#FFF2C4" />
          </mesh>
        </group>
        <pointLight color="#A8E4F0" intensity={5.5} distance={5.5} decay={2} />
      </group>
    </group>
  );
};

/* ───────────────────────────────────────────────────────────────
 *  Single Dimensional Hardcover Archive Textbook (book_volume.glb)
 * ─────────────────────────────────────────────────────────────── */
const ArchiveTextbookVolume: React.FC<{
  module: LibraryModuleItem;
  index: number;
  position: [number, number, number];
  rotationY: number;
  isActive: boolean;
  onSelect: (name: string) => void;
}> = ({ module, index, position, rotationY, isActive, onSelect }) => {
  const { scene } = useGLTF(MODEL_BOOK_VOLUME);
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const theme = useMemo(() => getThemeForModule(module.name, index), [module.name, index]);

  const coverTexture = useMemo(
    () => getOrCreateArchiveBookTexture(index + 1, theme),
    [index, theme]
  );

  // Clone verified Poly Haven book mesh: customize cover color & keep realistic layered cream paper
  const customizedBook = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const origMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        const matName = (origMat?.name || '').toLowerCase();

        if (matName.includes('cover')) {
          const std = (origMat as THREE.MeshStandardMaterial).clone();
          std.map = null;
          std.color = new THREE.Color(theme.coverHex);
          std.roughness = theme.isLight ? 0.58 : 0.42;
          std.metalness = 0.08;
          std.needsUpdate = true;
          mesh.material = std;
        } else if (origMat) {
          const paperMat = (origMat as THREE.MeshStandardMaterial).clone();
          paperMat.color = new THREE.Color('#FAF3E0');
          paperMat.roughness = 0.82;
          mesh.material = paperMat;
        }
      }
    });
    return clone;
  }, [scene, theme]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const alpha = 1 - Math.exp(-Math.min(delta, 0.05) * 6.5);
    const targetY = position[1] + (isActive ? 0.15 : hovered ? 0.09 : 0);
    const targetZ = position[2] + (isActive ? 0.42 : hovered ? 0.15 : 0);
    const targetRotX = isActive ? -0.06 : hovered ? -0.038 : -0.02;
    // Subtle perspective turn toward viewer on hover / selection without excessive motion
    const targetRotY = isActive
      ? rotationY * 0.6
      : hovered
      ? rotationY * 0.78
      : rotationY;

    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, alpha);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, alpha);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, alpha);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, alpha);
  });

  // book_volume.glb audited bbox: X [-0.019..0.019], Y [0..0.237], Z [-0.163..0]
  // Increased ~17% for commanding foreground presence while maintaining crisp spacing
  const HEIGHT_SCALE = 7.25;
  const WIDTH_SCALE = 7.15;
  const THICKNESS_SCALE = 9.8;
  const frontFaceZ = 0.0192 * THICKNESS_SCALE + 0.006;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[-0.02, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(module.name);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Real Poly Haven CC0 Hardcover Textbook Mesh */}
      <group rotation={[0, Math.PI / 2, 0]} scale={[THICKNESS_SCALE, HEIGHT_SCALE, WIDTH_SCALE]}>
        <primitive object={customizedBook} position={[0, 0, 0.0815]} />
      </group>

      {/* High-DPI Embossed Academic Cover Plate */}
      <mesh position={[0, 0.237 * HEIGHT_SCALE * 0.5, frontFaceZ]} castShadow>
        <planeGeometry args={[0.158 * WIDTH_SCALE, 0.23 * HEIGHT_SCALE]} />
        <meshPhysicalMaterial
          map={coverTexture}
          roughness={theme.isLight ? 0.64 : 0.42}
          metalness={theme.isLight ? 0.04 : 0.12}
          clearcoat={theme.isLight ? 0.12 : 0.28}
          clearcoatRoughness={0.38}
          emissive={isActive ? (theme.isLight ? '#7A6434' : '#D9B664') : '#000000'}
          emissiveIntensity={isActive ? (theme.isLight ? 0.03 : 0.08) : 0}
        />
      </mesh>

      {/* Subtle golden selection / hover glow strip on table directly beneath active book */}
      {(isActive || hovered) && (
        <mesh position={[0, 0.015, frontFaceZ + 0.07]}>
          <boxGeometry args={[0.162 * WIDTH_SCALE, 0.022, 0.045]} />
          <meshStandardMaterial
            color={isActive ? '#FFEAA8' : '#D9B664'}
            emissive={isActive ? '#E8C266' : '#9E7D38'}
            emissiveIntensity={isActive ? 1.3 : 0.55}
            roughness={0.25}
            metalness={0.85}
          />
        </mesh>
      )}

      {(isActive || hovered) && (
        <pointLight
          position={[0, 1.65, 1.05]}
          color="#FFE8B0"
          intensity={
            isActive
              ? theme.isLight
                ? 1.15
                : 2.6
              : theme.isLight
              ? 0.55
              : 1.35
          }
          distance={4.5}
          decay={2}
        />
      )}
    </group>
  );
};

/* ───────────────────────────────────────────────────────────────
 *  Subtle Mouse-Responsive Side-View Camera Rig (NO OrbitControls!)
 *  - Zero wheel/scroll interception (browser vertical scroll works 100%)
 *  - Horizontal limit: max ±6° (reveals left bookshelves / right staircase)
 *  - Vertical limit: max ±2.5° (reveals upper vaults / lower table)
 *  - Smoothly returns to center when mouse leaves scene or Reset View clicked
 *  - Disabled automatically on touch devices & reduced-motion preference
 * ─────────────────────────────────────────────────────────────── */
const DEFAULT_CAM_POS: [number, number, number] = [0, 2.65, 9.85];
const DEFAULT_CAM_TARGET: [number, number, number] = [0, 2.74, -1.1];

const MAX_AZIMUTH_RAD = THREE.MathUtils.degToRad(6.0);
const MAX_ELEVATION_RAD = THREE.MathUtils.degToRad(2.5);

const ArchiveMouseCameraRig: React.FC<{
  pointerRef: React.RefObject<{ nx: number; ny: number }>;
  resetSignal: number;
}> = ({ pointerRef, resetSignal }) => {
  const { camera } = useThree();
  const current = useRef({ nx: 0, ny: 0 });
  const lookTarget = useRef(new THREE.Vector3(...DEFAULT_CAM_TARGET));
  const disabledRef = useRef(false);

  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqCoarse = window.matchMedia('(pointer: coarse)');
    const update = () => {
      disabledRef.current = mqMotion.matches || mqCoarse.matches;
    };
    update();
    mqMotion.addEventListener('change', update);
    mqCoarse.addEventListener('change', update);
    return () => {
      mqMotion.removeEventListener('change', update);
      mqCoarse.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (resetSignal > 0 && pointerRef.current) {
      pointerRef.current.nx = 0;
      pointerRef.current.ny = 0;
    }
  }, [resetSignal, pointerRef]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const alpha = 1 - Math.exp(-dt * 4.2);

    // Subtle scroll-aware atmospheric elevation (NO zoom, NO scroll locking):
    // as the reader scrolls down into the knowledge sections, gently ease mouse sway
    // and tilt slightly upward toward the floating candles & emerald stained-glass vaults
    const scrollProgress =
      typeof window !== 'undefined'
        ? THREE.MathUtils.clamp(window.scrollY / Math.max(window.innerHeight, 600), 0, 1)
        : 0;
    const parallaxFade = 1 - scrollProgress * 0.55;

    const targetNx = disabledRef.current
      ? 0
      : THREE.MathUtils.clamp(pointerRef.current?.nx ?? 0, -1, 1) * parallaxFade;
    const targetNy = disabledRef.current
      ? 0
      : THREE.MathUtils.clamp(pointerRef.current?.ny ?? 0, -1, 1) * parallaxFade;

    current.current.nx = THREE.MathUtils.lerp(current.current.nx, targetNx, alpha);
    current.current.ny = THREE.MathUtils.lerp(current.current.ny, targetNy, alpha);

    const nx = current.current.nx;
    const ny = current.current.ny;

    // Exact bounded angular excursion: max ±6.0° horizontal yaw, max ±2.5° vertical pitch
    const depth = DEFAULT_CAM_POS[2] - DEFAULT_CAM_TARGET[2]; // 10.95 m
    const yawSpan = Math.tan(MAX_AZIMUTH_RAD) * depth;
    const pitchSpan = Math.tan(MAX_ELEVATION_RAD) * depth;

    // Subtle lateral camera dolly + exact ±6° gaze shift reveals left bookshelves / right spiral staircase
    const camX = DEFAULT_CAM_POS[0] + nx * 0.62;
    const camY = DEFAULT_CAM_POS[1] - ny * 0.34 + scrollProgress * 0.28;
    const camZ = DEFAULT_CAM_POS[2] - Math.abs(nx) * 0.14;

    lookTarget.current.set(
      DEFAULT_CAM_TARGET[0] + nx * (0.62 + yawSpan),
      DEFAULT_CAM_TARGET[1] - ny * (0.34 + pitchSpan) + scrollProgress * 0.55,
      DEFAULT_CAM_TARGET[2]
    );

    camera.position.set(camX, camY, camZ);
    camera.lookAt(lookTarget.current);
  });

  return null;
};

/* ───────────────────────────────────────────────────────────────
 *  Main 3D Enchanted Mathematics Archive Scene
 * ─────────────────────────────────────────────────────────────── */
const EnchantedArchiveScene: React.FC<{
  modules: LibraryModuleItem[];
  activeModule?: string;
  onModuleClick?: (name: string) => void;
  pointerRef: React.RefObject<{ nx: number; ny: number }>;
  resetSignal: number;
}> = ({ modules, activeModule, onModuleClick, pointerRef, resetSignal }) => {
  const { scene: lanternScene } = useGLTF(MODEL_LANTERN);
  const walnutTex = useMemo(() => createWalnutWoodTexture(), []);
  const bannerTex = useMemo(() => createPiBannerTexture(), []);

  useEffect(() => {
    return () => {
      walnutTex.dispose();
      bannerTex.dispose();
    };
  }, [walnutTex, bannerTex]);

  // Overhead Gothic ribbed vault arch geometry
  const vaultRibGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const x = -7.8 + t * 15.6;
      const nx = Math.abs(x) / 7.8;
      const y = 5.4 + Math.pow(1 - nx, 0.72) * 3.8;
      pts.push(new THREE.Vector3(x, y, 0));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.22, 8, false);
  }, []);

  // Multi-floor towering wooden bookshelves along both left and right archive wings
  const bookshelfInstances = useMemo<InstanceTransform[]>(
    () => [
      // Left multi-story bookcase wing (ground & balcony)
      { position: [-6.8, 0, -2.2], rotation: [0, 0.56, 0], scale: 1.68 },
      { position: [-7.7, 0, -0.1], rotation: [0, 0.92, 0], scale: 1.68 },
      { position: [-5.4, 0, -4.4], rotation: [0, 0.22, 0], scale: 1.68 },
      { position: [-6.8, 3.45, -2.2], rotation: [0, 0.56, 0], scale: 1.62 },
      { position: [-5.4, 3.45, -4.4], rotation: [0, 0.22, 0], scale: 1.62 },
      // Right multi-story bookcase wing behind spiral staircase
      { position: [7.1, 0, -3.5], rotation: [0, -0.52, 0], scale: 1.68 },
      { position: [8.0, 0, -1.2], rotation: [0, -0.88, 0], scale: 1.68 },
      { position: [7.1, 3.45, -3.5], rotation: [0, -0.52, 0], scale: 1.62 },
      { position: [8.0, 3.45, -1.2], rotation: [0, -0.88, 0], scale: 1.62 },
    ],
    []
  );

  // Instanced background scholarly books filling the towering walnut shelves
  const { emeraldShelfBooks, burgundyShelfBooks, ivoryShelfBooks } = useMemo(() => {
    const emerald: InstanceTransform[] = [];
    const burgundy: InstanceTransform[] = [];
    const ivory: InstanceTransform[] = [];
    const tiers = [0.68, 1.32, 1.96, 2.6];

    bookshelfInstances.forEach((shelf, sIdx) => {
      const [sx, sy, sz] = shelf.position;
      const rotY = shelf.rotation?.[1] ?? 0;
      const cos = Math.cos(rotY);
      const sin = Math.sin(rotY);

      tiers.forEach((hy, hIdx) => {
        for (let b = -3; b <= 3; b++) {
          if ((sIdx * 3 + hIdx + b) % 5 === 0) continue;
          const localX = b * 0.23;
          const localZ = 0.08;
          const wx = sx + localX * cos + localZ * sin;
          const wz = sz - localX * sin + localZ * cos;
          const inst: InstanceTransform = {
            position: [wx, sy + hy, wz],
            rotation: [0, rotY + ((b + hIdx) % 4 === 0 ? 0.05 : 0), 0],
            scale: [1.5, 1.48 + ((Math.abs(b * 5 + sIdx + hIdx)) % 3) * 0.14, 1.5],
          };
          const bucket = Math.abs(sIdx * 7 + hIdx * 3 + b) % 3;
          if (bucket === 0) emerald.push(inst);
          else if (bucket === 1) burgundy.push(inst);
          else ivory.push(inst);
        }
      });
    });

    return {
      emeraldShelfBooks: emerald,
      burgundyShelfBooks: burgundy,
      ivoryShelfBooks: ivory,
    };
  }, [bookshelfInstances]);

  // Sweeping foreground crescent arrangement for all 6 enlarged Mathematics Textbooks (clean spacing preserved)
  const heroSlots = useMemo(() => {
    const count = Math.max(1, Math.min(modules.length, 6));
    return modules.slice(0, 6).map((mod, idx) => {
      const t = count === 1 ? 0 : (idx / (count - 1)) * 2 - 1; // -1 .. +1
      const x = t * 4.35; // ~1.74m center-to-center across wider foreground table
      const z = 1.48 - Math.abs(t) * Math.abs(t) * 0.44;
      const rotY = -t * 0.22 + 0.07;
      return {
        module: mod,
        position: [x, 0.89, z] as [number, number, number],
        rotationY: rotY,
      };
    });
  }, [modules]);

  return (
    <group>
      <ArchiveMouseCameraRig pointerRef={pointerRef} resetSignal={resetSignal} />

      {/* ── Layered Cinematic Lighting: Crisp Warm Foreground vs Moody Emerald Depth ── */}
      <hemisphereLight args={['#85D4C6', '#160E09', 0.54]} />

      {/* Primary warm gallery key light sculpting the 6 foreground books and walnut tabletop */}
      <directionalLight
        position={[4.2, 8.8, 8.2]}
        intensity={1.95}
        color="#FFEFCC"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={8}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0004}
      />
      {/* Cool emerald-teal moonlight rim from the rear stained-glass cathedral windows */}
      <directionalLight position={[-3, 7.2, -8.5]} intensity={1.45} color="#4EC2B0" />
      {/* Balanced soft warm front-left fill for effortless cover legibility without ivory blowout */}
      <directionalLight position={[-5.5, 4.0, 9.0]} intensity={0.62} color="#F7E3BC" />
      {/* Dedicated warm foreground table & book-cover illumination pools (left, center, right) */}
      <pointLight position={[-3.3, 3.15, 3.55]} color="#FFE2A8" intensity={4.8} distance={7.5} decay={2} />
      <pointLight position={[0, 3.25, 3.85]} color="#FFE6B4" intensity={5.4} distance={8.0} decay={2} />
      <pointLight position={[3.3, 3.15, 3.55]} color="#FFE2A8" intensity={4.8} distance={7.5} decay={2} />

      {/* ── Deep Cathedral Rear Stone Wall & Emerald Stained-Glass Gothic Windows ── */}
      <mesh position={[0, 4.8, -7.8]}>
        <planeGeometry args={[30, 14]} />
        <meshStandardMaterial color="#071611" roughness={0.94} />
      </mesh>

      {/* Four towering pointed emerald stained-glass Gothic windows */}
      <GothicStainedGlassWindow position={[-5.2, 1.3, -6.2]} rotationY={0.28} scale={0.95} />
      <GothicStainedGlassWindow position={[-2.1, 1.5, -7.1]} rotationY={0.08} scale={1.0} />
      <GothicStainedGlassWindow position={[2.2, 1.5, -7.1]} rotationY={-0.08} scale={1.0} />
      <GothicStainedGlassWindow position={[5.3, 1.3, -6.2]} rotationY={-0.28} scale={0.95} />

      {/* Overhead Gothic vaulted stone ribs & dark carved columns */}
      <mesh geometry={vaultRibGeo} position={[0, 0, -5.6]}>
        <meshStandardMaterial color="#14201A" roughness={0.85} />
      </mesh>
      <mesh geometry={vaultRibGeo} position={[0, 0, -2.4]}>
        <meshStandardMaterial color="#111C17" roughness={0.85} />
      </mesh>
      {[-6.2, -3.7, 3.7, 6.2].map((cx, i) => (
        <mesh key={`gcol-${i}`} position={[cx, 4.2, i === 0 || i === 3 ? -5.0 : -6.6]}>
          <cylinderGeometry args={[0.28, 0.34, 8.6, 12]} />
          <meshStandardMaterial color="#15221C" roughness={0.84} />
        </mesh>
      ))}

      {/* Academic Emerald Velvet π Banner hanging on left Gothic pillar */}
      <group position={[-4.55, 3.45, -4.35]} rotation={[0, 0.25, 0]}>
        <mesh>
          <planeGeometry args={[0.92, 1.95]} />
          <meshStandardMaterial map={bannerTex} roughness={0.78} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.99, 0.02]}>
          <cylinderGeometry args={[0.03, 0.03, 1.06, 10]} />
          <meshStandardMaterial color="#D8B668" roughness={0.3} metalness={0.86} />
        </mesh>
      </group>

      {/* ── Multi-Story Towering Walnut Bookshelves & Instanced Scholarly Books ── */}
      <InstancedGLB
        url={MODEL_BOOKSHELF}
        instances={bookshelfInstances}
        tintColor="#6E4E34"
        roughnessOverride={0.64}
      />
      <InstancedGLB url={MODEL_BOOK_VOLUME} instances={emeraldShelfBooks} tintColor="#1B4D36" castShadow={false} />
      <InstancedGLB url={MODEL_BOOK_VOLUME} instances={burgundyShelfBooks} tintColor="#5D2A26" castShadow={false} />
      <InstancedGLB url={MODEL_BOOK_VOLUME} instances={ivoryShelfBooks} tintColor="#CFC3A6" castShadow={false} />

      {/* ── Grand Spiral Staircase & Elevated Balcony Wing (Right) ── */}
      <SpiralStaircaseAndBalcony />

      {/* Subtle warm antique library sconce lantern on far upper-right balcony */}
      <group position={[7.4, 6.0, -0.8]}>
        <Clone object={lanternScene} scale={0.78} />
        <pointLight position={[0, -0.7, 0.3]} color="#FFD892" intensity={10} distance={10} decay={2} />
      </group>

      {/* ── Gently Floating Warm Wax Candles ── */}
      <FloatingCandles />

      {/* ── Polished Dark Stone Cathedral Floor ── */}
      <mesh position={[0, 0, -1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[32, 24]} />
        <meshStandardMaterial color="#091510" roughness={0.35} metalness={0.14} />
      </mesh>

      {/* ── Grand Foreground Mahogany & Walnut Archive Display Table (Clean Unobstructed Surface) ── */}
      <group position={[0, 0, 1.35]}>
        {/* Sculpted sweeping dark walnut tabletop slab */}
        <mesh position={[0, 0.83, 0]} castShadow receiveShadow>
          <boxGeometry args={[14.2, 0.12, 2.85]} />
          <meshStandardMaterial
            map={walnutTex}
            color="#5C3D28"
            roughness={0.24}
            metalness={0.14}
          />
        </mesh>
        {/* Dark mahogany table apron & recessed molding */}
        <mesh position={[0, 0.42, -0.15]} castShadow receiveShadow>
          <boxGeometry args={[13.6, 0.78, 2.3]} />
          <meshStandardMaterial color="#24160D" roughness={0.58} metalness={0.08} />
        </mesh>
        {/* Subtle brushed brass table molding strip */}
        <mesh position={[0, 0.76, 1.42]}>
          <boxGeometry args={[14.1, 0.036, 0.04]} />
          <meshStandardMaterial color="#D4AE5E" roughness={0.26} metalness={0.88} />
        </mesh>
      </group>

      {/* Soft grounded contact shadows on the display table (baked once to eliminate per-frame FBO re-rendering) */}
      <ContactShadows
        position={[0, 0.895, 1.35]}
        opacity={0.62}
        scale={16}
        blur={1.7}
        far={2.6}
        color="#050D09"
        frames={1}
      />

      {/* ── Dedicated 3D Showcase Emblem for GeometricShapes (coordinate-prism) Beside the Heading ── */}
      {/* Framed with a soft dark-emerald separation disc, brushed-gold astrolabe rim, and floating marble saucer */}
      {/* Scaled and nestled into the architectural niche so the grand spiral staircase remains visually prominent */}
      <group position={[3.12, 4.32, 1.2]}>
        {/* Soft dark-emerald depth separation disc behind the sculpture so brass gimbals & glass read crisply */}
        <mesh position={[0, 0.04, -0.72]}>
          <circleGeometry args={[0.98, 48]} />
          <meshBasicMaterial color="#04130C" transparent opacity={0.78} depthWrite={false} />
        </mesh>
        {/* Subtle outer emerald aura ring */}
        <mesh position={[0, 0.04, -0.7]}>
          <ringGeometry args={[0.95, 1.03, 48]} />
          <meshBasicMaterial color="#52B788" transparent opacity={0.3} depthWrite={false} />
        </mesh>
        {/* Brushed champagne-gold architectural showcase rim */}
        <mesh position={[0, 0.04, -0.66]}>
          <torusGeometry args={[0.97, 0.018, 12, 56]} />
          <meshStandardMaterial
            color="#E8C97A"
            emissive="#B88E38"
            emissiveIntensity={0.35}
            roughness={0.22}
            metalness={0.9}
          />
        </mesh>

        {/* Sleek floating dark-emerald marble & gold saucer pedestal seated cleanly below the orbiting star finial */}
        <mesh position={[0, -0.8, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.6, 0.46, 0.085, 32]} />
          <meshStandardMaterial color="#0F2D1F" roughness={0.28} metalness={0.22} />
        </mesh>
        <mesh position={[0, -0.76, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.59, 0.015, 10, 40]} />
          <meshStandardMaterial
            color="#E8C97A"
            emissive="#C89D48"
            emissiveIntensity={0.4}
            roughness={0.22}
            metalness={0.9}
          />
        </mesh>

        {/* Dedicated crisp specular rim light so glass pyramid, engraved brass gimbals, and 3D gold π gleam */}
        <pointLight position={[0.55, 0.82, 1.35]} color="#FFF1CC" intensity={3.0} distance={4.2} decay={2} />
        <pointLight position={[-0.65, -0.25, 1.1]} color="#74F0B0" intensity={2.0} distance={3.8} decay={2} />

        {/* Upgraded Wizarding-Edition GeometricShapes (coordinate-prism) sharing LibraryWorld's single Canvas */}
        <GeometricShapes
          variant="coordinate-prism"
          accent="sage"
          scale={0.6}
          speed={0.85}
          interactive={true}
          position={[0, 0.08, 0.12]}
          rotation={[0.2, -0.35, 0]}
        />
      </group>

      {/* ── Scholarly Desk Instruments Flanking the Six Enlarged Textbooks ── */}
      <BrassArmillarySphere position={[-5.55, 0.89, 1.05]} />
      <CelestialMathGlobe position={[5.62, 0.89, 1.05]} />

      {/* ── Six Prominent Dimensional Mathematics Textbooks ── */}
      {heroSlots.map((slot, idx) => (
        <ArchiveTextbookVolume
          key={slot.module.name}
          module={slot.module}
          index={idx}
          position={slot.position}
          rotationY={slot.rotationY}
          isActive={activeModule === slot.module.name}
          onSelect={(name) => onModuleClick?.(name)}
        />
      ))}

      {/* Magical golden dust particles drifting through the gothic hall */}
      <Sparkles
        count={65}
        scale={[14, 7, 10]}
        position={[0, 3.6, -1.4]}
        size={2.3}
        speed={0.22}
        opacity={0.55}
        color="#F8E2A8"
      />
    </group>
  );
};

/* ═══════════════════════════════════════════════════════════════
 *  LibraryWorld — Full-Viewport Enchanted Mathematics Archive
 * ═══════════════════════════════════════════════════════════════ */
export const LibraryWorld: React.FC<LibraryWorldProps> = ({
  modules,
  activeModule = 'All',
  onModuleClick,
  resetSignal = 0,
  className = '',
}) => {
  const pointerRef = useRef({ nx: 0, ny: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Track pointer across the full hero bounding box (even over overlay controls),
  // returning smoothly to straight front center whenever cursor exits the library hero
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inside) {
        pointerRef.current.nx = 0;
        pointerRef.current.ny = 0;
        return;
      }
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      pointerRef.current.nx = THREE.MathUtils.clamp(nx, -1, 1);
      pointerRef.current.ny = THREE.MathUtils.clamp(ny, -1, 1);
    };

    const resetPointer = () => {
      pointerRef.current.nx = 0;
      pointerRef.current.ny = 0;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', resetPointer);
    window.addEventListener('blur', resetPointer);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', resetPointer);
      window.removeEventListener('blur', resetPointer);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full touch-pan-y ${className}`}
    >
      <WorldCanvas
        cameraPosition={DEFAULT_CAM_POS}
        cameraTarget={DEFAULT_CAM_TARGET}
        fov={43}
        fogColor="#05130D"
        fogNear={9.2}
        fogFar={25.5}
        backgroundColor="#040F0A"
        enableParallax={false}
        enableOrbit={false}
        fallbackTitle="The Enchanted Mathematics Archive"
        fallbackSubtitle="Explore all 6 OpenStax Algebra 1 volumes using the accessible shelf controls below."
        loadingLabel="Illuminating The EduPath Archives..."
        ariaLabel="3D Enchanted Mathematics Archive featuring six interactive OpenStax Algebra 1 textbooks"
      >
        <EnchantedArchiveScene
          modules={modules}
          activeModule={activeModule}
          onModuleClick={onModuleClick}
          pointerRef={pointerRef}
          resetSignal={resetSignal}
        />
      </WorldCanvas>
    </div>
  );
};

useGLTF.preload(MODEL_BOOKSHELF);
useGLTF.preload(MODEL_BOOK_VOLUME);
useGLTF.preload(MODEL_LANTERN);

export default LibraryWorld;
