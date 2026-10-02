import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import { CameraRig } from "./CameraRig";
import { ParticleField } from "./ParticleField";
import { GridFloor } from "./GridFloor";
import { QuantumCore } from "./QuantumCore";
import { NetworkGraph } from "./NetworkGraph";
import { CloudInfrastructure } from "./CloudInfrastructure";
import { LockShield } from "./LockShield";
import type { Tier } from "../../hooks/useDeviceTier";

/** One persistent WebGL context for the whole page; scenes fade in by scroll presence. */
export default function Scene({ tier, reduced }: { tier: Tier; reduced: boolean }) {
  const particles = tier === "desktop" ? 3200 : tier === "tablet" ? 1500 : 600;
  const full = tier !== "mobile";
  return (
    <Canvas
      className="!fixed inset-0"
      style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
      dpr={tier === "desktop" ? [1, 1.75] : [1, 1.35]}
      gl={{ antialias: tier !== "mobile", powerPreference: "high-performance", alpha: true }}
      camera={{ fov: 42, position: [0, 0, 10], near: 0.1, far: 120 }}
      aria-hidden="true"
    >
      <CameraRig reduced={reduced} />
      <AdaptiveDpr pixelated={false} />
      <ParticleField count={particles} />
      {full && <GridFloor />}
      <QuantumCore tier={tier} reduced={reduced} />
      {full && <NetworkGraph reduced={reduced} />}
      {full && <CloudInfrastructure reduced={reduced} />}
      <LockShield tier={tier} reduced={reduced} />
    </Canvas>
  );
}
