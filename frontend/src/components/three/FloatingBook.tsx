import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface FloatingBookProps {
  scale?: number;
  coverColor?: string;
  pagesColor?: string;
  ribbonColor?: string;
  accentColor?: string;
  interactive?: boolean;
  floatingSpeed?: number;
  floatingIntensity?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Optional controlled open/closed state; omit for interactive click + gentle 3D open/close cycle */
  isOpen?: boolean;
  /** Automatically demonstrates 3D open & close when isOpen is uncontrolled (default: true) */
  autoCycle?: boolean;
}

/* ═══════════════════════════════════════════════════════════════
 *  ✦ THE ENCHANTED GRIMOIRE OF ALGEBRA — 3D OPEN & CLOSE ✦
 *  Ultra-Premium Wizarding Academia Tome
 *
 *  - Full 3D hinged cover & page-block open/close animation
 *    (folds cleanly shut to showcase the gilded front grimoire cover,
 *     then parts open with a warm golden spell-bloom & rising glyphs!)
 *  - Sculpted octagonal dark-emerald obsidian & antique-brass Gothic
 *    lectern plinth with rotating glowing arithmancy sigil circle
 *  - 3D antique-brass corner guards, hinged clasps & raised spine ribs
 *  - Floating 3D self-writing champagne-gold feather quill
 *  - Three staggered Hogwarts-style levitating drip-wax candles
 *  - Crimson-wax-sealed emerald silk ribbon & rising enchanted runes
 * ═══════════════════════════════════════════════════════════════ */

function clampHexColor(c: THREE.Color): string {
  const copy = c.clone();
  copy.r = Math.min(1, Math.max(0, copy.r));
  copy.g = Math.min(1, Math.max(0, copy.g));
  copy.b = Math.min(1, Math.max(0, copy.b));
  return '#' + copy.getHexString();
}

/* ───────────────────────────────────────────────────────────────
 *  Procedural Left Page — Illuminated Parchment & Coordinate Graph
 * ─────────────────────────────────────────────────────────────── */
