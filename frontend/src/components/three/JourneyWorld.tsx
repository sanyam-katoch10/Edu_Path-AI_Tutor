import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Clone, Float, Html, Sparkles, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { WorldCanvas } from './WorldCanvas';
import { InstancedGLB, type InstanceTransform } from './GLBAsset';

export type TopicStatus = 'completed' | 'in-progress' | 'upcoming';

export interface JourneyTopicNode {
  id: string;
  title: string;
  shortTitle: string;
  stage: string;
  desc: string;
}

export interface JourneyWorldProps {
  topics: JourneyTopicNode[];
  topicStatuses: Record<string, TopicStatus>;
  currentLevel: string;
  selectedTopic?: string;
  onMilestoneClick?: (topicId: string) => void;
  resetSignal?: number;
  hideLabels?: boolean;
  className?: string;
}

/* ── Verified Poly Haven CC0 1.0 GLB Assets (see public/models/LICENSES.md) ── */
const MODEL_CLIFF_ROCK = '/models/journey/cliff_rock.glb';
const MODEL_MOSS_BOULDER = '/models/journey/moss_boulder.glb';
const MODEL_FERN = '/models/journey/fern.glb';
const MODEL_SHRUB = '/models/journey/shrub.glb';
const MODEL_BRIDGE = '/models/journey/wooden_bridge.glb';
const MODEL_CITADEL = '/models/journey/citadel_tower.glb';

/* ── 11-Stage Ascending Archipelago Layout (Balanced 3/4 Panoramic Arc) ── */
interface IslandLayout {
  position: [number, number, number];
  scale: number;
  labelOffset?: [number, number, number];
  labelOffsetY?: number;
  hasWaterfall?: boolean;
  waterfallDir?: [number, number, number];
  waterfallHeight?: number;
}

const ISLAND_LAYOUTS: IslandLayout[] = [
  // 01 Foundations & Real Numbers (lower left, well clear of header & controls)
  { position: [-7.6, -2.2, 4.4], scale: 1.08, labelOffset: [0, 1.88, 0] },
  // 02 Linear Equations (with cascading waterfall)
  { position: [-4.6, -1.4, 3.2], scale: 1.02, labelOffset: [0, 1.92, 0], hasWaterfall: true, waterfallDir: [0.25, 0, 0.92], waterfallHeight: 6.4 },
  // 03 Equations with Variables (offset left to cleanly separate from 04)
  { position: [-6.6, -0.2, 0.5], scale: 1.00, labelOffset: [-0.65, 1.88, 0] },
  // 04 Identities & Contradictions (offset right & slightly elevated)
  { position: [-3.2, 0.3, 0.2], scale: 1.04, labelOffset: [0.65, 2.05, 0] },
  // 05 Linear Inequalities (with wide waterfall, center foreground)
  { position: [-0.2, -0.4, 2.8], scale: 1.16, labelOffset: [0, 1.88, 0], hasWaterfall: true, waterfallDir: [0.05, 0, 1.0], waterfallHeight: 7.0 },
  // 06 Functions & Graphs (center right)
  { position: [2.8, 0.3, 1.2], scale: 1.06, labelOffset: [0, 1.88, 0] },
  // 07 Slope & Linear Forms (framed left-center, separated from 08)
  { position: [-0.6, 1.2, -2.4], scale: 1.00, labelOffset: [-0.65, 1.95, 0] },
  // 08 Systems of Equations (framed right-center with distinct separation from 07)
  { position: [2.2, 1.6, -3.2], scale: 1.04, labelOffset: [0.65, 2.10, 0] },
  // 09 Exponents & Scientific Notation (with waterfall, middle right)
  { position: [5.8, 0.8, 0.2], scale: 1.04, labelOffset: [0.65, 1.88, 0.2], hasWaterfall: true, waterfallDir: [-0.15, 0, 0.95], waterfallHeight: 6.6 },
  // 10 Polynomials & Factoring (upper right)
  { position: [7.4, 1.8, -2.4], scale: 1.02, labelOffset: [0.75, 2.05, 0] },
  // 11 Synthesis Citadel (Summit stone tower landmark illuminated against sunrise)
  { position: [4.6, 2.8, -6.0], scale: 1.38, labelOffset: [0, 2.95, 0], hasWaterfall: true, waterfallDir: [0.35, 0, 0.85], waterfallHeight: 7.8 },
];

/* Natural wooden bridges spanning canyon gaps between milestones */
const BRIDGE_SPANS: [number, number][] = [
  [0, 1],
  [1, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 10],
];

/* Default Panoramic Camera View Settings — elevated angle providing ample top headroom */
const DEFAULT_CAM_POS: [number, number, number] = [-0.6, 11.8, 29.2];
const DEFAULT_CAM_TARGET: [number, number, number] = [0.2, 2.5, -1.8];

/* Deterministic PRNG for stable organic placement */
function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ───────────────────────────────────────────────────────────────
 *  Enchanted Valley Sky Dome (Atmospheric Emerald & Gold Horizon)
 * ─────────────────────────────────────────────────────────────── */
