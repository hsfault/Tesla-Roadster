import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, PerformanceMonitor, useProgress, useTexture } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction, Effect, ToneMappingMode } from 'postprocessing';
import { gsap } from '../lib/gsap';
import { useUI } from '../store/ui';
import { compute, fx, out, setModeShots } from './director';
import { MODE_SHOTS, SHOTS } from './shots';
import CameraRig from './CameraRig';
import Arena from './Arena';
import Floodlights from './Floodlights';
import LedStrips from './LedStrips';
import WallRamp from './WallRamp';
import LineUp from './LineUp';
import Car from './Car';
import VaporJets, { JetCones } from './VaporJets';
import SmokeBurst from './SmokeBurst';
import Hotspots from './Hotspots';
import LineDrawing from './LineDrawing';
import { isCapture } from '../lib/device';

setModeShots(MODE_SHOTS);

// ------------------------------------------------------------------ exposure (film blackouts, floodlight "clunk")
class ExposureEffect extends Effect {
  constructor() {
    super(
      'ExposureEffect',
      /* glsl */ `uniform float exposure;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  outputColor = vec4(inputColor.rgb * exposure, inputColor.a);
}`,
      { uniforms: new Map([['exposure', new THREE.Uniform(1)]]) }
    );
  }
}

const BASE_EXPOSURE = 1.0;

function Effects() {
  const perfLow = useUI((s) => s.perfLow);
  const lite = useUI((s) => s.lite);
  const exposure = useMemo(() => new ExposureEffect(), []);
  useFrame(() => {
    const bump = (fx.flare[0] + fx.flare[1] + fx.flare[2]) * 0.15;
    exposure.uniforms.get('exposure').value = BASE_EXPOSURE * Math.min(1.15, 1 + bump) * (1 - fx.blackout);
  });
  return (
    <EffectComposer multisampling={perfLow || lite ? 0 : 4} enableNormalPass={false}>
      {!perfLow && <Bloom mipmapBlur intensity={0.42} luminanceThreshold={1.15} luminanceSmoothing={0.3} resolutionScale={0.5} />}
      <primitive object={exposure} />
      {/* ACES keeps true blacks for the night arena (AgX lifted the floor to studio grey) */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      {/* a whisper of grain + lens falloff: what makes it read as a camera, not a render */}
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.1} />
      <Vignette offset={0.32} darkness={0.62} />
    </EffectComposer>
  );
}

