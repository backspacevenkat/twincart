# TwinCart — Design Spec

**Date:** 2026-05-29
**Status:** Draft for review
**Author:** Venkat + Claude
**Build target:** Hackathon demo, ready in ~8 hours (relaxed from 6 to ace all beats), judged on overall product impressiveness ("best product").

---

## 1. One-liner & the wedge

**TwinCart finds the same product — or its smartest cheaper twin — across Temu, SHEIN, Amazon, Walmart & Target, explains *why* two products are equivalent, and prepares a safe, UCP-compliant agentic checkout with user approval.**

### Why this is complementary to Google (the requirement you set)

Google announced **Universal Cart** at I/O on **2026-05-19** (10 days before this spec), built on two open standards it co-created with Shopify:

- **UCP — Universal Commerce Protocol** (`ucp.dev`, latest spec `2026-04-08`, Apache-2.0). Defines two roles: a **Platform** (the agent/app that *consumes* commerce) and a **Business** (the merchant that *exposes* it). Capabilities: `catalog.search`, `catalog.lookup`, `cart`, `checkout`, `identity_linking` (OAuth2), `order`, `fulfillment`, `discount`. Discovery via a `/.well-known/ucp` profile. Transports: REST, MCP, A2A.
- **AP2 — Agent Payments Protocol** (`ap2-protocol.org`). Tamper-proof, cryptographically signed **mandates** (SD-JWT): a **Checkout Mandate** (allowed merchant, line items) chained to a **Payment Mandate** (spend cap, allowed instrument). Gives a verifiable audit trail for human-present and human-not-present purchases.

**Universal Cart's announced merchants are mainstream brands** — Nike, Sephora, Target, Ulta, Walmart, Wayfair, Fenty, Steve Madden. It explicitly does **not** index **Temu or SHEIN**.

> **TwinCart is a UCP-compatible *Platform* that does the one thing a brand-anchored cart structurally can't: answer *"is the $12 Temu tumbler actually the same product as the $45 Stanley?"* across the budget/dupe marketplaces Google won't touch — then hand a UCP-conformant, AP2-signed cart to whatever checks you out.**

We are not competing with Universal Cart. We are the **cross-marketplace discovery + twin-equivalence layer that feeds carts like Google's.** That framing is the spine of the demo and the pitch.

---

## 2. What we are (and are NOT) demonstrating

We are **not** building an internet-scale marketplace. We demonstrate that the full experience is technically real on a **curated but convincing** product universe.

| We ARE demonstrating | We are NOT claiming |
|---|---|
| Real listings for all 5 retailers via Apify (Amazon, Temu, SHEIN, Walmart, Target) | Unrestricted production rights to scrape every merchant |
| Real UCP `/.well-known/ucp` Platform profile + checkout | Live access to Google Universal Cart, or that Walmart/Target listings come via UCP (verified 404 — see §7.3) |
| Real AP2-style signed mandate (Checkout + Payment) | That we are a payment processor / merchant of record |
| Real Box report export with a shareable link | That every retailer exposes a live UCP endpoint today |
| Cross-brand **functional-twin** detection (not just exact SKUs) — "same job, much cheaper" + parity/savings explanations | That parity scores are production-validated |

**Curated scope:** ~15–20 search experiences (the demo touches 3), ~3,000–6,000 real listings seeded into the DB. Architecture designed to scale toward 1M SKUs, but we do not ingest that for the demo.

---

## 3. The three sponsor integrations (load-bearing — "these 3")

Judging is "best product," but all three sponsor techs must be used **meaningfully and visibly**, not as hidden plumbing.

### 3.1 Apify — the data layer (real, all 5 retailers)
- **Confirmed live actors (keyword search, Node SDK `client.actor(id).call(input)`):**
  - Amazon — `automation-lab/amazon-scraper` (~$0.002–0.004/product, 10 marketplaces) → gives **ASIN**.
  - Temu — `sovereigntaylor/temu-product-scraper` (~$0.004/product, residential proxy) or `crw/temu-products-scraper` (~$10/1k).
  - SHEIN — keyword actor → price/discount/images/ratings/stock.
  - Walmart — `burbn/walmart-product-search` or `silentflow/walmart-scraper` (50+ fields, zip pricing).
  - Target — `makework36/target-scraper` (RedSky API, fast, no login, **returns UPC barcodes**) or `kawsar/target-product-search-scraper`.
