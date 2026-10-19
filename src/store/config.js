import { create } from 'zustand';
import { VARIANTS, WHEELS, CALIPERS, variantById } from '../data/variants';
import { PAINTS } from '../data/paints';

const DEFAULT = { variant: 'performance', paint: 'white', wheels: 'graphite', calipers: 'red' };

const valid = {
  variant: (v) => VARIANTS.some((x) => x.id === v && x.selectable),
  paint: (v) => PAINTS.some((x) => x.id === v),
  wheels: (v) => WHEELS.some((x) => x.id === v),
  calipers: (v) => CALIPERS.some((x) => x.id === v),
};

export const useConfig = create((set) => ({
  ...DEFAULT,
  setVariant: (variant) => {
    if (!valid.variant(variant)) return;
    set({ variant, calipers: variantById(variant).caliper });
  },
  setPaint: (paint) => valid.paint(paint) && set({ paint }),
  setWheels: (wheels) => valid.wheels(wheels) && set({ wheels }),
  setCalipers: (calipers) => valid.calipers(calipers) && set({ calipers }),
  restore: (cfg) => {
    const next = {};
    for (const k of Object.keys(valid)) if (cfg[k] && valid[k](cfg[k])) next[k] = cfg[k];
    set(next);
  },
}));

const KEYS = { v: 'variant', p: 'paint', w: 'wheels', c: 'calipers' };

/** Build → shareable URL (?v=&p=&w=&c=). */
export function buildUrl(state) {
  const url = new URL(window.location.href);
  url.pathname = '/configure';
  url.search = '';
  for (const [short, key] of Object.entries(KEYS)) url.searchParams.set(short, state[key]);
  return url.toString();
}

/** Restore a build from the current URL, if it carries one. */
export function readBuildFromUrl(search = window.location.search) {
  const params = new URLSearchParams(search);
  const cfg = {};
  for (const [short, key] of Object.entries(KEYS)) if (params.get(short)) cfg[key] = params.get(short);
  return Object.keys(cfg).length ? cfg : null;
}
