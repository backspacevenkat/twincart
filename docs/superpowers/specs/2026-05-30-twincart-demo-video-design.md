# TwinCart — 3-Minute Hackathon Demo Video (Remotion)

**Date:** 2026-05-30
**Status:** Design — awaiting user review
**Owner:** venkat

## Goal

Produce a **3:00 (hard cap, ≤180s)** demo video for the hackathon that explains
TwinCart and lands two hero beats: (1) twin discovery + savings, flowing into
(2) a real AP2-signed agentic checkout that stops at human approval. The video
is **100% code-generated in Remotion** (no screen recording), narrated by an
**ElevenLabs** AI voice with synced captions, and re-renderable from one command.

## Non-Goals

- No screen recording / live-app capture (explicitly chosen: pure animation).
- No changes to the TwinCart app itself (the `remotion/` workspace is isolated).
- No AI-generated brand logos (trademark/fidelity risk) — real SVGs only.
- No claim of direct Google Universal Cart access (per `product_spec.md`: frame
  as "UCP-compatible / Google validates the direction").

## Accuracy Constraints (must hold in the VO script)

Grounded in the real implementation (README + `src/`), not aspirational spec:
- Name is **TwinCart** (not "DealTwin AI").
- Matching = **Tier 1 GTIN exact-match** + **Tier 2 Claude functional-parity**;
  ranking = **Value Score = parity × savings × confidence**.
- Match types shown: `EXACT_MATCH`, `FUNCTIONAL_TWIN`, `BUDGET_SUBSTITUTE`.
- Agent **adds to cart and stops at "Awaiting your approval" — never auto-pays**
  (AP2 boundary). 4 step labels exactly: Opening retailer → Locating product →
  Adding to cart → Awaiting your approval.
- Savings numbers come from real `live-clusters.json` (e.g. up to 38%).
- Retailers: Amazon, Temu, SHEIN, Walmart, Target.

## Architecture

Isolated Remotion workspace, decoupled from the Next static-export app.

```
remotion/
  package.json          # own deps; Remotion version pinned, React 19-compatible
  remotion.config.ts
  src/
    Root.tsx            # registers <Composition> (reads manifest for fps/length)
    Video.tsx           # top-level: maps scenes → <Sequence> using manifest
    scenes/
      S1_Hook.tsx
      S2_DupeEconomy.tsx
      S3_HowTwinsFound.tsx
      S4_TwinPayoff.tsx
      S5_AgentCheckout.tsx
      S6_GoogleContrast.tsx
    components/          # Caption, PriceSpectrum, ProductCard, AgentStepper, Logo
    data/
      manifest.json      # GENERATED: [{scene, audioFile, durationSeconds, words[]}]
      script.ts          # the VO text per scene (single source of truth)
      clusters.ts        # curated subset pulled from ../src/lib/live-clusters.json
  public/
    audio/               # GENERATED per-scene mp3s
    images/              # downloaded real product images (deterministic)
    logos/               # real SVGs (amazon, temu, shein, walmart, target, google)
    bg/                  # Gemini-generated abstract backgrounds
scripts/
  gen-voiceover.ts       # script.ts -> ElevenLabs with-timestamps -> mp3 + manifest
  fetch-assets.ts        # download curated product images + logos locally
  gen-backgrounds.ts     # Gemini 3.1 flash image -> public/bg/*.png
```

`package.json` (root) scripts:
- `video:vo` → `bun scripts/gen-voiceover.ts` (regenerates audio + manifest)
- `video:assets` → `bun scripts/fetch-assets.ts && bun scripts/gen-backgrounds.ts`
- `video:preview` → `cd remotion && npx remotion studio`
- `video:build` → `cd remotion && npx remotion render` → `out/twincart-demo.mp4`

### Data flow (the key design decision)

**Audio-manifest-driven layout** — measured audio duration dictates scene length,
never the reverse.

1. `script.ts` holds VO text per scene (the only place to edit copy).
2. `gen-voiceover.ts` calls ElevenLabs
   `POST /v1/text-to-speech/{voice}/with-timestamps` per scene → writes
   `public/audio/sceneN.mp3` and appends to `manifest.json`:
   `{ scene, audioFile, durationSeconds, words: [{word, start, end}] }`
   (duration + word timings derived from `character_end_times_seconds`).
3. `Video.tsx` reads `manifest.json` at build time: each scene's
   `durationInFrames = round(durationSeconds * fps)`; composition total =
   sum of scene durations. Captions render word-by-word from `words[]` against
   `useCurrentFrame()`.