- **Why UPC/ASIN matters:** Target+Walmart expose **UPC/GTIN**, Amazon exposes **ASIN** → these power the deterministic Tier-1 exact-match (see §6), no ML needed for true SKU matches.
- **Ingestion runs OFFLINE before the demo.** ~100 products × ~18 curated queries × 5 retailers ≈ 9,000 products ≈ **$30–45 total**. Output normalized → seeded into Postgres.
- **One small, pre-tested LIVE Apify run** is wired into an "Ingest" admin button for the *"this data is real"* beat — with a **cached fallback** if anti-bot blocks it mid-demo (Temu/Walmart need residential proxies; never let a live block kill the demo).

### 3.2 Box — the trust/reporting layer (real, visible)
- On "Save Savings Report," generate a **TwinCart Savings Report** (HTML→PDF + JSON sidecar: exact match, twins, price comparison, AI verdict, AP2 mandate audit snapshot, timestamp) → upload via `box-node-sdk` → create a **shared link** (`updateFileById`) → surface the link in the UI.
- Box also stores the **checkout audit trail** (the AP2 mandate + agent steps) — this is the tangible "verifiable paper trail" that mirrors AP2's intent.
- **Auth:** Developer Token (60-min expiry — ideal for a demo) or Client Credentials Grant. **Do NOT** use the JWT-app path (admin approval burns time).

### 3.3 AWS — the platform (host everything here)
- **Frontend:** Next.js on **AWS Amplify Hosting** (or S3 + CloudFront).
- **Backend/API:** Next.js API routes / Fastify on **Lambda** or **App Runner** (simplest for a 6h build).
- **DB:** **RDS Postgres** (or Supabase if speed wins — but spec defaults to AWS-native RDS to honor "use AWS mostly").
- **Search:** Postgres full-text + trigram for the demo (Typesense on EC2 is the documented upgrade path but is **not** on the critical path).
- **Secrets:** AWS Secrets Manager. **Object cache:** S3 (product images / Apify raw JSON). **Logs:** CloudWatch.

---

## 4. Architecture

```
            Next.js Web App (desktop + mobile)  ── design from claude.ai/design
                          │
                          ▼
        TwinCart API (AWS Lambda / App Runner)
                          │
   ┌──────────────────────┼───────────────────────────────┐
   ▼                      ▼                                ▼
 Search /            Twin-Matching &                 CommerceAdapter
 Product            AI Explanation                   (UCP Platform role)
 Intelligence        Engine                                │
   │                      │              ┌─────────────────┼─────────────────┐
   ▼                      ▼              ▼                 ▼                 ▼
 Postgres (RDS)     LLM (Bedrock or   UCP Checkout    Apify Adapters   Browser-Agent
 +pgvector/FTS      Claude API,       (@ucp-js/sdk)   (Amazon/Temu/    (Playwright,
                    OFFLINE batch)    + AP2 mandate    SHEIN/Walmart/   built LAST)
                                            │           Target)
                                            │
                                       Box (reports + audit) ── S3, Secrets Mgr, CloudWatch
```

### The CommerceAdapter abstraction (the key design idea)
A single internal interface that lets us speak UCP where it exists and fall back gracefully where it doesn't:

```ts
interface CommerceAdapter {
  searchCatalog(query): Promise<Product[]>;
  getProduct(productId): Promise<ProductDetail>;
  createCheckoutSession(items): Promise<CheckoutSession>; // UCP shape
  buildMandate(session, guardrails): Promise<AP2Mandate>; // AP2 shape
  handoffToMerchant(sessionId): Promise<HandoffUrl>;
}
```

Implementations:
- `UcpCheckoutAdapter` — **real** UCP checkout via `@ucp-js/sdk`; targets our own conformant merchant **and** the live external `puddingheroes.com` UCP sandbox to prove interop.
- `ApifyCatalogAdapter` (Amazon / Temu / SHEIN / Walmart / Target) — data ingestion + catalog search.
- `MockUcpMerchantAdapter` (Walmart / Target) — wraps scraped data in a **UCP-shaped checkout session, honestly labeled** "UCP-compatible (mock merchant)" since these have no public UCP endpoint (§7.3).
- `MerchantDeepLinkAdapter` — opens the merchant product/cart page.
- `BrowserAgentAdapter` — Playwright local agent, stops at final approval (in scope at 8h, **built last**).

Each unit has one purpose, a typed interface, and is independently testable — so subagents can build them in parallel and the browser-agent can be deferred without touching the spine.

---

## 5. Data model (Postgres / RDS)

