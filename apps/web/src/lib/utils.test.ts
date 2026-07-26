import { describe, expect, it } from 'vitest';
import { toArabicDigits } from './utils';

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
