import { FakeOffscreenCanvas, numbersIn, recordContext, roundedCalls } from '../../../../testing/recording-context';
import { Ctx } from '../canvas.utils';
import { drawEffect, EffectKind, EFFECT_LABELS } from '../effects';
import { readClock } from '../clock';
import { FrameContext } from '../frame.model';
import { TEMPLATES, TemplateId } from '../layers/layer-factory';
import { AMBIANCES_LIST, drawScenery } from '../scenery';
import { MASCOT_LABELS, MascotKind } from '../sprites/mascots';
import { GENZ_DEFAULTS } from './genz.theme';
import { GENZ_PALETTES, GenzPalette } from './genz.constants';
import { LANDSCAPE_DEFAULTS, landscapeTheme } from './landscape.theme';
import { LOFI_DEFAULTS, lofiTheme } from './lofi.theme';
import { MINIMAL_DEFAULTS, minimalTheme } from './minimal.theme';
import { AURORA_DEFAULTS, auroraTheme } from './aurora.theme';
import { AURORA_COLORS, AuroraPalette } from './aurora.constants';
import { BENTO_DEFAULTS, bentoTheme } from './bento.theme';
import { genzTheme } from './genz.theme';
import { customTheme } from './custom.theme';

const frameAtT = (t: number, overrides: Partial<FrameContext> = {}): FrameContext => ({
  t,
  clock: readClock(new Date(2026, 9, 27, 14, 5)),
  battery: 78,
  showClock: true,
  showBattery: true,
  ...overrides,
});

const SAMPLE_TIMES = [0, 0.13, 0.5, 0.87, 0.99];

type Drawer = (c: Ctx, frame: FrameContext, label?: string) => void;

/** The two styles that only take a colour or palette and a label. */
const MODERN_STYLES: Record<'aurora' | 'bento', Drawer> = {
  aurora: (c, frame, label = AURORA_DEFAULTS.label) => auroraTheme.draw(c, frame, { ...AURORA_DEFAULTS, label }),
  bento: (c, frame, label = BENTO_DEFAULTS.label) => bentoTheme.draw(c, frame, { ...BENTO_DEFAULTS, label }),
};

/** Draws with a recording context and checks nothing throws and every number is finite. */
function expectSaneDrawing(draw: (ctx: ReturnType<typeof recordContext>['ctx'], t: number) => void): void {
  for (const t of SAMPLE_TIMES) {
    const { ctx, calls } = recordContext();
    expect(() => draw(ctx, t)).not.toThrow();
    expect(calls.length).toBeGreaterThan(0);
    expect(numbersIn(calls).every(Number.isFinite)).toBe(true);
  }
}

describe('ready-made styles', () => {
  beforeAll(() => {
    vi.stubGlobal('OffscreenCanvas', FakeOffscreenCanvas);
  });
  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('draws minimal, with and without halo, clock and battery', () => {
    for (const background of ['black', 'halo'] as const) {
      expectSaneDrawing((c, t) => minimalTheme.draw(c, frameAtT(t), { ...MINIMAL_DEFAULTS, background }));
    }
    expectSaneDrawing((c, t) =>
      minimalTheme.draw(c, frameAtT(t, { showClock: false, showBattery: false }), MINIMAL_DEFAULTS),
    );
  });

  it.each(AMBIANCES_LIST)('draws landscape in the %s ambiance', (ambiance) => {
    expectSaneDrawing((c, t) => landscapeTheme.draw(c, frameAtT(t), { ...LANDSCAPE_DEFAULTS, ambiance }));
  });

  it.each(Object.keys(MASCOT_LABELS) as MascotKind[])('draws the Gen Z style with the %s mascot', (mascot) => {
    for (const palette of Object.keys(GENZ_PALETTES) as GenzPalette[]) {
      expectSaneDrawing((c, t) => genzTheme.draw(c, frameAtT(t), { ...GENZ_DEFAULTS, mascot, palette }));
    }
  });

  it('draws Gen Z without a bubble', () => {
    expectSaneDrawing((c, t) => genzTheme.draw(c, frameAtT(t), { ...GENZ_DEFAULTS, bubble: '' }));
  });

  it('draws lo-fi, including an empty title', () => {
    expectSaneDrawing((c, t) => lofiTheme.draw(c, frameAtT(t), LOFI_DEFAULTS));
    expectSaneDrawing((c, t) => lofiTheme.draw(c, frameAtT(t), { ...LOFI_DEFAULTS, title: '' }));
  });

  it.each(Object.keys(AURORA_COLORS) as AuroraPalette[])('draws aurora in the %s palette', (palette) => {
    expectSaneDrawing((c, t) => auroraTheme.draw(c, frameAtT(t), { ...AURORA_DEFAULTS, palette }));
  });

  it.each(Object.keys(MODERN_STYLES) as (keyof typeof MODERN_STYLES)[])(
    'draws %s in every combination of clock, battery and level',
    (name) => {
      const draw = MODERN_STYLES[name];
      for (const showClock of [true, false]) {
        for (const showBattery of [true, false]) {
          for (const battery of [0, 10, 78, 100]) {
            expectSaneDrawing((c, t) => draw(c, frameAtT(t, { showClock, showBattery, battery })));
          }
        }
      }
      expectSaneDrawing((c, t) => draw(c, frameAtT(t, { showClock: false }), ''));
    },
  );

  it.each(Object.keys(TEMPLATES) as TemplateId[])('draws the custom style from the %s template', (id) => {
    expectSaneDrawing((c, t) => customTheme.draw(c, frameAtT(t), { layers: TEMPLATES[id](), images: new Map() }));
  });

  it('skips hidden layers', () => {
    const layers = TEMPLATES.minimal().map((layer) => ({ ...layer, visible: false }));
    const { ctx, calls } = recordContext();
    customTheme.draw(ctx, frameAtT(0), { layers, images: new Map() });
    // Only the black clear remains.
    expect(calls.filter(([name]) => name === 'fillText')).toEqual([]);
  });
});

describe('seamless loops', () => {
  const loops = (draw: (ctx: ReturnType<typeof recordContext>['ctx'], t: number) => void) => {
    const start = recordContext();
    const end = recordContext();
    draw(start.ctx, 0);
    draw(end.ctx, 1);
    return roundedCalls(start.calls) === roundedCalls(end.calls);
  };

  it.each(AMBIANCES_LIST)('the %s landscape ends where it starts', (ambiance) => {
    expect(loops((c, t) => drawScenery(c, t, ambiance))).toBe(true);
  });

  it.each(Object.keys(MODERN_STYLES) as (keyof typeof MODERN_STYLES)[])('the %s style ends where it starts', (name) => {
    expect(loops((c, t) => MODERN_STYLES[name](c, frameAtT(t)))).toBe(true);
  });

  it.each(Object.keys(EFFECT_LABELS) as EffectKind[])('the %s effect ends where it starts', (kind) => {
    expect(loops((c, t) => drawEffect(c, t, kind, '#ffffff', 24))).toBe(true);
  });
});
