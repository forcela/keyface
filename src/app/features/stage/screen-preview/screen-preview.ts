import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, input, viewChild } from '@angular/core';
import { SCREEN_SIZE } from '@core/render/canvas.utils';
import { AnimationClock } from '@core/rendering/animation-clock';
import { FrameRenderer } from '@core/rendering/frame-renderer';
import { isPlaced } from '@core/render/layers/layer.model';
import { EditorStore } from '@core/state/editor.store';
import { StudioStore } from '@core/state/studio.store';
import { SelectionOverlay } from '../selection-overlay/selection-overlay';

/**
 * The screen at its real resolution, scaled up with CSS. The preview advances frame by
 * frame at the export timing, so what you see is exactly what gets exported.
 */
@Component({
  selector: 'kf-screen-preview',
  imports: [SelectionOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative leading-none" [class]="dragging() ? 'touch-none' : 'touch-pan-y'">
      <canvas
        #screen
        class="block aspect-square max-w-full rounded-[3px]"
        [class]="editing() ? 'w-[min(320px,76vw)]' : 'w-[min(256px,70vw)]'"
        [style.image-rendering]="showPixels() ? 'pixelated' : 'auto'"
        [width]="size"
        [height]="size"
        aria-label="Aperçu de l'écran du clavier"
      ></canvas>
      @if (editing()) {
        <kf-selection-overlay />
      }
    </div>
  `,
})
export class ScreenPreview {
  readonly showPixels = input(false);

  private readonly studio = inject(StudioStore);
  private readonly editor = inject(EditorStore);
  private readonly clock = inject(AnimationClock);
  private readonly renderer = inject(FrameRenderer);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('screen');

  protected readonly size = SCREEN_SIZE;
  protected readonly editing = computed(() => this.studio.theme() === 'custom');
  /**
   * A finger on the preview only drags a layer once one is selected; before that it scrolls the page.
   * Blocking touch scrolling everywhere trapped phone users, who could only scroll beside the preview.
   */
  protected readonly dragging = computed(() => {
    const layer = this.editor.selected();
    return this.editing() && !!layer && isPlaced(layer);
  });
  private readonly frameIndex = computed(
    () => Math.floor(this.clock.now() / this.studio.delay()) % this.studio.frames(),
  );

  constructor() {
    effect(() => {
      const context = this.canvas().nativeElement.getContext('2d');
      if (!context) return;
      this.renderer.render(context, this.studio.theme(), this.frameIndex() / this.studio.frames(), this.clock.clock());
    });
  }
}