```
products(id, retailer, external_id, title, normalized_title, brand, category,
         upc, gtin, asin,                 -- deterministic exact-match keys (Tier 1, §6)
         normalized_attrs jsonb,          -- LLM-normalized {category,model,capacity,material,features[],...}
         embedding vector,                -- optional pgvector for candidate grouping / tiebreak
         price, currency, image_url, product_url, rating, review_count,
         availability, shipping_estimate_days, return_policy_summary,
         raw_json, last_seen_at)

product_clusters(id, query, canonical_name, category, hero_product_id,
                 best_exact_id, best_value_id, best_budget_id, created_at)

cluster_members(cluster_id, product_id, match_type,
                functional_parity,   -- 0–100, the "does it do the same job?" score (§6 Tier 2)
                price_savings_pct,   -- vs the exact-match anchor price
                value_score,         -- FunctionalParity × Savings × confidence → ranks Best Value/Budget
                reason, caveats)

price_snapshots(product_id, price, availability, captured_at)

checkout_sessions(id, cluster_id, ucp_session_json, ap2_mandate_jwt, status, created_at)

user_reports(id, query, cluster_id, box_file_id, box_shared_link, created_at)
```

Twin clusters + AI explanations are **pre-computed offline** and stored, so the demo reads deterministic rows. Live LLM is optional polish for the explanation panel, not a dependency.

---

## 6. AI twin-matching spec — Hybrid (deterministic + LLM), pre-computed offline

**Match types:** `EXACT_MATCH` · `NEAR_EXACT` (size/color/bundle differs) · `FUNCTIONAL_TWIN` (different brand, no shared SKU, same job) · `BUDGET_SUBSTITUTE` (much cheaper, acceptable tradeoffs) · `NOT_COMPARABLE`.

> **The star of the product is the FUNCTIONAL_TWIN / BUDGET_SUBSTITUTE — not the exact SKU.** Exact-match is the *anchor* (it pins the honest reference price of the real branded thing). The value, the wow, and the entire reason we beat both Google's brand-cart and dumb price-comparison is finding the **different-brand product that shares no UPC but does ~the same job for a fraction of the price** — and *proving* the parity. Build and rank around this.

The matching layers two complementary engines:

**Tier 1 — deterministic exact-match (the anchor, no ML).** Normalize every barcode to **GTIN-14** (UPC-12 / EAN-13 left-padded with zeros) and match on that. **GTIN-14 is the only cross-retailer key, and it spans Amazon+Walmart+Target on *branded* goods only.** `ASIN` (Amazon), `TCIN` (Target), `goods_id` (Temu/SHEIN) are retailer-*local* (dedup/refetch only — never cross-retailer match keys). **Temu & SHEIN carry no barcodes → they never Tier-1 match; they route straight to Tier 2.** A shared GTIN-14 → `EXACT_MATCH` at confidence 1.0, giving the *true price of the genuine branded article* to measure savings against. This is the floor, not the point. (See `docs/apify-actors.md` for the per-retailer identifier matrix.)

**Tier 2 — LLM functional-parity engine (the product, offline).** This is where the differentiation lives. It does NOT depend on shared identifiers — it reasons about *function*:
- **Normalization:** messy title → `normalized_attrs = {category, core_function, key_specs{capacity,power,size,…}, material, features[], use_case[], pack_count, condition, shipping_days, return_risk}`.
- **Functional-parity scoring:** for every cross-brand / cross-retailer candidate pair, score *"does this do the same job?"* independent of brand/SKU:
  `35% core-function & use-case · 30% key-spec parity (capacity/power/size/material) · 20% feature overlap · 10% quality/review confidence · 5% category`.
  → yields a **Functional Parity %** (e.g. *"91% functional parity, different brand, no shared UPC"*).
- **Classification + caveats:** `FUNCTIONAL_TWIN` vs `BUDGET_SUBSTITUTE` (the latter = high parity but real tradeoffs: durability uncertainty, long shipping, weaker returns, fake-discount risk) vs `NOT_COMPARABLE` (looks similar, materially different — the AirPods-vs-generic-earbuds "honest no").
- **Verdict:** one-paragraph "why this is a smart twin and what you give up." **This prose is the emotional payload.**

