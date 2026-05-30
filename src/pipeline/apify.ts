import { ApifyClient } from 'apify-client';
import { env } from '@/lib/env';
import type { IngestedProduct, Retailer } from '@/lib/types';
import { RETAILER_ACTORS } from './config';

const client = new ApifyClient({ token: env.apifyToken() });

/**
 * Scrape one retailer for one query. COSTS MONEY — callers must respect env.ingestConfirmed().
 * Returns normalized IngestedProduct[].
 */
export async function scrapeRetailer(
  retailer: Retailer,
  query: string,
  maxItems = 100,
): Promise<IngestedProduct[]> {
  const cfg = RETAILER_ACTORS[retailer];
  const run = await client.actor(cfg.actorId).call(cfg.buildInput(query, maxItems));
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return (items as Record<string, unknown>[])
    .map((i) => cfg.map(i, query))
    .filter((p) => p.title && p.price != null);
}
