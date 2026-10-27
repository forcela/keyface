export type GenzPalette = 'ink' | 'sand' | 'slate' | 'lime';

export interface GenzColors {
  background: string;
  accent: string;
  /** Disc behind the mascot, so its black outline reads on dark backgrounds. */
  disc: string;
  /** Sticker and bubble background. */
  card: string;
  /** Text and icon color on `card`. */
  cardInk: string;
  light: boolean;
}

export const GENZ_PALETTES: Record<GenzPalette, GenzColors> = {
  ink: { background: '#111214', accent: '#ece7dc', disc: '#26282c', card: '#1d1f23', cardInk: '#ffffff', light: false },
  sand: { background: '#e8e2d6', accent: '#2a2927', disc: '#d6cdbd', card: '#ffffff', cardInk: '#2a2927', light: true },
  slate: { background: '#18202c', accent: '#a9c0dc', disc: '#263247', card: '#1f2938', cardInk: '#ffffff', light: false },
  lime: { background: '#0c0e11', accent: '#c6ff3d', disc: '#262a32', card: '#1b1e24', cardInk: '#ffffff', light: false },
};

export const GENZ_PALETTE_LABELS: Record<GenzPalette, string> = {
  ink: 'Encre',
  sand: 'Sable',
  slate: 'Ardoise',
  lime: 'Lime',
};

export const STICKER_FONT = '700 12px "Space Mono"';
export const BUBBLE_FONT = '700 11px "Space Mono"';
