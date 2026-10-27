import { readClock } from '../clock';
import { createLayer } from './layer-factory';
import { containsPoint, layerText } from './layer-geometry';

describe('layer-geometry', () => {
  const data = { clock: readClock(new Date(2026, 9, 27, 14, 30)), battery: 78 };

  describe('layerText', () => {
    it('shows the clock time for a time layer', () => {
      expect(layerText(createLayer('time'), data)).toBe('14:30');
    });

    it('shows the typed text, upper-cased on request', () => {
      expect(layerText(createLayer('text', { text: 'chill' }), data)).toBe('chill');
      expect(layerText(createLayer('text', { text: 'chill', uppercase: true }), data)).toBe('CHILL');
    });

    it('formats the date by the chosen format', () => {
      expect(layerText(createLayer('date', { format: 'numeric' }), data)).toBe('27/10');
    });
  });

  describe('containsPoint', () => {
    const rect = { x: 10, y: 10, w: 20, h: 10 };

    it('is true inside and on the edges', () => {
      expect(containsPoint(rect, 15, 15)).toBe(true);
      expect(containsPoint(rect, 10, 10)).toBe(true);
      expect(containsPoint(rect, 30, 20)).toBe(true);
    });

    it('is false outside', () => {
      expect(containsPoint(rect, 9, 15)).toBe(false);
      expect(containsPoint(rect, 15, 21)).toBe(false);
    });

    it('widens the box by the margin', () => {
      expect(containsPoint(rect, 8, 15, 3)).toBe(true);
      expect(containsPoint(rect, 5, 15, 3)).toBe(false);
    });
  });
});