**Value Score (what powers "Best Value" & "Best Budget"):** `Value = FunctionalParity% × PriceSavings% × confidence`. A 91%-parity twin at 47% off outranks a 99%-parity twin at 5% off. **This score, not raw similarity, is the hero ranking metric** — it surfaces "close enough + much cheaper" exactly the way a smart shopper thinks. We render *which* attributes matched so every score is defensible, not a black box. Optional pgvector cosine as a candidate prefilter + tiebreaker.

**Worked example (no shared SKU, the hero case):**
> Query *"thermo flask."* Anchor (Tier 1): **Stanley Quencher H2.0 40oz — Amazon $45** (ASIN-pinned, the genuine article). Functional twin (Tier 2): **ThermoFlask 40oz — Walmart $24** — different brand, *no shared UPC*, but 91% functional parity (same 40oz, same stainless double-wall insulation, handle, straw lid, car-cup fit) → **Value Score wins → "Best Value", Save $21 (47%).** Budget substitute: **Generic 40oz tumbler — Temu $12** — 72% parity, flagged caveats (15-day shipping, unverified seller) → "Best Budget."

**Compute model:** Tier 1 + Tier 2 run **OFFLINE in batch** over the seeded products; clusters + parity scores + verdicts are stored. The demo reads deterministic rows (instant, no live-LLM dependency). **Optional graceful live path:** novel judge query → run Tier 1+2 live behind a spinner.

**LLM provider:** offline batch → **Claude (Anthropic API)** by default for quality/simplicity; **AWS Bedrock (Claude)** is the all-AWS option if we want the sponsor story to be 100% AWS. Either works since it's offline; decision deferred to build time (see open question).

---

## 7. UCP + AP2 agentic checkout — THE CENTERPIECE

This is what makes us provably "in Google's world." Build order: this is **Phase 2**, the spine.

### 7.1 We act as a UCP **Platform** and stand up a UCP **Business** profile
- Serve `/.well-known/ucp` (our Business discovery profile via `@ucp-js/sdk`, **pinned exact version** per supply-chain policy).
- Implement `dev.ucp.shopping.checkout` lifecycle: `incomplete → ready_for_complete → completed`.
- Send the `UCP-Agent` header (our Platform profile) on outbound requests.
- **Interop proof:** run a real checkout against the live external sandbox `puddingheroes.com` (`GET /.well-known/ucp.json`, `POST /api/ucp/checkout` with `payment_token: "sandbox_test"`) → *"TwinCart just checked out against a real third-party UCP merchant."*

### 7.2 We emit a real AP2-style signed mandate
- **Checkout Mandate** (SD-JWT, `vct: mandate.checkout.1`) with constraints: `checkout.allowed_merchants`, `checkout.line_items`.
- **Payment Mandate** (`vct: mandate.payment.1`) with `payment.amount_range` (spend cap), `payment.allowed_payees`, `payment.reference` chaining it to the checkout.
- Signed with an ES256 key we generate at boot. The mandate JSON is shown in the UI ("your guardrails") and stored in Box as the audit trail.
- **Guardrails surfaced to the user:** brand, specific product, max spend, "requires final approval = true." Final payment is **never** auto-clicked in the POC.

### 7.3 The honest UCP boundary (Walmart/Target are NOT reachable via Google's protocol)
Empirically verified 2026-05-29: `walmart.com/.well-known/ucp` → **404**, `target.com/.well-known/ucp` → **404**. They expose **no public UCP endpoint**. Google's announced Walmart/Target support is *checkout inside Google's own surfaces* (gated behind Google), and Universal Cart is a consumer product, **not** a third-party listings/checkout API we can call. UCP/AP2 standardize *how* an agent talks to a merchant that opted in — they do not grant access to merchants who haven't.

**Therefore:**
- **All 5 retailers' listings → Apify scraping** (not UCP).
- **Real UCP checkout** is demonstrated against (a) our own conformant merchant and (b) the live `puddingheroes.com` sandbox (verified up).
- Walmart/Target get a **`MockUcpMerchantAdapter`** that produces a UCP-shaped checkout session from scraped data, **clearly labeled "UCP-compatible (mock merchant)"** in the UI. No faked live endpoints — bulletproof to technical judges.

---

## 8. Browser-agent checkout (in scope at 8h — built LAST)

Playwright agent that, for ONE retailer: opens the merchant page → verifies the product → adds to cart → stops at *"Ready for your confirmation."* Never clicks final pay.

**Risk-managed:** built last so it can't block the spine; pre-recorded-but-real fallback video/screens captured during build so a live failure on stage degrades to the recording, not to nothing. If earlier phases overrun, this is still the first thing cut.

---

