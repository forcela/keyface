import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon, IconName } from '../icon/icon';

@Component({
  selector: 'kf-icon-button',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="grid size-[26px] shrink-0 cursor-pointer place-items-center rounded-[7px] text-muted hover:bg-line hover:text-fg disabled:cursor-default disabled:opacity-25"
      [attr.aria-label]="label()"
      [disabled]="disabled()"
      (click)="pressed.emit()"
    >
      <kf-icon [name]="icon()" />
    </button>
  `,
})
export class IconButton {
  readonly icon = input.required<IconName>();
  /** Accessible name, also the tooltip. */
  readonly label = input.required<string>();
  readonly disabled = input(false);
  readonly pressed = output();
}
