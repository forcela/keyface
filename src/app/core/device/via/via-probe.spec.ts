import { HidDevice } from '../webhid.types';
import { ViaCommand, isSafeRead } from './via-protocol';
import { readViaInfo } from './via-probe';

interface FakeOptions {
  protocolVersion?: number;
  layers?: number;
  firmware?: number;
  channels?: number[];
  silent?: boolean;
}

/** A keyboard that answers like QMK's `via.c`: the same buffer back, command id kept, 0xff when unhandled. */
class FakeViaKeyboard extends EventTarget {
  opened = false;
  vendorId = 0x1234;
  productId = 0x5678;
  productName = 'Fake VIA';
  collections = [{ usagePage: 0xff60, usage: 0x61 }];
  readonly sent: Uint8Array[] = [];
  readonly events: string[] = [];

  constructor(private readonly options: FakeOptions = {}) {
    super();
  }

  async open() {
    this.opened = true;
    this.events.push('open');
  }
  async close() {
    this.opened = false;
    this.events.push('close');
  }
  async sendFeatureReport() {
    throw new Error('VIA must not use feature reports');
  }
  async receiveFeatureReport(): Promise<DataView> {
    throw new Error('VIA must not use feature reports');
  }

  async sendReport(_id: number, data: BufferSource) {
    const request = new Uint8Array(data as ArrayBuffer);
    this.sent.push(request.slice());
    if (this.options.silent) return;
    const reply = request.slice();
    const { protocolVersion = 13, layers = 4, firmware = 0, channels = [3] } = this.options;
    switch (request[0]) {
      case ViaCommand.GetProtocolVersion:
        reply[1] = protocolVersion >> 8;
        reply[2] = protocolVersion & 0xff;
        break;
      case ViaCommand.GetLayerCount:
        reply[1] = layers;
        break;
      case ViaCommand.GetKeyboardValue:
        [reply[2], reply[3], reply[4], reply[5]] = [firmware >>> 24, (firmware >>> 16) & 0xff, (firmware >>> 8) & 0xff, firmware & 0xff];
        break;
      case ViaCommand.CustomGetValue:
        if (channels.includes(request[1])) reply[3] = 128;
        else reply[0] = ViaCommand.Unhandled;
        break;
      default:
        reply[0] = ViaCommand.Unhandled;
    }
    setTimeout(() => {
      const event = new Event('inputreport') as Event & { data: DataView };
      event.data = new DataView(reply.buffer);
      this.dispatchEvent(event);
    }, 0);
  }
}

const device = (keyboard: FakeViaKeyboard) => keyboard as unknown as HidDevice;

describe('readViaInfo', () => {
  it('reads the protocol version, layers, firmware and the lighting channels that answer', async () => {
    const keyboard = new FakeViaKeyboard({ protocolVersion: 13, layers: 5, firmware: 258, channels: [2, 3] });
    const info = await readViaInfo(device(keyboard), 50);
    expect(info).toEqual({ protocolVersion: 13, layerCount: 5, firmwareVersion: 258, lighting: ['rgblight', 'rgb_matrix'] });
  });

  it('reports no firmware version and no lighting when the keyboard has none', async () => {
    const info = await readViaInfo(device(new FakeViaKeyboard({ firmware: 0, channels: [] })), 50);
    expect(info).toMatchObject({ firmwareVersion: null, lighting: [] });
  });

  it('returns null for a device that does not answer like VIA', async () => {
    expect(await readViaInfo(device(new FakeViaKeyboard({ silent: true })), 20)).toBeNull();
    expect(await readViaInfo(device(new FakeViaKeyboard({ protocolVersion: 0 })), 50)).toBeNull();
  });

  describe('safety', () => {
    it('sends only read requests, never a write command', async () => {
      const keyboard = new FakeViaKeyboard({ channels: [1, 2, 3, 5] });
      await readViaInfo(device(keyboard), 50);
      expect(keyboard.sent.length).toBeGreaterThan(0);
      expect(keyboard.sent.every(isSafeRead)).toBe(true);
      const WRITES = [0x03, 0x05, 0x06, 0x07, 0x09, 0x0a, 0x0b, 0x0f, 0x10, 0x13, 0x15];
      expect(keyboard.sent.some((packet) => WRITES.includes(packet[0]))).toBe(false);
    });

    it('asks nothing of the keyboard-specific channel 0', async () => {
      const keyboard = new FakeViaKeyboard();
      await readViaInfo(device(keyboard), 50);
      const custom = keyboard.sent.filter((packet) => packet[0] === ViaCommand.CustomGetValue);
      expect(custom.map((packet) => packet[1])).toEqual([1, 2, 3, 5]);
    });

    it('opens the device for the reading and closes it after', async () => {
      const keyboard = new FakeViaKeyboard();
      await readViaInfo(device(keyboard), 50);
      expect(keyboard.events).toEqual(['open', 'close']);
    });

    it('leaves a device it did not open open', async () => {
      const keyboard = new FakeViaKeyboard();
      keyboard.opened = true;
      await readViaInfo(device(keyboard), 50);
      expect(keyboard.events).toEqual([]);
    });

    it('closes the device even when a write to it fails', async () => {
      const keyboard = new FakeViaKeyboard();
      keyboard.sendReport = async () => {
        throw new Error('unplugged');
      };
      await expect(readViaInfo(device(keyboard), 50)).rejects.toThrow('unplugged');
      expect(keyboard.events.at(-1)).toBe('close');
    });
  });
});