const EnchantedValleySkyDome: React.FC = () => {
  const shader = useMemo(
    () => ({
      uniforms: {
        uZenith: { value: new THREE.Color('#02120A') },
        uAtmosphere: { value: new THREE.Color('#072417') },
        uHorizon: { value: new THREE.Color('#0D3825') },
        uSunGlow: { value: new THREE.Color('#FCE5A4') },
        uSunDir: { value: new THREE.Vector3(0.36, 0.30, -0.88).normalize() },
      },
      vertexShader: `
        varying vec3 vWorldDir;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldDir = normalize(wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uZenith;
        uniform vec3 uAtmosphere;
        uniform vec3 uHorizon;
        uniform vec3 uSunGlow;
        uniform vec3 uSunDir;
        varying vec3 vWorldDir;
        void main() {
          float h = clamp(vWorldDir.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 col = mix(uHorizon, uAtmosphere, smoothstep(0.25, 0.55, h));
          col = mix(col, uZenith, smoothstep(0.55, 0.85, h));
          
          // Radiant champagne sunrise bloom behind the synthesis citadel
          float sunAmt = max(dot(normalize(vWorldDir), uSunDir), 0.0);
          col += uSunGlow * pow(sunAmt, 8.0) * 0.42;
          col += vec3(0.22, 0.52, 0.36) * pow(sunAmt, 2.5) * 0.22;
          
          // Soft atmospheric haze band across the mountain horizon
          float haze = 1.0 - abs(vWorldDir.y);
          col += vec3(0.08, 0.22, 0.15) * pow(haze, 4.0) * 0.35;
          
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    }),
    []
  );

  return (
    <mesh scale={85}>
      <sphereGeometry args={[1, 32, 24]} />
      <shaderMaterial args={[shader]} side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
};

/* ───────────────────────────────────────────────────────────────
 *  Volumetric Canyon Fog & Mist Planes (Eliminates Black Empty Void)
 * ─────────────────────────────────────────────────────────────── */
const ValleyMistVolume: React.FC = () => {
  const mist1Ref = useRef<THREE.Mesh>(null);
  const mist2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (mist1Ref.current) {
      mist1Ref.current.rotation.z = t * 0.008;
      mist1Ref.current.position.y = -7.5 + Math.sin(t * 0.25) * 0.35;
    }
    if (mist2Ref.current) {
      mist2Ref.current.rotation.z = -t * 0.006;
      mist2Ref.current.position.y = -4.2 + Math.cos(t * 0.22) * 0.28;
    }
  });

  return (
    <group>
      {/* Deep canyon mist reservoir */}
      <mesh ref={mist1Ref} position={[0, -7.5, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[110, 80]} />
        <meshBasicMaterial
          color="#062015"
          transparent
          opacity={0.78}
          depthWrite={false}
        />
      </mesh>

      {/* Mid-altitude drifting fog veil */}
      <mesh ref={mist2Ref} position={[2, -4.2, -3]} rotation={[-Math.PI / 2, 0, 0.4]}>
        <planeGeometry args={[95, 65]} />
        <meshBasicMaterial
          color="#0B2B1E"
          transparent
          opacity={0.48}
          depthWrite={false}
        />
      </mesh>

      {/* Ethereal sunrise rim light plane behind the horizon */}
      <mesh position={[5.5, 3.2, -22]} rotation={[0, -0.3, 0]}>
        <planeGeometry args={[36, 18]} />
        <meshBasicMaterial
          color="#E8C97A"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

/* ───────────────────────────────────────────────────────────────
 *  Procedural Animated Waterfall (GLSL Scrolling Cascade + Mist)
 * ─────────────────────────────────────────────────────────────── */
const WaterfallCascade: React.FC<{
  origin: [number, number, number];
  height: number;
  rotationY?: number;
}> = ({ origin, height, rotationY = 0 }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const shader = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uColorTop: { value: new THREE.Color('#D8FDF0') },
        uColorMid: { value: new THREE.Color('#5EEAD4') },
        uColorBottom: { value: new THREE.Color('#1F7A5E') },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float drop = 1.0 - uv.y;
          pos.z += sin(drop * 1.45) * 0.28;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorTop;
        uniform vec3 uColorMid;
        uniform vec3 uColorBottom;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        void main() {
          vec2 flowUv = vec2(vUv.x * 5.8, vUv.y * 4.6 + uTime * 1.45);
          float streak1 = noise(flowUv);
          float streak2 = noise(vec2(vUv.x * 12.0, vUv.y * 8.0 + uTime * 2.3));
          float foam = smoothstep(0.44, 0.86, streak1 * 0.65 + streak2 * 0.45);
          float lipFoam = smoothstep(0.82, 0.99, vUv.y) * 0.88;
          float edgeFade = smoothstep(0.0, 0.24, vUv.x) * smoothstep(1.0, 0.76, vUv.x);
          float bottomFade = smoothstep(0.0, 0.32, vUv.y);

          vec3 col = mix(uColorBottom, uColorMid, vUv.y * 0.55 + foam * 0.35);
          col = mix(col, uColorTop, lipFoam + foam * 0.45);
          col += vec3(0.24, 0.32, 0.28) * (foam * 0.6 + lipFoam);

          float alpha = edgeFade * bottomFade * (0.52 + foam * 0.38 + lipFoam * 0.25);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    }),
    []
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += Math.min(delta, 0.05);
    }
  });

  return (
    <group position={origin} rotation={[0, rotationY, 0]}>
      <mesh position={[0, -height / 2, 0]}>
        <planeGeometry args={[0.74, height, 8, 22]} />
        <shaderMaterial
          ref={matRef}
          args={[shader]}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Plunging spray particles at the waterfall base */}
      <Sparkles
        count={18}
        scale={[1.8, 1.4, 1.6]}
        position={[0, -height * 0.82, 0.35]}
        size={3.4}
        speed={0.45}
        opacity={0.35}
        color="#D6FAF0"
      />
    </group>
  );
};

/* ───────────────────────────────────────────────────────────────
 *  Continuous Glowing Golden Pathway Connecting All 11 Islands
 * ─────────────────────────────────────────────────────────────── */
const GoldenJourneyPath: React.FC<{
  points: [number, number, number][];
  completedCount: number;
}> = ({ points, completedCount }) => {
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulseLightRef = useRef<THREE.PointLight>(null);

  const { fullTube, completedTube, curve } = useMemo(() => {
    const vecs = points.map((p) => new THREE.Vector3(p[0], p[1] + 0.48, p[2]));
    const fullCurve = new THREE.CatmullRomCurve3(vecs, false, 'catmullrom', 0.48);
    const fullGeo = new THREE.TubeGeometry(fullCurve, 140, 0.09, 8, false);

    let compGeo: THREE.TubeGeometry | null = null;
    if (completedCount >= 1) {
      const litCount = Math.min(vecs.length, completedCount + 1);
      const litCurve = new THREE.CatmullRomCurve3(
        vecs.slice(0, litCount),
        false,
        'catmullrom',
        0.48
      );
      compGeo = new THREE.TubeGeometry(litCurve, 60, 0.125, 8, false);
    }

    return { fullTube: fullGeo, completedTube: compGeo, curve: fullCurve };
  }, [points, completedCount]);

  useFrame(({ clock }) => {
    if (!pulseRef.current) return;
    const t = (clock.getElapsedTime() * 0.08) % 1;
    const pt = curve.getPointAt(t);
    pulseRef.current.position.copy(pt);
    if (pulseLightRef.current) {
      pulseLightRef.current.position.copy(pt);
    }
  });

  return (
    <group>
      {/* Ambient golden connecting ribbon */}
      <mesh geometry={fullTube}>
        <meshStandardMaterial
          color="#EED184"
          emissive="#CFA34F"
          emissiveIntensity={0.85}
          roughness={0.28}
          metalness={0.72}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* Completed progress segment lit in emerald brilliance */}
      {completedTube && (
        <mesh geometry={completedTube}>
          <meshStandardMaterial
            color="#A8FAD2"
            emissive="#52B788"
            emissiveIntensity={1.8}
            roughness={0.2}
            metalness={0.4}
          />
        </mesh>
      )}

      {/* Traveling spark of knowledge */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#FFF9E0" />
      </mesh>
      <pointLight ref={pulseLightRef} color="#FFF2C4" intensity={4.5} distance={5.5} decay={2} />
    </group>
  );
};

/* ───────────────────────────────────────────────────────────────
 *  Weathered Wooden Bridges Spanning Canyon Gaps
 * ─────────────────────────────────────────────────────────────── */
const WoodenBridges: React.FC = () => {
  const { scene } = useGLTF(MODEL_BRIDGE);

  const spans = useMemo(() => {
    return BRIDGE_SPANS.map(([aIdx, bIdx]) => {
      const a = new THREE.Vector3(...ISLAND_LAYOUTS[aIdx].position);
      const b = new THREE.Vector3(...ISLAND_LAYOUTS[bIdx].position);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.y += 0.24;
      const dir = b.clone().sub(a);
      const dist = dir.length();
      const yaw = Math.atan2(dir.x, dir.z);
      const pitch = -Math.atan2(dir.y, Math.hypot(dir.x, dir.z)) * 0.42;
      const scaleZ = Math.max(0.58, (dist * 0.65) / 3.39);
      return {
        key: `${aIdx}-${bIdx}`,
        position: [mid.x, mid.y, mid.z] as [number, number, number],
        rotation: [pitch, yaw, 0] as [number, number, number],
        scale: [0.34, 0.28, scaleZ] as [number, number, number],
      };
    });
  }, []);

  return (
    <group>
      {spans.map((s) => (
        <group key={s.key} position={s.position} rotation={s.rotation} scale={s.scale}>
          <Clone object={scene} position={[-0.97, -1.65, -1.37]} castShadow={false} receiveShadow />
        </group>
      ))}
    </group>
  );
};

/* ───────────────────────────────────────────────────────────────
 *  Summit Citadel Landmark (Poly Haven CC0 Round Stone Tower)
 * ─────────────────────────────────────────────────────────────── */
const SummitCitadel: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const { scene } = useGLTF(MODEL_CITADEL);
  const finialRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (finialRef.current) {
      finialRef.current.rotation.y = clock.getElapsedTime() * 0.75;
    }
  });

  return (
    <group position={[position[0] + 0.55, position[1] + 0.34, position[2] - 0.72]}>
      <Clone object={scene} scale={0.185} castShadow receiveShadow />
      
      {/* Sunlit champagne beacon crowning the summit tower */}
      <pointLight position={[0, 3.2, 0.9]} color="#FFE8A8" intensity={12} distance={14} decay={2} />
      
      {/* Crown octahedron finial */}
      <mesh ref={finialRef} position={[0, 2.8, 0]}>
        <octahedronGeometry args={[0.36, 0]} />
        <meshStandardMaterial
          color="#FFF5D6"
          emissive="#F5C96A"
          emissiveIntensity={2.5}
          roughness={0.18}
          metalness={0.78}
        />
      </mesh>
      
      {/* Floating orbital aura ring */}
      <mesh position={[0, 2.8, 0]} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.55, 0.024, 10, 32]} />
        <meshStandardMaterial
          color="#E8C97A"
          emissive="#D4A745"
          emissiveIntensity={1.2}
          roughness={0.2}
          metalness={0.88}
        />
      </mesh>
    </group>
  );
};

/* ───────────────────────────────────────────────────────────────
 *  Interactive 3D Milestone Monument + HTML Status Badge
 * ─────────────────────────────────────────────────────────────── */
const MilestoneStructure: React.FC<{
  node: JourneyTopicNode;
  position: [number, number, number];
  labelOffset?: [number, number, number];
  labelOffsetY?: number;
  status: TopicStatus;
  isSelected: boolean;
  onSelect: (id: string) => void;
  hideLabels?: boolean;
}> = ({ node, position, labelOffset, labelOffsetY = 1.88, status, isSelected, onSelect, hideLabels = false }) => {
  const [hovered, setHovered] = useState(false);
  const beaconRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const finalOffset = labelOffset ?? [0, labelOffsetY, 0];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (beaconRef.current) {
      beaconRef.current.rotation.y = t * (status === 'in-progress' ? 1.15 : 0.55);
      beaconRef.current.position.y = 1.05 + Math.sin(t * 2.2 + position[0]) * 0.08;
    }
    if (ringRef.current) {
      const pulse = isSelected || status === 'in-progress' ? 1 + Math.sin(t * 2.8) * 0.08 : 1;
      ringRef.current.scale.set(pulse, pulse, 1);
    }
  });

  const palette = useMemo(() => {
    if (status === 'completed') {
      return {
        crystal: '#7DF5B8',
        emissive: '#38B27A',
        emissiveInt: 2.1,
        ring: '#95F0C1',
        plinth: '#16422E',
        trim: '#E8C97A',
        light: '#74F0B0',
        lightInt: 4.2,
      };
    }
    if (status === 'in-progress') {
      return {
        crystal: '#FFEAA8',
        emissive: '#E8B84E',
        emissiveInt: 2.5,
        ring: '#F8EAC4',
        plinth: '#1E4732',
        trim: '#F5E3B3',
        light: '#FFE299',
        lightInt: 5.6,
      };
    }
    return {
      crystal: '#789485',
      emissive: '#214232',
      emissiveInt: hovered || isSelected ? 1.05 : 0.3,
      ring: hovered || isSelected ? '#E8C97A' : '#537563',
      plinth: '#112B1E',
      trim: '#9A8654',
      light: '#74C69D',
      lightInt: hovered || isSelected ? 2.2 : 0,
    };
  }, [status, hovered, isSelected]);

  const statusText =
    status === 'completed' ? 'Completed' : status === 'in-progress' ? 'Available' : 'Upcoming';

  return (
    <group position={[position[0], position[1] + 0.48, position[2]]}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
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
        {/* Sculpted stone & brass milestone platform */}
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.66, 0.8, 0.22, 24]} />
          <meshStandardMaterial color={palette.plinth} roughness={0.56} metalness={0.2} />
        </mesh>

        {/* Gold bevel trim ring */}
        <mesh position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.66, 0.038, 10, 32]} />
          <meshStandardMaterial
            color={palette.trim}
            roughness={0.24}
            metalness={0.88}
            emissive={palette.trim}
            emissiveIntensity={status === 'upcoming' ? 0.15 : 0.55}
          />
        </mesh>

        {/* Ground status halo */}
        <mesh ref={ringRef} position={[0, 0.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.72, isSelected ? 0.98 : 0.84, 32]} />
          <meshBasicMaterial
            color={isSelected ? '#FFF4CC' : palette.ring}
            transparent
            opacity={isSelected ? 0.95 : status === 'upcoming' ? 0.26 : 0.7}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Levitating 3D Milestone Crystal */}
        <group ref={beaconRef} position={[0, 1.05, 0]}>
          <mesh castShadow>
            <octahedronGeometry args={[status === 'in-progress' ? 0.36 : 0.28, 0]} />
            <meshPhysicalMaterial
              color={palette.crystal}
              emissive={palette.emissive}
              emissiveIntensity={palette.emissiveInt}
              roughness={0.15}
              metalness={0.26}
              clearcoat={0.9}
            />
          </mesh>
          {(status === 'in-progress' || status === 'completed' || isSelected) && (
            <mesh rotation={[Math.PI / 3, 0, 0]}>
              <torusGeometry args={[0.48, 0.024, 8, 28]} />
              <meshStandardMaterial
                color="#F5E3B3"
                emissive="#E8C97A"
                emissiveIntensity={0.9}
                metalness={0.92}
                roughness={0.18}
              />
            </mesh>
          )}
        </group>

        {palette.lightInt > 0 && (
          <pointLight
            position={[0, 1.4, 0]}
            color={palette.light}
            intensity={palette.lightInt}
            distance={5.4}
            decay={2}
          />
        )}
      </group>

      {/* Clean, readable milestone indicator badge: compact numbered beacon by default, expanded on hover/selection */}
      <Html
        position={finalOffset}
        center
        distanceFactor={24}
        zIndexRange={[15, 0]}
        style={{
          pointerEvents: hideLabels ? 'none' : 'auto',
          opacity: hideLabels ? 0 : 1,
          transform: hideLabels ? 'scale(0.8)' : 'scale(1)',
          transition: 'opacity 0.28s ease-out, transform 0.28s ease-out',
        }}
      >
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-pressed={isSelected}
          aria-label={`Stage ${node.stage}: ${node.title} (${statusText})`}
          className={`flex items-center gap-1.5 rounded-full backdrop-blur-md border font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shadow-[0_6px_16px_rgba(0,0,0,0.65)] focus:outline-none focus:ring-2 focus:ring-[#F5E3B3] ${
            isSelected || hovered
              ? 'px-3 py-1 text-xs scale-105'
              : 'px-2 py-0.5 text-[11px]'
          } ${
            status === 'completed'
              ? 'bg-[#0A2E1F]/92 border-[#74C69D]/80 text-[#C7F5DC]'
              : status === 'in-progress'
              ? 'bg-[#1C422D]/95 border-[#F8EAC4] text-[#FFFDF7] shadow-[0_0_16px_rgba(232,201,122,0.45)]'
              : 'bg-[#05170F]/85 border-[#E8C97A]/25 text-[#D6D2C5] hover:border-[#F8EAC4]/70 hover:text-[#FFFDF7]'
          } ${isSelected ? 'ring-2 ring-[#F8EAC4]' : ''}`}
        >
          {status === 'completed' ? (
            <span className="w-2.5 h-2.5 rounded-full bg-[#74F0B0] flex items-center justify-center text-[#05120B] text-[8px] font-black shrink-0">
              ✓
            </span>
          ) : (
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                status === 'in-progress'
                  ? 'bg-[#F8EAC4] shadow-[0_0_6px_#E8C97A]'
                  : 'bg-[#5A7567]'
              }`}
            />
          )}
          <span className="font-mono text-[11px] font-bold text-[#E8C97A]">{node.stage}</span>
          {(isSelected || hovered) && (
            <span className="tracking-tight text-xs font-medium pl-0.5 animate-in fade-in duration-200">
              {node.shortTitle}
            </span>
          )}
        </button>
      </Html>
    </group>
  );
};

