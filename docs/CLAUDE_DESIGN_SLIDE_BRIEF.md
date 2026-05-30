# TwinCart — Pitch Deck Briefing for Claude Design

## 1. How to use this doc

Paste this entire document into Claude.ai's **Design / slide-generation** feature and say:
*"Generate a polished 12–16 slide pitch deck for the hackathon project TwinCart using the facts, copy, and slide outline below. Match the design direction (green #16A34A accent, clean light UI, clean studio product photography)."*
Everything Claude Design needs is inline here — there is no repo to read.

---

## 2. One-paragraph summary

**TwinCart is the cross-marketplace twin-finder.** You search for any product and TwinCart finds the *same item or its cheaper functional "twin"* across Amazon, Walmart, Target, Temu, and SHEIN — then **proves** the equivalence with an attribute-by-attribute comparison, ranks results by a Value Score (not just lowest price), and prepares an agentic, standards-compliant checkout you approve. It is built on the same open commerce standards as Google's newly announced Universal Cart (**UCP** for discovery, **AP2** for signed payment mandates), but it covers the marketplaces Google's brand-merchant cart deliberately leaves out — Temu and SHEIN — making it complementary, not competitive. Live at **https://main.d2lad0772pqd8l.amplifyapp.com**.

**Headline:** *Find the twin. Pay the smart price.*
**Tagline:** *The cross-marketplace twin-finder.*

---

## 3. The problem

- The same product sells for wildly different prices across marketplaces — but **price-comparison tools only match identical SKUs** (same UPC/ASIN). They completely miss the cheaper *equivalent*: a different brand, no shared barcode, ~the same job for a fraction of the price.
- Shoppers know "there's probably a cheaper version on Temu or SHEIN," but **finding it and trusting it is manual, slow, and uncertain.** Is the $13 massage gun actually like the $130 one? Nobody can prove it in 5 seconds.
- Google's **Universal Cart** (announced at I/O, May 2026) standardized agentic checkout across *brand merchants* (Nike, Target, Walmart…) — but it does **not** reach the giant value marketplaces (Temu, SHEIN) where the real savings live.
- Result: billions in overspend on near-identical goods, and no trustworthy, standards-native way for an AI agent to shop the *whole* market on your behalf.

> **The sharp line:** *Comparison sites match barcodes. TwinCart matches the job-to-be-done — and proves it.*

---

## 4. The solution — what TwinCart does

1. **Finds twins, not just SKU matches.** A hybrid engine: a deterministic tier locks the *reference price* via UPC/GTIN/ASIN, and an LLM functional-parity tier finds the **star result** — cross-brand twins and budget substitutes that do the same job for far less.
2. **Proves the equivalence.** Every twin comes with an attribute matrix (✓/✕ across price, match type, and category-specific specs), "Why it's a twin" parity chips, and a transparent confidence score — so the savings are *defensible*, not a guess.
3. **Ranks by value, not by lowest sticker.** Results are ordered by **Value Score = Functional-Parity % × Price-Savings % × Confidence** — the smart pick, not just the cheapest or the most similar.
4. **Prepares a standards-native agentic checkout.** A real, verified browser agent (Browserbase + Stagehand) drives the actual retailer page — opens the product, adds to cart, and **stops at the human-approval step (never auto-pays)** — wrapped in **UCP discovery + AP2-signed payment mandates (ES256)**.
5. **Generates a shareable savings report.** Every comparison exports a real PDF savings report (with embedded product images) to Box via a real shared link.

---

## 5. Who it's for / use cases

- **Value-conscious shoppers** who suspect a cheaper equivalent exists but can't verify it fast.
- **Deal hunters & resellers** sourcing the lowest credible price across five marketplaces at once.
- **Agentic-commerce builders** who need a UCP/AP2-native discovery + checkout layer that already spans Temu/SHEIN.
- **Households doing a full basket** — TwinCart re-prices an entire cart, not one item (demo basket: **$996 on Amazon → $118 with TwinCart = $878 saved, 88%, 8.4× cheaper**).

---

## 6. How it works — end-to-end pipeline (turn into a flow diagram)

