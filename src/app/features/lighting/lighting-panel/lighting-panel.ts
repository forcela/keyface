import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { KeyboardService } from '@core/device/keyboard.service';
import {
  DIRECTION_LABELS,
  LIGHTING_PRESETS,
  LightDirection,
  findEffect,
} from '@core/lighting/lighting.model';
import { LightingStore } from '@core/state/lighting.store';
import { Button } from '@shared/ui/button/button';
import { PanelSection } from '@shared/ui/panel-section/panel-section';
import { RangeField } from '@shared/ui/range-field/range-field';
import { SegmentOption, SegmentedControl } from '@shared/ui/segmented-control/segmented-control';
import { ColorPicker } from '../color-picker/color-picker';
import { EffectPicker } from '../effect-picker/effect-picker';

const LEVELS = ['Très faible', 'Faible', 'Moyenne', 'Bonne', 'Forte', 'Max'];
const SPEEDS = ['Très lente', 'Lente', 'Normale', 'Vive', 'Rapide', 'Max'];

/** Everything to set up the backlight: moods, effect, colour, brightness, speed, direction. */
@Component({
  selector: 'kf-lighting-panel',
  imports: [PanelSection, Button, SegmentedControl, RangeField, EffectPicker, ColorPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lighting-panel.html',
})
export class LightingPanel {
  protected readonly lighting = inject(LightingStore);
  private readonly keyboard = inject(KeyboardService);

  protected readonly presets = LIGHTING_PRESETS;
  protected readonly effect = computed(() =>
    findEffect(this.keyboard.profile().capabilities.backlight?.effects ?? [], this.lighting.settings().effect),
  );
  protected readonly isOff = computed(() => this.effect()?.kind === 'off');
  protected readonly directions: SegmentOption<LightDirection>[] = ([0, 1, 2, 3] as const).map((value) => ({
    value,
    label: DIRECTION_LABELS[value],
  }));

  protected readonly levelLabel = (value: number) => LEVELS[value] ?? String(value);
  protected readonly speedLabel = (value: number) => SPEEDS[value] ?? String(value);
}