/* ───────────────────────────────────────────────────────────────
 *  Smooth Cinematic Camera Rig (Parallax + Focus Lerp + No Wheel Intercept)
 * ─────────────────────────────────────────────────────────────── */
const JourneyCameraRig: React.FC<{
  topics: JourneyTopicNode[];
  selectedTopic?: string;
  resetSignal?: number;
}> = ({ topics, selectedTopic, resetSignal }) => {
  const { camera } = useThree();
  const pointer = useRef({ x: 0, y: 0 });
  const targetLook = useRef(new THREE.Vector3(...DEFAULT_CAM_TARGET));
  const targetCamPos = useRef(new THREE.Vector3(...DEFAULT_CAM_POS));
  const reducedMotion = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current = mq.matches;

    const onPointerMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, []);

  // Smoothly adjust framing towards selected milestone
  useEffect(() => {
    if (!selectedTopic) {
      targetLook.current.set(...DEFAULT_CAM_TARGET);
      targetCamPos.current.set(...DEFAULT_CAM_POS);
      return;
    }
    const idx = topics.findIndex((t) => t.id === selectedTopic);
    if (idx !== -1 && ISLAND_LAYOUTS[idx]) {
      const islPos = ISLAND_LAYOUTS[idx].position;
      targetLook.current.set(islPos[0] * 0.45, islPos[1] * 0.45 + 1.8, islPos[2] * 0.45);
      targetCamPos.current.set(
        DEFAULT_CAM_POS[0] + islPos[0] * 0.16,
        DEFAULT_CAM_POS[1] + islPos[1] * 0.12,
        DEFAULT_CAM_POS[2]
      );
    }
  }, [selectedTopic, topics]);

  // Reset signal glides view smoothly back to panorama
  useEffect(() => {
    targetLook.current.set(...DEFAULT_CAM_TARGET);
    targetCamPos.current.set(...DEFAULT_CAM_POS);
  }, [resetSignal]);

  useFrame((_, delta) => {
    const t = Math.min(delta * 2.5, 0.08);

    // Subtle parallax shift
    const parallaxX = reducedMotion.current ? 0 : pointer.current.x * 0.75;
    const parallaxY = reducedMotion.current ? 0 : -pointer.current.y * 0.45;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamPos.current.x + parallaxX, t);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamPos.current.y + parallaxY, t);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamPos.current.z, t);

    camera.lookAt(targetLook.current);
  });

  return null;
};

