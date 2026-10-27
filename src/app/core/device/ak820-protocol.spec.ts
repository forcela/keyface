import {
  CHUNK_BYTES,
  Command,
  FRAME_BYTES,
  HEADER_BYTES,
  MAX_SCREEN_FRAMES,
  buildScreenPayload,
  clockPacket,
  commandPacket,
  encodeDelay,
  imageConfigPacket,
  splitChunks,
  toRgb565,
} from './ak820-protocol';

const frame = (delayMs = 100, fill = 0) => ({ pixels: new Uint8Array(FRAME_BYTES).fill(fill), delayMs });

describe('ak820-protocol', () => {
  describe('commandPacket', () => {
    it('is 64 bytes: 04, command, sub, then the enable byte at index 8', () => {
      const packet = commandPacket(Command.Start, 0, 1);
      expect(packet).toHaveLength(64);
      expect([...packet.slice(0, 3)]).toEqual([0x04, 0x18, 0x00]);
      expect(packet[8]).toBe(1);
      expect([...packet.slice(3, 8)]).toEqual([0, 0, 0, 0, 0]);
    });
  });

  describe('imageConfigPacket', () => {
    it('carries the chunk count as 16-bit little-endian', () => {
      const packet = imageConfigPacket(0x0123, 0x03);
      expect([...packet.slice(0, 3)]).toEqual([0x04, 0x72, 0x03]);
      expect(packet[8]).toBe(0x23);
      expect(packet[9]).toBe(0x01);
    });
  });

  describe('clockPacket', () => {
    const packet = clockPacket(new Date(2026, 9, 27, 14, 5, 9)); // Tuesday

    it('has the header, the date fields and the end marker', () => {
      expect([...packet.slice(0, 3)]).toEqual([0x00, 0x01, 0x5a]);
      expect([...packet.slice(3, 9)]).toEqual([26, 10, 27, 14, 5, 9]);
      expect([...packet.slice(62)]).toEqual([0xaa, 0x55]);
    });

    it('writes the weekday, Sunday being 0', () => {
      expect(packet[10]).toBe(2);
      expect(clockPacket(new Date(2026, 9, 25))[10]).toBe(0);
    });
  });

  describe('encodeDelay', () => {
    it('uses units of 2 ms', () => {
      expect(encodeDelay(100)).toBe(50);
    });

    it('stays within 1 to 255', () => {
      expect(encodeDelay(0)).toBe(1);
      expect(encodeDelay(10_000)).toBe(255);
    });
  });

  describe('toRgb565', () => {
    it('packs red, green and blue into 5-6-5 bits, low byte first', () => {
      const out = toRgb565(new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]));
      expect([...out]).toEqual([0x00, 0xf8, 0xe0, 0x07, 0x1f, 0x00]);
    });

    it('ignores alpha', () => {
      expect(toRgb565(new Uint8ClampedArray([10, 20, 30, 0]))).toEqual(toRgb565(new Uint8ClampedArray([10, 20, 30, 255])));
    });
  });

  describe('buildScreenPayload', () => {
    it('starts with the frame count and one delay byte per frame, padded with 0xff', () => {
      const { bytes } = buildScreenPayload([frame(100), frame(40), frame(500)]);
      expect([...bytes.slice(0, 4)]).toEqual([3, 50, 20, 250]);
      expect(bytes[4]).toBe(0xff);
      expect(bytes[HEADER_BYTES - 1]).toBe(0xff);
    });

    it('puts frames right after the header, back to back', () => {
      const { bytes } = buildScreenPayload([frame(100, 1), frame(100, 2)]);
      expect(bytes[HEADER_BYTES]).toBe(1);
      expect(bytes[HEADER_BYTES + FRAME_BYTES - 1]).toBe(1);
      expect(bytes[HEADER_BYTES + FRAME_BYTES]).toBe(2);
    });

    it('marks a still image with a zero delay', () => {
      expect(buildScreenPayload([frame()]).bytes[1]).toBe(0);
    });

    it('pads to a whole number of 4096-byte chunks with 0xff', () => {
      const payload = buildScreenPayload([frame(100, 7)]);
      const used = HEADER_BYTES + FRAME_BYTES;
      expect(payload.chunks).toBe(Math.ceil(used / CHUNK_BYTES));
      expect(payload.bytes).toHaveLength(payload.chunks * CHUNK_BYTES);
      expect(payload.bytes[used]).toBe(0xff);
    });

    it('rejects an empty list, too many frames and a wrongly sized frame', () => {
      expect(() => buildScreenPayload([])).toThrow(RangeError);
      expect(() => buildScreenPayload(Array.from({ length: MAX_SCREEN_FRAMES + 1 }, () => frame()))).toThrow(RangeError);
      expect(() => buildScreenPayload([{ pixels: new Uint8Array(10), delayMs: 100 }])).toThrow(RangeError);
    });
  });

  it('splitChunks cuts the payload into 4096-byte pieces', () => {
    const payload = buildScreenPayload([frame(100), frame(100)]);
    const chunks = splitChunks(payload);
    expect(chunks).toHaveLength(payload.chunks);
    expect(chunks.every((chunk) => chunk.length === CHUNK_BYTES)).toBe(true);
  });
});
