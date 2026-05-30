import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/lib/env';
import type { IngestedProduct, NormalizedAttrs } from '@/lib/types';

const anthropic = new Anthropic({ apiKey: env.anthropicKey() });

const SYS = `You normalize messy e-commerce product titles into structured functional attributes for cross-retailer twin matching. Focus on FUNCTION, not brand. Return ONLY valid JSON matching this shape:
{"category":string,"core_function":string,"key_specs":{[k]:string|number},"material":string|null,"features":string[],"use_case":string[],"pack_count":number,"condition":"new"|"renewed"|"used"|"unknown"}`;

/** LLM-normalize a batch of products into functional attributes (Tier-2 input). Pre-computed offline. */
export async function normalizeProduct(p: IngestedProduct): Promise<NormalizedAttrs> {
  const msg = await anthropic.messages.create({
    model: env.llmModel(),
    max_tokens: 600,
    system: SYS,
    messages: [
      { role: 'user', content: `Title: ${p.title}\nBrand: ${p.brand ?? 'unknown'}\nRetailer: ${p.retailer}\nReturn the JSON.` },
    ],
  });
  const text = msg.content.find((c) => c.type === 'text');
  const raw = text && 'text' in text ? text.text : '{}';
  const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
  return JSON.parse(json) as NormalizedAttrs;
}
