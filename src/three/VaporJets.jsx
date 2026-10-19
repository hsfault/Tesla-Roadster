import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { out, fx } from './director';
import { PIVOT } from './shots';

// ------------------------------------------------------------------------------------------------
// Cold-gas jet beams: open cones parented to the car so they swing with it (barrel roll included).
const coneVert = /* glsl */ `
varying vec2 vUv;
varying float vFace;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vFace = abs(dot(normalize(normalMatrix * normal), normalize(-mv.xyz)));
  gl_Position = projectionMatrix * mv;
}`;
const coneFrag = /* glsl */ `
uniform float uLevel;
uniform float uTime;
uniform sampler2D uTex;
varying vec2 vUv;
varying float vFace;
void main() {
  float along = vUv.y;                 // 1 at the nozzle, 0 at the open end
  float streak = texture2D(uTex, vec2(vUv.x * 2.0, along * 0.6 + uTime * 2.2)).r;
  float a = pow(along, 2.2) * (0.35 + 0.8 * streak) * pow(vFace, 2.0);
  gl_FragColor = vec4(vec3(0.86, 0.87, 0.88) * 0.9 * uLevel * a, 1.0);
}`;

const DOWN_NOZZLES = [
  [0.72, 0.2, 1.22],
  [-0.72, 0.2, 1.22],
  [0.72, 0.2, -1.3],
  [-0.72, 0.2, -1.3],
];
const REAR_NOZZLES = [
  [0.36, 0.46, -2.2],
  [-0.36, 0.46, -2.2],
];

