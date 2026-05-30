// Lightweight assertion test (run: pnpm test:gtin). No framework needed.
import { toGtin14, isValidGtin14 } from './gtin';

let pass = 0, fail = 0;
function eq(actual: unknown, expected: unknown, label: string) {
  if (actual === expected) { pass++; }
  else { fail++; console.error(`✗ ${label}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`); }
}

// UPC-12 "036000291452" is the canonical valid GS1 example → GTIN-14 "00036000291452"
eq(toGtin14('036000291452'), '00036000291452', 'valid UPC-12 → GTIN-14');
eq(isValidGtin14('00036000291452'), true, 'check digit valid');
eq(toGtin14('0-36000-29145-2'), '00036000291452', 'strips separators');
eq(toGtin14('036000291453'), null, 'bad check digit → null');
eq(toGtin14('123'), null, 'wrong length → null');
eq(toGtin14(null), null, 'null → null');
eq(toGtin14(''), null, 'empty → null');

console.log(`\ngtin: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
