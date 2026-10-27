import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ExportService } from '@core/export/export.service';
import { DELAY_LIMITS, FRAME_LIMITS, StudioStore } from '@core/state/studio.store';
import { Button } from '@shared/ui/button/button';
import { PanelSection } from '@shared/ui/panel-section/panel-section';
import { RangeField } from '@shared/ui/range-field/range-field';

@Component({
  selector: 'ss-export-settings',
  imports: [PanelSection, RangeField, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ss-panel-section title="Animation">
      <div class="grid grid-cols-2 gap-3">
        <ss-range-field
          label="Images"
          [min]="limits.frames.min"
          [max]="limits.frames.max"
          [(value)]="studio.frames"
        />
        <ss-range-field
          label="Par image"
          [min]="limits.delay.min"
          [max]="limits.delay.max"
          [step]="limits.delay.step"
          [format]="milliseconds"
          [(value)]="studio.delay"
        />
      </div>
      <div class="flex flex-wrap gap-2">
        <ss-button [disabled]="busy()" (pressed)="exportFrames()">Exporter les images (.zip)</ss-button>
        <ss-button variant="ghost" [disabled]="busy()" (pressed)="exportStill()">Image fixe (.png)</ss-button>
      </div>
      <p class="m-0 min-h-6 text-xs text-muted" role="status">{{ status() }}</p>
    </ss-panel-section>
  `,
})
export class ExportSettings {
  protected readonly studio = inject(StudioStore);
  private readonly exporter = inject(ExportService);

  protected readonly limits = { frames: FRAME_LIMITS, delay: DELAY_LIMITS };
  protected readonly milliseconds = (value: number) => `${value} ms`;
  protected readonly busy = signal(false);
  protected readonly status = signal('');

  protected async exportFrames(): Promise<void> {
    await this.run(async () => {
      await this.exporter.exportFrames((done, total) => this.status.set(`Rendu ${done} / ${total}…`));
      return `ZIP prêt : ${this.studio.frames()} images à ${this.studio.delay()} ms.`;
    });
  }

  protected async exportStill(): Promise<void> {
    await this.run(async () => {
      await this.exporter.exportStill();
      return 'Image exportée, 128 × 128 px.';
    });
  }

  private async run(task: () => Promise<string>): Promise<void> {
    this.busy.set(true);
    try {
      this.status.set(await task());
    } catch {
      this.status.set("L'export n'a pas marché. Essaie dans Chrome ou Edge.");
    } finally {
      this.busy.set(false);
    }
  }
}
