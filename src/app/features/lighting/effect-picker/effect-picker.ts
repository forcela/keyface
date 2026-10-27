import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, viewChildren } from '@angular/core';
import { KeyboardService } from '@core/device/keyboard.service';
import { drawKeyboardLighting } from '@core/lighting/effect-renderer';
import { AnimationClock } from '@core/rendering/animation-clock';
import { LightingStore } from '@core/state/lighting.store';

const LOOP_MS = 4000;
/** Thumbnails redraw ten times a second: smooth enough, light enough for twenty of them. */
const THUMB_STEP_MS = 100;

/** One card per effect, each with a small animated preview. */
@Component({
  selector: 'kf-effect-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-2 gap-2 min-[560px]:grid-cols-3">
      @for (item of effects(); track item.id) {
        <button
          type="button"
          class="grid cursor-pointer gap-1.5 rounded-xl border p-1.5 pb-2 text-left text-fg"
          [class]="item.id === lighting.settings().effect ? 'border-fg bg-surface shadow-[0_0_0_1px_var(--fg)]' : 'border-line bg-sunk'"
          [attr.aria-pressed]="item.id === lighting.settings().effect"
          (click)="lighting.patch({ effect: item.id })"
        >
          <canvas
            #thumb
            class="block aspect-[150/66] w-full rounded-lg bg-black"
            width="150"
            height="66"
            [attr.data-id]="item.id"
            aria-hidden="true"
          ></canvas>
          <span class="text-[13px] leading-tight font-semibold">{{ item.label }}</span>
        </button>
      }
    </div>
  `,
})
export class EffectPicker {
  protected readonly lighting = inject(LightingStore);
  private readonly keyboard = inject(KeyboardService);
  private readonly clock = inject(AnimationClock);
  private readonly thumbs = viewChildren<ElementRef<HTMLCanvasElement>>('thumb');

  protected readonly effects = computed(() => this.keyboard.profile().capabilities.backlight?.effects ?? []);
  private readonly step = computed(() => Math.floor(this.clock.now() / THUMB_STEP_MS));

  constructor() {
    effect(() => {
      const t = ((this.step() * THUMB_STEP_MS) / LOOP_MS) % 1;
      const settings = this.lighting.settings();
      const effects = this.effects();
      for (const thumb of this.thumbs()) {
        const item = effects.find((candidate) => candidate.id === Number(thumb.nativeElement.dataset['id']));
        const context = thumb.nativeElement.getContext('2d');
        if (item && context) drawKeyboardLighting(context, t, item.kind, { ...settings, effect: item.id }, 150, 66);
      }
    });
  }
}
