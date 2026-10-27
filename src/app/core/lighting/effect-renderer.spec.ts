import { numbersIn, recordContext } from '../../../testing/recording-context';
import { AK820_PRO } from '../device/keyboard-profiles';
import { drawKeyboardLighting } from './effect-renderer';
import { PREVIEW_KEYS } from './keyboard-layout';
import { DEFAULT_LIGHTING, LightDirection, LightingSettings } from './lighting.model';

const EFFECTS = AK820_PRO.capabilities.backlight!.effects;
const settings = (overrides: Partial<LightingSettings> = {}): LightingSettings => ({ ...DEFAULT_LIGHTING, ...overrides });
const draw = (kind: (typeof EFFECTS)[number]['kind'], t: number, s: LightingSettings) => {
  const recorder = recordContext();
  drawKeyboardLighting(recorder.ctx, t, kind, s, 300, 130);
  return recorder.calls;
};

const channels = (value: string) => (value.match(/\d+/g) ?? []).map(Number);

/** Same drawing, ignoring float noise: numbers within 0.01 and colour channels within 1 of 255. */
function sameDrawing(a: readonly (readonly unknown[])[], b: readonly (readonly unknown[])[]): boolean {
  const same = (x: unknown, y: unknown): boolean => {
    if (typeof x === 'number' && typeof y === 'number') return Math.abs(x - y) < 0.01;
    if (typeof x === 'string' && typeof y === 'string' && x.startsWith('rgb(')) {
      const [cx, cy] = [channels(x), channels(y)];
      return cx.length === cy.length && cx.every((v, i) => Math.abs(v - cy[i]) <= 1);
    }
    return x === y;
  };
  return a.length === b.length && a.every((call, i) => call.length === b[i].length && call.every((v, j) => same(v, b[i][j])));
}

describe('keyboard layout', () => {
  it('has 6 rows of keys that all fit in 15 units', () => {
    expect(PREVIEW_KEYS.length).toBeGreaterThan(70);
    expect(PREVIEW_KEYS.every((key) => key.x + key.w <= 15.0001)).toBe(true);
    expect(PREVIEW_KEYS.every((key) => key.cx > 0 && key.cx < 1 && key.cy > 0 && key.cy < 1)).toBe(true);
  });
});

describe.each(EFFECTS)('lighting effect $label', ({ kind }) => {
  it.each([0, 0.25, 0.5, 0.99])('draws without error at t=%s, with finite numbers', (t) => {
    for (const rainbow of [false, true]) {
      const calls = draw(kind, t, settings({ rainbow, direction: 2 }));
      expect(calls.length).toBeGreaterThan(PREVIEW_KEYS.length);
      expect(numbersIn(calls).every(Number.isFinite)).toBe(true);
    }
  });

  it.each([0, 1, 2, 3, 4, 5])('ends where it starts at speed %s, so the loop has no jump', (speed) => {
    const s = settings({ speed, direction: 3 as LightDirection });
    expect(sameDrawing(draw(kind, 0, s), draw(kind, 1, s))).toBe(true);
  });
});

describe('lighting brightness and colour', () => {
  it('draws nothing lit for the off effect', () => {
    const lit = draw('off', 0.3, settings()).filter(([name, value]) => name === 'set:fillStyle' && String(value).startsWith('rgb('));
    expect(lit).toHaveLength(0);
  });

  it('lights every key for the static effect', () => {
    const lit = draw('static', 0, settings()).filter(([name, value]) => name === 'set:fillStyle' && String(value).startsWith('rgb('));
    expect(lit).toHaveLength(PREVIEW_KEYS.length);
  });

  it('is darker at low brightness', () => {
    const channel = (brightness: number) => {
      const call = draw('static', 0, settings({ color: '#ffffff', brightness })).find(([name, value]) => name === 'set:fillStyle' && String(value).startsWith('rgb('));
      return Number(String(call?.[1]).match(/\d+/)?.[0]);
    };
    expect(channel(1)).toBeLessThan(channel(5));
  });
});