## 9. Frontend & screens (for claude.ai/design)

Responsive web app (desktop + mobile), improving concretely on `Earlier_Bad_UI.html` (a static "ShopSmart" mockup: product card, image gallery, price grid, retailer badges, purchase modal with progress steps — no framework, no data, no backend).

**Screens:**
1. **Search home** — query bar, curated query chips, the wedge tagline.
2. **Results / cluster grid** — each card: canonical name, hero image, **Best Exact / Best Value / Best Budget** prices, max savings, similarity %, retailer badges, Compare · Buy · Save Report.
3. **Cluster detail / Compare** — attribute table (price, similarity, capacity, material, shipping, risk) + AI verdict.
4. **Agent checkout modal** — guardrails (brand/product/spend cap), UCP session status lifecycle, AP2 mandate preview, progress steps, "Ready for your approval."
5. **Saved report confirmation** — Box shared link.

**Concrete upgrades over the old mockup:** real data; cross-retailer twin cards (not single-product); AI verdict prose; a UCP/AP2 trust panel (entirely absent before); desktop layout; Box export.

---

## 10. AWS deployment plan

| Layer | Service |
|---|---|
| Frontend | Amplify Hosting (or S3 + CloudFront) |
| API | Lambda (API routes) or App Runner |
| DB | RDS Postgres |
| Search | Postgres FTS/trigram (Typesense-on-EC2 = documented upgrade, off critical path) |
| Object store | S3 (images, Apify raw JSON) |
| Secrets | Secrets Manager (Apify token, Box token, signing key) |
| Logs | CloudWatch |

---

## 11. Demo script (zero live-fragile dependencies on the critical path)

**Demo 1 — "thermo flask" (the hero flow):**
Search → cluster card shows Stanley $45 (Amazon, exact) · ThermoFlask $24 (Walmart, 91% twin, save $21) · Temu generic $12 (72% budget twin, save $33) → open Compare → AI verdict → **"Prepare checkout"** → UCP session goes `ready_for_complete`, AP2 mandate renders with guardrails → **(interop beat)** same flow runs against `puddingheroes.com` → **"Save Savings Report"** → Box shared link appears.

**Demo 2 — "summer dress":** SHEIN-dominant results + Temu alternatives + Amazon faster-shipping → category/visual filtering.

**Demo 3 — "airpods":** Amazon exact + renewed option + Pixel Buds alternative + budget earbuds → **"not truly comparable"** warning (shows the model has taste, not just price-matching).

**Bonus beats:** live Apify "Ingest" button (cached fallback) → *"the data is real, scraped live"*; Playwright browser-agent (recorded fallback) → *"the agent actually drives the merchant site."*

---

## 12. Phased build plan (the ~8h budget)

Ordered so the **reliable spine** is demoable even if later phases are cut. Phases 1–3 parallelize across subagents (typed adapter interfaces make this clean). Apify ingest (Phase 1a) runs **separately/offline** and is not on the live clock.

| Phase | Deliverable | Est. | Cut-risk |
|---|---|---|---|
| **0. Scaffold** | Next.js + API + RDS (pgvector) schema + seed loader + AWS skeleton + Secrets Manager | 0.75h | none |
| **1a. Offline ingest** (pre-build) | Apify run for 5 retailers × ~18 queries → raw JSON to S3 | — (offline) | none |
| **1b. Data + twins** | Tier-1 (UPC/ASIN) exact-match + Tier-2 LLM normalize/classify/verdict (batch) → clusters seeded | 1.5h | none |
| **2. UCP + AP2 (CENTERPIECE)** | `/.well-known/ucp`, checkout lifecycle, signed Checkout+Payment mandate, **live puddingheroes interop**, MockUcpMerchant for Walmart/Target | 2.0h | none |
| **3. Box export** | Savings report (PDF+JSON) → upload → shared link → AP2 audit trail | 0.5h | none |
| **4. Frontend polish** | Wire claude.ai/design output to the 5 screens; responsive desktop+mobile | 2.0h | trim depth |
| **5. Live Apify button** | One pre-tested live run + cached fallback ("data is real" beat) | 0.5h | drop |
| **6. Browser-agent** | Playwright, one retailer, stops at approval, recorded fallback | 1.0h | **drop first** |

**Critical spine = Phases 0–4** (~6.75h) → a complete, impressive, technically-real demo. Phases 5–6 (~1.5h) are upside that the 8h budget now comfortably affords.

