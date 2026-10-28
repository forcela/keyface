import { Injectable, inject } from '@angular/core';
import { Ctx } from '@core/render/canvas.utils';
import { ClockInfo } from '@core/render/clock';
import { FrameContext } from '@core/render/frame.model';
import { customTheme } from '@core/render/themes/custom.theme';
import { genzTheme } from '@core/render/themes/genz.theme';
import { landscapeTheme } from '@core/render/themes/landscape.theme';
import { lofiTheme } from '@core/render/themes/lofi.theme';
import { minimalTheme } from '@core/render/themes/minimal.theme';
import { synthwaveTheme } from '@core/render/themes/synthwave.theme';
import { ThemeId } from '@core/render/themes/theme.model';
import { EditorStore } from '@core/state/editor.store';
import { StudioStore } from '@core/state/studio.store';

/**
 * Draws one frame of a style from the current studio state. Reads signals, so a caller
 * running inside an `effect()` redraws whenever a setting changes.
 */
@Injectable({ providedIn: 'root' })
export class FrameRenderer {
  private readonly studio = inject(StudioStore);
  private readonly editor = inject(EditorStore);

  render(c: Ctx, theme: ThemeId, t: number, clock: ClockInfo): void {
    const frame: FrameContext = {
      t,
      clock,
      battery: this.studio.battery(),
      showClock: this.studio.showClock(),
      showBattery: this.studio.showBattery(),
    };
    const options = this.studio.options();
    switch (theme) {
      case 'minimal':
        return minimalTheme.draw(c, frame, options.minimal);
      case 'landscape':
        return landscapeTheme.draw(c, frame, options.landscape);
      case 'genz':
        return genzTheme.draw(c, frame, options.genz);
      case 'lofi':
        return lofiTheme.draw(c, frame, options.lofi);
      case 'synthwave':
        return synthwaveTheme.draw(c, frame, options.synthwave);
      case 'custom':
        return customTheme.draw(c, frame, { layers: this.editor.layers(), images: this.editor.images() });
    }
  }
}
