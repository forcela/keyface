import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { FrameSequence } from '@core/rendering/frame-sequence';
import { LightingStore } from '@core/state/lighting.store';
import { StudioStore } from '@core/state/studio.store';
import { ViewStore } from '@core/state/view.store';
import { UploadVariant, buildScreenPayload, toRgb565, ScreenFrame, SCREEN_WIDTH } from './ak820-protocol';
import { Ak820Session, UploadCancelled } from './ak820-session';
import { LAMPARRAY_USAGE, LAMPARRAY_USAGE_PAGE, SONIX_VENDOR_ID, USAGE_PAGE_CONTROL, USAGE_PAGE_DATA, deviceId, diagnosticText, groupKeyboards } from './keyboard-info';
import { AK820_PRO } from './keyboard-profiles';
import { readBrowserSupport, unsupportedReason } from './browser-support';
import { ViaInfo, readViaInfo } from './via/via-probe';
import { ViaLightingRequest } from './via/via-lighting';
import { VIA_USAGE, VIA_USAGE_PAGE } from './via/via-protocol';
import { writeViaLighting } from './via/via-write';
import { HidDevice, getHidApi } from './webhid.types';

export type TransferState = 'idle' | 'working' | 'done' | 'error';
/** What the user is about to write to the keyboard. */
export type SendKind = 'screen' | 'lighting';

export interface TransferStatus {
  state: TransferState;
  message: string;
  done: number;
  total: number;
}

const IDLE: TransferStatus = { state: 'idle', message: '', done: 0, total: 0 };
const failure = (message: string): TransferStatus => ({ state: 'error', message, done: 0, total: 0 });

/**
 * Finds keyboards through WebHID (Chrome and Edge) and writes to them: the screen animation, the
 * backlight and the clock. It only ever sends the sequences in `ak820-session.ts`, only to a keyboard
 * that has a profile, only after an explicit confirmation, and only on a user's click.
 */
@Injectable({ providedIn: 'root' })
export class KeyboardService {
  private readonly hid = getHidApi();
  private readonly sequence = inject(FrameSequence);
  private readonly studio = inject(StudioStore);
  private readonly lighting = inject(LightingStore);
  private readonly view = inject(ViewStore);
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
  /** What the page shows features for: the connected model, or the AK820 Pro until one is connected. */
  readonly profile = computed(() => this.readyKeyboard()?.profile ?? AK820_PRO);

  /** What was read from VIA keyboards, by keyboard id. `null` means it was tried and did not answer like VIA. */
  readonly viaInfo = signal<Readonly<Record<string, ViaInfo | null>>>({});
  readonly viaBusy = signal(false);
  /** Ticked by the user: "I understand VIA lighting is experimental on a model that is not confirmed". */
  readonly viaConsent = signal(false);

  /** The write the user is being asked to confirm, or null. */
  readonly pending = signal<SendKind | null>(null);
  /** Ticked by the user: "my keyboard is the model and layout this was confirmed on". Reset each time. */
  readonly layoutConfirmed = signal(false);

  constructor() {
    // A result or a pending confirmation belongs to the tab it was started in.
    effect(() => {
      this.view.mode();
      untracked(() => {
        if (this.busy()) return;
        this.status.set(IDLE);
        this.pending.set(null);
      });
    });
    if (!this.hid) return;
    // Keyboards the user already allowed on an earlier visit show up without a prompt.
    void this.refresh().then(() => this.readVia());
    this.hid.addEventListener('connect', () => void this.refresh());
    this.hid.addEventListener('disconnect', () => void this.refresh());
  }

  /**
   * Opens the browser's device chooser for every kind of keyboard Keyface knows (the AK820 Pro, VIA
   * keyboards, HID LampArray), then reads what the VIA ones report (reads only). Must be called from a click.
   */
  async connect(): Promise<void> {
    if (!this.hid || this.busy()) return;
    try {
      await this.hid.requestDevice({
        filters: [
          { vendorId: SONIX_VENDOR_ID, usagePage: USAGE_PAGE_CONTROL },
          { vendorId: SONIX_VENDOR_ID, usagePage: USAGE_PAGE_DATA },
          { usagePage: VIA_USAGE_PAGE, usage: VIA_USAGE },
          { usagePage: LAMPARRAY_USAGE_PAGE, usage: LAMPARRAY_USAGE },
        ],
      });
    } catch (error) {
      // Closing the chooser without a choice is not a failure.
      if (error instanceof DOMException && error.name === 'NotFoundError') return;
      this.status.set(failure(this.messageOf(error)));
      return;
    }
    await this.refresh();
    this.status.set(IDLE);
    await this.readVia();
  }

  /** Reads the VIA information of every VIA keyboard that has not been read yet (or of one, again). */
  async readVia(onlyId?: string): Promise<void> {
    if (this.viaBusy()) return;
    this.viaBusy.set(true);
    try {
      for (const device of this.devices()) {
        const id = deviceId(device);
        const isVia = device.collections.some((c) => c.usagePage === VIA_USAGE_PAGE && c.usage === VIA_USAGE);
        if (!isVia || (onlyId ? id !== onlyId : id in this.viaInfo())) continue;
        const info = await readViaInfo(device).catch(() => null);
        this.viaInfo.update((all) => ({ ...all, [id]: info }));
      }
    } finally {
      this.viaBusy.set(false);
    }
  }

