import { layerDefaults, newLayerId } from '@core/render/layers/layer-factory';
import { LAYER_TYPE_LABELS, Layer, LayerType } from '@core/render/layers/layer.model';
import { SCREEN_SIZE } from '@core/render/canvas.utils';
import { BATTERY_STYLE_LABELS } from '@core/render/battery-widget';
import { EFFECT_LABELS } from '@core/render/effects';
import { AMBIANCE_LABELS } from '@core/render/scenery';
import { MASCOT_LABELS } from '@core/render/sprites/mascots';

export const STYLE_FILE_APP = 'keyface';
export const STYLE_FILE_VERSION = 1;

export interface StyleFile {
  app: typeof STYLE_FILE_APP;
  version: number;
  width: number;
  height: number;
  frames: number;
  delay: number;
  layers: Layer[];
}

export interface ParsedStyle {
  layers: Layer[];
  frames?: number;
  delay?: number;
}

export class StyleFileError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isLayerType = (value: unknown): value is LayerType =>
  typeof value === 'string' && value in LAYER_TYPE_LABELS;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Fields limited to a fixed set of values; anything else falls back to the default. */
const ALLOWED: Record<string, readonly unknown[]> = {
  mode: ['solid', 'gradient', 'halo', 'scenery'],
  ambiance: Object.keys(AMBIANCE_LABELS),
  kind: Object.keys(EFFECT_LABELS),
  format: ['short', 'long', 'numeric'],
  style: Object.keys(BATTERY_STYLE_LABELS),
  shape: ['rect', 'circle'],
  mascot: Object.keys(MASCOT_LABELS),
  font: ['inter', 'geist', 'mono'],
  weight: [400, 600, 700],
  scale: [0.5, 1],
  animation: ['none', 'float', 'pulse', 'blink', 'sway', 'spin'],
};

function acceptField(type: LayerType, key: string, value: unknown, fallback: unknown): boolean {
  if (key === 'src') return value === null || (typeof value === 'string' && value.startsWith('data:image/'));
  if (key === 'scale' && type === 'battery') return typeof value === 'number' && value >= 0.5 && value <= 2.5;
  if (key in ALLOWED) return ALLOWED[key].includes(value);
  return typeof value === typeof fallback;
}

export function serializeStyle(layers: readonly Layer[], frames: number, delay: number): string {
  const file: StyleFile = {
    app: STYLE_FILE_APP,
    version: STYLE_FILE_VERSION,
    width: SCREEN_SIZE,
    height: SCREEN_SIZE,
    frames,
    delay,
    layers: [...layers],
  };
  return JSON.stringify(file, null, 2);
}

/**
 * Rebuilds layers from untrusted data: unknown types are dropped, missing fields take their
 * defaults, ids are reassigned, and a background is guaranteed at the back.
 */
export function restoreLayers(raw: unknown): Layer[] {
  if (!Array.isArray(raw)) throw new StyleFileError('Le fichier ne contient pas de calques.');
  const layers = raw
    .filter(isRecord)
    .filter((item) => isLayerType(item['type']))
    .map((item) => {
      const type = item['type'] as LayerType;
      const defaults = layerDefaults(type) as unknown as Record<string, unknown>;
      const known = Object.fromEntries(
        Object.entries(item).filter(([key, value]) => key in defaults && acceptField(type, key, value, defaults[key])),
      );
      return { ...defaults, ...known, type, id: newLayerId() } as Layer;
    });
  if (layers[0]?.type !== 'background') {
    layers.unshift({ ...layerDefaults('background'), id: newLayerId() });
  }
  return layers;
}

export function parseStyle(json: string): ParsedStyle {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new StyleFileError("Ce fichier n'est pas un style Keyface.");
  }
  if (!isRecord(data) || data['app'] !== STYLE_FILE_APP) {
    throw new StyleFileError("Ce fichier n'est pas un style Keyface.");
  }
  const frames = typeof data['frames'] === 'number' ? clamp(Math.round(data['frames']), 8, 140) : undefined;
  const delay = typeof data['delay'] === 'number' ? clamp(Math.round(data['delay']), 20, 300) : undefined;
  return { layers: restoreLayers(data['layers']), frames, delay };
}
