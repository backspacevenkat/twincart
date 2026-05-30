/**
 * Offline ingestion — scrapes the 5 retailers across the curated query universe,
 * upserts into RDS Postgres, AND indexes into the AWS-hosted Typesense.
 *
 * SAFETY GATE: real Apify calls (which cost credit) require INGEST_CONFIRM=1.
 * Budget-aware per-retailer caps keep the aggregate run < ~$50.
 *   Dry run:  pnpm ingest
 *   Real run: INGEST_CONFIRM=1 bun src/pipeline/ingest.ts
 */
import { pool, query } from '@/lib/db';
import { ensureCollection, indexProducts } from '@/lib/search';
import type { IngestedProduct, Retailer } from '@/lib/types';
import { env } from '@/lib/env';
import { CURATED_QUERIES, RETAILER_ACTORS } from './config';
import { scrapeRetailer } from './apify';

const RETAILERS = Object.keys(RETAILER_ACTORS) as Retailer[];
// Budget caps: Amazon is cheapest ($0.004), Temu dearest ($0.01) → weight accordingly.
// Budget-weighted caps to reach ~10k+ efficiently: lean on cheap retailers (Amazon $0.004),
// keep Temu ($0.01, riskiest) modest. Real yield runs ~60-80% of cap.
const CAPS: Record<Retailer, number> = { amazon: 90, temu: 30, shein: 55, walmart: 50, target: 45 };

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

// Typesense doc — value_score proxy = discount % until LLM twin-matching runs.
function tsDoc(p: IngestedProduct, id: number): Record<string, unknown> {
  const disc = p.original_price && p.price ? Math.max(0, Math.round((1 - p.price / p.original_price) * 100)) : 0;
  const d: Record<string, unknown> = { id: String(id), title: p.title, retailer: p.retailer, price: p.price ?? 0, value_score: disc };
  if (p.brand) d.brand = p.brand;
  if (p.rating != null) d.rating = p.rating;
  if (p.gtin14) d.gtin14 = p.gtin14;
  if (p.image_url) d.image_url = p.image_url;
  if (p.product_url) d.product_url = p.product_url;
  return d;
}

async function main() {
  if (!env.ingestConfirmed()) {
    const est = CURATED_QUERIES.length * RETAILERS.reduce((s, r) => s + CAPS[r], 0);
    console.log('DRY RUN (set INGEST_CONFIRM=1 to actually scrape — costs Apify credit).\n');
    console.log(`Would scrape ${RETAILERS.length} retailers × ${CURATED_QUERIES.length} queries (caps ${JSON.stringify(CAPS)})`);
    console.log(`≈ ${est} products max. Indexes into RDS + Typesense (${env.typesense().host}).`);
    await pool.end();
    return;
  }

  await ensureCollection();
  let total = 0;
  for (const q of CURATED_QUERIES) {
    const results = await Promise.allSettled(RETAILERS.map((r) => scrapeRetailer(r, q, CAPS[r])));
    const docs: Record<string, unknown>[] = [];
    for (const [idx, res] of results.entries()) {
      const r = RETAILERS[idx];
      if (res.status === 'rejected') { console.warn(`  ✗ ${r} "${q}": ${String(res.reason).slice(0, 80)}`); continue; }
      for (const p of res.value) {
        const id = await upsertProduct(p);
        docs.push(tsDoc(p, id));
      }
      total += res.value.length;
      console.log(`  ✓ ${r} "${q}": ${res.value.length}`);
    }
    if (docs.length) { try { await indexProducts(docs); } catch (e) { console.warn('  ⚠ typesense index:', String(e).slice(0, 80)); } }
    console.log(`  → "${q}" done · running total ${total} products`);
  }
  console.log(`\n✓ Ingested ${total} products into RDS + Typesense. Next: LLM twin-matching → clusters.`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
