import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { gridFragment, gridVertex } from "../../shaders/particles";
import { scrollState } from "../../lib/scroll";

/** Thin technical grid that slides underneath as you travel. */
export function GridFloor() {
  const uniforms = useMemo(
    () => ({
      uTravel: { value: 0 },
      uOpacity: { value: 0.32 },
      uColor: { value: new THREE.Color("#3f63c9") },
    }),
    [],
  );
  useFrame(() => {
    uniforms.uTravel.value = scrollState.smoothY * 0.011;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.4, -10]} frustumCulled={false}>
      <planeGeometry args={[120, 90, 1, 1]} />
      <shaderMaterial
        vertexShader={gridVertex}
        fragmentShader={gridFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        extensions={{ derivatives: true } as never}
      />
    </mesh>
  );
}
