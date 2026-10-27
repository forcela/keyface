import { DecodedImage } from '@core/render/frame.model';

/** The keyboard stores about 140 frames; anything longer is cut. */
export const MAX_FRAMES = 140;

const DEFAULT_DELAY_MS = 100;

/**
 * Decodes every frame of a GIF / animated WebP with `ImageDecoder` (Chromium browsers),
 * or a single frame anywhere else.
 */
export async function decodeImage(blob: Blob): Promise<DecodedImage> {
  if ('ImageDecoder' in window && (await ImageDecoder.isTypeSupported(blob.type))) {
    const decoder = new ImageDecoder({ data: await blob.arrayBuffer(), type: blob.type });
    await decoder.tracks.ready;
    const count = Math.min(MAX_FRAMES, decoder.tracks.selectedTrack?.frameCount || 1);
    const frames: ImageBitmap[] = [];
    let totalMs = 0;
    for (let frameIndex = 0; frameIndex < count; frameIndex++) {
      const { image } = await decoder.decode({ frameIndex });
      totalMs += (image.duration ?? DEFAULT_DELAY_MS * 1000) / 1000;
      frames.push(await createImageBitmap(image));
      image.close();
    }
    decoder.close();
    return { frames, frameDelayMs: totalMs / frames.length };
  }
  return { frames: [await createImageBitmap(blob)], frameDelayMs: DEFAULT_DELAY_MS };
}

export function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function decodeDataUrl(src: string): Promise<DecodedImage> {
  return decodeImage(await (await fetch(src)).blob());
}
