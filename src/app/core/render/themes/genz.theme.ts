import { Ctx, SCREEN_SIZE as S, TAU, roundRect, rgba, seeded } from '../canvas.utils';
import { drawGrid, drawSparkle } from '../effects';
import { DecodedImage, frameAt } from '../frame.model';
import { MASCOTS, MascotKind } from '../sprites/mascots';
import { GENZ_PALETTES, GenzColors, GenzPalette } from './genz.constants';
import { drawBatterySticker, drawSpeechBubble, drawTimeSticker } from './genz-stickers';
import { ThemeDefinition } from './theme.model';

export interface GenzOptions {
  mascot: MascotKind;
  palette: GenzPalette;
  bubble: string;
  /** Replaces the mascot when set. */
  image: DecodedImage | null;
  /** What the typing cat taps: random keys, or the letters of `typed`. */
  keys: 'random' | 'text';
  typed: string;
}

export const GENZ_DEFAULTS: GenzOptions = {
  mascot: 'typing',
  palette: 'ink',
  bubble: 'chill',
  image: null,
  keys: 'random',
  typed: 'salut',
};

function drawBackdrop(c: Ctx, t: number, p: GenzColors): void {
  c.fillStyle = p.background;
  c.fillRect(0, 0, S, S);
  drawGrid(c, t, p.accent, p.light ? 0.1 : 0.07);
  const vignette = c.createRadialGradient(64, 64, 30, 64, 64, 96);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, `rgba(0,0,0,${p.light ? 0.1 : 0.55})`);
  c.fillStyle = vignette;
  c.fillRect(0, 0, S, S);
  for (let i = 0; i < 6; i++) {
    const a = Math.max(0, Math.sin(TAU * (t * (1 + Math.floor(seeded(i + 3) * 2)) + seeded(i + 8))));
    if (a < 0.15) continue;
    drawSparkle(c, Math.round(10 + seeded(i) * 104), Math.round(34 + seeded(i + 40) * 60), rgba(p.accent, +a.toFixed(2)));
  }
}

function drawImageSticker(c: Ctx, image: DecodedImage, t: number, p: GenzColors): void {
  const frame = frameAt(image, t);
  const size = 70;
  c.save();
  c.translate(64, 64);
  c.rotate((-3 * Math.PI) / 180);
  c.fillStyle = 'rgba(0,0,0,.35)';
  roundRect(c, -size / 2 - 1, -size / 2 + 1, size + 6, size + 6, 8);
  c.fill();
  c.fillStyle = p.card;
  roundRect(c, -size / 2 - 3, -size / 2 - 3, size + 6, size + 6, 8);
  c.fill();
  c.strokeStyle = p.accent;
  c.lineWidth = 1;
  roundRect(c, -size / 2 - 2.5, -size / 2 - 2.5, size + 5, size + 5, 7.5);
  c.stroke();
  roundRect(c, -size / 2, -size / 2, size, size, 5);
  c.clip();
  const scale = Math.max(size / frame.width, size / frame.height);
  c.drawImage(frame, (-frame.width * scale) / 2, (-frame.height * scale) / 2, frame.width * scale, frame.height * scale);
  c.restore();
}

export const genzTheme: ThemeDefinition<GenzOptions> = {
  id: 'genz',
  name: 'Gen Z',
  description: '5 persos ou ton GIF',
  defaults: { frames: 24, delay: 100 },
  draw(c, frame, o) {
    const p = GENZ_PALETTES[o.palette];
    drawBackdrop(c, frame.t, p);
    if (o.image) {
      drawImageSticker(c, o.image, frame.t, p);
    } else {
      c.fillStyle = p.disc;
      c.beginPath();
      c.arc(64, 68, 38, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(p.accent, 0.5);
      c.lineWidth = 1;
      c.beginPath();
      c.arc(64, 68, 38.5, 0, TAU);
      c.stroke();
      MASCOTS[o.mascot](c, frame.t, p.accent, o.keys === 'text' ? o.typed : undefined);
    }
    if (o.bubble) drawSpeechBubble(c, o.bubble, p);
    if (frame.showClock) drawTimeSticker(c, frame.clock.time, p);
    if (frame.showBattery) drawBatterySticker(c, frame.battery, p);
  },
};
