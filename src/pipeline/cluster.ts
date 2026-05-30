/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Twin-clustering orchestrator. Turns scraped products into product_clusters + cluster_members.
 *
 * Strategy (cost/latency efficient — ~74 LLM calls, NOT O(n²)):
 *   1. Group products by the query they were scraped under (raw_json->>'_query').
 *   2. Pick the ANCHOR = the genuine branded "reference" (premium, well-reviewed) → pins true price.
 *   3. ONE batched gpt-5.4-mini call per query classifies all candidates vs the anchor.
 *   4. Compute price_savings_pct + Value Score (parity × savings × confidence) in code.
 *   5. Pick best_exact / best_value / best_budget; write cluster + members.
 *
 * Idempotent: rebuilds all clusters from scratch. Run: bun src/pipeline/cluster.ts
 */
import { pool, query } from '@/lib/db';
import { chatJSON } from '@/lib/llm';

interface Row {
  id: number; retailer: string; title: string; brand: string | null;
  price: number | null; original_price: number | null; gtin14: string | null;
  asin: string | null; rating: number | null; review_count: number | null;
  image_url: string | null;
}

const MAX_CANDIDATES = 14;     // per cluster, LLM-classified
const CONCURRENCY = 5;         // parallel LLM calls

const median = (xs: number[]): number => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Reference-anchor score. The anchor is the genuine branded article shoppers compare against —
 * the most-PROVEN (reviews/rating) item in a SANE price band, NOT the max-priced outlier/bundle.
 * `priceCap` (3× median) excludes mispriced bundles so savings stay believable.
 */
function anchorScore(r: Row, priceCap: number): number {
  const price = r.price ?? 0;
  if (price <= 0 || price > priceCap) return 0; // reject outliers as anchors
  const reviews = r.review_count ?? 0;
  const rating = r.rating ?? 3.5;
  const branded = r.brand && !/generic|no.?brand|unbranded/i.test(r.brand) ? 1.25 : 1;
  const amazon = r.retailer === 'amazon' ? 1.1 : 1; // Amazon = trust anchor
  // Proven-ness (reviews+rating) dominates; price is a mild "premium reference" nudge, not the driver.
  return (1 + Math.log10(reviews + 1)) * (rating / 5) * branded * amazon * (1 + Math.log10(price + 1) * 0.25);
}

