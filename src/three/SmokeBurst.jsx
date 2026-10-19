import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { out } from './director';

// The landing cloud: deterministic in scroll progress (out.landing), so it scrubs both ways.
const COUNT = 64;
const ORIGIN = new THREE.Vector3(0, 0.2, 22);

const vert = /* glsl */ `
attribute vec4 aDir;   // xyz direction, w = reach
attribute vec4 aMeta;  // size0, size1, delay, seed
uniform float uProg;
uniform float uTime;
uniform vec3 uOrigin;
varying vec2 vUv;
varying float vAlpha;
void main() {
  vUv = uv;
  float t = clamp((uProg - aMeta.z) / (1.0 - aMeta.z), 0.0, 1.0);
  float e = 1.0 - pow(1.0 - t, 3.0);
  vec3 p = uOrigin + aDir.xyz * aDir.w * e + vec3(0.0, e * e * 1.6, 0.0);
  p.x += sin(uTime * 0.3 + aMeta.w * 20.0) * 0.25 * e;
  float size = mix(aMeta.x, aMeta.y, e);
  float rot = aMeta.w * 6.2831 + uTime * 0.05 * (aMeta.w - 0.5);
  vec2 c = vec2(cos(rot), sin(rot));
  vec2 q = vec2(position.x * c.x - position.y * c.y, position.x * c.y + position.y * c.x) * size;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  mv.xy += q;
  gl_Position = projectionMatrix * mv;
  vAlpha = smoothstep(0.0, 0.06, t);
}`;
const frag = /* glsl */ `
uniform sampler2D uTex;
uniform float uOpacity;
varying vec2 vUv;
varying float vAlpha;
void main() {
  float d = texture2D(uTex, vUv).r;
  float a = clamp(d * 1.35, 0.0, 1.0) * vAlpha * uOpacity;
  gl_FragColor = vec4(vec3(0.855, 0.866, 0.878) * (0.82 + 0.3 * d), a);
}`;

export default function SmokeBurst() {
  const tex = useTexture('/fx/smoke-4.jpg');
  const mesh = useRef();
  const { geometry, material } = useMemo(() => {
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    g.setAttribute('uv', base.getAttribute('uv'));
    const dir = new Float32Array(COUNT * 4);
    const meta = new Float32Array(COUNT * 4);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < COUNT; i++) {
      const a = rnd() * Math.PI * 2;
      const up = 0.08 + rnd() * 0.45;
      const v = new THREE.Vector3(Math.cos(a), up, Math.sin(a)).normalize();
      dir.set([v.x, v.y, v.z, 2.5 + rnd() * 9], i * 4);
      meta.set([1.2 + rnd() * 1.4, 4.5 + rnd() * 6.5, rnd() * 0.25, rnd()], i * 4);
    }
    g.setAttribute('aDir', new THREE.InstancedBufferAttribute(dir, 4));
    g.setAttribute('aMeta', new THREE.InstancedBufferAttribute(meta, 4));
    g.instanceCount = COUNT;
    const m = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: { uProg: { value: 0 }, uTime: { value: 0 }, uTex: { value: tex }, uOrigin: { value: ORIGIN }, uOpacity: { value: 1 } },
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    return { geometry: g, material: m };
  }, [tex]);

  useFrame((s) => {
    const l = out.landing;
    mesh.current.visible = l > 0.001 && out.arena > 0.01;
    material.uniforms.uProg.value = l;
    material.uniforms.uTime.value = s.clock.elapsedTime;
  });

  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} renderOrder={10} visible={false} />;
}
