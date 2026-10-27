import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DetectedKeyboard, hex } from '@core/device/keyboard-info';
import { KeyboardService } from '@core/device/keyboard.service';
import { LIGHTING_CHANNELS, LightingChannelId } from '@core/device/via/via-protocol';
import { Button } from '@shared/ui/button/button';
import { ViaLighting } from '../via-lighting/via-lighting';

const LIGHTING_LABELS = Object.fromEntries(LIGHTING_CHANNELS.map((c) => [c.id, c.label])) as Record<LightingChannelId, string>;

/** One detected keyboard: its name, what the page knows it can do, and, for VIA keyboards, what it reported. */
@Component({
  selector: 'kf-keyboard-card',
  imports: [Button, ViaLighting],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './keyboard-card.html',
})
export class KeyboardCard {
  readonly keyboard = input.required<DetectedKeyboard>();
  protected readonly service = inject(KeyboardService);

  /** `undefined`: not read yet. `null`: read, did not answer like VIA. */
  protected readonly via = computed(() => this.service.viaInfo()[this.keyboard().id]);

  protected readonly lighting = computed(() => {
    const info = this.via();
    return info ? info.lighting.map((id) => LIGHTING_LABELS[id]).join(', ') : '';
  });

  protected readonly firmware = computed(() => {
    const version = this.via()?.firmwareVersion;
    return version ? `0x${hex(version, 8)}` : 'non précisé';
  });
}
