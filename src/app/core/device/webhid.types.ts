/**
 * The part of the WebHID API this project uses. TypeScript's DOM library does not include it,
 * and a hand-written subset keeps tests free to pass plain fake devices.
 */

export interface HidCollectionInfo {
  usagePage: number;
  usage: number;
}

export interface HidDeviceLike {
  vendorId: number;
  productId: number;
  productName: string;
  collections: readonly HidCollectionInfo[];
}

export interface HidDevice extends HidDeviceLike, EventTarget {
  readonly opened: boolean;
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<DataView>;
}

export interface HidDeviceFilter {
  vendorId?: number;
  usagePage?: number;
  usage?: number;
}

export interface HidApi extends EventTarget {
  getDevices(): Promise<HidDevice[]>;
  requestDevice(options: { filters: HidDeviceFilter[] }): Promise<HidDevice[]>;
}

/** The browser's WebHID entry point, or null where it is missing (Firefox, Safari). */
export function getHidApi(): HidApi | null {
  return typeof navigator !== 'undefined' && 'hid' in navigator
    ? (navigator as unknown as { hid: HidApi }).hid
    : null;
}
