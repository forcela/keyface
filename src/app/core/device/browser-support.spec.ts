import { browserName, unsupportedReason } from './browser-support';

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

describe('browser-support', () => {
  describe('browserName', () => {
    it('tells Edge and Opera apart from Chrome, which they claim to be', () => {
      expect(browserName(`${CHROME} Edg/140.0`, false)).toBe('Edge');
      expect(browserName(`${CHROME} OPR/120.0`, false)).toBe('Opera');
      expect(browserName(CHROME, false)).toBe('Chrome');
    });

    it('recognises Firefox, Safari and Brave', () => {
      expect(browserName('Mozilla/5.0 (Windows NT 10.0; rv:140.0) Gecko/20100101 Firefox/140.0', false)).toBe('Firefox');
      expect(browserName('Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15', false)).toBe('Safari');
      expect(browserName(CHROME, true)).toBe('Brave');
    });
  });

  describe('unsupportedReason', () => {
    it('is null when WebHID is there', () => {
      expect(unsupportedReason({ name: 'Chrome', secureContext: true, webHid: true })).toBeNull();
    });

    it('blames the page when it is not a secure context', () => {
      expect(unsupportedReason({ name: 'Chrome', secureContext: false, webHid: false })).toContain('localhost');
    });

    it('names a browser that cannot do it at all', () => {
      expect(unsupportedReason({ name: 'Firefox', secureContext: true, webHid: false })).toContain('Firefox ne sait pas');
    });

    it('says a Chromium browser blocks it instead of claiming it is unsupported', () => {
      expect(unsupportedReason({ name: 'Brave', secureContext: true, webHid: false })).toContain('bloque');
    });
  });
});
