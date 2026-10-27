import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type ButtonVariant = 'solid' | 'ghost';

const VARIANTS: Record<ButtonVariant, string> = {
  solid: 'border-fg bg-fg text-bg',
  ghost: 'border-line-strong bg-transparent text-fg',
};

@Component({
  selector: 'kf-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.block]': 'block()' },
  template: `
    <button type="button" [class]="classes()" [disabled]="disabled()" (click)="pressed.emit()">
      <ng-content />
    </button>
  `,
})
export class Button {
  readonly variant = input<ButtonVariant>('solid');
  readonly small = input(false);
  /** Takes the full width of its container. */
  readonly block = input(false);
  readonly disabled = input(false);
  readonly pressed = output();

  protected readonly classes = computed(
    () =>
      `cursor-pointer border font-semibold disabled:cursor-progress disabled:opacity-50 ${VARIANTS[this.variant()]} ` +
      (this.small() ? 'rounded-[10px] px-3 py-[7px] text-[13px]' : 'rounded-xl px-4 py-2.5 text-sm') +
      (this.block() ? ' w-full' : ''),
  );
}
