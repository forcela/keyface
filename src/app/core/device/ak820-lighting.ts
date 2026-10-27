import { LightingSettings } from '@core/lighting/lighting.model';
import { COMMAND_BYTES } from './ak820-protocol';

/**
 * Backlight data packet of the AK820 Pro. Byte 0 is the mode number, which is the layout the reference
 * project confirmed on real hardware. Pure function: nothing here talks to a device.
 */
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)));

export function lightingPacket(settings: LightingSettings): Uint8Array {
  const packet = new Uint8Array(COMMAND_BYTES);
  packet[0] = clamp(settings.effect, 0x00, 0x13);
  packet[1] = parseInt(settings.color.slice(1, 3), 16) || 0;
  packet[2] = parseInt(settings.color.slice(3, 5), 16) || 0;
  packet[3] = parseInt(settings.color.slice(5, 7), 16) || 0;
  packet[8] = settings.rainbow ? 1 : 0;
  packet[9] = clamp(settings.brightness, 0, 5);
  packet[10] = clamp(settings.speed, 0, 5);
  packet[11] = clamp(settings.direction, 0, 3);
  packet[14] = 0x55;
  packet[15] = 0xaa;
  return packet;
}
