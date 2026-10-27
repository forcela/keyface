import { HidDevice } from '../webhid.types';
import { ViaLightingRequest, isSafeLightingWrite, lightingPackets, savePacket } from './via-lighting';
import { ask } from './via-probe';
import { LIGHTING_CHANNELS } from './via-protocol';

const TIMEOUT_MS = 1000;

/**
 * Applies lighting values to a VIA keyboard on one lighting channel. Without `save` the change lives in
 * the keyboard's RAM and disappears when it is unplugged; with `save` it is stored in its memory. Every
 * packet goes through `isSafeLightingWrite` first, and the device is closed afterwards if this opened it.
 * Returns how many packets the keyboard answered, so the caller can tell "nothing happened" from "done".
 */
export async function writeViaLighting(
  device: HidDevice,
  channel: number,
  request: ViaLightingRequest,
  save: boolean,
): Promise<{ sent: number; answered: number }> {
  if (!LIGHTING_CHANNELS.some((c) => c.channel === channel)) return { sent: 0, answered: 0 };
  const packets = lightingPackets(channel, request);
  if (save) packets.push(savePacket(channel));
  const opened = !device.opened;
  try {
    if (opened) await device.open();
    let answered = 0;
    for (const packet of packets) {
      const reply = await ask(device, packet, TIMEOUT_MS, isSafeLightingWrite);
      // A keyboard that handles the command echoes its id; 0xff means "unhandled".
      if (reply && reply[0] === packet[0]) answered++;
    }
    return { sent: packets.length, answered };
  } finally {
    if (opened) await Promise.allSettled([device.close()]);
  }
}
