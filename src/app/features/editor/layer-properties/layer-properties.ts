import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MAX_FRAMES, decodeImage, readAsDataUrl } from '@core/media/decode-image';
import { COUNTLESS_EFFECTS, EffectKind } from '@core/render/effects';
import { ImageLayer, Layer, isPlaced } from '@core/render/layers/layer.model';
import { EditorStore } from '@core/state/editor.store';
import { StudioStore } from '@core/state/studio.store';
import { ColorField } from '@shared/ui/color-field/color-field';
import { FileButton } from '@shared/ui/file-button/file-button';
import { RangeField } from '@shared/ui/range-field/range-field';
import { SegmentedControl } from '@shared/ui/segmented-control/segmented-control';
import { TextField } from '@shared/ui/text-field/text-field';
import {
  AMBIANCES,
  ANIMATIONS,
  BACKGROUND_MODES,
  BATTERY_STYLES,
  DATE_FORMATS,
  EFFECTS,
  MASCOTS,
  MASCOT_SIZES,
  SHAPES,
} from './layer-options.constants';
import { TextLookFields } from './text-look-fields/text-look-fields';

/** Settings of the selected layer. Which fields show depends on the layer type. */
@Component({
  selector: 'kf-layer-properties',
  imports: [SegmentedControl, ColorField, RangeField, TextField, FileButton, TextLookFields],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layer-properties.html',
})
export class LayerProperties {
  private readonly editor = inject(EditorStore);
  private readonly studio = inject(StudioStore);

  protected readonly layer = this.editor.selected;
  protected readonly placed = computed(() => {
    const layer = this.layer();
    return layer && isPlaced(layer) ? layer : null;
  });

  protected readonly backgroundModes = BACKGROUND_MODES;
  protected readonly ambiances = AMBIANCES;
  protected readonly animations = ANIMATIONS;
  protected readonly dateFormats = DATE_FORMATS;
  protected readonly effects = EFFECTS;
  protected readonly batteryStyles = BATTERY_STYLES;
  protected readonly shapes = SHAPES;
  protected readonly mascots = MASCOTS;
  protected readonly mascotSizes = MASCOT_SIZES;

  protected readonly pixels = (value: number) => `${value} px`;
  protected readonly percent = (value: number) => `${Math.round(value * 100)} %`;
  protected readonly times = (value: number) => `${value.toFixed(1)}×`;
  protected readonly hasCount = (kind: EffectKind) => !COUNTLESS_EFFECTS.includes(kind);

  protected set(changes: Partial<Layer>): void {
    const layer = this.layer();
    if (layer) this.editor.update(layer.id, changes);
  }

  protected async pickImage(layer: ImageLayer, file: File): Promise<void> {
    const [src, image] = await Promise.all([readAsDataUrl(file), decodeImage(file)]);
    this.editor.update(layer.id, { src });
    this.editor.setImage(layer.id, image);
    if (image.frames.length > 1) this.studio.setLoop(Math.min(MAX_FRAMES, image.frames.length), image.frameDelayMs);
  }
}
