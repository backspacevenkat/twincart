// GTIN-14 normalization — the ONLY deterministic cross-retailer key (Amazon/Walmart/Target).
// UPC-12 / EAN-13 / GTIN-14 share one number space; we left-pad to 14 digits and validate the check digit.

/** Strip non-digits, left-pad to 14. Returns null if not a plausible barcode (8/12/13/14 digits). */
export function toGtin14(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (![8, 12, 13, 14].includes(digits.length)) return null;
  const padded = digits.padStart(14, '0');
  return isValidGtin14(padded) ? padded : null;
}

/** GS1 mod-10 check-digit validation on a 14-digit string. */
export function isValidGtin14(gtin14: string): boolean {
  if (!/^\d{14}$/.test(gtin14)) return false;
  const d = gtin14.split('').map(Number);
  const check = d.pop()!;
  // From the rightmost data digit, weights alternate 3,1,3,1...
  let sum = 0;
  for (let i = d.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) sum += d[i] * w;
  const calc = (10 - (sum % 10)) % 10;
  return calc === check;
}
