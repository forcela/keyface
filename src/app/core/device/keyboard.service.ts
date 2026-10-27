import { Injectable, computed, inject, signal } from '@angular/core';
import { FrameSequence } from '@core/rendering/frame-sequence';
import { StudioStore } from '@core/state/studio.store';
import { UploadVariant, buildScreenPayload, toRgb565, ScreenFrame, SCREEN_WIDTH } from './ak820-protocol';
import { Ak820Session, UploadCancelled } from './ak820-session';
import { readBrowserSupport, unsupportedReason } from './browser-support';
import {
  SONIX_VENDOR_ID,
  USAGE_PAGE_CONTROL,
  USAGE_PAGE_DATA,
  deviceId,
  diagnosticText,
  groupKeyboards,
} from './keyboard-info';
import { HidDevice, getHidApi } from './webhid.types';

export type TransferState = 'idle' | 'working' | 'done' | 'error';

export interface TransferStatus {
  state: TransferState;
  message: string;
  done: number;
  total: number;
}

const IDLE: TransferStatus = { state: 'idle', message: '', done: 0, total: 0 };

/**
 * Finds keyboards through WebHID (Chrome and Edge) and sends them the screen animation and the
 * time. It only ever sends the sequences in `ak820-session.ts`, and only on a user's click.
 */
@Injectable({ providedIn: 'root' })
export class KeyboardService {
  private readonly hid = getHidApi();
  private readonly sequence = inject(FrameSequence);
  private readonly studio = inject(StudioStore);
  private readonly devices = signal<HidDevice[]>([]);
  private cancel: AbortController | null = null;

  readonly supported = this.hid !== null;
  /** Plain-language reason the direct send is unavailable, or null. */
  readonly unsupported = unsupportedReason(readBrowserSupport());
  readonly keyboards = computed(() => groupKeyboards(this.devices()));
  readonly diagnostic = computed(() => diagnosticText(this.keyboards(), navigator.userAgent));
  readonly status = signal<TransferStatus>(IDLE);
  readonly variant = signal<UploadVariant>('A');
  readonly busy = computed(() => this.status().state === 'working');
  /** The first keyboard that is safe to write to, or null. */
  readonly readyKeyboard = computed(() => this.keyboards().find((keyboard) => keyboard.ready) ?? null);
  /** True while the user is asked to confirm a send. */
  readonly confirming = signal(false);

  constructor() {
    if (!this.hid) return;
    // Keyboards the user already allowed on an earlier visit show up without a prompt.
    void this.refresh();
    this.hid.addEventListener('connect', () => void this.refresh());
    this.hid.addEventListener('disconnect', () => void this.refresh());
  }

  /** Opens the browser's device chooser. Must be called from a click. */
  async connect(): Promise<void> {
    if (!this.hid) return;
    try {
      await this.hid.requestDevice({
        filters: [
          { vendorId: SONIX_VENDOR_ID, usagePage: USAGE_PAGE_CONTROL },
          { vendorId: SONIX_VENDOR_ID, usagePage: USAGE_PAGE_DATA },
        ],
      });
      await this.refresh();
      this.status.set(IDLE);
    } catch (error) {
      // Closing the chooser without a choice is not a failure.
      if (error instanceof DOMException && error.name === 'NotFoundError') return;
      this.fail(error);
    }
  }

  /**
   * One-click flow behind the "send" button: pick a keyboard if none is ready, then ask for
   * confirmation. Nothing is written until `confirmSend()`.
   */
  async requestSend(): Promise<void> {
    if (this.busy()) return;
    if (!this.readyKeyboard()) await this.connect();
    if (this.readyKeyboard()) {
      this.status.set(IDLE);
      this.confirming.set(true);
      return;
    }
    const chosen = this.keyboards()[0];
    if (!chosen) return; // The chooser was closed without a choice.
    this.status.set({
      state: 'error',
      message: chosen.model === null
        ? 'Modèle non reconnu : l’envoi est désactivé pour ne rien risquer. Copie le diagnostic (zone « Avancé »).'
        : 'Il manque une partie du clavier. Branche-le en USB (mode filaire) et sélectionne toutes ses entrées.',
      done: 0,
      total: 0,
    });
  }

  async confirmSend(): Promise<void> {
    this.confirming.set(false);
    await this.sendAnimation();
  }

  cancelConfirm(): void {
    this.confirming.set(false);
  }

  /** Sends the current style to the keyboard's screen. */
  async sendAnimation(): Promise<void> {
    await this.run('Envoi à l’écran', async (session, signal) => {
      const frames = await this.renderFrames();
      const payload = buildScreenPayload(frames);
      this.status.set({ state: 'working', message: 'Envoi à l’écran…', done: 0, total: payload.chunks });
      await session.uploadScreen(payload, this.variant(), (done, total) =>
        this.status.set({ state: 'working', message: 'Envoi à l’écran…', done, total }), signal);
      return 'Animation envoyée. Si l’écran ne change pas, débranche puis rebranche le câble.';
    });
  }

  async syncClock(): Promise<void> {
    await this.run('Réglage de l’heure', async (session) => {
      await session.syncClock(new Date());
      return 'Heure du clavier réglée.';
    });
  }

  cancelTransfer(): void {
    this.cancel?.abort();
  }

  private async run(
    label: string,
    task: (session: Ak820Session, signal: AbortSignal) => Promise<string>,
  ): Promise<void> {
    // Only the interfaces of the ready keyboard, so two plugged keyboards can never be mixed up.
    const ready = this.readyKeyboard();
    const session = ready ? Ak820Session.from(this.devices().filter((device) => deviceId(device) === ready.id)) : null;
    if (!session || this.busy()) return;
    this.cancel = new AbortController();
    this.status.set({ state: 'working', message: `${label}…`, done: 0, total: 0 });
    try {
      this.status.set({ state: 'done', message: await task(session, this.cancel.signal), done: 0, total: 0 });
    } catch (error) {
      if (error instanceof UploadCancelled) {
        this.status.set({ state: 'error', message: 'Envoi annulé. L’écran peut rester vide jusqu’au prochain envoi.', done: 0, total: 0 });
      } else {
        this.fail(error);
      }
    } finally {
      this.cancel = null;
    }
  }

  private async renderFrames(): Promise<ScreenFrame[]> {
    const frames: ScreenFrame[] = [];
    const delayMs = this.studio.delay();
    await this.sequence.forEachFrame((canvas) => {
      const image = canvas.getContext('2d')!.getImageData(0, 0, SCREEN_WIDTH, SCREEN_WIDTH);
      frames.push({ pixels: toRgb565(image.data), delayMs });
    });
    return frames;
  }

  private fail(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Échec de la communication avec le clavier.';
    this.status.set({ state: 'error', message, done: 0, total: 0 });
  }

  private async refresh(): Promise<void> {
    if (this.hid) this.devices.set(await this.hid.getDevices());
  }
}
