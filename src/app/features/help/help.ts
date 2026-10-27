import { ChangeDetectionStrategy, Component } from '@angular/core';
import { COMMUNITY_PROJECTS, INSTALL_DISCLAIMER, INSTALL_STEPS, OFFICIAL_TOOLS, SCREEN_FACTS } from './help.constants';

@Component({
  selector: 'kf-help',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './help.html',
})
export class Help {
  protected readonly tools = OFFICIAL_TOOLS;
  protected readonly steps = INSTALL_STEPS;
  protected readonly disclaimer = INSTALL_DISCLAIMER;
  protected readonly facts = SCREEN_FACTS;
  protected readonly projects = COMMUNITY_PROJECTS;
}
