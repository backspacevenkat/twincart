import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { SCENES } from "../remotion/src/data/script";

const API = "https://api.elevenlabs.io/v1/text-to-speech";
const KEY = process.env.ELEVENLABS_API_KEY!;
const VOICE = process.env.ELEVENLABS_VOICE_ID!;
const MODEL = "eleven_multilingual_v2";
const HARD_CAP = 178; // seconds; leaves headroom under the 180s limit
const AUDIO_DIR = join(import.meta.dir, "../remotion/public/audio");
const MANIFEST = join(import.meta.dir, "../remotion/src/data/manifest.json");

type Word = { word: string; start: number; end: number };

// Group ElevenLabs char-level alignment into word-level timings.
function wordsFromAlignment(chars: string[], starts: number[], ends: number[]): Word[] {
  const words: Word[] = [];
  let cur = "", s = 0, e = 0, started = false;
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === " " || c === "\n") {
      if (cur) { words.push({ word: cur, start: s, end: e }); cur = ""; started = false; }
    } else {
      if (!started) { s = starts[i]; started = true; }
      cur += c; e = ends[i];
    }
  }
  if (cur) words.push({ word: cur, start: s, end: e });
  return words;
}

async function synth(scene: string, text: string) {
  const res = await fetch(`${API}/${VOICE}/with-timestamps`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: MODEL }),
  });
  if (!res.ok) throw new Error(`${scene}: ${res.status} ${await res.text()}`);
  const d: any = await res.json();
  const a = d.alignment ?? d.normalized_alignment;
  const ends: number[] = a.character_end_times_seconds;
  const starts: number[] = a.character_start_times_seconds;
  const chars: string[] = a.characters;
  const audioFile = `audio/${scene}.mp3`;
  writeFileSync(join(AUDIO_DIR, `${scene}.mp3`), Buffer.from(d.audio_base64, "base64"));
  return { scene, audioFile, durationSeconds: ends[ends.length - 1], words: wordsFromAlignment(chars, starts, ends) };
}

const main = async () => {
  mkdirSync(AUDIO_DIR, { recursive: true });
  const clips = [];
  for (const s of SCENES) clips.push(await synth(s.id, s.vo));
  const total = clips.reduce((n, c) => n + c.durationSeconds, 0);
  console.table(clips.map((c) => ({ scene: c.scene, sec: c.durationSeconds.toFixed(1) })));
  console.log(`TOTAL ${total.toFixed(1)}s`);
  writeFileSync(MANIFEST, JSON.stringify(clips, null, 2));
  if (total > HARD_CAP) {
    console.error(`OVER CAP: ${total.toFixed(1)}s > ${HARD_CAP}s — trim script.ts and rerun.`);
    process.exit(1);
  }
};
main();
