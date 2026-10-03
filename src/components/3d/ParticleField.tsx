import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { particleFragment, particleVertex } from "../../shaders/particles";
import { scrollState } from "../../lib/scroll";
import { audioLevelRef } from "../ui/AudioOrb";

const colors = ["#6fdcef", "#4f7dff", "#9a7bff", "#cfe9ff"].map((c) => new THREE.Color(c));

export function ParticleField({ count }: { count: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const scale = new Float32Array(count);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Keep a quiet corridor around the camera axis so particles frame content.
      const r = 2.5 + Math.pow(Math.random(), 0.7) * 18;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r * 1.3;
      pos[i * 3 + 1] = Math.sin(a) * r * 0.75;
      pos[i * 3 + 2] = -44 + Math.random() * 52;
      const c = colors[Math.random() < 0.55 ? 0 : Math.floor(Math.random() * colors.length)];
      col.set([c.r, c.g, c.b], i * 3);
      scale[i] = 0.4 + Math.pow(Math.random(), 3) * 2.2;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTravel: { value: 0 },
      uPixelRatio: { value: Math.min(dpr, 2) },
      uSize: { value: 26 },
      uVel: { value: 0 },
      uOpacity: { value: 0.85 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state) => {
    const u = uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uTravel.value = scrollState.smoothY * 0.011;
    u.uVel.value = THREE.MathUtils.lerp(u.uVel.value, Math.min(Math.abs(scrollState.velocity) / 900, 1.5), 0.08);
    // Audio-reactive multiplier on size
    u.uSize.value = 26 + audioLevelRef.current * 28;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={particleVertex}
        fragmentShader={particleFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
