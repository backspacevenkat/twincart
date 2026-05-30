import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIR = join(import.meta.dir, "../remotion/public/bg");
const KEY = process.env.GEMINI_API_KEY!;
const MODEL = "gemini-3.1-flash-image-preview";
const PROMPTS: Record<string, string> = {
  hook: "Dark cinematic abstract background, deep navy to teal gradient, subtle floating shopping-cart and price-tag silhouettes, premium tech keynote style, no text, 16:9 wide",
  idea: "Two abstract product silhouettes mirrored as twins on a dark teal stage, soft spotlight beam between them, minimal premium, no text, 16:9 wide",
  close: "Dark premium split-stage background, left side cool blue, right side warm green, abstract marketplace network nodes, no text, 16:9 wide",
};

async function gen(name: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  try {
    const r = await fetch(url, {
      method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const d: any = await r.json();
    const part = d?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData || p.inline_data);
    const inline = part?.inlineData ?? part?.inline_data;
    if (!inline?.data) { console.warn(`no image for ${name}:`, JSON.stringify(d).slice(0, 240)); return; }
    writeFileSync(join(DIR, `${name}.png`), Buffer.from(inline.data, "base64"));
    console.log("bg", name);
  } catch (e) { console.warn(`bg ${name} failed:`, (e as Error).message); }
}

const main = async () => {
  mkdirSync(DIR, { recursive: true });
  for (const [n, p] of Object.entries(PROMPTS)) await gen(n, p);
};
main();
