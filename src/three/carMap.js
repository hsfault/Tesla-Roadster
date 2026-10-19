// Output of `npx gltf-transform inspect public/models/roadster.source.glb` + a geometry probe (meshopt-decoded).
// Source asset: "Tesla Roadster 2.0" by Michael (sketchfab.com/gmmichaelonearth), CC-BY-4.0, already optimised
// with glTF-Transform (EXT_meshopt_compression, KHR_mesh_quantization, EXT_texture_webp 2048²). 1.8 MB.

export const MODEL_URL = '/models/roadster.glb';

// node name → mesh name → material name → role
export const CAR_MAP = {
  body: {
    node: 'Object_2',
    mesh: 'Object_0',
    material: '26_10_18_21_33_26_302_0',
    role: 'Body shell + lower body + glass + wheels/tyres + tail lights — ONE mesh, ONE baked-atlas material (135,406 verts)',
  },
  lightBar: {
    node: 'Object_8',
    mesh: 'Object_6',
    material: '26_10_18_21_33_26_302_1',
    role: 'Rear full-width light bar (red band in its texture) → emissive LED red',
  },
  rearFascia: {
    node: 'Object_9',
    mesh: 'Object_7',
    material: '26_10_18_21_33_26_302_2',
    role: 'Rear fascia / diffuser panel → satin black',
  },
  plate: {
    node: 'Object_11',
    mesh: 'Object_9',
    material: '26_10_18_21_33_26_302_3',
    role: 'Rear plate ("RDSTR") → kept as textured',
  },
  plateHolder: {
    node: 'Object_12',
    mesh: 'Object_10',
    material: '26_10_18_21_33_26_302_4',
    role: 'Plate holder → satin black',
  },
};

// Model-space measurements (glTF scene units, Y up). The car's length runs along X: front at −X, rear at +X.
export const GEO = {
  minX: -33.21,
  maxX: 33.37,
  height: 18.05,
  centerX: 0.08,
  centerZ: 35.85,
  halfWidth: 14.4,
  frontAxleX: -21.0,
  rearAxleX: 25.2,
  wheelCY: 5.7,
  wheelR: 6.2, // generous; the shader only recolours non-paint texels inside it
  rimR: 4.4,
  sideBand: 9.0, // |z − centerZ| beyond this is the wheel face side
  beltY: 11.8, // above: canopy glass, below: lower body
  noseX: -32.3, // front light strip band lives on the nose surface in front of this
  lightBarHalf: 12.6,
};

export const CAR_LENGTH_M = 4.4;
export const CAR_SCALE = CAR_LENGTH_M / (GEO.maxX - GEO.minX);

// Not present in this model (reported in the README / final report):
export const MISSING = {
  doors: 'No separate door nodes — butterfly-door animation skipped.',
  interior: 'No separate interior materials — interior colour step skipped.',
  calipers: 'No caliper geometry — calipers are a shader mask inside the wheel (visible between spokes).',
  wheels: 'Wheels are part of the body mesh — no wheel spin; rims recoloured by a geometric mask.',
};
