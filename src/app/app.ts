import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ViewStore } from '@core/state/view.store';
import { Help } from '@features/help/help';
import { REPO_URL } from '@features/help/help.constants';
import { KeyboardPanel } from '@features/keyboard/keyboard-panel';
import { SendCard } from '@features/keyboard/send-card/send-card';
import { LightingPanel } from '@features/lighting/lighting-panel/lighting-panel';
import { LightingStage } from '@features/lighting/lighting-stage/lighting-stage';
import { ModeTabs } from '@features/mode-tabs/mode-tabs';
import { ScreenSettings } from '@features/screen/screen-settings';
import { Stage } from '@features/stage/stage';

@Component({
  selector: 'kf-root',
  imports: [Stage, LightingStage, ScreenSettings, LightingPanel, KeyboardPanel, SendCard, ModeTabs, Help],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  protected readonly repoUrl = REPO_URL;
  protected readonly view = inject(ViewStore);
}
