export type AuroraPalette = 'candy' | 'ocean' | 'sunset';

export const AURORA_PALETTE_LABELS: Record<AuroraPalette, string> = {
  candy: 'Bonbon',
  ocean: 'Océan',
  sunset: 'Couchant',
};

/** Four glowing colours per palette, each drifting on its own orbit. */
export const AURORA_COLORS: Record<AuroraPalette, readonly string[]> = {
  candy: ['#ff5fa2', '#7c5cff', '#35d0ff', '#ffb86b'],
  ocean: ['#00c2ff', '#3b5bff', '#00e5b0', '#8a5cff'],
  sunset: ['#ff6a3d', '#ff3d81', '#ffb347', '#7b3dff'],
};
