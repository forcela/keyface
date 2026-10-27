import { AK820_PRO, PROFILES, findProfile } from './keyboard-profiles';

describe('keyboard-profiles', () => {
  it('finds a profile from a usb id and nothing for an unknown one', () => {
    expect(findProfile('0c45:800a')).toBe(AK820_PRO);
    expect(findProfile('0c45:8009')).toBe(AK820_PRO);
    expect(findProfile('dead:beef')).toBeNull();
  });

  it('never gives the same usb id to two profiles', () => {
    const ids = PROFILES.flatMap((profile) => profile.usbIds);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe('AK820 Pro', () => {
    const effects = AK820_PRO.capabilities.backlight!.effects;

    it('has the 20 modes 0x00 to 0x13, each once', () => {
      expect(effects.map((effect) => effect.id)).toEqual(Array.from({ length: 20 }, (_, i) => i));
    });

    it('gives every effect its own kind and a label', () => {
      expect(new Set(effects.map((effect) => effect.kind)).size).toBe(20);
      expect(effects.every((effect) => effect.label.length > 0)).toBe(true);
    });

    it('has a 128 by 128 screen and is only confirmed on ISO', () => {
      expect(AK820_PRO.capabilities.screen).toMatchObject({ width: 128, height: 128 });
      expect(AK820_PRO.confirmedLayouts).toEqual(['iso']);
    });
  });
});
