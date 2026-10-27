/**
 * VIA, the open protocol that QMK keyboards speak over "raw HID" (the one web configurators use).
 * Facts checked against QMK's `docs/features/rawhid`, `quantum/via.h` and `quantum/via.c`.
 *
 * This module is READ ONLY. It can build four kinds of request, all "get" commands, and refuses to
 * describe any other. Pure functions: nothing here talks to a device.
 */

/** Usage page and usage of the raw HID interface (QMK defaults). */
export const VIA_USAGE_PAGE = 0xff60;
export const VIA_USAGE = 0x61;
/** Every report, in both directions, is exactly this long. */
export const VIA_REPORT_BYTES = 32;

/** Command ids from `quantum/via.h`. Only the "get" ones we use, plus the "unhandled" answer. */
export const ViaCommand = {
  GetProtocolVersion: 0x01,
  GetKeyboardValue: 0x02,
  CustomGetValue: 0x08,
  GetLayerCount: 0x11,
  /** What a keyboard puts in byte 0 of its answer when it does not handle a request. */
  Unhandled: 0xff,
} as const;

/** The only `get_keyboard_value` sub-id we ask for. */
export const FIRMWARE_VERSION_VALUE = 0x04;
/** The only lighting value we ask for: brightness, which exists in every lighting channel. */
const BRIGHTNESS_VALUE = 0x01;

/** Lighting channels of `via_channel_id`. Channel 0 is keyboard-specific and is never queried. */
export const LIGHTING_CHANNELS = [
  { channel: 1, id: 'backlight', label: 'Rétroéclairage simple' },
  { channel: 2, id: 'rgblight', label: 'Bandeau RGB' },
  { channel: 3, id: 'rgb_matrix', label: 'RGB par touche' },
  { channel: 5, id: 'led_matrix', label: 'LED monochrome par touche' },
] as const;

export type LightingChannelId = (typeof LIGHTING_CHANNELS)[number]['id'];

function request(command: number, ...args: number[]): Uint8Array {
  const packet = new Uint8Array(VIA_REPORT_BYTES);
  packet[0] = command;
  args.forEach((value, i) => (packet[1 + i] = value));
  return packet;
}

export const requestProtocolVersion = () => request(ViaCommand.GetProtocolVersion);
export const requestLayerCount = () => request(ViaCommand.GetLayerCount);
export const requestFirmwareVersion = () => request(ViaCommand.GetKeyboardValue, FIRMWARE_VERSION_VALUE);
export const requestLighting = (channel: number) => request(ViaCommand.CustomGetValue, channel, BRIGHTNESS_VALUE);

/**
 * True only for the exact requests above. The probe checks every packet with this before sending, so a
 * future change cannot send a write command (set, save, reset, bootloader...) by accident.
 */
export function isSafeRead(packet: Uint8Array): boolean {
  if (packet.length !== VIA_REPORT_BYTES || packet.slice(4).some((byte) => byte !== 0)) return false;
  switch (packet[0]) {
    case ViaCommand.GetProtocolVersion:
    case ViaCommand.GetLayerCount:
      return packet.slice(1).every((byte) => byte === 0);
    case ViaCommand.GetKeyboardValue:
      return packet[1] === FIRMWARE_VERSION_VALUE && packet[2] === 0 && packet[3] === 0;
    case ViaCommand.CustomGetValue:
      return packet[2] === BRIGHTNESS_VALUE && packet[3] === 0 && LIGHTING_CHANNELS.some((c) => c.channel === packet[1]);
    default:
      return false;
  }
}

/** The answer echoes the command id; `0xff` (or anything else) means the keyboard did not handle it. */
const answers = (reply: Uint8Array, command: number) => reply.length === VIA_REPORT_BYTES && reply[0] === command;

/** Protocol version, big-endian in bytes 1 and 2. */
export function parseProtocolVersion(reply: Uint8Array): number | null {
  return answers(reply, ViaCommand.GetProtocolVersion) ? (reply[1] << 8) | reply[2] : null;
}

export function parseLayerCount(reply: Uint8Array): number | null {
  return answers(reply, ViaCommand.GetLayerCount) ? reply[1] : null;
}

/** 32-bit firmware version, big-endian in bytes 2 to 5. Zero means the firmware does not define one. */
export function parseFirmwareVersion(reply: Uint8Array): number | null {
  if (!answers(reply, ViaCommand.GetKeyboardValue) || reply[1] !== FIRMWARE_VERSION_VALUE) return null;
  const value = ((reply[2] << 24) | (reply[3] << 16) | (reply[4] << 8) | reply[5]) >>> 0;
  return value === 0 ? null : value;
}

/** True when the keyboard answered for this lighting channel instead of saying "unhandled". */
export function parseLightingAnswer(reply: Uint8Array, channel: number): boolean {
  return answers(reply, ViaCommand.CustomGetValue) && reply[1] === channel && reply[2] === BRIGHTNESS_VALUE;
}
