/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Export DB clusters → src/lib/live-clusters.json in the FRONTEND cluster shape (with REAL images).
 * Static-export friendly: the app imports this JSON at build, no API route needed.
 * Run: bun src/pipeline/export-clusters.ts
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pool, query } from '@/lib/db';

const SHIP: Record<string, [string, string]> = {
  amazon: ['2-day delivery', 'good'], walmart: ['3–5 days', 'ok'], target: ['Pickup today', 'good'],
  temu: ['7–15 days · verify seller', 'warn'], shein: ['5–8 days', 'ok'],
};
const STOCK: Record<string, string> = { amazon: 'In stock', walmart: 'In stock', target: 'In stock', temu: 'Ships from CN', shein: 'In stock' };
const prettyMatch = (m: string) => m.replace(/_/g, ' ');
const num = (v: any) => (v == null ? null : Number(v));

interface M {
  product_id: number; retailer: string; title: string; brand: string | null;
  price: number; original_price: number | null; image_url: string | null; product_url: string | null;
  rating: number | null; review_count: number | null;
  match_type: string; functional_parity: number; price_savings_pct: number; value_score: number;
  reason: string; caveats: string;
}

function toProduct(m: M, slot: string, tag: string) {
  const [shipping, shippingTone] = SHIP[m.retailer] ?? ['Ships in days', 'ok'];
  const isExact = m.match_type === 'EXACT_MATCH';
  return {
    slot, tag, retailer: m.retailer, name: m.title,
    price: Math.round(m.price), parity: m.functional_parity, matchType: prettyMatch(m.match_type),
    anchorKey: isExact ? 'The genuine article' : (m.caveats || 'Different brand · no shared SKU'),
    image: m.image_url, url: m.product_url, tint: '',
    shipping, shippingTone: tag === 'budget' ? 'warn' : shippingTone,
    rating: m.rating ?? 4.3, reviews: m.review_count ?? 0, stock: STOCK[m.retailer] ?? 'In stock',
    take: m.reason || undefined,
    ...(isExact ? {} : { savingsAmt: undefined as any, savingsPct: m.price_savings_pct }),
  };
}

async function main() {
  const clusters = await query<any>(
    `SELECT pc.id, pc.query, pc.canonical_name, pc.category, pc.hero_product_id, pc.best_value_id, pc.best_budget_id
     FROM product_clusters pc ORDER BY pc.id`,
  );

  const out: any[] = [];
  for (const c of clusters) {
    const members = await query<M>(
      `SELECT cm.product_id, p.retailer, p.title, p.brand, p.price, p.original_price, p.image_url, p.product_url,
              p.rating, p.review_count, cm.match_type, cm.functional_parity, cm.price_savings_pct,
              cm.value_score, cm.reason, cm.caveats
       FROM cluster_members cm JOIN products p ON p.id = cm.product_id
       WHERE cm.cluster_id = $1 AND p.price > 0
       ORDER BY (cm.match_type='EXACT_MATCH') DESC, cm.value_score DESC`,
      [c.id],
    );
    if (members.length < 3) continue;

    const anchor = members.find((m) => m.product_id === c.hero_product_id) ?? members[0];
    const twins = members.filter((m) => m.match_type !== 'EXACT_MATCH' && m.match_type !== 'NOT_COMPARABLE');
    if (!twins.length) continue;
    const value = members.find((m) => m.product_id === c.best_value_id) ?? twins[0];
    // Budget = biggest-savings twin that is DISTINCT from value (avoid showing the same product twice).
    const budgetSorted = twins.slice().sort((a, b) => b.price_savings_pct - a.price_savings_pct);
    let budget = members.find((m) => m.product_id === c.best_budget_id) ?? budgetSorted[0];
    if (budget.product_id === value.product_id) {
      budget = budgetSorted.find((m) => m.product_id !== value.product_id) ?? budget;
    }

    // savings amount vs anchor
    const withAmt = (p: any, m: M) => ({ ...p, savingsAmt: Math.max(0, Math.round(anchor.price - m.price)) });

    // offers: anchor + up to 6 twins, deduped by product
    const offerMembers = [anchor, ...twins.filter((t) => t.product_id !== anchor.product_id)].slice(0, 7);
    const offers = offerMembers.map((m) => {
      const tag = m.product_id === value.product_id ? 'value'
        : m.product_id === budget.product_id ? 'budget'
        : m.product_id === anchor.product_id ? 'exact' : undefined;
      const [shipping, shippingTone] = SHIP[m.retailer] ?? ['Ships in days', 'ok'];
      return {
        retailer: m.retailer, name: m.title, price: Math.round(m.price), parity: m.functional_parity,
        matchType: prettyMatch(m.match_type),
        ...(m.match_type === 'EXACT_MATCH' ? {} : { savingsAmt: Math.max(0, Math.round(anchor.price - m.price)), savingsPct: m.price_savings_pct }),
        shipping, shippingTone, rating: m.rating ?? 4.3, reviews: m.review_count ?? 0,
        image: m.image_url, url: m.product_url, tint: '', stock: STOCK[m.retailer] ?? 'In stock', tag,
      };
    });

    const maxSavings = Math.max(...twins.map((t) => t.price_savings_pct), 0);
    out.push({
      id: `live-${c.id}`, query: c.query, icon: 'box',
      title: `${c.canonical_name} & Twins`, category: c.category || c.query,
      live: true, maxSavingsPct: maxSavings,
      heroImages: offerMembers.map((m) => m.image_url).filter(Boolean).slice(0, 4),
      products: {
        exact: toProduct(anchor, 'Best Exact', 'exact'),
        value: withAmt(toProduct(value, 'Best Value', 'value'), value),
        budget: withAmt(toProduct(budget, 'Best Budget', 'budget'), budget),
      },
      offers,
      verdict: value.reason
        ? `${value.reason} The budget pick saves ${budget.price_savings_pct}% — accept slower shipping and thinner returns.`
        : `TwinCart found a functional twin for ${value.price_savings_pct}% less across marketplaces.`,
      matchedAttrs: [],
    });
  }

  const path = join(process.cwd(), 'src/lib/live-clusters.json');
  writeFileSync(path, JSON.stringify(out, null, 0));
  const queries = [...new Set(out.map((c) => c.query))];
  console.log(`✓ Exported ${out.length} live clusters across ${queries.length} queries → ${path}`);
  console.log(`  queries: ${queries.join(', ')}`);
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
