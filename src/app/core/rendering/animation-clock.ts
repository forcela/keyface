import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { ClockInfo, readClock } from '@core/render/clock';

/**
 * One `requestAnimationFrame` loop for the whole page. Components derive their frame
 * from `now()` instead of running their own loops.
 */
@Injectable({ providedIn: 'root' })
export class AnimationClock {
  /** Milliseconds since page load, updated every animation frame. */
  readonly now = signal(0);
  /** Wall clock, refreshed when the minute changes. */
  readonly clock = signal<ClockInfo>(readClock());

  constructor() {
    let handle = 0;
    const loop = (ms: number) => {
      this.now.set(ms);
      const clock = readClock();
      if (clock.time !== this.clock().time) this.clock.set(clock);
      handle = requestAnimationFrame(loop);
    };
    handle = requestAnimationFrame(loop);
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(handle));
  }
}
