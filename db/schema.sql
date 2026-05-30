-- TwinCart schema (spec §5). Idempotent.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS products (
  id                     BIGSERIAL PRIMARY KEY,
  retailer               TEXT NOT NULL,            -- amazon|temu|shein|walmart|target
  external_id            TEXT,                     -- ASIN/TCIN/goods_id (retailer-LOCAL only)
  gtin14                 TEXT,                      -- normalized cross-retailer key (NULL for Temu/SHEIN)
  upc                    TEXT,
  asin                   TEXT,
  title                  TEXT NOT NULL,
  normalized_title       TEXT,
  brand                  TEXT,
  category               TEXT,
  normalized_attrs       JSONB,                     -- LLM-normalized {category,model,capacity,material,features[],...}
  embedding              vector(1536),              -- optional pgvector (OpenAI text-embedding-3-small)
  price                  NUMERIC,
  original_price         NUMERIC,
  currency               TEXT DEFAULT 'USD',
  image_url              TEXT,
  product_url            TEXT,
  rating                 NUMERIC,
  review_count           INT,
  availability           TEXT,
  shipping_estimate_days INT,
  return_policy_summary  TEXT,
  raw_json               JSONB,
  last_seen_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE (retailer, external_id)
);
CREATE INDEX IF NOT EXISTS idx_products_gtin14     ON products (gtin14) WHERE gtin14 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products USING gin (normalized_title gin_trgm_ops);

CREATE TABLE IF NOT EXISTS product_clusters (
  id              BIGSERIAL PRIMARY KEY,
  query           TEXT,
  canonical_name  TEXT,
  category        TEXT,
  hero_product_id BIGINT REFERENCES products(id),
  best_exact_id   BIGINT REFERENCES products(id),
  best_value_id   BIGINT REFERENCES products(id),
  best_budget_id  BIGINT REFERENCES products(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cluster_members (
  cluster_id        BIGINT REFERENCES product_clusters(id) ON DELETE CASCADE,
  product_id        BIGINT REFERENCES products(id),
  match_type        TEXT,    -- EXACT_MATCH|NEAR_EXACT|FUNCTIONAL_TWIN|BUDGET_SUBSTITUTE|NOT_COMPARABLE
  functional_parity INT,     -- 0-100 ("does it do the same job?")
  price_savings_pct NUMERIC, -- vs the exact-match anchor
  value_score       NUMERIC, -- parity × savings × confidence → ranks Best Value/Budget
  reason            TEXT,
  caveats           TEXT,
  PRIMARY KEY (cluster_id, product_id)
);

CREATE TABLE IF NOT EXISTS price_snapshots (
  product_id   BIGINT REFERENCES products(id),
  price        NUMERIC,
  availability TEXT,
  captured_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id               TEXT PRIMARY KEY,
  cluster_id       BIGINT REFERENCES product_clusters(id),
  ucp_session_json JSONB,
  ap2_mandate_jwt  TEXT,
  status           TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_reports (
  id              BIGSERIAL PRIMARY KEY,
  query           TEXT,
  cluster_id      BIGINT REFERENCES product_clusters(id),
  box_file_id     TEXT,
  box_shared_link TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
