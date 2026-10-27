import { ChangeDetectionStrategy, Component } from '@angular/core';
import { COMMUNITY_PROJECTS, DRIVER_URL, INSTALL_STEPS, SCREEN_FACTS } from './help.constants';

@Component({
  selector: 'ss-help',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './help.html',
})
export class Help {
  protected readonly driverUrl = DRIVER_URL;
  protected readonly steps = INSTALL_STEPS;
  protected readonly facts = SCREEN_FACTS;
  protected readonly projects = COMMUNITY_PROJECTS;
}
