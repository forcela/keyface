import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DetectedKeyboard, hex } from '@core/device/keyboard-info';
import { KeyboardService } from '@core/device/keyboard.service';
import { LIGHTING_CHANNELS, LightingChannelId } from '@core/device/via/via-protocol';
import { ViewStore } from '@core/state/view.store';
import { Button } from '@shared/ui/button/button';
import { ViaLighting } from '../via-lighting/via-lighting';

const LIGHTING_LABELS = Object.fromEntries(LIGHTING_CHANNELS.map((c) => [c.id, c.label])) as Record<LightingChannelId, string>;

/** One detected keyboard: its name and what it can do in plain words; technical details only when asked for. */
@Component({
  selector: 'kf-keyboard-card',
  imports: [Button, ViaLighting],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './keyboard-card.html',
})
export class KeyboardCard {
  readonly keyboard = input.required<DetectedKeyboard>();
  protected readonly service = inject(KeyboardService);
  protected readonly view = inject(ViewStore);

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

  protected readonly statusLabel = computed(() => {
    const { ready, model, via, lampArray } = this.keyboard();
    if (ready) return 'Prêt';
    if (model) return 'Incomplet';
    if (via) return 'Éclairage (essai)';
    return lampArray ? 'Détecté' : 'Non reconnu';
  });

  protected readonly statusClass = computed(() =>
    this.keyboard().ready ? 'bg-ok/15 text-ok' : 'bg-accent/15 text-accent',
  );

  /** What this keyboard can do, in words anyone understands. */
  protected readonly chips = computed(() => {
    const { profile, via } = this.keyboard();
    const chips: string[] = [];
    if (profile?.capabilities.backlight || (via && this.via()?.lighting.length)) chips.push('Rétroéclairage');
    const screen = profile?.capabilities.screen;
    if (screen) chips.push(`Écran ${screen.width} × ${screen.height}`);
    return chips;
  });
}
