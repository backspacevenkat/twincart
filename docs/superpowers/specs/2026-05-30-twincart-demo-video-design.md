# TwinCart — 3-Minute Hackathon Demo Video (Remotion + real-app capture)

**Date:** 2026-05-30
**Status:** Design — awaiting user review (v2: programmatic real-app capture)
**Owner:** venkat

## Goal

Produce a **3:00 (hard cap, ≤180s)** demo video for the hackathon. The **primary
hero is twin discovery + savings** (the differentiated IP: cross-brand
functional-parity matching that finds the cheaper twin) — it owns ~55% of the
runtime. The **agentic checkout is a small closing feature** (~20s), not a hero.
The video is **fully automatic** (no manual recording): a Playwright script
drives the **real running TwinCart app** and captures it; Remotion composes those
captures with an **ElevenLabs** AI voiceover, synced captions, highlights, and
synthetic framing scenes. Re-renderable from one command.

## Approach (decided)

- **~75% real captured app UI** + **synthetic framing** only where the app has
  nothing to show (opening Google-Universal-Cart hook; closing Google contrast).
- Capture the app running **locally via `pnpm dev`** (deterministic, no network
  flakiness) — identical UI to the live Amplify deploy.
- Feature **high-savings real clusters** (robot vacuum 97%, massage gun 94%,
  LED strips 90%) — not the 38% one.
- Still renders headless from one command.

## Non-Goals

