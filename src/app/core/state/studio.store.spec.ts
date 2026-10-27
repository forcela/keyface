import { TestBed } from '@angular/core/testing';
import { DecodedImage } from '@core/render/frame.model';
import { themeById } from '@core/render/themes/themes.registry';
import { DELAY_LIMITS, FRAME_LIMITS, StudioStore } from './studio.store';

describe('StudioStore', () => {
  let store: StudioStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(StudioStore);
  });

  it('starts on the minimal style with its own loop', () => {
    expect(store.theme()).toBe('minimal');
    expect(store.frames()).toBe(themeById('minimal').defaults.frames);
    expect(store.delay()).toBe(themeById('minimal').defaults.delay);
  });

  it('switches to the loop timing of the chosen style', () => {
    store.selectTheme('lofi');
    expect(store.theme()).toBe('lofi');
    expect(store.frames()).toBe(themeById('lofi').defaults.frames);
    expect(store.delay()).toBe(themeById('lofi').defaults.delay);
  });

  it('keeps the timing of a custom GIF when going back to the Gen Z style', () => {
    store.patch('genz', { image: { frames: [], frameDelayMs: 50 } as DecodedImage });
    store.setLoop(30, 50);
    store.selectTheme('genz');
    expect(store.frames()).toBe(30);
    expect(store.delay()).toBe(50);
  });

  describe('setLoop', () => {
    it('clamps frames to the keyboard limits', () => {
      store.setLoop(1, 100);
      expect(store.frames()).toBe(FRAME_LIMITS.min);
      store.setLoop(10_000, 100);
      expect(store.frames()).toBe(FRAME_LIMITS.max);
    });

    it('clamps the delay and rounds it to 10 ms', () => {
      store.setLoop(24, 1);
      expect(store.delay()).toBe(DELAY_LIMITS.min);
      store.setLoop(24, 93);
      expect(store.delay()).toBe(90);
      store.setLoop(24, 5000);
      expect(store.delay()).toBe(DELAY_LIMITS.max);
    });

    it('computes the loop length in seconds', () => {
      store.setLoop(50, 100);
      expect(store.loopSeconds()).toBe(5);
    });
  });

  it('patch updates one style without touching the others', () => {
    const before = store.options();
    store.patch('lofi', { title: 'new title' });
    expect(store.options().lofi.title).toBe('new title');
    expect(store.options().minimal).toBe(before.minimal);
    expect(store.options().genz).toBe(before.genz);
  });
});
