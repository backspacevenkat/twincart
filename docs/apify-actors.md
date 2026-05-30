# TwinCart — Finalized Apify Actors

Researched 2026-05-29. All actors are keyword-search, Node-SDK callable (`client.actor("<id>").call(input)` → `client.dataset(run.defaultDatasetId).listItems()`). **Pre-scrape offline and cache; never run cold on stage.** Cap `maxItems`/`maxResults` to control cost.

## Chosen actor per retailer

| Retailer | Actor ID | ~Cost (1,800 prod) | Identifier | Notes |
|---|---|---|---|---|
| Amazon | `automation-lab/amazon-scraper` | ~$7.20 | ASIN (+GTIN on detail) | Most-used, residential proxy, `listPrice`+`currency` |
| Walmart | `silentflow/walmart-scraper` | ~$20 (sub) | **UPC/gtin13** (needs `includeDetails:true`) | Fallback `burbn/walmart-product-search` ($5/1k, no UPC) |
| Target | `makework36/target-scraper` | ~$9 | **UPC** (needs `fetchProductDetails:true`) + TCIN | RedSky API; `currency` not emitted → set "USD" |
| Temu | `crw/temu-products-scraper` | ~$7-10 | none | Budget twin; **prices in CENTS** (÷100); verified working |
| SHEIN | `scraper-engine/shein-search-products-scraper` | ~$9-11 | none | Image URLs protocol-relative (prefix `https:`); price nested `salePrice.usdAmount`; product_url derived from `goods_id` |

**Total pre-scrape budget: ~$30–45** for 5 retailers × ~18 queries × ~100 products.

## Input JSON (per actor, one keyword ~100 products)

```jsonc
// Amazon
{ "searchQueries": ["thermo flask"], "marketplace": "US", "maxItems": 100,
  "proxyConfiguration": { "useApifyProxy": true, "apifyProxyGroups": ["RESIDENTIAL"] } }

// Walmart (includeDetails=true REQUIRED for UPC; ~10x slower)
{ "search": "robot vacuum", "zipCode": "10001", "sort": "best_match", "maxItems": 100,
  "includeDetails": true, "includeReviews": false,
  "proxy": { "useApifyProxy": true, "apifyProxyGroups": ["RESIDENTIAL"] } }

// Target (fetchProductDetails=true REQUIRED for UPC; ~12x slower)
{ "searchQueries": ["coffee maker"], "maxProducts": 100, "fetchProductDetails": true, "storeId": "3991" }

// Temu — crw actor. Use GENERIC terms ("tumbler" not "thermo flask"). Prices in CENTS.
{ "keyword": "tumbler", "region": "US", "max_items": 100, "sort": "relevance" }

// SHEIN
{ "query": ["summer dress"], "countryCode": "us", "orderBy": "recommend",
  "maxItems": 100, "perPage": 100, "proxyConfiguration": { "useApifyProxy": true } }
```

## Output → TwinCart field mapping (key fields)

| TwinCart | Amazon | Walmart | Target | Temu | SHEIN |
|---|---|---|---|---|---|
| title | `name` | `name` | `title` | `title` | `goods_name` |
| price | `price` | `price` | `price`/`salePrice` | `price` | `salePrice.usdAmount` |
| original_price | `listPrice` | `wasPrice` | `regularPrice` | `originalPrice` | `retailPrice.usdAmount` |
| currency | `currency` | `currency` | *"USD"* | `currency` | USD (from object) |
| image_url | `thumbnail` | `imageUrl` | `imageUrl` | `images[0]` | `https:`+`goods_img` |
| product_url | `url` | `url` | `url` | `url` | derive from `goods_id` |
| rating | `rating` | `averageRating` | `rating` | `rating` | weak/optional |
| review_count | `reviewCount` | `numberOfReviews` | `reviewCount` | `reviews` | weak/optional |
| brand | `brand` | `brand` | `brand` | `store`/`brand` | null (first-party) |
| identifier | `asin` (+`gtin`) | `upc`/`gtin13` | `upc`+`tcin` | — | — |

## Identifier matrix → exact-match strategy (IMPORTANT)

| Retailer | Native id | Global barcode (UPC/GTIN/EAN) |
|---|---|---|
| Amazon | ASIN | UPC/GTIN (partial, detail actors) |
| Walmart | item id | UPC/GTIN (yes) |
| Target | TCIN | UPC (yes) |
| Temu | goods_id | **none** |
| SHEIN | goods_sn | **none** |

**Rule:** **GTIN-14 (UPC/EAN left-padded to 14 digits) is the ONLY deterministic cross-retailer key**, and it spans **Amazon+Walmart+Target on branded goods only**. `ASIN`/`TCIN`/`goods_id` are retailer-LOCAL (dedup/refetch only — never cross-retailer match keys). **Temu & SHEIN have no barcodes → fuzzy/Tier-2 match only.**

- Tier-1 EXACT_MATCH = shared normalized GTIN-14.
- Normalize at ingest: `UPC-12 / EAN-13 → left-pad zeros → GTIN-14`.
- Amazon detail records carry both ASIN *and* GTIN → GTIN is the bridge into the Walmart/Target cluster.
- Optional backfill: ASIN→GTIN converter actors exist but cost extra + partial coverage; prefer GTIN where the primary scraper already provides it, else fall through to Tier-2.
