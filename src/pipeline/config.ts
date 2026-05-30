import type { IngestedProduct, Retailer } from '@/lib/types';
import { toGtin14 } from './gtin';

// The curated search universe the demo runs on. Pre-scraped offline.
export const CURATED_QUERIES = [
  // Diverse across drinkware, audio, home, kitchen, beauty, fashion, electronics, fitness, accessories
  'thermo flask', 'stanley tumbler', 'airpods', 'wireless earbuds', 'robot vacuum',
  'office chair', 'led mirror', 'summer dress', 'kids shoes', 'iphone charger',
  'humidifier', 'electric toothbrush', 'espresso machine', 'smartwatch', 'air fryer',
  'crossbody bag', 'memory foam pillow', 'kitchen knife set', 'resistance bands', 'phone case',
  'necklace', 'yoga mat', 'desk lamp', 'sunglasses', 'backpack', 'wireless charger',
  // wave 2 — more breadth to scale the catalog
  'hair dryer', 'bluetooth speaker', 'gaming mouse', 'mechanical keyboard', 'water bottle',
  'leggings', 'hoodie', 'sneakers', 'sandals', 'baseball cap', 'travel pillow', 'laptop sleeve',
  'standing desk', 'ring light', 'power bank', 'phone tripod', 'coffee grinder', 'cast iron skillet',
];

const num = (v: unknown): number | null => {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : null;
};
const str = (v: unknown): string | null => (v == null ? null : String(v));

// Temu/SHEIN match GENERIC product terms far better than brand-specific queries
// (verified: "thermo flask" → 0 results, "tumbler" → rich twins). Map the canonical
// query to a generic term for those two budget-twin marketplaces.
const GENERIC_TERM: Record<string, string> = {
  'thermo flask': 'tumbler',
  'stanley tumbler': 'tumbler',
  'airpods': 'wireless earbuds',
  'iphone charger': 'usb c charger',
  'led mirror': 'vanity mirror',
  'smartwatch': 'smart watch',
  'espresso machine': 'espresso maker',
  'kids shoes': 'kids sneakers',
  'kitchen knife set': 'knife set',
  'wireless charger': 'wireless charger pad',
  'mechanical keyboard': 'gaming keyboard',
  'cast iron skillet': 'cast iron pan',
  'bluetooth speaker': 'portable speaker',
};
const genericTerm = (q: string): string => GENERIC_TERM[q] ?? q;

type RawItem = Record<string, unknown>;

interface ActorConfig {
  actorId: string;
  buildInput: (query: string, maxItems: number) => Record<string, unknown>;
  map: (item: RawItem, query: string) => IngestedProduct;
}

const RESIDENTIAL = { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] };

// Per-retailer actor + input + output mapping. Mappings per docs/apify-actors.md.
export const RETAILER_ACTORS: Record<Retailer, ActorConfig> = {
  amazon: {
    actorId: 'automation-lab/amazon-scraper',
    buildInput: (q, maxItems) => ({ searchQueries: [q], marketplace: 'US', maxItems, proxyConfiguration: RESIDENTIAL }),
    map: (i, q) => {
      const asin = str(i.asin);
      return {
        retailer: 'amazon', external_id: asin, asin, upc: str(i.gtin), gtin14: toGtin14(str(i.gtin)),
        title: str(i.name) ?? '', brand: str(i.brand),
        price: num(i.price), original_price: num(i.listPrice), currency: str(i.currency) ?? 'USD',
        image_url: str(i.thumbnail) ?? str((i.images as string[] | undefined)?.[0]) ?? null,
        product_url: str(i.url), rating: num(i.rating), review_count: num(i.reviewCount),
        raw_json: { ...i, _query: q },
      };
    },
  },
  walmart: {
    // burbn = pay-per-result, NO actor rental (silentflow required a paid rental → 0 rows). ~40 items/page.
    // burbn = pay-per-result, no rental, WORKS on our plan (junipr's PerimeterX needs paid Apify plan).
    // ~19-50 items/q; fields: title/price/listPrice/rating/reviewCount/seller/url/image/productId (no UPC).
    actorId: 'burbn/walmart-product-search',
    buildInput: (q, maxItems) => ({ query: q, domain: 'us', sort_by: 'best_match', page: 1, maxPages: Math.max(1, Math.ceil(maxItems / 50)), proxyConfiguration: RESIDENTIAL }),
    map: (i, q) => ({
      retailer: 'walmart', external_id: str(i.productId) ?? str(i.id), asin: null, upc: null, gtin14: null,
      title: str(i.title) ?? '', brand: str(i.seller),
      price: num(i.price), original_price: num(i.listPrice), currency: 'USD',
      image_url: str(i.image), product_url: str(i.url),
      rating: num(i.rating), review_count: num(i.reviewCount),
      raw_json: { ...i, _query: q },
    }),
  },
  target: {
    actorId: 'makework36/target-scraper',
    buildInput: (q, maxItems) => ({ searchQueries: [q], maxProducts: maxItems, fetchProductDetails: true, storeId: '3991' }),
    map: (i, q) => {
      const upc = str(i.upc);
      return {
        retailer: 'target', external_id: str(i.tcin), asin: null, upc, gtin14: toGtin14(upc),
        title: str(i.title) ?? '', brand: str(i.brand),
        price: num(i.salePrice) ?? num(i.price), original_price: num(i.regularPrice), currency: 'USD',
        image_url: str(i.imageUrl) ?? str((i.alternateImages as string[] | undefined)?.[0]),
        product_url: str(i.url), rating: num(i.rating), review_count: num(i.reviewCount),
        raw_json: { ...i, _query: q },
      };
    },
  },
  temu: {
    // crw actor is reliable + cleanly structured. NOTE: prices come in CENTS.
    actorId: 'crw/temu-products-scraper',
    // sort by top_sales → best-selling = best budget twins, so fewer items needed (cheaper).
    buildInput: (q, maxItems) => ({ keyword: genericTerm(q), region: 'US', max_items: maxItems, sort: 'top_sales' }),
    map: (i, q) => ({
      retailer: 'temu', external_id: str(i.goods_id), asin: null, upc: null, gtin14: null,
      title: str(i.title) ?? '', brand: null,
      price: i.price != null ? Number(i.price) / 100 : null,            // cents → dollars
      original_price: i.market_price ? Number(i.market_price) / 100 : null,
      currency: str(i.currency) ?? 'USD',
      image_url: str(i.image_url) ?? str(i.thumb_url), product_url: str(i.link_url),
      rating: num(i.rating), review_count: num(i.review_count),
      raw_json: { ...i, _query: q },
    }),
  },
  shein: {
    actorId: 'scraper-engine/shein-search-products-scraper',
    buildInput: (q, maxItems) => ({ query: [genericTerm(q)], countryCode: 'us', orderBy: 'recommend', maxItems, perPage: '100', proxyConfiguration: { useApifyProxy: true } }),
    map: (i, q) => {
      const sale = (i.salePrice as RawItem) ?? {};
      const retail = (i.retailPrice as RawItem) ?? {};
      const goodsId = str(i.goods_id);
      const img = str(i.goods_img);
      return {
        retailer: 'shein', external_id: goodsId, asin: null, upc: null, gtin14: null,
        title: str(i.goods_name) ?? '', brand: null,
        price: num(sale.usdAmount), original_price: num(retail.usdAmount), currency: 'USD',
        image_url: img ? (img.startsWith('//') ? `https:${img}` : img) : null,
        product_url: goodsId ? `https://www.shein.com/-p-${goodsId}.html` : null,
        rating: null, review_count: null,
        raw_json: { ...i, _query: q },
      };
    },
  },
};
