import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "../../lib/scroll";

/** 53 weeks × 7 days of stylized contribution counts (deterministic, not a real API). */
function generateMatrix(seed = 7): number[][] {
  // simple LCG so the result is stable across renders
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const weeks = 53;
  const days = 7;
  const out: number[][] = [];
  for (let w = 0; w < weeks; w++) {
    const row: number[] = [];
    for (let d = 0; d < days; d++) {
      // sparse with bursts
      const base = rand();
      const v = base < 0.55 ? 0 : Math.floor(rand() * 6 + (w > 30 ? 2 : 0));
      row.push(v);
    }
    out.push(row);
  }
  return out;
}

export function CommitBars() {
  const root = useRef<THREE.Group>(null);
  const cellsRef = useRef<THREE.InstancedMesh>(null);
  const camera = useThree((s) => s.camera);
  const viewport = useThree((s) => s.viewport);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const target = useRef(0);

  const WEEKS = 53;
  const DAYS = 7;
  const matrix = useMemo(() => generateMatrix(), []);
  const total = useMemo(() => matrix.flat().reduce((a, b) => a + b, 0), [matrix]);

  useEffect(() => {
    const im = cellsRef.current;
    if (!im) return;
    let idx = 0;
    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < DAYS; d++) {
        const v = matrix[w][d];
        const x = (w - WEEKS / 2) * 0.12;
        const y = (d - DAYS / 2) * 0.12;
        const h = 0.04 + v * 0.18;
        tmp.position.set(x, y - h / 2 + 0.02, 0);
        tmp.scale.set(0.085, h, 0.085);
        tmp.updateMatrix();
        im.setMatrixAt(idx++, tmp.matrix);
      }
    }
    im.instanceMatrix.needsUpdate = true;
  }, [matrix, tmp]);

  useFrame((state, dt) => {
    const g = root.current;
    const im = cellsRef.current;
    if (!g || !im) return;
    const t = state.clock.elapsedTime;
    // Ease in based on presence of the projects area. Fallback: always visible.
    const total2 = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = scrollState.smoothY / total2;
    target.current = progress;
    const fade = THREE.MathUtils.smoothstep(progress, 0.18, 0.4);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, t * 0.15, 2, dt);
    g.position.set(viewport.width * 0.34, -0.4, 0);
    g.scale.setScalar(0.95);
    // Pulse opacity via instance color (we use a MeshBasicMaterial; emit light via emissive plane behind).
    const mat = Array.isArray(im.material) ? im.material[0] : im.material;
    mat.transparent = true;
    mat.opacity = THREE.MathUtils.damp(mat.opacity, fade, 3, dt);
  });

  return (
    <group ref={root}>
      {/* Backlit glow plane */}
      <mesh position={[0, 0, -0.2]}>
        <planeGeometry args={[7.2, 1.3]} />
        <meshBasicMaterial color="#1a2440" transparent opacity={0.35} />
      </mesh>
      <instancedMesh ref={cellsRef} args={[undefined as never, undefined as never, WEEKS * DAYS]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#6fdcef"
          emissive="#3aa8d0"
          emissiveIntensity={1.4}
          metalness={0.2}
          roughness={0.4}
          transparent
          opacity={0}
        />
      </instancedMesh>
      <pointLight color="#6fdcef" intensity={0.7} distance={4} position={[0, 0, 1.2]} />
    </group>
  );
}

/** Returns the synthetic total so the React side can show a number. */
export const useCommitMatrix = () => {
  const matrix = useMemo(() => generateMatrix(), []);
  const total = useMemo(() => matrix.flat().reduce((a, b) => a + b, 0), [matrix]);
  return { matrix, total };
};