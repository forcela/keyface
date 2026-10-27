import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UploadVariant, VARIANTS } from '@core/device/ak820-protocol';
import { KeyboardService } from '@core/device/keyboard.service';
import { Button } from '@shared/ui/button/button';
import { SegmentOption, SegmentedControl } from '@shared/ui/segmented-control/segmented-control';

/** Protocol variant and a diagnostic to paste in an issue. Hidden until asked for. */
@Component({
  selector: 'kf-keyboard-advanced',
  imports: [SegmentedControl, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="rounded-[10px] border border-line bg-sunk px-3 py-2">
      <summary class="cursor-pointer text-[13px] font-medium">Avancé</summary>
      <div class="mt-3 grid gap-3">
        <kf-segmented-control label="Variante d'envoi" [options]="variants" [(value)]="keyboard.variant" />
        <p class="m-0 text-xs text-muted">
          Les projets de la communauté ne sont pas d'accord sur trois octets de la séquence d'envoi. Si
          l'écran ne change pas avec la variante A, essaie la B.
        </p>
        <pre class="m-0 max-h-40 overflow-auto rounded-lg bg-surface p-2 text-[11px] leading-snug whitespace-pre-wrap">{{ keyboard.diagnostic() }}</pre>
        <div class="flex items-center gap-2">
          <kf-button variant="ghost" [small]="true" (pressed)="copy()">Copier le diagnostic</kf-button>
          <span class="text-xs text-muted" role="status">{{ copied() }}</span>
        </div>
      </div>
    </details>
  `,
})
export class KeyboardAdvanced {
  protected readonly keyboard = inject(KeyboardService);
  protected readonly copied = signal('');
  protected readonly variants: SegmentOption<UploadVariant>[] = (Object.keys(VARIANTS) as UploadVariant[]).map(
    (value) => ({ value, label: VARIANTS[value].label }),
  );

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.keyboard.diagnostic());
      this.copied.set('Copié.');
    } catch {
      this.copied.set('Copie impossible : sélectionne le texte à la main.');
    }
  }
}
