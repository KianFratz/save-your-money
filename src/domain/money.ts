const CURRENCY_FRACTION_DIGITS = 2;

export function parsePesoInput(value: string): number | null {
  const cents = parsePesoValue(value);
  return cents !== null && cents > 0 ? cents : null;
}

export function parseNonnegativePesoInput(value: string): number | null {
  return parsePesoValue(value);
}

function parsePesoValue(value: string): number | null {
  const normalized = value.replaceAll(',', '').trim();
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) {
    return null;
  }

  const [wholePart = '0', fractionPart = ''] = normalized.split('.');
  const cents = Number(wholePart) * 100 + Number(fractionPart.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : null;
}

export function formatPeso(cents: number, options?: { sign?: boolean }): string {
  const amount = cents / 100;
  const formatted = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: CURRENCY_FRACTION_DIGITS,
    maximumFractionDigits: CURRENCY_FRACTION_DIGITS,
    signDisplay: options?.sign ? 'always' : 'auto',
  }).format(amount);

  return formatted.replace('PHP', '₱');
}

export function formatPesoInput(cents: number): string {
  return (cents / 100).toFixed(CURRENCY_FRACTION_DIGITS);
}
