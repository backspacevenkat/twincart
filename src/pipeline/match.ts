import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/lib/env';
import type { IngestedProduct, MatchResult, NormalizedAttrs } from '@/lib/types';

const anthropic = new Anthropic({ apiKey: env.anthropicKey() });

export interface Candidate {
  product: IngestedProduct;
  attrs: NormalizedAttrs;
}

/** Tier 1 — deterministic exact match: shared normalized GTIN-14 (branded goods, Amazon/Walmart/Target only). */
export function isExactMatch(a: IngestedProduct, b: IngestedProduct): boolean {
  return !!a.gtin14 && a.gtin14 === b.gtin14;
}

/**
 * Tier 2 — LLM functional-parity engine. Scores "does the candidate do the same job as the anchor?"
 * independent of brand/SKU, and writes the verdict. This is the product's differentiator.
 */
export async function scoreFunctionalTwin(anchor: Candidate, candidate: Candidate): Promise<MatchResult> {
  const sys = `You compare two products for FUNCTIONAL equivalence (not brand). Score how well the candidate does the same job as the anchor. Weights: 35% core-function & use-case, 30% key-spec parity, 20% feature overlap, 10% quality/review confidence, 5% category.
Classify match_type:
- FUNCTIONAL_TWIN: high parity, acceptable, different brand
- BUDGET_SUBSTITUTE: high parity but real tradeoffs (durability/shipping/returns risk)
- NEAR_EXACT: same product family, size/color/bundle differs
- NOT_COMPARABLE: looks similar but materially different
Return ONLY JSON: {"match_type":...,"functional_parity":0-100,"reason":"one sentence on why it's a twin and what you give up","caveats":"short risk note"}`;

  const fmt = (c: Candidate) =>
    `${c.product.title} | brand=${c.product.brand ?? 'generic'} | $${c.product.price} | attrs=${JSON.stringify(c.attrs)}`;

  const msg = await anthropic.messages.create({
    model: env.llmModel(),
    max_tokens: 400,
    system: sys,
    messages: [{ role: 'user', content: `ANCHOR: ${fmt(anchor)}\nCANDIDATE: ${fmt(candidate)}\nReturn the JSON.` }],
  });
  const text = msg.content.find((c) => c.type === 'text');
  const raw = text && 'text' in text ? text.text : '{}';
  const j = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)) as {
    match_type: MatchResult['match_type'];
    functional_parity: number;
    reason: string;
    caveats: string;
  };

  const anchorPrice = anchor.product.price ?? 0;
  const candPrice = candidate.product.price ?? 0;
  const savings = anchorPrice > 0 ? Math.max(0, (anchorPrice - candPrice) / anchorPrice) : 0;
  const confidence = j.match_type === 'NOT_COMPARABLE' ? 0 : 1;

  return {
    match_type: j.match_type,
    functional_parity: j.functional_parity,
    price_savings_pct: Math.round(savings * 100),
    // Value Score = parity × savings × confidence. Ranks Best Value / Best Budget (NOT lowest price).
    value_score: Math.round((j.functional_parity / 100) * (savings * 100) * confidence * 100) / 100,
    reason: j.reason,
    caveats: j.caveats,
  };
}
