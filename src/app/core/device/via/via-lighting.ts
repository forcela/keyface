import { LIGHTING_CHANNELS, VIA_REPORT_BYTES } from './via-protocol';

/**
 * The ONLY write commands Keyface can send to a VIA keyboard: lighting values on the four standard
 * lighting channels, and the matching "save". Facts checked against QMK `quantum/via.h` and `via.c`:
 * `set_value` (0x07) changes the running state in RAM (`_noeeprom` functions), `save` (0x09) writes that
 * channel to the keyboard's memory. Never channel 0 (keyboard-specific), never keymap, macro, reset or
 * bootloader commands. Pure functions: nothing here talks to a device.
 */

export const ViaWrite = {
  CustomSetValue: 0x07,
  CustomSave: 0x09,
} as const;

/** `via_*_value` ids of the lighting channels. */
const Value = { brightness: 1, effect: 2, speed: 3, color: 4 } as const;
export type ViaLightingValue = keyof typeof Value;

/** Which values each channel understands, and how many data bytes each takes (`quantum/via.c`). */
const CHANNEL_VALUES: Record<number, Partial<Record<ViaLightingValue, number>>> = {
  1: { brightness: 1, effect: 1 },
  2: { brightness: 1, effect: 1, speed: 1, color: 2 },
  3: { brightness: 1, effect: 1, speed: 1, color: 2 },
  5: { brightness: 1, effect: 1, speed: 1 },
};

/** What the user asked for. Each field is optional: only what is set is sent. */
export interface ViaLightingRequest {
  /** 0 to 255. */
  brightness?: number;
  /** QMK effect index. 0 means off. */
  effect?: number;
  /** 0 to 255. */
  speed?: number;
  /** `#rrggbb`, sent as hue and saturation (brightness stays as set). */
  color?: string;
}

const byte = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

/** QMK stores hue and saturation as one byte each (hue 0-255 covers the whole colour wheel). */
export function hexToHueSaturation(hex: string): [number, number] {
  const value = /^#?([0-9a-f]{6})$/i.exec(hex)?.[1] ?? 'ffffff';
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  let hue = 0;
  if (delta > 0) {
    if (max === r) hue = ((g - b) / delta + 6) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  return [byte((hue / 6) * 255), byte(max === 0 ? 0 : (delta / max) * 255)];
}

function packet(command: number, ...args: number[]): Uint8Array {
  const out = new Uint8Array(VIA_REPORT_BYTES);
  out[0] = command;
  args.forEach((value, i) => (out[1 + i] = value));
  return out;
}

export const channelSupports = (channel: number, value: ViaLightingValue): boolean =>
  CHANNEL_VALUES[channel]?.[value] !== undefined;

/** Packets that apply a request on one channel, RAM only. Values the channel does not know are left out. */
export function lightingPackets(channel: number, request: ViaLightingRequest): Uint8Array[] {
  const out: Uint8Array[] = [];
  const add = (name: ViaLightingValue, ...data: number[]) => {
    if (channelSupports(channel, name)) out.push(packet(ViaWrite.CustomSetValue, channel, Value[name], ...data));
  };
  if (request.brightness !== undefined) add('brightness', byte(request.brightness));
  if (request.effect !== undefined) add('effect', byte(request.effect));
  if (request.speed !== undefined) add('speed', byte(request.speed));
  if (request.color !== undefined) add('color', ...hexToHueSaturation(request.color));
  return out;
}

/** The packet that stores a channel in the keyboard's memory. Sent only on an explicit "save" click. */
export const savePacket = (channel: number): Uint8Array => packet(ViaWrite.CustomSave, channel);

/**
 * True only for the packets built above. The writer checks every packet with this before sending, so a
 * future change cannot send channel 0, a keymap command, a reset or a bootloader jump by accident.
 */
export function isSafeLightingWrite(bytes: Uint8Array): boolean {
  if (bytes.length !== VIA_REPORT_BYTES) return false;
  const channel = bytes[1];
  if (!LIGHTING_CHANNELS.some((c) => c.channel === channel)) return false;
  if (bytes[0] === ViaWrite.CustomSave) return bytes.slice(2).every((b) => b === 0);
  if (bytes[0] !== ViaWrite.CustomSetValue) return false;
  const name = (Object.keys(Value) as ViaLightingValue[]).find((key) => Value[key] === bytes[2]);
  const length = name ? CHANNEL_VALUES[channel]?.[name] : undefined;
  return length !== undefined && bytes.slice(3 + length).every((b) => b === 0);
}
