import { BatteryStyle } from '../battery-widget';
import { DateFormat } from '../clock';
import { EffectKind } from '../effects';
import { Ambiance } from '../scenery';
import { MascotKind } from '../sprites/mascots';

export type LayerAnimation = 'none' | 'float' | 'pulse' | 'blink' | 'sway' | 'spin';
export type FontKey = 'inter' | 'geist' | 'mono';
export type FontWeight = 400 | 600 | 700;
export type BackgroundMode = 'solid' | 'gradient' | 'halo' | 'scenery';
export type ShapeKind = 'rect' | 'circle';

interface LayerBase {
  id: number;
  visible: boolean;
}

/** A layer with a position on screen. `x`/`y` are its center, in screen pixels. */
interface PlacedBase extends LayerBase {
  x: number;
  y: number;
  opacity: number;
  animation: LayerAnimation;
}

export interface TextLook {
  font: FontKey;
  weight: FontWeight;
  size: number;
  color: string;
  shadow: boolean;
  uppercase: boolean;
}

interface Outline {
  strokeWidth: number;
  stroke: string;
}

export interface BackgroundLayer extends LayerBase {
  type: 'background';
  mode: BackgroundMode;
  color: string;
  color2: string;
  ambiance: Ambiance;
}

export interface EffectLayer extends LayerBase {
  type: 'effect';
  kind: EffectKind;
  color: string;
  count: number;
}

export interface TimeLayer extends PlacedBase, TextLook {
  type: 'time';
}

export interface DateLayer extends PlacedBase, TextLook {
  type: 'date';
  format: DateFormat;
}

export interface TextLayer extends PlacedBase, TextLook {
  type: 'text';
  text: string;
}

export interface BatteryLayer extends PlacedBase {
  type: 'battery';
  style: BatteryStyle;
  color: string;
  scale: number;
}

export interface ShapeLayer extends PlacedBase, Outline {
  type: 'shape';
  shape: ShapeKind;
  fill: string;
  width: number;
  height: number;
  radius: number;
}

export interface ImageLayer extends PlacedBase, Outline {
  type: 'image';
  /** Original file as a data URL, so a saved style carries its images. */
  src: string | null;
  width: number;
  height: number;
  radius: number;
}

export interface MascotLayer extends PlacedBase {
  type: 'mascot';
  mascot: MascotKind;
  accent: string;
  scale: 0.5 | 1;
}

export type Layer =
  | BackgroundLayer
  | EffectLayer
  | TimeLayer
  | DateLayer
  | TextLayer
  | BatteryLayer
  | ShapeLayer
  | ImageLayer
  | MascotLayer;

export type LayerType = Layer['type'];
export type PlacedLayer = Exclude<Layer, BackgroundLayer | EffectLayer>;
export type TextualLayer = TimeLayer | DateLayer | TextLayer;
export type LayerOf<T extends LayerType> = Extract<Layer, { type: T }>;

export const isPlaced = (layer: Layer): layer is PlacedLayer =>
  layer.type !== 'background' && layer.type !== 'effect';

export const isTextual = (layer: Layer): layer is TextualLayer =>
  layer.type === 'time' || layer.type === 'date' || layer.type === 'text';

export const LAYER_TYPE_LABELS: Record<LayerType, string> = {
  background: 'Fond',
  effect: 'Effet',
  time: 'Heure',
  date: 'Date',
  text: 'Texte',
  battery: 'Batterie',
  shape: 'Forme',
  image: 'Image',
  mascot: 'Perso',
};
