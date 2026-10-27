import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LAYER_TYPE_LABELS, Layer } from '@core/render/layers/layer.model';
import { EFFECT_LABELS } from '@core/render/effects';
import { MASCOT_LABELS } from '@core/render/sprites/mascots';
import { EditorStore } from '@core/state/editor.store';
import { IconButton } from '@shared/ui/icon-button/icon-button';

const BACKGROUND_LABELS = { solid: 'Uni', gradient: 'Dégradé', halo: 'Halo', scenery: 'Paysage' } as const;

export function layerName(layer: Layer): string {
  switch (layer.type) {
    case 'text':
      return layer.text || LAYER_TYPE_LABELS.text;
    case 'effect':
      return `Effet · ${EFFECT_LABELS[layer.kind]}`;
    case 'mascot':
      return `Perso · ${MASCOT_LABELS[layer.mascot]}`;
    case 'background':
      return `Fond · ${BACKGROUND_LABELS[layer.mode]}`;
    default:
      return LAYER_TYPE_LABELS[layer.type];
  }
}

/** Layers from front to back, with visibility, order, duplicate and delete. */
@Component({
  selector: 'kf-layer-list',
  imports: [IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layer-list.html',
})
export class LayerList {
  protected readonly editor = inject(EditorStore);
  protected readonly name = layerName;

  /** Front-most layer first, like in any design tool. */
  protected readonly rows = computed(() => {
    const layers = this.editor.layers();
    return [...layers].reverse().map((layer, i) => ({
      layer,
      canRaise: layer.type !== 'background' && i > 0,
      canLower: layer.type !== 'background' && i < layers.length - 2,
    }));
  });
}
