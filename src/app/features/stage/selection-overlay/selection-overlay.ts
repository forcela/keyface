import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { SCREEN_SIZE as S } from '@core/render/canvas.utils';
import { LayerData, Rect, containsPoint, layerBounds } from '@core/render/layers/layer-geometry';
import { PlacedLayer, isPlaced } from '@core/render/layers/layer.model';
import { measureContext } from '@core/render/measure';
import { AnimationClock } from '@core/rendering/animation-clock';
import { EditorStore } from '@core/state/editor.store';
import { StudioStore } from '@core/state/studio.store';
import { Drag, dragTo, keyboardNudge, startResize } from './selection-drag';

const SNAP = 2;
const HIT_MARGIN = 3;

/** Lets the user pick, move and resize layers right on the preview. */
@Component({
  selector: 'kf-selection-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'absolute inset-0 cursor-move',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'endDrag()',
    '(pointercancel)': 'endDrag()',
    '(document:keydown)': 'onKey($event)',
  },
  templateUrl: './selection-overlay.html',
})
export class SelectionOverlay {
  private readonly editor = inject(EditorStore);
  private readonly studio = inject(StudioStore);
  private readonly clock = inject(AnimationClock);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly drag = signal<Drag | null>(null);
  protected readonly snapX = signal(false);
  protected readonly snapY = signal(false);

  private readonly data = computed<LayerData>(() => ({ clock: this.clock.clock(), battery: this.studio.battery() }));

  /** Selected layer box, in percent of the screen so it follows the preview size. */
  protected readonly box = computed(() => {
    const layer = this.selectedPlaced();
    if (!layer || !layer.visible) return null;
    const r = layerBounds(measureContext(), layer, this.data());
    const pct = (v: number) => `${(v / S) * 100}%`;
    return { left: pct(r.x), top: pct(r.y), width: pct(r.w), height: pct(r.h) };
  });

  private readonly selectedPlaced = computed(() => {
    const layer = this.editor.selected();
    return layer && isPlaced(layer) ? layer : null;
  });

  protected onPointerDown(event: PointerEvent): void {
    const [px, py] = this.toScreen(event);
    const selected = this.selectedPlaced();
    if ((event.target as HTMLElement).dataset['handle'] !== undefined && selected) {
      this.drag.set(startResize(selected, px, py));
    } else {
      const hit = this.hitTest(px, py);
      this.editor.select(hit?.id ?? null);
      this.drag.set(hit ? { mode: 'move', id: hit.id, offsetX: px - hit.x, offsetY: py - hit.y } : null);
    }
    if (this.drag()) {
      this.host.nativeElement.setPointerCapture(event.pointerId);
      event.preventDefault();
    }
  }

  protected onPointerMove(event: PointerEvent): void {
    const drag = this.drag();
    const layer = this.selectedPlaced();
    if (!drag || !layer) return;
    const [px, py] = this.toScreen(event);
    const changes = dragTo(drag, layer, px, py);
    if (drag.mode === 'move' && changes.x !== undefined && changes.y !== undefined) {
      this.snapX.set(Math.abs(changes.x - S / 2) <= SNAP);
      this.snapY.set(Math.abs(changes.y - S / 2) <= SNAP);
      if (this.snapX()) changes.x = S / 2;
      if (this.snapY()) changes.y = S / 2;
    }
    this.editor.update(layer.id, changes);
  }

  protected endDrag(): void {
    this.drag.set(null);
    this.snapX.set(false);
    this.snapY.set(false);
  }

  protected onKey(event: KeyboardEvent): void {
    const layer = this.selectedPlaced();
    const target = event.target as HTMLElement;
    if (!layer || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    if (event.key === 'Delete' || event.key === 'Backspace') this.editor.remove(layer.id);
    else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') this.editor.duplicate(layer.id);
    else {
      const moved = keyboardNudge(layer, event.key, event.shiftKey ? 5 : 1);
      if (!moved) return;
      this.editor.update(layer.id, moved);
    }
    event.preventDefault();
  }

  private toScreen(event: PointerEvent): [number, number] {
    const rect = this.host.nativeElement.getBoundingClientRect();
    return [((event.clientX - rect.left) * S) / rect.width, ((event.clientY - rect.top) * S) / rect.height];
  }

  /** Top-most visible placed layer under the point. */
  private hitTest(px: number, py: number): PlacedLayer | null {
    const layers = this.editor.layers();
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible || !isPlaced(layer)) continue;
      const bounds: Rect = layerBounds(measureContext(), layer, this.data());
      if (containsPoint(bounds, px, py, HIT_MARGIN)) return layer;
    }
    return null;
  }
}
