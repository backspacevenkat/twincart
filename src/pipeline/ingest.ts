/**
 * Offline ingestion orchestrator.
 *
 * SAFETY GATE: actually calling Apify (which costs money) requires INGEST_CONFIRM=1.
 * Without it, this is a dry run that prints the plan and exits — so it can never spend
 * credit by accident. Run for real with:  INGEST_CONFIRM=1 pnpm ingest
 */
import { pool, query } from '@/lib/db';
import type { IngestedProduct, Retailer } from '@/lib/types';
import { env } from '@/lib/env';
import { CURATED_QUERIES, RETAILER_ACTORS } from './config';
import { scrapeRetailer } from './apify';

const RETAILERS = Object.keys(RETAILER_ACTORS) as Retailer[];
const PER_RETAILER = 100;

async function upsertProduct(p: IngestedProduct): Promise<number> {
  const rows = await query<{ id: number }>(
    `INSERT INTO products (retailer, external_id, gtin14, upc, asin, title, brand, price, original_price,
        currency, image_url, product_url, rating, review_count, raw_json, last_seen_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, now())
     ON CONFLICT (retailer, external_id) DO UPDATE SET
        price=EXCLUDED.price, original_price=EXCLUDED.original_price, rating=EXCLUDED.rating,
        review_count=EXCLUDED.review_count, raw_json=EXCLUDED.raw_json, last_seen_at=now()
     RETURNING id`,
    [p.retailer, p.external_id, p.gtin14, p.upc, p.asin, p.title, p.brand, p.price, p.original_price,
     p.currency, p.image_url, p.product_url, p.rating, p.review_count, JSON.stringify(p.raw_json)],
  );
  return rows[0].id;
}

async function main() {
  if (!env.ingestConfirmed()) {
    console.log('DRY RUN (set INGEST_CONFIRM=1 to actually scrape — this costs Apify credit).\n');
    console.log(`Would scrape ${RETAILERS.length} retailers × ${CURATED_QUERIES.length} queries × ${PER_RETAILER} items`);
    console.log(`≈ ${RETAILERS.length * CURATED_QUERIES.length * PER_RETAILER} products. Retailers: ${RETAILERS.join(', ')}`);
    console.log(`Queries: ${CURATED_QUERIES.join(', ')}`);
    await pool.end();
    return;
  }

  let total = 0;
  for (const q of CURATED_QUERIES) {
    const results = await Promise.allSettled(RETAILERS.map((r) => scrapeRetailer(r, q, PER_RETAILER)));
    for (const [idx, res] of results.entries()) {
      if (res.status === 'rejected') {
        console.warn(`  ✗ ${RETAILERS[idx]} "${q}": ${res.reason}`);
        continue;
      }
      for (const p of res.value) await upsertProduct(p);
      total += res.value.length;
      console.log(`  ✓ ${RETAILERS[idx]} "${q}": ${res.value.length} products`);
    }
  }
  console.log(`\nIngested ${total} products. Next: build clusters (normalize + match). See src/pipeline/match.ts`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
