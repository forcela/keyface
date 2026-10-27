import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  viewChildren,
} from '@angular/core';
import { ThemeId } from '@core/render/themes/theme.model';
import { THEMES } from '@core/render/themes/themes.registry';
import { AnimationClock } from '@core/rendering/animation-clock';
import { FrameRenderer } from '@core/rendering/frame-renderer';
import { StudioStore } from '@core/state/studio.store';

const THUMB_LOOP_MS = 3600;

/** One card per style, each with a small live thumbnail. */
@Component({
  selector: 'kf-theme-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-5 gap-1.5 max-[420px]:grid-cols-2">
      @for (theme of themes; track theme.id) {
        <button
          type="button"
          class="grid cursor-pointer gap-1.5 rounded-[14px] border bg-sunk p-1.5 pb-2 text-left text-fg"
          [class]="
            theme.id === studio.theme() ? 'border-fg bg-surface shadow-[0_0_0_1px_var(--fg)]' : 'border-line'
          "
          [attr.aria-pressed]="theme.id === studio.theme()"
          (click)="studio.selectTheme(theme.id)"
        >
          <canvas
            #thumb
            class="block aspect-square w-full rounded-lg bg-black"
            width="128"
            height="128"
            [attr.data-theme]="theme.id"
            aria-hidden="true"
          ></canvas>
          <span class="text-[13px] leading-tight font-semibold">{{ theme.name }}</span>
          <span class="text-[11px] leading-tight text-muted">{{ theme.description }}</span>
        </button>
      }
    </div>
  `,
})
export class ThemePicker {
  protected readonly studio = inject(StudioStore);
  protected readonly themes = THEMES;

  private readonly clock = inject(AnimationClock);
  private readonly renderer = inject(FrameRenderer);
  private readonly thumbs = viewChildren<ElementRef<HTMLCanvasElement>>('thumb');

  constructor() {
    effect(() => {
      // Thumbnails run on their own slow loop, independent of the current style's timing.
      const t = (this.clock.now() / THUMB_LOOP_MS) % 1;
      const clock = this.clock.clock();
      for (const thumb of this.thumbs()) {
        const context = thumb.nativeElement.getContext('2d');
        if (context) this.renderer.render(context, thumb.nativeElement.dataset['theme'] as ThemeId, t, clock);
      }
    });
  }
}
