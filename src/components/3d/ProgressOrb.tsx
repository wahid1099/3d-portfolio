import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "../../lib/scroll";

/**
 * A small glowing sphere whose visible arc grows with page scroll progress.
 * Renders inside the StoryRail's own tiny Canvas so it's free of the main scene.
 */
export function ProgressOrb() {
  const ring = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const lastProgress = useRef(0);

  const ringGeo = useMemo(() => new THREE.TorusGeometry(0.9, 0.06, 12, 64, Math.PI * 2), []);
  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#6fdcef"),
        transparent: true,
        opacity: 0.85,
      }),
    [],
  );

  useFrame((state, dt) => {
    const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, scrollState.y / total));
    // smooth via lerp
    lastProgress.current += (progress - lastProgress.current) * (1 - Math.exp(-dt * 4));
    const t = state.clock.elapsedTime;

    if (ring.current) {
      // arc covers the first 75% of the ring scaled by progress
      const angle = lastProgress.current * Math.PI * 2;
      // Visually, scale a quarter arc: we simply rotate the ring and scale the "lit" segment via opacity on a child arc.
      ring.current.rotation.z = -Math.PI / 2 + angle;
    }
    if (core.current) {
      core.current.rotation.y += dt * 0.5;
      const s = 0.85 + Math.sin(t * 1.4) * 0.04 + lastProgress.current * 0.1;
      core.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      {/* The full background ring */}
      <mesh>
        <torusGeometry args={[0.9, 0.025, 8, 64]} />
        <meshBasicMaterial color="#22325e" transparent opacity={0.5} />
      </mesh>
      {/* A bright arc whose rotation tracks progress. Wrapped in a group so we can show the sweep independently. */}
      <group ref={ring}>
        <mesh geometry={ringGeo} material={ringMat} />
      </group>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.35, 1]} />
        <meshBasicMaterial color="#9a7bff" transparent opacity={0.7} />
      </mesh>
      <pointLight color="#6fdcef" intensity={0.8} distance={2} />
    </group>
  );
}
