import { Ctx, SCREEN_SIZE as S, TAU, drawText, roundRect, textWidth } from '../canvas.utils';
import { formatDate } from '../clock';
import { BENTO_COLORS, BENTO_LOW, BentoColors, BentoPalette } from './bento.constants';
import { ThemeDefinition } from './theme.model';

export interface BentoOptions {
  palette: BentoPalette;
  /** Shown instead of the time when the clock is hidden. */
  label: string;
}

export const BENTO_DEFAULTS: BentoOptions = { palette: 'pastel', label: 'Basil' };

const MARGIN = 8;
const GAP = 6;
const RADIUS = 14;
const TIME_TILE = { x: MARGIN, y: MARGIN, w: S - 2 * MARGIN, h: 60 };
const ROW_Y = MARGIN + TIME_TILE.h + GAP;
const ROW_H = S - MARGIN - ROW_Y;
const HALF_W = (S - 2 * MARGIN - GAP) / 2;
const font = (size: number) => `700 ${size}px Geist`;

function fitSize(c: Ctx, text: string, size: number, min: number, maxWidth: number): number {
  let current = size;
  while (current > min && textWidth(c, text, font(current)) > maxWidth) current--;
  return current;
}

function tile(c: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  c.fillStyle = color;
  roundRect(c, x, y, w, h, RADIUS);
  c.fill();
}

/** Hours and minutes with a colon that hops twice per loop. */
function drawTime(c: Ctx, time: string, ink: string, t: number): void {
  const [hh, mm] = time.split(':');
  const size = fitSize(c, `${hh}:${mm}`, 46, 24, TIME_TILE.w - 16);
  const baseline = TIME_TILE.y + TIME_TILE.h / 2 + Math.round(size * 0.36);
  c.font = font(size);
  const wh = c.measureText(hh).width;
  const wc = c.measureText(':').width;
  const x0 = S / 2 - (wh + wc + c.measureText(mm).width) / 2;
  const hop = Math.round(-2 * Math.max(0, Math.sin(TAU * 2 * t)));
  drawText(c, hh, x0, baseline, { font: font(size), color: ink, align: 'left' });
  drawText(c, ':', x0 + wh, baseline + hop, { font: font(size), color: ink, align: 'left' });
  drawText(c, mm, x0 + wh + wc, baseline, { font: font(size), color: ink, align: 'left' });
}

function drawDate(c: Ctx, date: Date, x: number, w: number, colors: BentoColors): void {
  const [weekday] = formatDate(date, 'short').split(' ');
  tile(c, x, ROW_Y, w, ROW_H, colors.date);
  const cx = x + w / 2;
  drawText(c, weekday.replace('.', '').toUpperCase(), cx, ROW_Y + 17, { font: font(10), color: colors.ink, letterSpacing: '1px' });
  drawText(c, String(date.getDate()), cx, ROW_Y + 40, { font: font(26), color: colors.ink });
}

/** The tile fills up like a glass; its surface ripples one wave per loop. */
function drawBattery(c: Ctx, level: number, x: number, w: number, colors: BentoColors, t: number): void {
  const base = level <= 20 ? BENTO_LOW.base : colors.batteryBase;
  const fill = level <= 20 ? BENTO_LOW.fill : colors.batteryFill;
  tile(c, x, ROW_Y, w, ROW_H, base);
  c.save();
  roundRect(c, x, ROW_Y, w, ROW_H, RADIUS);
  c.clip();
  const surface = ROW_Y + ROW_H - (ROW_H * level) / 100;
  c.fillStyle = fill;
  for (let px = 0; px < w; px += 2) {
    const y = surface + 2 * Math.sin(TAU * (px / w - t));
    c.fillRect(x + px, y, 2, ROW_Y + ROW_H - y);
  }
  c.restore();
  drawText(c, `${level}%`, x + w / 2, ROW_Y + ROW_H / 2 + 5, { font: font(16), color: colors.ink });
}

export const bentoTheme: ThemeDefinition<BentoOptions> = {
  id: 'bento',
  name: 'Bento',
  description: 'Tuiles douces, batterie en verre',
  defaults: { frames: 48, delay: 80 },
  draw(c, frame, o) {
    const colors = BENTO_COLORS[o.palette];
    c.fillStyle = colors.background;
    c.fillRect(0, 0, S, S);
    tile(c, TIME_TILE.x, TIME_TILE.y, TIME_TILE.w, TIME_TILE.h, colors.time);
    if (frame.showClock) {
      drawTime(c, frame.clock.time, colors.ink, frame.t);
    } else {
      const size = fitSize(c, o.label, 40, 16, TIME_TILE.w - 16);
      const baseline = TIME_TILE.y + TIME_TILE.h / 2 + Math.round(size * 0.36);
      drawText(c, o.label, S / 2, baseline, { font: font(size), color: colors.ink });
    }

    const full = S - 2 * MARGIN;
    if (frame.showClock && frame.showBattery) {
      drawDate(c, frame.clock.date, MARGIN, HALF_W, colors);
      drawBattery(c, frame.battery, MARGIN + HALF_W + GAP, HALF_W, colors, frame.t);
    } else if (frame.showClock) {
      drawDate(c, frame.clock.date, MARGIN, full, colors);
    } else if (frame.showBattery) {
      drawBattery(c, frame.battery, MARGIN, full, colors, frame.t);
    }
  },
};
