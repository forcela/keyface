import { Ctx } from '../canvas.utils';
import { FrameContext } from '../frame.model';

export type ThemeId = 'minimal' | 'landscape' | 'genz' | 'lofi' | 'custom';

export interface LoopDefaults {
  frames: number;
  /** Delay between frames, in ms. */
  delay: number;
}

export interface ThemeDefinition<TOptions> {
  id: ThemeId;
  name: string;
  description: string;
  defaults: LoopDefaults;
  draw(c: Ctx, frame: FrameContext, options: TOptions): void;
}
