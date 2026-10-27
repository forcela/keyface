import { mod, pad2, rgba, seeded } from './canvas.utils';

describe('canvas.utils', () => {
  describe('seeded', () => {
    it('returns the same value for the same seed, so animations are identical frame to frame', () => {
      expect(seeded(7)).toBe(seeded(7));
    });

    it('stays in [0, 1)', () => {
      for (let seed = 0; seed < 200; seed++) {
        const value = seeded(seed);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('differs between seeds', () => {
      expect(seeded(1)).not.toBe(seeded(2));
    });
  });

  describe('mod', () => {
    it('wraps negative values into range', () => {
      expect(mod(-1, 5)).toBe(4);
      expect(mod(-11, 5)).toBe(4);
    });

    it('leaves in-range values alone', () => {
      expect(mod(3, 5)).toBe(3);
      expect(mod(5, 5)).toBe(0);
    });
  });

  it('pad2 pads single digits', () => {
    expect(pad2(4)).toBe('04');
    expect(pad2(12)).toBe('12');
  });

  it('rgba converts a hex color', () => {
    expect(rgba('#ff8000', 0.5)).toBe('rgba(255,128,0,0.5)');
  });
});
