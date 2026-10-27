import {
  Command,
  ScreenPayload,
  UploadVariant,
  VARIANTS,
  clockPacket,
  commandPacket,
  imageConfigPacket,
  splitChunks,
} from './ak820-protocol';
import { LightingSettings } from '@core/lighting/lighting.model';
import { lightingPacket } from './ak820-lighting';
import { USAGE_PAGE_CONTROL, USAGE_PAGE_DATA, hasUsagePage } from './keyboard-info';
import { HidDevice } from './webhid.types';

export interface SessionTiming {
  /** How long to wait for the keyboard to acknowledge one image chunk. */
  ackTimeoutMs: number;
  /** Pause between control commands. */
  pauseMs: number;
}

const DEFAULT_TIMING: SessionTiming = { ackTimeoutMs: 300, pauseMs: 40 };
/** Control packets are sent as feature reports with this id, whatever the descriptor says. */
const REPORT_ID = 0x00;

export class UploadCancelled extends Error {
  constructor() {
    super('Envoi annulé.');
  }
}

const sleep = (ms: number) => (ms > 0 ? new Promise<void>((resolve) => setTimeout(resolve, ms)) : Promise.resolve());

/**
 * Talks to one keyboard over its two vendor interfaces: a control one (64-byte feature reports)
 * and a data one (4096-byte output reports). It only ever sends the sequences below.
 */
export class Ak820Session {
  private constructor(
    private readonly control: HidDevice,
    private readonly data: HidDevice,
    private readonly timing: SessionTiming,
  ) {}

  /** Finds both interfaces among the devices the user allowed, or null if one is missing. */
  static from(devices: readonly HidDevice[], timing: Partial<SessionTiming> = {}): Ak820Session | null {
    const control = devices.find((device) => hasUsagePage(device, USAGE_PAGE_CONTROL));
    const data = devices.find((device) => hasUsagePage(device, USAGE_PAGE_DATA));
    return control && data ? new Ak820Session(control, data, { ...DEFAULT_TIMING, ...timing }) : null;
  }

  /** Start, announce the chunks, send them one by one, then close with the variant's ending. */
  async uploadScreen(
    payload: ScreenPayload,
    variant: UploadVariant,
    onProgress: (done: number, total: number) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const { startEnable, configSub, end } = VARIANTS[variant];
    await this.withOpenDevices(async () => {
      await this.command(commandPacket(Command.Start, 0, startEnable));
      await this.command(imageConfigPacket(payload.chunks, configSub));
      const chunks = splitChunks(payload);
      for (const [index, chunk] of chunks.entries()) {
        if (signal?.aborted) throw new UploadCancelled();
        await this.data.sendReport(REPORT_ID, chunk as BufferSource);
        await this.waitForAck();
        onProgress(index + 1, chunks.length);
      }
      await this.command(commandPacket(end.command, 0, end.enable));
    });
  }

  /** Start, announce a lighting change, send the mode packet, then save. */
  async applyLighting(settings: LightingSettings): Promise<void> {
    await this.withOpenDevices(async () => {
      await this.command(commandPacket(Command.Start, 0, 1));
      await this.command(commandPacket(Command.LightingConfig, 0, 1));
      await this.control.sendFeatureReport(REPORT_ID, lightingPacket(settings) as BufferSource);
      await sleep(this.timing.pauseMs);
      await this.command(commandPacket(Command.Save, 0, 0));
    });
  }

  /** Sets the keyboard's own clock page to `date`. */
  async syncClock(date: Date): Promise<void> {
    await this.withOpenDevices(async () => {
      await this.command(commandPacket(Command.Start, 0, 1));
      await this.command(commandPacket(Command.ClockConfig, 0, 1));
      await this.control.sendFeatureReport(REPORT_ID, clockPacket(date) as BufferSource);
      await sleep(this.timing.pauseMs);
      await this.command(commandPacket(Command.Save, 0, 0));
    });
  }

  /** Sends one control packet and reads the keyboard's answer. */
  private async command(packet: Uint8Array): Promise<void> {
    await this.control.sendFeatureReport(REPORT_ID, packet as BufferSource);
    await sleep(this.timing.pauseMs);
    try {
      await this.control.receiveFeatureReport(REPORT_ID);
    } catch {
      // Community projects disagree on whether every step answers, so a missing answer is not an error.
    }
  }

  /** Resolves true when the data interface reports back, false after the timeout. A timeout is normal. */
  private waitForAck(): Promise<boolean> {
    return new Promise((resolve) => {
      const done = (acknowledged: boolean) => {
        clearTimeout(timer);
        this.data.removeEventListener('inputreport', onReport);
        resolve(acknowledged);
      };
      const onReport = () => done(true);
      const timer = setTimeout(() => done(false), this.timing.ackTimeoutMs);
      this.data.addEventListener('inputreport', onReport);
    });
  }

  /** Opens the interfaces for the duration of `task` and closes only those it opened. */
  private async withOpenDevices(task: () => Promise<void>): Promise<void> {
    const opened: HidDevice[] = [];
    try {
      for (const device of new Set([this.control, this.data])) {
        if (!device.opened) {
          await device.open();
          opened.push(device);
        }
      }
      await task();
    } finally {
      await Promise.allSettled(opened.map((device) => device.close()));
    }
  }
}
