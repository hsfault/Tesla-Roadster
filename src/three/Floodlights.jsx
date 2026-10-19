import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { out, fx } from './director';
import { clunk } from '../lib/sound';

// Three floodlight towers (left → right as seen from the hero shot), aimed at the car's mark.
export const TOWERS = [
  { x: -22, z: 30 },
  { x: 0, z: 44 },
  { x: 22, z: 30 },
];
const HEIGHT = 17;
const LAMPS = [
  [-1.5, 0.75], [0, 0.75], [1.5, 0.75],
  [-1.5, -0.75], [0, -0.75], [1.5, -0.75],
];

function trussMatrices() {
  const mats = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const e = new THREE.Euler();
  const half = 0.55;
  for (const t of TOWERS) {
    const yaw = Math.atan2(-t.x, -t.z);
    const base = new THREE.Matrix4().makeRotationY(yaw).setPosition(t.x, 0, t.z);
    // four posts
    for (const [px, pz] of [[-half, -half], [half, -half], [half, half], [-half, half]]) {
      p.set(px, HEIGHT / 2, pz);
      s.set(0.09, HEIGHT, 0.09);
      q.identity();
      mats.push(m.clone().compose(p, q, s).premultiply(base));
    }
    // diagonal braces on each face, every 1.6 m
    for (let y = 0.8; y < HEIGHT - 1; y += 1.6) {
      for (let f = 0; f < 4; f++) {
        const ang = (f * Math.PI) / 2;
        const len = Math.hypot(half * 2, 1.6);
        p.set(Math.sin(ang) * half, y + 0.8, Math.cos(ang) * half);
        e.set(0, ang, 0);
        q.setFromEuler(e);
        const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(half * 2, 1.6) * (y % 3.2 < 1.6 ? 1 : -1));
        q.multiply(tilt);
        s.set(0.05, len, 0.05);
        mats.push(m.clone().compose(p, q, s).premultiply(base));
      }
    }
    // head frame
    p.set(0, HEIGHT + 1.1, 0.2);
    q.setFromEuler(e.set(-0.18, 0, 0));
    s.set(5.0, 2.9, 0.35);
    mats.push(m.clone().compose(p, q, s).premultiply(base));
  }
  return mats;
}

const beamVert = /* glsl */ `
varying float vAlong;
varying float vFace;
void main() {
  vAlong = uv.y;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 n = normalize(normalMatrix * normal);
  vFace = abs(dot(n, normalize(-mv.xyz)));
  gl_Position = projectionMatrix * mv;
}`;
const beamFrag = /* glsl */ `
uniform float uLevel;
varying float vAlong;
varying float vFace;
void main() {
  float a = pow(vAlong, 1.8) * pow(vFace, 1.5) * uLevel;
  gl_FragColor = vec4(vec3(0.85, 0.88, 1.0) * a, 1.0);
}`;
const BEAM_TARGET = new THREE.Vector3(0, 0, 2);

