/**
 * Byte-level protocol of the AK820 Pro screen, as documented by community projects that
 * reverse-engineered the vendor tool (see the README credits). Pure functions only: nothing
 * here talks to a device. Every sequence this project sends is built from these few packets;
 * no other command is ever sent.
 */

export const SCREEN_WIDTH = 128;
export const FRAME_BYTES = SCREEN_WIDTH * SCREEN_WIDTH * 2;
export const CHUNK_BYTES = 4096;
export const COMMAND_BYTES = 64;
/** Bytes before the first frame: frame count, then one delay byte per frame, padded with 0xff. */
export const HEADER_BYTES = 256;
/** The header holds one delay byte per frame after the count byte. */
export const MAX_SCREEN_FRAMES = HEADER_BYTES - 1;

/** Command bytes (second byte of a 64-byte packet). */
export const Command = {
  Save: 0x02,
  LightingConfig: 0x13,
  Start: 0x18,
  ClockConfig: 0x28,
  ImageConfig: 0x72,
  Finish: 0xf0,
} as const;

export type UploadVariant = 'A' | 'B';

export interface VariantDefinition {
  label: string;
  /** Byte 8 of the opening command. */
  startEnable: number;
  /** Byte 2 of the image configuration command. */
  configSub: number;
  /** Command that closes the upload, and its byte 8. */
  end: { command: number; enable: number };
}

/**
 * Community sources disagree on three bytes of the upload sequence, so both are offered.
 * A is the default of the project that confirmed it on real hardware.
 */
export const VARIANTS: Readonly<Record<UploadVariant, VariantDefinition>> = {
  A: { label: 'Variante A (par défaut)', startEnable: 0x00, configSub: 0x03, end: { command: Command.Save, enable: 0x00 } },
  B: { label: 'Variante B', startEnable: 0x01, configSub: 0x02, end: { command: Command.Finish, enable: 0x01 } },
};

/** A frame already converted to the screen's pixel format. */
export interface ScreenFrame {
  /** RGB565, little-endian, row by row. `FRAME_BYTES` long. */
  pixels: Uint8Array;
  delayMs: number;
}

/** Generic 64-byte command: `04 <command> <sub> 00 00 00 00 00 <enable>`. */
export function commandPacket(command: number, sub = 0, enable = 0): Uint8Array {
  const packet = new Uint8Array(COMMAND_BYTES);
  packet[0] = 0x04;
  packet[1] = command;
  packet[2] = sub & 0xff;
  packet[8] = enable & 0xff;
  return packet;
}

/** Announces how many 4096-byte chunks follow (16-bit, little-endian). */
export function imageConfigPacket(chunks: number, sub: number): Uint8Array {
  const packet = commandPacket(Command.ImageConfig, sub);
  packet[8] = chunks & 0xff;
  packet[9] = (chunks >> 8) & 0xff;
  return packet;
}

/** Sets the keyboard's own clock page. The weekday is 0 for Sunday. */
export function clockPacket(date: Date): Uint8Array {
  const packet = new Uint8Array(COMMAND_BYTES);
  packet[0] = 0x00;
  packet[1] = 0x01;
  packet[2] = 0x5a;
  packet[3] = date.getFullYear() - 2000;
  packet[4] = date.getMonth() + 1;
  packet[5] = date.getDate();
  packet[6] = date.getHours();
  packet[7] = date.getMinutes();
  packet[8] = date.getSeconds();
  packet[10] = date.getDay();
  packet[62] = 0xaa;
  packet[63] = 0x55;
  return packet;
}

/** Delay in units of 2 ms, 1 to 255 (about 2 to 510 ms). */
export const encodeDelay = (ms: number): number => Math.min(255, Math.max(1, Math.round(ms / 2)));

/** RGBA (canvas) to RGB565 little-endian. Alpha is ignored. */
export function toRgb565(rgba: Uint8ClampedArray): Uint8Array {
  const out = new Uint8Array((rgba.length / 4) * 2);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 2) {
    const value = ((rgba[i] & 0xf8) << 8) | ((rgba[i + 1] & 0xfc) << 3) | (rgba[i + 2] >> 3);
    out[j] = value & 0xff;
    out[j + 1] = value >> 8;
  }
  return out;
}

export interface ScreenPayload {
  bytes: Uint8Array;
  chunks: number;
}

/** Header, then every frame back to back, padded with 0xff to a whole number of chunks. */
export function buildScreenPayload(frames: readonly ScreenFrame[]): ScreenPayload {
  if (frames.length === 0 || frames.length > MAX_SCREEN_FRAMES) {
    throw new RangeError(`Entre 1 et ${MAX_SCREEN_FRAMES} images sont nécessaires.`);
  }
  if (frames.some((frame) => frame.pixels.length !== FRAME_BYTES)) {
    throw new RangeError(`Chaque image doit faire ${FRAME_BYTES} octets.`);
  }
  const header = new Uint8Array(HEADER_BYTES).fill(0xff);
  header[0] = frames.length;
  if (frames.length === 1) header[1] = 0x00;
  else frames.forEach((frame, i) => (header[1 + i] = encodeDelay(frame.delayMs)));

  const length = HEADER_BYTES + frames.length * FRAME_BYTES;
  const chunks = Math.ceil(length / CHUNK_BYTES);
  const bytes = new Uint8Array(chunks * CHUNK_BYTES).fill(0xff);
  bytes.set(header, 0);
  frames.forEach((frame, i) => bytes.set(frame.pixels, HEADER_BYTES + i * FRAME_BYTES));
  return { bytes, chunks };
}

export function splitChunks(payload: ScreenPayload): Uint8Array[] {
  return Array.from({ length: payload.chunks }, (_, i) =>
    payload.bytes.subarray(i * CHUNK_BYTES, (i + 1) * CHUNK_BYTES),
  );
}
