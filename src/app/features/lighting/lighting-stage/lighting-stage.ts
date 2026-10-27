import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, viewChild } from '@angular/core';
import { KeyboardService } from '@core/device/keyboard.service';
import { drawKeyboardLighting } from '@core/lighting/effect-renderer';
import { findEffect } from '@core/lighting/lighting.model';
import { AnimationClock } from '@core/rendering/animation-clock';
import { LightingStore } from '@core/state/lighting.store';

/** How long the preview takes to go round once. */
const LOOP_MS = 4000;

/** Big preview of the keyboard lit by the chosen effect. */
@Component({
  selector: 'kf-lighting-stage',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="sticky top-4 grid justify-items-center gap-4 rounded-[22px] border border-line bg-[radial-gradient(120%_90%_at_30%_0%,var(--stage-from)_0%,var(--stage-to)_70%)] px-5 pt-6 pb-5 max-[900px]:static"
      aria-label="Aperçu de l'éclairage"
    >
      <header class="grid justify-items-center gap-0.5 text-center">
        <h2 class="m-0 text-xs font-semibold tracking-[.04em] text-muted uppercase">Aperçu</h2>
        <p class="m-0 text-sm">Voici l'éclairage de ton clavier.</p>
      </header>
      <div class="w-full max-w-[560px] rounded-[20px] bg-[linear-gradient(165deg,#2c2d31,#1d1e21_60%)] p-3.5 shadow-[0_30px_50px_-30px_rgb(0_0_0/0.55)]">
        <canvas
          #canvas
          class="block aspect-[600/260] w-full rounded-xl"
          width="600"
          height="260"
          [attr.aria-label]="'Aperçu de l’effet ' + (current()?.label ?? '')"
        ></canvas>
      </div>
      <p class="m-0 max-w-[48ch] text-center text-xs text-muted">
        <b class="font-semibold text-fg">{{ current()?.label }}</b> · Aperçu approximatif : le dessin du clavier est
        simplifié et les vrais effets peuvent différer un peu.
      </p>
    </section>
  `,
})
export class LightingStage {
  private readonly keyboard = inject(KeyboardService);
  private readonly lighting = inject(LightingStore);
  private readonly clock = inject(AnimationClock);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  protected readonly current = computed(() =>
    findEffect(this.keyboard.profile().capabilities.backlight?.effects ?? [], this.lighting.settings().effect),
  );

  constructor() {
    effect(() => {
      const context = this.canvas().nativeElement.getContext('2d');
      const effectInUse = this.current();
      if (!context || !effectInUse) return;
      const t = (this.clock.now() / LOOP_MS) % 1;
      drawKeyboardLighting(context, t, effectInUse.kind, this.lighting.settings(), 600, 260);
    });
  }
}
