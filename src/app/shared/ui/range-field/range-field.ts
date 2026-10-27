import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

@Component({
  selector: 'ss-range-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="grid gap-1.5">
      <span class="flex justify-between gap-2 text-[13px] font-medium">
        {{ label() }}
        <span class="font-normal text-muted tabular-nums">{{ display() }}</span>
      </span>
      <input
        type="range"
        class="w-full accent-fg"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [value]="value()"
        (input)="value.set(+$any($event.target).value)"
      />
    </label>
  `,
})
export class RangeField {
  readonly label = input.required<string>();
  readonly value = model.required<number>();
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  /** Formats the value shown next to the label, e.g. `(v) => v + ' ms'`. */
  readonly format = input<(value: number) => string>(String);

  protected readonly display = computed(() => this.format()(this.value()));
}
