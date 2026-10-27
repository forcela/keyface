import { SCREEN_SIZE as S } from '@core/render/canvas.utils';
import { PlacedLayer } from '@core/render/layers/layer.model';

/** Pure drag math, kept apart from the component so it can be tested without a DOM. */

export type Drag =
  | { mode: 'move'; id: number; offsetX: number; offsetY: number }
  | { mode: 'resize'; id: number; startDistance: number; startLayer: PlacedLayer };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function startResize(layer: PlacedLayer, px: number, py: number): Drag {
  return {
    mode: 'resize',
    id: layer.id,
    startDistance: Math.max(4, Math.hypot(px - layer.x, py - layer.y)),
    startLayer: layer,
  };
}

/** Changes to apply to the layer for a pointer at (px, py). */
export function dragTo(drag: Drag, layer: PlacedLayer, px: number, py: number): Partial<PlacedLayer> {
  if (drag.mode === 'move') {
    return { x: clamp(Math.round(px - drag.offsetX), 0, S), y: clamp(Math.round(py - drag.offsetY), 0, S) };
  }
  const ratio = Math.max(2, Math.hypot(px - layer.x, py - layer.y)) / drag.startDistance;
  const start = drag.startLayer;
  switch (start.type) {
    case 'time':
    case 'date':
    case 'text':
      return { size: clamp(Math.round(start.size * ratio), 6, 64) };
    case 'battery':
      return { scale: clamp(Math.round(start.scale * ratio * 10) / 10, 0.5, 2.5) };
    case 'mascot':
      return { scale: ratio < 0.8 ? 0.5 : 1 };
    case 'shape':
    case 'image':
      return {
        width: clamp(Math.round(Math.abs(px - layer.x) * 2), 2, S),
        height: clamp(Math.round(Math.abs(py - layer.y) * 2), 2, S),
      };
  }
}

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

export function keyboardNudge(layer: PlacedLayer, key: string, step: number): Partial<PlacedLayer> | null {
  const direction = ARROWS[key];
  if (!direction) return null;
  return {
    x: clamp(layer.x + direction[0] * step, 0, S),
    y: clamp(layer.y + direction[1] * step, 0, S),
  };
}
