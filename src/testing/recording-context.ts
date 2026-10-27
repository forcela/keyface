import { Ctx } from '@core/render/canvas.utils';

/** One call made on the context: `[method, ...arguments]`, or `['set:prop', value]` for assignments. */
export type RecordedCall = [string, ...unknown[]];

export interface Recorder {
  ctx: Ctx;
  calls: RecordedCall[];
}

const GRADIENT = { addColorStop: () => undefined };

/** Methods that must return something usable, like a real 2D context would. */
const RETURNS: Record<string, (args: unknown[]) => unknown> = {
  createLinearGradient: () => GRADIENT,
  createRadialGradient: () => GRADIENT,
  createConicGradient: () => GRADIENT,
  measureText: (args) => ({
    width: String(args[0]).length * 6,
    actualBoundingBoxAscent: 8,
    actualBoundingBoxDescent: 2,
  }),
};

/**
 * jsdom has no canvas. This stand-in records every drawing call so tests can check what a
 * renderer draws (and that its numbers are sane) without pixels.
 */
export function recordContext(): Recorder {
  const calls: RecordedCall[] = [];
  // Properties keep their value like on a real context, so `globalAlpha *= 0.5` works.
  const state: Record<string, unknown> = { globalAlpha: 1, lineWidth: 1 };
  const ctx = new Proxy({} as Record<string, unknown>, {
    get(_target, prop: string) {
      if (prop === 'canvas') return { width: 128, height: 128 };
      if (prop in state) return state[prop];
      return (...args: unknown[]) => {
        calls.push([prop, ...args]);
        return RETURNS[prop]?.(args);
      };
    },
    set(_target, prop: string, value: unknown) {
      state[prop] = value;
      calls.push([`set:${prop}`, value]);
      return true;
    },
  });
  return { ctx: ctx as unknown as Ctx, calls };
}

/** Calls with every number rounded, so float noise (sin(2π) ≈ -2e-16) does not matter. */
export function roundedCalls(calls: readonly RecordedCall[], digits = 2): string {
  const round = (value: unknown): unknown => (typeof value === 'number' ? +value.toFixed(digits) : value);
  return JSON.stringify(calls.map((call) => call.map(round)));
}

/** Every numeric argument of every call, to catch NaN and Infinity. */
export function numbersIn(calls: readonly RecordedCall[]): number[] {
  return calls.flatMap((call) => call.slice(1).filter((value): value is number => typeof value === 'number'));
}

/** Stand-in for `OffscreenCanvas`, which jsdom lacks and some renderers use for caching. */
export class FakeOffscreenCanvas {
  readonly recorder = recordContext();
  readonly canvas = this;
  constructor(
    readonly width: number,
    readonly height: number,
  ) {}
  getContext(): Ctx {
    return this.recorder.ctx;
  }
}
