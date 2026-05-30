/**
 * Wave-2 ingest — runs a DISTINCT query set (no overlap with the main wave) so the
 * second Apify token adds net-new products. Run with:
 *   APIFY_USE_TOKEN=2 INGEST_CONFIRM=1 bun src/pipeline/ingest-wave2.ts
 */
import { pool, query } from '@/lib/db';
import { ensureCollection, indexProducts } from '@/lib/search';
import type { IngestedProduct, Retailer } from '@/lib/types';
import { env } from '@/lib/env';
import { RETAILER_ACTORS } from './config';
import { scrapeRetailer } from './apify';

const QUERIES = [
  'winter coat', 'rain jacket', 'wireless mouse', 'webcam', 'monitor stand',
  'dumbbells', 'jump rope', 'foam roller', 'shampoo', 'face serum',
  'sunscreen', 'lip balm', 'tote bag', 'wallet', 'belt',
  'dog bed', 'cat tree', 'plant pot', 'throw blanket', 'bath towel set',
  'bluetooth headphones', 'usb hub', 'hdmi cable', 'screen protector', 'car mount',
  'travel mug', 'lunch box', 'food container set', 'spatula set', 'cutting board',
];
const RETAILERS = Object.keys(RETAILER_ACTORS) as Retailer[];
const CAPS: Record<Retailer, number> = { amazon: 90, temu: 30, shein: 55, walmart: 50, target: 45 };

async function upsert(p: IngestedProduct): Promise<number> {
  const rows = await query<{ id: number }>(
    `INSERT INTO products (retailer, external_id, gtin14, upc, asin, title, brand, price, original_price,
        currency, image_url, product_url, rating, review_count, raw_json, last_seen_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, now())
     ON CONFLICT (retailer, external_id) DO UPDATE SET price=EXCLUDED.price, last_seen_at=now()
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

async function main() {
  if (!env.ingestConfirmed()) { console.log(`DRY (wave2): ${QUERIES.length} queries × ${RETAILERS.length} retailers`); await pool.end(); return; }
  await ensureCollection();
  let total = 0;
  for (const q of QUERIES) {
    const res = await Promise.allSettled(RETAILERS.map((r) => scrapeRetailer(r, q, CAPS[r])));
    const docs: Record<string, unknown>[] = [];
    for (const [i, r] of res.entries()) {
      if (r.status === 'rejected') { console.warn(`  ✗ ${RETAILERS[i]} "${q}": ${String(r.reason).slice(0, 70)}`); continue; }
      for (const p of r.value) docs.push(tsDoc(p, await upsert(p)));
      total += r.value.length;
    }
    if (docs.length) { try { await indexProducts(docs); } catch (e) { console.warn('  ⚠ ts:', String(e).slice(0, 60)); } }
    console.log(`  → "${q}" · total ${total}`);
  }
  console.log(`\n✓ wave2 ingested ${total}`);
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
