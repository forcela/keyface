/** What the backlight of a keyboard can do. Pure data, no device access. */

/** Direction values as the keyboard understands them (raw 0 to 3). */
export type LightDirection = 0 | 1 | 2 | 3;

export const DIRECTION_LABELS: Record<LightDirection, string> = { 0: 'Gauche', 1: 'Bas', 2: 'Haut', 3: 'Droite' };

/** What an effect looks like, whatever number a given keyboard gives it. Drives the preview. */
export type LightEffectKind =
  | 'off'
  | 'static'
  | 'key-on'
  | 'key-off'
  | 'glitter'
  | 'falling'
  | 'colourful'
  | 'breathe'
  | 'spectrum'
  | 'outward'
  | 'scroll'
  | 'roll'
  | 'rotate'
  | 'explode'
  | 'launch'
  | 'ripple'
  | 'flow'
  | 'pulse'
  | 'tilt'
  | 'shuttle';

export interface LightEffect {
  /** The mode number this keyboard expects. */
  id: number;
  kind: LightEffectKind;
  label: string;
  /** False when the effect picks its own colours and ignores the colour chosen by the user. */
  usesColor: boolean;
  /** True when the effect moves in a direction the user can choose. */
  usesDirection: boolean;
}

export interface LightingSettings {
  effect: number;
  /** `#rrggbb`. */
  color: string;
  /** Overrides the colour with a rainbow, for effects that use a colour. */
  rainbow: boolean;
  /** 0 to 5. */
  brightness: number;
  /** 0 to 5. */
  speed: number;
  direction: LightDirection;
}

export interface BacklightCapability {
  effects: readonly LightEffect[];
  brightnessMax: number;
  speedMax: number;
}

/** The effect with this id, or the first one of the list when the id is unknown. */
export const findEffect = (effects: readonly LightEffect[], id: number): LightEffect | undefined =>
  effects.find((effect) => effect.id === id) ?? effects[0];

export const DEFAULT_LIGHTING: LightingSettings = {
  effect: 0x01,
  color: '#3a6bff',
  rainbow: false,
  brightness: 5,
  speed: 3,
  direction: 0,
};

export interface LightingPreset {
  id: string;
  label: string;
  settings: Partial<LightingSettings>;
}

/** Ready-made moods: one click sets an effect and a colour. */
export const LIGHTING_PRESETS: readonly LightingPreset[] = [
  { id: 'calm', label: 'Bleu calme', settings: { effect: 0x01, color: '#3a6bff', rainbow: false } },
  { id: 'warm', label: 'Blanc chaud', settings: { effect: 0x01, color: '#ffd9a0', rainbow: false } },
  { id: 'breath', label: 'Respiration rose', settings: { effect: 0x07, color: '#ff4fa3', rainbow: false, speed: 2 } },
  { id: 'rainbow', label: 'Arc-en-ciel', settings: { effect: 0x08, rainbow: false, speed: 2 } },
  { id: 'ripple', label: 'Ondes violettes', settings: { effect: 0x0f, color: '#9b5cff', rainbow: false } },
  { id: 'matrix', label: 'Matrix', settings: { effect: 0x05, color: '#3dff7a', rainbow: false, speed: 3 } },
];

/** Colours offered as one-tap swatches. */
export const COLOR_SWATCHES: readonly string[] = [
  '#ff3b30',
  '#ff9500',
  '#ffd60a',
  '#34c759',
  '#00c7be',
  '#3a6bff',
  '#9b5cff',
  '#ff4fa3',
  '#ffffff',
];

