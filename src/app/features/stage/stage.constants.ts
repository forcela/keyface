export interface KeyCap {
  /** Legend, top line first. */
  legend: readonly string[];
  /** Darker modifier-style cap. */
  dark?: boolean;
}

/** The keys around the screen on an ISO-FR AK820 Pro, left of the knob. Purely decorative. */
export const KEY_CAPS: readonly KeyCap[] = [
  { legend: ['F11'], dark: true },
  { legend: ['F12'], dark: true },
  { legend: ['à', '0'] },
  { legend: [')', '°'] },
  { legend: ['=', '+'] },
  { legend: ['p'] },
  { legend: ['^', '¨'] },
  { legend: ['$', '£'] },
  { legend: ['m'] },
  { legend: ['ù', '%'] },
  { legend: ['*', 'µ'] },
];
