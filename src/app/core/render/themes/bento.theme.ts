import { Ctx, SCREEN_SIZE as S, TAU, drawText, roundRect, textWidth } from '../canvas.utils';
import { formatDate } from '../clock';
import { ThemeDefinition } from './theme.model';

export interface BentoOptions {
  /** Colour of the time tile. */
  color: string;
  /** Shown instead of the time when the clock is hidden. */
  label: string;
}

export const BENTO_DEFAULTS: BentoOptions = { color: '#ff5c8a', label: 'Basil' };

const BG = '#0e0b1a';
const INK = '#16112b';
const YELLOW = '#ffd23f';
const MINT = { base: '#c9f7e0', fill: '#3ddc97' };
const RED = { base: '#ffd6d3', fill: '#ff453a' };
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
function drawTime(c: Ctx, time: string, t: number): void {
  const [hh, mm] = time.split(':');
  const size = fitSize(c, `${hh}:${mm}`, 46, 24, TIME_TILE.w - 16);
  const baseline = TIME_TILE.y + TIME_TILE.h / 2 + Math.round(size * 0.36);
  c.font = font(size);
  const wh = c.measureText(hh).width;
  const wc = c.measureText(':').width;
  const x0 = S / 2 - (wh + wc + c.measureText(mm).width) / 2;
  const hop = Math.round(-2 * Math.max(0, Math.sin(TAU * 2 * t)));
  drawText(c, hh, x0, baseline, { font: font(size), color: INK, align: 'left' });
  drawText(c, ':', x0 + wh, baseline + hop, { font: font(size), color: INK, align: 'left' });
  drawText(c, mm, x0 + wh + wc, baseline, { font: font(size), color: INK, align: 'left' });
}

function drawDate(c: Ctx, date: Date, x: number, w: number): void {
  const [weekday] = formatDate(date, 'short').split(' ');
  tile(c, x, ROW_Y, w, ROW_H, YELLOW);
  const cx = x + w / 2;
  drawText(c, weekday.replace('.', '').toUpperCase(), cx, ROW_Y + 17, { font: font(10), color: INK, letterSpacing: '1px' });
  drawText(c, String(date.getDate()), cx, ROW_Y + 40, { font: font(26), color: INK });
}

/** The tile fills up like a glass; its surface ripples one wave per loop. */
function drawBattery(c: Ctx, level: number, x: number, w: number, t: number): void {
  const palette = level <= 20 ? RED : MINT;
  tile(c, x, ROW_Y, w, ROW_H, palette.base);
  c.save();
  roundRect(c, x, ROW_Y, w, ROW_H, RADIUS);
  c.clip();
  const surface = ROW_Y + ROW_H - (ROW_H * level) / 100;
  c.fillStyle = palette.fill;
  for (let px = 0; px < w; px += 2) {
    const y = surface + 2 * Math.sin(TAU * (px / w - t));
    c.fillRect(x + px, y, 2, ROW_Y + ROW_H - y);
  }
  c.restore();
  drawText(c, `${level}%`, x + w / 2, ROW_Y + ROW_H / 2 + 5, { font: font(16), color: INK });
}

export const bentoTheme: ThemeDefinition<BentoOptions> = {
  id: 'bento',
  name: 'Bento',
  description: 'Tuiles colorées, batterie en verre',
  defaults: { frames: 48, delay: 80 },
  draw(c, frame, o) {
    c.fillStyle = BG;
    c.fillRect(0, 0, S, S);
    tile(c, TIME_TILE.x, TIME_TILE.y, TIME_TILE.w, TIME_TILE.h, o.color);
    if (frame.showClock) {
      drawTime(c, frame.clock.time, frame.t);
    } else {
      const size = fitSize(c, o.label, 40, 16, TIME_TILE.w - 16);
      drawText(c, o.label, S / 2, TIME_TILE.y + TIME_TILE.h / 2 + Math.round(size * 0.36), { font: font(size), color: INK });
    }

    const showDate = frame.showClock;
    if (showDate && frame.showBattery) {
      drawDate(c, frame.clock.date, MARGIN, HALF_W);
      drawBattery(c, frame.battery, MARGIN + HALF_W + GAP, HALF_W, frame.t);
    } else if (showDate) {
      drawDate(c, frame.clock.date, MARGIN, S - 2 * MARGIN);
    } else if (frame.showBattery) {
      drawBattery(c, frame.battery, MARGIN, S - 2 * MARGIN, frame.t);
    }
  },
};
