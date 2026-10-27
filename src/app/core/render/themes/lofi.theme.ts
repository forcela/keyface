import { Ctx, SCREEN_SIZE as S, TAU, drawBatteryIcon, drawText, rgba, roundRect } from '../canvas.utils';
import { ThemeDefinition } from './theme.model';

export interface LofiOptions {
  title: string;
  subtitle: string;
  labelColor: string;
}

export const LOFI_DEFAULTS: LofiOptions = { title: 'late night typing', subtitle: 'basil fm', labelColor: '#ff7a59' };

const CX = 60;
const CY = 56;
const R = 36;
const MARQUEE_W = 104;
const MARQUEE_H = 16;

function drawRecord(c: Ctx, t: number, labelColor: string): void {
  c.fillStyle = 'rgba(0,0,0,.45)';
  c.beginPath();
  c.arc(CX + 1.5, CY + 2.5, R, 0, TAU);
  c.fill();
  c.fillStyle = '#0c0c0f';
  c.beginPath();
  c.arc(CX, CY, R, 0, TAU);
  c.fill();
  c.lineWidth = 0.6;
  for (let r = 16; r < R - 1; r += 1.6) {
    c.strokeStyle = `rgba(255,255,255,${r % 4.8 < 1.6 ? 0.07 : 0.035})`;
    c.beginPath();
    c.arc(CX, CY, r, 0, TAU);
    c.stroke();
  }
  // The sheen stays still while the record turns, like on a real turntable.
  const sheen = c.createConicGradient(-0.6, CX, CY);
  for (const [stop, a] of [[0, 0], [0.06, 0.16], [0.13, 0], [0.5, 0], [0.56, 0.1], [0.63, 0], [1, 0]]) {
    sheen.addColorStop(stop, `rgba(255,255,255,${a})`);
  }
  c.fillStyle = sheen;
  c.beginPath();
  c.arc(CX, CY, R - 1, 0, TAU);
  c.fill();

  c.save();
  c.translate(CX, CY);
  c.rotate(TAU * t);
  c.fillStyle = labelColor;
  c.beginPath();
  c.arc(0, 0, 13, 0, TAU);
  c.fill();
  c.fillStyle = 'rgba(0,0,0,.16)';
  c.beginPath();
  c.moveTo(0, 0);
  c.arc(0, 0, 13, 0, Math.PI);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,.85)';
  roundRect(c, -5, -9, 10, 2, 1);
  c.fill();
  c.restore();
  c.fillStyle = '#100b12';
  c.beginPath();
  c.arc(CX, CY, 2, 0, TAU);
  c.fill();
}

function drawTonearm(c: Ctx): void {
  const [px, py, hx, hy] = [112, 28, 88, 50];
  c.fillStyle = '#3a3a40';
  c.beginPath();
  c.arc(px, py, 7, 0, TAU);
  c.fill();
  c.fillStyle = '#b9b9c0';
  c.beginPath();
  c.arc(px, py, 4, 0, TAU);
  c.fill();
  c.strokeStyle = '#d8d8de';
  c.lineWidth = 2.5;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(px, py);
  c.lineTo(hx, hy);
  c.stroke();
  c.lineCap = 'butt';
  c.save();
  c.translate(hx, hy);
  c.rotate(Math.atan2(hy - py, hx - px) + Math.PI / 2);
  c.fillStyle = '#ececf1';
  roundRect(c, -3.5, -2, 7, 8, 1.5);
  c.fill();
  c.restore();
}

let marquee: OffscreenCanvasRenderingContext2D | null = null;

/** Scrolls exactly one copy of the title per loop, with faded edges. */
function drawMarquee(c: Ctx, t: number, title: string): void {
  marquee ??= new OffscreenCanvas(MARQUEE_W, MARQUEE_H).getContext('2d');
  const m = marquee;
  if (!m) return;
  m.clearRect(0, 0, MARQUEE_W, MARQUEE_H);
  m.globalCompositeOperation = 'source-over';
  m.font = '700 11px Inter';
  m.textBaseline = 'middle';
  m.fillStyle = '#ffffff';
  const text = `${title || ' '}     ·     `;
  const w = m.measureText(text).width;
  for (let x = -t * w; x < MARQUEE_W; x += w) m.fillText(text, x, 8.5);
  m.globalCompositeOperation = 'destination-in';
  const fade = m.createLinearGradient(0, 0, MARQUEE_W, 0);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(0.1, '#000');
  fade.addColorStop(0.9, '#000');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  m.fillStyle = fade;
  m.fillRect(0, 0, MARQUEE_W, MARQUEE_H);
  c.drawImage(m.canvas, 12, 96);
}

export const lofiTheme: ThemeDefinition<LofiOptions> = {
  id: 'lofi',
  name: 'Lo-fi',
  description: 'Vinyle qui tourne',
  defaults: { frames: 60, delay: 70 },
  draw(c, frame, o) {
    const { t } = frame;
    const bg = c.createLinearGradient(0, 0, 0, S);
    bg.addColorStop(0, '#231622');
    bg.addColorStop(1, '#100b12');
    c.fillStyle = bg;
    c.fillRect(0, 0, S, S);
    const glow = c.createRadialGradient(CX, CY, 10, CX, CY, 62);
    glow.addColorStop(0, rgba(o.labelColor, 0.28));
    glow.addColorStop(1, rgba(o.labelColor, 0));
    c.fillStyle = glow;
    c.fillRect(0, 0, S, S);

    drawRecord(c, t, o.labelColor);
    drawTonearm(c);
    if (frame.showClock) drawText(c, frame.clock.time, 8, 14, { font: '600 10px Inter', color: 'rgba(255,255,255,.88)', align: 'left' });
    if (frame.showBattery) {
      drawBatteryIcon(c, S - 27, 6, frame.battery, { width: 17, height: 8.5, frame: 'rgba(255,255,255,.55)', fill: '#fff' });
    }
    drawMarquee(c, t, o.title);
    drawText(c, o.subtitle, 64, 118, { font: '500 9px Inter', color: 'rgba(255,255,255,.55)', letterSpacing: '.4px' });
    c.fillStyle = 'rgba(255,255,255,.14)';
    roundRect(c, 24, 122, 80, 2, 1);
    c.fill();
    c.fillStyle = o.labelColor;
    roundRect(c, 24, 122, Math.max(2, 80 * t), 2, 1);
    c.fill();
  },
};
