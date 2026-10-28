import { Ctx, mod, roundRect, seeded } from '../canvas.utils';
import { drawSprite } from './sprite';
import { CAT, CAT_COLORS } from './sprites.constants';

const PIXEL = 4;
/** Taps per loop. A whole number, so the loop closes on itself. */
export const TYPING_STEPS = 12;
const KEY_COUNT = 18;
const KEYS_PER_ROW = 9;
const KX = 22;
const KY = 80;
const LEFT_REST = 40;
const RIGHT_REST = 78;

/** Key tapped at a step, or -1 for a pause (a space). Without text the keys are random but fixed. */
function keyAt(step: number, typed?: string): number {
  if (!typed) return Math.floor(seeded(step + 1) * KEY_COUNT);
  const ch = typed[step % typed.length];
  return ch === ' ' ? -1 : mod(ch.toLowerCase().charCodeAt(0), KEY_COUNT);
}

function drawKeyboard(c: Ctx, accent: string, pressedKey: number): void {
  c.fillStyle = '#000';
  roundRect(c, KX - 1, KY - 1, 86, 20, 4);
  c.fill();
  c.fillStyle = '#3b3f48';
  roundRect(c, KX, KY, 84, 18, 3);
  c.fill();
  for (let i = 0; i < KEY_COUNT; i++) {
    c.fillStyle = i === pressedKey ? accent : '#80858f';
    c.fillRect(KX + 4 + (i % KEYS_PER_ROW) * 9, KY + 3 + Math.floor(i / KEYS_PER_ROW) * 7, 7, 5);
  }
}

function drawPaw(c: Ctx, x: number, down: boolean): void {
  const y = KY - 5 + (down ? 4 : 0);
  c.fillStyle = '#000';
  c.fillRect(x - 1, y - 1, 12, 8);
  c.fillStyle = CAT_COLORS['w'];
  c.fillRect(x, y, 10, 6);
}

/**
 * The cat taps one key per step. `typed` makes it spell that text (spaces are pauses,
 * letters past the loop are cut); without it the keys are random.
 */
export function drawTypingCat(c: Ctx, t: number, accent: string, typed?: string): void {
  const step = Math.floor(t * TYPING_STEPS) % TYPING_STEPS;
  const key = keyAt(step, typed);
  const down = (t * TYPING_STEPS) % 1 < 0.55 && key >= 0;
  const col = key % KEYS_PER_ROW;
  const leftHand = col < 5;
  const pawX = KX + 3 + col * 9;

  drawSprite(c, CAT, CAT_COLORS, 36, 30 + (down ? 1 : 0), PIXEL);
  drawKeyboard(c, accent, down ? key : -1);
  drawPaw(c, key >= 0 && leftHand ? pawX : LEFT_REST, down && leftHand);
  drawPaw(c, key >= 0 && !leftHand ? pawX : RIGHT_REST, down && !leftHand);
}
