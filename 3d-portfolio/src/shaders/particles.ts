export const particleVertex = /* glsl */ `
uniform float uTime;
uniform float uTravel;
uniform float uPixelRatio;
uniform float uSize;
uniform float uVel;
attribute float aScale;
attribute float aSeed;
attribute vec3 aColor;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 p = position;
  // Particles stream toward the camera as the page scrolls: travel through the infrastructure.
  p.z = mod(p.z + uTravel + 44.0, 52.0) - 44.0;
  float s = aSeed * 6.2831;
  p.x += sin(uTime * 0.18 + s) * 0.22;
  p.y += cos(uTime * 0.15 + s * 1.3) * 0.22;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = -mv.z;
  gl_PointSize = uSize * aScale * uPixelRatio * (1.0 + uVel * 0.8) / max(depth, 0.5);
  float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed) + aSeed * 40.0);
  vAlpha = twinkle * smoothstep(0.6, 4.0, depth) * smoothstep(52.0, 26.0, depth);
  vColor = aColor;
}
`;

export const particleFragment = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  gl_FragColor = vec4(vColor, a * vAlpha * uOpacity);
}
`;

export const gridVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const gridFragment = /* glsl */ `
uniform float uTravel;
uniform float uOpacity;
uniform vec3 uColor;
varying vec3 vWorld;
float line(vec2 p, float s) {
  vec2 q = p / s;
  vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
  return 1.0 - min(min(g.x, g.y), 1.0);
}
void main() {
  vec2 p = vec2(vWorld.x, vWorld.z + uTravel);
  float minor = line(p, 1.0) * 0.35;
  float major = line(p, 5.0) * 0.9;
  float d = length(vWorld.xz - vec2(0.0, 4.0));
  float fade = smoothstep(46.0, 4.0, d) * smoothstep(-1.0, 3.0, 12.0 - abs(vWorld.x) * 0.4);
  float a = max(minor, major) * fade * uOpacity;
  gl_FragColor = vec4(uColor, a);
}
`;

export const streamVertex = /* glsl */ `
uniform float uTime;
uniform float uRadius;
uniform float uSpeed;
uniform float uPixelRatio;
attribute float aPhase;
attribute float aJitter;
varying float vAlpha;
void main() {
  float a = aPhase * 6.2831 + uTime * uSpeed;
  float r = uRadius + aJitter * 0.05;
  vec3 p = vec3(cos(a) * r, sin(a) * r, aJitter * 0.04);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  // Packets: bright heads with fading tails, like encrypted frames on a bus.
  float seg = fract(aPhase * 7.0);
  vAlpha = pow(seg, 4.0);
  gl_PointSize = (2.0 + 5.0 * vAlpha) * uPixelRatio * (10.0 / max(-mv.z, 1.0));
}
`;

export const streamFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d);
  gl_FragColor = vec4(uColor, a * vAlpha * uOpacity);
}
`;
