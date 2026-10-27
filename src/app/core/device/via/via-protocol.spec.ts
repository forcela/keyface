import {
  FIRMWARE_VERSION_VALUE,
  LIGHTING_CHANNELS,
  VIA_REPORT_BYTES,
  ViaCommand,
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

const reply = (...bytes: number[]) => {
  const packet = new Uint8Array(VIA_REPORT_BYTES);
  bytes.forEach((value, i) => (packet[i] = value));
  return packet;
};

describe('via-protocol', () => {
  describe('requests', () => {
    it('are 32 bytes with the command in byte 0', () => {
      for (const packet of [requestProtocolVersion(), requestLayerCount(), requestFirmwareVersion(), requestLighting(3)]) {
        expect(packet).toHaveLength(32);
      }
      expect(requestProtocolVersion()[0]).toBe(0x01);
      expect(requestLayerCount()[0]).toBe(0x11);
    });

    it('asks for the firmware version with its sub-id', () => {
      expect([...requestFirmwareVersion().slice(0, 2)]).toEqual([0x02, FIRMWARE_VERSION_VALUE]);
    });

    it('asks for brightness on a lighting channel', () => {
      expect([...requestLighting(3).slice(0, 3)]).toEqual([0x08, 3, 0x01]);
    });
  });

  describe('isSafeRead', () => {
    it('accepts every request this module builds', () => {
      const packets = [requestProtocolVersion(), requestLayerCount(), requestFirmwareVersion(), ...LIGHTING_CHANNELS.map((c) => requestLighting(c.channel))];
      expect(packets.every(isSafeRead)).toBe(true);
    });

    it.each([
      ['set keyboard value', 0x03],
      ['set keycode', 0x05],
      ['keymap reset', 0x06],
      ['custom set value', 0x07],
      ['custom save', 0x09],
      ['eeprom reset', 0x0a],
      ['bootloader jump', 0x0b],
      ['macro set buffer', 0x0f],
      ['macro reset', 0x10],
      ['set buffer', 0x13],
      ['set encoder', 0x15],
    ])('refuses the write command %s (0x%s)', (_name, command) => {
      const packet = new Uint8Array(32);
      packet[0] = command;
      expect(isSafeRead(packet)).toBe(false);
    });

    it('refuses a read command with unexpected arguments', () => {
      expect(isSafeRead(reply(ViaCommand.GetKeyboardValue, 0x05))).toBe(false); // device indication, not firmware version
      expect(isSafeRead(reply(ViaCommand.CustomGetValue, 0, 0x01))).toBe(false); // channel 0 is keyboard-specific
      expect(isSafeRead(reply(ViaCommand.CustomGetValue, 3, 0x04))).toBe(false); // not the brightness value
      expect(isSafeRead(reply(ViaCommand.GetProtocolVersion, 9))).toBe(false);
    });

    it('refuses packets of the wrong size or with stray bytes', () => {
      expect(isSafeRead(new Uint8Array(33))).toBe(false);
      const stray = requestProtocolVersion();
      stray[20] = 1;
      expect(isSafeRead(stray)).toBe(false);
    });
  });

  describe('answers', () => {
    it('reads the protocol version as big-endian', () => {
      expect(parseProtocolVersion(reply(0x01, 0x00, 0x0d))).toBe(13);
      expect(parseProtocolVersion(reply(0x01, 0x01, 0x02))).toBe(258);
    });

    it('reads the layer count from byte 1', () => {
      expect(parseLayerCount(reply(0x11, 4))).toBe(4);
    });

    it('reads the firmware version from bytes 2 to 5, and treats zero as "none"', () => {
      expect(parseFirmwareVersion(reply(0x02, 0x04, 0x00, 0x00, 0x01, 0x02))).toBe(258);
      expect(parseFirmwareVersion(reply(0x02, 0x04, 0xff, 0xff, 0xff, 0xff))).toBe(0xffffffff);
      expect(parseFirmwareVersion(reply(0x02, 0x04, 0, 0, 0, 0))).toBeNull();
    });

    it('detects a lighting channel that answers, and one that does not', () => {
      expect(parseLightingAnswer(reply(0x08, 3, 0x01, 128), 3)).toBe(true);
      expect(parseLightingAnswer(reply(ViaCommand.Unhandled, 3, 0x01), 3)).toBe(false);
      expect(parseLightingAnswer(reply(0x08, 2, 0x01, 128), 3)).toBe(false);
    });

    it('treats an unhandled answer or a wrong size as no answer', () => {
      expect(parseProtocolVersion(reply(ViaCommand.Unhandled, 0, 13))).toBeNull();
      expect(parseLayerCount(reply(0x01, 4))).toBeNull();
      expect(parseProtocolVersion(new Uint8Array(10))).toBeNull();
    });
  });
});
