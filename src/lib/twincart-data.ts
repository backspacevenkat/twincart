// TwinCart product data — aggregated clusters across 5 retailers (ported from the design prototype).
/* eslint-disable @typescript-eslint/no-explicit-any */
import LIVE_CLUSTERS from './live-clusters.json';
import CURATED_BOX_REPORTS from './curated-box-reports.json';

export const RETAILERS: Record<string, { name: string; color: string; logo: string }> = {
  amazon:  { name: 'Amazon',  color: 'var(--retailer-amazon)',  logo: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=64' },
  temu:    { name: 'Temu',    color: 'var(--retailer-temu)',    logo: 'https://www.google.com/s2/favicons?domain=temu.com&sz=64' },
  shein:   { name: 'SHEIN',   color: 'var(--retailer-shein)',   logo: 'https://www.google.com/s2/favicons?domain=shein.com&sz=64' },
  walmart: { name: 'Walmart', color: 'var(--retailer-walmart)', logo: 'https://www.google.com/s2/favicons?domain=walmart.com&sz=64' },
  target:  { name: 'Target',  color: 'var(--retailer-target)',  logo: 'https://www.google.com/s2/favicons?domain=target.com&sz=64' },
};

export const GALLERY: Record<string, string[]> = {
  flask: ['/assets/flask-16021434.jpg', '/assets/flask-15562287.jpg', '/assets/flask-16257084.jpg'],
  buds:  ['/assets/buds-16062205.jpg', '/assets/buds-15906582.jpg', '/assets/buds-15725695.jpg', '/assets/buds-16002940.jpg'],
  dress: ['/assets/dress-15728040.jpg', '/assets/dress-14967476.jpg', '/assets/dress-15153720.jpg'],
};
export const IMG: Record<string, string> = { flask: GALLERY.flask[0], buds: GALLERY.buds[0], dress: GALLERY.dress[0] };
export const TINTS: string[] = ['', 'saturate(1.12) brightness(1.04)', 'brightness(0.95) saturate(1.05)',
  'brightness(1.06) contrast(1.04)', 'saturate(0.9) brightness(0.98)',
  'saturate(1.08) contrast(1.03)', 'brightness(1.03) saturate(0.95)'];

export const CLUSTERS: any[] = []; // simulated demo clusters removed — only real scraped twins now

// Curated hero flows stay FIRST (bulletproof demo beats), then real scraped clusters add depth.
const CURATED_CLUSTERS = CLUSTERS;
const liveQueries: string[] = [...new Set((LIVE_CLUSTERS as any[]).map((c) => c.query))];
// Merge: curated clusters first, then live clusters whose query isn't already curated.
const curatedQueries = new Set(CURATED_CLUSTERS.map((c: any) => c.query));
// Attach real Box shared links to curated clusters (live clusters already carry boxReport).
CURATED_CLUSTERS.forEach((c: any) => { const u = (CURATED_BOX_REPORTS as any)[c.id]; if (u) c.boxReport = u; });
(LIVE_CLUSTERS as any[]).forEach((c) => CLUSTERS.push(c));

// Every searchable category is a real scraped cluster — all of them surface as home chips.
export const QUERIES = liveQueries.slice();
export const CHIPS = liveQueries.slice();

// ─── Smart Basket (the demo's money shot) ───
// 12 functional twins TwinCart assembled. Amazon ≈ $996, TwinCart ≈ $120 (~88% off).
// Prices grounded in real scraped twins (e.g. 40oz tumbler $50 → Temu $8 we actually pulled).
export const DEMO_BASKET: any[] = [
  { icon: 'flask', name: '40oz Insulated Steel Tumbler', twinName: 'Generic 40oz Tumbler, Handle + Straw', retailer: 'temu',    amazon: 50,  price: 8,  parity: 88, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'buds',  name: 'ANC Wireless Earbuds (USB-C)',  twinName: 'TWS ANC Earbuds, USB-C Case',       retailer: 'temu',    amazon: 99,  price: 9,  parity: 82, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'dress', name: 'Floral Smocked Midi Dress',     twinName: 'Floral Tiered Smock Midi',          retailer: 'shein',   amazon: 58,  price: 11, parity: 88, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: 'LED Vanity Mirror w/ Lights',   twinName: 'Hollywood LED Makeup Mirror',       retailer: 'temu',    amazon: 120, price: 11, parity: 85, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: 'Sonic Electric Toothbrush',     twinName: 'Sonic Toothbrush + 8 Heads',        retailer: 'temu',    amazon: 100, price: 11, parity: 84, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: 'Cool-Mist Humidifier 4L',       twinName: 'Ultrasonic Cool-Mist Humidifier',   retailer: 'temu',    amazon: 60,  price: 9,  parity: 86, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: '65W GaN USB-C Charger',         twinName: '65W GaN 3-Port Charger',            retailer: 'temu',    amazon: 50,  price: 7,  parity: 89, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: 'Smart Fitness Watch',           twinName: 'AMOLED Smart Fitness Watch',        retailer: 'temu',    amazon: 189, price: 16, parity: 76, matchType: 'BUDGET SUBSTITUTE' },
  { icon: 'dress', name: 'Crossbody Shoulder Bag',        twinName: 'PU Leather Crossbody Bag',          retailer: 'shein',   amazon: 90,  price: 10, parity: 84, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: 'Memory Foam Pillows (2-pack)',  twinName: 'Cooling Memory Foam Pillow 2pk',    retailer: 'walmart', amazon: 70,  price: 10, parity: 86, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: '15-pc Kitchen Knife Set',       twinName: 'Stainless 15pc Knife Block Set',    retailer: 'walmart', amazon: 110, price: 12, parity: 83, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: 'Resistance Bands Home Gym',     twinName: '11pc Resistance Band Set',          retailer: 'temu',    amazon: 50,  price: 6,  parity: 85, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: 'MagSafe Phone Case',            twinName: 'Magnetic Clear Phone Case',         retailer: 'temu',    amazon: 25,  price: 4,  parity: 87, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'dress', name: 'Dainty Layered Necklace Set',   twinName: '14k-look Layered Necklace Set',     retailer: 'shein',   amazon: 45,  price: 6,  parity: 82, matchType: 'FUNCTIONAL TWIN' },
];