---

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Temu/Walmart anti-bot blocks live scrape on stage | Ingest offline; live button has cached fallback; use residential proxies |
| Target RedSky / actor schema drift | RedSky is Target's own backend (stable); pin actor versions; data is seeded offline anyway |
| Browser-agent flakes live | Built last; pre-recorded-real fallback; first to cut |
| `@ucp-js/sdk` is brand-new | Pin exact version (supply-chain policy); have the official `Universal-Commerce-Protocol/samples` Hono server + `emmanuelhashy/implementation` as reference if the SDK fights us |
| Box JWT-app approval delay | Use Developer Token / Client Credentials only |
| Design file arrives late | Spec sequences all backend/UCP/Box/Apify work independent of final visuals; build against a plain UI until the design lands |
| AWS setup eats time | App Runner + RDS is the fast path; EC2/Typesense explicitly deferred |

---

## 14. What to claim vs avoid (pitch discipline)

**Claim:** *"TwinCart is a UCP-compatible, AP2-signing, Apify-powered, AWS-hosted shopping Platform. It normalizes products across retailers, identifies exact and functional twins across marketplaces Google's Universal Cart won't touch, compares true total price, and produces a safe, verifiable agentic checkout with user-controlled guardrails — interoperating with real UCP merchants."*

**Avoid:** *"We plug directly into Google Universal Cart for every retailer today."*

**Better framing:** *"Google's Universal Cart validates the direction and owns the brand checkout. TwinCart is the independent, UCP-conformant discovery-and-twin layer for the long tail — the budget marketplaces and dupe economy — feeding standards-compliant carts to whoever completes the sale."*

---

## Open decisions resolved
- "These 3" = **AWS + Box + Apify** ✓
- Checkout depth = **Full UCP + real AP2 mandate** (+ puddingheroes interop) ✓
- Demo surface = **Web app (desktop+mobile) + browser-agent (in scope, built last)** ✓
- Judging = **Best product** → weight to narrative + design polish, keep all 3 sponsors deep ✓
- Matching = **Hybrid: Tier-1 deterministic (UPC/GTIN/ASIN) + Tier-2 LLM normalize/classify/verdict, pre-computed offline** ✓
- Retailers = **5 (Amazon, Temu, SHEIN, Walmart, Target), all via Apify** ✓
- Walmart/Target via Google's protocol = **No (verified 404); scrape listings, speak real UCP checkout via own merchant + puddingheroes; Walmart/Target = labeled mock-UCP merchant** ✓
- Time budget = **~8h** ✓

## Open decisions remaining (not blocking design)
- **LLM provider for offline batch:** Claude API (default) vs AWS Bedrock-Claude (all-AWS sponsor story). Either fine — offline.
- **AWS creds:** to be supplied by Venkat before Phase 0.

---

# Appendix A — Design Brief (paste into claude.ai/design)

> **How to use this:** This brief is self-contained. It gives claude.ai/design the product, the personality, a concrete visual system, the five screens with real sample data, and explicit "don't do this" guardrails. Generate a cohesive design system + the five screens, desktop-first but responsive to mobile. Where this brief gives a hex value or font, treat it as a strong default you may refine — but keep the *personality* intact.

## A.1 Product in one line
**TwinCart** finds the same product — or its smartest cheaper *twin* — across Amazon, Temu, SHEIN, Walmart & Target, explains *why* two products are equivalent, shows the real savings, and prepares a safe, verifiable agent checkout. Think *"a sharp financial-grade comparison tool that's actually fun to shop with."*

**Who it's for:** smart, time-poor online shoppers who suspect the $45 brand-name thing has a $14 twin — and want proof before they buy.

## A.2 Brand personality
Five adjectives: **confident · clarifying · trustworthy · a little playful · editorial.**
The feeling: opening TwinCart should feel like having a brilliant friend who already did the homework and lays it out so cleanly you smile. Fintech rigor (Ramp, Mercury, Linear-level polish) meets shopping delight. Never cute-for-cute's-sake; the delight comes from *clarity and the "aha" of a great deal.*

## A.3 Anti-patterns — explicitly avoid the "generic AI app" look
- ❌ The default purple/indigo→violet SaaS gradient. ❌ Glassmorphism everywhere. ❌ A wall of identical rounded cards with drop shadows. ❌ Emoji as primary iconography. ❌ Generic stock "3D blob" hero art. ❌ Centered hero with one input and nothing else. ❌ Inter/Roboto at one weight for everything.
- ✅ Instead: strong editorial typography with real hierarchy; confident use of one distinctive accent; high-contrast, data-dense-but-breathable layouts; a *signature* comparison component that becomes the brand's visual hook; tasteful, purposeful motion.

