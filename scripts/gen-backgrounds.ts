import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIR = join(import.meta.dir, "../remotion/public/bg");
const KEY = process.env.GEMINI_API_KEY!;
const MODEL = "gemini-3.1-flash-image-preview";
const PROMPTS: Record<string, string> = {
  hook: "A single glowing translucent shopping cart floating in a vast dark cinematic void, with a faint identical ghost twin cart beside it, deep navy to teal volumetric lighting, premium Apple-keynote aesthetic, ultra detailed, photorealistic, dramatic depth of field, no text, no words, cinematic widescreen 16:9",
  idea: "Two nearly identical sleek product boxes standing side by side on a dark reflective studio stage, the right one softly glowing teal as its twin, dramatic single spotlight, high-end minimalist product photography, deep shadows, premium, no text, no words, cinematic widescreen 16:9",
  close: "Two elegant glowing marketplace network constellations on a dark premium stage, left cluster cool blue nodes, right cluster warm green nodes, fine connecting light lines merging in the center, cinematic depth and bokeh, premium tech keynote, no text, no words, widescreen 16:9",
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
