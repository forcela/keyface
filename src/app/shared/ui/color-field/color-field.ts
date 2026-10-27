import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'ss-color-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-1.5">
      <span class="text-[13px] font-medium">{{ label() }}</span>
      <label
        class="flex cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-sunk px-2 py-1.5 text-xs text-muted uppercase tabular-nums"
      >
        <input
          type="color"
          class="ss-color size-[26px] cursor-pointer rounded-full border-0 bg-transparent p-0"
          [value]="value()"
          [attr.aria-label]="label()"
          (input)="value.set($any($event.target).value)"
        />
        {{ value() }}
      </label>
    </div>
  `,
})
export class ColorField {
  readonly label = input.required<string>();
  readonly value = model.required<string>();
}