export default function Floodlights() {
  const flare = useTexture('/fx/flare.jpg');
  const truss = useRef();
  const lampMesh = useRef();
  const groups = useRef([]);
  const spots = useRef([]);
  const sprites = useRef([]);
  const hazes = useRef([]);
  const prev = useRef([0, 0, 0]);
  const target = useMemo(() => new THREE.Object3D(), []);

  const trussList = useMemo(trussMatrices, []);
  const lampMatrices = useMemo(() => {
    const list = [];
    const m = new THREE.Matrix4();
    for (const t of TOWERS) {
      const yaw = Math.atan2(-t.x, -t.z);
      const base = new THREE.Matrix4().makeRotationY(yaw).setPosition(t.x, 0, t.z);
      const head = new THREE.Matrix4().makeRotationX(-0.18).setPosition(0, HEIGHT + 1.1, 0.4);
      for (const [lx, ly] of LAMPS) {
        list.push(m.clone().makeTranslation(lx, ly, 0).premultiply(head).premultiply(base));
      }
    }
    return list;
  }, []);

  useEffect(() => {
    trussList.forEach((mm, i) => truss.current.setMatrixAt(i, mm));
    truss.current.instanceMatrix.needsUpdate = true;
    const c = new THREE.Color();
    lampMatrices.forEach((mm, i) => {
      lampMesh.current.setMatrixAt(i, mm);
      lampMesh.current.setColorAt(i, c.setScalar(0));
    });
    lampMesh.current.instanceMatrix.needsUpdate = true;
  }, [trussList, lampMatrices]);

  const lampPositions = useMemo(
    () => lampMatrices.map((mm) => new THREE.Vector3().setFromMatrixPosition(mm)),
    [lampMatrices]
  );

  const color = useMemo(() => new THREE.Color(), []);
  const beams = useRef([]);
  const beamData = useMemo(
    () =>
      TOWERS.map(() => {
        const mat = new THREE.ShaderMaterial({
          vertexShader: beamVert,
          fragmentShader: beamFrag,
          uniforms: { uLevel: { value: 0 } },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          toneMapped: false,
        });
        return { mat };
      }),
    []
  );
  const beamGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(7.5, 1, 32, 1, true);
    g.translate(0, -0.5, 0); // apex at the origin, opening downward along −Y
    return g;
  }, []);
  const beamXforms = useMemo(
    () =>
      TOWERS.map((t) => {
        const head = new THREE.Vector3(t.x * 0.97, HEIGHT + 1.1, t.z * 0.97);
        const dir = BEAM_TARGET.clone().sub(head);
        const len = dir.length();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
        return { head, q, len };
      }),
    []
  );

  useFrame((_, dt) => {
    const levels = [out.f0, out.f1, out.f2];
    const visible = out.arena > 0.01;
    for (let i = 0; i < 3; i++) {
      const L = levels[i] * out.arena;
      // switching a bank on through 50 % fires a short glare spike + exposure bump
      if (prev.current[i] < 0.5 && L >= 0.5) {
        fx.flare[i] = 1;
        clunk(0.8);
      }
      prev.current[i] = L;
      fx.flare[i] = Math.max(0, fx.flare[i] - dt * 2.2);
      const f = fx.flare[i];
      const intensity = L * (1 + f * 0.6);
      if (spots.current[i]) spots.current[i].intensity = 1.5 * intensity;
      if (groups.current[i]) groups.current[i].visible = visible;
      const bm = beams.current[i];
      if (bm) {
        beamData[i].mat.uniforms.uLevel.value = L * (0.05 + f * 0.08);
        bm.visible = visible && L > 0.001;
      }
      for (let k = 0; k < 6; k++) {
        const idx = i * 6 + k;
        lampMesh.current.setColorAt(idx, color.setScalar(L * (5 + f * 10)));
        const sp = sprites.current[idx];
        if (sp) {
          sp.material.opacity = Math.min(1, L * (0.85 + f * 0.6));
          sp.scale.setScalar(2.6 + f * 3.5);
          sp.visible = visible && L > 0.001;
        }
      }
      const hz = hazes.current[i];
      if (hz) {
        hz.material.opacity = L * (0.22 + f * 0.5);
        hz.visible = visible && L > 0.001;
      }
    }
    if (lampMesh.current.instanceColor) lampMesh.current.instanceColor.needsUpdate = true;
    truss.current.visible = visible;
    lampMesh.current.visible = visible;
  });

  return (
    <group>
      <primitive object={target} position={[0, 0.4, 2]} />
      <instancedMesh ref={truss} args={[null, null, trussList.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1C1E22" roughness={0.6} metalness={0.6} />
      </instancedMesh>
      <instancedMesh ref={lampMesh} args={[null, null, lampMatrices.length]} frustumCulled={false}>
        <planeGeometry args={[1.25, 1.25]} />
        <meshBasicMaterial toneMapped={false} fog={false} side={THREE.DoubleSide} />
      </instancedMesh>
      {TOWERS.map((t, i) => (
        // lights stay mounted and visible (intensity 0 when off) so the light count never changes → no recompiles
        <spotLight
          key={`l${i}`}
          ref={(r) => (spots.current[i] = r)}
          position={[t.x * 0.95, HEIGHT + 1, t.z * 0.95]}
          target={target}
          angle={0.3}
          penumbra={0.9}
          decay={0}
          intensity={0}
          color="#F4F6FF"
        />
      ))}
      {beamXforms.map((b, i) => (
        <mesh
          key={`b${i}`}
          ref={(r) => (beams.current[i] = r)}
          geometry={beamGeo}
          material={beamData[i].mat}
          position={b.head}
          quaternion={b.q}
          scale={[1, b.len, 1]}
          renderOrder={4}
          frustumCulled={false}
        />
      ))}
      {TOWERS.map((t, i) => (
        <group key={i} ref={(r) => (groups.current[i] = r)}>
          <sprite ref={(r) => (hazes.current[i] = r)} position={[t.x, HEIGHT + 1.1, t.z]} scale={[16, 16, 1]} renderOrder={5}>
            <spriteMaterial map={flare} blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={0} fog={false} toneMapped={false} color="#cfd8ff" />
          </sprite>
        </group>
      ))}
      {lampPositions.map((p, idx) => (
        <sprite key={idx} ref={(r) => (sprites.current[idx] = r)} position={p} renderOrder={6}>
          <spriteMaterial map={flare} blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={0} fog={false} toneMapped={false} color={new THREE.Color(3, 3, 3.2)} />
        </sprite>
      ))}
    </group>
  );
}
