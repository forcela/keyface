import { ClockInfo } from './clock';

/** Everything a renderer needs to draw one frame, besides its own options. */
export interface FrameContext {
  /** Loop position in [0, 1). Anything that moves must complete whole cycles over one loop. */
  t: number;
  clock: ClockInfo;
  /** Battery level drawn on screen, 0-100. */
  battery: number;
  showClock: boolean;
  showBattery: boolean;
}

/** Frames of a decoded image or GIF. */
export interface DecodedImage {
  frames: ImageBitmap[];
  /** Average delay between frames, in ms (100 for a still image). */
  frameDelayMs: number;
}

export function frameAt(image: DecodedImage, t: number): ImageBitmap {
  return image.frames[Math.floor(t * image.frames.length) % image.frames.length];
}