// ------------------------------------------------------------------ lighting
function Lighting() {
  const scene = useThree((s) => s.scene);
  const pool = useRef();
  const poolTarget = useMemo(() => new THREE.Object3D(), []);
  const hemi = useRef();
  const key = useRef();
  const rim = useRef();
  useFrame(() => {
    scene.environmentIntensity = out.env * 0.6;
    if (hemi.current) hemi.current.intensity = 0.04 * out.env;
    // key from above-front gives the white paint a real light→shadow gradient; rim separates it from the night
    // key / rim follow the car so the floor only gets a soft pool around it (a stage, not a studio)
    for (const l of [key.current, rim.current]) {
      if (!l) continue;
      l.target.position.set(out.carX, out.carY + 0.5, out.carZ);
      l.target.updateMatrixWorld();
    }
    if (key.current) {
      key.current.intensity = 5.5 * out.env;
      key.current.position.set(out.carX + 5, out.carY + 11, out.carZ + 7);
    }
    if (rim.current) {
      rim.current.intensity = 4 * out.env;
      rim.current.position.set(out.carX - 4, out.carY + 3.5, out.carZ - 9);
    }
    const p = pool.current;
    if (p) {
      p.intensity = out.spot * 5.5;
      p.position.set(out.spX, out.spY, out.spZ);
      poolTarget.position.set(out.stX, out.stY, out.stZ);
      poolTarget.updateMatrixWorld();
    }
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={['#d8dde6', '#050507', 0.04]} />
      <spotLight ref={key} angle={0.2} penumbra={1} decay={0} intensity={0} color="#f4f6ff" />
      <spotLight ref={rim} angle={0.26} penumbra={1} decay={0} intensity={0} color="#dfe6ff" />
      <primitive object={poolTarget} />
      <spotLight ref={pool} target={poolTarget} angle={0.3} penumbra={0.65} decay={0} intensity={0} color="#ffffff" />
      <Environment resolution={512} frames={1} background={false}>
        <group rotation={[0, 0, 0]}>
          {/* two long, thin overhead light bars: crisp highlights running along the body */}
          {[-1.2, 1.2].map((x) => (
            <Lightformer key={x} form="rect" intensity={5} position={[x, 8, 0]} rotation-x={Math.PI / 2} scale={[0.7, 16, 1]} />
          ))}
          {/* far floodlight banks: small, hot panels → pin-sharp specular points on the clearcoat */}
          {[[-22, 30], [0, 44], [22, 30], [-26, -24], [26, -24]].map(([x, z]) => (
            <Lightformer key={`${x}${z}`} form="rect" intensity={22} position={[x * 0.35, 6.5, z * 0.35]} target={[0, 0.5, 0]} scale={[1.6, 0.9, 1]} />
          ))}
          {/* soft, dim side fills so the flanks are not dead black */}
          <Lightformer form="rect" intensity={0.22} position={[-9, 2.5, 0]} rotation-y={Math.PI / 2} scale={[18, 2.2, 1]} />
          <Lightformer form="rect" intensity={0.22} position={[9, 2.5, 0]} rotation-y={-Math.PI / 2} scale={[18, 2.2, 1]} />
          {/* low horizon band + a red LED line: what a car on a lit floor actually reflects at its waist */}
          <Lightformer form="rect" intensity={0.35} position={[0, 0.6, -12]} scale={[40, 0.5, 1]} />
          <Lightformer form="rect" intensity={0.35} position={[0, 0.6, 12]} rotation-y={Math.PI} scale={[40, 0.5, 1]} />
          <Lightformer form="rect" color="#ff2a2a" intensity={2.2} position={[0, 0.08, -10]} scale={[30, 0.06, 1]} />
        </group>
      </Environment>
    </>
  );
}

// ------------------------------------------------------------------ red glow behind the rear wing (charge)
function ChargeGlow() {
  const light = useRef();
  const sprite = useRef();
  const flare = useTexture('/fx/flare.jpg');
  useFrame((s) => {
    const g = out.glow * (0.92 + Math.sin(s.clock.elapsedTime * 2.2) * 0.08);
    light.current.intensity = g * 6;
    sprite.current.visible = g > 0.01;
    sprite.current.material.opacity = g;
  });
  return (
    <group position={[0.55, 1.02, -1.95]}>
      <pointLight ref={light} color="#FF2A2A" intensity={0} distance={3.2} decay={2} />
      <sprite ref={sprite} scale={[1.6, 1.6, 1]} visible={false}>
        <spriteMaterial map={flare} color={new THREE.Color(2.4, 0.35, 0.35)} blending={THREE.AdditiveBlending} depthWrite={false} transparent toneMapped={false} />
      </sprite>
    </group>
  );
}

// ------------------------------------------------------------------ per-frame director tick + snapshots
function DirectorTick() {
  const mode = useUI((s) => s.sceneMode);
  useFrame((state) => {
    compute(mode, state.clock.elapsedTime);
  }, -2);
  return null;
}

function Snapshot() {
  const gl = useThree((s) => s.gl);
  useFrame(() => {
    if (!fx.snapshot) return;
    const cb = fx.snapshot;
    fx.snapshot = null;
    gl.domElement.toBlob((b) => cb(b), cb.type || 'image/png', cb.quality || 0.9);
  }, 2);
  return null;
}

// ------------------------------------------------------------------ configurator orbit
export const configCamera = { controls: null };
function ConfigureControls() {
  const camera = useThree((s) => s.camera);
  const ref = useRef();
  useEffect(() => {
    const c = SHOTS.configure;
    camera.position.set(...c.position);
    camera.lookAt(...c.target);
    configCamera.controls = ref.current;
    if (ref.current) {
      ref.current.target.set(...c.target);
      ref.current.update();
    }
    return () => {
      configCamera.controls = null;
    };
  }, [camera]);
  const base = Math.hypot(...SHOTS.configure.position.map((v, i) => v - SHOTS.configure.target[i]));
  return (
    <OrbitControls
      ref={ref}
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minPolarAngle={(55 * Math.PI) / 180}
      maxPolarAngle={(88 * Math.PI) / 180}
      minDistance={base * 0.8}
      maxDistance={base * 1.4}
      rotateSpeed={0.6}
    />
  );
}

/** Tween the configurator camera to a preset view around the car. */
export function flyTo(preset) {
  const ctl = configCamera.controls;
  if (!ctl) return;
  const cam = ctl.object;
  const r = cam.position.distanceTo(ctl.target);
  const deg = Math.PI / 180;
  const views = {
    front: { az: 0, pol: 80 },
    side: { az: 90, pol: 82 },
    rear: { az: 180, pol: 78 },
    top: { az: 35, pol: 55 },
  };
  const v = views[preset];
  if (!v) return;
  const sph = new THREE.Spherical().setFromVector3(cam.position.clone().sub(ctl.target));
  let az = v.az * deg;
  while (az - sph.theta > Math.PI) az -= Math.PI * 2;
  while (sph.theta - az > Math.PI) az += Math.PI * 2;
  const st = { theta: sph.theta, phi: sph.phi };
  gsap.to(st, {
    theta: az,
    phi: v.pol * deg,
    duration: 1.1,
    ease: 'power3.inOut',
    onUpdate: () => {
      const p = new THREE.Vector3().setFromSpherical(new THREE.Spherical(r, st.phi, st.theta)).add(ctl.target);
      cam.position.copy(p);
      ctl.update();
    },
  });
}

// ------------------------------------------------------------------ ready signal + shader warm-up
function Ready() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    // compile every program once (set pieces included) behind the loader, so nothing hitches later
    const hidden = [];
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
    });
    try {
      gl.compile(scene, camera);
    } catch {
      /* compile is best-effort */
    }
    hidden.forEach((o) => (o.visible = false));
    const id = requestAnimationFrame(() => useUI.getState().set({ sceneReady: true }));
    return () => cancelAnimationFrame(id);
  }, [gl, scene, camera]);
  return null;
}

