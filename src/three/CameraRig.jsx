import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { gsap } from '../lib/gsap';
import { out } from './director';
import { useUI } from '../store/ui';

const DEG = Math.PI / 180;
const _off = new THREE.Vector3();
const _tgt = new THREE.Vector3();

/**
 * One camera for the whole site. Reads the director's shot each frame and adds the idle orbit (±3°),
 * lerped mouse parallax (≤ 2°), launch shake, aspect-aware FOV and screen-space framing (view offset).
 * In /configure the OrbitControls own the camera; only the framing offset is applied here.
 */
export default function CameraRig() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const mode = useUI((s) => s.sceneMode);

  const pointer = useMemo(() => ({ x: 0, y: 0 }), []);
  useEffect(() => {
    const qx = gsap.quickTo(pointer, 'x', { duration: 1.2, ease: 'power3.out' });
    const qy = gsap.quickTo(pointer, 'y', { duration: 1.2, ease: 'power3.out' });
    const move = (e) => {
      qx((e.clientX / window.innerWidth) * 2 - 1);
      qy((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [pointer]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const aspect = size.width / Math.max(1, size.height);

    if (mode !== 'configure') {
      _tgt.set(out.tgtX, out.tgtY, out.tgtZ);
      _off.set(out.camX - out.tgtX, out.camY - out.tgtY, out.camZ - out.tgtZ);
      const yaw = (out.orbit * 3 * Math.sin(t * 0.11) + pointer.x * 2 * out.parallax) * DEG;
      const pitch = pointer.y * 1.2 * out.parallax * DEG;
      _off.applyAxisAngle(THREE.Object3D.DEFAULT_UP, -yaw);
      _off.y += _off.length() * Math.sin(pitch);
      camera.position.copy(_tgt).add(_off);
      if (out.shake > 0) {
        const s = out.shake;
        camera.position.x += Math.sin(t * 47.3) * s * 0.6 + Math.sin(t * 91.1) * s * 0.3;
        camera.position.y += Math.sin(t * 53.7) * s * 0.5;
        _tgt.x += Math.sin(t * 39.1) * s * 0.4;
      }
      camera.lookAt(_tgt);
      // keep the horizontal field of view on portrait screens so the car still fits
      let fov = out.fov;
      if (aspect < 1.25) fov = Math.min(78, (2 * Math.atan(Math.tan((fov * DEG) / 2) * (1.25 / aspect))) / DEG);
      camera.fov = fov;
    } else {
      camera.fov = aspect < 1.25 ? 42 : 32;
    }

    // screen-space framing: shift the car away from the text side (x on landscape, y on portrait)
    const sx = aspect >= 1 ? out.shiftX : 0;
    const sy = aspect < 1 ? out.shiftY : out.shiftY * 0.35;
    if (Math.abs(sx) > 1e-4 || Math.abs(sy) > 1e-4) {
      camera.setViewOffset(size.width, size.height, sx * size.width, sy * size.height, size.width, size.height);
    } else if (camera.view && camera.view.enabled) {
      camera.clearViewOffset();
    } else {
      camera.updateProjectionMatrix();
    }
  }, -1);

  return null;
}
