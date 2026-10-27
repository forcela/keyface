let context: OffscreenCanvasRenderingContext2D | null = null;

/** A detached context for measuring text outside any drawing (hit-testing, layout). */
export function measureContext(): OffscreenCanvasRenderingContext2D {
  context ??= new OffscreenCanvas(1, 1).getContext('2d');
  if (!context) throw new Error('Canvas 2D is not available in this browser.');
  return context;
}
