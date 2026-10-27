import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { COLOR_SWATCHES } from '@core/lighting/lighting.model';
import { LightingStore } from '@core/state/lighting.store';
import { ColorField } from '@shared/ui/color-field/color-field';
import { SwitchField } from '@shared/ui/switch-field/switch-field';

/** One-tap colours, any colour, and a rainbow switch. Dimmed when the effect chooses its own colours. */
@Component({
  selector: 'kf-color-picker',
  imports: [ColorField, SwitchField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!usesColor()) {
      <p class="m-0 text-[13px] font-medium">Cet effet choisit ses couleurs tout seul.</p>
    }
    <div class="grid gap-3" [class.opacity-40]="!usesColor()" [attr.inert]="usesColor() ? null : ''">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Couleurs rapides">
        @for (color of swatches; track color) {
          <button
            type="button"
            class="size-8 cursor-pointer rounded-full border-2"
            [class]="color === lighting.settings().color && !lighting.settings().rainbow ? 'border-fg' : 'border-line'"
            [style.background]="color"
            [attr.aria-label]="'Couleur ' + color"
            [attr.aria-pressed]="color === lighting.settings().color"
            (click)="lighting.patch({ color, rainbow: false })"
          ></button>
        }
      </div>
      <kf-color-field
        label="Autre couleur"
        [value]="lighting.settings().color"
        (valueChange)="lighting.patch({ color: $event, rainbow: false })"
      />
      <kf-switch-field
        label="Arc-en-ciel"
        [checked]="lighting.settings().rainbow"
        (checkedChange)="lighting.patch({ rainbow: $event })"
      />
    </div>
  `,
})
export class ColorPicker {
  protected readonly lighting = inject(LightingStore);
  protected readonly swatches = COLOR_SWATCHES;
  readonly usesColor = input(true);
}
