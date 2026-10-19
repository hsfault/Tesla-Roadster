import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Line, Html } from '@react-three/drei';
import { out } from './director';
import { MODEL_URL, GEO, CAR_SCALE } from './carMap';

// Technical drawing for /specs: feature edges of the supplied GLB (EdgesGeometry, the same thing drei <Edges>
// renders) in white on black, plus red dimension lines. Built lazily the first time /specs is shown.
const THRESHOLD = 32;

function Dim({ from, to, label, tick = [0, 0.12, 0] }) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const mid = a.clone().lerp(b, 0.5);
  const t = new THREE.Vector3(...tick);
  return (
    <group>
      <Line points={[a, b]} color="#FF2A2A" lineWidth={1.2} toneMapped={false} />
      <Line points={[a.clone().sub(t), a.clone().add(t)]} color="#FF2A2A" lineWidth={1.2} toneMapped={false} />
      <Line points={[b.clone().sub(t), b.clone().add(t)]} color="#FF2A2A" lineWidth={1.2} toneMapped={false} />
      <Html position={mid} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <span className="plate whitespace-nowrap px-2 py-1 font-mono text-[12px] uppercase tracking-[0.14em] text-white">{label}</span>
      </Html>
    </group>
  );
}

export default function LineDrawing() {
  const { scene } = useGLTF(MODEL_URL);
  const group = useRef();
  const mat = useMemo(() => new THREE.LineBasicMaterial({ color: '#F3F5F7', transparent: true, opacity: 0.55, fog: false, toneMapped: false }), []);

  const parts = useMemo(() => {
    const list = [];
    scene.traverse((o) => {
      if (!o.isMesh) return;
      o.updateMatrix(); // nodes are direct children of the glTF scene: local matrix = scene-relative matrix
      const edges = new THREE.EdgesGeometry(o.geometry, THRESHOLD);
      list.push({ geometry: edges, matrix: o.matrix.clone() });
    });
    return list;
  }, [scene]);

  useFrame(() => {
    group.current.visible = out.lines > 0.01;
    mat.opacity = 0.55 * out.lines;
  });

  const L = (GEO.maxX - GEO.minX) * CAR_SCALE;
  const H = GEO.height * CAR_SCALE;
  const fz = (GEO.centerX - GEO.frontAxleX) * CAR_SCALE;
  const rz = (GEO.centerX - GEO.rearAxleX) * CAR_SCALE;

  return (
    <group ref={group} visible={false}>
      <group rotation-y={Math.PI / 2} scale={CAR_SCALE}>
        <group position={[-GEO.centerX, 0, -GEO.centerZ]}>
          {parts.map((p, i) => (
            <lineSegments key={i} geometry={p.geometry} material={mat} matrixAutoUpdate={false} matrix={p.matrix} />
          ))}
        </group>
      </group>
      {/* the drawing is viewed from −X: +Z (front) is on the right */}
      <Dim from={[0, -0.32, -L / 2]} to={[0, -0.32, L / 2]} label="Length" />
      <Dim from={[0, -0.12, rz]} to={[0, -0.12, fz]} label="Wheelbase" />
      <Dim from={[0, 0, L / 2 + 0.35]} to={[0, H, L / 2 + 0.35]} label="Height" tick={[0, 0, 0.12]} />
    </group>
  );
}