/** Pick a diverse, mostly-cheaper candidate set spanning retailers. */
function pickCandidates(rows: Row[], anchor: Row): Row[] {
  // Candidates priced 5%..110% of anchor — excludes accessory noise (cases/parts) and pricier items.
  const aP = anchor.price ?? 0;
  const others = rows.filter((r) => r.id !== anchor.id && r.price != null && r.title
    && (r.price as number) >= aP * 0.05 && (r.price as number) <= aP * 1.1);
  // dedup near-identical titles
  const seen = new Set<string>();
  const uniq = others.filter((r) => {
    const k = r.title.toLowerCase().slice(0, 45);
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
  // ensure budget-twin sources (temu/shein) are represented, then fill cheapest-first
  const budget = uniq.filter((r) => r.retailer === 'temu' || r.retailer === 'shein').sort((a, b) => (a.price! - b.price!));
  const rest = uniq.filter((r) => r.retailer !== 'temu' && r.retailer !== 'shein').sort((a, b) => (a.price! - b.price!));
  const out: Row[] = [];
  const want = (r: Row) => { if (out.length < MAX_CANDIDATES && !out.includes(r)) out.push(r); };
  budget.slice(0, 6).forEach(want);
  rest.slice(0, 8).forEach(want);
  // top up if room
  [...budget, ...rest].forEach(want);
  return out.slice(0, MAX_CANDIDATES);
}

const SYS = `You compare e-commerce products for FUNCTIONAL equivalence to an ANCHOR (the genuine branded reference). For each candidate decide if it does the same job, independent of brand. Weights: 35% core function/use-case, 30% key-spec parity, 20% feature overlap, 10% quality, 5% category.
match_type ∈ EXACT_MATCH (same product/model) | NEAR_EXACT (same family, size/color/bundle differs) | FUNCTIONAL_TWIN (diff brand, same job, acceptable) | BUDGET_SUBSTITUTE (same job, real tradeoffs: durability/shipping/returns) | NOT_COMPARABLE (looks similar, materially different).
Return ONLY a JSON array, one object per candidate IN ORDER: [{"i":<index>,"match_type":...,"functional_parity":0-100,"reason":"why it's a twin & what you give up (<=18 words)","caveats":"short risk note"}]`;

async function classify(anchor: Row, cands: Row[]): Promise<any[]> {
  const fmt = (r: Row) => `${r.title} | brand=${r.brand ?? 'generic'} | $${r.price} | ${r.retailer} | ${r.rating ?? '?'}★(${r.review_count ?? 0})`;
  const user = `ANCHOR: ${fmt(anchor)}\n\nCANDIDATES:\n${cands.map((c, i) => `[${i}] ${fmt(c)}`).join('\n')}\n\nReturn the JSON array (${cands.length} items).`;
  try {
    const arr = await chatJSON<any[]>(SYS, user, 2200);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.warn(`  ⚠ classify failed: ${String(e).slice(0, 70)}`);
    return [];
  }
}

function valueScore(parity: number, savingsPct: number, matchType: string): number {
  const conf = matchType === 'NOT_COMPARABLE' ? 0 : 1;
  return Math.round((parity / 100) * savingsPct * conf * 100) / 100;
}

async function buildCluster(q: string, rows: Row[]): Promise<string | null> {
  const valid = rows.filter((r) => r.price != null && r.title && (r.price ?? 0) > 0);
  if (valid.length < 3) return null;

  // Reject outlier/bundle prices above 3× median when choosing the anchor.
  const priceCap = median(valid.map((r) => r.price as number)) * 3;
  const anchor = valid.reduce((a, b) => (anchorScore(b, priceCap) > anchorScore(a, priceCap) ? b : a));
  const cands = pickCandidates(valid, anchor);
  if (!cands.length) return null;

  const verdicts = await classify(anchor, cands);
  const byIdx = new Map<number, any>(verdicts.map((v) => [v.i, v]));

  const aPrice = anchor.price ?? 0;
  const members = cands.map((c, i) => {
    const v = byIdx.get(i) ?? {};
    const parity = Math.max(0, Math.min(100, Number(v.functional_parity) || 0));
    const savings = aPrice > 0 ? Math.max(0, Math.round((1 - (c.price ?? 0) / aPrice) * 100)) : 0;
    const mt = v.match_type || 'NOT_COMPARABLE';
    return { row: c, match_type: mt, parity, savings, value: valueScore(parity, savings, mt), reason: v.reason ?? '', caveats: v.caveats ?? '' };
  });

  // best picks
  const twins = members.filter((m) => m.match_type !== 'NOT_COMPARABLE' && m.parity >= 55);
  const bestValue = twins.slice().sort((a, b) => b.value - a.value)[0];
  const bestBudget = twins.slice().sort((a, b) => b.savings - a.savings)[0];
  const canonical = anchor.title.split(/[,|(]/)[0].trim().slice(0, 60);
  const category = (verdicts[0]?.category as string) || q;

  // write cluster + members in a transaction-ish sequence
  const [{ id: clusterId }] = await query<{ id: number }>(
    `INSERT INTO product_clusters (query, canonical_name, category, hero_product_id, best_exact_id, best_value_id, best_budget_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [q, canonical, category, anchor.id, anchor.id, bestValue?.row.id ?? null, bestBudget?.row.id ?? null],
  );

  // anchor as EXACT member (parity 100, savings 0)
  await query(
    `INSERT INTO cluster_members (cluster_id, product_id, match_type, functional_parity, price_savings_pct, value_score, reason, caveats)
     VALUES ($1,$2,'EXACT_MATCH',100,0,0,$3,'') ON CONFLICT DO NOTHING`,
    [clusterId, anchor.id, 'The genuine article — pins the honest reference price.'],
  );
  for (const m of members) {
    await query(
      `INSERT INTO cluster_members (cluster_id, product_id, match_type, functional_parity, price_savings_pct, value_score, reason, caveats)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
      [clusterId, m.row.id, m.match_type, m.parity, m.savings, m.value, m.reason, m.caveats],
    );
  }
  return `${q}: anchor=${anchor.retailer} $${aPrice} · ${members.length} candidates · value=${bestValue ? `$${bestValue.row.price}(${bestValue.parity}%,-${bestValue.savings}%)` : 'none'}`;
}

async function main() {
  console.log('Rebuilding clusters from scratch...');
  await query('DELETE FROM cluster_members');
  await query('DELETE FROM product_clusters');

  const queries = (await query<{ q: string }>(
    `SELECT DISTINCT raw_json->>'_query' AS q FROM products WHERE raw_json->>'_query' IS NOT NULL`,
  )).map((r) => r.q).filter(Boolean);
  console.log(`${queries.length} query groups to cluster.\n`);

  let built = 0;
  for (let i = 0; i < queries.length; i += CONCURRENCY) {
    const batch = queries.slice(i, i + CONCURRENCY);
    const rowsByQ = await Promise.all(batch.map((q) =>
      query<Row>(
        `SELECT id, retailer, title, brand, price, original_price, gtin14, asin, rating, review_count, image_url
         FROM products WHERE raw_json->>'_query' = $1`, [q],
      ),
    ));
    const results = await Promise.allSettled(batch.map((q, k) => buildCluster(q, rowsByQ[k])));
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) { built++; console.log(`  ✓ ${r.value}`); }
      else if (r.status === 'rejected') console.warn(`  ✗ ${String(r.reason).slice(0, 80)}`);
    }
  }

  const [{ c: clusters }] = await query<{ c: string }>('SELECT count(*) c FROM product_clusters');
  const [{ c: mems }] = await query<{ c: string }>('SELECT count(*) c FROM cluster_members');
  console.log(`\n✓ Built ${built} clusters · ${clusters} rows · ${mems} members.`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
