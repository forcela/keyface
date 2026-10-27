import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One titled block of the settings panel. Sections are separated by a hairline. */
@Component({
  selector: 'ss-panel-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'grid gap-3.5 px-5 py-[18px] [&+&]:border-t [&+&]:border-line' },
  template: `
    <h2 class="m-0 text-xs font-semibold tracking-[.04em] text-muted uppercase">{{ title() }}</h2>
    <ng-content />
  `,
})
export class PanelSection {
  readonly title = input.required<string>();
}
