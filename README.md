# TwinCart

**Find the same product — or its smartest cheaper *twin* — across Amazon, Temu, SHEIN, Walmart & Target.** TwinCart is a UCP-compatible shopping *Platform* that does what Google's Universal Cart structurally can't: find the different-brand product that shares no SKU but does ~the same job for a fraction of the price, prove the parity, and prepare a safe, AP2-signed agentic checkout.

> Complementary to Google's Universal Cart (announced I/O 2026-05-19): Google checks you out at brand merchants (Nike/Target/Walmart…); TwinCart is the independent cross-marketplace twin-discovery layer for the budget/dupe economy Google won't index.

## Stack
- **Next.js 16** (App Router, TS, Tailwind) — web app, deployed on AWS
- **Postgres (RDS)** + **pgvector** + **pg_trgm** — catalog, clusters, pre-computed twins
- **Apify** — product data for all 5 retailers (see `docs/apify-actors.md`)
- **Anthropic Claude** — offline normalization + functional-parity verdicts
- **UCP (`@ucp-js/sdk`) + AP2** — real, signed agentic checkout (interop vs `puddingheroes.com`)
- **Box** — savings reports + AP2 audit trail
- Script runner: **Bun**

## Matching (the core)
Hybrid, pre-computed offline (`src/pipeline/`):
- **Tier 1 — deterministic anchor:** shared **GTIN-14** (normalized UPC/EAN) → `EXACT_MATCH`. Spans Amazon+Walmart+Target on branded goods only.
- **Tier 2 — LLM functional-parity engine:** scores "does it do the same job?" cross-brand (no SKU needed) → `FUNCTIONAL_TWIN` / `BUDGET_SUBSTITUTE`, writes the verdict. Temu/SHEIN are Tier-2 only.
- **Value Score = parity × savings × confidence** ranks *Best Value* / *Best Budget* (not lowest price).

## Setup
```bash
pnpm install
cp .env.example .env          # fill creds (see .env.example)
curl -so db/rds-global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
psql "$DATABASE_URL" -f db/schema.sql
pnpm ingest                   # DRY RUN (prints plan). Real scrape: INGEST_CONFIRM=1 pnpm ingest  (costs Apify credit)
pnpm dev
```

Spec & design brief: `docs/superpowers/specs/2026-05-29-twincart-design.md`.
