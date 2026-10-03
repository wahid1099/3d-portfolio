import { lazy, Suspense } from "react";
import { Canvas } from "@react-three/fiber";

const MonogramParticles = lazy(() =>
  import("./MonogramParticles").then((m) => ({ default: m.MonogramParticles })),
);

/** Tiny, cheap Canvas just for the MW monogram. Behind everything, pointer-events off. */
export function Monogram() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-1/2 z-0 hidden h-[320px] -translate-y-1/2 md:block"
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <MonogramParticles />
        </Suspense>
      </Canvas>
    </div>
  );
}