1. **Scrape** — 5 Apify actors pull real listings from Amazon, Walmart, Target, Temu, SHEIN (price, image, ratings, UPC/GTIN/ASIN where available).
2. **Normalize & store** — products land in AWS RDS Postgres (with `pgvector` + `pg_trgm`) and are indexed into Typesense on EC2 for fast value-ranked search at scale.
3. **Anchor** — for each product group, pick a credible *branded reference* (the premium item) as the price anchor; deterministic UPC/GTIN/ASIN matching confirms exact equivalents.
4. **Cluster & classify parity** — one batched LLM call per group classifies each candidate into `EXACT / NEAR_EXACT / FUNCTIONAL_TWIN / BUDGET_SUBSTITUTE / NOT_COMPARABLE` (round-robin across retailers so cheap Temu/SHEIN twins are never dropped).
5. **Score** — compute Value Score = Parity% × Savings% × Confidence; pick the triptych (Best Exact / Best Value / Best Budget).
6. **Generate attributes & verdict** — produce the comparison matrix, "why it's a twin" parity chips, and the human-readable verdict.
7. **Box savings report** — render the comparison to a real PDF (embedded product images) and upload to Box with an open shared link.
8. **Agentic checkout** — on approval, a Browserbase + Stagehand agent drives the retailer page to cart, wrapped in UCP discovery + an AP2-signed (ES256) payment mandate; stops at final human approval.

---

## 7. Sponsor tech integration (judging rewards this — keep crisp)

**AWS — the entire backbone**
- **RDS Postgres** with **pgvector** (semantic similarity) + **pg_trgm** (fuzzy text) — source of truth for ~5,468 real scraped products.
- **EC2** running **Typesense** — read-optimized search index ranked by Value Score (built for 10–20k+ listings).
- **S3** — product/asset storage.
- **Amplify** — hosts the live app (Next.js 16 static export).

**Box — trust & audit layer**
- Real **PDF savings reports** with embedded product images, generated per comparison and uploaded via the Box API.
- **Client Credentials Grant (CCG)** auth with auto-refresh (enterprise-scoped) — production-style, not a throwaway token.
- Real **shared links** open the formatted report (25 reports live: 21 data-driven + 4 curated hero flows).

**Apify — real cross-marketplace data**
- **5 retailer scrapers**: Amazon (ASIN + image + price), Walmart (UPC), Target (UPC → GTIN-14), Temu, SHEIN.
- Key insight baked in: Temu/SHEIN need *generic* search terms ("tumbler" not "thermo flask") — TwinCart maps queries accordingly.
- All five verified live; 5,468 products ingested across the marketplaces.

---

## 8. The product UI — slide-by-slide screen descriptions (for mockups)

**Home** — A rotating cinematic hero (clean studio product imagery) with the headline *"Find the twin. Pay the smart price."* and a prominent search bar. Below: a **"Browse every twin"** category grid of clickable product chips.

**Results ("Twins for …")** — Three layers:
- The **Twin Spectrum**: a horizontal price ladder showing every offer from premium → budget as nodes (click any node to swap it into your picks).
- The **Smart-Picks triptych**: three cards — **Best Exact / Best Value / Best Budget** — each with product image, retailer logo, parity %, price, and savings %.
- A **Cards / List** layout toggle.

**Compare / Twin page** — The proof:
- **Attribute matrix** ("How we arrived"): rows for Price, Match type, and category-specific specs with ✓/✕ across the compared offers.
- **"Why it's a twin" parity chips** summarizing the equivalence.
- **Price-history sparkline**.
- "View on {Retailer} →" deep links.

**Cart** — Line items with retailer logos and per-item % savings, plus the basket headline: *On Amazon $996 → With TwinCart $118 → save $878 (88%, 8.4×).*

**Checkout modal** — A multi-item **agentic checkout** stepper (Opening retailer → Locating product → Adding to cart → Awaiting your approval) showing the agent working, the **UPC** confirmation, and the **AP2-signed mandate** + UCP trust panel — stopping at final user approval (**never auto-pays**). The underlying agent engine (Browserbase + Stagehand) is real and verified; the in-app stepper presents it.

