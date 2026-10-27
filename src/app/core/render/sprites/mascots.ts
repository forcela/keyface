import { Ctx, TAU, drawText, roundRect } from '../canvas.utils';
import { closedCatEyes, drawSprite } from './sprite';
import {
  CAT,
  CAT_COLORS,
  FROG,
  FROG_COLORS,
  GHOST,
  GHOST_COLORS,
  SHADES,
  SHADES_COLORS,
} from './sprites.constants';

export type MascotKind = 'shades' | 'typing' | 'sleeping' | 'ghost' | 'frog';

/**
 * Each mascot draws itself around the point (64, 66) in an ~80 px box.
 * Callers translate/scale the context to place it elsewhere.
 */
type MascotDraw = (c: Ctx, t: number, accent: string) => void;

const PIXEL = 4;

function catTail(c: Ctx, t: number, x: number, y: number): void {
  const bx = x + 12 * PIXEL;
  const by = y + 13 * PIXEL;
  const points: [number, number][] = [];
  for (let j = 1; j <= 12; j++) {
    const q = j / 2;
    const sway = Math.sin(TAU * t * 2 - q * 0.55) * q * 1.2;
    points.push([Math.round((bx + q * 3.2 + sway) / 2) * 2, Math.round((by - q * q * 1.1 - q * 1.5) / 2) * 2]);
  }
  c.fillStyle = CAT_COLORS['k'];
  for (const [px, py] of points) c.fillRect(px - 2, py - 2, PIXEL + 4, PIXEL + 4);
  points.forEach(([px, py], i) => {
    c.fillStyle = i > 8 ? CAT_COLORS['d'] : CAT_COLORS['o'];
    c.fillRect(px, py, PIXEL, PIXEL);
  });
}

/** Sunglasses drop in during the first fifth of the loop, then stay on. */
function droppingShades(c: Ctx, t: number, x: number, y: number): void {
  const p = Math.min(1, t / 0.22);
  const eased = 1 - Math.pow(1 - p, 3);
  drawSprite(c, SHADES, SHADES_COLORS, x, Math.round(y + 6 * PIXEL - (1 - eased) * 44), PIXEL);
}

function groundShadow(c: Ctx, y: number, radius: number): void {
  c.fillStyle = 'rgba(0,0,0,.35)';
  c.beginPath();
  c.ellipse(64, y, radius, 2.5, 0, 0, TAU);
  c.fill();
}

function typingKeyboard(c: Ctx, t: number, accent: string, beat: number): void {
  const kx = 22;
  const ky = 80;
  c.fillStyle = '#000';
  roundRect(c, kx - 1, ky - 1, 86, 20, 4);
  c.fill();
  c.fillStyle = '#3b3f48';
  roundRect(c, kx, ky, 84, 18, 3);
  c.fill();
  const alt = Math.floor(t * 4) % 2;
  const hitLeft = alt ? 2 : 11;
  const hitRight = alt ? 15 : 6;
  for (let i = 0; i < 18; i++) {
    const pressed = (beat === 0 && i === hitLeft) || (beat === 1 && i === hitRight);
    c.fillStyle = pressed ? accent : '#80858f';
    c.fillRect(kx + 4 + (i % 9) * 9, ky + 3 + Math.floor(i / 9) * 7, 7, 5);
  }
  const paw = (px: number, down: boolean) => {
    const py = ky - 5 + (down ? 4 : 0);
    c.fillStyle = '#000';
    c.fillRect(px - 1, py - 1, 12, 8);
    c.fillStyle = CAT_COLORS['w'];
    c.fillRect(px, py, 10, 6);
  };
  paw(40, beat === 0);
  paw(78, beat === 1);
}

export const MASCOTS: Record<MascotKind, MascotDraw> = {
  shades(c, t) {
    const x = 34;
    const y = 32 + Math.round(Math.sin(TAU * t * 2)) * 2;
    catTail(c, t, x, y);
    drawSprite(c, CAT, CAT_COLORS, x, y, PIXEL);
    droppingShades(c, t, x, y);
  },
  typing(c, t, accent) {
    const beat = Math.floor(t * 8) % 2;
    drawSprite(c, CAT, CAT_COLORS, 36, 30 + beat, PIXEL);
    typingKeyboard(c, t, accent, beat);
  },
  sleeping(c, t, accent) {
    const x = 34;
    const y = 32 + Math.round(Math.sin(TAU * t));
    catTail(c, 0, x, y);
    drawSprite(c, CAT, CAT_COLORS, x, y, PIXEL, closedCatEyes);
    for (let i = 0; i < 3; i++) {
      const p = (t + i / 3) % 1;
      c.save();
      c.globalAlpha *= p < 0.15 ? p / 0.15 : p > 0.8 ? (1 - p) / 0.2 : 1;
      const size = Math.round(8 + p * 6);
      drawText(c, 'z', 88 + p * 14, 36 - p * 20, { font: `700 ${size}px "Space Mono"`, color: accent });
      c.restore();
    }
  },
  ghost(c, t) {
    const float = Math.sin(TAU * t);
    const y = 34 + Math.round(float * 3);
    groundShadow(c, 100, 17 - float * 2);
    drawSprite(c, GHOST, GHOST_COLORS, 36, y, PIXEL);
    droppingShades(c, t, 36, y);
  },
  frog(c, t) {
    const hop = Math.max(0, Math.sin(TAU * t * 2));
    groundShadow(c, 99, 20 - hop * 5);
    const blinking = t >= 0.62 && t < 0.7;
    const blink = (ch: string, _col: number, row: number) =>
      (row === 1 || row === 2) && (ch === 'w' || ch === 'e') ? (row === 2 ? 'k' : 'g') : ch;
    drawSprite(c, FROG, FROG_COLORS, 36, 46 - Math.round(hop * 6), PIXEL, blinking ? blink : undefined);
  },
};

export const MASCOT_LABELS: Record<MascotKind, string> = {
  shades: 'Lunettes',
  typing: 'Tape',
  sleeping: 'Dodo',
  ghost: 'Fantôme',
  frog: 'Grenouille',
};
