import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { out } from './director';
import { RAMP, rampPath, RAMP_LEN } from './shots';

const STEPS = 64;
const TOTAL = (Math.PI / 2) * RAMP.R + RAMP.H; // arc + vertical extension (surface length beyond the flat)
const FLAT = RAMP.z0 - RAMP.startZ;

/** Profile point by surface parameter u ∈ [0,1] from the foot of the curve to the top of the wall. */
function profile(u, p) {
  return rampPath(FLAT + u * TOTAL, p);
}

function buildSurface() {
  const pos = [];
  const uv = [];
  const nrm = [];
  const idx = [];
  const p = { z: 0, y: 0, a: 0 };
  for (let i = 0; i <= STEPS; i++) {
    const u = i / STEPS;
    profile(u, p);
    const ny = Math.cos(p.a);
    const nz = -Math.sin(p.a);
    for (const side of [-1, 1]) {
      pos.push((side * RAMP.W) / 2, p.y, p.z);
      nrm.push(0, ny, nz);
      uv.push(side < 0 ? 0 : RAMP.W / 4, (u * TOTAL) / 4);
    }
  }
  for (let i = 0; i < STEPS; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

function edgeCurve(x) {
  const pts = [];
  const p = { z: 0, y: 0, a: 0 };
  for (let i = 0; i <= 48; i++) {
    profile(i / 48, p);
    // sit the LED tube just proud of the surface
    pts.push(new THREE.Vector3(x, p.y + Math.cos(p.a) * 0.05, p.z - Math.sin(p.a) * 0.05));
  }
  return new THREE.CatmullRomCurve3(pts);
}

const ledVert = /* glsl */ `
varying float vU;
varying float vDist;
void main() {
  vU = uv.x;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const ledFrag = /* glsl */ `
uniform float uDraw;
uniform vec3 uColor;
varying float vU;
varying float vDist;
void main() {
  float on = 1.0 - smoothstep(uDraw - 0.03, uDraw, vU);
  float seg = step(0.18, fract(vU * 40.0)); // reads as LED segments switching on
  float fog = 1.0 - smoothstep(30.0, 95.0, vDist);
  gl_FragColor = vec4(uColor * 3.2 * on * mix(0.55, 1.0, seg) * fog, 1.0);
}`;

export default function WallRamp() {
  const group = useRef();
  const concrete = useTexture('/textures/concrete-ramp.jpg');
  const truss = useRef();

  const surface = useMemo(buildSurface, []);
  const edges = useMemo(
    () => [-1, 1].map((s) => new THREE.TubeGeometry(edgeCurve((s * RAMP.W) / 2 + s * -0.06), 96, 0.035, 6, false)),
    []
  );
  const groundLines = useMemo(
    () => [-1, 1].map((s) => {
      const g = new THREE.PlaneGeometry(0.07, FLAT + 4);
      g.rotateX(-Math.PI / 2);
      g.translate((s * RAMP.W) / 2, 0.009, RAMP.startZ + (FLAT + 4) / 2 - 4);
      return g;
    }),
    []
  );
  const ledMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ledVert,
        fragmentShader: ledFrag,
        uniforms: { uDraw: { value: 0 }, uColor: { value: new THREE.Color('#FF2A2A') } },
        toneMapped: false,
      }),
    []
  );
  const groundLedMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#FF2A2A').multiplyScalar(2.2), toneMapped: false, transparent: true }), []);

  const trussMatrices = useMemo(() => {
    const list = [];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const pr = { z: 0, y: 0, a: 0 };
    const backZ = RAMP.z0 + RAMP.R + 0.15;
    // vertical columns behind the curve, from the ground to the underside of the surface
    for (let i = 1; i <= 14; i++) {
      profile(i / 14, pr);
      for (const x of [-RAMP.W / 2 + 0.2, 0, RAMP.W / 2 - 0.2]) {
        const h = Math.max(0.2, pr.y - 0.1);
        p.set(x, h / 2, pr.z + 0.15);
        s.set(0.08, h, 0.08);
        list.push(m.clone().compose(p, q.identity(), s));
      }
    }
    // back wall lattice: horizontals + verticals
    for (let y = 1; y < RAMP.R + RAMP.H; y += 1.4) {
      p.set(0, y, backZ + 0.3);
      s.set(RAMP.W, 0.06, 0.06);
      list.push(m.clone().compose(p, q.identity(), s));
    }
    for (let x = -RAMP.W / 2; x <= RAMP.W / 2 + 0.01; x += RAMP.W / 5) {
      p.set(x, (RAMP.R + RAMP.H) / 2, backZ + 0.3);
      s.set(0.08, RAMP.R + RAMP.H, 0.08);
      list.push(m.clone().compose(p, q.identity(), s));
      // raking struts
      const len = Math.hypot(4, RAMP.R + RAMP.H);
      p.set(x, (RAMP.R + RAMP.H) / 2, backZ + 2.3);
      q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.atan2(4, RAMP.R + RAMP.H));
      s.set(0.07, len, 0.07);
      list.push(m.clone().compose(p, q, s));
    }
    return list;
  }, []);

  useEffect(() => {
    trussMatrices.forEach((mm, i) => truss.current.setMatrixAt(i, mm));
    truss.current.instanceMatrix.needsUpdate = true;
  }, [trussMatrices]);

  useMemo(() => {
    concrete.wrapS = concrete.wrapT = THREE.RepeatWrapping;
    concrete.colorSpace = THREE.SRGBColorSpace;
  }, [concrete]);

  const wash = useRef();
  const washTarget = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    const r = out.ramp;
    if (wash.current) wash.current.intensity = r * out.arena * 1.6;
    const g = group.current;
    g.visible = r > 0.002 && out.arena > 0.01;
    if (!g.visible) return;
    g.position.y = -(1 - r) * (RAMP.R + RAMP.H + 1);
    ledMat.uniforms.uDraw.value = out.rampLed * 1.03;
    groundLedMat.opacity = out.rampLed;
  });

  return (
    <>
    <primitive object={washTarget} position={[0, 6, RAMP.z0 + RAMP.R - 1]} />
    <spotLight ref={wash} position={[-12, 18, RAMP.z0 - 6]} target={washTarget} angle={0.55} penumbra={0.8} decay={0} intensity={0} color="#EEF1F6" />
    <group ref={group} visible={false}>
      <mesh geometry={surface}>
        <meshStandardMaterial map={concrete} color="#c9c9c4" roughness={0.88} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {edges.map((g, i) => (
        <mesh key={i} geometry={g} material={ledMat} />
      ))}
      {groundLines.map((g, i) => (
        <mesh key={i} geometry={g} material={groundLedMat} />
      ))}
      <instancedMesh ref={truss} args={[null, null, trussMatrices.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1C1E22" roughness={0.6} metalness={0.5} />
      </instancedMesh>
    </group>
    </>
  );
}

export { RAMP_LEN };
