import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { out } from './director';

// One shader for every red LED line in the arena: a hot core + soft halo across the strip, plus
// draw (reveal outward from the car), flow (UV offset streaming backward), dash/stretch (speed lines) and flash.
const vert = /* glsl */ `
attribute float aAlong;
attribute float aAcross;
varying float vAlong;
varying float vAcross;
varying float vDist;
void main() {
  vAlong = aAlong;
  vAcross = aAcross;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const frag = /* glsl */ `
uniform vec3 uColor;
uniform float uLevel, uDraw, uReach, uFlow, uDash, uStretch, uFlash;
varying float vAlong;
varying float vAcross;
varying float vDist;
void main() {
  float a = abs(vAcross);
  float core = 1.0 - smoothstep(0.018, 0.045, a);
  float halo = exp(-a * 13.0) * 0.4;
  float reach = uDraw * uReach;
  float draw = 1.0 - smoothstep(reach - 1.5, reach, abs(vAlong));
  float period = mix(5.0, 16.0, uStretch);
  float duty = mix(0.42, 0.86, uStretch);
  float ph = fract((vAlong + uFlow) / period);
  float dash = mix(1.0, smoothstep(0.0, 0.04, ph) * (1.0 - smoothstep(duty - 0.06, duty, ph)), uDash);
  float fog = 1.0 - smoothstep(22.0, 88.0, vDist);
  float I = uLevel * (2.6 + uFlash * 5.0);
  gl_FragColor = vec4(uColor * I * (core + halo) * draw * dash * fog, 1.0);
}`;

export function makeLedMaterial(reach = 70) {
  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uColor: { value: new THREE.Color('#FF2A2A') },
      uLevel: { value: 1 },
      uDraw: { value: 1 },
      uReach: { value: reach },
      uFlow: { value: 0 },
      uDash: { value: 0 },
      uStretch: { value: 0 },
      uFlash: { value: 0 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}

/** Merge many thin ground quads into one geometry. Each strip: { x0, z0, x1, z1, w, origin } (origin: along-zero). */
export function stripGeometry(strips, y = 0.006) {
  const pos = [];
  const along = [];
  const across = [];
  const idx = [];
  let v = 0;
  for (const s of strips) {
    const dx = s.x1 - s.x0;
    const dz = s.z1 - s.z0;
    const len = Math.hypot(dx, dz);
    const nx = (-dz / len) * (s.w / 2);
    const nz = (dx / len) * (s.w / 2);
    const o0 = s.a0 ?? 0;
    const o1 = s.a1 ?? len;
    pos.push(s.x0 + nx, y, s.z0 + nz, s.x0 - nx, y, s.z0 - nz, s.x1 + nx, y, s.z1 + nz, s.x1 - nx, y, s.z1 - nz);
    along.push(o0, o0, o1, o1);
    const h = s.w / 2; // metres from the strip's centre line
    across.push(-h, h, -h, h);
    idx.push(v, v + 2, v + 1, v + 1, v + 2, v + 3);
    v += 4;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aAlong', new THREE.Float32BufferAttribute(along, 1));
  g.setAttribute('aAcross', new THREE.Float32BufferAttribute(across, 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

const LANES = [1.55, 3.3, 6.8, 11.5, 17];

export default function LedStrips() {
  const ground = useRef();
  const frame = useRef();

  const { groundGeo, groundMat, frameGeo, frameMat } = useMemo(() => {
    const strips = [];
    for (const x of LANES)
      for (const sx of [-1, 1]) strips.push({ x0: sx * x, z0: -70, x1: sx * x, z1: 70, w: 0.4, a0: -70, a1: 70 });
    const groundGeo = stripGeometry(strips);
    const groundMat = makeLedMaterial(70);
    // spotlight frame around the car (variants): rectangle + corner ticks
    const hx = 2.05;
    const hz = 3.15;
    const f = [
      { x0: -hx, z0: -hz, x1: hx, z1: -hz, w: 0.3 },
      { x0: hx, z0: -hz, x1: hx, z1: hz, w: 0.3 },
      { x0: hx, z0: hz, x1: -hx, z1: hz, w: 0.3 },
      { x0: -hx, z0: hz, x1: -hx, z1: -hz, w: 0.3 },
      { x0: -hx - 0.9, z0: 0, x1: -hx - 0.3, z1: 0, w: 0.3 },
      { x0: hx + 0.3, z0: 0, x1: hx + 0.9, z1: 0, w: 0.3 },
    ];
    const frameGeo = stripGeometry(f, 0.008);
    const frameMat = makeLedMaterial(100);
    return { groundGeo, groundMat, frameGeo, frameMat };
  }, []);

  useFrame(() => {
    const u = groundMat.uniforms;
    u.uLevel.value = out.ledLevel * out.arena;
    u.uDraw.value = out.ledDraw;
    u.uFlow.value = out.ledFlow;
    u.uDash.value = out.ledDash;
    u.uStretch.value = out.ledStretch;
    u.uFlash.value = out.ledFlash;
    ground.current.visible = u.uLevel.value > 0.001;
    frameMat.uniforms.uLevel.value = out.frame;
    frame.current.visible = out.frame > 0.001;
  });

  return (
    <group>
      <mesh ref={ground} geometry={groundGeo} material={groundMat} frustumCulled={false} renderOrder={2} />
      <mesh ref={frame} geometry={frameGeo} material={frameMat} renderOrder={2} />
    </group>
  );
}
