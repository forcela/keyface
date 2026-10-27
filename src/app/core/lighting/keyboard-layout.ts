import { seeded } from '@core/render/canvas.utils';

/**
 * A simplified 75 % ISO keyboard for the lighting preview: six rows of rectangles, in key units.
 * It is a drawing, not the real key positions, so effects are approximate.
 */
export interface PreviewKey {
  x: number;
  y: number;
  w: number;
  /** Centre, from 0 to 1 across the whole keyboard. */
  cx: number;
  cy: number;
  /** Stable pseudo-random value in [0, 1) for effects that treat keys differently. */
  seed: number;
}

export const LAYOUT_WIDTH = 15;
export const LAYOUT_HEIGHT = 6;

/** Key widths per row; every row adds up to 15 units. */
const ROWS: readonly (readonly number[])[] = [
  Array<number>(15).fill(1),
  [...Array<number>(13).fill(1), 2],
  [1.5, ...Array<number>(12).fill(1), 1.5],
  [1.75, ...Array<number>(12).fill(1), 1.25],
  [1.25, ...Array<number>(12).fill(1), 1.75],
  [1.25, 1.25, 1.25, 6.25, 1, 1, 1, 1, 1],
];

export const PREVIEW_KEYS: readonly PreviewKey[] = ROWS.flatMap((widths, row) => {
  let x = 0;
  return widths.map((w, i) => {
    const key: PreviewKey = {
      x,
      y: row,
      w,
      cx: (x + w / 2) / LAYOUT_WIDTH,
      cy: (row + 0.5) / LAYOUT_HEIGHT,
      seed: seeded(row * 31 + i + 1),
    };
    x += w;
    return key;
  });
});
