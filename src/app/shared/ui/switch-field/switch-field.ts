import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'ss-switch-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium">
      {{ label() }}
      <input
        type="checkbox"
        class="ss-switch"
        [checked]="checked()"
        (change)="checked.set($any($event.target).checked)"
      />
    </label>
  `,
})
export class SwitchField {
  readonly label = input.required<string>();
  readonly checked = model.required<boolean>();
}
