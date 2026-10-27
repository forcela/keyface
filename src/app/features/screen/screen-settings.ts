import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { StudioStore } from '@core/state/studio.store';
import { Editor } from '@features/editor/editor';
import { ExportSettings } from '@features/settings/export-settings/export-settings';
import { InfoSettings } from '@features/settings/info-settings/info-settings';
import { ThemePicker } from '@features/settings/theme-picker/theme-picker';
import { ThemeSettings } from '@features/settings/theme-settings/theme-settings';
import { PanelSection } from '@shared/ui/panel-section/panel-section';

/** Everything to set up the screen: style, its settings or the editor, info, animation and export. */
@Component({
  selector: 'kf-screen-settings',
  imports: [PanelSection, ThemePicker, ThemeSettings, Editor, InfoSettings, ExportSettings],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kf-panel-section title="Style">
      <kf-theme-picker />
    </kf-panel-section>
    @if (custom()) {
      <kf-editor />
    } @else {
      <kf-theme-settings />
    }
    <kf-info-settings />
    <kf-export-settings />
  `,
})
export class ScreenSettings {
  private readonly studio = inject(StudioStore);
  protected readonly custom = computed(() => this.studio.theme() === 'custom');
}
