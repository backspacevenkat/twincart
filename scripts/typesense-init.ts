// Create the Typesense 'products' collection and report status.
import { ensureCollection, typesense } from '@/lib/search';

await ensureCollection();
const cols: any = await typesense.collections().retrieve();
console.log(
  '✓ Typesense collections:',
  cols.map((c: any) => `${c.name} (${c.num_documents} docs, ${c.fields.length} fields, sort=${c.default_sorting_field})`),
);
process.exit(0);