**Saved / Box report** — A savings report screen with **Open** (real Box shared link) and **Copy link** actions; the PDF embeds product images and the full comparison.

---

## 9. Differentiation / why it's innovative

- **Functional-twin equivalence, proven.** Not "same barcode" — same *job*, with a defensible attribute matrix and confidence score. This is the moat competitors (PriceGrabber, Google Shopping, Honey) structurally can't do.
- **Cross-marketplace, including the ones Google skips.** TwinCart spans Amazon/Walmart/Target **and** Temu/SHEIN — the value marketplaces Universal Cart leaves out.
- **Standards-native.** UCP-compatible discovery + AP2-signed checkout mandates (ES256) — the same rails Google's Universal Cart uses, so TwinCart is *complementary infrastructure*, not a walled garden.
- **Value Score, not lowest price.** Ranking by Parity × Savings × Confidence surfaces the *smart* buy, defending against junk-cheap mismatches.
- **Trust by construction.** Real Box PDF reports + AP2 mandates create an auditable savings + payment trail.

---

## 10. Traction / scale facts (all real)

- **5,468 real products** scraped into AWS RDS, fully indexed in Typesense (counts match exactly).
- **5 marketplaces live**: Amazon 2,588 · SHEIN 1,194 · Temu 950 · Walmart 401 · Target 335.
- **27 twin clusters · 412 cluster members** built in the database, all 5 match types present (EXACT / NEAR_EXACT / FUNCTIONAL_TWIN / BUDGET_SUBSTITUTE / NOT_COMPARABLE).
- **20 of 27 clusters show ≥60% savings**; 219 honest "NOT_COMPARABLE" rejections (the engine says no when it should).
- **24 live data-driven twin clusters** wired into the deployed UI with 100% real scraped product images, each with a smart-picks triptych (Best Exact / Best Value / Best Budget) and a price ladder of real offers.
- **25 real Box PDF savings reports** uploaded with working shared links.
- Live, deployed, HTTP 200: **https://main.d2lad0772pqd8l.amplifyapp.com** (Next.js 16 static export on AWS Amplify).

**Real twin examples (use as stat callouts):**
- **Robot vacuum:** Shark **$469 → $69** Temu (88%) → **$15** SHEIN (**97% off**), 7 sources across 5 retailers.
- **Sunscreen:** EltaMD **$61 → $5** Walmart (92%) / **$4** SHEIN (93%).
- **Minimalist wallet:** Ridge **$76 → $8** Temu (89%) / **$6** SHEIN.
- **Stanley-style tumbler:** **$45 → $17** (84% parity, 62% off).
- **Rain jacket:** **$89 → $17** (82% parity, 81% off).
- **Full basket:** **$996 → $118 = $878 saved (88%, 8.4×).**

---

## 11. The demo flow (live click path)

1. Open **https://main.d2lad0772pqd8l.amplifyapp.com** — show the rotating hero + category grid.
2. Click the **"robot vacuum"** chip (or search it) → Results page.
3. Point at the **Twin Spectrum** price ladder: Shark **$469** on the left → **$15** SHEIN on the right; show the **Best Exact / Best Value / Best Budget** triptych.
4. Click a spectrum node to **swap it into your picks** live.
5. Open the **Compare** page → walk the **attribute matrix** (✓/✕) and **"why it's a twin"** parity chips — *this is the proof beat.*
6. Open the **Box savings report** → real shared link opens the formatted PDF.
7. Add items → open **Cart**: *$996 → $118, save $878 (88%).*
8. Hit **Checkout** → show the agentic stepper with **UPC + AP2-signed mandate + UCP trust panel**, stopping at final approval.

---

## 12. Suggested slide outline (12–16 slides)

