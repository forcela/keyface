import { TEMPLATES, TemplateId, createLayer, layerDefaults, starterLayers } from './layer-factory';

describe('layer-factory', () => {
  it('gives every new layer a unique id', () => {
    const ids = new Set([createLayer('text').id, createLayer('text').id, createLayer('shape').id]);
    expect(ids.size).toBe(3);
  });

  it('applies overrides on top of the defaults', () => {
    const layer = createLayer('time', { size: 20, y: 10 });
    expect(layer.size).toBe(20);
    expect(layer.y).toBe(10);
    expect(layer.type).toBe('time');
  });

  it('does not share mutable defaults between layers', () => {
    const a = layerDefaults('mascot');
    a.x = 1;
    expect(layerDefaults('mascot').x).toBe(64);
  });

  describe.each(Object.keys(TEMPLATES) as TemplateId[])('template %s', (id) => {
    it('starts with a background', () => {
      expect(TEMPLATES[id]()[0].type).toBe('background');
    });

    it('builds fresh ids on every call', () => {
      const first = TEMPLATES[id]().map((layer) => layer.id);
      const second = TEMPLATES[id]().map((layer) => layer.id);
      expect(first.some((layerId) => second.includes(layerId))).toBe(false);
    });
  });

  it('starts first-time users with a background and a small sleeping cat', () => {
    const layers = starterLayers();
    expect(layers[0].type).toBe('background');
    const cat = layers.find((layer) => layer.type === 'mascot');
    expect(cat).toMatchObject({ mascot: 'sleeping', scale: 0.5 });
  });
});
