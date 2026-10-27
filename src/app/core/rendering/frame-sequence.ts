import { Injectable, inject } from '@angular/core';
import { SCREEN_SIZE } from '@core/render/canvas.utils';
import { readClock } from '@core/render/clock';
import { StudioStore } from '@core/state/studio.store';
import { FrameRenderer } from './frame-renderer';

export type FrameVisitor = (canvas: OffscreenCanvas, index: number, total: number) => Promise<void> | void;

/**
 * Renders every frame of the current style, one after the other, on one reused canvas.
 * Export and keyboard upload both read frames through here, so they always get the same images.
 */
@Injectable({ providedIn: 'root' })
export class FrameSequence {
  private readonly renderer = inject(FrameRenderer);
  private readonly studio = inject(StudioStore);

  async forEachFrame(visit: FrameVisitor): Promise<void> {
    const canvas = new OffscreenCanvas(SCREEN_SIZE, SCREEN_SIZE);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is not available in this browser.');
    const theme = this.studio.theme();
    const total = this.studio.frames();
    // One reading of the clock for the whole loop, so every frame shows the same time.
    const clock = readClock();
    for (let index = 0; index < total; index++) {
      context.clearRect(0, 0, SCREEN_SIZE, SCREEN_SIZE);
      this.renderer.render(context, theme, index / total, clock);
      await visit(canvas, index, total);
    }
  }
}
