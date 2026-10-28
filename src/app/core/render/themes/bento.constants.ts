export type BentoPalette = 'pastel' | 'ocean' | 'sorbet' | 'mono';

export const BENTO_PALETTE_LABELS: Record<BentoPalette, string> = {
  pastel: 'Pastel',
  ocean: 'Océan',
  sorbet: 'Sorbet',
  mono: 'Mono',
};

export interface BentoColors {
  background: string;
  time: string;
  date: string;
  /** Empty glass and water level of the battery tile. */
  batteryBase: string;
  batteryFill: string;
  /** Text on every tile. */
  ink: string;
}

/** Red water at 20 % and below, the same in every palette. */
export const BENTO_LOW = { base: '#ffd9d6', fill: '#ff5a52' } as const;

export const BENTO_COLORS: Record<BentoPalette, BentoColors> = {
  pastel: { background: '#15131f', time: '#cdb4ff', date: '#ffd8b5', batteryBase: '#d8f3e6', batteryFill: '#8fe3b8', ink: '#1c1830' },
  ocean: { background: '#08141f', time: '#7cc6ff', date: '#bff0ff', batteryBase: '#cdeee9', batteryFill: '#4fd1b5', ink: '#0b2233' },
  sorbet: { background: '#1a1012', time: '#ff9a8b', date: '#ffe08a', batteryBase: '#e3f6d9', batteryFill: '#9fdc8a', ink: '#2a1414' },
  mono: { background: '#000000', time: '#f4f4f4', date: '#c9c9c9', batteryBase: '#8d8d8d', batteryFill: '#ffffff', ink: '#0f0f0f' },
};