4. **Hard-cap guard:** `gen-voiceover.ts` sums durations; if total > 178s it
   prints a per-scene breakdown and exits non-zero so copy is trimmed BEFORE
   rendering. (178s leaves headroom under the 180s hard cap.)

Format: 1920×1080, 30fps. fps/dimensions defined once in `Root.tsx`.

## Storyboard (6 scenes — times are TARGETS; real = measured VO)

Word budget ≈ 2.5 words/sec; total VO ≤ ~400 words to stay under 180s.

| # | Scene | Target | On screen | VO intent (final copy in script.ts) |
|---|-------|--------|-----------|--------------------------------------|
| 1 | Hook | ~18s | "May 19 — Google announces Universal Cart." → tension line → TwinCart logo slam | Setup + the gap Google can't fill |
| 2 | Dupe economy | ~18s | One product → its twin (same job, diff brand, no shared barcode); "invisible to every cart" | Name the problem |
| 3 | How twins are found | ~42s | Tier 1 GTIN snap (Amazon=Walmart=Target) → Tier 2 Claude parity verdict → Value Score formula; price-spectrum bar animates | The how-it-works |
| 4 | Twin payoff *(hero #1)* | ~34s | Real hero cluster; parity card; savings counter 0→38%; Box report stamps in | "Same job, different brand, proven savings" |
| 5 | Agent checkout *(hero #2)* | ~46s | 4-step AgentStepper; emphasis: did the work, STOPS at approval, never pays, AP2-signed | The differentiator + safety |
| 6 | Google contrast + close | ~22s | Split: Google (brand merchants, same SKU) ‖ TwinCart (cross-marketplace, diff brand); tagline + live URL | The punchline |

## Components (each independently testable)

- **Caption** — props `{words, startFrame}`; highlights current word from frame.
- **PriceSpectrum** — props `{offers[]}`; animated horizontal price bar with dots.
- **ProductCard** — props `{name, price, retailer, image, tag}`; spring-in.
- **AgentStepper** — props `{steps[], activeStep}`; 4 steps, last is the hard stop.
- **Logo** — props `{name}`; renders local SVG. **RetailerLogos** strip.
- **SceneBg** — props `{src}`; Gemini background with subtle Ken Burns drift.

## Assets

- **Product images:** `fetch-assets.ts` downloads a curated ~12-image subset
  (hero clusters only) to `public/images/`. Spot-checked 200-OK with browser UA.
  Skip-if-exists so it's idempotent and offline-safe after first run.
- **Logos:** real SVGs (simple-icons) for amazon, temu, shein, walmart, target,
  google → `public/logos/`. Sourced via Exa/web.
- **Backgrounds:** `gen-backgrounds.ts` uses `gemini-3.1-flash-image-preview`
  for 3–4 abstract scene backgrounds (hook, dupe-economy, close). Committed as
  PNGs so renders don't depend on the API at build time.

## Secrets

- `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID=4e32WqNVWRquDa1OcRYZ` added to
  `.env` (gitignored) only. `GEMINI_API_KEY` already present. **Never** committed;
  scripts read from `process.env`. (User to rotate the ElevenLabs key post-event
  since it was shared in chat.)

## Build Order (walking skeleton first — deadline protection)

1. **Skeleton:** scaffold `remotion/`, install pinned deps, one `<Composition>`
   with 6 placeholder scenes (colored cards + scene titles) → `video:build`
   produces a complete ~180s MP4. *Verify a full MP4 renders before any polish.*
2. **Real VO + manifest:** write `script.ts`, run `gen-voiceover.ts`, wire
   manifest-driven durations + captions. Confirm hard-cap guard passes.
3. **Real images + logos:** `fetch-assets.ts`; build ProductCard/PriceSpectrum
   scenes (3 & 4) on real data.
4. **Agent + contrast scenes:** AgentStepper (5), split-screen (6).
5. **Gemini backgrounds + polish:** backgrounds, transitions, music slot.

Each step ends in a renderable MP4. If time runs out, the last completed step
is still a deliverable.

## Testing / Verification

- After step 1: `out/twincart-demo.mp4` exists, plays, ~180s.
- After step 2: total VO < 178s (guard); captions track audio in `remotion studio`.
- Per scene: open in Remotion Studio, scrub timeline, confirm no overflow/overlap.
- Final: full render plays start-to-finish ≤180s; every spoken claim matches the
  Accuracy Constraints section.

## Open risks (mitigated)

- React 19 peer-deps → pin Remotion version known to support React 19.
- First render downloads headless Chrome shell (one-time, slow).
- Some CDN image URLs may expire → download locally up front; skip-if-exists.
- Hard 180s cap → word budget + automated guard before render.
