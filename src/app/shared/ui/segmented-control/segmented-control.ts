import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface SegmentOption<T> {
  value: T;
  label: string;
}

/** Turns a `{ value: label }` record into options, keeping the record's order. */
export function segmentsOf<T extends string>(labels: Record<T, string>): SegmentOption<T>[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}

@Component({
  selector: 'ss-segmented-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-1.5">
      @if (label()) {
        <span class="text-[13px] font-medium">{{ label() }}</span>
      }
      <div
        class="flex gap-0.5 rounded-[10px] border border-line bg-sunk p-[3px]"
        [class.flex-wrap]="wrap()"
        role="group"
        [attr.aria-label]="label() || null"
      >
        @for (option of options(); track option.value) {
          <button
            type="button"
            [class]="buttonClass(option.value === value())"
            [attr.aria-pressed]="option.value === value()"
            (click)="value.set(option.value)"
          >
            {{ option.label }}
          </button>
        }
      </div>
    </div>
  `,
})
export class SegmentedControl<T> {
  readonly label = input('');
  readonly options = input.required<readonly SegmentOption<T>[]>();
  readonly value = model.required<T>();
  /** Lets many options wrap onto two lines instead of squeezing. */
  readonly wrap = input(false);

  protected buttonClass(active: boolean): string {
    const base = 'flex-1 cursor-pointer rounded-[7px] px-2 py-1.5 text-[13px] font-medium whitespace-nowrap';
    const state = active ? 'bg-surface text-fg shadow-[0_1px_2px_rgb(0_0_0/0.12),0_0_0_1px_var(--line)]' : 'text-muted';
    return `${base} ${state}${this.wrap() ? ' basis-[30%]' : ''}`;
  }
}
