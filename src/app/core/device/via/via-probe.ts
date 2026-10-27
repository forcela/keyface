import { HidDevice } from '../webhid.types';
import {
  LIGHTING_CHANNELS,
  LightingChannelId,
  isSafeRead,
  parseFirmwareVersion,
  parseLayerCount,
  parseLightingAnswer,
  parseProtocolVersion,
  requestFirmwareVersion,
  requestLayerCount,
  requestLighting,
  requestProtocolVersion,
} from './via-protocol';

/** What a VIA keyboard tells us about itself. Everything here was read, nothing was written. */
export interface ViaInfo {
  protocolVersion: number;
  layerCount: number | null;
  /** `null` when the firmware does not define one. */
  firmwareVersion: number | null;
  /** Lighting channels that answered. A keyboard may still have lighting this cannot see. */
  lighting: LightingChannelId[];
}

const DEFAULT_TIMEOUT_MS = 1000;
/** Raw HID has no report id. */
const REPORT_ID = 0;

type InputReportEvent = Event & { data: DataView };

/**
 * Sends one packet and waits for the keyboard's 32-byte answer, or null after the timeout. `allowed` is
 * the whitelist the packet must pass first: reads by default, lighting writes from `via-write.ts`.
 */
export function ask(
  device: HidDevice,
  packet: Uint8Array,
  timeoutMs: number,
  allowed: (packet: Uint8Array) => boolean = isSafeRead,
): Promise<Uint8Array | null> {
  if (!allowed(packet)) throw new Error('Refusé : ce n’est pas une requête connue et sûre.');
  return new Promise((resolve, reject) => {
    const finish = (reply: Uint8Array | null) => {
      clearTimeout(timer);
      device.removeEventListener('inputreport', onReport);
      resolve(reply);
    };
    const onReport = (event: Event) => {
      const { data } = event as InputReportEvent;
      finish(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    device.addEventListener('inputreport', onReport);
    device.sendReport(REPORT_ID, packet as BufferSource).catch((error: unknown) => {
      clearTimeout(timer);
      device.removeEventListener('inputreport', onReport);
      reject(error);
    });
  });
}

/**
 * Reads what a VIA keyboard reports: protocol version, layer count, firmware version and which lighting
 * channels answer. Returns null when the device does not answer like a VIA keyboard. Only the requests
 * from `via-protocol.ts` are sent, and the device is closed afterwards if this opened it.
 */
export async function readViaInfo(device: HidDevice, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<ViaInfo | null> {
  const opened = !device.opened;
  try {
    if (opened) await device.open();
    const version = await ask(device, requestProtocolVersion(), timeoutMs);
    const protocolVersion = version && parseProtocolVersion(version);
    if (protocolVersion === null || protocolVersion === undefined || protocolVersion === 0) return null;

    const layers = await ask(device, requestLayerCount(), timeoutMs);
    const firmware = await ask(device, requestFirmwareVersion(), timeoutMs);
    const lighting: LightingChannelId[] = [];
    for (const { channel, id } of LIGHTING_CHANNELS) {
      const answer = await ask(device, requestLighting(channel), timeoutMs);
      if (answer && parseLightingAnswer(answer, channel)) lighting.push(id);
    }
    return {
      protocolVersion,
      layerCount: layers ? parseLayerCount(layers) : null,
      firmwareVersion: firmware ? parseFirmwareVersion(firmware) : null,
      lighting,
    };
  } finally {
    if (opened) await Promise.allSettled([device.close()]);
  }
}
