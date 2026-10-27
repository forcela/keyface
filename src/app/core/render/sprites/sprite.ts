import { Ctx } from '../canvas.utils';
import { Palette, Sprite } from './sprites.constants';

/** Optional per-pixel substitution, e.g. to close the eyes for a blink. */
export type PixelSwap = (char: string, col: number, row: number) => string;

export function drawSprite(
  c: Ctx,
  sprite: Sprite,
  palette: Palette,
  x: number,
  y: number,
  scale: number,
  swap?: PixelSwap,
): void {
  sprite.forEach((line, row) => {
    for (let col = 0; col < line.length; col++) {
      const char = swap ? swap(line[col], col, row) : line[col];
      if (char === '.') continue;
      c.fillStyle = palette[char];
      c.fillRect(x + col * scale, y + row * scale, scale, scale);
    }
  });
}

/** Closes the cat's eyes (rows 6 and 7 of `CAT`). */
export const closedCatEyes: PixelSwap = (ch, _col, row) => {
  if (row === 6 && (ch === 'h' || ch === 'e')) return 'o';
  if (row === 7 && ch === 'e') return 'k';
  return ch;
};
