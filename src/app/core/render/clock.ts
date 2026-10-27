import { pad2 } from './canvas.utils';

/** What a frame knows about "now". Frozen at export time: the keyboard cannot receive live data. */
export interface ClockInfo {
  date: Date;
  /** `HH:mm`, 24 h. */
  time: string;
}

export type DateFormat = 'short' | 'long' | 'numeric';

const SHORT = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const LONG = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric' });

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function readClock(date = new Date()): ClockInfo {
  return { date, time: `${pad2(date.getHours())}:${pad2(date.getMinutes())}` };
}

export function formatDate(date: Date, format: DateFormat): string {
  if (format === 'numeric') return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
  return capitalize((format === 'long' ? LONG : SHORT).format(date));
}
