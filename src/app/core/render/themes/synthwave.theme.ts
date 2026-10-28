import { Ctx, SCREEN_SIZE as S, TAU, drawText, rgba, textWidth } from '../canvas.utils';
import { batteryWidgetSize, drawBatteryWidget } from '../battery-widget';
import { formatDate } from '../clock';
import { ThemeDefinition } from './theme.model';

export interface SynthwaveOptions {
  /** Neon colour: sky glow, sun, grid and the outline of the digits. */
  color: string;
  /** Shown instead of the time when the clock is hidden. */
  label: string;
}

export const SYNTHWAVE_DEFAULTS: SynthwaveOptions = { color: '#ff3df2', label: 'Basil' };

const HORIZON = 84;
const SUN_RADIUS = 26;
const GRID_ROWS = 7;
const COLUMN_STEP = 26;
const TEXT_MAX_WIDTH = 108;

/** Digits with a neon outline that breathes once per loop. */
function neonText(c: Ctx, text: string, baselineY: number, size: number, color: string, t: number): void {
  const wide = textWidth(c, text, `700 ${size}px Inter`);
  const font = `700 ${Math.floor(size * Math.min(1, TEXT_MAX_WIDTH / wide))}px Inter`;
  c.font = font;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.lineJoin = 'round';
  c.strokeStyle = rgba(color, 0.25 + 0.2 * Math.cos(TAU * t));
  c.lineWidth = 7;
  c.strokeText(text, S / 2, baselineY);
  c.strokeStyle = rgba(color, 0.95);
  c.lineWidth = 2.5;
  c.strokeText(text, S / 2, baselineY);
  drawText(c, text, S / 2, baselineY, { font, color: '#fff' });
}

function drawSky(c: Ctx, color: string, t: number): void {
  c.fillStyle = '#08001a';
  c.fillRect(0, 0, S, S);
  const sky = c.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, rgba(color, 0));
  sky.addColorStop(1, rgba(color, 0.45));
  c.fillStyle = sky;
  c.fillRect(0, 0, S, HORIZON);

  c.save();
  c.beginPath();
  c.rect(0, 0, S, HORIZON);
  c.clip();
  const halo = c.createRadialGradient(S / 2, HORIZON, 0, S / 2, HORIZON, 56);
  halo.addColorStop(0, rgba(color, 0.35 + 0.15 * Math.cos(TAU * t)));
  halo.addColorStop(1, rgba(color, 0));
  c.fillStyle = halo;
  c.fillRect(0, 0, S, S);
  const sun = c.createLinearGradient(0, HORIZON - SUN_RADIUS, 0, HORIZON);
  sun.addColorStop(0, '#ffe66d');
  sun.addColorStop(1, color);
  c.fillStyle = sun;
  c.beginPath();
  c.arc(S / 2, HORIZON, SUN_RADIUS, 0, TAU);
  c.fill();
  c.restore();
}

function drawFloor(c: Ctx, color: string, t: number): void {
  c.fillStyle = '#0a0118';
  c.fillRect(0, HORIZON, S, S - HORIZON);
  c.lineWidth = 1;
  c.strokeStyle = rgba(color, 0.5);
  for (let k = -6; k <= 6; k++) {
    c.beginPath();
    c.moveTo(S / 2, HORIZON);
    c.lineTo(S / 2 + k * COLUMN_STEP, S);
    c.stroke();
  }
  // The rows glide towards the viewer by one spacing per loop and fade at both ends, so the loop is seamless.
  for (let i = 0; i < GRID_ROWS; i++) {
    const f = (i + t) / GRID_ROWS;
    const y = HORIZON + (S - HORIZON) * f * f;
    c.strokeStyle = rgba(color, 0.7 * Math.sin(Math.PI * f));
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(S, y);
    c.stroke();
  }
  c.fillStyle = rgba(color, 0.95);
  c.fillRect(0, HORIZON - 0.5, S, 1);
}

export const synthwaveTheme: ThemeDefinition<SynthwaveOptions> = {
  id: 'synthwave',
  name: 'Synthwave',
  description: 'Soleil néon, grille, heure lumineuse',
  defaults: { frames: 48, delay: 80 },
  draw(c, frame, o) {
    const { t } = frame;
    drawSky(c, o.color, t);
    drawFloor(c, o.color, t);

    if (frame.showClock) {
      drawText(c, formatDate(frame.clock.date, 'short'), S / 2, 18, { font: '500 11px Inter', color: 'rgba(255,255,255,.75)' });
      neonText(c, frame.clock.time, 52, 36, o.color, t);
    } else {
      neonText(c, o.label, 54, 28, o.color, t);
    }

    if (frame.showBattery) {
      const { w } = batteryWidgetSize(c, 'pill', frame.battery);
      drawBatteryWidget(c, 'pill', frame.battery, '#ffffff', Math.round(S / 2 - w / 2), 106);
    }
  },
};
