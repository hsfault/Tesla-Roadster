import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { out } from './director';
import { LINEUP_Z } from './shots';

// Four abstract, dark vehicle-shaped blocks parked across the flight path, each with red underglow.
const glowFrag = /* glsl */ `
uniform float uLevel;
varying vec2 vUv;
void main() {
  vec2 d = abs(vUv - 0.5) * 2.0;
  float box = max(d.x, d.y);
  float a = (1.0 - smoothstep(0.55, 1.0, box)) * 0.9 + exp(-max(0.0, box - 0.72) * 9.0) * 0.4 * step(0.72, box);
  gl_FragColor = vec4(vec3(1.0, 0.165, 0.165) * 2.2 * uLevel * a, 1.0);
}`;
const glowVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export default function LineUp() {
  const group = useRef();
  const glow = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glowVert,
        fragmentShader: glowFrag,
        uniforms: { uLevel: { value: 0 } },
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );
  const body = useMemo(() => new THREE.MeshStandardMaterial({ color: '#16171a', roughness: 0.35, metalness: 0.6 }), []);

  useFrame(() => {
    const l = out.lineup;
    group.current.visible = l > 0.002 && out.arena > 0.01;
    if (!group.current.visible) return;
    group.current.position.y = -(1 - l) * 2;
    glow.uniforms.uLevel.value = l;
  });

  return (
    <group ref={group} visible={false}>
      {LINEUP_Z.map((z, i) => (
        <group key={i} position={[(i % 2 ? 0.25 : -0.2), 0, z]}>
          <RoundedBox args={[4.5, 1.32, 1.9]} radius={0.32} smoothness={3} position={[0, 0.78, 0]} material={body} />
          <RoundedBox args={[2.2, 0.5, 1.6]} radius={0.22} smoothness={3} position={[0.25, 1.55, 0]} material={body} />
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]} material={glow}>
            <planeGeometry args={[5.4, 2.7]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
