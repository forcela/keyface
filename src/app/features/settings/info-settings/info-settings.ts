import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StudioStore } from '@core/state/studio.store';
import { PanelSection } from '@shared/ui/panel-section/panel-section';
import { RangeField } from '@shared/ui/range-field/range-field';
import { SwitchField } from '@shared/ui/switch-field/switch-field';

@Component({
  selector: 'ss-info-settings',
  imports: [PanelSection, SwitchField, RangeField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ss-panel-section title="Infos">
      <ss-switch-field label="Heure et date" [(checked)]="studio.showClock" />
      <ss-switch-field label="Batterie" [(checked)]="studio.showBattery" />
      <ss-range-field
        label="Niveau dessiné"
        [max]="100"
        [format]="percent"
        [(value)]="studio.battery"
      />
      <p class="m-0 text-xs text-muted">
        L'heure et la batterie sont dessinées dans l'animation, donc figées au moment de l'export. Le
        clavier ne dit pas à l'animation si Verr. Maj est activé : ces états en direct ne sont visibles
        que sur sa page d'origine (Fn + Suppr).
      </p>
    </ss-panel-section>
  `,
})
export class InfoSettings {
  protected readonly studio = inject(StudioStore);
  protected readonly percent = (value: number) => `${value} %`;
}