  /**
   * Experimental: changes the lighting of a VIA keyboard that has no profile yet. Needs the user's
   * consent (`viaConsent`), only sends the lighting writes of `via-lighting.ts`, and only stores them in
   * the keyboard's memory when `save` is true; otherwise they last until it is unplugged.
   */
  async applyViaLighting(keyboardId: string, channel: number, request: ViaLightingRequest, save: boolean): Promise<void> {
    if (this.busy() || !this.viaConsent()) return;
    const device = this.devices().find(
      (d) => deviceId(d) === keyboardId && d.collections.some((c) => c.usagePage === VIA_USAGE_PAGE && c.usage === VIA_USAGE),
    );
    if (!device) return void this.status.set(failure('Clavier VIA introuvable. Clique sur « Détecter un autre clavier ».'));
    this.status.set({ state: 'working', message: 'Envoi de l’éclairage…', done: 0, total: 0 });
    try {
      const { sent, answered } = await writeViaLighting(device, channel, request, save);
      this.status.set(
        sent === 0
          ? failure('Rien à envoyer pour ce type d’éclairage.')
          : answered < sent
            ? failure('Le clavier n’a pas répondu à tout : cet éclairage n’est peut-être pas réglable ainsi sur ce modèle.')
            : { state: 'done', message: save ? 'Éclairage enregistré sur le clavier.' : 'Éclairage changé (temporaire : il revient au débranchement).', done: 0, total: 0 },
      );
    } catch (error) {
      this.status.set(failure(this.messageOf(error)));
    }
  }

  /**
   * One-click flow behind the send button: pick a keyboard if none is ready, then ask for
   * confirmation. Nothing is written until `confirmSend()`.
   */
  async requestSend(kind: SendKind): Promise<void> {
    if (this.busy()) return;
    if (!this.readyKeyboard()) await this.connect();
    const ready = this.readyKeyboard();
    if (ready) {
      const missing = this.missingCapability(kind);
      if (missing) return void this.status.set(failure(missing));
      this.status.set(IDLE);
      this.layoutConfirmed.set(false);
      this.pending.set(kind);
      return;
    }
    const chosen = this.keyboards()[0];
    if (!chosen) return; // The chooser was closed without a choice.
    this.status.set(
      failure(
        (chosen.via || chosen.lampArray) && chosen.model === null
          ? chosen.via
            ? 'Clavier compatible VIA : règle son éclairage dans la zone « Ton clavier » (expérimental). L’écran et les images ne passent pas par ici.'
            : 'Clavier « Éclairage dynamique » : Keyface le détecte mais ne sait pas encore le piloter.'
          : chosen.model === null
            ? 'Modèle non reconnu : l’envoi est désactivé pour ne rien risquer. Copie le diagnostic (zone « Avancé »).'
            : 'Il manque une partie du clavier. Branche-le en USB (mode filaire) et sélectionne toutes ses entrées.',
      ),
    );
  }

  async confirmSend(): Promise<void> {
    const kind = this.pending();
    if (!kind || !this.layoutConfirmed()) return;
    this.pending.set(null);
    if (kind === 'screen') await this.sendAnimation();
    else await this.applyLighting();
  }

  cancelConfirm(): void {
    this.pending.set(null);
  }

  cancelTransfer(): void {
    this.cancel?.abort();
  }

  async syncClock(): Promise<void> {
    await this.run('Réglage de l’heure', async (session) => {
      await session.syncClock(new Date());
      return 'Heure du clavier réglée.';
    });
  }

  private async sendAnimation(): Promise<void> {
    await this.run('Envoi à l’écran', async (session, signal) => {
      const payload = buildScreenPayload(await this.renderFrames());
      const report = (done: number, total: number) =>
        this.status.set({ state: 'working', message: 'Envoi à l’écran…', done, total });
      report(0, payload.chunks);
      await session.uploadScreen(payload, this.variant(), report, signal);
      return 'Animation envoyée. Si l’écran ne change pas, débranche puis rebranche le câble.';
    });
  }

  private async applyLighting(): Promise<void> {
    await this.run('Envoi de l’éclairage', async (session) => {
      await session.applyLighting(this.lighting.settings());
      return 'Éclairage envoyé au clavier. Si rien ne change, débranche puis rebranche le câble.';
    });
  }

  /** Explains why this keyboard cannot do `kind`, or null when it can. */
  private missingCapability(kind: SendKind): string | null {
    const { capabilities, name } = this.profile();
    if (kind === 'screen' && !capabilities.screen) return `${name} n’a pas d’écran.`;
    if (kind === 'lighting' && !capabilities.backlight) return `${name} n’a pas de rétroéclairage réglable ici.`;
    return null;
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
      this.status.set(
        failure(
          error instanceof UploadCancelled
            ? 'Envoi annulé. L’écran peut rester vide jusqu’au prochain envoi.'
            : this.messageOf(error),
        ),
      );
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

  private messageOf(error: unknown): string {
    return error instanceof Error ? error.message : 'Échec de la communication avec le clavier.';
  }

  private async refresh(): Promise<void> {
    if (this.hid) this.devices.set(await this.hid.getDevices());
  }
}
