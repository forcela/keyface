import { Injectable, computed, signal } from '@angular/core';
import { GENZ_DEFAULTS, GenzOptions } from '@core/render/themes/genz.theme';
import { LANDSCAPE_DEFAULTS, LandscapeOptions } from '@core/render/themes/landscape.theme';
import { LOFI_DEFAULTS, LofiOptions } from '@core/render/themes/lofi.theme';
import { MINIMAL_DEFAULTS, MinimalOptions } from '@core/render/themes/minimal.theme';
import { AURORA_DEFAULTS, AuroraOptions } from '@core/render/themes/aurora.theme';
import { BENTO_DEFAULTS, BentoOptions } from '@core/render/themes/bento.theme';
import { ThemeId } from '@core/render/themes/theme.model';
import { themeById } from '@core/render/themes/themes.registry';

export const FRAME_LIMITS = { min: 8, max: 140 } as const;
export const DELAY_LIMITS = { min: 20, max: 300, step: 10 } as const;

export interface ThemeOptions {
  minimal: MinimalOptions;
  landscape: LandscapeOptions;
  genz: GenzOptions;
  lofi: LofiOptions;
  aurora: AuroraOptions;
  bento: BentoOptions;
}

/** Global studio state: which style is shown, its settings and the animation loop. */
@Injectable({ providedIn: 'root' })
export class StudioStore {
  readonly theme = signal<ThemeId>('minimal');
  readonly frames = signal<number>(themeById('minimal').defaults.frames);
  readonly delay = signal<number>(themeById('minimal').defaults.delay);

  readonly showClock = signal(true);
  readonly showBattery = signal(true);
  /** Battery level drawn on screen: the keyboard cannot report the real one. */
  readonly battery = signal(78);

  readonly options = signal<ThemeOptions>({
    minimal: MINIMAL_DEFAULTS,
    landscape: LANDSCAPE_DEFAULTS,
    genz: GENZ_DEFAULTS,
    lofi: LOFI_DEFAULTS,
    aurora: AURORA_DEFAULTS,
    bento: BENTO_DEFAULTS,
  });

  readonly loopSeconds = computed(() => (this.frames() * this.delay()) / 1000);

  selectTheme(id: ThemeId): void {
    this.theme.set(id);
    // A custom GIF dictates its own timing; keep it.
    if (id === 'genz' && this.options().genz.image) return;
    const { frames, delay } = themeById(id).defaults;
    this.setLoop(frames, delay);
  }

  patch<K extends keyof ThemeOptions>(theme: K, changes: Partial<ThemeOptions[K]>): void {
    this.options.update((all) => ({ ...all, [theme]: { ...all[theme], ...changes } }));
  }

  setLoop(frames: number, delay: number): void {
    this.frames.set(Math.round(Math.min(FRAME_LIMITS.max, Math.max(FRAME_LIMITS.min, frames))));
    this.delay.set(Math.round(Math.min(DELAY_LIMITS.max, Math.max(DELAY_LIMITS.min, delay)) / 10) * 10);
  }
}
