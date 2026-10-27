/** What this browser can do for talking to a keyboard, and a plain-language reason when it cannot. */

export interface BrowserSupport {
  name: string;
  /** WebHID only works on https pages and on localhost. */
  secureContext: boolean;
  webHid: boolean;
}

export function browserName(userAgent: string, isBrave: boolean): string {
  if (isBrave) return 'Brave';
  if (/Edg\//.test(userAgent)) return 'Edge';
  if (/OPR\//.test(userAgent)) return 'Opera';
  if (/Firefox\//.test(userAgent)) return 'Firefox';
  if (/Chrome\//.test(userAgent)) return 'Chrome';
  if (/Safari\//.test(userAgent)) return 'Safari';
  return 'ce navigateur';
}

export function readBrowserSupport(): BrowserSupport {
  const brave = (navigator as unknown as { brave?: unknown }).brave !== undefined;
  return {
    name: browserName(navigator.userAgent, brave),
    secureContext: window.isSecureContext,
    webHid: 'hid' in navigator,
  };
}

/** Why the direct send is unavailable, or null when it is possible. */
export function unsupportedReason(support: BrowserSupport): string | null {
  if (support.webHid) return null;
  if (!support.secureContext) return 'Ouvre la page avec l’adresse http://localhost:4200.';
  const chromium = ['Chrome', 'Edge', 'Opera', 'Brave'].includes(support.name);
  return chromium
    ? `${support.name} bloque l’accès aux claviers. Utilise Google Chrome ou Edge.`
    : `${support.name} ne sait pas parler à un clavier. Utilise Google Chrome ou Edge.`;
}
