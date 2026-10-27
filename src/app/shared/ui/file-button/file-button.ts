import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

let nextId = 0;

/** A styled button that opens the file picker. */
@Component({
  selector: 'ss-file-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label
      class="inline-flex cursor-pointer rounded-[10px] border border-line-strong px-3 py-[7px] text-[13px] font-semibold focus-within:outline-2 focus-within:outline-accent"
      [for]="id"
    >
      {{ label() }}
    </label>
    <input
      class="sr-only"
      type="file"
      [id]="id"
      [accept]="accept()"
      (change)="pick($event)"
    />
  `,
})
export class FileButton {
  readonly label = input.required<string>();
  readonly accept = input('');
  readonly picked = output<File>();

  protected readonly id = `ss-file-${nextId++}`;

  protected pick(event: Event): void {
    const field = event.target as HTMLInputElement;
    const file = field.files?.[0];
    if (file) this.picked.emit(file);
    // Allows picking the same file twice in a row.
    field.value = '';
  }
}
