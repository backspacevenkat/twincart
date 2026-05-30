// TwinCart product data — aggregated clusters across 5 retailers (ported from the design prototype).
/* eslint-disable @typescript-eslint/no-explicit-any */

export const RETAILERS: Record<string, { name: string; color: string }> = {
  amazon:  { name: 'Amazon',  color: 'var(--retailer-amazon)' },
  temu:    { name: 'Temu',    color: 'var(--retailer-temu)' },
  shein:   { name: 'SHEIN',   color: 'var(--retailer-shein)' },
  walmart: { name: 'Walmart', color: 'var(--retailer-walmart)' },
  target:  { name: 'Target',  color: 'var(--retailer-target)' },
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

export const CLUSTERS: any[] = [
  {
    id: 'stanley-40oz', query: 'thermo flask', icon: 'flask',
    title: 'Stanley 40oz Quencher & Smart Twins', category: 'Insulated tumbler',
    lead: true, maxSavingsPct: 73, votes: 324, trending: 'Trending',
    review: { text: 'Identical to my Stanley for half the price — same insulation, same straw lid. Nobody can tell.', author: 'Verified Walmart buyer' },
    matchedAttrs: ['40oz capacity', 'Double-wall vacuum steel', 'Carry handle', 'Straw + flip lid', 'Fits a car cup holder'],
    products: {
      exact:  { slot: 'Best Exact',  retailer: 'amazon',  name: 'Stanley Quencher H2.0 FlowState 40oz', price: 45, parity: 100, matchType: 'EXACT MATCH',      anchorKey: 'ASIN B0CRMZHDG8',            tint: TINTS[0], shipping: '2-day delivery', shippingTone: 'good', rating: 4.8, reviews: 48210, stock: 'In stock',      take: 'The genuine article — pins the honest reference price.' },
      value:  { slot: 'Best Value',  retailer: 'walmart', name: 'ThermoFlask 40oz Stainless Tumbler',   price: 24, parity: 91,  matchType: 'FUNCTIONAL TWIN',  anchorKey: 'Different brand · no shared UPC', tint: TINTS[2], savingsAmt: 21, savingsPct: 47, shipping: '3–5 days', shippingTone: 'ok',   rating: 4.6, reviews: 9120, stock: 'In stock',  take: 'Same job, same build, $21 less — wins on Value Score.' },
      budget: { slot: 'Best Budget', retailer: 'temu',    name: 'Generic 40oz Insulated Tumbler',       price: 12, parity: 72,  matchType: 'BUDGET SUBSTITUTE', anchorKey: 'No shared identifier',        tint: TINTS[3], savingsAmt: 33, savingsPct: 73, shipping: '7–15 days · verify seller', shippingTone: 'warn', rating: 4.1, reviews: 2640, stock: 'Ships from CN', take: 'Cheapest by far — accept slow shipping & thinner returns.' },
    },
    offers: [
      { retailer: 'amazon',  name: 'Stanley Quencher H2.0 40oz',    price: 45, parity: 100, matchType: 'EXACT MATCH',      shipping: '2-day',        shippingTone: 'good', rating: 4.8, reviews: 48210, tint: TINTS[0], stock: 'In stock',      tag: 'exact' },
      { retailer: 'walmart', name: 'ThermoFlask 40oz Tumbler',      price: 24, parity: 91,  matchType: 'FUNCTIONAL TWIN',  savingsAmt: 21, savingsPct: 47, shipping: '3–5 days',     shippingTone: 'ok',   rating: 4.6, reviews: 9120,  tint: TINTS[2], stock: 'In stock',      tag: 'value' },
      { retailer: 'target',  name: 'Simple Modern Trek 40oz',       price: 22, parity: 89,  matchType: 'FUNCTIONAL TWIN',  savingsAmt: 23, savingsPct: 51, shipping: 'Pickup today',  shippingTone: 'good', rating: 4.7, reviews: 14300, tint: TINTS[1], stock: 'In stock' },
      { retailer: 'amazon',  name: 'IRON °FLASK 40oz Tumbler',      price: 26, parity: 86,  matchType: 'FUNCTIONAL TWIN',  savingsAmt: 19, savingsPct: 42, shipping: '2-day',        shippingTone: 'good', rating: 4.5, reviews: 22100, tint: TINTS[5], stock: 'In stock' },
      { retailer: 'walmart', name: 'Hydrapeak Roadster 40oz',       price: 19, parity: 84,  matchType: 'FUNCTIONAL TWIN',  savingsAmt: 26, savingsPct: 58, shipping: '3–5 days',     shippingTone: 'ok',   rating: 4.4, reviews: 6800,  tint: TINTS[6], stock: 'Low stock' },
      { retailer: 'temu',    name: 'Generic 40oz Insulated Tumbler',price: 12, parity: 72,  matchType: 'BUDGET SUBSTITUTE', savingsAmt: 33, savingsPct: 73, shipping: '7–15 days',    shippingTone: 'warn', rating: 4.1, reviews: 2640,  tint: TINTS[3], stock: 'Ships from CN', tag: 'budget' },
    ],
    verdict: 'Buy the Stanley if the brand and 2-day delivery matter. The ThermoFlask is the smart pick — identical 40oz steel insulation, handle and straw lid, 91% twin, for $21 less. Skip the Temu option unless price is everything: 15-day shipping and weaker return reliability.',
    compareRows: [
      { label: 'Price',       exact: '$45', value: '$24', budget: '$12', kind: 'price' },
      { label: 'Parity',      exact: '100% exact', value: '91% twin', budget: '72% twin', kind: 'parity' },
      { label: 'Capacity',    exact: '40 oz', value: '40 oz', budget: '40 oz', match: [true, true, true] },
      { label: 'Material',    exact: '18/8 steel, vacuum', value: '18/8 steel, vacuum', budget: 'Single-batch steel', match: [true, true, false] },
      { label: 'Lid',         exact: 'Straw + flip', value: 'Straw + flip', budget: 'Straw only', match: [true, true, false] },
      { label: 'Shipping',    exact: '2 days', value: '3–5 days', budget: '7–15 days', tone: ['good','ok','warn'] },
      { label: 'Return risk', exact: 'Low', value: 'Low', budget: 'Elevated', tone: ['good','good','warn'] },
    ],
  },
  {
    id: 'owala-32oz', query: 'thermo flask', icon: 'flask',
    title: 'Owala FreeSip 32oz & Twins', category: 'Insulated water bottle',
    maxSavingsPct: 64, votes: 142, trending: 'Rising',
    review: { text: 'The Target Embark lid is basically the FreeSip. Grabbed it on pickup, saved a bundle.', author: 'Verified Target buyer' },
    matchedAttrs: ['32oz capacity', 'Double-wall vacuum steel', 'Push-button lid', 'Built-in straw'],
    products: {
      exact:  { slot: 'Best Exact',  retailer: 'amazon', name: 'Owala FreeSip 32oz Insulated', price: 28, parity: 100, matchType: 'EXACT MATCH',      anchorKey: 'ASIN B08MF6PSF7',            tint: TINTS[0], shipping: '2-day delivery', shippingTone: 'good', rating: 4.7, reviews: 30110, stock: 'In stock',      take: 'Reference price for the real FreeSip.' },
      value:  { slot: 'Best Value',  retailer: 'target', name: 'Embark 32oz Lock-Top Bottle',  price: 16, parity: 88,  matchType: 'FUNCTIONAL TWIN',  anchorKey: 'Different brand · no shared UPC', tint: TINTS[2], savingsAmt: 12, savingsPct: 43, shipping: 'Pickup today', shippingTone: 'good', rating: 4.4, reviews: 5230, stock: 'In stock', take: 'Same sip-or-chug lid, pickup today, 43% off.' },
      budget: { slot: 'Best Budget', retailer: 'temu',   name: 'Generic FreeSip-style Bottle', price: 10, parity: 70,  matchType: 'BUDGET SUBSTITUTE', anchorKey: 'No shared identifier',        tint: TINTS[3], savingsAmt: 18, savingsPct: 64, shipping: '8–16 days', shippingTone: 'warn', rating: 4.0, reviews: 1880, stock: 'Ships from CN', take: 'Looks the part; lid seal is hit-or-miss.' },
    },
    offers: [
      { retailer: 'amazon',  name: 'Owala FreeSip 32oz',          price: 28, parity: 100, matchType: 'EXACT MATCH',      shipping: '2-day',       shippingTone: 'good', rating: 4.7, reviews: 30110, tint: TINTS[0], stock: 'In stock',      tag: 'exact' },
      { retailer: 'target',  name: 'Embark 32oz Lock-Top',        price: 16, parity: 88,  matchType: 'FUNCTIONAL TWIN',  savingsAmt: 12, savingsPct: 43, shipping: 'Pickup today', shippingTone: 'good', rating: 4.4, reviews: 5230, tint: TINTS[2], stock: 'In stock', tag: 'value' },
      { retailer: 'walmart', name: 'Ozark Trail 32oz Flip Straw', price: 13, parity: 83,  matchType: 'FUNCTIONAL TWIN',  savingsAmt: 15, savingsPct: 54, shipping: '3–5 days',    shippingTone: 'ok',   rating: 4.3, reviews: 9400, tint: TINTS[1], stock: 'In stock' },
      { retailer: 'amazon',  name: 'BJPKPK 32oz Sport Bottle',    price: 18, parity: 80,  matchType: 'FUNCTIONAL TWIN',  savingsAmt: 10, savingsPct: 36, shipping: '2-day',       shippingTone: 'good', rating: 4.2, reviews: 4100, tint: TINTS[5], stock: 'In stock' },
      { retailer: 'temu',    name: 'Generic FreeSip-style Bottle',price: 10, parity: 70,  matchType: 'BUDGET SUBSTITUTE', savingsAmt: 18, savingsPct: 64, shipping: '8–16 days',   shippingTone: 'warn', rating: 4.0, reviews: 1880, tint: TINTS[3], stock: 'Ships from CN', tag: 'budget' },
    ],
    verdict: 'The Target Embark is the quiet winner — the same push-button straw lid you actually want, ready for pickup today, for 43% less. The Temu copy nails the look but reviewers flag an inconsistent lid seal, so only chase it if $6 truly matters.',
  },
  {
    id: 'airpods-pro-2', query: 'airpods', icon: 'buds',
    title: 'AirPods Pro 2 & Alternatives', category: 'Wireless earbuds',
    lead: true, maxSavingsPct: 92, votes: 511, trending: 'Trending',
    review: { text: 'The Apple-Renewed pair looked brand new and saved me $60. Same ANC, same case.', author: 'Verified Amazon buyer' },
    matchedAttrs: ['Active noise cancellation', 'In-ear silicone fit', 'Wireless charging case', 'USB-C'],
    products: {
      exact:  { slot: 'Best Exact',  retailer: 'amazon', name: 'Apple AirPods Pro 2 (USB-C)',    price: 249, parity: 100, matchType: 'EXACT MATCH',        anchorKey: 'ASIN B0CHWRXH8B',            tint: TINTS[0], shipping: '2-day delivery', shippingTone: 'good', rating: 4.8, reviews: 112400, stock: 'In stock', take: 'The genuine article, new, full warranty.' },
      value:  { slot: 'Best Value',  retailer: 'amazon', name: 'AirPods Pro 2 (Apple Renewed)',  price: 189, parity: 96,  matchType: 'NEAR-EXACT · RENEWED', anchorKey: 'Same ASIN family · Renewed', tint: TINTS[1], savingsAmt: 60, savingsPct: 24, shipping: '2-day delivery', shippingTone: 'good', rating: 4.6, reviews: 8800, stock: 'In stock', take: 'Same H2 chip, ANC & spatial audio — $60 less.' },
      budget: { slot: 'Best Budget', retailer: 'temu',   name: "Generic ANC Earbuds 'Pro'",      price: 19,  parity: 41,  matchType: 'NOT COMPARABLE',     anchorKey: 'Different driver class',      tint: TINTS[4], savingsAmt: 230, savingsPct: 92, shipping: '8–16 days', shippingTone: 'stop', rating: 3.6, reviews: 4200, stock: 'Ships from CN', take: 'Not a twin — no H2 chip, no spatial audio, ANC unverified.' },
    },
    offers: [
      { retailer: 'amazon',  name: 'Apple AirPods Pro 2 (USB-C)',   price: 249, parity: 100, matchType: 'EXACT MATCH',      shipping: '2-day',       shippingTone: 'good', rating: 4.8, reviews: 112400, tint: TINTS[0], stock: 'In stock',      tag: 'exact' },
      { retailer: 'walmart', name: 'Apple AirPods Pro 2 (USB-C)',   price: 239, parity: 100, matchType: 'EXACT MATCH',      savingsAmt: 10, savingsPct: 4,  shipping: '3–5 days',    shippingTone: 'ok',   rating: 4.8, reviews: 21300,  tint: TINTS[0], stock: 'In stock' },
      { retailer: 'amazon',  name: 'AirPods Pro 2 (Apple Renewed)', price: 189, parity: 96,  matchType: 'NEAR-EXACT',       savingsAmt: 60, savingsPct: 24, shipping: '2-day',       shippingTone: 'good', rating: 4.6, reviews: 8800,   tint: TINTS[1], stock: 'In stock',      tag: 'value' },
      { retailer: 'target',  name: 'Google Pixel Buds Pro 2',       price: 179, parity: 74,  matchType: 'FUNCTIONAL TWIN',  savingsAmt: 70, savingsPct: 28, shipping: 'Pickup today', shippingTone: 'good', rating: 4.4, reviews: 15600,  tint: TINTS[5], stock: 'In stock' },
      { retailer: 'temu',    name: "Generic ANC Earbuds 'Pro'",     price: 19,  parity: 41,  matchType: 'NOT COMPARABLE',   savingsAmt: 230, savingsPct: 92, shipping: '8–16 days',  shippingTone: 'stop', rating: 3.6, reviews: 4200,   tint: TINTS[4], stock: 'Ships from CN', tag: 'budget' },
    ],
    verdict: "If you want AirPods, buy AirPods — the Apple-Renewed unit is the genuine article for $60 less, with the same H2 chip, ANC and spatial audio. The $19 Temu earbuds aren't a twin at all: different driver class, no spatial audio, and ANC we couldn't verify. We won't pretend otherwise.",
    compareRows: [
      { label: 'Price',        exact: '$249', value: '$189', budget: '$19', kind: 'price' },
      { label: 'Parity',       exact: '100% exact', value: '96% renewed', budget: '41% · no', kind: 'parity' },
      { label: 'Chip / audio', exact: 'Apple H2', value: 'Apple H2', budget: 'Generic BT', match: [true, true, false] },
      { label: 'Spatial audio',exact: 'Yes', value: 'Yes', budget: 'No', match: [true, true, false] },
      { label: 'ANC',          exact: 'Verified', value: 'Verified', budget: 'Unverified', tone: ['good','good','stop'] },
      { label: 'Shipping',     exact: '2 days', value: '2 days', budget: '8–16 days', tone: ['good','good','warn'] },
      { label: 'Return risk',  exact: 'Low', value: 'Low', budget: 'High', tone: ['good','good','stop'] },
    ],
  },
  {
    id: 'floral-midi', query: 'summer dress', icon: 'dress',
    title: 'Floral Midi Summer Dress & Twins', category: "Women's midi dress",
    lead: true, maxSavingsPct: 79, votes: 268, trending: 'Trending',
    review: { text: 'Same tiered floral as the boutique version — got compliments all day. A third of the price.', author: 'Verified SHEIN buyer' },
    matchedAttrs: ['Tiered midi silhouette', 'Floral print', 'Adjustable straps', 'Smocked back', 'Lined skirt'],
    products: {
      exact:  { slot: 'Best Exact',  retailer: 'amazon', name: 'Petal Tiered Floral Midi Dress',       price: 52, parity: 100, matchType: 'REFERENCE',        anchorKey: 'ASIN B0C1V2K9QF',            tint: TINTS[0], shipping: '2-day delivery', shippingTone: 'good', rating: 4.5, reviews: 6210, stock: 'In stock',     take: 'Faster shipping anchor for the style.' },
      value:  { slot: 'Best Value',  retailer: 'shein',  name: 'Floral Smocked Tiered Midi Dress',     price: 18, parity: 88,  matchType: 'FUNCTIONAL TWIN',  anchorKey: 'Different brand · no shared SKU', tint: TINTS[2], savingsAmt: 34, savingsPct: 65, shipping: '5–8 days', shippingTone: 'ok', rating: 4.3, reviews: 15400, stock: 'In stock', take: 'Same silhouette & print for a third of the price.' },
      budget: { slot: 'Best Budget', retailer: 'temu',   name: 'Boho Floral Tiered Maxi Dress',        price: 11, parity: 76,  matchType: 'BUDGET SUBSTITUTE', anchorKey: 'No shared identifier',        tint: TINTS[3], savingsAmt: 41, savingsPct: 79, shipping: '10–18 days · verify', shippingTone: 'warn', rating: 4.0, reviews: 7300, stock: 'Ships from CN', take: 'Cheapest; fabric is lighter, sizing runs small.' },
    },
    offers: [
      { retailer: 'amazon', name: 'Petal Tiered Floral Midi',       price: 52, parity: 100, matchType: 'REFERENCE',        shipping: '2-day',     shippingTone: 'good', rating: 4.5, reviews: 6210,  tint: TINTS[0], stock: 'In stock',      tag: 'exact' },
      { retailer: 'shein',  name: 'Floral Smocked Tiered Midi',     price: 18, parity: 88,  matchType: 'FUNCTIONAL TWIN',  savingsAmt: 34, savingsPct: 65, shipping: '5–8 days',  shippingTone: 'ok',   rating: 4.3, reviews: 15400, tint: TINTS[2], stock: 'In stock',      tag: 'value' },
      { retailer: 'target', name: 'Knox Rose Tiered Midi Dress',    price: 30, parity: 84,  matchType: 'FUNCTIONAL TWIN',  savingsAmt: 22, savingsPct: 42, shipping: 'Pickup today', shippingTone: 'good', rating: 4.4, reviews: 3900, tint: TINTS[1], stock: 'In stock' },
      { retailer: 'shein',  name: 'Ditsy Floral Smock Dress',       price: 15, parity: 81,  matchType: 'FUNCTIONAL TWIN',  savingsAmt: 37, savingsPct: 71, shipping: '5–8 days',  shippingTone: 'ok',   rating: 4.2, reviews: 8800,  tint: TINTS[6], stock: 'In stock' },
      { retailer: 'temu',   name: 'Boho Floral Tiered Maxi',        price: 11, parity: 76,  matchType: 'BUDGET SUBSTITUTE', savingsAmt: 41, savingsPct: 79, shipping: '10–18 days', shippingTone: 'warn', rating: 4.0, reviews: 7300, tint: TINTS[3], stock: 'Ships from CN', tag: 'budget' },
    ],
    verdict: 'SHEIN is the sweet spot — the same tiered, smocked floral midi for $34 less than Amazon, with shipping you can actually plan around. The Temu version is cheaper still but the fabric is thinner and sizing runs small, so size up if you chase it.',
    compareRows: [
      { label: 'Price',       exact: '$52', value: '$18', budget: '$11', kind: 'price' },
      { label: 'Parity',      exact: '100% ref', value: '88% twin', budget: '76% twin', kind: 'parity' },
      { label: 'Silhouette',  exact: 'Tiered midi', value: 'Tiered midi', budget: 'Tiered maxi', match: [true, true, false] },
      { label: 'Fabric',      exact: 'Lined rayon', value: 'Lined rayon', budget: 'Unlined poly', match: [true, true, false] },
      { label: 'Straps',      exact: 'Adjustable', value: 'Adjustable', budget: 'Fixed', match: [true, true, false] },
      { label: 'Shipping',    exact: '2 days', value: '5–8 days', budget: '10–18 days', tone: ['good','ok','warn'] },
      { label: 'Return risk', exact: 'Low', value: 'Moderate', budget: 'Elevated', tone: ['good','ok','warn'] },
    ],
  },
];

export const CHIPS = ['thermo flask', 'airpods', 'summer dress', 'robot vacuum', 'office chair', 'electric toothbrush'];
export const QUERIES = ['thermo flask', 'airpods', 'summer dress'];

// ─── Smart Basket (the demo's money shot) ───
// 12 functional twins TwinCart assembled. Amazon ≈ $996, TwinCart ≈ $120 (~88% off).
// Prices grounded in real scraped twins (e.g. 40oz tumbler $50 → Temu $8 we actually pulled).
export const DEMO_BASKET: any[] = [
  { icon: 'flask', name: '40oz Insulated Steel Tumbler', twinName: 'Generic 40oz Tumbler, Handle + Straw', retailer: 'temu',    amazon: 50,  price: 8,  parity: 88, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'buds',  name: 'ANC Wireless Earbuds (USB-C)',  twinName: 'TWS ANC Earbuds, USB-C Case',       retailer: 'temu',    amazon: 99,  price: 11, parity: 82, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'dress', name: 'Floral Smocked Midi Dress',     twinName: 'Floral Tiered Smock Midi',          retailer: 'shein',   amazon: 58,  price: 11, parity: 88, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: 'LED Vanity Mirror w/ Lights',   twinName: 'Hollywood LED Makeup Mirror',       retailer: 'temu',    amazon: 120, price: 13, parity: 85, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: 'Sonic Electric Toothbrush',     twinName: 'Sonic Toothbrush + 8 Heads',        retailer: 'temu',    amazon: 100, price: 11, parity: 84, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: 'Cool-Mist Humidifier 4L',       twinName: 'Ultrasonic Cool-Mist Humidifier',   retailer: 'temu',    amazon: 60,  price: 9,  parity: 86, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: '65W GaN USB-C Charger',         twinName: '65W GaN 3-Port Charger',            retailer: 'temu',    amazon: 50,  price: 7,  parity: 89, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: 'Smart Fitness Watch',           twinName: 'AMOLED Smart Fitness Watch',        retailer: 'temu',    amazon: 149, price: 14, parity: 76, matchType: 'BUDGET SUBSTITUTE' },
  { icon: 'dress', name: 'Crossbody Shoulder Bag',        twinName: 'PU Leather Crossbody Bag',          retailer: 'shein',   amazon: 90,  price: 10, parity: 84, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: 'Memory Foam Pillows (2-pack)',  twinName: 'Cooling Memory Foam Pillow 2pk',    retailer: 'walmart', amazon: 70,  price: 11, parity: 86, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: '15-pc Kitchen Knife Set',       twinName: 'Stainless 15pc Knife Block Set',    retailer: 'walmart', amazon: 100, price: 12, parity: 83, matchType: 'FUNCTIONAL TWIN' },
  { icon: 'box',   name: 'Resistance Bands Home Gym',     twinName: '11pc Resistance Band Set',          retailer: 'temu',    amazon: 50,  price: 6,  parity: 85, matchType: 'FUNCTIONAL TWIN' },
];
