import { TestBed } from '@angular/core/testing';
import { EditorStore } from './editor.store';

describe('EditorStore', () => {
  let store: EditorStore;
  const types = () => store.layers().map((layer) => layer.type);

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(EditorStore);
    store.applyTemplate('blank');
  });

  it('starts blank: a background and a time', () => {
    expect(types()).toEqual(['background', 'time']);
  });

  describe('add', () => {
    it('puts a placed layer in front and selects it', () => {
      const shape = store.add('shape');
      expect(types().at(-1)).toBe('shape');
      expect(store.selectedId()).toBe(shape.id);
    });

    it('puts effects under every placed layer', () => {
      store.add('effect');
      expect(types()).toEqual(['background', 'effect', 'time']);
    });
  });

  describe('reorder', () => {
    it('moves a layer one step towards the front', () => {
      const text = store.add('text');
      const shape = store.add('shape');
      store.reorder(text.id, 1);
      expect(store.layers().slice(-2).map((layer) => layer.id)).toEqual([shape.id, text.id]);
    });

    it('never moves a layer under the background', () => {
      const time = store.layers()[1];
      store.reorder(time.id, -1);
      expect(types()).toEqual(['background', 'time']);
    });

    it('does nothing past the front', () => {
      const shape = store.add('shape');
      store.reorder(shape.id, 1);
      expect(store.layers().at(-1)?.id).toBe(shape.id);
    });
  });

  describe('remove', () => {
    it('removes a layer and clears the selection if it was selected', () => {
      const text = store.add('text');
      store.remove(text.id);
      expect(types()).toEqual(['background', 'time']);
      expect(store.selectedId()).toBeNull();
    });

    it('refuses to remove the background', () => {
      store.remove(store.layers()[0].id);
      expect(types()[0]).toBe('background');
    });
  });

  describe('duplicate', () => {
    it('inserts a copy right above the original, slightly offset', () => {
      const text = store.add('text');
      store.update(text.id, { x: 20, y: 20 });
      store.duplicate(text.id);
      const [original, copy] = store.layers().slice(-2);
      expect(original.id).toBe(text.id);
      expect(copy.id).not.toBe(text.id);
      expect(copy).toMatchObject({ type: 'text', x: 26, y: 26 });
      expect(store.selectedId()).toBe(copy.id);
    });

    it('does not duplicate the background', () => {
      store.duplicate(store.layers()[0].id);
      expect(types()).toEqual(['background', 'time']);
    });
  });

  describe('templates', () => {
    it('undoes the last template in one step', () => {
      store.add('shape');
      const before = store.layers();
      store.applyTemplate('minimal');
      expect(store.layers()).not.toBe(before);
      store.undoTemplate();
      expect(store.layers()).toBe(before);
      expect(store.beforeTemplate()).toBeNull();
    });

    it('does nothing on a second undo', () => {
      store.undoTemplate();
      const restored = store.layers();
      store.undoTemplate();
      expect(store.layers()).toBe(restored);
    });
  });

  it('update changes one layer only', () => {
    const text = store.add('text');
    store.update(text.id, { visible: false });
    expect(store.layers().find((layer) => layer.id === text.id)?.visible).toBe(false);
    expect(store.layers()[1].visible).toBe(true);
  });

  it('selected follows the selection', () => {
    expect(store.selected()).toBeNull();
    const text = store.add('text');
    expect(store.selected()?.id).toBe(text.id);
    store.select(null);
    expect(store.selected()).toBeNull();
  });
});
