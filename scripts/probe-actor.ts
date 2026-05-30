/**
 * Raw actor probe — runs ONE Apify actor with a given input and prints the first few raw items,
 * so we can see real field names and fix mappings. Usage:
 *   bun scripts/probe-actor.ts <actorId> '<inputJson>'
 */
import { ApifyClient } from 'apify-client';
import { env } from '@/lib/env';

const client = new ApifyClient({ token: env.apifyToken() });
const actorId = process.argv[2];
const input = JSON.parse(process.argv[3] ?? '{}');

console.log(`Running ${actorId} with`, JSON.stringify(input));
const run = await client.actor(actorId).call(input);
const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.log(`→ ${items.length} items. First item keys + sample:\n`);
const first = items[0] as Record<string, unknown> | undefined;
if (first) {
  console.log('KEYS:', Object.keys(first).join(', '));
  console.log('\nSAMPLE (first 2):');
  for (const it of items.slice(0, 2)) console.log(JSON.stringify(it, null, 1).slice(0, 900));
} else {
  console.log('(no items returned)');
}
process.exit(0);