- No manual screen recording (capture is fully scripted).
- No changes to the TwinCart app (capture is read-only; `remotion/` is isolated).
- No AI-generated brand logos (real SVGs only).
- No claim of direct Google Universal Cart access (frame: "UCP-compatible /
  Google validates the direction").

## Why this is capturable without a backend

`src/components/TwinCartApp.tsx:1740` advances the agent stepper purely
client-side (`setTimeout(() => setStep(s+1), 1100)`) through the 4 steps
(Opening retailer → Locating product → Adding to cart "UCP: ready_for_complete"
→ Awaiting your approval). Search, clusters, price carousel, compare, and Box
report are all static-export client UI. So a headless browser can drive the
entire flow with no server wiring.

## Accuracy Constraints (must hold in the VO script)

- Name is **TwinCart**.
- Matching = **Tier 1 GTIN exact-match** + **Tier 2 Claude functional-parity**;
  ranking = **Value Score = parity × savings × confidence**.
- Match types: `EXACT_MATCH`, `FUNCTIONAL_TWIN`, `BUDGET_SUBSTITUTE`.
- Agent **adds to cart and stops at "Awaiting your approval" — never auto-pays.**
- Savings numbers come from real `live-clusters.json` (up to 97%).
- Retailers: Amazon, Temu, SHEIN, Walmart, Target.
- "UCP-compatible / Google validates the direction" — never "we use Google's
  Universal Cart directly."

## Architecture

```
remotion/
  package.json          # own deps; Remotion + Playwright pinned, React 19-compatible
  remotion.config.ts
  src/
    Root.tsx            # registers <Composition> (reads manifest for fps/length)
    Video.tsx           # maps scenes → <Sequence> using manifest durations
    scenes/
      S1_Hook.tsx           # SYNTHETIC (Google announcement → TwinCart slam)
      S2_DupeEconomy.tsx     # SYNTHETIC (concept: twin, no shared barcode)
      S3_HowTwinsFound.tsx   # REAL captures + animated overlay (Tier1/Tier2/ValueScore)
      S4_TwinPayoff.tsx      # REAL captures (cluster + carousel + savings + Box report)
      S5_AgentCheckout.tsx   # REAL capture video (stepper → Awaiting approval)
      S6_GoogleContrast.tsx  # SYNTHETIC (split: Google ‖ TwinCart) + close
    components/         # Caption, Highlight, SavingsCounter, Logo, SceneBg, KenBurns
    data/
      manifest.json      # GENERATED: [{scene, audioFile, durationSeconds, words[]}]
      script.ts          # VO text per scene (single source of truth)
      shots.ts           # GENERATED index of capture assets (paths + labels)
  public/
    audio/               # GENERATED per-scene mp3s
    capture/             # GENERATED: screenshots (*.png) + clips (*.webm) from Playwright
    logos/               # real SVGs (amazon, temu, shein, walmart, target, google)
    bg/                  # Gemini abstract backgrounds (framing scenes only)
scripts/
  capture-app.ts         # Playwright: drive local pnpm dev, emit video + screenshots + shots.ts
  gen-voiceover.ts       # script.ts -> ElevenLabs with-timestamps -> mp3 + manifest
  fetch-logos.ts         # download 6 retailer/Google SVGs locally (via Exa/web)
  gen-backgrounds.ts     # Gemini 3.1 flash image -> public/bg/*.png (framing only)
```

Root `package.json` scripts:
- `video:capture` → start `pnpm dev`, run `bun scripts/capture-app.ts`, stop dev
- `video:vo` → `bun scripts/gen-voiceover.ts`
- `video:assets` → `bun scripts/fetch-logos.ts && bun scripts/gen-backgrounds.ts`
- `video:preview` → `cd remotion && npx remotion studio`
- `video:build` → `cd remotion && npx remotion render` → `out/twincart-demo.mp4`

### Capture & zoom tooling (researched)

- **Playwright** chosen for capture: built-in video recording, precise navigation
  via role/text locators + explicit waits (not fragile sleeps), and high-DPI
  screenshots. (Puppeteer is comparable but Playwright's video + waiting ergonomics
  win here.)
- **Zoom is done in Remotion, not the browser.** Capturing at `deviceScaleFactor:2`
  yields 3840×2160 PNGs; Remotion scales them into the 1920×1080 frame, so pushing
  in to ~2× stays pixel-sharp and shows the *exact* real UI (no responsive
  re-layout that in-browser zoom would cause). `KenBurns`/`Highlight` drive the
  zoom/pan toward the matching verdict and savings numbers.
- Animated stretches (carousel swap, agent stepper) are short **video clips**,
  shown full-frame.

### Capture script (`capture-app.ts`) — continuous takes (≤2-3 "gos")

**Coherence requirement:** the real-app footage must read as one flowing journey,
NOT a stitched montage of many fragments. So we capture **one continuous take**
for the twin-finding journey (and at most one more short take for the agent),
recorded as video with smooth, deliberate scripted pacing.

- Playwright Chromium recording continuous video (`recordVideo`). Record at the
  **highest practical resolution** (e.g. 2560×1440 viewport) and downscale in
  Remotion to 1080p, giving zoom headroom that stays sharp. (Exact viewport is a
  build-time tuning detail for this mobile-first UI.)
- Navigation uses Playwright role/text locators + **explicit waits** (wait for a
  ready selector, not fixed sleeps), with deliberate human-paced dwell so the
  footage breathes. Smooth-scroll, not jump-scroll.
- **Take 1 (the spine, continuous):** Home → type hero query (e.g. "robot
  vacuum") → results → open hero cluster (97%/94%/90% savings) → price carousel
  (click price points, images swap) → compare/parity view → savings + Box report.
  This single take feeds scenes 3 + 4.
- **Take 2 (short, continuous):** Buy → agent stepper runs the 4 steps →
  Awaiting your approval → approval state. Feeds scene 5.
- Emits `public/capture/take1.webm`, `take2.webm` (transcode to mp4 if Remotion
  needs it) + `remotion/src/data/shots.ts` mapping logical beats → **timecodes
  within each take** (so Remotion can zoom/pan to a beat without cutting).
- A few still `page.screenshot()`s are captured only as fallback/poster frames,
  not as the primary material.
- Idempotent: re-running overwrites `public/capture/` cleanly.

### Audio-manifest-driven layout (unchanged core decision)

1. `script.ts` = VO text per scene (only place to edit copy).
2. `gen-voiceover.ts` → ElevenLabs `POST /v1/text-to-speech/{voice}/with-timestamps`
   per scene → `public/audio/sceneN.mp3` + `manifest.json`
   `{scene, audioFile, durationSeconds, words:[{word,start,end}]}`.
3. `Video.tsx` reads manifest: `durationInFrames = round(durationSeconds*fps)`;
   total = sum. Captions render word-by-word from `words[]`.
4. **Hard-cap guard:** if summed duration > 178s, print per-scene breakdown and
   exit non-zero → trim copy before rendering.

Real captures fill each scene's manifest-derived duration by playing a segment of
the **continuous take** (referenced by timecode in `shots.ts`), trimmed and gently
time-scaled to the scene length, with Remotion zoom/pan toward the relevant beat
and caption/highlight overlays on top. Scenes flow *within* the footage rather
than hard-cutting between fragments — only transitions in/out of the synthetic
framing scenes (1, 2, 6) are cuts.

Format: 1920×1080, 30fps; defined once in `Root.tsx`.

## Storyboard (times are TARGETS; real scene length = measured VO)

Word budget ≈ 2.5 words/sec; total VO ≤ ~400 words (hard 180s cap).
**Rebalanced: twin discovery (scenes 3+4) ≈ 100s / ~55%; agent checkout ≈ 20s.**

| # | Scene | Type | Target | Content |
|---|-------|------|--------|---------|
| 1 | Hook | synth | ~16s | "May 19 — Google announces Universal Cart." → the gap it can't fill → TwinCart slam |
| 2 | The twin idea | synth | ~14s | One product → its twin: same job, different brand, **no shared barcode**; invisible to every cart |
| 3 | **How twins are found** *(hero)* | real + overlay | ~46s | Real search→cluster capture, **zoomed** to the matching: Tier 1 GTIN exact-match snap → Tier 2 Claude functional-parity verdict ("does the same job?") → Value Score = parity × savings × confidence |
| 4 | **Twin payoff + savings** *(hero)* | real | ~52s | Real clusters across 2–3 categories (robot vacuum 97%, massage gun 94%, LED 90%); price carousel clip, **SavingsCounter** ticks up, parity/compare view, Box savings report card |
| 5 | Agent checkout *(small feature)* | real video | ~20s | Brief: "found your twin? the agent adds it to cart and **stops at your approval — never auto-pays**." Short stepper clip → Awaiting approval. AP2 one-liner. |
| 6 | Google contrast + close | synth | ~22s | Split: Google (brand merchants, same SKU) ‖ TwinCart (cross-marketplace, different brand, the dupe economy); tagline + live URL |

## Components (each independently testable)

- **Caption** `{words, startFrame}` — word highlight from frame.
- **Highlight** `{box}` — animated callout ring/arrow over a capture region.
- **SavingsCounter** `{from,to}` — number ticks up (e.g. 0→97%).
- **KenBurns** `{src}` — slow zoom/pan wrapper for screenshots.
- **CaptureClip** `{src, from, to}` — `<OffthreadVideo>` trimmed to a range.
- **Logo** `{name}` / **RetailerStrip** — local SVGs.
- **SceneBg** `{src}` — Gemini background (framing scenes only).

## Assets

- **Captures:** `capture-app.ts` → `public/capture/` (screenshots + webm).
- **Logos:** real SVGs (simple-icons) for amazon, temu, shein, walmart, target,
  google → `public/logos/` (via Exa/web). No AI logos.
- **Backgrounds:** `gemini-3.1-flash-image-preview` → 2–3 abstract backgrounds
  for framing scenes only; committed as PNGs (no API dependency at build).

## Secrets

- `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID=4e32WqNVWRquDa1OcRYZ` → `.env`
  (gitignored) only. `GEMINI_API_KEY` already present. Scripts read from
  `process.env`; never committed. (User to rotate ElevenLabs key post-event.)

## Build Order (walking skeleton first — deadline protection)

1. **Skeleton:** scaffold `remotion/`, pin deps, one `<Composition>`, 6 placeholder
   scenes → `video:build` produces a complete ~180s MP4. *Prove a full render works.*
2. **Capture:** write + run `capture-app.ts` against local `pnpm dev`; verify
   `public/capture/` has the continuous `take1.webm` (twin journey) + short
   `take2.webm` (agent) and `shots.ts` timecodes. Watch each take end-to-end —
   it must look like one smooth human walkthrough, not a montage.
3. **Real VO + manifest:** `script.ts` → `gen-voiceover.ts`; wire manifest-driven
   durations + captions; confirm hard-cap guard passes (<178s).
4. **Twin scenes 3 + 4 first (the priority):** drop captures into the matching
   and savings scenes with KenBurns zoom + Highlight + SavingsCounter on real
   data. This is the heart of the video — get it right before anything else.
5. **Agent scene 5 (small) + synthetic framing 1,2,6 + polish:** brief stepper
   clip, Gemini backgrounds, logos, transitions, optional music slot.

Each step ends in a renderable MP4. If time runs out, the last step still ships.

## Verification

- After step 1: `out/twincart-demo.mp4` exists, plays, ~180s.
- After step 2: every logical shot in `shots.ts` resolves to a real file; clips
  show the carousel swap and the full stepper→approval sequence.
- After step 3: total VO < 178s (guard); captions track audio in Studio.
- Per scene: scrub in Remotion Studio — no overflow/overlap; captures fill cleanly.
- Final: full render plays ≤180s; every spoken claim matches Accuracy Constraints.

## Risks (mitigated)

- **Capture selectors fragile** → develop against running app; prefer role/text
  locators; add minimal `data-testid` only if forced.
- **`pnpm dev` startup race** → capture script waits for a ready selector (not a
  fixed sleep) before acting.
- **React 19 peer-deps** → pin Remotion version supporting React 19.
- **First render** downloads headless Chrome shell (one-time).
- **webm in Remotion** → use `<OffthreadVideo>`; if codec issues, transcode the
  webm to mp4 once in `video:capture`.
- **Hard 180s cap** → word budget + automated guard before render.
