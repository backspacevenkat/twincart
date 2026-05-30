/**
 * Sample-scrape verification — runs a SMALL scrape (a few items) per retailer to confirm
 * the actor + our field mappings work BEFORE the full-scale ingest. Cheap (~$0.05).
 * Usage: bun scripts/sample-scrape.ts amazon,target,temu "thermo flask"
 */
import { scrapeRetailer } from '@/pipeline/apify';
import type { Retailer } from '@/lib/types';

const retailers = (process.argv[2]?.split(',') ?? ['amazon', 'target', 'temu']) as Retailer[];
const queryArg = process.argv[3] ?? 'thermo flask';
const N = 3;

for (const r of retailers) {
  const t0 = Date.now();
  try {
    const items = await scrapeRetailer(r, queryArg, N);
    console.log(`\n=== ${r} "${queryArg}" — ${items.length} items (${((Date.now() - t0) / 1000).toFixed(0)}s) ===`);
    for (const p of items.slice(0, N)) {
      console.log({
        title: p.title?.slice(0, 48),
        price: p.price,
        orig: p.original_price,
        gtin14: p.gtin14,
        asin: p.asin,
        img: p.image_url ? '✓' : '✗',
        url: p.product_url ? '✓' : '✗',
        rating: p.rating,
        reviews: p.review_count,
      });
    }
  } catch (e) {
    console.error(`✗ ${r} FAILED:`, (e as Error).message);
  }
}
process.exit(0);
