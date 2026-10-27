import { HidDevice } from '../webhid.types';
import { hexToHueSaturation, isSafeLightingWrite, lightingPackets, savePacket } from './via-lighting';
import { writeViaLighting } from './via-write';

/** Echoes every packet like QMK's `via.c`, and records what was sent. */
class FakeViaKeyboard extends EventTarget {
  opened = false;
  readonly sent: Uint8Array[] = [];
  readonly events: string[] = [];

  async open() {
    this.opened = true;
    this.events.push('open');
  }
  async close() {
    this.opened = false;
    this.events.push('close');
  }
  async sendReport(_id: number, data: BufferSource) {
    const request = new Uint8Array(data as ArrayBuffer).slice();
    this.sent.push(request);
    setTimeout(() => {
      const event = new Event('inputreport') as Event & { data: DataView };
      event.data = new DataView(request.buffer);
      this.dispatchEvent(event);
    }, 0);
  }
}

const device = (keyboard: FakeViaKeyboard) => keyboard as unknown as HidDevice;
const FORBIDDEN = [0x03, 0x05, 0x06, 0x0a, 0x0b, 0x0f, 0x10, 0x13, 0x15];

describe('VIA lighting write', () => {
  it('turns a colour into QMK hue and saturation bytes', () => {
    expect(hexToHueSaturation('#ff0000')).toEqual([0, 255]);
    expect(hexToHueSaturation('#00ff00')).toEqual([85, 255]);
    expect(hexToHueSaturation('#0000ff')).toEqual([170, 255]);
    expect(hexToHueSaturation('#ffffff')).toEqual([0, 0]);
    expect(hexToHueSaturation('not a colour')).toEqual([0, 0]);
  });

  describe('lightingPackets', () => {
    it('builds set_value packets: command, channel, value id, data', () => {
      const [brightness, effect, speed, color] = lightingPackets(3, { brightness: 200, effect: 4, speed: 90, color: '#00ff00' });
      expect([...brightness.slice(0, 4)]).toEqual([0x07, 3, 1, 200]);
      expect([...effect.slice(0, 4)]).toEqual([0x07, 3, 2, 4]);
      expect([...speed.slice(0, 4)]).toEqual([0x07, 3, 3, 90]);
      expect([...color.slice(0, 5)]).toEqual([0x07, 3, 4, 85, 255]);
      expect(brightness).toHaveLength(32);
    });

    it('leaves out the values a channel does not have', () => {
      expect(lightingPackets(1, { brightness: 10, effect: 2, speed: 5, color: '#ff0000' }).map((p) => p[2])).toEqual([1, 2]);
      expect(lightingPackets(5, { color: '#ff0000' })).toEqual([]);
    });

    it('clamps to one byte', () => {
      expect(lightingPackets(3, { brightness: 999 })[0][3]).toBe(255);
      expect(lightingPackets(3, { brightness: -4 })[0][3]).toBe(0);
    });

    it('sends nothing for an empty request', () => {
      expect(lightingPackets(3, {})).toEqual([]);
    });
  });

  describe('isSafeLightingWrite', () => {
    it('accepts what the builders make', () => {
      for (const channel of [1, 2, 3, 5]) {
        const all = [...lightingPackets(channel, { brightness: 1, effect: 1, speed: 1, color: '#123456' }), savePacket(channel)];
        expect(all.every(isSafeLightingWrite)).toBe(true);
      }
    });

    it('refuses channel 0, unknown channels and the audio channel', () => {
      for (const channel of [0, 4, 6, 255]) {
        const packet = lightingPackets(3, { brightness: 1 })[0];
        packet[1] = channel;
        expect(isSafeLightingWrite(packet)).toBe(false);
        expect(isSafeLightingWrite(savePacket(channel))).toBe(false);
      }
    });

    it('refuses every other command id, including keymap, macro, reset and bootloader', () => {
      for (const command of [...FORBIDDEN, 0x01, 0x02, 0x04, 0x08, 0x11, 0xff]) {
        const packet = lightingPackets(3, { brightness: 1 })[0];
        packet[0] = command;
        expect(isSafeLightingWrite(packet)).toBe(false);
      }
    });

    it('refuses unknown value ids, wrong lengths and trailing bytes', () => {
      const unknownValue = lightingPackets(3, { brightness: 1 })[0];
      unknownValue[2] = 9;
      expect(isSafeLightingWrite(unknownValue)).toBe(false);
      expect(isSafeLightingWrite(new Uint8Array(31))).toBe(false);
      const trailing = lightingPackets(3, { brightness: 1 })[0];
      trailing[10] = 1;
      expect(isSafeLightingWrite(trailing)).toBe(false);
      const colorOnLedMatrix = lightingPackets(3, { color: '#ff0000' })[0];
      colorOnLedMatrix[1] = 5;
      expect(isSafeLightingWrite(colorOnLedMatrix)).toBe(false);
    });
  });

  describe('writeViaLighting', () => {
    it('sends only the requested values, no save by default, and closes the device', async () => {
      const keyboard = new FakeViaKeyboard();
      const result = await writeViaLighting(device(keyboard), 3, { brightness: 128, color: '#ff0000' }, false);
      expect(result).toEqual({ sent: 2, answered: 2 });
      expect(keyboard.sent.map((p) => p[0])).toEqual([0x07, 0x07]);
      expect(keyboard.events).toEqual(['open', 'close']);
    });

    it('saves only when asked, as the last packet', async () => {
      const keyboard = new FakeViaKeyboard();
      await writeViaLighting(device(keyboard), 2, { brightness: 128 }, true);
      expect(keyboard.sent.map((p) => p[0])).toEqual([0x07, 0x09]);
      expect([...keyboard.sent[1].slice(0, 3)]).toEqual([0x09, 2, 0]);
    });

    it('never sends a forbidden command or touches channel 0', async () => {
      const keyboard = new FakeViaKeyboard();
      await writeViaLighting(device(keyboard), 3, { brightness: 1, effect: 2, speed: 3, color: '#abcdef' }, true);
      expect(keyboard.sent.every(isSafeLightingWrite)).toBe(true);
      expect(keyboard.sent.some((p) => FORBIDDEN.includes(p[0]) || p[1] === 0)).toBe(false);
    });

    it('refuses an unsafe channel before opening anything', async () => {
      const keyboard = new FakeViaKeyboard();
      expect(await writeViaLighting(device(keyboard), 0, { brightness: 1 }, false)).toEqual({ sent: 0, answered: 0 });
      expect(await writeViaLighting(device(keyboard), 4, { brightness: 1 }, true)).toEqual({ sent: 0, answered: 0 });
      expect(keyboard.sent).toEqual([]);
    });

    it('closes the device when sending fails', async () => {
      const keyboard = new FakeViaKeyboard();
      keyboard.sendReport = async () => {
        throw new Error('unplugged');
      };
      await expect(writeViaLighting(device(keyboard), 3, { brightness: 1 }, false)).rejects.toThrow('unplugged');
      expect(keyboard.events.at(-1)).toBe('close');
    });
  });
});
