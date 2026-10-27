import { Ctx, TAU, drawBatteryIcon, drawText, rgba, roundRect, textWidth } from './canvas.utils';

export type BatteryStyle = 'pill' | 'icon' | 'ring' | 'bar';

export const BATTERY_STYLE_LABELS: Record<BatteryStyle, string> = {
  pill: 'Pastille',
  icon: 'Icône',
  ring: 'Anneau',
  bar: 'Barre',
};

const LOW = '#ff453a';
const PILL_FONT = '600 10px Inter';
const ICON_FONT = '500 11px Inter';

const percent = (level: number) => `${level} %`;

/** Unscaled size of the widget, measured from its real text so the label never spills out. */
export function batteryWidgetSize(c: Ctx, style: BatteryStyle, level: number): { w: number; h: number } {
  switch (style) {
    case 'pill':
      return { w: Math.ceil(9 + 14 + 2 + 5 + textWidth(c, percent(level), PILL_FONT) + 9), h: 16 };
    case 'icon':
      return { w: Math.ceil(16 + 2 + 6 + textWidth(c, percent(level), ICON_FONT)), h: 11 };
    case 'ring':
      return { w: 26, h: 26 };
    case 'bar':
      return { w: 60, h: 4 };
  }
}

/** Draws the widget with its top-left corner at (x, y). */
export function drawBatteryWidget(c: Ctx, style: BatteryStyle, level: number, color: string, x: number, y: number): void {
  const low = level <= 20;
  const fill = low ? LOW : color;
  switch (style) {
    case 'pill': {
      const { w, h } = batteryWidgetSize(c, style, level);
      c.fillStyle = rgba(color, 0.16);
      roundRect(c, x, y, w, h, 8);
      c.fill();
      c.strokeStyle = rgba(color, 0.28);
      c.lineWidth = 1;
      roundRect(c, x + 0.5, y + 0.5, w - 1, h - 1, 7.5);
      c.stroke();
      drawBatteryIcon(c, x + 9, y + 4, level, { width: 14, height: 8, frame: rgba(color, 0.75), fill });
      drawText(c, percent(level), x + 30, y + 11.5, { font: PILL_FONT, color, align: 'left' });
      break;
    }
    case 'icon':
      drawBatteryIcon(c, x, y + 1.5, level, { width: 16, height: 8, frame: rgba(color, 0.5), fill });
      drawText(c, percent(level), x + 24, y + 10, { font: ICON_FONT, color: rgba(color, 0.75), align: 'left' });
      break;
    case 'ring': {
      const cx = x + 13;
      const cy = y + 13;
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.strokeStyle = rgba(color, 0.2);
      c.beginPath();
      c.arc(cx, cy, 10.5, 0, TAU);
      c.stroke();
      c.strokeStyle = fill;
      c.beginPath();
      c.arc(cx, cy, 10.5, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0.02, level / 100));
      c.stroke();
      c.lineCap = 'butt';
      drawText(c, String(level), cx, cy + 3.5, { font: '700 9px Inter', color });
      break;
    }
    case 'bar':
      c.fillStyle = rgba(color, 0.2);
      roundRect(c, x, y, 60, 4, 2);
      c.fill();
      c.fillStyle = fill;
      roundRect(c, x, y, Math.max(3, (60 * level) / 100), 4, 2);
      c.fill();
      break;
  }
}
