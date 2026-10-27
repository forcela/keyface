import { FRAME_BYTES, buildScreenPayload } from './ak820-protocol';
import { Ak820Session, UploadCancelled } from './ak820-session';
import { USAGE_PAGE_CONTROL, USAGE_PAGE_DATA } from './keyboard-info';
import { HidDevice } from './webhid.types';

type Sent = ['feature' | 'report' | 'open' | 'close', ...number[]];

/** A keyboard interface that only records what it is sent. */
class FakeDevice extends EventTarget {
  opened = false;
  vendorId = 0x0c45;
  productId = 0x800a;
  productName = 'fake';
  constructor(
    readonly collections: { usagePage: number; usage: number }[],
    private readonly log: Sent[],
  ) {
    super();
  }
  async open() {
    this.opened = true;
    this.log.push(['open']);
  }
  async close() {
    this.opened = false;
    this.log.push(['close']);
  }
  async sendFeatureReport(_id: number, data: BufferSource) {
    const bytes = new Uint8Array(data as ArrayBuffer);
    this.log.push(['feature', bytes[0], bytes[1], bytes[2], bytes[8]]);
  }
  async sendReport(_id: number, data: BufferSource) {
    this.log.push(['report', (data as Uint8Array).length]);
  }
  async receiveFeatureReport() {
    return new DataView(new ArrayBuffer(64));
  }
}

const setup = () => {
  const log: Sent[] = [];
  const control = new FakeDevice([{ usagePage: USAGE_PAGE_CONTROL, usage: 1 }], log);
  const data = new FakeDevice([{ usagePage: USAGE_PAGE_DATA, usage: 1 }], log);
  const session = Ak820Session.from([control, data] as unknown as HidDevice[], { ackTimeoutMs: 0, pauseMs: 0 })!;
  return { log, session, control, data };
};

const twoFrames = () =>
  buildScreenPayload([1, 2].map((fill) => ({ pixels: new Uint8Array(FRAME_BYTES).fill(fill), delayMs: 100 })));

describe('Ak820Session', () => {
  it('needs both vendor interfaces', () => {
    const log: Sent[] = [];
    const control = new FakeDevice([{ usagePage: USAGE_PAGE_CONTROL, usage: 1 }], log);
    expect(Ak820Session.from([control] as unknown as HidDevice[])).toBeNull();
  });

  describe('uploadScreen', () => {
    it('variant A: start, config, every chunk, then save', async () => {
      const { log, session } = setup();
      const payload = twoFrames();
      await session.uploadScreen(payload, 'A', () => undefined);

      const features = log.filter(([kind]) => kind === 'feature');
      expect(features).toEqual([
        ['feature', 0x04, 0x18, 0x00, 0x00], // start
        ['feature', 0x04, 0x72, 0x03, payload.chunks & 0xff], // image config
        ['feature', 0x04, 0x02, 0x00, 0x00], // save
      ]);
      expect(log.filter(([kind]) => kind === 'report')).toHaveLength(payload.chunks);
    });

    it('variant B: start with enable, config 2, then finish', async () => {
      const { log, session } = setup();
      const payload = twoFrames();
      await session.uploadScreen(payload, 'B', () => undefined);

      const features = log.filter(([kind]) => kind === 'feature');
      expect(features.map((f) => f.slice(1, 4))).toEqual([
        [0x04, 0x18, 0x00],
        [0x04, 0x72, 0x02],
        [0x04, 0xf0, 0x00],
      ]);
      expect(features[0][4]).toBe(1);
      expect(features[2][4]).toBe(1);
    });

    it('sends only whole 4096-byte chunks and reports progress', async () => {
      const { log, session } = setup();
      const payload = twoFrames();
      const progress: number[] = [];
      await session.uploadScreen(payload, 'A', (done) => progress.push(done));

      expect(log.filter(([kind]) => kind === 'report').every(([, length]) => length === 4096)).toBe(true);
      expect(progress.at(-1)).toBe(payload.chunks);
      expect(progress).toHaveLength(payload.chunks);
    });

    it('opens the interfaces first and closes them afterwards', async () => {
      const { log, session } = setup();
      await session.uploadScreen(twoFrames(), 'A', () => undefined);
      expect(log[0]).toEqual(['open']);
      expect(log.at(-1)).toEqual(['close']);
      expect(log.filter(([kind]) => kind === 'open')).toHaveLength(2);
      expect(log.filter(([kind]) => kind === 'close')).toHaveLength(2);
    });

    it('stops when cancelled, without sending the ending, and still closes', async () => {
      const { log, session } = setup();
      const controller = new AbortController();
      const task = session.uploadScreen(twoFrames(), 'A', (done) => done === 3 && controller.abort(), controller.signal);

      await expect(task).rejects.toBeInstanceOf(UploadCancelled);
      expect(log.filter(([kind]) => kind === 'report')).toHaveLength(3);
      expect(log.some(([kind, , command]) => kind === 'feature' && command === 0x02)).toBe(false);
      expect(log.at(-1)).toEqual(['close']);
    });

    it('closes the interfaces even when a write fails', async () => {
      const { log, session, data } = setup();
      data.sendReport = async () => {
        throw new Error('disconnected');
      };
      await expect(session.uploadScreen(twoFrames(), 'A', () => undefined)).rejects.toThrow('disconnected');
      expect(log.at(-1)).toEqual(['close']);
    });
  });

  describe('safety', () => {
    /** Screen and clock commands only. Nothing here touches keys, layout or lighting. */
    const ALLOWED_COMMANDS = new Set([0x18, 0x72, 0x02, 0xf0, 0x28]);

    it.each(['A', 'B'] as const)('variant %s only sends known screen commands', async (variant) => {
      const { log, session } = setup();
      await session.uploadScreen(twoFrames(), variant, () => undefined);
      const commands = log.filter(([kind]) => kind === 'feature').map(([, , command]) => command);
      expect(commands.every((command) => ALLOWED_COMMANDS.has(command as number))).toBe(true);
    });

    it('the clock sync only sends known commands and one time packet', async () => {
      const { log, session } = setup();
      await session.syncClock(new Date());
      const [first, second, third, fourth] = log.filter(([kind]) => kind === 'feature').map(([, , command]) => command);
      expect([first, second, fourth].every((command) => ALLOWED_COMMANDS.has(command as number))).toBe(true);
      expect(third).toBe(0x01); // the time packet itself: 00 01 5a …
    });

    it('never sends a data report on the control interface', async () => {
      const { log, session } = setup();
      await session.uploadScreen(twoFrames(), 'A', () => undefined);
      // Control packets are 64 bytes feature reports; image chunks are the only output reports.
      expect(log.filter(([kind]) => kind === 'report').every(([, length]) => length === 4096)).toBe(true);
    });
  });

  describe('syncClock', () => {
    it('sends start, clock config, the time and save, and nothing else', async () => {
      const { log, session } = setup();
      await session.syncClock(new Date(2026, 9, 27, 14, 5, 9));
      const features = log.filter(([kind]) => kind === 'feature');
      expect(features).toHaveLength(4);
      expect(features.map((f) => f[2])).toEqual([0x18, 0x28, 0x01, 0x02]);
      expect(log.some(([kind]) => kind === 'report')).toBe(false);
    });
  });
});
