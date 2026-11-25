import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export interface InstanceTransform {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}

interface ExtractedMeshPart {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  localMatrix: THREE.Matrix4;
}

/**
 * Extracts all renderable mesh parts from a loaded glTF scene along with their baked local transform.
 * Enables true GPU instancing (THREE.InstancedMesh) of multi-mesh CC0 GLB assets with minimal draw calls.
 */
function extractMeshParts(root: THREE.Object3D): ExtractedMeshPart[] {
  root.updateMatrixWorld(true);
  const parts: ExtractedMeshPart[] = [];
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      if (mesh.geometry && mat) {
        parts.push({
          geometry: mesh.geometry,
          material: mat,
          localMatrix: mesh.matrixWorld.clone(),
        });
      }
    }
  });
  return parts;
}

export interface InstancedGLBProps {
  url: string;
  instances: InstanceTransform[];
  castShadow?: boolean;
  receiveShadow?: boolean;
  tintColor?: string;
  roughnessOverride?: number;
  metalnessOverride?: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
  /** Offset applied in model-local space before instance transform (useful to center off-origin assets). */
  modelOffset?: [number, number, number];
}

/**
 * Renders N instances of a verified GLB asset using THREE.InstancedMesh (1 draw call per mesh part).
 */
export const InstancedGLB: React.FC<InstancedGLBProps> = ({
  url,
  instances,
  castShadow = true,
  receiveShadow = true,
  tintColor,
  roughnessOverride,
  metalnessOverride,
  emissiveColor,
  emissiveIntensity,
  modelOffset,
}) => {
  const { scene } = useGLTF(url);

  const parts = useMemo(() => {
    const rawParts = extractMeshParts(scene);
    const offsetMat = modelOffset
      ? new THREE.Matrix4().makeTranslation(modelOffset[0], modelOffset[1], modelOffset[2])
      : null;

    return rawParts.map((part) => {
      const mat = part.material.clone() as THREE.MeshStandardMaterial;
      if (tintColor && mat.color) {
        mat.color.multiply(new THREE.Color(tintColor));
      }
      if (roughnessOverride !== undefined && 'roughness' in mat) {
        mat.roughness = roughnessOverride;
      }
      if (metalnessOverride !== undefined && 'metalness' in mat) {
        mat.metalness = metalnessOverride;
      }
      if (emissiveColor && 'emissive' in mat) {
        mat.emissive = new THREE.Color(emissiveColor);
        mat.emissiveIntensity = emissiveIntensity ?? 0.25;
      }
      mat.needsUpdate = true;

      const localMatrix = offsetMat
        ? offsetMat.clone().multiply(part.localMatrix)
        : part.localMatrix;

      return { geometry: part.geometry, material: mat, localMatrix };
    });
  }, [scene, tintColor, roughnessOverride, metalnessOverride, emissiveColor, emissiveIntensity, modelOffset]);

  return (
    <group>
      {parts.map((part, idx) => (
        <InstancedPart
          key={idx}
          geometry={part.geometry}
          material={part.material}
          localMatrix={part.localMatrix}
          instances={instances}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      ))}
    </group>
  );
};

const InstancedPart: React.FC<{
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  localMatrix: THREE.Matrix4;
  instances: InstanceTransform[];
  castShadow: boolean;
  receiveShadow: boolean;
}> = ({ geometry, material, localMatrix, instances, castShadow, receiveShadow }) => {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const finalMat = new THREE.Matrix4();

    instances.forEach((inst, i) => {
      dummy.position.set(...inst.position);
      if (inst.rotation) {
        dummy.rotation.set(...inst.rotation);
      } else {
        dummy.rotation.set(0, 0, 0);
      }
      if (Array.isArray(inst.scale)) {
        dummy.scale.set(...inst.scale);
      } else {
        const s = inst.scale ?? 1;
        dummy.scale.set(s, s, s);
      }
      dummy.updateMatrix();
      finalMat.copy(dummy.matrix).multiply(localMatrix);
      mesh.setMatrixAt(i, finalMat);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [instances, localMatrix]);

  if (instances.length === 0) return null;

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, instances.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={false}
    />
  );
};
