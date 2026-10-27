import { drawText } from '../canvas.utils';
import { batteryWidgetSize, drawBatteryWidget } from '../battery-widget';
import { formatDate } from '../clock';
import { Ambiance, drawScenery } from '../scenery';
import { ThemeDefinition } from './theme.model';

export interface LandscapeOptions {
  ambiance: Ambiance;
  /** Shown instead of the time when the clock is hidden. */
  label: string;
}

export const LANDSCAPE_DEFAULTS: LandscapeOptions = { ambiance: 'dawn', label: 'Basil' };

export const landscapeTheme: ThemeDefinition<LandscapeOptions> = {
  id: 'landscape',
  name: 'Paysage',
  description: 'Fond doux, heure, batterie',
  defaults: { frames: 60, delay: 100 },
  draw(c, frame, o) {
    drawScenery(c, frame.t, o.ambiance);

    c.save();
    c.shadowColor = 'rgba(0,0,0,.28)';
    c.shadowBlur = 6;
    c.shadowOffsetY = 1;
    if (frame.showClock) {
      drawText(c, formatDate(frame.clock.date, 'short'), 64, 27, {
        font: '500 11px Inter',
        color: 'rgba(255,255,255,.85)',
      });
      drawText(c, frame.clock.time, 64, 66, { font: '600 38px Inter', color: '#fff' });
    } else {
      drawText(c, o.label, 64, 58, { font: '600 22px Inter', color: '#fff' });
    }
    c.restore();

    if (frame.showBattery) {
      const { w } = batteryWidgetSize(c, 'pill', frame.battery);
      drawBatteryWidget(c, 'pill', frame.battery, '#ffffff', Math.round(64 - w / 2), 106);
    }
  },
};
