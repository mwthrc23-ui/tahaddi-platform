import { describe, expect, it } from 'vitest';
import { formatArabicModeCount, toArabicDigits } from './utils';

describe('toArabicDigits', () => {
  it('converts a single number', () => {
    expect(toArabicDigits(2)).toBe('٢');
  });

  it('preserves leading zeroes in strings', () => {
    expect(toArabicDigits('01')).toBe('٠١');
  });

  it('leaves non-numeric characters unchanged', () => {
    expect(toArabicDigits('room 25s')).toBe('room ٢٥s');
  });
});

describe('formatArabicModeCount', () => {
  it.each([
    [1, 'وضع'],
    [2, 'وضعان'],
    [3, '٣ أوضاع'],
    [11, '١١ أوضاع'],
  ])('formats %s with the requested Arabic distinction', (count, expected) => {
    expect(formatArabicModeCount(count)).toBe(expected);
  });
});
