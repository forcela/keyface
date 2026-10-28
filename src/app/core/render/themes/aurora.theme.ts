import { Ctx, SCREEN_SIZE as S, TAU, drawText, rgba, roundRect, textWidth } from '../canvas.utils';
import { drawBatteryWidget, batteryWidgetSize } from '../battery-widget';
import { formatDate } from '../clock';
import { AURORA_COLORS, AuroraPalette } from './aurora.constants';
import { ThemeDefinition } from './theme.model';

export interface AuroraOptions {
  palette: AuroraPalette;
  /** Shown instead of the time when the clock is hidden. */
  label: string;
}

export const AURORA_DEFAULTS: AuroraOptions = { palette: 'candy', label: 'Basil' };

const font = (weight: number, size: number) => `${weight} ${size}px Geist`;
const TEXT_MAX_WIDTH = 108;
const ORBIT = 34;
const BLOB_RADIUS = 58;

/** Biggest size, down to `min`, at which `text` fits in `maxWidth`. */
function fitFont(c: Ctx, text: string, weight: number, size: number, min: number, maxWidth: number): string {
  let current = size;
  while (current > min && textWidth(c, text, font(weight, current)) > maxWidth) current--;
  return font(weight, current);
}

/** Soft colour blobs drifting on circles, one full turn per loop. */
function drawBlobs(c: Ctx, colors: readonly string[], t: number): void {
  c.fillStyle = '#0b0b14';
  c.fillRect(0, 0, S, S);
  c.globalCompositeOperation = 'screen';
  colors.forEach((color, k) => {
    const direction = k % 2 === 0 ? 1 : -1;
    const x = S / 2 + ORBIT * Math.cos(TAU * (t + k / colors.length));
    const y = S / 2 + ORBIT * Math.sin(direction * TAU * t + k * 1.7);
    const glow = c.createRadialGradient(x, y, 0, x, y, BLOB_RADIUS);
    glow.addColorStop(0, rgba(color, 1));
    glow.addColorStop(0.5, rgba(color, 0.55));
    glow.addColorStop(1, rgba(color, 0));
    c.fillStyle = glow;
    c.fillRect(0, 0, S, S);
  });
  c.globalCompositeOperation = 'source-over';
  // A dark veil keeps white text readable on the brightest colours.
  c.fillStyle = 'rgba(8,6,20,0.16)';
  c.fillRect(0, 0, S, S);
}

export const auroraTheme: ThemeDefinition<AuroraOptions> = {
  id: 'aurora',
  name: 'Aurora',
  description: 'Couleurs fluides, heure géante',
  defaults: { frames: 48, delay: 80 },
  draw(c, frame, o) {
    drawBlobs(c, AURORA_COLORS[o.palette], frame.t);
    const white = '#ffffff';

    if (frame.showClock) {
      drawText(c, formatDate(frame.clock.date, 'short'), S / 2, 28, {
        font: font(600, 12),
        color: 'rgba(255,255,255,0.92)',
      });
      const big = fitFont(c, frame.clock.time, 700, 52, 24, TEXT_MAX_WIDTH);
      drawText(c, frame.clock.time, S / 2, 76, { font: big, color: white, letterSpacing: '-1px' });
    } else {
      drawText(c, o.label, S / 2, 70, { font: fitFont(c, o.label, 700, 40, 16, TEXT_MAX_WIDTH), color: white });
    }

    if (frame.showBattery) {
      const { w, h } = batteryWidgetSize(c, 'pill', frame.battery);
      const x = Math.round(S / 2 - w / 2);
      c.fillStyle = 'rgba(8,6,20,0.45)';
      roundRect(c, x, 98, w, h, h / 2);
      c.fill();
      drawBatteryWidget(c, 'pill', frame.battery, white, x, 98);
    }
  },
};
