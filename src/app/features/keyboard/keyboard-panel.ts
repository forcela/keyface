import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { KeyboardService } from '@core/device/keyboard.service';
import { ViewStore } from '@core/state/view.store';
import { Button } from '@shared/ui/button/button';
import { PanelSection } from '@shared/ui/panel-section/panel-section';
import { SwitchField } from '@shared/ui/switch-field/switch-field';
import { KeyboardAdvanced } from './keyboard-advanced/keyboard-advanced';
import { KeyboardCard } from './keyboard-card/keyboard-card';

/** Which keyboards are connected, their state, the clock, and (on request) technical details. Sending lives in `kf-send-card`. */
@Component({
  selector: 'kf-keyboard-panel',
  imports: [PanelSection, Button, SwitchField, KeyboardAdvanced, KeyboardCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './keyboard-panel.html',
})
export class KeyboardPanel {
  protected readonly keyboard = inject(KeyboardService);
  protected readonly view = inject(ViewStore);
}