## A.4 Color system
A warm-paper light theme with an ink base, one electric brand accent, plus semantic money/trust hues. (Also provide a dark variant.)

| Role | Hex | Use |
|---|---|---|
| **Ink** (base text / near-black) | `#14151A` | Headlines, primary text, dark surfaces |
| **Paper** (canvas) | `#F6F4EF` | Warm off-white background (NOT pure white) |
| **Surface** | `#FFFFFF` | Cards, panels on paper |
| **Brand accent — "Twin Teal"** | `#0FB5A8` | Primary actions, the twin-link motif, focus |
| **Brand accent deep** | `#0A7A72` | Hover/pressed, headings accent |
| **Savings green** | `#1FA85B` | Savings pills, "you save $X", positive deltas |
| **Caution amber** | `#E8A13A` | Budget-twin risk, slow shipping, "verify" |
| **Risk/Not-comparable** | `#D5573B` | NOT_COMPARABLE warnings, hard stops |
| **Trust ink-blue** | `#2B59C3` | UCP/AP2 verified panel, signed-mandate motif |
| **Muted** | `#6B6B73` | Secondary text, captions |
| **Hairline** | `#E6E2D8` | Borders, dividers |

Similarity is a gradient from amber (low) → teal (high), used in the similarity meter. Each retailer keeps a small brand-colored badge but does NOT dominate the card.

## A.5 Typography
- **Display / headlines:** a confident editorial sans or grotesk with character — e.g. **Clash Display, General Sans, or Söhne** (avoid plain Inter for headlines). Big, tight tracking, weight 600–700.
- **Body / UI:** a clean neutral — **Inter or Geist** — 400/500, generous line-height.
- **Numerals / prices:** **tabular figures**, slightly heavier; prices are first-class citizens — large, ink-colored, with the savings delta in savings-green beside them.
- Establish a real type scale (e.g. 48/32/24/18/16/14/12) and USE the extremes — don't flatten everything to 16px.

## A.6 Layout & grid
- Desktop-first, 12-col, max content width ~1200–1280px, generous gutters. Mobile collapses to a single column with the comparison component becoming horizontally swipeable.
- Breathing room over density, but prices/savings are allowed to be bold and large. Left-aligned editorial headers, not centered marketing hero.

