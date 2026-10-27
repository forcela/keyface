import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { StudioStore } from '@core/state/studio.store';
import { ScreenPreview } from './screen-preview/screen-preview';
import { KEY_CAPS } from './stage.constants';

/** Mock-up of the keyboard corner around the screen, with the live preview. */
@Component({
  selector: 'ss-stage',
  imports: [ScreenPreview],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stage.html',
})
export class Stage {
  private readonly studio = inject(StudioStore);

  protected readonly keyCaps = KEY_CAPS;
  protected readonly showPixels = signal(false);
  protected readonly editing = computed(() => this.studio.theme() === 'custom');
  protected readonly loopLabel = computed(
    () => `${this.studio.loopSeconds().toFixed(1).replace('.', ',')} s · ${this.studio.frames()} images`,
  );
}
