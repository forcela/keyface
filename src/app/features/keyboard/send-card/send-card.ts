import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { KeyboardService, SendKind } from '@core/device/keyboard.service';
import { ViewStore } from '@core/state/view.store';
import { Button } from '@shared/ui/button/button';
import { SwitchField } from '@shared/ui/switch-field/switch-field';

const WHAT: Record<SendKind, { button: string; confirm: string }> = {
  screen: {
    button: 'Envoyer à mon clavier',
    confirm: 'L’animation va être écrite dans la mémoire du clavier. Garde le câble branché et ne ferme pas la page. Seul l’écran est modifié : jamais les touches ni la disposition.',
  },
  lighting: {
    button: 'Appliquer l’éclairage',
    confirm: 'Le réglage d’éclairage va être écrit dans le clavier. Garde le câble branché et ne ferme pas la page. Seul l’éclairage est modifié : jamais les touches ni la disposition.',
  },
};

/**
 * The one-click send flow. It is a single bar pinned to the bottom of the screen, so it stays in
 * sight next to the preview and next to the settings without being shown twice.
 */
@Component({
  selector: 'kf-send-card',
  imports: [Button, SwitchField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sticky bottom-4 z-10 mt-5 block' },
  templateUrl: './send-card.html',
})
export class SendCard {
  protected readonly keyboard = inject(KeyboardService);
  private readonly view = inject(ViewStore);

  protected readonly kind = computed<SendKind>(() => this.view.mode());
  protected readonly buttonLabel = computed(() => WHAT[this.kind()].button);
  protected readonly confirmText = computed(() => WHAT[this.pendingKind()].confirm);
  protected readonly pendingKind = computed<SendKind>(() => this.keyboard.pending() ?? this.kind());

  protected readonly layoutLabel = computed(() => {
    const { name, confirmedLayouts } = this.keyboard.profile();
    return `Mon clavier est bien un ${name} en disposition ${confirmedLayouts.map((l) => l.toUpperCase()).join(' / ')} (pas ANSI)`;
  });

  protected readonly percent = computed(() => {
    const { done, total } = this.keyboard.status();
    return total > 0 ? Math.round((done / total) * 100) : 0;
  });

  protected readonly hint = computed(() => {
    const ready = this.keyboard.readyKeyboard();
    return ready
      ? `${ready.model ?? ready.name} connecté. Envoie quand tu es prêt.`
      : 'Quand tu es prêt : branche ton clavier en USB (mode filaire) puis envoie.';
  });
}
