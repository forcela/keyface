import { ImageStore, drawLayers } from '../layers/layer-renderer';
import { Layer } from '../layers/layer.model';
import { ThemeDefinition } from './theme.model';

export interface CustomOptions {
  layers: readonly Layer[];
  images: ImageStore;
}

export const customTheme: ThemeDefinition<CustomOptions> = {
  id: 'custom',
  name: 'Perso',
  description: 'Ton propre style',
  defaults: { frames: 48, delay: 80 },
  draw(c, frame, o) {
    drawLayers(c, o.layers, frame, o.images);
  },
};
