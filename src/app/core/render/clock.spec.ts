import { formatDate, readClock } from './clock';

describe('clock', () => {
  const date = new Date(2026, 9, 27, 9, 5); // Tuesday 27 October 2026, 09:05

  it('formats the time as HH:mm, 24 h', () => {
    expect(readClock(date).time).toBe('09:05');
  });

  it('formats the numeric date as dd/MM', () => {
    expect(formatDate(date, 'numeric')).toBe('27/10');
  });

  it('capitalizes short and long dates', () => {
    expect(formatDate(date, 'short')).toMatch(/^[A-ZÀ-Ý]/);
    expect(formatDate(date, 'long')).toMatch(/^[A-ZÀ-Ý]/);
  });

  it('keeps the date it was given', () => {
    expect(readClock(date).date).toBe(date);
  });
});
