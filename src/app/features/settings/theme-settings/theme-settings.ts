import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AMBIANCE_LABELS, Ambiance } from '@core/render/scenery';
import { MASCOT_LABELS, MascotKind } from '@core/render/sprites/mascots';
import { GENZ_PALETTE_LABELS, GenzPalette } from '@core/render/themes/genz.constants';
import { StudioStore } from '@core/state/studio.store';
import { decodeImage } from '@core/media/decode-image';
import { ColorField } from '@shared/ui/color-field/color-field';
import { FileButton } from '@shared/ui/file-button/file-button';
import { Button } from '@shared/ui/button/button';
import { PanelSection } from '@shared/ui/panel-section/panel-section';
import { SegmentedControl, segmentsOf } from '@shared/ui/segmented-control/segmented-control';
import { TextField } from '@shared/ui/text-field/text-field';

/** Settings of the four ready-made styles. Only the section of the current style shows. */
@Component({
  selector: 'ss-theme-settings',
  imports: [PanelSection, SegmentedControl, ColorField, TextField, FileButton, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-settings.html',
})
export class ThemeSettings {
  protected readonly studio = inject(StudioStore);

  protected readonly backgrounds = [
    { value: 'black', label: 'Noir' },
    { value: 'halo', label: 'Halo' },
  ] as const;
  protected readonly ambiances = segmentsOf<Ambiance>(AMBIANCE_LABELS);
  protected readonly mascots = segmentsOf<MascotKind>(MASCOT_LABELS);
  protected readonly palettes = segmentsOf<GenzPalette>(GENZ_PALETTE_LABELS);

  protected readonly minimal = computed(() => this.studio.options().minimal);
  protected readonly landscape = computed(() => this.studio.options().landscape);
  protected readonly genz = computed(() => this.studio.options().genz);
  protected readonly lofi = computed(() => this.studio.options().lofi);

  protected readonly imageInfo = computed(() => {
    const image = this.genz().image;
    if (!image) return 'perso choisi ci-dessus';
    return image.frames.length > 1 ? `${image.frames.length} images` : 'image fixe';
  });

  protected readonly imageError = signal('');

  protected async pickImage(file: File): Promise<void> {
    this.imageError.set('');
    try {
      const image = await decodeImage(file);
      this.studio.patch('genz', { image });
      if (image.frames.length > 1) this.studio.setLoop(image.frames.length, image.frameDelayMs);
    } catch {
      this.imageError.set('Fichier illisible, essaie un autre GIF.');
    }
  }

  protected clearImage(): void {
    this.studio.patch('genz', { image: null });
    this.studio.selectTheme('genz');
  }
}
