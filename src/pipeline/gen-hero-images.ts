/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Generate clean, consistent hero imagery with Gemini 3.1 Flash Image Preview:
 *   - one cinematic split "same product, half the price" banner
 *   - one studio product tile per live category (uniform look for the browse grid)
 * Images are written to public/assets/hero/ and a manifest to src/lib/hero-images.json,
 * so the static export ships them with zero runtime cost. Resumable: skips files that exist.
 * Run: node --env-file=.env src/pipeline/gen-hero-images.ts   (add --force to regenerate)
 */
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) throw new Error('GEMINI_API_KEY not set');
const MODEL = 'gemini-3.1-flash-image-preview';
const OUT_DIR = join(process.cwd(), 'public/assets/hero');
const FORCE = process.argv.includes('--force');

const STYLE =
  'Clean modern e-commerce studio product photograph, soft neutral light-grey gradient background, ' +
  'centered single product, crisp soft studio lighting, subtle reflection, high detail, premium catalog look. ' +
  'No text, no logos, no watermark, no people, no hands.';

// Short, concrete subject per category (keeps Gemini on-product and consistent).
const SUBJECTS: Record<string, string> = {
  'monitor stand': 'an adjustable dual-monitor desk mount stand, matte black metal',
  'sunscreen': 'a white sunscreen lotion bottle with a pump',
  'shampoo': 'a pair of matching shampoo and conditioner bottles',
  'face serum': 'a small glass face-serum dropper bottle',
  'rain jacket': 'a folded waterproof shell rain jacket',
  'lip balm': 'a tube of lip balm standing upright',
  'robot vacuum': 'a round robot vacuum cleaner, dark grey',
  'tote bag': 'a canvas tote bag standing upright',
  'office chair': 'an ergonomic mesh office chair',
  'jump rope': 'a coiled speed jump rope with handles',
  'webcam': 'a small clip-on 1080p USB webcam',
  'summer dress': 'a floral summer midi dress on an invisible mannequin',
  'kitchen scale': 'a slim digital kitchen food scale',
  'kids shoes': 'a pair of small colorful kids sneakers',
  'thermo flask': 'a stainless steel insulated water bottle with handle lid',
  'stanley tumbler': 'a 40oz insulated tumbler with handle and straw',
  'iphone charger': 'a compact USB-C fast wall charger with cable',
  'dumbbells': 'a pair of hex rubber dumbbells',
  'massage gun': 'a percussive massage gun device with attachment',
  'dog bed': 'a soft round plush dog bed',
  'foam roller': 'a textured fitness foam roller',
  'led strip lights': 'a roll of RGB LED strip lights glowing softly',
  'belt': 'a coiled leather belt with buckle',
  'wireless mouse': 'a sleek wireless computer mouse',
  'wireless earbuds': 'a pair of true-wireless earbuds with charging case',
  'led mirror': 'a round LED-lit vanity makeup mirror',
  'wallet': 'a slim leather bifold wallet',
  'cat tree': 'a multi-level carpeted cat tree tower',
};

function slug(q: string) { return q.replace(/[^a-z0-9]+/gi, '-').toLowerCase(); }

async function gen(prompt: string, outPath: string): Promise<boolean> {
  if (existsSync(outPath) && !FORCE) { console.log(`  · skip ${outPath} (exists)`); return true; }
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
      if (!img) throw new Error('no image in response');
      writeFileSync(outPath, Buffer.from(img.inlineData.data, 'base64'));
      console.log(`  ✓ ${outPath}`);
      return true;
    } catch (e) {
      console.warn(`  ✗ attempt ${attempt} ${outPath}: ${String(e).slice(0, 100)}`);
      if (attempt === 3) return false;
    }
  }
  return false;
}

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const clusters = JSON.parse(readFileSync(join(process.cwd(), 'src/lib/live-clusters.json'), 'utf8'));
  const queries: string[] = [...new Set(clusters.map((c: any) => c.query))] as string[];

  const manifest: Record<string, string> = {};

  // 1) cinematic banner
  const bannerPath = join(OUT_DIR, 'banner.jpg');
  const bannerPrompt =
    'Cinematic wide e-commerce hero image, split composition: on the left a premium branded product, ' +
    'on the right an almost-identical generic twin product, separated by a soft glowing vertical seam. ' +
    'Bright, airy, aspirational shopping mood, soft green accent lighting, neutral background, lots of negative space. ' +
    'No text, no logos, no watermark, no people.';
  if (await gen(bannerPrompt, bannerPath)) manifest['__banner'] = '/assets/hero/banner.jpg';

  // 2) per-category tiles
  let ok = 0;
  for (const q of queries) {
    const subject = SUBJECTS[q] || `a single ${q} product`;
    const path = join(OUT_DIR, `${slug(q)}.jpg`);
    const prompt = `${STYLE} The product is ${subject}.`;
    if (await gen(prompt, path)) { manifest[q] = `/assets/hero/${slug(q)}.jpg`; ok++; }
  }

  writeFileSync(join(process.cwd(), 'src/lib/hero-images.json'), JSON.stringify(manifest, null, 2));
  console.log(`\n✓ ${ok}/${queries.length} category tiles + banner → public/assets/hero/, manifest → src/lib/hero-images.json`);
}
main().catch((e) => { console.error(e); process.exit(1); });
