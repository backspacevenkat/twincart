// Shared domain types for the TwinCart pipeline.

export type Retailer = 'amazon' | 'temu' | 'shein' | 'walmart' | 'target';

export type MatchType =
  | 'EXACT_MATCH'
  | 'NEAR_EXACT'
  | 'FUNCTIONAL_TWIN'
  | 'BUDGET_SUBSTITUTE'
  | 'NOT_COMPARABLE';

/** A product as ingested + normalized, ready for DB insert. */
export interface IngestedProduct {
  retailer: Retailer;
  external_id: string | null; // ASIN/TCIN/goods_id — retailer-local
  gtin14: string | null; // normalized cross-retailer key (null for temu/shein)
  upc: string | null;
  asin: string | null;
  title: string;
  brand: string | null;
  price: number | null;
  original_price: number | null;
  currency: string;
  image_url: string | null;
  product_url: string | null;
  rating: number | null;
  review_count: number | null;
  raw_json: unknown;
}

/** LLM-normalized functional attributes (Tier-2 input). */
export interface NormalizedAttrs {
  category: string;
  core_function: string;
  key_specs: Record<string, string | number>;
  material: string | null;
  features: string[];
  use_case: string[];
  pack_count: number;
  condition: 'new' | 'renewed' | 'used' | 'unknown';
}

/** Result of matching one candidate against the anchor. */
export interface MatchResult {
  match_type: MatchType;
  functional_parity: number; // 0-100
  price_savings_pct: number; // vs anchor
  value_score: number; // parity × savings × confidence
  reason: string;
  caveats: string;
}
