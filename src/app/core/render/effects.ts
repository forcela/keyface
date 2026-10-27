import { Ctx, SCREEN_SIZE as S, TAU, drawMistBand, mod, rgba, seeded } from './canvas.utils';

export type EffectKind = 'stars' | 'snow' | 'sparkles' | 'grid' | 'mist';

export const EFFECT_LABELS: Record<EffectKind, string> = {
  stars: 'Étoiles',
  snow: 'Neige',
  sparkles: 'Étincelles',
  grid: 'Grille',
  mist: 'Brume',
};

/** Effects that ignore the particle count. */
export const COUNTLESS_EFFECTS: readonly EffectKind[] = ['grid', 'mist'];

/** Twinkle factor in [0, 1], whole cycles per loop. */
const twinkle = (i: number, t: number) => 0.5 + 0.5 * Math.sin(TAU * (t * (1 + (i % 2)) + seeded(i + 5)));

export function drawSparkle(c: Ctx, x: number, y: number, color: string): void {
  c.fillStyle = color;
  c.fillRect(x - 2, y, 6, 2);
  c.fillRect(x, y - 2, 2, 6);
}

export function drawGrid(c: Ctx, t: number, color: string, alpha: number): void {
  c.fillStyle = rgba(color, alpha);
  for (let y = -16 + t * 16; y < S; y += 16) {
    const row = Math.round(y);
    if (row >= 0) c.fillRect(0, row, S, 1);
  }
  for (let x = 0; x < S; x += 16) c.fillRect(x, 0, 1, S);
}

export function drawEffect(c: Ctx, t: number, kind: EffectKind, color: string, count: number): void {
  switch (kind) {
    case 'stars':
      for (let i = 0; i < count; i++) {
        c.fillStyle = rgba(color, +(twinkle(i, t) * 0.9).toFixed(2));
        c.fillRect(Math.floor(seeded(i) * S), Math.floor(seeded(i + 70) * S), 1, 1);
      }
      break;
    case 'snow':
      for (let i = 0; i < count; i++) {
        const speed = 1 + (i % 2);
        // The fall length is the wrap length (S + 8), so each flake lands exactly where it started.
        const y = mod((seeded(i + 3) + t * speed) * (S + 8), S + 8) - 4;
        const x = mod(seeded(i) * S + Math.sin(TAU * (t * speed + seeded(i + 9))) * 4, S);
        const size = i % 3 ? 1 : 2;
        c.fillStyle = rgba(color, +(0.45 + seeded(i + 2) * 0.5).toFixed(2));
        c.fillRect(Math.round(x), Math.round(y), size, size);
      }
      break;
    case 'sparkles':
      for (let i = 0; i < count; i++) {
        const a = Math.max(0, Math.sin(TAU * (t * (1 + (i % 2)) + seeded(i + 8))));
        if (a < 0.15) continue;
        drawSparkle(c, Math.round(6 + seeded(i) * 116), Math.round(6 + seeded(i + 40) * 116), rgba(color, +a.toFixed(2)));
      }
      break;
    case 'grid':
      drawGrid(c, t, color, 0.09);
      break;
    case 'mist':
      for (let i = 0; i < 3; i++) {
        const span = S + 80;
        const cx = mod(seeded(i + 11) * span + (i % 2 ? 1 : -1) * t * span, span) - 40;
        drawMistBand(c, cx, 40 + i * 20, 36 + i * 6, color, 0.16);
      }
      break;
  }
}
