/**
 * Wave-3 ingest — adds a FEW genuinely-new high-contrast categories on a tight Apify budget.
 * MUST run on token-2 (token-1 is over its monthly cap): set APIFY_USE_TOKEN=2.
 *
 * Cost-safe: small per-actor caps, reports each actor run's real USD cost (run.usageTotalUsd),
 * and reads the account's monthlyUsageUsd before/after so the TRUE delta is the source of truth.
 * Supports a single-category probe (measure-then-commit):
 *   Dry:    APIFY_USE_TOKEN=2 bun src/pipeline/ingest-wave3.ts
 *   Probe:  APIFY_USE_TOKEN=2 INGEST_CONFIRM=1 bun src/pipeline/ingest-wave3.ts "led strip lights"
 *   Full:   APIFY_USE_TOKEN=2 INGEST_CONFIRM=1 bun src/pipeline/ingest-wave3.ts
 */
import { ApifyClient } from 'apify-client';
import { pool, query } from '@/lib/db';
import { ensureCollection, indexProducts } from '@/lib/search';
import type { IngestedProduct, Retailer } from '@/lib/types';
import { env } from '@/lib/env';
import { RETAILER_ACTORS } from './config';

// 4 new high-contrast categories: branded Amazon anchor + cheap Temu/SHEIN/Walmart twins.
const ALL_QUERIES = ['led strip lights', 'phone tripod', 'kitchen scale', 'massage gun'];
const RETAILERS = Object.keys(RETAILER_ACTORS) as Retailer[];
// Tight caps — low item counts per actor to stay well under the $8 budget.
const CAPS: Record<Retailer, number> = { amazon: 20, temu: 15, shein: 18, walmart: 20, target: 18 };

const client = new ApifyClient({ token: env.apifyToken() });

async function scrapeWithCost(retailer: Retailer, q: string, maxItems: number): Promise<{ products: IngestedProduct[]; usd: number }> {
  const cfg = RETAILER_ACTORS[retailer];
  const run = await client.actor(cfg.actorId).call(cfg.buildInput(q, maxItems));
  const usd = Number((run as { usageTotalUsd?: number }).usageTotalUsd ?? 0);
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  const products = (items as Record<string, unknown>[])
    .map((i) => cfg.map(i, q))
    .filter((p) => p.title && p.price != null);
  return { products, usd };
}

async function upsert(p: IngestedProduct): Promise<number> {
  const rows = await query<{ id: number }>(
    `INSERT INTO products (retailer, external_id, gtin14, upc, asin, title, brand, price, original_price,
        currency, image_url, product_url, rating, review_count, raw_json, last_seen_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, now())
     ON CONFLICT (retailer, external_id) DO UPDATE SET price=EXCLUDED.price, raw_json=EXCLUDED.raw_json, last_seen_at=now()
     RETURNING id`,
    [p.retailer, p.external_id, p.gtin14, p.upc, p.asin, p.title, p.brand, p.price, p.original_price,
     p.currency, p.image_url, p.product_url, p.rating, p.review_count, JSON.stringify(p.raw_json)],
  );
  return rows[0].id;
}
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

async function readSpend(): Promise<number> {
  try {
    const r = await fetch('https://api.apify.com/v2/users/me/limits', { headers: { Authorization: `Bearer ${env.apifyToken()}` } });
    const j = await r.json();
    return Number((j.data ?? j)?.current?.monthlyUsageUsd ?? 0);
  } catch { return 0; }
}

async function main() {
  const argQ = process.argv[2];
  const QUERIES = argQ ? [argQ] : ALL_QUERIES;
  const fp = env.apifyToken().slice(-4);

  if (!env.ingestConfirmed()) {
    console.log(`DRY (wave3): ${QUERIES.length} queries × ${RETAILERS.length} retailers · caps ${JSON.stringify(CAPS)}`);
    console.log(`  token fingerprint ...${fp} (MUST be ZBWJ = token-2; XQIY = token-1 is over budget)`);
    console.log(`  queries: ${QUERIES.join(', ')}`);
    await pool.end();
    return;
  }

  if (fp !== 'ZBWJ') {
    console.error(`REFUSING: token fingerprint ...${fp} is not token-2 (ZBWJ). Set APIFY_USE_TOKEN=2.`);
    await pool.end();
    process.exit(2);
  }

  const spendBefore = await readSpend();
  console.log(`Apify spend BEFORE: $${spendBefore.toFixed(4)} (token ...${fp})`);
  await ensureCollection();
  let total = 0, runUsd = 0;
  for (const q of QUERIES) {
    const res = await Promise.allSettled(RETAILERS.map((r) => scrapeWithCost(r, q, CAPS[r])));
    const docs: Record<string, unknown>[] = [];
    for (const [i, r] of res.entries()) {
      if (r.status === 'rejected') { console.warn(`  ✗ ${RETAILERS[i]} "${q}": ${String(r.reason).slice(0, 90)}`); continue; }
      runUsd += r.value.usd;
      for (const p of r.value.products) docs.push(tsDoc(p, await upsert(p)));
      total += r.value.products.length;
      console.log(`  ✓ ${RETAILERS[i]} "${q}": ${r.value.products.length} items · $${r.value.usd.toFixed(4)}`);
    }
    if (docs.length) { try { await indexProducts(docs); } catch (e) { console.warn('  ⚠ ts:', String(e).slice(0, 60)); } }
    console.log(`  → "${q}" done · running total ${total} products · run-reported $${runUsd.toFixed(4)}`);
  }
  const spendAfter = await readSpend();
  console.log(`\n✓ wave3 ingested ${total} products.`);
  console.log(`  Apify spend AFTER: $${spendAfter.toFixed(4)} · DELTA this run: $${(spendAfter - spendBefore).toFixed(4)} · run-reported sum: $${runUsd.toFixed(4)}`);
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