1. **Title** — "TwinCart — Find the twin. Pay the smart price." + tagline "The cross-marketplace twin-finder." + live URL.
2. **The Problem** — Comparison tools only match barcodes; the cheaper equivalent is invisible and untrusted.
3. **The Insight** — Match the job-to-be-done, not the SKU — and prove it.
4. **Meet TwinCart** — One search → same item or cheaper twin across 5 marketplaces, ranked by value.
5. **The Wedge vs Google Universal Cart** — Same standards (UCP+AP2), but covers Temu/SHEIN Google skips — complementary, not competitive.
6. **How It Works** — The end-to-end pipeline diagram (scrape → cluster → score → prove → report → checkout).
7. **Functional-Twin Engine** — 5 match types + Value Score = Parity × Savings × Confidence.
8. **Proof, Not Guesswork** — Attribute matrix + parity chips screenshot (the trust moat).
9. **The Product (UI tour)** — Hero, Twin Spectrum + triptych, Compare, Cart, Checkout screens.
10. **Agentic Checkout** — Browserbase + Stagehand, UCP discovery, AP2-signed ES256 mandate, human-approval gate.
11. **Sponsor Tech: AWS** — RDS+pgvector+pg_trgm, EC2 Typesense, S3, Amplify.
12. **Sponsor Tech: Box + Apify** — Real PDF savings reports (CCG) + 5 live retailer scrapers.
13. **Traction & Scale** — 5,468 products, 5 marketplaces, 27 clusters, headline savings (97% / 88%).
14. **Real Twin Examples** — Robot vacuum, sunscreen, wallet, full-basket stat callouts.
15. **Why It Wins** — Differentiation recap (functional twins, cross-marketplace, standards-native, value ranking, auditable trust).
16. **Closing / CTA** — "Find the twin. Pay the smart price." + live URL + demo invite.

---

## 13. Design direction

- **Accent color:** green **#16A34A** (the brand green — NOT teal). Use it for CTAs, savings badges, parity ✓ marks, and the logo mark.
- **UI vibe:** clean, bright, light background, generous whitespace, rounded cards, subtle shadows — a modern consumer commerce app (think Linear-clean meets a premium shopping app). Avoid dark, cluttered, "deal-site" aesthetics.
- **Typography:** clean geometric/grotesque sans (e.g. Inter-like); large confident headlines, calm body text, tabular numerals for prices.
- **Logo concept:** a **twin / ∞ motif** — two mirrored shapes or an infinity loop suggesting "two of the same," in green.
- **Imagery:** clean **studio product shots** on white/neutral backgrounds (the real scraped product images are this style). Use price ladders, ✓/✕ matrices, and before→after price arrows as recurring visual devices.
- **Tone:** confident, plain-spoken, trustworthy. Emphasize *proof* and *smart*, not hype.
- **Recurring visual devices:** the **Twin Spectrum** price ladder, the **before → after price arrow** ($469 → $15), the **Best Exact / Best Value / Best Budget** triptych, and the green **% saved** badge.

---

## 14. Verbatim copy bank

**Headlines / taglines**
- Find the twin. Pay the smart price.
- The cross-marketplace twin-finder.
- Comparison sites match barcodes. TwinCart matches the job — and proves it.
- Same job. A fraction of the price.
- The cheaper version, finally findable — and trustworthy.
- Google's cart covers brand stores. TwinCart covers everything else.
- Ranked by value, not by lowest sticker.

**Stat callouts**
- 97% off — robot vacuum: $469 → $15.
- $878 saved on one basket — $996 → $118 (8.4× cheaper).
- 5 marketplaces, one search.
- 5,468 real products. 27 twin clusters. All 5 match types.
- Value Score = Parity % × Savings % × Confidence.
- 219 honest "not a match" — the engine says no when it should.

**Trust / standards line**
- Built on open agentic-commerce standards: UCP discovery + AP2-signed checkout mandates (ES256). Your agent shops; you approve; it never auto-pays.

---

## 15. Assets available

- **AI-generated hero & category imagery** lives under `public/assets/hero/` in the repo (clean studio product shots — match this style).
- **Live app for real screenshots:** https://main.d2lad0772pqd8l.amplifyapp.com
  - Deep links: `#/s/<slug>` (search), `#/twin/<slug>` (product), `#/report/<slug>` (Box report), `#/cart` (basket).
- Real scraped product images render in-app via an image proxy — screenshot the Results, Compare, Cart, and Checkout screens directly for authentic mockups.
