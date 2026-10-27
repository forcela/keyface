import { KeyboardProfile, findProfile } from './keyboard-profiles';
import { VIA_USAGE_PAGE } from './via/via-protocol';
import { HidCollectionInfo, HidDeviceLike } from './webhid.types';

/** Pure description of what the browser reports about a connected HID device. No WebHID calls here. */

/** Sonix, the chip maker behind the vendor id the AK820 Pro reports. */
export const SONIX_VENDOR_ID = 0x0c45;

/** Vendor-defined interface that takes the 64-byte configuration commands. */
export const USAGE_PAGE_CONTROL = 0xff13;
/** Vendor-defined interface that takes the 4096-byte image data. */
export const USAGE_PAGE_DATA = 0xff68;

export interface DetectedKeyboard {
  /** `vvvv:pppp`, lowercase hex. */
  id: string;
  name: string;
  vendorId: number;
  productId: number;
  /** Every HID interface the keyboard exposes, merged and sorted. */
  collections: HidCollectionInfo[];
  /** The profile this keyboard matches, or null when the model is not known. */
  profile: KeyboardProfile | null;
  /**
   * Exposes the VIA raw HID interface (usage page 0xff60). This only says the keyboard speaks VIA, not
   * what it can do: that comes from reading it, or from a profile.
   */
  via: boolean;
  /** Display name of the recognised model, or null. */
  model: string | null;
  /**
   * Safe to write to: a model this project knows AND both vendor interfaces visible. An unknown
   * keyboard is never written to, even if it exposes the same interfaces.
   */
  ready: boolean;
}

export const hex = (value: number, width = 4): string => value.toString(16).padStart(width, '0');

export const deviceId = (device: Pick<HidDeviceLike, 'vendorId' | 'productId'>): string =>
  `${hex(device.vendorId)}:${hex(device.productId)}`;

export const hasUsagePage = (device: Pick<HidDeviceLike, 'collections'>, usagePage: number): boolean =>
  device.collections.some((collection) => collection.usagePage === usagePage);

/**
 * Chrome returns one `HIDDevice` per HID interface, so one physical keyboard shows up several
 * times. Merge them by vendor and product id.
 */
export function groupKeyboards(devices: readonly HidDeviceLike[]): DetectedKeyboard[] {
  const byId = new Map<string, DetectedKeyboard>();
  for (const device of devices) {
    const id = deviceId(device);
    const profile = findProfile(id);
    const entry = byId.get(id) ?? {
      id,
      name: device.productName || 'Clavier',
      vendorId: device.vendorId,
      productId: device.productId,
      collections: [],
      profile,
      via: false,
      model: profile?.name ?? null,
      ready: false,
    };
    for (const { usagePage, usage } of device.collections) {
      if (!entry.collections.some((c) => c.usagePage === usagePage && c.usage === usage)) {
        entry.collections.push({ usagePage, usage });
      }
    }
    byId.set(id, entry);
  }
  return [...byId.values()].map((entry) => {
    const collections = [...entry.collections].sort((a, b) => a.usagePage - b.usagePage || a.usage - b.usage);
    return {
      ...entry,
      collections,
      via: hasUsagePage(entry, VIA_USAGE_PAGE),
      ready:
        entry.model !== null && hasUsagePage(entry, USAGE_PAGE_CONTROL) && hasUsagePage(entry, USAGE_PAGE_DATA),
    };
  });
}

export const describeCollection = (collection: HidCollectionInfo): string =>
  `page 0x${hex(collection.usagePage)} · usage 0x${hex(collection.usage)}`;

/** Plain text a user can paste in an issue so the right protocol can be picked for their keyboard. */
export function diagnosticText(keyboards: readonly DetectedKeyboard[], userAgent: string): string {
  if (keyboards.length === 0) return 'Aucun clavier détecté.';
  const lines = keyboards.flatMap((keyboard) => [
    `${keyboard.model ?? 'Modèle non reconnu'} : ${keyboard.name}`,
    `  id ${keyboard.id}`,
    ...keyboard.collections.map((collection) => `  ${describeCollection(collection)}`),
  ]);
  return [...lines, `Navigateur : ${userAgent}`].join('\n');
}
