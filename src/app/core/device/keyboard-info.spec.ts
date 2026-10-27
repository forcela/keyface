import { USAGE_PAGE_CONTROL, USAGE_PAGE_DATA, deviceId, diagnosticText, groupKeyboards, hex } from './keyboard-info';

const iface = (usagePage: number, productId = 0x800a, vendorId = 0x0c45) => ({
  vendorId,
  productId,
  productName: 'AJAZZ AK820 Pro',
  collections: [{ usagePage, usage: 0x01 }],
});

describe('keyboard-info', () => {
  it('formats ids as lowercase hex, zero padded', () => {
    expect(hex(0x45, 4)).toBe('0045');
    expect(deviceId({ vendorId: 0x0c45, productId: 0x800a })).toBe('0c45:800a');
  });

  describe('groupKeyboards', () => {
    it('merges the interfaces of one keyboard into one entry', () => {
      const [keyboard, ...others] = groupKeyboards([iface(USAGE_PAGE_CONTROL), iface(USAGE_PAGE_DATA)]);
      expect(others).toHaveLength(0);
      expect(keyboard.collections.map((c) => c.usagePage)).toEqual([USAGE_PAGE_CONTROL, USAGE_PAGE_DATA].sort((a, b) => a - b));
    });

    it('is ready only when both vendor interfaces are visible', () => {
      expect(groupKeyboards([iface(USAGE_PAGE_CONTROL)])[0].ready).toBe(false);
      expect(groupKeyboards([iface(USAGE_PAGE_DATA)])[0].ready).toBe(false);
      expect(groupKeyboards([iface(USAGE_PAGE_CONTROL), iface(USAGE_PAGE_DATA)])[0].ready).toBe(true);
    });

    it('never marks an unknown keyboard ready, even with both vendor interfaces', () => {
      const unknown = groupKeyboards([iface(USAGE_PAGE_CONTROL, 0x1234), iface(USAGE_PAGE_DATA, 0x1234)])[0];
      expect(unknown.model).toBeNull();
      expect(unknown.ready).toBe(false);
    });

    it('flags a keyboard that exposes the VIA raw HID interface, without making it ready', () => {
      const keyboard = groupKeyboards([iface(0xff60, 0x1234), iface(USAGE_PAGE_CONTROL, 0x1234)])[0];
      expect(keyboard.via).toBe(true);
      expect(keyboard.ready).toBe(false);
      expect(groupKeyboards([iface(USAGE_PAGE_CONTROL)])[0].via).toBe(false);
    });

    it('keeps different keyboards apart', () => {
      const keyboards = groupKeyboards([iface(USAGE_PAGE_CONTROL, 0x800a), iface(USAGE_PAGE_CONTROL, 0x8009)]);
      expect(keyboards.map((k) => k.id).sort()).toEqual(['0c45:8009', '0c45:800a']);
    });

    it('does not repeat an interface reported twice', () => {
      const [keyboard] = groupKeyboards([iface(USAGE_PAGE_CONTROL), iface(USAGE_PAGE_CONTROL)]);
      expect(keyboard.collections).toHaveLength(1);
    });

    it('names known models and leaves others unnamed', () => {
      expect(groupKeyboards([iface(USAGE_PAGE_CONTROL)])[0].model).toContain('AK820 Pro');
      expect(groupKeyboards([iface(USAGE_PAGE_CONTROL, 0x1234)])[0].model).toBeNull();
    });
  });

  describe('diagnosticText', () => {
    it('says so when nothing is connected', () => {
      expect(diagnosticText([], 'UA')).toBe('Aucun clavier détecté.');
    });

    it('lists the id and every interface, then the browser', () => {
      const text = diagnosticText(groupKeyboards([iface(USAGE_PAGE_CONTROL), iface(USAGE_PAGE_DATA)]), 'Chrome/1');
      expect(text).toContain('id 0c45:800a');
      expect(text).toContain('page 0xff13');
      expect(text).toContain('page 0xff68');
      expect(text.endsWith('Navigateur : Chrome/1')).toBe(true);
    });
  });
});
