import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TEMPLATE_LABELS, TemplateId } from '@core/render/layers/layer-factory';
import { LAYER_TYPE_LABELS, LayerType } from '@core/render/layers/layer.model';
import { EditorStore } from '@core/state/editor.store';
import { StudioStore } from '@core/state/studio.store';
import { StyleFileError, parseStyle, serializeStyle } from '@core/style-file/style-file';
import { Button } from '@shared/ui/button/button';
import { FileButton } from '@shared/ui/file-button/file-button';
import { PanelSection } from '@shared/ui/panel-section/panel-section';
import { saveBlob } from '@shared/utils/save-blob';
import { LayerList, layerName } from './layer-list/layer-list';
import { LayerProperties } from './layer-properties/layer-properties';

const ADDABLE: readonly LayerType[] = ['time', 'date', 'battery', 'text', 'image', 'shape', 'mascot', 'effect'];

/** Editor of the custom style: templates, layers, settings of the selected layer, style files. */
@Component({
  selector: 'ss-editor',
  imports: [PanelSection, Button, FileButton, LayerList, LayerProperties],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './editor.html',
})
export class Editor {
  protected readonly editor = inject(EditorStore);
  private readonly studio = inject(StudioStore);

  protected readonly templates = (Object.keys(TEMPLATE_LABELS) as TemplateId[]).map((id) => ({
    id,
    label: TEMPLATE_LABELS[id],
  }));
  protected readonly addable = ADDABLE.map((type) => ({ type, label: LAYER_TYPE_LABELS[type] }));

  protected readonly templateNotice = signal('');
  protected readonly fileNotice = signal(
    'Ton style est gardé dans ce navigateur. Enregistre-le pour le partager ou le garder ailleurs.',
  );
  protected readonly propsTitle = computed(() => {
    const layer = this.editor.selected();
    return layer ? layerName(layer) : 'Réglages';
  });

  protected applyTemplate(id: TemplateId, label: string): void {
    this.editor.applyTemplate(id);
    this.templateNotice.set(`Modèle « ${label} » appliqué.`);
  }

  protected undoTemplate(): void {
    this.editor.undoTemplate();
    this.templateNotice.set('');
  }

  protected saveStyle(): void {
    const json = serializeStyle(this.editor.layers(), this.studio.frames(), this.studio.delay());
    saveBlob(new Blob([json], { type: 'application/json' }), 'mon-style.json');
    this.fileNotice.set('Style enregistré.');
  }

  protected async openStyle(file: File): Promise<void> {
    try {
      const style = parseStyle(await file.text());
      this.editor.replaceLayers(style.layers);
      this.studio.setLoop(style.frames ?? this.studio.frames(), style.delay ?? this.studio.delay());
      this.fileNotice.set('Style ouvert.');
    } catch (error) {
      this.fileNotice.set(error instanceof StyleFileError ? error.message : "Impossible de lire ce fichier.");
    }
  }
}
