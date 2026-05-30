/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Generate 6 cinematic "same product, half the price" hero banners (one per category vibe)
 * via Gemini 3.1 Flash Image, for the rotating home hero. Writes banner-1..6.jpg to
 * public/assets/hero/ and a `__banners` array into src/lib/hero-images.json (merged, not overwritten).
 * Resumable: skips existing files. Run: node --env-file=.env src/pipeline/gen-hero-banners.ts [--force]
 */
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) throw new Error('GEMINI_API_KEY not set');
const MODEL = 'gemini-3.1-flash-image-preview';
const OUT = join(process.cwd(), 'public/assets/hero');
const FORCE = process.argv.includes('--force');

const BASE =
  'Cinematic wide e-commerce hero image, split composition: on the LEFT a premium branded product, ' +
  'on the RIGHT an almost-identical generic twin of the same product, separated by a soft glowing vertical seam. ' +
  'Bright, airy, aspirational shopping mood, soft green accent lighting, neutral studio background, lots of negative space. ' +
  'No text, no logos, no watermark, no people. Subject: ';

// 6 distinct category scenes — communicates "twins across everything".
const SCENES = [
  'two stainless steel insulated water bottles side by side',
  'two pairs of true-wireless earbuds in charging cases',
  'two floral summer midi dresses on invisible mannequins',
  'two round robot vacuum cleaners',
  'two percussive massage gun devices',
  'two ergonomic mesh office chairs',
];

async function gen(prompt: string, outPath: string): Promise<boolean> {
  if (existsSync(outPath) && !FORCE) { console.log(`  · skip ${outPath}`); return true; }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY as string },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const j: any = await r.json();
      if (j.error) throw new Error(JSON.stringify(j.error).slice(0, 120));
      const img = (j.candidates?.[0]?.content?.parts || []).find((p: any) => p.inlineData);
      if (!img) throw new Error('no image');
      writeFileSync(outPath, Buffer.from(img.inlineData.data, 'base64'));
      console.log(`  ✓ ${outPath}`);
      return true;
    } catch (e) {
      console.warn(`  ✗ attempt ${attempt} ${outPath}: ${String(e).slice(0, 90)}`);
      if (attempt === 3) return false;
    }
  }
  return false;
}

async function main() {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
  const banners: string[] = [];
  for (let i = 0; i < SCENES.length; i++) {
    const path = join(OUT, `banner-${i + 1}.jpg`);
    if (await gen(BASE + SCENES[i], path)) banners.push(`/assets/hero/banner-${i + 1}.jpg`);
  }
  const manifestPath = join(process.cwd(), 'src/lib/hero-images.json');
  const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
  m.__banners = banners;
  writeFileSync(manifestPath, JSON.stringify(m, null, 2));
  console.log(`\n✓ ${banners.length} rotating banners → __banners in hero-images.json`);
}
main().catch((e) => { console.error(e); process.exit(1); });
