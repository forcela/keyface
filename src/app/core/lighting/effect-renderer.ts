import { Ctx, TAU, roundRect, seeded } from '@core/render/canvas.utils';
import { LAYOUT_HEIGHT, LAYOUT_WIDTH, PREVIEW_KEYS, PreviewKey } from './keyboard-layout';
import { LightEffectKind, LightingSettings } from './lighting.model';

/** Colour of one key at one moment, 0 to 255 per channel. `null` means dark. */
type Rgb = readonly [number, number, number];

const GAP = 0.09;
const BRIGHTNESS_SCALE = [0.14, 0.3, 0.45, 0.62, 0.8, 1] as const;

const fract = (v: number) => v - Math.floor(v);
const wrap = (v: number) => fract(v + 0.5) - 0.5;
/** A soft band of width `w` around 0 on a repeating axis. */
const band = (v: number, w = 0.2) => Math.max(0, 1 - Math.abs(wrap(v)) / w);

function hsv(h: number, s = 1, v = 1): Rgb {
  const f = (n: number) => {
    const k = (n + fract(h) * 6) % 6;
    return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
  };
  return [f(5), f(3), f(1)];
}

function parseColor(hexColor: string): Rgb {
  return [1, 3, 5].map((i) => parseInt(hexColor.slice(i, i + 2), 16)) as unknown as Rgb;
}

const scale = (rgb: Rgb, k: number): Rgb => [rgb[0] * k, rgb[1] * k, rgb[2] * k];

/** Distance from the centre of the keyboard, about 0 to 1. */
const fromCentre = (k: PreviewKey) => Math.hypot((k.cx - 0.5) * 1.6, k.cy - 0.5) * 1.1;

/** Position along the chosen direction, 0 to 1. */
function along(k: PreviewKey, direction: number): number {
  if (direction === 0) return k.cx;
  if (direction === 3) return 1 - k.cx;
  if (direction === 2) return k.cy;
  return 1 - k.cy;
}

/** A short flash that restarts at a different moment for each key, as if it had been pressed. */
const keyPress = (k: PreviewKey, phase: number) => (k.seed * 7) % 1 < 0.18 ? Math.max(0, 1 - fract(phase + k.seed) * 3.2) : 0;

/**
 * Colour of a key. Every curve repeats a whole number of times per loop, so the preview has no jump
 * when it starts over. These are approximations of what keyboards do, not exact copies.
 */
function keyColor(kind: LightEffectKind, k: PreviewKey, t: number, base: Rgb, rainbow: boolean, s: LightingSettings): Rgb | null {
  const cycles = 1 + Math.round(s.speed / 2);
  const p = t * cycles;
  const solid = (v: number): Rgb | null => {
    if (v <= 0.02) return null;
    return scale(rainbow ? hsv(k.cx * 0.6 + p) : base, Math.min(1, v));
  };
  const hue = (h: number): Rgb => hsv(h);
  switch (kind) {
    case 'off':
      return null;
    case 'static':
      return solid(1);
    case 'key-on':
      return solid(keyPress(k, p));
    case 'key-off':
      return solid(1 - keyPress(k, p));
    case 'glitter':
      return solid(Math.pow(Math.max(0, Math.sin(TAU * (p + k.seed))), 6));
    case 'falling':
      return solid(band(k.cy - p + k.seed * 0.5, 0.25));
    case 'colourful':
      return hue(k.seed);
    case 'breathe':
      return solid(0.5 + 0.5 * Math.cos(TAU * p));
    case 'spectrum':
      return hue(p);
    case 'outward':
      return solid(band(fromCentre(k) - p, 0.22));
    case 'scroll':
      return solid(band(along(k, s.direction) - p, 0.2));
    case 'roll':
      return hue(along(k, s.direction) - p);
    case 'rotate':
      return hue(Math.atan2(k.cy - 0.5, (k.cx - 0.5) * 1.6) / TAU - p);
    case 'explode':
      return solid(band(fromCentre(k) - fract(p), 0.18) * (1 - fract(p) * 0.6));
    case 'launch':
      return solid(band(1 - k.cy - fract(p + k.seed), 0.2));
    case 'ripple': {
      const pulses = cycles * 2;
      const index = ((Math.floor(t * pulses) % pulses) + pulses) % pulses;
      const ox = seeded(index + 3);
      const oy = seeded(index + 11);
      const d = Math.hypot((k.cx - ox) * 1.6, k.cy - oy);
      return solid(band(d - fract(t * pulses) * 1.2, 0.14));
    }
    case 'flow':
      return hue(along(k, s.direction) * 0.8 - p);
    case 'pulse':
      return solid(0.5 + 0.5 * Math.cos(TAU * (fromCentre(k) * 1.2 - p)));
    case 'tilt':
      return solid(band((k.cx + k.cy) / 2 - p, 0.22));
    case 'shuttle':
      return solid(band(along(k, s.direction) - (0.5 - 0.5 * Math.cos(TAU * p)), 0.16));
  }
}

/**
 * Draws the preview keyboard lit by an effect, fitted into a `width` × `height` canvas.
 * `t` is the position in the loop, from 0 to 1 (exclusive).
 */
export function drawKeyboardLighting(c: Ctx, t: number, kind: LightEffectKind, s: LightingSettings, width: number, height: number): void {
  c.fillStyle = '#0b0b0d';
  c.fillRect(0, 0, width, height);
  const unit = Math.min(width / (LAYOUT_WIDTH + 0.4), height / (LAYOUT_HEIGHT + 0.4));
  const left = (width - unit * LAYOUT_WIDTH) / 2;
  const top = (height - unit * LAYOUT_HEIGHT) / 2;
  const base = parseColor(s.color);
  const bright = BRIGHTNESS_SCALE[Math.max(0, Math.min(5, Math.round(s.brightness)))];
  const radius = Math.max(1, unit * 0.14);

  for (const key of PREVIEW_KEYS) {
    const x = left + (key.x + GAP / 2) * unit;
    const y = top + (key.y + GAP / 2) * unit;
    const w = (key.w - GAP) * unit;
    const h = (1 - GAP) * unit;
    c.fillStyle = '#1a1b20';
    roundRect(c, x, y, w, h, radius);
    c.fill();
    const lit = keyColor(kind, key, t, base, s.rainbow, s);
    if (!lit) continue;
    const [r, g, b] = scale(lit, bright).map(Math.round);
    c.fillStyle = `rgb(${r},${g},${b})`;
    roundRect(c, x + unit * 0.06, y + unit * 0.06, w - unit * 0.12, h - unit * 0.12, radius);
    c.fill();
  }
}
