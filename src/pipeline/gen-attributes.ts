// Generate per-cluster attribute comparison data via Gemini.
// Run: bun src/pipeline/gen-attributes.ts        (resumable — skips clusters that already have compareRows)
//      bun src/pipeline/gen-attributes.ts --force (regenerate all)
//
// For each cluster we ask Gemini ONCE for category-appropriate spec rows + matchedAttrs,
// then prepend the Price + Match rows in code (built from the real numbers) and persist.

import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  console.error("Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + KEY;

const DATA_PATH = resolve(import.meta.dir, "../lib/live-clusters.json");
const force = process.argv.includes("--force");

type Pick = { name: string; retailer: string; price: number; parity: number; matchType?: string };

function stripFences(t: string): string {
  return t.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function buildPrompt(cluster: any): string {
  const { exact, value, budget } = cluster.products as { exact: Pick; value: Pick; budget: Pick };
  return `You are a product-comparison analyst for a shopping aggregator called TwinCart.
The category is "${cluster.category}". Three real product listings were matched as "twins":

EXACT (reference): "${exact.name}" — $${exact.price} — ${exact.parity}% match
VALUE: "${value.name}" — $${value.price} — ${value.parity}% match
BUDGET: "${budget.name}" — $${budget.price} — ${budget.parity}% match

Produce a concise attribute comparison that shows HOW the twin match was derived for THIS category.
Return STRICT JSON only (no prose, no markdown fences) with this exact shape:

{
  "compareRows": [
    { "label": "<attribute name>", "exact": "<short value>", "value": "<short value>", "budget": "<short value>", "match": [true,true,false] }
  ],
  "matchedAttrs": ["<short shared core attribute>", "..."]
}

Rules:
- compareRows: 4 to 5 objects, each a CATEGORY-APPROPRIATE spec attribute (e.g. for a massage gun: Percussion/motor, Battery, Attachments, Build quality, Warranty; for a water bottle: Capacity, Insulation, Lid type, Material). Do NOT include a Price row or a Match row — those are added separately.
- "exact"/"value"/"budget" are short concrete values, max ~22 chars (e.g. "40oz", "Brushless", "5 heads", "1-yr", "Aluminum"). Ground them in the product NAME text where possible; otherwise give a plausible category-typical value.
- "match" is [exactBool, valueBool, budgetBool]: true when that pick shares the core attribute with the EXACT reference pick. The exact column is almost always true. The value column is usually true on core specs. The budget column should NOT be all-true — it should miss on quality/warranty/secondary specs so the comparison is honest.
- matchedAttrs: 4 to 6 SHORT strings naming the shared core attributes that make these twins (e.g. ["Deep-tissue percussion","Cordless rechargeable","Multiple head attachments","Handheld form factor"]).
- Keep everything plausible (this is demo data, not affiliated) — never absurd.`;
}

async function callGemini(prompt: string): Promise<any | null> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
    }),
  });
  if (!res.ok) {
    console.warn(`  Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return null;
  }
  const json: any = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.warn("  Empty Gemini response");
    return null;
  }
  try {
    return JSON.parse(stripFences(text));
  } catch (e) {
    console.warn("  JSON parse failed:", String(e).slice(0, 120));
    return null;
  }
}

function sanitizeRows(rows: any[]): any[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => r && typeof r.label === "string")
    .map((r) => ({
      label: String(r.label).slice(0, 40),
      exact: String(r.exact ?? "—").slice(0, 24),
      value: String(r.value ?? "—").slice(0, 24),
      budget: String(r.budget ?? "—").slice(0, 24),
      match: Array.isArray(r.match) && r.match.length === 3
        ? r.match.map((b: any) => Boolean(b))
        : [true, true, false],
    }));
}

async function main() {
  const clusters: any[] = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  let done = 0, skipped = 0, failed = 0;

  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    if (!force && Array.isArray(c.compareRows) && c.compareRows.length >= 3) {
      skipped++;
      continue;
    }
    const { exact, value, budget } = c.products;
    console.log(`[${i + 1}/${clusters.length}] ${c.query} (${c.category})`);

    const parsed = await callGemini(buildPrompt(c));
    if (!parsed) {
      console.warn(`  -> SKIPPED (left empty)`);
      c.compareRows = [];
      c.matchedAttrs = c.matchedAttrs || [];
      failed++;
      writeFileSync(DATA_PATH, JSON.stringify(clusters, null, 2));
      continue;
    }

    const priceRow = {
      label: "Price",
      exact: `$${exact.price}`,
      value: `$${value.price}`,
      budget: `$${budget.price}`,
      match: [false, false, false],
    };
    const matchRow = {
      label: "Match",
      exact: `${exact.parity}% exact`,
      value: `${value.parity}% twin`,
      budget: `${budget.parity}% twin`,
      match: [true, true, false],
    };

    const specRows = sanitizeRows(parsed.compareRows).slice(0, 5);
    c.compareRows = [priceRow, matchRow, ...specRows].slice(0, 7);

    const attrs = Array.isArray(parsed.matchedAttrs)
      ? parsed.matchedAttrs.map((a: any) => String(a).slice(0, 40)).filter(Boolean).slice(0, 6)
      : [];
    c.matchedAttrs = attrs;

    console.log(`  -> ${c.compareRows.length} rows, ${c.matchedAttrs.length} matchedAttrs`);
    done++;
    writeFileSync(DATA_PATH, JSON.stringify(clusters, null, 2)); // persist after each cluster
  }

  console.log(`\nDone. generated=${done} skipped=${skipped} failed=${failed} total=${clusters.length}`);
}

main();
