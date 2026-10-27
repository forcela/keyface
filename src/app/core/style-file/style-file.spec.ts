import { createLayer } from '@core/render/layers/layer-factory';
import { Layer } from '@core/render/layers/layer.model';
import { StyleFileError, parseStyle, restoreLayers, serializeStyle } from './style-file';

/** Ids are reassigned on load, so comparisons ignore them. */
const withoutId = (layer: Layer): Omit<Layer, 'id'> => {
  const copy: Partial<Layer> = { ...layer };
  delete copy.id;
  return copy as Omit<Layer, 'id'>;
};

const file = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({ app: 'keyface', version: 1, frames: 48, delay: 80, layers: [], ...overrides });

describe('style-file', () => {
  describe('round trip', () => {
    it('restores what it saved', () => {
      const layers: Layer[] = [
        createLayer('background', { mode: 'gradient', color: '#112233' }),
        createLayer('time', { x: 30, y: 40, size: 20, font: 'mono' }),
        createLayer('battery', { style: 'ring', scale: 1.5 }),
        createLayer('mascot', { mascot: 'frog', scale: 0.5 }),
      ];
      const parsed = parseStyle(serializeStyle(layers, 60, 90));

      expect(parsed.frames).toBe(60);
      expect(parsed.delay).toBe(90);
      expect(parsed.layers.map(withoutId)).toEqual(layers.map(withoutId));
    });

    it('assigns fresh ids, so a loaded style never collides with existing layers', () => {
      const layers = [createLayer('background'), createLayer('text')];
      const restored = parseStyle(serializeStyle(layers, 48, 80)).layers;
      expect(restored.some((layer) => layers.some((original) => original.id === layer.id))).toBe(false);
    });
  });

  describe('parseStyle', () => {
    it('rejects text that is not JSON', () => {
      expect(() => parseStyle('not json')).toThrow(StyleFileError);
    });

    it('rejects JSON from another app', () => {
      expect(() => parseStyle(JSON.stringify({ app: 'other', layers: [] }))).toThrow(StyleFileError);
    });

    it('rejects a file without layers', () => {
      expect(() => parseStyle(file({ layers: 'nope' }))).toThrow(StyleFileError);
    });

    it('clamps frames and delay to what the keyboard accepts', () => {
      const parsed = parseStyle(file({ frames: 9999, delay: 1 }));
      expect(parsed.frames).toBe(140);
      expect(parsed.delay).toBe(20);
    });

    it('leaves frames and delay undefined when absent', () => {
      const parsed = parseStyle(JSON.stringify({ app: 'keyface', layers: [] }));
      expect(parsed.frames).toBeUndefined();
      expect(parsed.delay).toBeUndefined();
    });
  });

  describe('restoreLayers (untrusted input)', () => {
    it('drops unknown layer types and non-objects', () => {
      const layers = restoreLayers([{ type: 'background' }, { type: 'virus' }, 42, null, 'x', { type: 'text' }]);
      expect(layers.map((layer) => layer.type)).toEqual(['background', 'text']);
    });

    it('guarantees a background at the back', () => {
      expect(restoreLayers([{ type: 'text' }]).map((layer) => layer.type)).toEqual(['background', 'text']);
      expect(restoreLayers([]).map((layer) => layer.type)).toEqual(['background']);
    });

    it('fills missing fields with defaults', () => {
      const [, time] = restoreLayers([{ type: 'background' }, { type: 'time', x: 10 }]);
      expect(time).toMatchObject({ type: 'time', x: 10, size: 38, font: 'inter' });
    });

    it('falls back to the default for values outside the allowed set', () => {
      const [, mascot, battery, text] = restoreLayers([
        { type: 'background' },
        { type: 'mascot', mascot: 'dragon', scale: 3 },
        { type: 'battery', style: 'neon', scale: 99 },
        { type: 'text', font: 'comic-sans', weight: 900, animation: 'explode' },
      ]);
      expect(mascot).toMatchObject({ mascot: 'typing', scale: 1 });
      expect(battery).toMatchObject({ style: 'pill', scale: 1 });
      expect(text).toMatchObject({ font: 'inter', weight: 600, animation: 'none' });
    });

    it('ignores values of the wrong type', () => {
      const [, text] = restoreLayers([{ type: 'background' }, { type: 'text', x: '10', text: 5, visible: 'yes' }]);
      expect(text).toMatchObject({ x: 64, text: 'Salut', visible: true });
    });

    it('drops fields it does not know', () => {
      const [, text] = restoreLayers([{ type: 'background' }, { type: 'text', evil: 'x' }]);
      expect(text).not.toHaveProperty('evil');
    });

    it('only accepts images embedded as data URLs', () => {
      const [, remote, embedded] = restoreLayers([
        { type: 'background' },
        { type: 'image', src: 'https://example.com/a.gif' },
        { type: 'image', src: 'data:image/png;base64,AAAA' },
      ]);
      expect(remote).toMatchObject({ src: null });
      expect(embedded).toMatchObject({ src: 'data:image/png;base64,AAAA' });
    });
  });
});