// ------------------------------------------------------------------ capture harness (npm run capture)
function CaptureHarness() {
  const gl = useThree((s) => s.gl);
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    if (!isCapture) return;
    gsap.ticker.lagSmoothing(0); // software rendering is slow; tweens must still run in real time
    window.__capture = async (override, type = 'image/webp', quality = 0.84) => {
      if (override.sceneMode) useUI.getState().setSceneMode(override.sceneMode);
      fx.override = override.sceneMode ? null : override;
      fx.intro = 1;
      if (override.paint) {
        const { useConfig } = await import('../store/config');
        useConfig.getState().setPaint(override.paint);
        await new Promise((r) => setTimeout(r, 900));
      }
      await new Promise((r) => setTimeout(r, override.wait || 2500));
      return await new Promise((resolve) => {
        fx.snapshot = Object.assign(
          (blob) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.readAsDataURL(blob);
          },
          { type, quality }
        );
      });
    };
    window.__captureReady = useUI.getState().sceneReady;
    return useUI.subscribe((s) => {
      window.__captureReady = s.sceneReady;
    });
  }, [gl, advance]);
  return null;
}

// ------------------------------------------------------------------ the one canvas
/** Real asset progress (drei useProgress) → store, for the "Lights on" loader. */
function useReportProgress() {
  const { progress, active } = useProgress();
  useEffect(() => {
    useUI.getState().set({ loadProgress: active ? Math.min(0.99, progress / 100) : progress / 100 });
  }, [progress, active]);
}

export default function Scene() {
  useReportProgress();
  const mode = useUI((s) => s.sceneMode);
  const perfLow = useUI((s) => s.perfLow || s.lite);
  const covered = useUI((s) => s.footerVisible || s.transitionCovered);
  const carRef = useRef();
  const interactive = mode === 'configure';

  return (
    <div className="fixed inset-0 z-0" style={{ pointerEvents: interactive ? 'auto' : 'none' }} aria-hidden="true">
      <Canvas
        flat
        dpr={perfLow ? 1 : [1, 1.5]}
        frameloop={covered && !isCapture ? 'demand' : 'always'}
        gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false }}
        camera={{ fov: 32, near: 0.1, far: 240, position: [0, 0.95, -6.4] }}
        onCreated={({ gl }) => {
          gl.setClearColor('#050507');
        }}
      >
        <color attach="background" args={['#050507']} />
        <fog attach="fog" args={['#050507', 20, 90]} />
        <PerformanceMonitor
          onDecline={() => useUI.getState().set({ perfLow: true })}
          onFallback={() => useUI.getState().set({ perfLow: true })}
          flipflops={3}
        />
        <DirectorTick />
        <CameraRig />
        {interactive && <ConfigureControls />}
        <Suspense fallback={null}>
          <Lighting />
          <Arena />
          <Floodlights />
          <LedStrips />
          <WallRamp />
          <LineUp />
          <Car carRef={carRef}>
            <JetCones />
            <Hotspots />
            <ChargeGlow />
          </Car>
          <VaporJets carRef={carRef} />
          <SmokeBurst />
          {mode === 'specs' && <LineDrawing />}
          <Ready />
        </Suspense>
        <Effects />
        <Snapshot />
        <CaptureHarness />
      </Canvas>
    </div>
  );
}
