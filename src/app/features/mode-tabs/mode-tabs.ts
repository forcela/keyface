import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { KeyboardService } from '@core/device/keyboard.service';
import { ViewMode, ViewStore } from '@core/state/view.store';
import { SegmentOption, SegmentedControl } from '@shared/ui/segmented-control/segmented-control';

/** Switches between the screen and the backlight. Only offers what the keyboard can do. */
@Component({
  selector: 'kf-mode-tabs',
  imports: [SegmentedControl],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (options().length > 1) {
      <kf-segmented-control [options]="options()" [(value)]="view.mode" />
    }
  `,
})
export class ModeTabs {
  protected readonly view = inject(ViewStore);
  private readonly keyboard = inject(KeyboardService);

  protected readonly options = computed<SegmentOption<ViewMode>[]>(() => {
    const { capabilities } = this.keyboard.profile();
    return [
      ...(capabilities.screen ? [{ value: 'screen' as const, label: 'Écran' }] : []),
      ...(capabilities.backlight ? [{ value: 'lighting' as const, label: 'Éclairage' }] : []),
    ];
  });

  constructor() {
    // A keyboard without the current feature sends the user back to one it has.
    effect(() => {
      const options = this.options();
      if (options.length > 0 && !options.some((option) => option.value === this.view.mode())) {
        this.view.mode.set(options[0].value);
      }
    });
  }
}