function createLeftPageTexture(pagesColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const bg = ctx.createLinearGradient(0, 0, 768, 0);
  bg.addColorStop(0, '#D9C49B');
  bg.addColorStop(0.08, '#F1E2C2');
  bg.addColorStop(0.72, pagesColor || '#FAF0D7');
  bg.addColorStop(0.92, '#DAC59D');
  bg.addColorStop(1, '#856B4C');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 768, 1024);

  const vig = ctx.createRadialGradient(360, 512, 250, 360, 512, 620);
  vig.addColorStop(0, 'rgba(255, 244, 214, 0)');
  vig.addColorStop(1, 'rgba(110, 72, 32, 0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, 768, 1024);

  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = i % 3 === 0 ? 'rgba(120, 82, 40, 0.045)' : 'rgba(255, 248, 225, 0.035)';
    ctx.fillRect(Math.random() * 768, Math.random() * 1024, 2, 2);
  }

  ctx.strokeStyle = 'rgba(182, 138, 58, 0.62)';
  ctx.lineWidth = 2.4;
  ctx.strokeRect(52, 56, 628, 912);
  ctx.strokeStyle = 'rgba(182, 138, 58, 0.3)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(62, 66, 608, 892);

  const drawStar = (x: number, y: number, r: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const rad = i % 2 === 0 ? r : r * 0.34;
      const px = x + Math.cos(a) * rad;
      const py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  };
  [
    [62, 66],
    [670, 66],
    [62, 958],
    [670, 958],
  ].forEach(([sx, sy]) => drawStar(sx, sy, 9.5, 'rgba(196, 152, 64, 0.88)'));

  ctx.fillStyle = '#312113';
  ctx.font = 'italic 600 28px Georgia, "Palatino Linotype", serif';
  ctx.fillText('Chapter II · Linear Relations', 92, 122);

  ctx.strokeStyle = 'rgba(186, 142, 60, 0.78)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(92, 146);
  ctx.lineTo(352, 146);
  ctx.moveTo(380, 146);
  ctx.lineTo(638, 146);
  ctx.stroke();

  ctx.fillStyle = '#C6973E';
  ctx.beginPath();
  ctx.moveTo(366, 136);
  ctx.lineTo(376, 146);
  ctx.lineTo(366, 156);
  ctx.lineTo(356, 146);
  ctx.closePath();
  ctx.fill();

  const gx = 366;
  const gy = 432;
  const gSize = 200;

  ctx.strokeStyle = 'rgba(186, 142, 60, 0.25)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(gx, gy, gSize * 0.96, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(38, 96, 70, 0.14)';
  ctx.lineWidth = 1.3;
  for (let step = -4; step <= 4; step++) {
    const offset = step * 42;
    ctx.beginPath();
    ctx.moveTo(gx - gSize, gy + offset);
    ctx.lineTo(gx + gSize, gy + offset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gx + offset, gy - gSize);
    ctx.lineTo(gx + offset, gy + gSize);
    ctx.stroke();
  }

  ctx.strokeStyle = '#24352C';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(gx - gSize - 10, gy);
  ctx.lineTo(gx + gSize + 14, gy);
  ctx.moveTo(gx, gy + gSize + 10);
  ctx.lineTo(gx, gy - gSize - 14);
  ctx.stroke();

  ctx.fillStyle = '#24352C';
  ctx.beginPath();
  ctx.moveTo(gx + gSize + 22, gy);
  ctx.lineTo(gx + gSize + 5, gy - 8);
  ctx.lineTo(gx + gSize + 5, gy + 8);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(gx, gy - gSize - 22);
  ctx.lineTo(gx - 8, gy - gSize - 5);
  ctx.lineTo(gx + 8, gy - gSize - 5);
  ctx.fill();

  ctx.strokeStyle = '#18543A';
  ctx.lineWidth = 4.4;
  ctx.beginPath();
  for (let px = -148; px <= 148; px += 3) {
    const nx = px / 54;
    const ny = nx * nx * nx * 0.42 - nx * 0.65;
    const cx = gx + px;
    const cy = gy - ny * 70;
    if (px === -148) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  }
  ctx.stroke();

  ctx.strokeStyle = '#AD7222';
  ctx.lineWidth = 2.8;
  ctx.setLineDash([9, 6]);
  ctx.beginPath();
  ctx.moveTo(gx - 118, gy + 146);
  ctx.lineTo(gx + 142, gy - 170);
  ctx.stroke();
  ctx.setLineDash([]);

  const ixX = gx + 54;
  const ixY = gy - 66;
  const glowGrad = ctx.createRadialGradient(ixX, ixY, 0, ixX, ixY, 22);
  glowGrad.addColorStop(0, 'rgba(240, 198, 86, 0.72)');
  glowGrad.addColorStop(1, 'rgba(240, 198, 86, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(ixX - 24, ixY - 24, 48, 48);
  drawStar(ixX, ixY, 9.5, '#C88E2B');

  ctx.fillStyle = '#1B4B36';
  ctx.fillRect(92, 694, 54, 54);
  ctx.strokeStyle = '#D9AF52';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(92, 694, 54, 54);
  ctx.fillStyle = '#F7DF9A';
  ctx.font = 'bold 38px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('S', 119, 734);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#332415';
  ctx.font = '600 25px Georgia, serif';
  ctx.fillText('lope-Intercept Form', 156, 722);
  ctx.font = 'italic bold 38px Georgia, serif';
  ctx.fillStyle = '#184A34';
  ctx.fillText('y = m·x + b', 158, 774);

  ctx.fillStyle = 'rgba(54, 40, 26, 0.78)';
  ctx.font = 'italic 22px Georgia, serif';
  const notes = [
    'Every linear relation preserves constant',
    'rate of change across its domain.',
    'm = (y₂ − y₁) / (x₂ − x₁)',
  ];
  notes.forEach((line, idx) => {
    ctx.fillText(line, 96, 826 + idx * 34);
  });

  ctx.fillStyle = '#7A6345';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('— XIV —', 96, 944);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ───────────────────────────────────────────────────────────────
 *  Procedural Right Page — Illuminated Equation, Scales & Proof
 * ─────────────────────────────────────────────────────────────── */
function createRightPageTexture(pagesColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const bg = ctx.createLinearGradient(0, 0, 768, 0);
  bg.addColorStop(0, '#856B4C');
  bg.addColorStop(0.08, '#DAC59D');
  bg.addColorStop(0.28, pagesColor || '#FAF0D7');
  bg.addColorStop(0.92, '#F1E2C2');
  bg.addColorStop(1, '#D9C49B');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 768, 1024);

  const vig = ctx.createRadialGradient(408, 512, 250, 408, 512, 620);
  vig.addColorStop(0, 'rgba(255, 244, 214, 0)');
  vig.addColorStop(1, 'rgba(110, 72, 32, 0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, 768, 1024);

  for (let i = 0; i < 1200; i++) {
    ctx.fillStyle = 'rgba(120, 82, 40, 0.035)';
    ctx.fillRect(Math.random() * 768, Math.random() * 1024, 2, 2);
  }

  ctx.strokeStyle = 'rgba(182, 138, 58, 0.62)';
  ctx.lineWidth = 2.4;
  ctx.strokeRect(88, 56, 628, 912);
  ctx.strokeStyle = 'rgba(182, 138, 58, 0.3)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(98, 66, 608, 892);

  const eqGlow = ctx.createRadialGradient(402, 168, 10, 402, 168, 210);
  eqGlow.addColorStop(0, 'rgba(235, 192, 92, 0.24)');
  eqGlow.addColorStop(1, 'rgba(235, 192, 92, 0)');
  ctx.fillStyle = eqGlow;
  ctx.fillRect(150, 80, 504, 176);

  ctx.fillStyle = '#291D12';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('2x + 4 = 10', 402, 184);

  ctx.strokeStyle = 'rgba(196, 150, 62, 0.78)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(155, 212);
  ctx.lineTo(650, 212);
  ctx.stroke();
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(155, 220);
  ctx.lineTo(650, 220);
  ctx.stroke();

  const sx = 402;
  const sy = 368;
  ctx.strokeStyle = '#2E2216';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(sx, sy - 44);
  ctx.lineTo(sx, sy + 90);
  ctx.moveTo(sx - 64, sy + 90);
  ctx.lineTo(sx + 64, sy + 90);
  ctx.moveTo(sx - 48, sy + 97);
  ctx.lineTo(sx + 48, sy + 97);
  ctx.stroke();

  ctx.fillStyle = '#C49236';
  ctx.beginPath();
  ctx.moveTo(sx, sy - 60);
  ctx.lineTo(sx - 15, sy - 34);
  ctx.lineTo(sx + 15, sy - 34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1E6B49';
  ctx.beginPath();
  ctx.arc(sx, sy - 60, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#2E2216';
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(sx - 146, sy - 40);
  ctx.lineTo(sx + 146, sy - 40);
  ctx.stroke();

  [sx - 146, sx + 146].forEach((px, idx) => {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, sy - 40);
    ctx.lineTo(px - 36, sy + 30);
    ctx.moveTo(px, sy - 40);
    ctx.lineTo(px + 36, sy + 30);
    ctx.stroke();

    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(px, sy + 30, 42, 0, Math.PI, false);
    ctx.stroke();

    ctx.fillStyle = '#185038';
    ctx.font = 'bold 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(idx === 0 ? '2x + 4' : '10', px, sy + 20);
  });

  ctx.textAlign = 'left';
  ctx.fillStyle = '#3B2B1C';
  ctx.font = 'italic 25px Georgia, serif';
  ctx.fillText('I.  Subtract 4 from both sides:', 138, 534);
  ctx.font = 'bold 33px Georgia, serif';
  ctx.fillStyle = '#185038';
  ctx.fillText('2x = 6', 184, 580);

  ctx.fillStyle = '#3B2B1C';
  ctx.font = 'italic 25px Georgia, serif';
  ctx.fillText('II. Divide both sides by 2:', 138, 638);
  ctx.font = 'bold 38px Georgia, serif';
  ctx.fillStyle = '#B88424';
  ctx.fillText('x = 3', 184, 686);

  const quillGlow = ctx.createRadialGradient(296, 676, 4, 296, 676, 58);
  quillGlow.addColorStop(0, 'rgba(255, 224, 128, 0.45)');
  quillGlow.addColorStop(1, 'rgba(255, 224, 128, 0)');
  ctx.fillStyle = quillGlow;
  ctx.fillRect(236, 616, 120, 120);

  const cx = 505;
  const cy = 795;
  const r = 72;
  ctx.strokeStyle = '#332517';
  ctx.lineWidth = 2.4;
  ctx.strokeRect(cx - r * 0.7, cy - r * 0.3, r * 1.1, r * 1.1);
  ctx.strokeStyle = 'rgba(51, 37, 23, 0.42)';
  ctx.strokeRect(cx - r * 0.25, cy - r * 0.72, r * 1.1, r * 1.1);
  ctx.strokeStyle = '#332517';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.7, cy - r * 0.3);
  ctx.lineTo(cx - r * 0.25, cy - r * 0.72);
  ctx.moveTo(cx + r * 0.4, cy - r * 0.3);
  ctx.lineTo(cx + r * 0.85, cy - r * 0.72);
  ctx.moveTo(cx + r * 0.4, cy + r * 0.8);
  ctx.lineTo(cx + r * 0.85, cy + r * 0.38);
  ctx.moveTo(cx - r * 0.7, cy + r * 0.8);
  ctx.lineTo(cx - r * 0.25, cy + r * 0.38);
  ctx.stroke();

  ctx.textAlign = 'right';
  ctx.fillStyle = '#7A6345';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('— XV —', 672, 944);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ───────────────────────────────────────────────────────────────
 *  Procedural Ornate Wizarding Grimoire Front Cover Texture
 *  (Revealed majestically whenever the 3D book closes!)
 * ─────────────────────────────────────────────────────────────── */
function createGrimoireCoverTexture(coverColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const base = new THREE.Color(coverColor || '#154732');
  const grad = ctx.createLinearGradient(0, 0, 768, 1024);
  grad.addColorStop(0, clampHexColor(base.clone().multiplyScalar(1.22)));
  grad.addColorStop(0.45, clampHexColor(base));
  grad.addColorStop(1, clampHexColor(base.clone().multiplyScalar(0.46)));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 768, 1024);

  // Rich antique Morocco leather pebble grain
  for (let i = 0; i < 4500; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,244,210,0.032)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(Math.random() * 768, Math.random() * 1024, 3, 3);
  }

  // Deep burnished vignette
  const vig = ctx.createRadialGradient(384, 512, 160, 384, 512, 620);
  vig.addColorStop(0, 'rgba(255, 224, 130, 0.08)');
  vig.addColorStop(1, 'rgba(2, 12, 8, 0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, 768, 1024);

  // Ornate triple gold-leaf border
  ctx.strokeStyle = '#ECC972';
  ctx.lineWidth = 8;
  ctx.strokeRect(42, 42, 684, 940);
  ctx.lineWidth = 2.5;
  ctx.strokeRect(62, 62, 644, 900);
  ctx.setLineDash([6, 10]);
  ctx.strokeStyle = 'rgba(236, 201, 114, 0.65)';
  ctx.strokeRect(78, 78, 612, 868);
  ctx.setLineDash([]);

  // Corner Gothic scroll filigree
  ctx.strokeStyle = '#F2D68A';
  ctx.lineWidth = 3;
  [
    [94, 94, 1, 1],
    [674, 94, -1, 1],
    [94, 930, 1, -1],
    [674, 930, -1, -1],
  ].forEach(([x, y, sx, sy]) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(52, 4, 62, 34);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(4, 52, 34, 62);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(62, 34, 8, 0, Math.PI * 1.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(34, 62, 8, Math.PI * 0.5, Math.PI * 1.9);
    ctx.stroke();
    ctx.restore();
  });

  // Top scholarly gold-leaf title
  ctx.fillStyle = '#F3D78C';
  ctx.textAlign = 'center';
  ctx.font = '600 22px Georgia, serif';
  ctx.fillText('THE EDUPATH ARCHIVES', 384, 152);
  ctx.font = 'bold 46px Georgia, serif';
  ctx.fillText('GRIMOIRE OF', 384, 218);
  ctx.fillText('ALGEBRA', 384, 270);

  // Central Celestial Astrolabe Crest with glowing π
  const cx = 384;
  const cy = 534;
  [164, 148, 108].forEach((r, idx) => {
    ctx.strokeStyle = idx === 0 ? '#F3D68A' : 'rgba(243, 214, 138, 0.65)';
    ctx.lineWidth = idx === 0 ? 4 : 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 8-point celestial star behind the central crest
  ctx.strokeStyle = 'rgba(243, 214, 138, 0.55)';
  ctx.lineWidth = 2;
  [0, Math.PI / 4].forEach((off) => {
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const a = off + (i * Math.PI) / 2;
      const px = cx + Math.cos(a) * 148;
      const py = cy + Math.sin(a) * 148;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  });

  // Central Pi Emblem
  ctx.fillStyle = '#FCE6A4';
  ctx.font = 'bold 124px Georgia, serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('π', cx, cy + 4);
  ctx.textBaseline = 'alphabetic';

  // Bottom Latin/Scholarly Edition Motto
  ctx.fillStyle = '#E8C66F';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('Vol. I · Linear & Celestial Forms', 384, 790);

  // Small gilded stars flanking motto
  ctx.font = '24px Georgia, serif';
  ctx.fillText('✦   ☽   ✦', 384, 855);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ───────────────────────────────────────────────────────────────
 *  Procedural Glowing Arithmancy Sigil Circle for Pedestal
 * ─────────────────────────────────────────────────────────────── */
function createEnchantedSigilTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 512, 512);
  const cx = 256;
  const cy = 256;

  const glow = ctx.createRadialGradient(cx, cy, 20, cx, cy, 248);
  glow.addColorStop(0, 'rgba(116, 240, 176, 0.24)');
  glow.addColorStop(0.55, 'rgba(245, 212, 130, 0.16)');
  glow.addColorStop(1, 'rgba(245, 212, 130, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 512);

  [238, 224, 184, 174, 114].forEach((r, idx) => {
    ctx.strokeStyle = idx % 2 === 0 ? 'rgba(255, 226, 146, 0.92)' : 'rgba(128, 242, 185, 0.58)';
    ctx.lineWidth = idx === 0 ? 3.2 : 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const inner = i % 2 === 0 ? 224 : 230;
    ctx.strokeStyle = 'rgba(255, 228, 152, 0.8)';
    ctx.lineWidth = i % 2 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * 238, cy + Math.sin(a) * 238);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(248, 214, 126, 0.45)';
  ctx.lineWidth = 1.6;
  [0, Math.PI / 4].forEach((offset) => {
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const a = offset + (i * Math.PI) / 2;
      const x = cx + Math.cos(a) * 174;
      const y = cy + Math.sin(a) * 174;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });

  const glyphs = ['π', 'φ', '∑', '∞', 'Δ', '∫', '√', 'θ', 'λ', 'Ω', '∂', '✦'];
  ctx.fillStyle = 'rgba(255, 232, 162, 0.95)';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  glyphs.forEach((g, idx) => {
    const a = (idx / glyphs.length) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * 204;
    const y = cy + Math.sin(a) * 204;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(g, 0, 0);
    ctx.restore();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ───────────────────────────────────────────────────────────────
 *  Procedural Glowing Floating Rune Sprite (rising from open book!)
 * ─────────────────────────────────────────────────────────────── */
function createFloatingRuneTexture(glyph: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 58);
    g.addColorStop(0, 'rgba(255, 235, 160, 0.55)');
    g.addColorStop(0.5, 'rgba(240, 192, 82, 0.16)');
    g.addColorStop(1, 'rgba(240, 192, 82, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = '#FFF1BA';
    ctx.shadowColor = '#FFD464';
    ctx.shadowBlur = 16;
    ctx.font = 'bold 64px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, 64, 66);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ───────────────────────────────────────────────────────────────
 *  Procedural Dark Obsidian Marble Pedestal Texture
 * ─────────────────────────────────────────────────────────────── */
function createObsidianMarbleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 280);
  grad.addColorStop(0, '#1A3B2C');
  grad.addColorStop(0.6, '#10261C');
  grad.addColorStop(1, '#08150F');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  for (let v = 0; v < 22; v++) {
    ctx.strokeStyle = v % 3 === 0 ? 'rgba(222, 184, 98, 0.34)' : 'rgba(92, 178, 134, 0.16)';
    ctx.lineWidth = 1 + Math.random() * 2.8;
    ctx.beginPath();
    let x = Math.random() * 512;
    let y = 0;
    ctx.moveTo(x, y);
    for (let s = 0; s < 14; s++) {
      x += (Math.random() - 0.5) * 90;
      y += 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCurvedPageGeometry(
  isLeft: boolean,
  width = 1.18,
  height = 1.58,
  archHeight = 0.2,
) {
  const geom = new THREE.PlaneGeometry(width, height, 32, 10);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = isLeft ? (width / 2 - x) / width : (x + width / 2) / width;
    const arch = Math.sin(u * Math.PI * 0.85) * archHeight + Math.sin(u * Math.PI) * 0.035;
    const vNorm = y / (height / 2);
    const edgeLift = Math.pow(Math.abs(vNorm), 2.5) * 0.015;
    pos.setZ(i, arch - edgeLift);
  }
  geom.computeVertexNormals();
  return geom;
}

function createLightTrailGeometry(radiusX: number, radiusY: number, tilt: number) {
  const pts: THREE.Vector3[] = [];
  const segments = 88;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.cos(a) * radiusX;
    const y = Math.sin(a) * radiusY + Math.sin(a * 2) * 0.14;
    const z = Math.sin(a + tilt) * radiusX * 0.56;
    pts.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  return new THREE.TubeGeometry(curve, 112, 0.0095, 8, true);
}

function createSilkRibbonGeometry() {
  const pts = [
    new THREE.Vector3(0.14, -0.58, 0.06),
    new THREE.Vector3(0.2, -0.76, 0.14),
    new THREE.Vector3(0.27, -0.94, 0.23),
    new THREE.Vector3(0.34, -1.1, 0.29),
    new THREE.Vector3(0.4, -1.22, 0.33),
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  const shape = new THREE.Shape();
  shape.moveTo(-0.044, -0.005);
  shape.lineTo(0.044, -0.005);
  shape.lineTo(0.044, 0.005);
  shape.lineTo(-0.044, 0.005);
  shape.closePath();

  return new THREE.ExtrudeGeometry(shape, {
    extrudePath: curve,
    steps: 40,
    bevelEnabled: false,
  });
}

function createFeatherVaneGeometry(): THREE.ExtrudeGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, 0.14);
  s.bezierCurveTo(-0.09, 0.28, -0.15, 0.56, -0.06, 0.88);
  s.bezierCurveTo(-0.02, 0.98, 0.02, 1.0, 0.04, 0.97);
  s.bezierCurveTo(0.12, 0.78, 0.13, 0.44, 0.05, 0.22);
  s.quadraticCurveTo(0.02, 0.16, 0, 0.14);
  return new THREE.ExtrudeGeometry(s, {
    depth: 0.008,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
  });
}

function createSparkleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 252, 232, 1)');
    grad.addColorStop(0.24, 'rgba(255, 218, 122, 0.92)');
    grad.addColorStop(0.58, 'rgba(240, 178, 68, 0.32)');
    grad.addColorStop(1, 'rgba(240, 178, 68, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    ctx.fillStyle = 'rgba(255, 250, 224, 0.8)';
    ctx.beginPath();
    ctx.moveTo(32, 4);
    ctx.lineTo(34.5, 29.5);
    ctx.lineTo(60, 32);
    ctx.lineTo(34.5, 34.5);
    ctx.lineTo(32, 60);
    ctx.lineTo(29.5, 34.5);
    ctx.lineTo(4, 32);
    ctx.lineTo(29.5, 29.5);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createSparklePositions(count: number, radiusX: number, radiusY: number) {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.52 + Math.random() * radiusX;
    arr[i * 3] = Math.cos(a) * r;
    arr[i * 3 + 1] = (Math.random() - 0.35) * radiusY;
    arr[i * 3 + 2] = Math.sin(a) * r * 0.72;
  }
  return arr;
}

/* ───────────────────────────────────────────────────────────────
 *  Hogwarts Great-Hall Style Levitating Drip-Wax Candle
 * ─────────────────────────────────────────────────────────────── */
const LevitatingCandle: React.FC<{
  basePosition: [number, number, number];
  height: number;
  phase: number;
  reducedMotion: boolean;
}> = ({ basePosition, height, phase, reducedMotion }) => {
  const groupRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = basePosition[1] + Math.sin(t * 1.15 + phase) * 0.09;
      groupRef.current.rotation.z = Math.sin(t * 0.7 + phase) * 0.035;
    }
    if (flameRef.current) {
      const flicker = 1 + Math.sin(t * 11.5 + phase) * 0.1 + Math.cos(t * 17.3 + phase) * 0.06;
      flameRef.current.scale.set(1 / Math.sqrt(flicker), flicker, 1 / Math.sqrt(flicker));
    }
    if (lightRef.current) {
      lightRef.current.intensity = 1.6 + Math.sin(t * 9.5 + phase) * 0.25;
    }
  });

  return (
    <group ref={groupRef} position={basePosition}>
      <mesh position={[0, -height / 2 - 0.02, 0]}>
        <cylinderGeometry args={[0.074, 0.042, 0.036, 20]} />
        <meshStandardMaterial color="#D8AE52" roughness={0.28} metalness={0.9} />
      </mesh>
      <mesh castShadow>
        <cylinderGeometry args={[0.045, 0.05, height, 18]} />
        <meshPhysicalMaterial
          color="#F7ECD3"
          roughness={0.55}
          emissive="#FFB44A"
          emissiveIntensity={0.22}
        />
      </mesh>
      <mesh position={[0.042, height * 0.3, 0.01]}>
        <capsuleGeometry args={[0.011, 0.065, 6, 8]} />
        <meshStandardMaterial color="#F4E4C1" roughness={0.5} />
      </mesh>
      <mesh position={[-0.038, height * 0.2, 0.018]}>
        <capsuleGeometry args={[0.01, 0.048, 6, 8]} />
        <meshStandardMaterial color="#F4E4C1" roughness={0.5} />
      </mesh>
      <mesh position={[0, height / 2 + 0.022, 0]}>
        <cylinderGeometry args={[0.004, 0.005, 0.048, 8]} />
        <meshStandardMaterial color="#1F1712" roughness={0.9} />
      </mesh>
      <mesh ref={flameRef} position={[0, height / 2 + 0.09, 0]}>
        <coneGeometry args={[0.03, 0.12, 14]} />
        <meshBasicMaterial color="#FFF5C4" />
      </mesh>
      <mesh position={[0, height / 2 + 0.088, 0]}>
        <sphereGeometry args={[0.068, 16, 16]} />
        <meshBasicMaterial
          color="#FFB648"
          transparent
          opacity={0.38}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, height / 2 + 0.15, 0.1]}
        color="#FFC86E"
        intensity={1.6}
        distance={4.0}
        decay={2}
      />
    </group>
  );
};

/* ═══════════════════════════════════════════════════════════════
 *  ✦ FLOATING BOOK COMPONENT — FULL 3D OPEN & CLOSE ✦
 * ═══════════════════════════════════════════════════════════════ */
export const FloatingBook: React.FC<FloatingBookProps> = ({
  scale = 1,
  coverColor = '#164A34',
  pagesColor = '#FAF0D7',
  ribbonColor = '#216E4A',
  accentColor = '#E6BE64',
  interactive = true,
  floatingSpeed = 1.0,
  floatingIntensity = 0.35,
  position = [0, 0, 0],
  rotation = [0.22, -0.3, 0.05],
  isOpen: controlledOpen,
  autoCycle = true,
}) => {
  const bookRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const leftPagesGroupRef = useRef<THREE.Group>(null);
  const rightPagesGroupRef = useRef<THREE.Group>(null);
  const spellBloomLightRef = useRef<THREE.PointLight>(null);
  const runesGroupRef = useRef<THREE.Group>(null);
  const sigilRef = useRef<THREE.Mesh>(null);
  const quillRef = useRef<THREE.Group>(null);
  const trail1Ref = useRef<THREE.Mesh>(null);
  const trail2Ref = useRef<THREE.Mesh>(null);
  const sparklesRef = useRef<THREE.Points>(null);
  const topLeftLeafRef = useRef<THREE.Mesh>(null);
  const topRightLeafRef = useRef<THREE.Mesh>(null);

  const openProgressRef = useRef(controlledOpen === false ? 0 : 1);
  const [userToggledOpen, setUserToggledOpen] = useState<boolean | null>(null);
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

  /* ── Procedural Textures ── */
  const leftPageTex = useMemo(() => createLeftPageTexture(pagesColor), [pagesColor]);
  const rightPageTex = useMemo(() => createRightPageTexture(pagesColor), [pagesColor]);
  const grimoireCoverTex = useMemo(() => createGrimoireCoverTexture(coverColor), [coverColor]);
  const stoneTex = useMemo(() => createObsidianMarbleTexture(), []);
  const sigilTex = useMemo(() => createEnchantedSigilTexture(), []);
  const sparkleTex = useMemo(() => createSparkleTexture(), []);
  const runeTextures = useMemo(
    () => ['π', '∑', '∞', 'Δ', '✦'].map((g) => createFloatingRuneTexture(g)),
    [],
  );

  /* ── Geometries ── */
  const leftTopPageGeom = useMemo(() => createCurvedPageGeometry(true, 1.18, 1.56, 0.2), []);
  const rightTopPageGeom = useMemo(() => createCurvedPageGeometry(false, 1.18, 1.56, 0.2), []);
  const leftUnderPages = useMemo(
    () =>
      [0, 1, 2, 3, 4].map((i) =>
        createCurvedPageGeometry(true, 1.17 - i * 0.01, 1.54 - i * 0.01, 0.16 - i * 0.025),
      ),
    [],
  );
  const rightUnderPages = useMemo(
    () =>
      [0, 1, 2, 3, 4].map((i) =>
        createCurvedPageGeometry(false, 1.17 - i * 0.01, 1.54 - i * 0.01, 0.16 - i * 0.025),
      ),
    [],
  );
  const trail1Geom = useMemo(() => createLightTrailGeometry(1.88, 0.56, 0.4), []);
  const trail2Geom = useMemo(() => createLightTrailGeometry(1.58, 0.72, -0.85), []);
  const ribbonGeom = useMemo(() => createSilkRibbonGeometry(), []);
  const featherGeom = useMemo(() => createFeatherVaneGeometry(), []);
  const sparklePositions = useMemo(() => createSparklePositions(105, 1.52, 2.6), []);

  /* ── Materials ── */
  const coverMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: grimoireCoverTex,
        roughness: 0.48,
        metalness: 0.14,
        clearcoat: 0.38,
        clearcoatRoughness: 0.28,
        sheen: 0.28,
        sheenColor: new THREE.Color('#478A65'),
      }),
    [grimoireCoverTex],
  );

  const spineMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: coverColor,
        roughness: 0.46,
        metalness: 0.14,
        clearcoat: 0.35,
      }),
    [coverColor],
  );

  const brassMat = useMemo(() => {
    const c = new THREE.Color(accentColor || '#E6BE64').lerp(new THREE.Color('#F2CF7E'), 0.4);
    return new THREE.MeshPhysicalMaterial({
      color: c,
      emissive: c,
      emissiveIntensity: 0.22,
      roughness: 0.17,
      metalness: 0.94,
      clearcoat: 0.78,
      clearcoatRoughness: 0.12,
      envMapIntensity: 1.6,
    });
  }, [accentColor]);

  // Refined champagne-gold metallic feather vane with subtle reflections matching gold orbital rings
  const quillVaneMat = useMemo(() => {
    const c = new THREE.Color(accentColor || '#E8C97A').lerp(new THREE.Color('#F5DBA1'), 0.35);
    return new THREE.MeshPhysicalMaterial({
      color: c,
      emissive: new THREE.Color('#947028'),
      emissiveIntensity: 0.14,
      roughness: 0.22,
      metalness: 0.92,
      clearcoat: 0.72,
      clearcoatRoughness: 0.14,
      sheen: 0.35,
      sheenColor: new THREE.Color('#FFF1C2'),
      envMapIntensity: 1.5,
    });
  }, [accentColor]);

  const goldTrailMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FFF2CC',
        emissive: new THREE.Color('#F5C056'),
        emissiveIntensity: 2.35,
        roughness: 0.14,
        metalness: 0.75,
        transparent: true,
        opacity: 0.78,
      }),
    [],
  );

  const leftPageMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: leftPageTex,
        roughness: 0.8,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
    [leftPageTex],
  );

  const rightPageMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: rightPageTex,
        roughness: 0.8,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
    [rightPageTex],
  );

  const underPageMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#EADBB9',
        roughness: 0.86,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
    [],
  );

  const gildedEdgeMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#DFB95E',
        roughness: 0.22,
        metalness: 0.82,
        envMapIntensity: 1.25,
      }),
    [],
  );

  const ribbonMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: ribbonColor,
        roughness: 0.3,
        metalness: 0.12,
        sheen: 0.85,
        sheenColor: new THREE.Color('#74C69D'),
        side: THREE.DoubleSide,
      }),
    [ribbonColor],
  );

  const waxSealMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#7E161F',
        emissive: '#3D070C',
        emissiveIntensity: 0.28,
        roughness: 0.34,
        metalness: 0.06,
        clearcoat: 0.58,
        clearcoatRoughness: 0.24,
      }),
    [],
  );

  const stoneMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: stoneTex,
        roughness: 0.24,
        metalness: 0.16,
        clearcoat: 0.78,
        clearcoatRoughness: 0.16,
        envMapIntensity: 1.25,
      }),
    [stoneTex],
  );

  const sigilMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: sigilTex,
        transparent: true,
        opacity: 0.94,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [sigilTex],
  );

  const sparkleMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: sparkleTex,
        color: '#FFE599',
        size: 0.14,
        transparent: true,
        opacity: 0.95,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [sparkleTex],
  );

  const runeMaterials = useMemo(
    () =>
      runeTextures.map(
        (tex) =>
          new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
          }),
      ),
    [runeTextures],
  );

  /* ── GPU Cleanup on Unmount ── */
  useEffect(() => {
    return () => {
      [leftPageTex, rightPageTex, grimoireCoverTex, stoneTex, sigilTex, sparkleTex, ...runeTextures].forEach(
        (t) => t.dispose(),
      );
      [
        leftTopPageGeom,
        rightTopPageGeom,
        ...leftUnderPages,
        ...rightUnderPages,
        trail1Geom,
        trail2Geom,
        ribbonGeom,
        featherGeom,
      ].forEach((g) => g.dispose());
      [
        coverMat,
        spineMat,
        brassMat,
        quillVaneMat,
        goldTrailMat,
        leftPageMat,
        rightPageMat,
        underPageMat,
        gildedEdgeMat,
        ribbonMat,
        waxSealMat,
        stoneMat,
        sigilMat,
        sparkleMat,
        ...runeMaterials,
      ].forEach((m) => m.dispose());
    };
  }, [
    leftPageTex,
    rightPageTex,
    grimoireCoverTex,
    stoneTex,
    sigilTex,
    sparkleTex,
    runeTextures,
    leftTopPageGeom,
    rightTopPageGeom,
    leftUnderPages,
    rightUnderPages,
    trail1Geom,
    trail2Geom,
    ribbonGeom,
    featherGeom,
    coverMat,
    spineMat,
    brassMat,
    quillVaneMat,
    goldTrailMat,
    leftPageMat,
    rightPageMat,
    underPageMat,
    gildedEdgeMat,
    ribbonMat,
    waxSealMat,
    stoneMat,
    sigilMat,
    sparkleMat,
    runeMaterials,
  ]);

  /* ── Smooth 3D Open/Close + Enchanted Spellwork Animation ── */
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.getElapsedTime() * floatingSpeed;

    // Determine target open state (1 = wide open, 0 = closed showing embossed cover)
    let targetOpen = 1;
    if (typeof controlledOpen === 'boolean') {
      targetOpen = controlledOpen ? 1 : 0;
    } else if (userToggledOpen !== null) {
      targetOpen = userToggledOpen ? 1 : 0;
    } else if (autoCycle && !reducedMotion) {
      // 11-second gentle cycle: open for ~6s, smoothly closes & holds ~3.5s, reopens
      const cycle = (t % 11.0) / 11.0;
      targetOpen = cycle < 0.62 ? 1 : 0;
    }

    // Smooth cinematic damping on the 3D hinge
    openProgressRef.current = THREE.MathUtils.lerp(
      openProgressRef.current,
      targetOpen,
      reducedMotion ? 1 : Math.min(dt * 2.8, 1),
    );
    const p = openProgressRef.current;

    // 1. Fold both wings smoothly between wide-open (0.40 rad) and closed (1.46 rad)
    const wingAngle = THREE.MathUtils.lerp(1.46, 0.4, p);
    if (leftWingRef.current) leftWingRef.current.rotation.y = wingAngle;
    if (rightWingRef.current) rightWingRef.current.rotation.y = -wingAngle;

    // Flatten page arch smoothly as the book shuts so pages never poke through the covers!
    const archScaleZ = THREE.MathUtils.lerp(0.18, 1.0, p);
    if (leftPagesGroupRef.current) leftPagesGroupRef.current.scale.z = archScaleZ;
    if (rightPagesGroupRef.current) rightPagesGroupRef.current.scale.z = archScaleZ;

    // 2. Rotate whole tome toward the embossed front cover when closed, straight presentation when open
    if (bookRef.current) {
      const hoverLift = hovered ? 0.1 : 0;
      const floatY = reducedMotion
        ? 0
        : Math.sin(t * 1.1) * 0.075 * floatingIntensity + Math.sin(t * 0.42) * 0.025 * floatingIntensity;
      bookRef.current.position.y = 0.24 + floatY + hoverLift;

      // When closed (p = 0), pivot smoothly by +1.05 rad so the gilded front cover faces the viewer!
      const closedShowcaseYaw = THREE.MathUtils.lerp(1.05, 0, p);
      const closedTiltX = THREE.MathUtils.lerp(-0.1, 0, p);
      const gentleX = reducedMotion ? 0 : Math.sin(t * 0.7) * 0.026 * floatingIntensity;
      const gentleY = reducedMotion ? 0 : Math.cos(t * 0.45) * 0.055 * floatingIntensity;
      const gentleZ = reducedMotion ? 0 : Math.sin(t * 0.5) * 0.02 * floatingIntensity;

      bookRef.current.rotation.x = rotation[0] + closedTiltX + gentleX;
      bookRef.current.rotation.y = rotation[1] + closedShowcaseYaw + (hovered ? 0.08 : 0) + gentleY;
      bookRef.current.rotation.z = rotation[2] + gentleZ;
    }

    // 3. Spell-bloom golden light peaks right as the book parts open
    if (spellBloomLightRef.current) {
      const openingBurst = Math.sin(p * Math.PI) * 1.6;
      spellBloomLightRef.current.intensity = 1.1 + p * 2.1 + openingBurst;
    }

    // 4. Enchanted floating runes rise up out of the open spine (fade softly when closed)
    if (runesGroupRef.current) {
      runesGroupRef.current.children.forEach((child, idx) => {
        const phase = (t * 0.36 + idx * 0.2) % 1;
        const spreadX = Math.sin(idx * 2.1 + t * 0.8) * 0.42;
        const spreadZ = 0.22 + Math.cos(idx * 1.7 + t * 0.6) * 0.18;
        child.position.set(spreadX, -0.15 + phase * 1.48, spreadZ);
        const fade = Math.sin(phase * Math.PI) * p;
        child.scale.setScalar(0.24 + fade * 0.14);
        const mat = runeMaterials[idx];
        if (mat) mat.opacity = fade * 0.9;
      });
    }

    // 5. Self-writing champagne-gold feather quill:
    //    writes over the right page when open; lifts & hovers gracefully beside the cover when closed!
    if (quillRef.current) {
      const writeX = 0.72 + (reducedMotion ? 0 : Math.sin(t * 2.3) * 0.095);
      const writeY = 0.14 + (reducedMotion ? 0 : Math.cos(t * 3.1) * 0.04);
      const writeZ = 0.42 + (reducedMotion ? 0 : Math.sin(t * 1.7) * 0.025);

      const parkedX = 0.36;
      const parkedY = 0.72 + (reducedMotion ? 0 : Math.sin(t * 1.4) * 0.05);
      const parkedZ = 0.92;

      quillRef.current.position.set(
        THREE.MathUtils.lerp(parkedX, writeX, p),
        THREE.MathUtils.lerp(parkedY, writeY, p),
        THREE.MathUtils.lerp(parkedZ, writeZ, p),
      );
      quillRef.current.rotation.z =
        THREE.MathUtils.lerp(-0.18, -0.44, p) + (reducedMotion ? 0 : Math.sin(t * 2.6) * 0.07 * p);
      quillRef.current.rotation.x = 0.22 + (reducedMotion ? 0 : Math.cos(t * 2.2) * 0.05 * p);
    }

    if (reducedMotion) return;

    if (topLeftLeafRef.current) {
      topLeftLeafRef.current.rotation.y = (0.02 + Math.sin(t * 1.55) * 0.024) * p;
    }
    if (topRightLeafRef.current) {
      topRightLeafRef.current.rotation.y = (-0.02 + Math.cos(t * 1.45 + 0.6) * 0.024) * p;
    }

    if (sigilRef.current) {
      sigilRef.current.rotation.z -= dt * 0.24 * floatingSpeed;
    }
    if (trail1Ref.current) {
      trail1Ref.current.rotation.y += dt * 0.22;
      trail1Ref.current.rotation.z = Math.sin(t * 0.4) * 0.14;
    }
    if (trail2Ref.current) {
      trail2Ref.current.rotation.y -= dt * 0.17;
      trail2Ref.current.rotation.x = Math.cos(t * 0.35) * 0.14;
    }
    if (sparklesRef.current) {
      sparklesRef.current.rotation.y += dt * 0.085;
    }
  });

  const rootScale = scale * 0.78;

  return (
    <group position={position} scale={rootScale}>
      {/* ════════════════════════════════════════════════════════
       *  1. CARVED GOTHIC OBSIDIAN & ANTIQUE-BRASS LECTERN PLINTH
       * ════════════════════════════════════════════════════════ */}
      <group position={[0, -1.16, 0]}>
        <mesh position={[0, -0.17, 0]} receiveShadow>
          <cylinderGeometry args={[1.42, 1.52, 0.12, 8]} />
          <primitive object={brassMat} attach="material" />
        </mesh>
        <mesh position={[0, -0.01, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.26, 1.34, 0.22, 8]} />
          <primitive object={stoneMat} attach="material" />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 1.29, -0.01, Math.sin(a) * 1.29]}
              rotation={[0, -a, 0]}
            >
              <boxGeometry args={[0.045, 0.24, 0.045]} />
              <primitive object={brassMat} attach="material" />
            </mesh>
          );
        })}
        <mesh position={[0, 0.105, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.22, 0.028, 14, 72]} />
          <primitive object={brassMat} attach="material" />
        </mesh>
        <mesh ref={sigilRef} position={[0, 0.128, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.32, 2.32]} />
          <primitive object={sigilMat} attach="material" />
        </mesh>
      </group>

      {/* ════════════════════════════════════════════════════════
       *  2. THREE STAGGERED HOGWARTS-STYLE LEVITATING CANDLES
       * ════════════════════════════════════════════════════════ */}
      <LevitatingCandle
        basePosition={[-1.64, 0.62, -0.42]}
        height={0.56}
        phase={0.4}
        reducedMotion={reducedMotion}
      />
      <LevitatingCandle
        basePosition={[1.66, 0.88, -0.36]}
        height={0.48}
        phase={2.3}
        reducedMotion={reducedMotion}
      />
      <LevitatingCandle
        basePosition={[-0.95, 1.34, -0.82]}
        height={0.42}
        phase={4.1}
        reducedMotion={reducedMotion}
      />

      {/* ════════════════════════════════════════════════════════
       *  3. SWEEPING GOLDEN SPELL TRAILS & STAR-GLINT SPARKLES
       * ════════════════════════════════════════════════════════ */}
      <mesh ref={trail1Ref} geometry={trail1Geom} material={goldTrailMat} position={[0, 0.14, 0]} />
      <mesh ref={trail2Ref} geometry={trail2Geom} material={goldTrailMat} position={[0, 0.2, 0]} />

      <points ref={sparklesRef} position={[0, 0.2, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparklePositions, 3]} />
        </bufferGeometry>
        <primitive object={sparkleMat} attach="material" />
      </points>

      {/* ════════════════════════════════════════════════════════
       *  4. FLOATING 3D OPEN-AND-CLOSE ENCHANTED GRIMOIRE
       * ════════════════════════════════════════════════════════ */}
      <group
        ref={bookRef}
        position={[0, 0.24, 0]}
        rotation={rotation}
        onClick={
          interactive && typeof controlledOpen !== 'boolean'
            ? (e) => {
                e.stopPropagation();
                setUserToggledOpen((prev) =>
                  prev === null ? openProgressRef.current < 0.5 : !prev,
                );
              }
            : undefined
        }
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
        <pointLight
          ref={spellBloomLightRef}
          position={[0, 0.28, 0.92]}
          intensity={3.0}
          color="#FFE09C"
          distance={5.5}
          decay={2}
        />
        <pointLight position={[0, -0.35, 0.5]} intensity={1.0} color="#52D896" distance={3.8} decay={2} />

        {/* Rising Glowing Mathematical Spell-Glyphs Emerging From the Open Spine */}
        <group ref={runesGroupRef}>
          {runeMaterials.map((mat, idx) => (
            <mesh key={idx} material={mat}>
              <planeGeometry args={[1, 1]} />
            </mesh>
          ))}
        </group>

        {/* Rounded Leather Spine with 5 Raised Antique-Brass Ribs */}
        <group position={[0, 0, -0.09]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry
              args={[0.16, 0.16, 1.72, 28, 1, false, Math.PI * 0.65, Math.PI * 1.7]}
            />
            <primitive object={spineMat} attach="material" />
          </mesh>
          {[-0.64, -0.32, 0, 0.32, 0.64].map((y, idx) => (
            <mesh key={idx} position={[0, y, -0.01]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.163, 0.015, 10, 24, Math.PI]} />
              <primitive object={brassMat} attach="material" />
            </mesh>
          ))}
        </group>

        {/* ── LEFT HINGED WING (Folds smoothly into the front grimoire cover when closed!) ── */}
        <group ref={leftWingRef} position={[-0.03, 0, 0]} rotation={[0, 0.4, 0]}>
          <mesh position={[-0.66, 0, -0.14]} castShadow receiveShadow>
            <boxGeometry args={[1.34, 1.72, 0.055]} />
            <primitive object={coverMat} attach="material" />
          </mesh>
          {/* Embossed front cover gold-leaf plate facing outward (-Z) so it gleams when closed! */}
          <mesh position={[-0.66, 0, -0.17]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[1.3, 1.68]} />
            <primitive object={coverMat} attach="material" />
          </mesh>
          <mesh position={[-1.335, 0, -0.14]}>
            <boxGeometry args={[0.022, 1.74, 0.064]} />
            <primitive object={brassMat} attach="material" />
          </mesh>
          <mesh position={[-0.66, 0.865, -0.14]}>
            <boxGeometry args={[1.35, 0.022, 0.064]} />
            <primitive object={brassMat} attach="material" />
          </mesh>
          <mesh position={[-0.66, -0.865, -0.14]}>
            <boxGeometry args={[1.35, 0.022, 0.064]} />
            <primitive object={brassMat} attach="material" />
          </mesh>
          {[1, -1].map((sy) => (
            <group key={sy} position={[-1.24, sy * 0.77, -0.14]}>
              <mesh position={[0, sy * 0.08, 0]}>
                <boxGeometry args={[0.24, 0.055, 0.085]} />
                <primitive object={brassMat} attach="material" />
              </mesh>
              <mesh position={[-0.095, 0, 0]}>
                <boxGeometry args={[0.055, 0.22, 0.085]} />
                <primitive object={brassMat} attach="material" />
              </mesh>
              <mesh position={[-0.06, sy * 0.055, -0.045]}>
                <sphereGeometry args={[0.02, 10, 10]} />
                <primitive object={brassMat} attach="material" />
              </mesh>
            </group>
          ))}
          <mesh position={[-1.37, 0, -0.12]}>
            <boxGeometry args={[0.08, 0.16, 0.048]} />
            <primitive object={brassMat} attach="material" />
          </mesh>

          {/* Left gilded page block + dynamic curved leaves */}
          <mesh position={[-0.62, 0, -0.07]} castShadow receiveShadow>
            <boxGeometry args={[1.22, 1.58, 0.09]} />
            <primitive object={gildedEdgeMat} attach="material" />
          </mesh>
          <group ref={leftPagesGroupRef}>
            {leftUnderPages.map((geom, i) => (
              <mesh
                key={i}
                geometry={geom}
                material={underPageMat}
                position={[-0.6, 0, -0.02 + i * 0.011]}
                rotation={[0, -0.01 * (4 - i), 0]}
              />
            ))}
            <mesh
              ref={topLeftLeafRef}
              geometry={leftTopPageGeom}
              material={leftPageMat}
              position={[-0.6, 0, 0.04]}
              castShadow
              receiveShadow
            />
          </group>
        </group>

        {/* ── RIGHT HINGED WING ── */}
        <group ref={rightWingRef} position={[0.03, 0, 0]} rotation={[0, -0.4, 0]}>
          <mesh position={[0.66, 0, -0.14]} castShadow receiveShadow>
            <boxGeometry args={[1.34, 1.72, 0.055]} />
            <primitive object={coverMat} attach="material" />
          </mesh>
          <mesh position={[0.66, 0, -0.17]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[1.3, 1.68]} />
            <primitive object={coverMat} attach="material" />
          </mesh>
          <mesh position={[1.335, 0, -0.14]}>
            <boxGeometry args={[0.022, 1.74, 0.064]} />
            <primitive object={brassMat} attach="material" />
          </mesh>
          <mesh position={[0.66, 0.865, -0.14]}>
            <boxGeometry args={[1.35, 0.022, 0.064]} />
            <primitive object={brassMat} attach="material" />
          </mesh>
          <mesh position={[0.66, -0.865, -0.14]}>
            <boxGeometry args={[1.35, 0.022, 0.064]} />
            <primitive object={brassMat} attach="material" />
          </mesh>
          {[1, -1].map((sy) => (
            <group key={sy} position={[1.24, sy * 0.77, -0.14]}>
              <mesh position={[0, sy * 0.08, 0]}>
                <boxGeometry args={[0.24, 0.055, 0.085]} />
                <primitive object={brassMat} attach="material" />
              </mesh>
              <mesh position={[0.095, 0, 0]}>
                <boxGeometry args={[0.055, 0.22, 0.085]} />
                <primitive object={brassMat} attach="material" />
              </mesh>
              <mesh position={[0.06, sy * 0.055, -0.045]}>
                <sphereGeometry args={[0.02, 10, 10]} />
                <primitive object={brassMat} attach="material" />
              </mesh>
            </group>
          ))}
          <mesh position={[1.37, 0, -0.12]}>
            <boxGeometry args={[0.08, 0.16, 0.048]} />
            <primitive object={brassMat} attach="material" />
          </mesh>

          <mesh position={[0.62, 0, -0.07]} castShadow receiveShadow>
            <boxGeometry args={[1.22, 1.58, 0.09]} />
            <primitive object={gildedEdgeMat} attach="material" />
          </mesh>
          <group ref={rightPagesGroupRef}>
            {rightUnderPages.map((geom, i) => (
              <mesh
                key={i}
                geometry={geom}
                material={underPageMat}
                position={[0.6, 0, -0.02 + i * 0.011]}
                rotation={[0, 0.01 * (4 - i), 0]}
              />
            ))}
            <mesh
              ref={topRightLeafRef}
              geometry={rightTopPageGeom}
              material={rightPageMat}
              position={[0.6, 0, 0.04]}
              castShadow
              receiveShadow
            />
          </group>
        </group>

        {/* ── Enchanted Self-Writing Champagne-Gold Feather Quill ── */}
        <group ref={quillRef} position={[0.72, 0.14, 0.42]} rotation={[0.22, -0.22, -0.44]}>
          <mesh position={[0, 0.02, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.02, 0.11, 6]} />
            <primitive object={brassMat} attach="material" />
          </mesh>
          <mesh position={[0, -0.03, 0]}>
            <sphereGeometry args={[0.02, 10, 10]} />
            <meshBasicMaterial color="#FFF3B8" />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <cylinderGeometry args={[0.006, 0.014, 1.0, 8]} />
            <primitive object={brassMat} attach="material" />
          </mesh>
          <mesh geometry={featherGeom} position={[0, 0.08, -0.005]} scale={[1.28, 1.12, 1.2]} castShadow>
            <primitive object={quillVaneMat} attach="material" />
          </mesh>
        </group>

        {/* ── Flowing Silk Bookmark Ribbon + 3D Crimson Wax Seal Medallion ── */}
        <mesh geometry={ribbonGeom} material={ribbonMat} castShadow />
        <group position={[0.4, -1.2, 0.35]} rotation={[0.35, -0.25, 0.1]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.09, 0.098, 0.028, 20]} />
            <primitive object={waxSealMat} attach="material" />
          </mesh>
          <mesh position={[0, 0.016, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.07, 0.012, 8, 24]} />
            <primitive object={waxSealMat} attach="material" />
          </mesh>
          <mesh position={[0, 0.018, 0]}>
            <octahedronGeometry args={[0.034, 0]} />
            <primitive object={brassMat} attach="material" />
          </mesh>
        </group>
      </group>
    </group>
  );
};
