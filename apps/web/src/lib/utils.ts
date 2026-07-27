import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toArabicDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);
}

export function formatArabicModeCount(count: number) {
  if (count === 1) return 'وضع';
  if (count === 2) return 'وضعان';
  return `${toArabicDigits(count)} أوضاع`;
}
