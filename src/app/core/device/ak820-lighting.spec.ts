import { DEFAULT_LIGHTING, LightingSettings } from '@core/lighting/lighting.model';
import { lightingPacket } from './ak820-lighting';

const settings = (overrides: Partial<LightingSettings> = {}): LightingSettings => ({ ...DEFAULT_LIGHTING, ...overrides });

describe('lightingPacket', () => {
  it('is 64 bytes with the mode first, then red, green and blue', () => {
    const packet = lightingPacket(settings({ effect: 0x07, color: '#ff8040' }));
    expect(packet).toHaveLength(64);
    expect([...packet.slice(0, 4)]).toEqual([0x07, 0xff, 0x80, 0x40]);
  });

  it('puts rainbow, brightness, speed and direction at bytes 8 to 11', () => {
    const packet = lightingPacket(settings({ rainbow: true, brightness: 4, speed: 2, direction: 3 }));
    expect([...packet.slice(8, 12)]).toEqual([1, 4, 2, 3]);
  });

  it('ends its header with 55 aa and leaves every other byte at zero', () => {
    const packet = lightingPacket(settings());
    expect([...packet.slice(14, 16)]).toEqual([0x55, 0xaa]);
    expect([...packet.slice(4, 8)]).toEqual([0, 0, 0, 0]);
    expect([...packet.slice(16)].every((byte) => byte === 0)).toBe(true);
  });

  it('keeps values inside what the keyboard accepts', () => {
    const packet = lightingPacket(settings({ effect: 99, brightness: 99, speed: -3, direction: 9 as never }));
    expect(packet[0]).toBe(0x13);
    expect(packet[9]).toBe(5);
    expect(packet[10]).toBe(0);
    expect(packet[11]).toBe(3);
  });

  it('survives a malformed colour without throwing', () => {
    expect(() => lightingPacket(settings({ color: 'nope' }))).not.toThrow();
  });
});
