import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'kf-text-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="grid gap-1.5">
      <span class="text-[13px] font-medium">{{ label() }}</span>
      <input
        type="text"
        class="w-full rounded-[10px] border border-line bg-sunk px-[11px] py-[9px] text-sm font-medium text-fg focus:border-fg focus:outline-none"
        [maxLength]="maxLength()"
        [value]="value()"
        (input)="value.set($any($event.target).value)"
      />
    </label>
  `,
})
export class TextField {
  readonly label = input.required<string>();
  readonly value = model.required<string>();
  readonly maxLength = input(24);
}
