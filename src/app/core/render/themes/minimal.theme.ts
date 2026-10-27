import { SCREEN_SIZE as S, TAU, drawText, rgba } from '../canvas.utils';
import { formatDate } from '../clock';
import { batteryWidgetSize, drawBatteryWidget } from '../battery-widget';
import { ThemeDefinition } from './theme.model';

export interface MinimalOptions {
  background: 'black' | 'halo';
  haloColor: string;
  /** Shown instead of the time when the clock is hidden. */
  label: string;
}

export const MINIMAL_DEFAULTS: MinimalOptions = { background: 'black', haloColor: '#3a6bff', label: 'Basil' };

const TIME_FONT = '600 40px Inter';

export const minimalTheme: ThemeDefinition<MinimalOptions> = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Date, heure, batterie',
  defaults: { frames: 48, delay: 80 },
  draw(c, frame, o) {
    const { t } = frame;
    c.fillStyle = '#000';
    c.fillRect(0, 0, S, S);
    if (o.background === 'halo') {
      const y = 150 + Math.sin(TAU * t) * 6;
      const g = c.createRadialGradient(64, y, 0, 64, y, 112);
      g.addColorStop(0, rgba(o.haloColor, 0.5));
      g.addColorStop(1, rgba(o.haloColor, 0));
      c.fillStyle = g;
      c.fillRect(0, 0, S, S);
    }

    if (frame.showClock) {
      drawText(c, formatDate(frame.clock.date, 'short'), 64, 36, {
        font: '500 11px Inter',
        color: 'rgba(255,255,255,.55)',
      });
      // Only the colon breathes; the digits stay put.
      const [hh, mm] = frame.clock.time.split(':');
      c.font = TIME_FONT;
      const wh = c.measureText(hh).width;
      const wc = c.measureText(':').width;
      const x0 = 64 - (wh + wc + c.measureText(mm).width) / 2;
      const colonAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.cos(TAU * t));
      drawText(c, hh, x0, 78, { font: TIME_FONT, color: '#fff', align: 'left' });
      drawText(c, ':', x0 + wh, 76, { font: TIME_FONT, color: `rgba(255,255,255,${colonAlpha.toFixed(3)})`, align: 'left' });
      drawText(c, mm, x0 + wh + wc, 78, { font: TIME_FONT, color: '#fff', align: 'left' });
    } else {
      drawText(c, o.label, 64, 70, { font: '600 22px Inter', color: '#fff' });
    }

    if (frame.showBattery) {
      const { w } = batteryWidgetSize(c, 'icon', frame.battery);
      drawBatteryWidget(c, 'icon', frame.battery, '#ffffff', Math.round(64 - w / 2), 94);
    }
  },
};
