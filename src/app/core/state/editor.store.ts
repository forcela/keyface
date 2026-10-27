import { Injectable, computed, effect, signal } from '@angular/core';
import { decodeDataUrl } from '@core/media/decode-image';
import { DecodedImage } from '@core/render/frame.model';
import { TEMPLATES, TemplateId, createLayer, starterLayers } from '@core/render/layers/layer-factory';
import { Layer, LayerOf, LayerType, isPlaced } from '@core/render/layers/layer.model';
import { restoreLayers } from '@core/style-file/style-file';

const STORAGE_KEY = 'keyface.custom-style.v1';
const NUDGE_LIMIT = 128;

/** Layers of the custom style, the selection, and their decoded images. */
@Injectable({ providedIn: 'root' })
export class EditorStore {
  readonly layers = signal<Layer[]>(this.loadSaved() ?? starterLayers());
  readonly selectedId = signal<number | null>(null);
  readonly images = signal<ReadonlyMap<number, DecodedImage>>(new Map());
  /** Layers before the last template was applied, for a one-step undo. */
  readonly beforeTemplate = signal<Layer[] | null>(null);

  readonly selected = computed(() => this.layers().find((layer) => layer.id === this.selectedId()) ?? null);

  constructor() {
    this.decodeImages(this.layers());
    effect(() => this.persist(this.layers()));
  }

  select(id: number | null): void {
    this.selectedId.set(id);
  }

  add<T extends LayerType>(type: T): LayerOf<T> {
    const layer = createLayer(type);
    this.layers.update((layers) => {
      if (isPlaced(layer)) return [...layers, layer];
      // Backgrounds and effects go under every placed layer.
      const firstPlaced = layers.findIndex(isPlaced);
      const at = firstPlaced < 0 ? layers.length : firstPlaced;
      return [...layers.slice(0, at), layer, ...layers.slice(at)];
    });
    this.selectedId.set(layer.id);
    return layer;
  }

  update(id: number, changes: Partial<Layer>): void {
    this.layers.update((layers) =>
      layers.map((layer) => (layer.id === id ? ({ ...layer, ...changes } as Layer) : layer)),
    );
  }

  remove(id: number): void {
    this.layers.update((layers) => layers.filter((layer) => layer.id !== id || layer.type === 'background'));
    this.images.update((images) => withoutKey(images, id));
    if (this.selectedId() === id) this.selectedId.set(null);
  }

  duplicate(id: number): void {
    const source = this.layers().find((layer) => layer.id === id);
    if (!source || source.type === 'background') return;
    const copy = { ...structuredClone(source), id: createLayer(source.type).id } as Layer;
    if (isPlaced(copy)) {
      copy.x = Math.min(NUDGE_LIMIT - 4, copy.x + 6);
      copy.y = Math.min(NUDGE_LIMIT - 4, copy.y + 6);
    }
    const image = this.images().get(id);
    if (image) this.setImage(copy.id, image);
    this.layers.update((layers) => {
      const at = layers.findIndex((layer) => layer.id === id) + 1;
      return [...layers.slice(0, at), copy, ...layers.slice(at)];
    });
    this.selectedId.set(copy.id);
  }

  /** Moves a layer one step towards the front (+1) or the back (-1). The background never moves. */
  reorder(id: number, direction: 1 | -1): void {
    this.layers.update((layers) => {
      const from = layers.findIndex((layer) => layer.id === id);
      const to = from + direction;
      if (from < 1 || to < 1 || to >= layers.length) return layers;
      const next = [...layers];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }

  applyTemplate(id: TemplateId): void {
    this.beforeTemplate.set(this.layers());
    this.replaceLayers(TEMPLATES[id]());
  }

  undoTemplate(): void {
    const previous = this.beforeTemplate();
    if (!previous) return;
    this.beforeTemplate.set(null);
    this.layers.set(previous);
    this.selectedId.set(null);
  }

  replaceLayers(layers: Layer[]): void {
    this.layers.set(layers);
    this.selectedId.set(null);
    this.decodeImages(layers);
  }

  setImage(id: number, image: DecodedImage): void {
    this.images.update((images) => new Map(images).set(id, image));
  }

  private decodeImages(layers: readonly Layer[]): void {
    for (const layer of layers) {
      if (layer.type !== 'image' || !layer.src || this.images().has(layer.id)) continue;
      decodeDataUrl(layer.src).then(
        (image) => this.setImage(layer.id, image),
        () => this.update(layer.id, { src: null }),
      );
    }
  }

  private loadSaved(): Layer[] | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? restoreLayers(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  }

  /** Debounced: a drag updates the layers on every pointer move, and images make the JSON heavy. */
  private persist(layers: readonly Layer[]): void {
    clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layers));
      } catch {
        // Storage full or blocked (private mode): the style stays in memory and can still be saved as a file.
      }
    }, 400);
  }

  private persistTimer?: ReturnType<typeof setTimeout>;
}

function withoutKey<K, V>(map: ReadonlyMap<K, V>, key: K): ReadonlyMap<K, V> {
  const next = new Map(map);
  next.delete(key);
  return next;
}
