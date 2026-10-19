// Repaint the supplied (single-atlas) car to the reveal-night look.
// The body shell, black trim, glass and wheels share one baked texture, so the split happens in the shader:
//   bright texels            → paint (MeshPhysical clearcoat, colour from the configurator)
//   dark texels, above belt  → black tinted glass (glossy)
//   dark texels, below belt  → satin black lower body
//   saturated red texels     → emissive red tail lights (ignite with the light bar)
//   inside the wheel cylinders, non-paint texels → graphite / forged-silver rims, matte tyres, caliper sector
//   thin band on the nose    → cool-white front light strip
import * as THREE from 'three';
import { GEO } from './carMap';

export const LED_RED = new THREE.Color('#FF2A2A');

export function makeBodyMaterial(atlas, nodeMatrix) {
  const uniforms = {
    uNode: { value: nodeMatrix.clone() },
    uPaint: { value: new THREE.Color('#EEF0F2') },
    uPaintMetal: { value: 0.2 },
    uPaintRough: { value: 0.25 },
    uDark: { value: new THREE.Color('#0B0B0C') },
    uRim: { value: new THREE.Color('#2B2E33') },
    uRimMetal: { value: 0.6 },
    uRimRough: { value: 0.4 },
    uCaliper: { value: new THREE.Color('#E0201F') },
    uRed: { value: LED_RED.clone().multiplyScalar(2.5) },
    uBar: { value: 1 },
    uFront: { value: 1 },
  };
  const m = new THREE.MeshPhysicalMaterial({
    map: atlas,
    metalness: 0.2,
    roughness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    side: THREE.DoubleSide,
  });
  m.userData.uniforms = uniforms;
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 uNode;\nvarying vec3 vCarPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCarPos = (uNode * vec4(position, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vCarPos;
uniform vec3 uPaint, uDark, uRim, uCaliper, uRed;
uniform float uPaintMetal, uPaintRough, uRimMetal, uRimRough, uBar, uFront;
float wheelDist(vec2 p, vec2 c) { return length(p - c); }`
      )
      .replace(
        '#include <map_fragment>',
        `vec3 tx = texture2D(map, vMapUv).rgb;
float lum = dot(tx, vec3(0.2126, 0.7152, 0.0722));
float mxc = max(tx.r, max(tx.g, tx.b));
float mnc = min(tx.r, min(tx.g, tx.b));
float sat = (mxc - mnc) / max(mxc, 1e-4);
float redM = smoothstep(0.45, 0.7, sat) * step(tx.g * 1.8, tx.r) * smoothstep(0.03, 0.1, tx.r);
float paintM = smoothstep(0.26, 0.5, lum) * (1.0 - redM);
// wheels: geometric cylinders on the car's sides, only where the atlas is not body paint
float dF = wheelDist(vCarPos.xy, vec2(${GEO.frontAxleX.toFixed(2)}, ${GEO.wheelCY.toFixed(2)}));
float dR = wheelDist(vCarPos.xy, vec2(${GEO.rearAxleX.toFixed(2)}, ${GEO.wheelCY.toFixed(2)}));
float dW = min(dF, dR);
float sideM = smoothstep(${(GEO.sideBand - 1.0).toFixed(2)}, ${GEO.sideBand.toFixed(2)}, abs(vCarPos.z - ${GEO.centerZ.toFixed(2)}));
float wheelM = sideM * (1.0 - smoothstep(${(GEO.wheelR - 0.3).toFixed(2)}, ${GEO.wheelR.toFixed(2)}, dW)) * (1.0 - paintM);
float rimM = wheelM * smoothstep(0.01, 0.045, lum) * (1.0 - smoothstep(${(GEO.rimR - 0.3).toFixed(2)}, ${GEO.rimR.toFixed(2)}, dW));
float tyreM = wheelM * (1.0 - rimM);
vec2 wc = dF < dR ? vec2(${GEO.frontAxleX.toFixed(2)}, ${GEO.wheelCY.toFixed(2)}) : vec2(${GEO.rearAxleX.toFixed(2)}, ${GEO.wheelCY.toFixed(2)});
vec2 wd = vCarPos.xy - wc;
float inward = dF < dR ? 1.0 : -1.0;
float ang = atan(wd.y, wd.x * inward);
float calM = wheelM * smoothstep(1.9, 2.2, dW) * (1.0 - smoothstep(3.2, 3.5, dW))
  * smoothstep(0.25, 0.4, ang) * (1.0 - smoothstep(1.25, 1.4, ang)) * (1.0 - smoothstep(0.002, 0.012, lum));
float glassM = (1.0 - paintM) * (1.0 - wheelM) * (1.0 - redM) * smoothstep(${(GEO.beltY - 0.6).toFixed(2)}, ${GEO.beltY.toFixed(2)}, vCarPos.y);
float frontM = step(vCarPos.x, ${GEO.noseX.toFixed(2)}) * smoothstep(5.15, 5.3, vCarPos.y) * (1.0 - smoothstep(5.65, 5.8, vCarPos.y));
float shade = mix(0.72, 1.0, smoothstep(0.3, 0.75, lum));
vec3 col = uDark * (0.85 + 1.5 * lum);
col = mix(col, vec3(0.012), glassM);
col = mix(col, uPaint * shade, paintM);
col = mix(col, vec3(0.022), tyreM);
col = mix(col, uRim * (0.75 + 0.6 * lum), rimM);
col = mix(col, uCaliper, calM);
col = mix(col, vec3(0.35, 0.02, 0.02), redM);
diffuseColor.rgb = col;`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `float roughnessFactor = 0.45;
roughnessFactor = mix(roughnessFactor, 0.05, glassM);
roughnessFactor = mix(roughnessFactor, uPaintRough, paintM);
roughnessFactor = mix(roughnessFactor, 0.85, tyreM);
roughnessFactor = mix(roughnessFactor, uRimRough, rimM);
roughnessFactor = mix(roughnessFactor, 0.35, calM);`
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `float metalnessFactor = 0.2;
metalnessFactor = mix(metalnessFactor, 0.0, glassM);
metalnessFactor = mix(metalnessFactor, uPaintMetal, paintM);
metalnessFactor = mix(metalnessFactor, 0.0, tyreM);
metalnessFactor = mix(metalnessFactor, uRimMetal, rimM);`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `totalEmissiveRadiance += uRed * redM * uBar + vec3(1.6, 1.75, 2.0) * frontM * uFront;`
      )
      .replace(
        '#include <lights_physical_fragment>',
        THREE.ShaderChunk.lights_physical_fragment.replace(
          'material.clearcoat = clearcoat;',
          'material.clearcoat = clearcoat * clamp(paintM + glassM, 0.0, 1.0);'
        )
      );
  };
  m.customProgramCacheKey = () => 'roadster-body-v1';
  return m;
}

/** Rear light bar: emissive where its texture is red; ignites from the centre outward with uBar. */
export function makeLightBarMaterial(tex, nodeMatrix) {
  const uniforms = {
    uNode: { value: nodeMatrix.clone() },
    uBar: { value: 1 },
    uRed: { value: LED_RED.clone().multiplyScalar(2.5) },
  };
  const m = new THREE.MeshStandardMaterial({ map: tex, color: '#0b0b0c', roughness: 0.3, metalness: 0.1, side: THREE.DoubleSide });
  m.userData.uniforms = uniforms;
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 uNode;\nvarying vec3 vCarPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCarPos = (uNode * vec4(position, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCarPos;\nuniform float uBar;\nuniform vec3 uRed;')
      .replace(
        '#include <map_fragment>',
        `vec3 tx = texture2D(map, vMapUv).rgb;
float barM = smoothstep(0.2, 0.4, tx.r - tx.g);
float reach = uBar * ${(GEO.lightBarHalf + 0.6).toFixed(2)};
float lit = 1.0 - smoothstep(reach - 0.6, reach, abs(vCarPos.z - ${GEO.centerZ.toFixed(2)}));
diffuseColor.rgb = mix(vec3(0.02), vec3(0.3, 0.01, 0.01), barM);`
      )
      .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance += uRed * barM * lit;');
  };
  m.customProgramCacheKey = () => 'roadster-lightbar-v1';
  return m;
}

export function makeSatinBlack() {
  return new THREE.MeshStandardMaterial({ color: '#0B0B0C', roughness: 0.45, metalness: 0.25, side: THREE.DoubleSide });
}
