import { Layer, LayerOf, LayerType, TextLook } from './layer.model';

const TEXT: TextLook = { font: 'inter', weight: 600, size: 14, color: '#ffffff', shadow: false, uppercase: false };
const PLACED = { visible: true, x: 64, y: 64, opacity: 1, animation: 'none' } as const;

type LayerDefaults = { [T in LayerType]: Omit<LayerOf<T>, 'id'> };

const DEFAULTS: LayerDefaults = {
  background: { type: 'background', visible: true, mode: 'solid', color: '#000000', color2: '#3a6bff', ambiance: 'dawn' },
  effect: { type: 'effect', visible: true, kind: 'stars', color: '#ffffff', count: 24 },
  time: { type: 'time', ...PLACED, ...TEXT, y: 58, size: 38 },
  date: { type: 'date', ...PLACED, ...TEXT, y: 30, size: 11, weight: 400, color: '#c8c8cc', format: 'short' },
  text: { type: 'text', ...PLACED, ...TEXT, text: 'Salut' },
  battery: { type: 'battery', ...PLACED, y: 104, style: 'pill', color: '#ffffff', scale: 1 },
  shape: {
    type: 'shape',
    ...PLACED,
    shape: 'rect',
    fill: '#3a6bff',
    width: 60,
    height: 30,
    radius: 8,
    strokeWidth: 0,
    stroke: '#ffffff',
  },
  image: { type: 'image', ...PLACED, src: null, width: 64, height: 64, radius: 8, strokeWidth: 0, stroke: '#ffffff' },
  mascot: { type: 'mascot', ...PLACED, mascot: 'typing', accent: '#ece7dc', scale: 1 },
};

let nextId = 1;

/** Ids only need to be unique within the running page. */
export function newLayerId(): number {
  return nextId++;
}

export function createLayer<T extends LayerType>(type: T, overrides: Partial<LayerOf<T>> = {}): LayerOf<T> {
  return { ...structuredClone(DEFAULTS[type]), ...overrides, id: newLayerId() } as unknown as LayerOf<T>;
}

/** Defaults for a type, used to fill fields missing from an older or hand-written style file. */
export function layerDefaults<T extends LayerType>(type: T): Omit<LayerOf<T>, 'id'> {
  return structuredClone(DEFAULTS[type]);
}

export type TemplateId = 'blank' | 'minimal' | 'landscape' | 'genz';

export const TEMPLATE_LABELS: Record<TemplateId, string> = {
  blank: 'Vide',
  minimal: 'Minimal',
  landscape: 'Paysage',
  genz: 'Gen Z',
};

export const TEMPLATES: Record<TemplateId, () => Layer[]> = {
  blank: () => [createLayer('background'), createLayer('time', { y: 64 })],
  minimal: () => [
    createLayer('background'),
    createLayer('date', { y: 36, color: '#8c8c90' }),
    createLayer('time', { y: 62, size: 40 }),
    createLayer('battery', { y: 100, style: 'icon' }),
  ],
  landscape: () => [
    createLayer('background', { mode: 'scenery' }),
    createLayer('date', { y: 26, color: '#ffffff', shadow: true }),
    createLayer('time', { y: 52, shadow: true }),
    createLayer('battery', { y: 113 }),
  ],
  genz: () => [
    createLayer('background', { color: '#111214' }),
    createLayer('effect', { kind: 'grid', color: '#ece7dc' }),
    createLayer('effect', { kind: 'sparkles', color: '#ece7dc', count: 6 }),
    createLayer('time', { y: 14, font: 'mono', weight: 700, size: 12, color: '#ece7dc' }),
    createLayer('mascot', { y: 62 }),
    createLayer('text', {
      y: 112,
      text: 'chill',
      font: 'mono',
      weight: 700,
      size: 12,
      color: '#ece7dc',
      uppercase: true,
      animation: 'blink',
    }),
  ],
};

/** First-run design: the landscape template with a small sleeping cat on the hill. */
export function starterLayers(): Layer[] {
  return [...TEMPLATES.landscape(), createLayer('mascot', { x: 106, y: 94, scale: 0.5, mascot: 'sleeping', accent: '#ffffff' })];
}
