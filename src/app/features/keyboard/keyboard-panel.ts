import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { KeyboardService } from '@core/device/keyboard.service';
import { Button } from '@shared/ui/button/button';
import { PanelSection } from '@shared/ui/panel-section/panel-section';
import { KeyboardAdvanced } from './keyboard-advanced/keyboard-advanced';

/** Which keyboards are connected, their state, the clock, and advanced options. Sending lives in `ss-send-card`. */
@Component({
  selector: 'ss-keyboard-panel',
  imports: [PanelSection, Button, KeyboardAdvanced],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './keyboard-panel.html',
})
export class KeyboardPanel {
  protected readonly keyboard = inject(KeyboardService);
}
