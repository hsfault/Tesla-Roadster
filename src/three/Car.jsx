import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF, ContactShadows } from '@react-three/drei';
import { gsap } from '../lib/gsap';
import { CAR_MAP, GEO, CAR_SCALE, MODEL_URL } from './carMap';
import { makeBodyMaterial, makeLightBarMaterial, makeSatinBlack } from './repaint';
import { out } from './director';
import { PIVOT } from './shots';
import { useConfig } from '../store/config';
import { paintById } from '../data/paints';
import { WHEELS, CALIPERS } from '../data/variants';

useGLTF.preload(MODEL_URL);

const _up = new THREE.Vector3();
const _e = new THREE.Euler();

/** The repainted model, normalised: 4.4 m long, front facing +Z, wheels on y = 0, centred on the origin. */
function CarModel({ registerMaterials }) {
  const { scene } = useGLTF(MODEL_URL);

  const mats = useMemo(() => {
    const byNode = {};
    scene.traverse((o) => {
      if (o.isMesh) {
        o.updateMatrix(); // nodes are direct children of the glTF scene: local matrix = model space
        byNode[o.name] = o;
      }
    });
    const body = byNode[CAR_MAP.body.node];
    const bar = byNode[CAR_MAP.lightBar.node];
    const result = {};
    if (body) {
      result.body = makeBodyMaterial(body.material.map, body.matrix);
      body.material = result.body;
    }
    if (bar) {
      result.bar = makeLightBarMaterial(bar.material.map, bar.matrix);
      bar.material = result.bar;
    }
    const satin = makeSatinBlack();
    for (const key of ['rearFascia', 'plateHolder']) {
      const m = byNode[CAR_MAP[key].node];
      if (m) m.material = satin;
    }
    const plate = byNode[CAR_MAP.plate.node];
    if (plate) plate.material = new THREE.MeshStandardMaterial({ map: plate.material.map, roughness: 0.5, metalness: 0.2 });
    scene.traverse((o) => {
      if (o.isMesh) {
        o.frustumCulled = false;
        o.castShadow = false;
        o.receiveShadow = false;
      }
    });
    return result;
  }, [scene]);

  useEffect(() => registerMaterials(mats), [mats, registerMaterials]);

  return (
    <group rotation-y={Math.PI / 2} scale={CAR_SCALE}>
      <group position={[-GEO.centerX, 0, -GEO.centerZ]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

/** Applies the director's car transform; children ride along (jets, hotspots, charge glow). */
export default function Car({ children, carRef }) {
  const rig = useRef();
  const inner = useRef();
  const shadow = useRef();
  const mats = useRef({});

  const registerMaterials = useMemo(
    () => (m) => {
      mats.current = m;
      applyConfig(m, useConfig.getState(), true);
    },
    []
  );

  // paint / wheels / calipers follow the configurator store (0.6 s crossfade)
  useEffect(
    () =>
      useConfig.subscribe((state, prev) => {
        if (state.paint !== prev.paint || state.wheels !== prev.wheels || state.calipers !== prev.calipers)
          applyConfig(mats.current, state, false);
      }),
    []
  );

  useFrame(() => {
    const g = rig.current;
    if (!g) return;
    _e.set(out.carRX, out.carRY, out.carRZ, 'XYZ');
    _up.set(0, 1, 0).applyEuler(_e);
    g.position.set(out.carX + _up.x * PIVOT, out.carY + _up.y * PIVOT, out.carZ + _up.z * PIVOT);
    g.rotation.copy(_e);
    if (inner.current) inner.current.visible = out.carVis > 0.01;
    const b = mats.current.body?.userData.uniforms;
    if (b) {
      b.uBar.value = out.bar;
      b.uFront.value = out.front;
    }
    const lb = mats.current.bar?.userData.uniforms;
    if (lb) lb.uBar.value = out.bar;
    if (shadow.current) {
      const grounded = Math.abs(out.carRX) < 0.02 && Math.abs(out.carRZ) < 0.02 && out.carY < 0.05;
      shadow.current.visible = grounded && out.carVis > 0.01 && out.arena > 0.01;
    }
  });

  return (
    <group ref={(r) => { rig.current = r; if (carRef) carRef.current = r; }}>
      <group position={[0, -PIVOT, 0]}>
        <group ref={inner}>
          <CarModel registerMaterials={registerMaterials} />
        </group>
        <group ref={shadow}>
          <ContactShadows frames={1} position={[0, 0.012, 0]} scale={[3.4, 6.2]} resolution={512} blur={2.2} far={1.4} opacity={0.85} color="#000000" />
        </group>
        {children}
      </group>
    </group>
  );
}

function applyConfig(m, state, immediate) {
  const b = m?.body?.userData.uniforms;
  if (!b) return;
  const paint = paintById(state.paint);
  const wheel = WHEELS.find((w) => w.id === state.wheels) || WHEELS[0];
  const cal = CALIPERS.find((c) => c.id === state.calipers) || CALIPERS[0];
  const dur = immediate ? 0 : 0.6;
  const to = (color, hex) => {
    const c = new THREE.Color(hex);
    gsap.to(color, { r: c.r, g: c.g, b: c.b, duration: dur, ease: 'power2.inOut', overwrite: true });
  };
  to(b.uPaint.value, paint.hex);
  to(b.uRim.value, wheel.hex);
  to(b.uCaliper.value, cal.hex);
  gsap.to(b.uPaintMetal, { value: paint.metalness, duration: dur, overwrite: true });
  gsap.to(b.uPaintRough, { value: paint.roughness, duration: dur, overwrite: true });
  gsap.to(b.uRimMetal, { value: wheel.metal, duration: dur, overwrite: true });
  gsap.to(b.uRimRough, { value: wheel.rough, duration: dur, overwrite: true });
}
