/* eslint-disable @typescript-eslint/no-explicit-any */
// Typesense search layer — fast, typo-tolerant, faceted search for the 10k–20k+ listing scale.
// Postgres pg_trgm/pgvector stays the source of truth; Typesense is the read-optimized search index.
import Typesense from 'typesense';
import { env } from './env';

const t = env.typesense();
export const typesense = new Typesense.Client({
  nodes: [{ host: t.host, port: t.port, protocol: t.protocol }],
  apiKey: t.apiKey,
  connectionTimeoutSeconds: 5,
});

const COLLECTION = 'products';

export const productsSchema = {
  name: COLLECTION,
  fields: [
    { name: 'title', type: 'string' },
    { name: 'retailer', type: 'string', facet: true },
    { name: 'brand', type: 'string', facet: true, optional: true },
    { name: 'category', type: 'string', facet: true, optional: true },
    { name: 'match_type', type: 'string', facet: true, optional: true },
    { name: 'cluster_id', type: 'string', facet: true, optional: true },
    { name: 'price', type: 'float', facet: true },
    { name: 'rating', type: 'float', facet: true, optional: true },
    { name: 'parity', type: 'int32', optional: true },
    { name: 'value_score', type: 'float' }, // default sort — ranks by parity × savings
    { name: 'gtin14', type: 'string', optional: true },
    { name: 'image_url', type: 'string', optional: true },
    { name: 'product_url', type: 'string', optional: true },
  ],
  default_sorting_field: 'value_score',
} as const;

/** Create the products collection if it doesn't exist. */
export async function ensureCollection(): Promise<void> {
  try {
    await typesense.collections(COLLECTION).retrieve();
  } catch {
    await typesense.collections().create(productsSchema as any);
  }
}

/** Upsert a batch of product documents (each must include id + value_score). */
export async function indexProducts(docs: any[]): Promise<void> {
  if (!docs.length) return;
  await typesense.collections(COLLECTION).documents().import(docs, { action: 'upsert' });
}

/** Typo-tolerant, faceted search. Ranks by Value Score (parity × savings) by default. */
export async function search(
  q: string,
  opts: { filterBy?: string; sortBy?: string; perPage?: number } = {},
): Promise<any> {
  return typesense.collections(COLLECTION).documents().search({
    q,
    query_by: 'title,brand',
    filter_by: opts.filterBy,
    sort_by: opts.sortBy ?? 'value_score:desc',
    facet_by: 'retailer,brand,match_type',
    per_page: opts.perPage ?? 30,
  });
}
