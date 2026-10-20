import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture, MeshReflectorMaterial } from '@react-three/drei';
import { out } from './director';
import { useUI } from '../store/ui';

/** The arena floor: dark asphalt with low-res wet reflections on capable desktops, plain material otherwise. */
export default function Arena() {
  const perfLow = useUI((s) => s.perfLow || s.lite);
  const ground = useRef();
  const asphalt = useTexture('/textures/asphalt-dark.jpg');

  useMemo(() => {
    asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping;
    asphalt.repeat.set(36, 36);
    asphalt.colorSpace = THREE.SRGBColorSpace;
    asphalt.anisotropy = 4;
  }, [asphalt]);

  useFrame(() => {
    if (ground.current) ground.current.visible = out.arena > 0.01;
  });

  return (
    <mesh ref={ground} rotation-x={-Math.PI / 2} position-y={0} renderOrder={0}>
      <planeGeometry args={[220, 220]} />
      {perfLow ? (
        <meshStandardMaterial map={asphalt} color="#7d7f86" roughness={1} metalness={0} envMapIntensity={0.25} />
      ) : (
        <MeshReflectorMaterial
          map={asphalt}
          color="#2c2d31"
          resolution={512}
          blur={[200, 70]}
          mixBlur={0.55}
          mixStrength={1.3}
          envMapIntensity={0.25}
          mixContrast={1.15}
          roughness={1}
          metalness={0}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          mirror={0}
        />
      )}
    </mesh>
  );
}
