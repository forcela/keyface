import { Ctx, SCREEN_SIZE as S, TAU, drawMistBand, mod, rgba, seeded } from './canvas.utils';

export type Ambiance = 'dawn' | 'night' | 'mist';

interface SceneryPalette {
  sky: [string, string, string];
  hills: [string, string, string];
  sun: string;
  stars: boolean;
}

export const AMBIANCES: Record<Ambiance, SceneryPalette> = {
  dawn: {
    sky: ['#26305c', '#7d6a9e', '#efb79a'],
    hills: ['#8a6f97', '#5a4a7a', '#2e2849'],
    sun: '#ffe1b8',
    stars: false,
  },
  night: {
    sky: ['#050a1c', '#101d44', '#2a3b70'],
    hills: ['#22315e', '#162248', '#0b1229'],
    sun: '#e9eeff',
    stars: true,
  },
  mist: {
    sky: ['#24302e', '#5f7a71', '#c3d2c3'],
    hills: ['#5b776c', '#3e544c', '#25332e'],
    sun: '#f6f3e6',
    stars: false,
  },
};

export const AMBIANCE_LABELS: Record<Ambiance, string> = { dawn: 'Aube', night: 'Nuit', mist: 'Brume' };

export const AMBIANCES_LIST = Object.keys(AMBIANCES) as Ambiance[];

function hill(c: Ctx, base: number, amp: number, freq: number, phase: number, t: number, color: string): void {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, S);
  for (let x = 0; x <= S; x += 2) {
    const y =
      base +
      amp * Math.sin(x * freq + phase) +
      amp * 0.45 * Math.sin(x * freq * 2.3 + phase * 1.7) +
      1.2 * Math.sin(TAU * t + x * 0.045);
    c.lineTo(x, y);
  }
  c.lineTo(S, S);
  c.closePath();
  c.fill();
}

/** Sky, sun, drifting mist and layered hills. Text-free, so it can sit behind any layout. */
export function drawScenery(c: Ctx, t: number, ambiance: Ambiance): void {
  const p = AMBIANCES[ambiance];
  const sky = c.createLinearGradient(0, 0, 0, 100);
  sky.addColorStop(0, p.sky[0]);
  sky.addColorStop(0.55, p.sky[1]);
  sky.addColorStop(1, p.sky[2]);
  c.fillStyle = sky;
  c.fillRect(0, 0, S, S);

  if (p.stars) {
    for (let i = 0; i < 28; i++) {
      const a = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(TAU * (t * (1 + (i % 2)) + seeded(i + 5))));
      c.fillStyle = `rgba(255,255,255,${(a * 0.8).toFixed(2)})`;
      c.fillRect(Math.floor(seeded(i) * S), Math.floor(seeded(i + 70) * 70), 1, 1);
    }
  }

  const glow = c.createRadialGradient(94, 82, 0, 94, 82, 46);
  glow.addColorStop(0, rgba(p.sun, 0.5));
  glow.addColorStop(1, rgba(p.sun, 0));
  c.fillStyle = glow;
  c.fillRect(0, 0, S, S);
  c.fillStyle = rgba(p.sun, 0.95);
  c.beginPath();
  c.arc(94, 82, 8, 0, TAU);
  c.fill();

  // Each band travels its full span once per loop, so the loop has no jump.
  for (let i = 0; i < 3; i++) {
    const span = S + 80;
    const cx = mod(seeded(i + 11) * span + (i % 2 ? 1 : -1) * t * span, span) - 40;
    drawMistBand(c, cx, 50 + i * 11, 34 + i * 6, '#ffffff', 0.13);
  }

  hill(c, 88, 5, 0.045, 1.0, t, p.hills[0]);
  hill(c, 99, 6, 0.06, 2.6, t, p.hills[1]);
  hill(c, 111, 4, 0.05, 4.2, t, p.hills[2]);

  const shade = c.createLinearGradient(0, 0, 0, 72);
  shade.addColorStop(0, 'rgba(0,0,0,.22)');
  shade.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = shade;
  c.fillRect(0, 0, S, 72);
}
