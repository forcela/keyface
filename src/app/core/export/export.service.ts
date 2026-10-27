import { Injectable, inject } from '@angular/core';
import { SCREEN_SIZE } from '@core/render/canvas.utils';
import { readClock } from '@core/render/clock';
import { themeById } from '@core/render/themes/themes.registry';
import { FrameRenderer } from '@core/rendering/frame-renderer';
import { FrameSequence } from '@core/rendering/frame-sequence';
import { StudioStore } from '@core/state/studio.store';
import { saveBlob } from '@shared/utils/save-blob';

export type ExportProgress = (done: number, total: number) => void;

/** Turns the current style into image files. */
@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly renderer = inject(FrameRenderer);
  private readonly sequence = inject(FrameSequence);
  private readonly studio = inject(StudioStore);

  async exportStill(): Promise<void> {
    const canvas = new OffscreenCanvas(SCREEN_SIZE, SCREEN_SIZE);
    this.renderer.render(canvas.getContext('2d')!, this.studio.theme(), 0, readClock());
    saveBlob(await canvas.convertToBlob({ type: 'image/png' }), `screen-studio-${this.studio.theme()}.png`);
  }

  /** Every frame as a PNG in a zip, plus a short readme with the timing. */
  async exportFrames(onProgress: ExportProgress): Promise<void> {
    // Loaded on demand: not needed to show the page.
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    await this.sequence.forEachFrame(async (canvas, index, total) => {
      zip.file(`frame_${String(index).padStart(3, '0')}.png`, await canvas.convertToBlob({ type: 'image/png' }));
      onProgress(index + 1, total);
    });
    const theme = this.studio.theme();
    const frames = this.studio.frames();
    zip.file('LISEZMOI.txt', this.readme(themeById(theme).name, frames, this.studio.delay()));
    saveBlob(await zip.generateAsync({ type: 'blob' }), `screen-studio-${theme}-${frames}-images.zip`);
  }

  private readme(style: string, frames: number, delay: number): string {
    return [
      `Style : ${style}`,
      `Images : ${frames}`,
      `Durée par image : ${delay} ms`,
      `Taille : ${SCREEN_SIZE} x ${SCREEN_SIZE}`,
      '',
      'Clavier branché en USB, interrupteur en mode filaire.',
      "Dans l'outil officiel de ton clavier, partie écran (TFT) : importer toutes les images d'un coup.",
      '',
    ].join('\n');
  }
}