export function JetCones() {
  const tex = useTexture('/fx/vapor-jet.jpg');
  const down = useRef();
  const rear = useRef();
  const [downMat, rearMat] = useMemo(() => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const make = () =>
      new THREE.ShaderMaterial({
        vertexShader: coneVert,
        fragmentShader: coneFrag,
        uniforms: { uLevel: { value: 0 }, uTime: { value: 0 }, uTex: { value: tex } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
    return [make(), make()];
  }, [tex]);
  const downGeo = useMemo(() => new THREE.ConeGeometry(0.42, 1.9, 20, 1, true), []);
  const rearGeo = useMemo(() => new THREE.ConeGeometry(0.3, 2.4, 20, 1, true), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const flick = 0.92 + Math.sin(t * 37.0) * 0.05 + Math.sin(t * 23.0) * 0.03;
    downMat.uniforms.uLevel.value = out.jetDown * flick;
    downMat.uniforms.uTime.value = t;
    rearMat.uniforms.uLevel.value = out.jetRear * flick;
    rearMat.uniforms.uTime.value = t;
    down.current.visible = out.jetDown > 0.002;
    rear.current.visible = out.jetRear > 0.002;
  });

  return (
    <group>
      <group ref={down} visible={false}>
        {DOWN_NOZZLES.map((n, i) => (
          <mesh key={i} geometry={downGeo} material={downMat} position={[n[0], n[1] - 0.95, n[2]]} renderOrder={8} />
        ))}
      </group>
      <group ref={rear} visible={false}>
        {REAR_NOZZLES.map((n, i) => (
          <mesh key={i} geometry={rearGeo} material={rearMat} position={[n[0], n[1], n[2] - 1.2]} rotation-x={Math.PI / 2} renderOrder={8} />
        ))}
      </group>
    </group>
  );
}

// ------------------------------------------------------------------------------------------------
// Billowing vapor sprites: one pooled instanced system (≤ 300 live), ring-buffer emission, no allocations.
export const MAX_PARTICLES = 300;

const spriteVert = /* glsl */ `
attribute vec3 aStart;
attribute vec3 aVel;
attribute vec4 aMeta; // birth, life, size0, size1
attribute float aSeed;
uniform float uTime;
varying float vAlpha;
varying vec2 vUv;
varying float vSeed;
void main() {
  float age = uTime - aMeta.x;
  float t = age / aMeta.y;
  vUv = uv;
  vSeed = aSeed;
  if (t < 0.0 || t > 1.0 || aMeta.y <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vAlpha = 0.0; return; }
  float drag = 1.0 - 0.45 * t;
  vec3 p = aStart + aVel * age * drag;
  p.y = max(p.y, 0.15 + age * 0.35);  // gas hitting the floor rolls along it and lifts
  float size = mix(aMeta.z, aMeta.w, sqrt(t));
  float rot = aSeed * 6.2831 + age * (aSeed - 0.5) * 0.8;
  vec2 c = vec2(cos(rot), sin(rot));
  vec2 q = vec2(position.x * c.x - position.y * c.y, position.x * c.y + position.y * c.x) * size;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  mv.xy += q;
  gl_Position = projectionMatrix * mv;
  vAlpha = smoothstep(0.0, 0.08, t) * pow(1.0 - t, 1.6);
}`;
const spriteFrag = /* glsl */ `
uniform sampler2D uTex;
uniform float uOpacity;
varying float vAlpha;
varying vec2 vUv;
varying float vSeed;
void main() {
  float d = texture2D(uTex, vUv).r;
  gl_FragColor = vec4(vec3(0.855, 0.865, 0.878) * d * vAlpha * uOpacity, 1.0);
}`;

const EMITTERS = {
  rear: { pts: REAR_NOZZLES, dir: [0, 0.05, -1], speed: 7, spread: 0.6, rate: 90, life: [0.7, 1.2], size: [0.35, 2.4] },
  down: { pts: DOWN_NOZZLES, dir: [0, -1, 0], speed: 5, spread: 0.9, rate: 130, life: [0.8, 1.4], size: [0.4, 2.8] },
  fan: { pts: [[0.42, 0.3, -2.2], [-0.42, 0.3, -2.2]], dir: [0, 0.15, -1], speed: 2.2, spread: 0.5, rate: 26, life: [0.8, 1.4], size: [0.25, 1.3] },
};

const KINDS = ['rear', 'down', 'fan'];

export default function VaporJets({ carRef }) {
  const tex = useTexture('/fx/smoke-2.jpg');
  const mesh = useRef();
  const state = useMemo(() => ({ head: 0, acc: { rear: 0, down: 0, fan: 0 } }), []);
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), d: new THREE.Vector3(), m3: new THREE.Matrix3() }), []);

  const { geometry, material } = useMemo(() => {
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    g.setAttribute('uv', base.getAttribute('uv'));
    g.setAttribute('aStart', new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aVel', new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aMeta', new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 4), 4).setUsage(THREE.DynamicDrawUsage));
    const seeds = new Float32Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) seeds[i] = Math.random();
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
    g.instanceCount = MAX_PARTICLES;
    const m = new THREE.ShaderMaterial({
      vertexShader: spriteVert,
      fragmentShader: spriteFrag,
      uniforms: { uTime: { value: 0 }, uTex: { value: tex }, uOpacity: { value: 0.55 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    return { geometry: g, material: m };
  }, [tex]);

  function emit(kind, count, now, carMatrix) {
    const e = EMITTERS[kind];
    const start = geometry.attributes.aStart.array;
    const vel = geometry.attributes.aVel.array;
    const meta = geometry.attributes.aMeta.array;
    tmp.m3.setFromMatrix4(carMatrix);
    for (let n = 0; n < count; n++) {
      const pt = e.pts[(Math.random() * e.pts.length) | 0];
      const i = state.head;
      state.head = (state.head + 1) % MAX_PARTICLES;
      tmp.p.set(pt[0], pt[1] - PIVOT, pt[2]).applyMatrix4(carMatrix); // car children sit under the pivot group
      tmp.d
        .set(e.dir[0] + (Math.random() - 0.5) * e.spread, e.dir[1] + (Math.random() - 0.5) * e.spread * 0.5, e.dir[2] + (Math.random() - 0.5) * e.spread)
        .applyMatrix3(tmp.m3)
        .normalize()
        .multiplyScalar(e.speed * (0.7 + Math.random() * 0.6));
      start[i * 3] = tmp.p.x;
      start[i * 3 + 1] = tmp.p.y;
      start[i * 3 + 2] = tmp.p.z;
      vel[i * 3] = tmp.d.x;
      vel[i * 3 + 1] = tmp.d.y;
      vel[i * 3 + 2] = tmp.d.z;
      meta[i * 4] = now - Math.random() * 0.03;
      meta[i * 4 + 1] = e.life[0] + Math.random() * (e.life[1] - e.life[0]);
      meta[i * 4 + 2] = e.size[0];
      meta[i * 4 + 3] = e.size[1] * (0.7 + Math.random() * 0.6);
    }
    geometry.attributes.aStart.needsUpdate = true;
    geometry.attributes.aVel.needsUpdate = true;
    geometry.attributes.aMeta.needsUpdate = true;
  }

  useFrame((s, dt) => {
    const now = s.clock.elapsedTime;
    material.uniforms.uTime.value = now;
    const car = carRef.current;
    if (!car) return;
    car.updateWorldMatrix(true, false);
    const step = Math.min(dt, 0.05);
    for (let k = 0; k < KINDS.length; k++) {
      const kind = KINDS[k];
      const rate = kind === 'rear' ? out.jetRear : kind === 'down' ? out.jetDown : out.jetFan;
      state.acc[kind] += rate * EMITTERS[kind].rate * step;
      const n = Math.floor(state.acc[kind]);
      if (n > 0) {
        state.acc[kind] -= n;
        emit(kind, n, now, car.matrixWorld);
      }
    }
    while (fx.puffs.length) {
      const kind = fx.puffs.shift();
      if (kind === 'all') {
        emit('down', 36, now, car.matrixWorld);
        emit('rear', 20, now, car.matrixWorld);
      } else emit('rear', 26, now, car.matrixWorld);
    }
  });

  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} renderOrder={9} />;
}
