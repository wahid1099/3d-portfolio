import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Rasterises "MW" into a 2D mask, samples N particle positions on the
 * stroke, then animates them with a curl-noise field. The result is a
 * ~600-point cloud that resolves into the letters M and W over time.
 */
const SAMPLE = 700;
const TEX_W = 160;
const TEX_H = 64;

function buildTextMask(text: string): Uint8Array {
  const c = document.createElement("canvas");
  c.width = TEX_W;
  c.height = TEX_H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 48px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(text, TEX_W / 2, TEX_H / 2 + 4);
  return new Uint8Array(ctx.getImageData(0, 0, TEX_W, TEX_H).data.buffer);
}

export function MonogramParticles({ strength = 1 }: { strength?: number }) {
  const pts = useRef<THREE.Points>(null);
  const positions = useRef<Float32Array>(new Float32Array(SAMPLE * 3));
  const home = useRef<Float32Array>(new Float32Array(SAMPLE * 3));
  const seeds = useRef<Float32Array>(new Float32Array(SAMPLE));
  const colorBuf = useRef<Float32Array>(new Float32Array(SAMPLE * 3));

  const { geometry, palette } = useMemo(() => {
    const mask = buildTextMask("MW");
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(SAMPLE * 3);
    const col = new Float32Array(SAMPLE * 3);
    const homeArr = new Float32Array(SAMPLE * 3);
    const seedArr = new Float32Array(SAMPLE);
    // Collect lit pixels
    const lit: number[] = [];
    for (let y = 0; y < TEX_H; y += 2) {
      for (let x = 0; x < TEX_W; x += 2) {
        const i = (y * TEX_W + x) * 4;
        if (mask[i] > 128) lit.push(x, y);
      }
    }
    const palette: [string, string] = ["#6fdcef", "#9a7bff"];
    for (let i = 0; i < SAMPLE; i++) {
      const r = Math.floor(Math.random() * (lit.length / 2)) * 2;
      const x = lit[r] ?? TEX_W / 2;
      const y = lit[r + 1] ?? TEX_H / 2;
      // map pixel -> world [-2.6..2.6] x, [-1..1] y
      const wx = ((x / TEX_W) - 0.5) * 5.2;
      const wy = -(((y / TEX_H) - 0.5) * 2.0);
      // Initialise scattered far away
      const sx = (Math.random() - 0.5) * 18;
      const sy = (Math.random() - 0.5) * 8;
      const sz = (Math.random() - 0.5) * 8;
      pos[i * 3] = sx;
      pos[i * 3 + 1] = sy;
      pos[i * 3 + 2] = sz;
      homeArr[i * 3] = wx;
      homeArr[i * 3 + 1] = wy;
      homeArr[i * 3 + 2] = 0;
      seedArr[i] = Math.random();
      const c = new THREE.Color(palette[i % 2]);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(col, 3));
    positions.current = pos;
    home.current = homeArr;
    seeds.current = seedArr;
    colorBuf.current = col;
    return { geometry: geom, palette };
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const pos = positions.current;
    const homeArr = home.current;
    const seedArr = seeds.current;
    const cycle = (Math.sin(t * 0.5) + 1) / 2; // 0..1
    const k = THREE.MathUtils.lerp(0.02, 1.0, Math.pow(cycle, 2)) * strength;
    for (let i = 0; i < SAMPLE; i++) {
      const ix = i * 3;
      const tx = homeArr[ix];
      const ty = homeArr[ix + 1];
      const sx = seedArr[ix];
      const drift = 0.18;
      pos[ix] += (tx - pos[ix]) * k * dt + Math.sin(t * 0.7 + sx * 30) * drift * dt;
      pos[ix + 1] += (ty - pos[ix + 1]) * k * dt + Math.cos(t * 0.6 + sx * 40) * drift * dt;
      pos[ix + 2] += (0 - pos[ix + 2]) * k * dt;
    }
    (geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  void palette;

  return (
    <points ref={pts} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.05}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}