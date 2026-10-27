import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { StudioStore } from '@core/state/studio.store';
import { Editor } from '@features/editor/editor';
import { Help } from '@features/help/help';
import { REPO_URL } from '@features/help/help.constants';
import { ExportSettings } from '@features/settings/export-settings/export-settings';
import { InfoSettings } from '@features/settings/info-settings/info-settings';
import { ThemePicker } from '@features/settings/theme-picker/theme-picker';
import { ThemeSettings } from '@features/settings/theme-settings/theme-settings';
import { KeyboardPanel } from '@features/keyboard/keyboard-panel';
import { SendCard } from '@features/keyboard/send-card/send-card';
import { Stage } from '@features/stage/stage';
import { PanelSection } from '@shared/ui/panel-section/panel-section';

@Component({
  selector: 'kf-root',
  imports: [Stage, ThemePicker, ThemeSettings, Editor, InfoSettings, ExportSettings, KeyboardPanel, SendCard, Help, PanelSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  protected readonly repoUrl = REPO_URL;
  private readonly studio = inject(StudioStore);
  protected readonly custom = computed(() => this.studio.theme() === 'custom');
}
