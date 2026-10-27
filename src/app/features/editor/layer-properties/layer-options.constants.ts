import { BATTERY_STYLE_LABELS } from '@core/render/battery-widget';
import { DateFormat } from '@core/render/clock';
import { EFFECT_LABELS } from '@core/render/effects';
import {
  BackgroundMode,
  FontKey,
  FontWeight,
  LayerAnimation,
  ShapeKind,
} from '@core/render/layers/layer.model';
import { AMBIANCE_LABELS } from '@core/render/scenery';
import { MASCOT_LABELS } from '@core/render/sprites/mascots';
import { SegmentOption, segmentsOf } from '@shared/ui/segmented-control/segmented-control';

export const BACKGROUND_MODES: SegmentOption<BackgroundMode>[] = [
  { value: 'solid', label: 'Uni' },
  { value: 'gradient', label: 'Dégradé' },
  { value: 'halo', label: 'Halo' },
  { value: 'scenery', label: 'Paysage' },
];

export const ANIMATIONS: SegmentOption<LayerAnimation>[] = [
  { value: 'none', label: 'Aucune' },
  { value: 'float', label: 'Flotte' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'blink', label: 'Clignote' },
  { value: 'sway', label: 'Balance' },
  { value: 'spin', label: 'Tourne' },
];

export const FONTS: SegmentOption<FontKey>[] = [
  { value: 'inter', label: 'Inter' },
  { value: 'geist', label: 'Geist' },
  { value: 'mono', label: 'Mono' },
];

export const WEIGHTS: SegmentOption<FontWeight>[] = [
  { value: 400, label: 'Fine' },
  { value: 600, label: 'Normale' },
  { value: 700, label: 'Grasse' },
];

export const DATE_FORMATS: SegmentOption<DateFormat>[] = [
  { value: 'short', label: 'Mar. 27 oct.' },
  { value: 'long', label: 'Mardi 27' },
  { value: 'numeric', label: '27/10' },
];

export const SHAPES: SegmentOption<ShapeKind>[] = [
  { value: 'rect', label: 'Rectangle' },
  { value: 'circle', label: 'Cercle' },
];

export const MASCOT_SIZES: SegmentOption<0.5 | 1>[] = [
  { value: 0.5, label: 'Petit' },
  { value: 1, label: 'Normal' },
];

export const EFFECTS = segmentsOf(EFFECT_LABELS);
export const AMBIANCES = segmentsOf(AMBIANCE_LABELS);
export const BATTERY_STYLES = segmentsOf(BATTERY_STYLE_LABELS);
export const MASCOTS = segmentsOf(MASCOT_LABELS);
