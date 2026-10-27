/** Pure 2D-canvas helpers shared by every renderer. No Angular, no DOM besides the context. */

export const TAU = Math.PI * 2;

/** Side of the AK820 Pro TFT screen, in pixels. */
export const SCREEN_SIZE = 128;

export type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** Deterministic pseudo-random number in [0, 1) for a seed. Keeps animations identical frame to frame. */
export function seeded(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Modulo that stays positive for negative values. */
export function mod(value: number, m: number): number {
  return ((value % m) + m) % m;
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** `#rrggbb` + alpha → `rgba(...)`. */
export function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function roundRect(c: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}

export interface TextStyle {
  font: string;
  color: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  letterSpacing?: string;
}

export function drawText(c: Ctx, text: string, x: number, y: number, style: TextStyle): void {
  c.font = style.font;
  c.textAlign = style.align ?? 'center';
  c.textBaseline = style.baseline ?? 'alphabetic';
  c.fillStyle = style.color;
  c.letterSpacing = style.letterSpacing ?? '0px';
  c.fillText(text, x, y);
  c.letterSpacing = '0px';
}

export function textWidth(c: Ctx, text: string, font: string): number {
  c.font = font;
  return c.measureText(text).width;
}

export interface BatteryIconStyle {
  width: number;
  height: number;
  frame: string;
  fill: string;
}

/** Rounded battery glyph. Turns red at 20 % and below. */
export function drawBatteryIcon(c: Ctx, x: number, y: number, level: number, s: BatteryIconStyle): void {
  const { width: w, height: h } = s;
  c.lineWidth = 1;
  c.strokeStyle = s.frame;
  roundRect(c, x + 0.5, y + 0.5, w - 1, h - 1, h * 0.32);
  c.stroke();
  c.fillStyle = s.frame;
  roundRect(c, x + w + 0.5, y + h * 0.32, 1.5, h * 0.36, 1);
  c.fill();
  c.fillStyle = level <= 20 ? '#ff453a' : s.fill;
  roundRect(c, x + 2, y + 2, Math.max(1.5, ((w - 4) * level) / 100), h - 4, h * 0.18);
  c.fill();
}

/** Soft ellipse of light, used for mist and halos. */
export function drawMistBand(c: Ctx, cx: number, cy: number, radius: number, color: string, alpha: number): void {
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(1, rgba(color, 0));
  c.save();
  c.translate(0, cy);
  c.scale(1, 0.28);
  c.translate(0, -cy);
  c.fillStyle = g;
  c.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  c.restore();
}