## A.7 Signature components (these carry the brand)
1. **The Twin Triptych** (the hero component): three linked panels — **Best Exact · Best Value · Best Budget** — visually "connected" by a thin Twin-Teal link/seam (the twin motif). Each panel: retailer badge, product thumb, big tabular price, similarity meter, 1-line takeaway, savings pill. The middle "Best Value" panel is subtly elevated (it's the recommendation).
2. **Functional-parity meter:** a horizontal segmented bar + a number (e.g. `91% functional twin`), colored amber→teal by parity. The label leans on *function*, not "similarity" — `91% twin · different brand · no shared SKU`. Tappable → reveals which attributes matched (same capacity, insulation, straw lid…). **"Best Value" is chosen by Value Score (parity × savings), NOT lowest price** — make that visible (a small "Best Value" ribbon on the winning panel, not just the cheapest).
3. **Savings pill:** rounded, savings-green, `Save $21 (47%)`, tabular figures.
4. **Retailer badge:** small, brand-tinted chip (Amazon, Temu, SHEIN, Walmart, Target) — present but never louder than the price.
5. **UCP/AP2 Trust Panel:** the differentiator. A "verifiable receipt / digital passport" aesthetic — trust-ink-blue, a verified-check/seal, monospace snippet of the signed mandate, guardrail chips (`Brand: Stanley` · `Max $25` · `Final approval required`). Should feel cryptographically *official*, like a boarding pass or a signed cert — NOT a generic modal.
6. **Agent Checkout Stepper:** a live, animated vertical stepper — *Opening merchant → Verifying product → Checking price → Adding to cart → Ready for your approval* — each step lights up in sequence; the final step is a confident CTA, never auto-submitting.
7. **AI Verdict block:** a short, quotable paragraph set in display-ish type with a subtle left rule — the "smart friend" voice. This is the emotional payload; give it room.

## A.8 The five screens (with real sample content)

**Screen 1 — Search Home.** Left-aligned editorial header: *"Find the twin. Pay the smart price."* A prominent but un-gimmicky search bar. Below it, curated query chips: `thermo flask · AirPods · robot vacuum · summer dress · office chair · electric toothbrush`. A quiet one-line trust strap: *"UCP-compatible · AP2-signed checkout · 5 retailers."* Optional: a single live "twin of the day" triptych as proof.

**Screen 2 — Results / Cluster Grid.** Query: **"thermo flask."** A results header with filters (retailer, price, delivery, match type). Then a vertical stack of **Twin Triptych** cards, one per product cluster. Lead card content (use verbatim):
- Cluster title: **"Stanley 40oz Quencher & Smart Twins"**
- **Best Exact:** Stanley Quencher H2.0 40oz — **Amazon $45** — `100% · exact` — 2-day delivery
- **Best Value:** ThermoFlask 40oz — **Walmart $24** — `91% twin` — **Save $21 (47%)** — 3–5 days
- **Best Budget:** Generic 40oz Tumbler — **Temu $12** — `72% twin` — **Save $33 (73%)** — amber "7–15 days · verify seller"
- Card actions: **Compare · Prepare checkout · Save report**

**Screen 3 — Cluster Detail / Compare.** Big product header + the Twin Triptych expanded into a comparison **table**: rows = Price, Similarity, Capacity, Material, Shipping, Return risk; columns = Exact / Value / Budget. Below the table, the **AI Verdict block** (use verbatim): *"Buy the Stanley if the brand and 2-day delivery matter. The ThermoFlask is the smart pick — identical 40oz steel insulation, handle and straw lid, 91% twin, for $21 less. Skip the Temu option unless price is everything: 15-day shipping and weaker return reliability."* Sidebar: retailer badges, price-history sparkline (P1), watchlist toggle.

**Screen 4 — Agent Checkout (modal/sheet).** Header: *"TwinCart Agent — ThermoFlask 40oz, Walmart."* The **UCP/AP2 Trust Panel** with guardrail chips (`Brand: ThermoFlask` · `Max $25` · `Final approval required`) and a monospace signed-mandate snippet labeled *"AP2 Checkout Mandate · ES256 signed."* Then the **Agent Checkout Stepper** animating through its steps, ending on a calm, confident **"Approve & complete"** CTA (with a note: *we never auto-pay*). A small "Verified against a live UCP merchant (puddingheroes.com)" trust line.

**Screen 5 — Saved Report Confirmation.** A tidy success state: *"Your Thermo Flask Savings Report is saved to Box."* Show a document/receipt visual, the included contents (twins, price comparison, AI verdict, signed mandate audit), and a **shareable Box link** with a copy button. Quiet, satisfying, "you've got the receipt" energy.

## A.9 Motion & microinteractions
Purposeful, quick (150–250ms), eased. The Twin-Teal "seam" between triptych panels can draw-in on load (the twin connecting). Similarity meter fills on reveal. The checkout stepper is the one place for a slightly longer, deliberate sequence — it should feel like the agent is genuinely *working*. No gratuitous parallax or confetti.

## A.10 Accessibility & responsive
WCAG AA contrast (the warm paper + ink base helps). Don't encode meaning in color alone — similarity always shows the number, risk always shows a label. Tabular figures for all prices. On mobile, the triptych becomes a horizontal swipe carousel with the "Best Value" panel pre-centered; the trust panel and stepper stack vertically full-width.

## A.11 One-paragraph prompt seed (if a single prompt is needed)
*"Design TwinCart, a smart cross-retailer shopping comparison app. Personality: confident, clarifying, trustworthy, lightly playful, editorial — fintech-grade polish (Ramp/Linear) that's fun to shop with. Warm off-white paper (#F6F4EF) with ink near-black text, a single electric 'Twin Teal' accent (#0FB5A8), savings-green (#1FA85B), and a trust ink-blue (#2B59C3) for a verifiable-checkout panel. Editorial display type with real hierarchy, tabular figures for prices. The signature component is a 'Twin Triptych': three linked panels — Best Exact / Best Value / Best Budget — connected by a teal seam, each with a retailer badge, big price, similarity meter, and savings pill. Avoid generic AI aesthetics: no purple SaaS gradients, no glassmorphism, no emoji icons, no centered one-input hero. Design five screens: search home, results grid of triptych cards, a compare detail with an AI verdict block, an agent-checkout modal with a 'digital passport' UCP/AP2 trust panel and an animated checkout stepper, and a saved-report confirmation with a Box share link."*
