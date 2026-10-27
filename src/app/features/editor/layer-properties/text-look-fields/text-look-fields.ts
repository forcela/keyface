import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TextualLayer } from '@core/render/layers/layer.model';
import { EditorStore } from '@core/state/editor.store';
import { ColorField } from '@shared/ui/color-field/color-field';
import { RangeField } from '@shared/ui/range-field/range-field';
import { SegmentedControl } from '@shared/ui/segmented-control/segmented-control';
import { SwitchField } from '@shared/ui/switch-field/switch-field';
import { FONTS, WEIGHTS } from '../layer-options.constants';

/** Typography settings shared by time, date and text layers. */
@Component({
  selector: 'ss-text-look-fields',
  imports: [SegmentedControl, RangeField, ColorField, SwitchField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ss-segmented-control label="Police" [options]="fonts" [value]="layer().font" (valueChange)="set({ font: $event })" />
    <ss-segmented-control label="Graisse" [options]="weights" [value]="layer().weight" (valueChange)="set({ weight: $event })" />
    <ss-range-field
      label="Taille"
      [min]="6"
      [max]="64"
      [format]="pixels"
      [value]="layer().size"
      (valueChange)="set({ size: $event })"
    />
    <ss-color-field label="Couleur" [value]="layer().color" (valueChange)="set({ color: $event })" />
    <ss-switch-field label="Ombre douce" [checked]="layer().shadow" (checkedChange)="set({ shadow: $event })" />
    <ss-switch-field label="Majuscules" [checked]="layer().uppercase" (checkedChange)="set({ uppercase: $event })" />
  `,
})
export class TextLookFields {
  readonly layer = input.required<TextualLayer>();

  private readonly editor = inject(EditorStore);
  protected readonly fonts = FONTS;
  protected readonly weights = WEIGHTS;
  protected readonly pixels = (value: number) => `${value} px`;

  protected set(changes: Partial<TextualLayer>): void {
    this.editor.update(this.layer().id, changes);
  }
}