/* ───────────────────────────────────────────────────────────────
 *  Main 3D Archipelago Scene Content
 * ─────────────────────────────────────────────────────────────── */
const JourneyArchipelagoScene: React.FC<{
  topics: JourneyTopicNode[];
  topicStatuses: Record<string, TopicStatus>;
  selectedTopic?: string;
  onMilestoneClick?: (topicId: string) => void;
  resetSignal?: number;
  hideLabels?: boolean;
}> = ({ topics, topicStatuses, selectedTopic, onMilestoneClick, resetSignal, hideLabels = false }) => {
  const completedCount = useMemo(
    () => topics.filter((t) => topicStatuses[t.id] === 'completed').length,
    [topics, topicStatuses]
  );

  // Build GPU-instanced transform lists for all 11 GLB islands + foreground overlooks + distant canyon peaks
  const { mossInstances, cliffInstances, shrubInstances, fernInstances } = useMemo(() => {
    const rand = seededRandom(20261118);
    const moss: InstanceTransform[] = [];
    const cliffs: InstanceTransform[] = [];
    const shrubs: InstanceTransform[] = [];
    const ferns: InstanceTransform[] = [];

    // 1. Eleven Primary Learning Domain Islands
    ISLAND_LAYOUTS.forEach((isl, idx) => {
      const [x, y, z] = isl.position;
      const s = isl.scale;

      // Primary sculpted mossy island plateau
      moss.push({
        position: [x, y, z],
        rotation: [0, rand() * Math.PI * 2, 0],
        scale: [s * 1.1, s * 0.58, s * 1.05],
      });

      // Tucked sub-ledge rock for layered vertical thickness
      moss.push({
        position: [x + (idx % 2 === 0 ? -0.45 : 0.45) * s, y - 0.35, z - 0.26 * s],
        rotation: [0.05, rand() * Math.PI * 2, -0.05],
        scale: [s * 0.7, s * 0.52, s * 0.68],
      });

      // Layered tapering underside cliff crags fused tightly beneath the moss plateau
      cliffs.push({
        position: [x, y - 0.44 * s, z],
        rotation: [Math.PI + 0.05, rand() * Math.PI * 2, 0.04],
        scale: [s * 11.5, s * 12.0, s * 8.0],
      });
      cliffs.push({
        position: [x + 0.25 * s, y - 1.08 * s, z - 0.18 * s],
        rotation: [Math.PI - 0.09, rand() * Math.PI * 2, -0.1],
        scale: [s * 7.6, s * 10.0, s * 5.8],
      });
      cliffs.push({
        position: [x - 0.24 * s, y - 0.9 * s, z + 0.18 * s],
        rotation: [Math.PI + 0.1, rand() * Math.PI * 2, 0.09],
        scale: [s * 6.4, s * 8.6, s * 5.2],
      });

      // Verdant shrub clusters rooted directly on the outer rim of each island
      const shrubCount = idx === 10 ? 6 : 4;
      for (let k = 0; k < shrubCount; k++) {
        const angle = (k / shrubCount) * Math.PI * 2 + 0.4 + rand() * 0.5;
        const r = (0.75 + rand() * 0.2) * s;
        const shScale = (2.1 + rand() * 1.3) * (idx === 10 ? 1.2 : 0.95);
        shrubs.push({
          position: [x + Math.cos(angle) * r, y + 0.24 * s, z + Math.sin(angle) * r],
          rotation: [0, rand() * Math.PI * 2, 0],
          scale: [shScale, shScale * (0.95 + rand() * 0.28), shScale],
        });
      }

      // Crisp forest ferns around rocky edges
      for (let f = 0; f < 4; f++) {
        const angle = (f / 4) * Math.PI * 2 + 0.25 + rand() * 0.55;
        const r = (0.68 + rand() * 0.24) * s;
        ferns.push({
          position: [x + Math.cos(angle) * r, y + 0.25 * s, z + Math.sin(angle) * r],
          rotation: [0.04, rand() * Math.PI * 2, 0],
          scale: 0.9 + rand() * 0.5,
        });
      }
    });

    // 2. Foreground Framing Overlook Islands (Left and Right Terrace)
    // Left Overlook Crag
    moss.push({
      position: [-14.5, -4.6, 9.8],
      rotation: [0.08, 0.4, -0.06],
      scale: [2.2, 0.9, 2.0],
    });
    cliffs.push({
      position: [-14.5, -5.8, 9.8],
      rotation: [Math.PI + 0.1, 0.5, 0],
      scale: [18.0, 16.0, 14.0],
    });
    for (let f = 0; f < 5; f++) {
      shrubs.push({
        position: [-13.8 + rand() * 1.2, -4.2, 9.2 + rand() * 1.0],
        rotation: [0, rand() * Math.PI * 2, 0],
        scale: 2.8,
      });
      ferns.push({
        position: [-14.0 + rand() * 1.0, -4.2, 9.5 + rand() * 0.8],
        rotation: [0, rand() * Math.PI * 2, 0],
        scale: 1.4,
      });
    }

    // Right Overlook Crag
    moss.push({
      position: [14.0, -4.2, 9.2],
      rotation: [-0.06, -0.5, 0.05],
      scale: [2.0, 0.85, 1.9],
    });
    cliffs.push({
      position: [14.0, -5.5, 9.2],
      rotation: [Math.PI - 0.1, -0.4, 0],
      scale: [16.5, 15.0, 13.0],
    });
    for (let f = 0; f < 4; f++) {
      shrubs.push({
        position: [13.4 + rand() * 1.0, -3.8, 8.8 + rand() * 1.0],
        rotation: [0, rand() * Math.PI * 2, 0],
        scale: 2.5,
      });
      ferns.push({
        position: [13.6 + rand() * 0.8, -3.8, 9.0 + rand() * 0.8],
        rotation: [0, rand() * Math.PI * 2, 0],
        scale: 1.3,
      });
    }

    // 3. Layered Distant Floating Background Canyon Mountains (11 Formations)
    const distantFormations: [number, number, number, number][] = [
      [-19.5, 2.5, -16.5, 2.5],
      [-11.2, 5.8, -21.0, 3.2],
      [-1.5, 7.2, -24.5, 3.6],
      [8.8, 6.6, -22.5, 3.4],
      [18.2, 5.2, -18.0, 3.0],
      [20.5, 1.2, -11.0, 2.4],
      [-17.2, -3.0, -8.5, 2.2],
      [-23.0, 0.8, -13.0, 2.8],
      [15.2, -2.2, -7.0, 2.0],
      [-6.5, 7.8, -26.5, 4.0],
      [12.8, 8.4, -25.5, 3.8],
    ];

    distantFormations.forEach(([dx, dy, dz, ds]) => {
      moss.push({
        position: [dx, dy, dz],
        rotation: [0, rand() * Math.PI * 2, 0],
        scale: [ds * 1.28, ds * 0.74, ds * 1.2],
      });
      cliffs.push({
        position: [dx, dy - 0.54 * ds, dz],
        rotation: [Math.PI, rand() * Math.PI * 2, 0],
        scale: [ds * 12.5, ds * 15.0, ds * 9.5],
      });
      shrubs.push({
        position: [dx + 0.35 * ds, dy + 0.32 * ds, dz - 0.1 * ds],
        rotation: [0, rand() * Math.PI * 2, 0],
        scale: ds * 2.0,
      });
      shrubs.push({
        position: [dx - 0.42 * ds, dy + 0.28 * ds, dz + 0.16 * ds],
        rotation: [0, rand() * Math.PI * 2, 0],
        scale: ds * 1.6,
      });
    });

    return {
      mossInstances: moss,
      cliffInstances: cliffs,
      shrubInstances: shrubs,
      fernInstances: ferns,
    };
  }, []);

  const pathPoints = useMemo(() => ISLAND_LAYOUTS.map((i) => i.position), []);
  const citadelPos = ISLAND_LAYOUTS[ISLAND_LAYOUTS.length - 1].position;

  return (
    <>
      <JourneyCameraRig topics={topics} selectedTopic={selectedTopic} resetSignal={resetSignal} />

      <EnchantedValleySkyDome />

      {/* ── Balanced Sunlit Emerald & Warm Champagne Atmosphere ── */}
      <hemisphereLight args={['#D2F8E8', '#072418', 1.25]} />
      
      {/* Primary directional sun casting warm golden highlights */}
      <directionalLight
        position={[14, 22, 14]}
        intensity={2.85}
        color="#FFF2D1"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={18}
        shadow-camera-bottom={-14}
        shadow-camera-near={2}
        shadow-camera-far={58}
        shadow-bias={-0.0004}
      />

      {/* Warm sunlit golden rim from behind the summit Citadel */}
      <directionalLight position={[10, 14, -18]} intensity={1.65} color="#F8DF9E" />

      {/* Cool forest jade side fill for sculptural depth */}
      <directionalLight position={[-16, 7, -6]} intensity={1.15} color="#52B788" />

      {/* Radiant valley depths bounce light */}
      <pointLight position={[0, -5, 4]} color="#2D6A4F" intensity={18} distance={34} decay={2} />

      {/* GPU-Instanced Poly Haven CC0 Floating Island Terrain & Vegetation */}
      <InstancedGLB
        url={MODEL_MOSS_BOULDER}
        instances={mossInstances}
        tintColor="#92D8A6"
        roughnessOverride={0.82}
      />
      <InstancedGLB
        url={MODEL_CLIFF_ROCK}
        instances={cliffInstances}
        tintColor="#6B887A"
        roughnessOverride={0.86}
        castShadow={false}
      />
      <InstancedGLB
        url={MODEL_SHRUB}
        instances={shrubInstances}
        tintColor="#6FD295"
        roughnessOverride={0.76}
        castShadow={false}
      />
      <InstancedGLB
        url={MODEL_FERN}
        instances={fernInstances}
        tintColor="#86E2A3"
        roughnessOverride={0.74}
        castShadow={false}
      />

      {/* Weathered Wooden Bridges */}
      <WoodenBridges />

      {/* Summit Citadel Tower on Stage 11 */}
      <SummitCitadel position={citadelPos} />

      {/* Animated Cascading Waterfalls */}
      {ISLAND_LAYOUTS.map((isl, idx) =>
        isl.hasWaterfall ? (
          <WaterfallCascade
            key={`wf-${idx}`}
            origin={[
              isl.position[0] + (isl.waterfallDir?.[0] ?? 0) * isl.scale * 0.8,
              isl.position[1] + 0.14,
              isl.position[2] + (isl.waterfallDir?.[2] ?? 1) * isl.scale * 0.8,
            ]}
            height={isl.waterfallHeight ?? 6.0}
          />
        ) : null
      )}

      {/* Continuous Glowing Golden Pathway */}
      <GoldenJourneyPath points={pathPoints} completedCount={completedCount} />

      {/* 11 Interactive Status-Driven Milestone Beacons */}
      {topics.slice(0, ISLAND_LAYOUTS.length).map((node, idx) => (
        <MilestoneStructure
          key={node.id}
          node={node}
          position={ISLAND_LAYOUTS[idx].position}
          labelOffset={ISLAND_LAYOUTS[idx].labelOffset}
          labelOffsetY={ISLAND_LAYOUTS[idx].labelOffsetY ?? 1.88}
          status={topicStatuses[node.id] ?? 'upcoming'}
          isSelected={selectedTopic === node.id}
          onSelect={(id) => onMilestoneClick?.(id)}
          hideLabels={hideLabels}
        />
      ))}

      {/* Volumetric Canyon Mist Volumes */}
      <ValleyMistVolume />

      {/* Restrained Sunlit Atmospheric Dust Motes */}
      <Float speed={0.75} floatIntensity={0.35} rotationIntensity={0}>
        <Sparkles
          count={56}
          scale={[28, 12, 20]}
          position={[0.5, 2.4, -1.8]}
          size={2.6}
          speed={0.22}
          opacity={0.52}
          color="#F8EAC4"
        />
      </Float>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
 *  JourneyWorld — Full-Viewport 3D Learning Odyssey
 * ═══════════════════════════════════════════════════════════════ */
export const JourneyWorld: React.FC<JourneyWorldProps> = ({
  topics,
  topicStatuses,
  currentLevel,
  selectedTopic,
  onMilestoneClick,
  resetSignal = 0,
  hideLabels = false,
  className = '',
}) => {
  return (
    <div className={`relative w-full h-full touch-pan-y ${className}`}>
      <WorldCanvas
        cameraPosition={DEFAULT_CAM_POS}
        cameraTarget={DEFAULT_CAM_TARGET}
        fov={35}
        fogColor="#051C13"
        fogNear={26}
        fogFar={72}
        backgroundColor="#03120B"
        enableOrbit={false}
        enableParallax={false}
        enableZoom={false}
        fallbackTitle="Floating-Island Curriculum World"
        fallbackSubtitle={`Interactive 3D archipelago for your ${currentLevel} Algebra 1 progression.`}
        loadingLabel="Illuminating The Learning Archipelago..."
        ariaLabel={`3D Learning Journey floating island archipelago for ${currentLevel} tier`}
      >
        <JourneyArchipelagoScene
          topics={topics}
          topicStatuses={topicStatuses}
          selectedTopic={selectedTopic}
          onMilestoneClick={onMilestoneClick}
          resetSignal={resetSignal}
          hideLabels={hideLabels}
        />
      </WorldCanvas>
    </div>
  );
};

useGLTF.preload(MODEL_CLIFF_ROCK);
useGLTF.preload(MODEL_MOSS_BOULDER);
useGLTF.preload(MODEL_FERN);
useGLTF.preload(MODEL_SHRUB);
useGLTF.preload(MODEL_BRIDGE);
useGLTF.preload(MODEL_CITADEL);

export default JourneyWorld;
