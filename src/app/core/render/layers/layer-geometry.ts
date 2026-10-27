import { Ctx } from '../canvas.utils';
import { batteryWidgetSize } from '../battery-widget';
import { ClockInfo, formatDate } from '../clock';
import { PlacedLayer, TextualLayer, isTextual } from './layer.model';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Data a layer needs to know its own size. */
export interface LayerData {
  clock: ClockInfo;
  battery: number;
}

const FONT_FAMILIES = { inter: 'Inter', geist: 'Geist', mono: '"Space Mono"' } as const;

/** Mascots draw in an ~80 px box at scale 1. */
export const MASCOT_BOX = 80;

export function layerFont(layer: TextualLayer): string {
  return `${layer.weight} ${layer.size}px ${FONT_FAMILIES[layer.font]}`;
}

export function layerText(layer: TextualLayer, data: LayerData): string {
  const text =
    layer.type === 'time' ? data.clock.time : layer.type === 'date' ? formatDate(data.clock.date, layer.format) : layer.text;
  return layer.uppercase ? text.toUpperCase() : text;
}

/** Bounding box without animation, plus the text ascent for textual layers. */
export function layerBounds(c: Ctx, layer: PlacedLayer, data: LayerData): Rect & { ascent: number } {
  if (isTextual(layer)) {
    c.font = layerFont(layer);
    const m = c.measureText(layerText(layer, data) || ' ');
    const ascent = m.actualBoundingBoxAscent || layer.size * 0.72;
    const w = Math.max(4, m.width);
    const h = Math.max(4, ascent + (m.actualBoundingBoxDescent || 0));
    return { x: layer.x - w / 2, y: layer.y - h / 2, w, h, ascent };
  }
  const size =
    layer.type === 'battery'
      ? scaled(batteryWidgetSize(c, layer.style, data.battery), layer.scale)
      : layer.type === 'mascot'
        ? { w: MASCOT_BOX * layer.scale, h: MASCOT_BOX * layer.scale }
        : { w: layer.width, h: layer.height };
  return { x: layer.x - size.w / 2, y: layer.y - size.h / 2, ...size, ascent: 0 };
}

function scaled(size: { w: number; h: number }, k: number) {
  return { w: size.w * k, h: size.h * k };
}

export function containsPoint(rect: Rect, px: number, py: number, margin = 0): boolean {
  return px >= rect.x - margin && px <= rect.x + rect.w + margin && py >= rect.y - margin && py <= rect.y + rect.h + margin;
}
