/* eslint-disable @typescript-eslint/no-explicit-any */
// Provider-agnostic JSON chat. Honors LLM_PROVIDER/LLM_MODEL (default openai/gpt-5.4-mini per user).
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { env } from './env';

const provider = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase();
const model = env.llmModel();

let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;

/** Send system+user prompts, get back parsed JSON. Strips prose around the JSON defensively. */
export async function chatJSON<T = any>(system: string, user: string, maxTokens = 2000): Promise<T> {
  let raw = '';
  if (provider === 'anthropic') {
    anthropic ??= new Anthropic({ apiKey: env.anthropicKey() });
    const m = await anthropic.messages.create({
      model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }],
    });
    const t = m.content.find((c) => c.type === 'text');
    raw = t && 'text' in t ? t.text : '';
  } else {
    openai ??= new OpenAI({ apiKey: env.openaiKey() });
    const r = await openai.chat.completions.create({
      model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      max_completion_tokens: maxTokens,
    });
    raw = r.choices[0]?.message?.content ?? '';
  }
  // Extract the JSON object/array even if the model wraps it in prose or fences.
  const start = Math.min(...['{', '['].map((c) => { const i = raw.indexOf(c); return i < 0 ? Infinity : i; }));
  const end = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'));
  const json = start === Infinity || end < 0 ? raw : raw.slice(start, end + 1);
  return JSON.parse(json) as T;
}
