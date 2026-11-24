/** Letters printed under each keypad digit. */
export const KEY_LETTERS: Record<string, string> = {
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
};

const LETTER_TO_DIGIT: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_LETTERS).flatMap(([digit, letters]) =>
    letters.split('').map((letter) => [letter.toLowerCase(), digit])
  )
);

/** Converts text to keypad digits, e.g. "Anna" -> "2662". Characters without a key are dropped. */
export function toT9(text: string): string {
  let out = '';
  for (const char of text.toLowerCase()) {
    if (char >= '0' && char <= '9') out += char;
    else if (LETTER_TO_DIGIT[char]) out += LETTER_TO_DIGIT[char];
  }
  return out;
}

/** Keeps only digits. */
export function digitsOf(value: string): string {
  return value.replace(/\D/g, '');
}

/** Keeps only characters that are valid in a dialed number. */
export function sanitizeDialString(value: string): string {
  return value.replace(/[^\d+*#,;]/g, '');
}

/**
 * Loosely compares two phone numbers, ignoring formatting and country prefixes
 * by comparing the trailing digits.
 */
export function isSamePhone(a: string, b: string): boolean {
  const da = digitsOf(a);
  const db = digitsOf(b);
  if (!da || !db) return false;
  if (da.length < 7 || db.length < 7) return da === db;
  const length = Math.min(9, da.length, db.length);
  return da.slice(-length) === db.slice(-length);
}

/** Groups digits for display, e.g. "9876543210" -> "98765 43210". Leaves short or symbolic input alone. */
export function formatPhone(value: string): string {
  if (/[^\d+]/.test(value) || value.length < 7) return value;
  const plus = value.startsWith('+') ? '+' : '';
  const digits = value.replace('+', '');
  if (digits.length === 10) return `${plus}${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (plus && digits.length > 10) {
    const country = digits.slice(0, digits.length - 10);
    const rest = digits.slice(-10);
    return `+${country} ${rest.slice(0, 5)} ${rest.slice(5)}`;
  }
  return value;
}
