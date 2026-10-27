import { createLayer } from '@core/render/layers/layer-factory';
import { Drag, dragTo, keyboardNudge, startResize } from './selection-drag';

describe('selection-drag', () => {
  describe('move', () => {
    const layer = createLayer('shape', { x: 50, y: 50 });
    const drag: Drag = { mode: 'move', id: layer.id, offsetX: 5, offsetY: -3 };

    it('keeps the grab offset', () => {
      expect(dragTo(drag, layer, 70, 40)).toEqual({ x: 65, y: 43 });
    });

    it('stays inside the screen', () => {
      expect(dragTo(drag, layer, 500, -500)).toEqual({ x: 128, y: 0 });
    });
  });

  describe('resize', () => {
    it('scales text size with the distance from the center', () => {
      const layer = createLayer('time', { x: 64, y: 64, size: 20 });
      const drag = startResize(layer, 84, 64); // grabbed 20 px from the center
      expect(dragTo(drag, layer, 104, 64)).toEqual({ size: 40 }); // twice as far
    });

    it('clamps text size', () => {
      const layer = createLayer('time', { x: 64, y: 64, size: 60 });
      const drag = startResize(layer, 74, 64);
      expect(dragTo(drag, layer, 200, 64)).toEqual({ size: 64 });
    });

    it('scales a battery in 0.1 steps within 0.5 to 2.5', () => {
      const layer = createLayer('battery', { x: 64, y: 64, scale: 1 });
      const drag = startResize(layer, 84, 64);
      expect(dragTo(drag, layer, 94, 64)).toEqual({ scale: 1.5 });
      expect(dragTo(drag, layer, 1000, 64)).toEqual({ scale: 2.5 });
    });

    it('snaps a mascot between its two sizes', () => {
      const layer = createLayer('mascot', { x: 64, y: 64 });
      const drag = startResize(layer, 84, 64);
      expect(dragTo(drag, layer, 70, 64)).toEqual({ scale: 0.5 });
      expect(dragTo(drag, layer, 90, 64)).toEqual({ scale: 1 });
    });

    it('sizes a shape symmetrically around its center', () => {
      const layer = createLayer('shape', { x: 64, y: 64 });
      const drag = startResize(layer, 80, 80);
      expect(dragTo(drag, layer, 94, 74)).toEqual({ width: 60, height: 20 });
    });
  });

  describe('keyboardNudge', () => {
    const layer = createLayer('text', { x: 10, y: 10 });

    it('moves by the step in the arrow direction', () => {
      expect(keyboardNudge(layer, 'ArrowRight', 5)).toEqual({ x: 15, y: 10 });
      expect(keyboardNudge(layer, 'ArrowUp', 1)).toEqual({ x: 10, y: 9 });
    });

    it('stays inside the screen', () => {
      expect(keyboardNudge(createLayer('text', { x: 0, y: 0 }), 'ArrowLeft', 5)).toEqual({ x: 0, y: 0 });
    });

    it('ignores other keys', () => {
      expect(keyboardNudge(layer, 'a', 1)).toBeNull();
    });
  });
});
