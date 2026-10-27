import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { KeyboardService } from '@core/device/keyboard.service';
import { Button } from '@shared/ui/button/button';

/**
 * The one-click "send to my keyboard" flow. It is a single bar pinned to the bottom of the screen, so
 * it stays in sight next to the preview and next to the settings without being shown twice.
 */
@Component({
  selector: 'kf-send-card',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sticky bottom-4 z-10 mt-5 block' },
  templateUrl: './send-card.html',
})
export class SendCard {
  protected readonly keyboard = inject(KeyboardService);

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
