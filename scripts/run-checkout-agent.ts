/**
 * CLI demo for the TwinCart REAL browser-checkout agent.
 *
 * Runs runCheckoutAgent() against a real retailer SEARCH url and prints the
 * result JSON (step log + live session replay URL + addedToCart + stopped-at-
 * approval confirmation).
 *
 * Run:
 *   bun scripts/run-checkout-agent.ts
 *   bun scripts/run-checkout-agent.ts walmart "wireless mouse"
 *   bun scripts/run-checkout-agent.ts target  "stanley tumbler" 40
 *   bun scripts/run-checkout-agent.ts <full-search-url> "<product>" [maxPrice]
 *
 * Secrets come from .env (bun auto-loads). One run = minimal spend.
 */

import { runCheckoutAgent } from "../src/agent/checkout-agent";

type Retailer = { name: string; searchUrl: (q: string) => string };

// Per-name search URL builders (match the app's per-name search URLs).
// Walmart/Target are more agent-friendly than SHEIN/Temu (less captcha).
const RETAILERS: Record<string, Retailer> = {
  walmart: {
    name: "Walmart",
    searchUrl: (q) => `https://www.walmart.com/search?q=${encodeURIComponent(q)}`,
  },
  target: {
    name: "Target",
    searchUrl: (q) => `https://www.target.com/s?searchTerm=${encodeURIComponent(q)}`,
  },
  shein: {
    name: "SHEIN",
    searchUrl: (q) => `https://us.shein.com/pdsearch/${encodeURIComponent(q)}/`,
  },
};

function parseArgs() {
  const a = process.argv.slice(2);
  // Default demo: Walmart, a cheap commodity item that's easy to add to cart.
  let retailerKey = a[0] || "walmart";
  const productName = a[1] || "AAA batteries 8 pack";
  const maxPrice = a[2] ? Number(a[2]) : undefined;

  // Allow passing a full search URL as the first arg.
  if (retailerKey.startsWith("http")) {
    return {
      url: retailerKey,
      retailer: new URL(retailerKey).hostname.replace(/^www\./, ""),
      productName,
      maxPrice,
    };
  }

  retailerKey = retailerKey.toLowerCase();
  const r = RETAILERS[retailerKey];
  if (!r) {
    throw new Error(
      `Unknown retailer "${retailerKey}". Use one of: ${Object.keys(RETAILERS).join(", ")} or a full URL.`
    );
  }
  return {
    url: r.searchUrl(productName),
    retailer: r.name,
    productName,
    maxPrice,
  };
}

async function main() {
  const { url, retailer, productName, maxPrice } = parseArgs();

  console.log("=== TwinCart REAL checkout agent — demo ===");
  console.log(`retailer:  ${retailer}`);
  console.log(`product:   ${productName}`);
  console.log(`maxPrice:  ${maxPrice ?? "(none)"}`);
  console.log(`searchUrl: ${url}`);
  console.log("Running... (drives a real cloud browser; ~30-90s)\n");

  const result = await runCheckoutAgent({ url, productName, retailer, maxPrice });

  console.log("\n=== RESULT JSON ===");
  console.log(JSON.stringify(result, null, 2));

  console.log("\n=== STEP LOG ===");
  for (const step of result.steps) {
    console.log(`  [${step.status.toUpperCase().padEnd(7)}] ${step.label} — ${step.detail}`);
  }

  console.log("\n=== SUMMARY ===");
  console.log(`addedToCart:       ${result.addedToCart}`);
  console.log(`stoppedAtApproval: ${result.stoppedAtApproval}  (NEVER auto-pays)`);
  console.log(`sessionReplayUrl:  ${result.sessionReplayUrl}`);
}

main().catch((err) => {
  console.error("\n=== RESULT: FAILED ===");
  console.error(err);
  process.exit(1);
});
