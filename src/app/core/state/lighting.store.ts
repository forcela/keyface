import { Injectable, signal } from '@angular/core';
import { DEFAULT_LIGHTING, LightingPreset, LightingSettings } from '@core/lighting/lighting.model';

/** The backlight settings the user is editing. Nothing is sent to a keyboard from here. */
@Injectable({ providedIn: 'root' })
export class LightingStore {
  readonly settings = signal<LightingSettings>(DEFAULT_LIGHTING);

  patch(changes: Partial<LightingSettings>): void {
    this.settings.update((current) => ({ ...current, ...changes }));
  }

  applyPreset(preset: LightingPreset): void {
    this.patch(preset.settings);
  }
}
