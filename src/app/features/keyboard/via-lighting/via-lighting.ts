import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { KeyboardService } from '@core/device/keyboard.service';
import { channelSupports } from '@core/device/via/via-lighting';
import { LIGHTING_CHANNELS, LightingChannelId } from '@core/device/via/via-protocol';
import { Button } from '@shared/ui/button/button';
import { ColorField } from '@shared/ui/color-field/color-field';
import { RangeField } from '@shared/ui/range-field/range-field';
import { SwitchField } from '@shared/ui/switch-field/switch-field';

const percent = (value: number) => `${Math.round((value / 255) * 100)} %`;

/**
 * Experimental backlight controls for a VIA keyboard. A change lasts until the keyboard is unplugged,
 * unless the user stores it with "Enregistrer sur le clavier".
 */
@Component({
  selector: 'kf-via-lighting',
  imports: [Button, ColorField, RangeField, SwitchField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './via-lighting.html',
})
export class ViaLighting {
  readonly keyboardId = input.required<string>();
  /** Lighting kinds that answered when the keyboard was read. */
  readonly kinds = input.required<readonly LightingChannelId[]>();

  protected readonly service = inject(KeyboardService);
  protected readonly percent = percent;

  protected readonly choices = computed(() => LIGHTING_CHANNELS.filter((c) => this.kinds().includes(c.id)));
  protected readonly chosen = signal<number | null>(null);
  protected readonly channel = computed(() => this.chosen() ?? this.choices()[0]?.channel ?? 0);

  protected readonly brightness = signal(200);
  protected readonly speed = signal(128);
  protected readonly color = signal('#ff0000');
  protected readonly changeEffect = signal(false);
  protected readonly effect = signal(1);

  protected readonly hasColor = computed(() => channelSupports(this.channel(), 'color'));
  protected readonly hasSpeed = computed(() => channelSupports(this.channel(), 'speed'));

  protected pick(event: Event): void {
    this.chosen.set(+(event.target as HTMLSelectElement).value);
  }

  protected apply(save: boolean): void {
    void this.service.applyViaLighting(
      this.keyboardId(),
      this.channel(),
      {
        brightness: this.brightness(),
        color: this.hasColor() ? this.color() : undefined,
        speed: this.hasSpeed() ? this.speed() : undefined,
        effect: this.changeEffect() ? this.effect() : undefined,
      },
      save,
    );
  }
}
