import { Ctx, SCREEN_SIZE as S, TAU, drawText, rgba, roundRect } from '../canvas.utils';
import { drawBatteryWidget } from '../battery-widget';
import { drawEffect } from '../effects';
import { DecodedImage, FrameContext, frameAt } from '../frame.model';
import { drawScenery } from '../scenery';
import { MASCOTS } from '../sprites/mascots';
import { LayerData, Rect, layerBounds, layerFont, layerText } from './layer-geometry';
import { BackgroundLayer, ImageLayer, Layer, PlacedLayer, ShapeLayer, isTextual } from './layer.model';

export type ImageStore = ReadonlyMap<number, DecodedImage>;

function drawBackground(c: Ctx, layer: BackgroundLayer, t: number): void {
  if (layer.mode === 'scenery') {
    drawScenery(c, t, layer.ambiance);
    return;
  }
  c.fillStyle = layer.color;
  c.fillRect(0, 0, S, S);
  if (layer.mode === 'gradient') {
    const g = c.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, layer.color);
    g.addColorStop(1, layer.color2);
    c.fillStyle = g;
    c.fillRect(0, 0, S, S);
  } else if (layer.mode === 'halo') {
    const y = 140 + Math.sin(TAU * t) * 6;
    const g = c.createRadialGradient(64, y, 0, 64, y, 115);
    g.addColorStop(0, rgba(layer.color2, 0.7));
    g.addColorStop(1, rgba(layer.color2, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, S, S);
  }
}

/** Applies the layer's animation as a transform around its center. Every curve loops seamlessly. */
function applyAnimation(c: Ctx, layer: PlacedLayer, box: Rect, t: number): void {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  let dy = 0;
  let scale = 1;
  let rotation = 0;
  switch (layer.animation) {
    case 'float':
      dy = Math.sin(TAU * t) * 3;
      break;
    case 'pulse':
      scale = 1 + 0.06 * Math.sin(TAU * t);
      break;
    case 'blink':
      c.globalAlpha *= 0.3 + 0.7 * (0.5 + 0.5 * Math.cos(TAU * t));
      break;
    case 'sway':
      rotation = Math.sin(TAU * t) * 0.09;
      break;
    case 'spin':
      rotation = TAU * t;
      break;
  }
  c.translate(cx, cy + dy);
  c.rotate(rotation);
  c.scale(scale, scale);
  c.translate(-cx, -cy);
}

function drawBox(c: Ctx, layer: ShapeLayer | ImageLayer, box: Rect, images: ImageStore, t: number): void {
  const radius = Math.min(layer.radius, layer.width / 2, layer.height / 2);
  if (layer.type === 'shape' && layer.shape === 'circle') {
    c.beginPath();
    c.ellipse(layer.x, layer.y, layer.width / 2, layer.height / 2, 0, 0, TAU);
  } else {
    roundRect(c, box.x, box.y, layer.width, layer.height, radius);
  }
  if (layer.type === 'shape') {
    c.fillStyle = layer.fill;
    c.fill();
  } else {
    c.save();
    c.clip();
    const image = images.get(layer.id);
    if (image) {
      const f = frameAt(image, t);
      const k = Math.max(layer.width / f.width, layer.height / f.height);
      c.drawImage(f, layer.x - (f.width * k) / 2, layer.y - (f.height * k) / 2, f.width * k, f.height * k);
    } else {
      c.fillStyle = '#2a2c31';
      c.fillRect(box.x, box.y, layer.width, layer.height);
      drawText(c, 'image', layer.x, layer.y + 3, { font: '500 9px Inter', color: '#9a9da5' });
    }
    c.restore();
  }
  if (layer.strokeWidth > 0) {
    c.strokeStyle = layer.stroke;
    c.lineWidth = layer.strokeWidth;
    c.stroke();
  }
}

function drawPlaced(c: Ctx, layer: PlacedLayer, frame: FrameContext, data: LayerData, images: ImageStore): void {
  const box = layerBounds(c, layer, data);
  c.save();
  c.globalAlpha = layer.opacity;
  applyAnimation(c, layer, box, frame.t);
  if (isTextual(layer)) {
    if (layer.shadow) {
      c.shadowColor = 'rgba(0,0,0,.35)';
      c.shadowBlur = 6;
      c.shadowOffsetY = 1;
    }
    drawText(c, layerText(layer, data), layer.x, box.y + box.ascent, { font: layerFont(layer), color: layer.color });
  } else if (layer.type === 'battery') {
    c.translate(box.x, box.y);
    c.scale(layer.scale, layer.scale);
    drawBatteryWidget(c, layer.style, frame.battery, layer.color, 0, 0);
  } else if (layer.type === 'mascot') {
    c.translate(layer.x, layer.y);
    c.scale(layer.scale, layer.scale);
    c.translate(-64, -66);
    MASCOTS[layer.mascot](c, frame.t, layer.accent);
  } else {
    drawBox(c, layer, box, images, frame.t);
  }
  c.restore();
}

/** Draws layers back to front. Time, date and battery follow the global "show" switches. */
export function drawLayers(c: Ctx, layers: readonly Layer[], frame: FrameContext, images: ImageStore): void {
  c.fillStyle = '#000';
  c.fillRect(0, 0, S, S);
  const data: LayerData = { clock: frame.clock, battery: frame.battery };
  for (const layer of layers) {
    if (!layer.visible) continue;
    if ((layer.type === 'time' || layer.type === 'date') && !frame.showClock) continue;
    if (layer.type === 'battery' && !frame.showBattery) continue;
    if (layer.type === 'background') drawBackground(c, layer, frame.t);
    else if (layer.type === 'effect') drawEffect(c, frame.t, layer.kind, layer.color, layer.count);
    else drawPlaced(c, layer, frame, data, images);
  }
}
