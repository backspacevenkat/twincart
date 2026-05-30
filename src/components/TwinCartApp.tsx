'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef, useCallback } from 'react';
import { RETAILERS, CLUSTERS, GALLERY, IMG, CHIPS, QUERIES, DEMO_BASKET } from '@/lib/twincart-data';
import HERO_IMAGES from '@/lib/hero-images.json';

// AI-generated (Gemini) studio tile per category; falls back to the cluster's real scraped hero.
const heroFor = (cluster: any) =>
  (HERO_IMAGES as any)[cluster?.query] || cluster?.heroImages?.[0] || IMG[cluster?.icon] || "";
// Per-category summary for the browse grid (best savings + how many retailers we aggregated).
const CATEGORY_CARDS = CLUSTERS.map((c: any) => ({
  query: c.query,
  title: c.title,
  maxSavingsPct: c.maxSavingsPct || 0,
  retailers: new Set((c.offers || []).map((o: any) => o.retailer)).size,
  listings: (c.offers || []).length,
  img: (HERO_IMAGES as any)[c.query] || c.heroImages?.[0] || IMG[c.icon] || "",
}));
import CartScreen from '@/components/CartScreen';

/* Route remote product images through wsrv.nl. Temu (kwcdn.com) and SHEIN (ltwebstatic.com)
   block cross-origin hotlinks, so their <img> 404 on our domain — leaving only Amazon visible.
   The proxy refetches server-side and re-serves with permissive CORS. */
const px = (u: any) =>
  typeof u === "string" && /^https?:\/\//.test(u)
    ? `https://wsrv.nl/?url=${encodeURIComponent(u)}&w=640&output=webp&we`
    : u;

/* Hash-based slug routing for static export (deep-linkable, shareable). */
const slugify = (s: any) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const clusterBySlug = (s: string) => CLUSTERS.find((c: any) => slugify(c.query) === s);

/* TwinCart — shared UI primitives */

/* ───────────────── Icons (clean line icons) ───────────────── */
function Icon({ name, size = 20, stroke = 1.8, style }: any) {
  const p: any = { width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", style };
  switch (name) {
    case "search": return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>;
    case "arrow":  return <svg {...p}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>;
    case "back":   return <svg {...p}><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></svg>;
    case "check":  return <svg {...p}><path d="M20 6 9 17l-5-5"/></svg>;
    case "check-circle": return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-4.8"/></svg>;
    case "x":      return <svg {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
    case "shield": return <svg {...p}><path d="M12 3 5 6v6c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6z"/><path d="m9 12 2 2 4-4"/></svg>;
    case "seal":   return <svg {...p}><path d="m12 2 2.4 1.7 2.9-.3 1.2 2.7 2.6 1.4-.6 2.9 1 2.8-2.2 1.9-.4 2.9-2.9.5L14 24l-2-1.5L9.6 24 7 22.6l-2.9-.5-.4-2.9L1.5 17l1-2.8-.6-2.9 2.6-1.4 1.2-2.7 2.9.3z"/><path d="m9 12 2 2 4-4"/></svg>;
    case "truck":  return <svg {...p}><path d="M3 7h11v8H3z"/><path d="M14 10h4l3 3v2h-7z"/><circle cx="7" cy="17" r="1.6"/><circle cx="17" cy="17" r="1.6"/></svg>;
    case "tag":    return <svg {...p}><path d="M3 3h7l11 11-7 7L3 10z"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none"/></svg>;
    case "bolt":   return <svg {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>;
    case "scale":  return <svg {...p}><path d="M12 4v16"/><path d="M6 8h12"/><path d="m6 8-3 6h6z"/><path d="m18 8-3 6h6z"/><path d="M8 20h8"/></svg>;
    case "doc":    return <svg {...p}><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/><path d="M9 13h6"/><path d="M9 17h4"/></svg>;
    case "link":   return <svg {...p}><path d="M10 13a4 4 0 0 0 6 .5l2-2a4 4 0 0 0-6-6l-1 1"/><path d="M14 11a4 4 0 0 0-6-.5l-2 2a4 4 0 0 0 6 6l1-1"/></svg>;
    case "copy":   return <svg {...p}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>;
    case "spark":  return <svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>;
    case "twins":  return <svg {...p}><circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/><path d="M11.2 12h1.6"/></svg>;
    case "flask":  return <svg {...p}><path d="M9 3h6"/><path d="M10 3v6l-4.5 8.5A2 2 0 0 0 7.3 21h9.4a2 2 0 0 0 1.8-3.5L14 9V3"/><path d="M7.5 15h9"/></svg>;
    case "buds":   return <svg {...p}><path d="M8 7c-2.5 0-4 2-4 5 0 2 1 3 2.5 3S9 16 9 14V8a1 1 0 0 0-1-1z"/><path d="M16 7c2.5 0 4 2 4 5 0 2-1 3-2.5 3S15 16 15 14V8a1 1 0 0 1 1-1z"/></svg>;
    case "dress":  return <svg {...p}><path d="M9 3l3 2 3-2"/><path d="M9 3 7 8l2 1-1.5 4M15 3l2 5-2 1 1.5 4"/><path d="M7.5 13h9l1.5 8H6z"/></svg>;
    case "filter": return <svg {...p}><path d="M3 5h18"/><path d="M6 12h12"/><path d="M10 19h4"/></svg>;
    case "star":   return <svg {...p} fill="currentColor" stroke="none"><path d="m12 3 2.5 5.5L20 9.3l-4 4 1 5.7-5-3-5 3 1-5.7-4-4 5.5-.8z"/></svg>;
    case "chevron":return <svg {...p}><path d="m9 6 6 6-6 6"/></svg>;
    case "chevdown":return <svg {...p}><path d="m6 9 6 6 6-6"/></svg>;
    case "alert":  return <svg {...p}><path d="M12 3 2 20h20z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg>;
    case "lock":   return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
    case "cart":   return <svg {...p}><path d="M3 4h2l2 12h10l2-8H7"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>;
    case "box":    return <svg {...p}><path d="m3 8 9-5 9 5v8l-9 5-9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>;
    default: return null;
  }
}

const CAT_ICON: any = { flask: "flask", buds: "buds", dress: "dress" };

/* ───────────────── Retailer badge ───────────────── */
function RetailerBadge({ id, size = "md" }: any) {
  const r = RETAILERS[id];
  const [logoOk, setLogoOk] = useState(true);
  if (!r) return null;
  const sm = size === "sm";
  const dim = sm ? 14 : 16;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: sm ? "3px 8px" : "4px 10px", borderRadius: 999,
      background: "var(--surface-3)", border: "1px solid var(--hairline)",
      fontSize: sm ? 11 : 12, fontWeight: 600, color: "var(--ink-soft)", whiteSpace: "nowrap",
    }}>
      {logoOk && r.logo
        ? <img src={r.logo} alt="" width={dim} height={dim} loading="lazy" onError={() => setLogoOk(false)}
            style={{ width: dim, height: dim, borderRadius: 4, objectFit: "contain", display: "block" }} />
        : <span style={{ width: 7, height: 7, borderRadius: 999, background: r.color }} />}
      {r.name}
    </span>
  );
}

/* ───────────────── Slot tag (Best Exact / Value / Budget / Not comparable) ───────────────── */
function matchTone(matchType: any) {
  if (/NOT COMPARABLE/.test(matchType)) return "risk";
  if (/EXACT|REFERENCE|RENEWED|NEAR/.test(matchType)) return "ink";
  if (/BUDGET/.test(matchType)) return "amber";
  return "accent"; // functional twin
}

/* ───────────────── Savings pill ───────────────── */
function SavingsPill({ amt, pct, size = "md", muted }: any) {
  if (amt == null) return null;
  const sm = size === "sm";
  return (
    <span className="tnum" style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: sm ? "3px 9px" : "6px 12px", borderRadius: 999,
      background: muted ? "var(--surface-3)" : "var(--money-soft)",
      color: muted ? "var(--muted)" : "var(--money)",
      fontWeight: 700, fontSize: sm ? 12 : 13.5, whiteSpace: "nowrap",
    }}>
      <Icon name="tag" size={sm ? 12 : 14} stroke={2.2} />
      Save ${amt} ({pct}%)
    </span>
  );
}

/* ───────────────── Functional-parity meter ───────────────── */
function ParityMeter({ value, matchType, animate = true, compact = false, delay = 0 }: any) {
  const [w, setW] = useState<any>(animate ? 0 : value);
  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => setW(value), 60 + delay);
    return () => clearTimeout(t);
  }, [value, animate, delay]);

  // color: amber (low) → accent (high)
  const tone = matchType && /NOT COMPARABLE/.test(matchType);
  const fill = tone ? "var(--risk)"
    : value >= 90 ? "var(--accent)"
    : value >= 80 ? "var(--accent)"
    : value >= 70 ? "linear-gradient(90deg, var(--amber), var(--accent))"
    : "var(--amber)";
  const segs = 16;
  const lit = Math.round((w / 100) * segs);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 5 : 7 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "nowrap" }}>
        <span className="tnum" style={{ fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: compact ? 15 : 17, color: tone ? "var(--risk)" : "var(--ink)", whiteSpace: "nowrap" }}>
          {value}%
        </span>
        <span style={{ fontSize: compact ? 10.5 : 11.5, fontWeight: 600, letterSpacing: "0.02em",
          color: tone ? "var(--risk)" : "var(--muted)", textTransform: "none", whiteSpace: "nowrap" }}>
          {tone ? "not a twin" : (matchType && /EXACT|REFERENCE/.test(matchType) ? "exact match" : "functional twin")}
        </span>
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {Array.from({ length: segs }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: compact ? 6 : 8, borderRadius: 3,
            background: i < lit ? (typeof fill === "string" && fill.startsWith("linear") ? fill : fill) : "var(--surface-3)",
            transition: `background 0.4s ${0.012 * i}s ease`,
          }} />
        ))}
      </div>
    </div>
  );
}

/* ───────────────── Shipping line ───────────────── */
function ShippingLine({ text, tone }: any) {
  const color = tone === "good" ? "var(--money)" : tone === "warn" || tone === "stop" ? "var(--amber)" : "var(--muted)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 500, color }}>
      <Icon name="truck" size={14} stroke={1.9} /> {text}
    </span>
  );
}

/* ───────────────── Rating stars ───────────────── */
function Rating({ value, count }: any) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--muted)" }}>
      <Icon name="star" size={13} style={{ color: "var(--amber)" }} />
      <span className="tnum" style={{ fontWeight: 600, color: "var(--ink-soft)" }}>{value}</span>
      {count != null && <span className="tnum">({count.toLocaleString()})</span>}
    </span>
  );
}

/* ───────────────── Product thumbnail (real imagery) ───────────────── */
function Thumb({ icon, retailer, size = 64, tone, tint, radius = 14, img }: any) {
  const r = RETAILERS[retailer];
  const accent = tone || (r ? r.color : "var(--accent)");
  const src = px(img) || IMG[icon];
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: "var(--surface-3)", border: "1px solid var(--hairline)",
      position: "relative", overflow: "hidden",
    }}>
      {src
        ? <img src={src} alt="" loading="lazy" style={{ width: "100%", height: "100%",
            objectFit: "cover", display: "block", filter: tint || undefined }} />
        : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--ink-soft)" }}>
            <Icon name={CAT_ICON[icon] || "tag"} size={size * 0.46} stroke={1.5} />
          </div>}
      <span style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: 3, background: accent, opacity: 0.9 }} />
    </div>
  );
}

/* Larger product image for cards — fixed aspect, real photo */
function ProductImage({ icon, tint, height = 200, radius = 14, children, img }: any) {
  const src = px(img) || IMG[icon];
  return (
    <div style={{ position: "relative", width: "100%", height, borderRadius: radius, overflow: "hidden",
      background: "var(--surface-3)", border: "1px solid var(--hairline)" }}>
      {src && <img src={src} alt="" loading="lazy" style={{ width: "100%", height: "100%",
        objectFit: "cover", display: "block", filter: tint || undefined }} />}
      {children}
    </div>
  );
}

/* ───────────────── Button ───────────────── */
function Btn({ children, variant = "ghost", size = "md", icon, iconRight, onClick, style, full, disabled }: any) {
  const [h, setH] = useState(false);
  const base: any = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: "var(--font-body)", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: 999, transition: "all .16s ease", whiteSpace: "nowrap", width: full ? "100%" : "auto",
    fontSize: size === "lg" ? 16 : size === "sm" ? 13 : 14.5,
    padding: size === "lg" ? "14px 26px" : size === "sm" ? "8px 14px" : "11px 20px",
    opacity: disabled ? 0.5 : 1,
  };
  const variants: any = {
    primary: { background: h && !disabled ? "var(--accent-deep)" : "var(--accent)", color: "#fff",
      boxShadow: h && !disabled ? "var(--shadow-accent)" : "var(--shadow-sm)" },
    ink: { background: h && !disabled ? "#000" : "var(--ink)", color: "#fff" },
    soft: { background: h ? "var(--accent-soft)" : "var(--surface-3)", color: "var(--ink)",
      border: "1px solid var(--hairline)" },
    ghost: { background: h ? "var(--surface-3)" : "transparent", color: "var(--ink-soft)",
      border: "1px solid var(--hairline-2)" },
    trust: { background: h ? "#1d4fd6" : "var(--trust)", color: "#fff" },
    money: { background: h ? "#13903f" : "var(--money)", color: "#fff" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ ...base, ...variants[variant], ...style }}>
      {icon && <Icon name={icon} size={size === "lg" ? 19 : 17} stroke={2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "lg" ? 19 : 17} stroke={2} />}
    </button>
  );
}

/* ───────────────── Retailer deep-link ───────────────── */
function RetailerLink({ url, retailer, compact, full }: any) {
  if (!url) return null;
  const r = RETAILERS[retailer];
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e: any) => e.stopPropagation()}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        fontSize: compact ? 11.5 : 12.5, fontWeight: 600, color: "var(--trust)",
        padding: compact ? "5px 10px" : "8px 13px", borderRadius: 999,
        background: "var(--trust-soft)", border: "1px solid #cfe0fd", whiteSpace: "nowrap",
        width: full ? "100%" : "auto" }}>
      View on {r ? r.name : retailer} <Icon name="arrow" size={compact ? 12 : 14} stroke={2.2} />
    </a>
  );
}

/* TwinCart — ImageCarousel + TwinSpectrum (cluster identity visuals) */

/* ───────────────── Image carousel ───────────────── */
function ImageCarousel({ icon, height = 300, radius = 18, tint, children, rounded = true, images: imagesProp, captions, index, setIndex }: any) {
  const imgs = ((imagesProp && imagesProp.length ? imagesProp : (GALLERY && GALLERY[icon]) || [IMG[icon]]) as any[]).filter(Boolean).map(px);
  const [iLocal, setILocal] = useState(0);
  // Controlled mode: parent owns the index (so clicking a price elsewhere syncs the image).
  const i = typeof index === "number" ? Math.min(index, Math.max(0, imgs.length - 1)) : iLocal;
  const setI = (fnOrVal: any) => {
    const next = typeof fnOrVal === "function" ? fnOrVal(i) : fnOrVal;
    if (setIndex) setIndex(next); else setILocal(next);
  };
  const [drag, setDrag] = useState<any>(null);
  const n = imgs.length;
  const go = (d: any) => setI((p: any) => (p + d + n) % n);
  const at = (k: any) => setI(k);
  const caption = captions && captions[i];

  const onDown = (e: any) => { const x = (e.touches ? e.touches[0].clientX : e.clientX); setDrag({ x, dx: 0 }); };
  const onMove = (e: any) => { if (!drag) return; const x = (e.touches ? e.touches[0].clientX : e.clientX); setDrag((d: any) => ({ ...d, dx: x - d.x })); };
  const onUp = () => { if (!drag) return; if (drag.dx > 45) go(-1); else if (drag.dx < -45) go(1); setDrag(null); };

  if (!n) {
    return (
      <div style={{ position: "relative", width: "100%", height, borderRadius: rounded ? radius : 0,
        overflow: "hidden", background: "var(--surface-3)", border: "1px solid var(--hairline)",
        display: "grid", placeItems: "center", color: "var(--muted-2)" }}>
        <Icon name="box" size={Math.min(64, height * 0.3)} stroke={1.4} />
        {children}
      </div>
    );
  }
  return (
    <div style={{ position: "relative", width: "100%", height, borderRadius: rounded ? radius : 0,
      overflow: "hidden", background: "var(--surface-3)", border: "1px solid var(--hairline)",
      cursor: drag ? "grabbing" : "grab", userSelect: "none" }}
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}>

      {/* track */}
      <div style={{ display: "flex", height: "100%", width: `${n * 100}%`,
        transform: `translateX(calc(${-i * (100 / n)}% + ${drag ? drag.dx : 0}px))`,
        transition: drag ? "none" : "transform .42s cubic-bezier(.5,.05,.2,1)" }}>
        {imgs.map((src: any, k: any) => (
          <div key={src} style={{ width: `${100 / n}%`, height: "100%", flexShrink: 0 }}>
            <img src={src} alt="" draggable="false" style={{ width: "100%", height: "100%",
              objectFit: "cover", display: "block", filter: tint || undefined, pointerEvents: "none" }} />
          </div>
        ))}
      </div>

      {children}

      {/* caption — name of the product whose image is showing (syncs with clicked price) */}
      {caption && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "30px 12px 28px",
          background: "linear-gradient(transparent, rgba(14,15,19,0.82))", color: "#fff",
          fontSize: 12, fontWeight: 600, lineHeight: 1.3, pointerEvents: "none" }}>
          <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{caption}</span>
        </div>
      )}

      {/* arrows */}
      {n > 1 && ["back", "chevron"].map((ic, k) => (
        <button key={ic} onClick={(e) => { e.stopPropagation(); go(k ? 1 : -1); }}
          style={{ position: "absolute", top: "50%", [k ? "right" : "left"]: 10, transform: "translateY(-50%)",
            width: 36, height: 36, borderRadius: 999, display: "grid", placeItems: "center",
            background: "rgba(255,255,255,0.92)", color: "var(--ink)", boxShadow: "var(--shadow-md)",
            border: "1px solid var(--hairline)" }}>
          <Icon name={ic} size={18} stroke={2.2} />
        </button>
      ))}

      {/* dots */}
      {n > 1 && (
        <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex",
          justifyContent: "center", gap: 7 }}>
          {imgs.map((_: any, k: any) => (
            <button key={k} onClick={(e) => { e.stopPropagation(); at(k); }}
              style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 999,
                background: k === i ? "var(--accent)" : "rgba(255,255,255,0.85)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)", transition: "all .2s" }} />
          ))}
        </div>
      )}

      {/* counter */}
      {n > 1 && (
        <span className="tnum" style={{ position: "absolute", top: 12, right: 12, fontSize: 11.5,
          fontWeight: 600, color: "#fff", background: "rgba(14,15,19,0.55)", padding: "3px 9px",
          borderRadius: 999, backdropFilter: "blur(4px)" }}>{i + 1}/{n}</span>
      )}
    </div>
  );
}

/* ───────────────── Twin Spectrum — the cluster "aha" price ladder ───────────────── */
function spectrumColor(o: any) {
  if (/NOT COMPARABLE/.test(o.matchType)) return "var(--risk)";
  if (o.tag === "exact" || /EXACT|REFERENCE/.test(o.matchType)) return "var(--ink)";
  if (o.tag === "budget" || /BUDGET/.test(o.matchType)) return "var(--amber)";
  return "var(--accent)";
}

function TwinSpectrum({ cluster, onPick, onAdd, onSelectImage, onPickOffer }: any) {
  const offers = cluster.offers;
  const prices = offers.map((o: any) => o.price);
  const lo = Math.min(...prices), hi = Math.max(...prices);
  const span = Math.max(1, hi - lo);
  const [hover, setHover] = useState<any>(null);
  const [sel, setSel] = useState<any>(null);
  const pos = (p: any) => 6 + ((p - lo) / span) * 88; // 6%..94%

  // de-overlap: sort by price, nudge equal-ish nodes
  const nodes = offers.map((o: any, idx: any) => ({ o, idx, x: pos(o.price) }))
    .sort((a: any, b: any) => a.x - b.x);
  // de-overlap: push each node right so its price label can't collide with the previous one
  const MIN_GAP = 9;
  for (let k = 1; k < nodes.length; k++) {
    if (nodes[k].x < nodes[k - 1].x + MIN_GAP) nodes[k].x = Math.min(96, nodes[k - 1].x + MIN_GAP);
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: 16,
      padding: "20px 22px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        marginBottom: 22, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ display: "grid", placeItems: "center", width: 28, height: 28, borderRadius: 8,
            background: "var(--accent-soft)", color: "var(--accent)" }}><Icon name="twins" size={16} stroke={2.2} /></span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>The twin spectrum</span>
          <span style={{ fontSize: 12.5, color: "var(--muted)" }}>· same product, {offers.length} prices</span>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {[["var(--ink)", "Exact"], ["var(--accent)", "Twin"], ["var(--amber)", "Budget"], ["var(--risk)", "Not a twin"]].map(([c, l]) => (
            <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5,
              fontWeight: 600, color: "var(--muted)" }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: c }} /> {l}
            </span>
          ))}
        </div>
      </div>

      {/* the axis */}
      <div style={{ position: "relative", height: 64, margin: "0 4px" }}>
        {/* base line */}
        <div style={{ position: "absolute", top: 30, left: "6%", right: "6%", height: 4, borderRadius: 4,
          background: "linear-gradient(90deg, var(--amber) 0%, var(--accent) 45%, var(--ink) 100%)", opacity: 0.28 }} />

        {/* nodes */}
        {nodes.map(({ o, idx, x }: any) => {
          const color = spectrumColor(o);
          const isVal = o.tag === "value";
          const active = hover === idx;
          return (
            <div key={o.retailer + o.name}
              onMouseEnter={() => setHover(idx)} onMouseLeave={() => setHover(null)}
              onClick={(e: any) => { e.stopPropagation(); setSel(o); onSelectImage && onSelectImage(idx); onPickOffer && onPickOffer(o); }}
              style={{ position: "absolute", top: 32, left: `${x}%`, transform: "translate(-50%,-50%)",
                zIndex: active ? 20 : isVal ? 10 : 5, cursor: "pointer" }}>
              {/* node dot */}
              <div style={{ width: isVal ? 22 : 16, height: isVal ? 22 : 16, borderRadius: 999,
                background: color, border: `3px solid var(--surface)`,
                boxShadow: isVal ? "0 0 0 4px var(--accent-soft), var(--shadow-md)" : "var(--shadow-sm)",
                transform: active ? "scale(1.18)" : "scale(1)", transition: "transform .15s" }} />
              {/* price tag under */}
              <div className="tnum" style={{ position: "absolute", top: isVal ? 27 : 22, left: "50%",
                transform: "translateX(-50%)", fontSize: 12, fontWeight: 700, color,
                whiteSpace: "nowrap" }}>${o.price}</div>

              {/* recommended marker */}
              {isVal && (
                <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
                  display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 999,
                  background: "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.03em", whiteSpace: "nowrap", boxShadow: "var(--shadow-accent)" }}>
                  <Icon name="bolt" size={11} stroke={2.4} /> PICK
                </div>
              )}

              {/* hover tooltip */}
              {active && (
                <div style={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)",
                  background: "var(--ink)", color: "#fff", padding: "9px 12px", borderRadius: 10,
                  width: 170, boxShadow: "var(--shadow-lg)", pointerEvents: "none", zIndex: 30 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{RETAILERS[o.retailer].name}</span>
                    <span className="tnum" style={{ fontSize: 11, fontWeight: 700, color: color === "var(--ink)" ? "#fff" : color }}>{o.parity}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.3 }}>{o.name}</div>
                </div>
              )}
            </div>
          );
        })}

        {/* end labels */}
        <span style={{ position: "absolute", left: 0, top: -4, fontSize: 10.5, fontWeight: 600,
          letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--amber)" }}>
          cheapest
        </span>
        <span style={{ position: "absolute", right: 0, top: -4, fontSize: 10.5, fontWeight: 600,
          letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
          the original
        </span>
      </div>

      {(() => { const chosen = sel || cluster.offers.find((o: any) => o.tag === "value") || cluster.offers[0]; const stop = /NOT COMPARABLE/.test(chosen.matchType); return (
        <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--hairline)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <Thumb icon={cluster.icon} img={chosen.image} retailer={chosen.retailer} size={48} tint={chosen.tint} />
          <div style={{ flex: 1, minWidth: 170 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{chosen.name}</span>
              <RetailerBadge id={chosen.retailer} size="sm" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
              <span className="tnum" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--ink)" }}>${chosen.price}</span>
              <span className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: stop ? "var(--risk)" : "var(--accent)", background: stop ? "var(--risk-soft)" : "var(--accent-soft)", padding: "2px 7px", borderRadius: 6 }}>{chosen.parity}% {stop ? "· not a twin" : "twin"}</span>
              {chosen.savingsAmt != null && <SavingsPill amt={chosen.savingsAmt} pct={chosen.savingsPct} size="sm" muted={stop} />}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <RetailerLink url={chosen.url} retailer={chosen.retailer} compact />
            <Btn variant="primary" size="sm" icon="cart" onClick={() => onAdd && onAdd(chosen)}>Add to cart</Btn>
          </div>
        </div>
      ); })()}
      {/* savings callout */}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--hairline)",
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Icon name="tag" size={16} stroke={2.2} style={{ color: "var(--money)" }} />
        <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          Same product spans <strong className="tnum" style={{ color: "var(--ink)" }}>${lo}–${hi}</strong> across {new Set(offers.map((o: any) => o.retailer)).size} retailers —
          <strong style={{ color: "var(--money)" }}> our pick saves you ${cluster.products.value.savingsAmt}.</strong>
        </span>
      </div>
    </div>
  );
}

/* TwinCart — aggregated offers grid (the "cluster" of all cross-retailer listings) */

function StockChip({ stock }: any) {
  const low = /low/i.test(stock);
  const cn = /cn|china/i.test(stock);
  const color = low ? "var(--amber)" : cn ? "var(--muted)" : "var(--money)";
  const bg = low ? "var(--amber-soft)" : cn ? "var(--surface-3)" : "var(--money-soft)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600,
      color, background: bg, padding: "2px 8px", borderRadius: 999 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} /> {stock}
    </span>
  );
}

function tagMeta(tag: any) {
  if (tag === "exact")  return { label: "Best Exact",  color: "var(--ink)" };
  if (tag === "value")  return { label: "Best Value",  color: "var(--accent)" };
  if (tag === "budget") return { label: "Best Budget", color: "var(--amber)" };
  return null;
}

/* one aggregated listing tile */
function OfferCard({ offer, icon, onAdd, onWish, wished, idx }: any) {
  const [h, setH] = useState(false);
  const isStop = /NOT COMPARABLE/.test(offer.matchType);
  const meta = tagMeta(offer.tag);
  const featured = offer.tag === "value";

  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ position: "relative", display: "flex", flexDirection: "column",
        background: "var(--surface)",
        border: `1px solid ${featured ? "var(--accent)" : "var(--hairline-2)"}`,
        borderRadius: 16, overflow: "hidden",
        boxShadow: h ? "var(--shadow-md)" : "var(--shadow-sm)",
        transform: h ? "translateY(-3px)" : "none", transition: "all .16s ease",
        outline: featured ? "2px solid var(--accent-soft)" : "none" }}>

      {/* image */}
      <ProductImage icon={icon} img={offer.image} tint={offer.tint} height={150} radius={0}>
        {meta && (
          <span style={{ position: "absolute", top: 9, left: 9, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.04em", textTransform: "uppercase", color: "#fff", background: meta.color,
            padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>{meta.label}</span>
        )}
        <button onClick={(e) => { e.stopPropagation(); onWish(offer); }}
          style={{ position: "absolute", top: 7, right: 7, width: 30, height: 30, borderRadius: 999,
            display: "grid", placeItems: "center", background: "rgba(255,255,255,0.92)",
            color: wished ? "var(--risk)" : "var(--muted)", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
          <Icon name="star" size={15} stroke={2} style={{ color: wished ? "var(--amber)" : "var(--muted-2)" }} />
        </button>
        <div style={{ position: "absolute", bottom: 8, left: 8 }}><RetailerBadge id={offer.retailer} size="sm" /></div>
      </ProductImage>

      {/* body */}
      <div style={{ padding: "12px 13px 13px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3, minHeight: 34,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {offer.name}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <Rating value={offer.rating} count={offer.reviews} />
        </div>

        {/* parity bar mini */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: "var(--surface-3)", overflow: "hidden" }}>
            <div style={{ width: `${offer.parity}%`, height: "100%", borderRadius: 3,
              background: isStop ? "var(--risk)" : "var(--accent)", transition: "width .5s ease" }} />
          </div>
          <span className="tnum" style={{ fontSize: 11.5, fontWeight: 700,
            color: isStop ? "var(--risk)" : "var(--ink-soft)" }}>{offer.parity}%</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <ShippingLine text={offer.shipping} tone={offer.shippingTone} />
          <StockChip stock={offer.stock} />
        </div>

        {/* price + actions */}
        <div style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--hairline)",
          display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
          <div>
            <div className="tnum" style={{ fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: 24, lineHeight: 1, color: "var(--ink)", letterSpacing: "-0.02em" }}>${offer.price}</div>
            {offer.savingsAmt != null
              ? <div className="tnum" style={{ fontSize: 11.5, fontWeight: 700,
                  color: isStop ? "var(--muted)" : "var(--money)", marginTop: 4 }}>
                  {isStop ? `−$${offer.savingsAmt}` : `Save $${offer.savingsAmt} (${offer.savingsPct}%)`}
                </div>
              : <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginTop: 4 }}>reference</div>}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onAdd(offer); }}
            title="Add to cart"
            style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: "grid", placeItems: "center",
              background: featured ? "var(--accent)" : "var(--ink)", color: "#fff",
              boxShadow: h ? "var(--shadow-md)" : "none", transition: "all .15s" }}>
            <Icon name="cart" size={18} stroke={2} />
          </button>
        </div>
        {offer.url && <RetailerLink url={offer.url} retailer={offer.retailer} compact full />}
      </div>
    </div>
  );
}

/* the aggregated grid — all listings in a cluster */
function OffersGrid({ cluster, onAdd, onWish, wishlist, columns }: any) {
  const cols = columns || 3;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: 14 }}
      className="offers-grid">
      {cluster.offers.map((o: any, i: any) => (
        <OfferCard key={o.retailer + o.name} offer={o} icon={cluster.icon} idx={i}
          onAdd={onAdd} onWish={onWish} wished={wishlist.has(o.retailer + o.name)} />
      ))}
    </div>
  );
}

/* aggregation summary bar — sits atop the grid */
function AggBar({ cluster }: any) {
  const prices = cluster.offers.map((o: any) => o.price);
  const lo = Math.min(...prices), hi = Math.max(...prices);
  const retailers = [...new Set(cluster.offers.map((o: any) => o.retailer))];
  const stats: any[] = [
    { label: "Listings", value: cluster.offers.length },
    { label: "Retailers", value: retailers.length },
    { label: "Price range", value: `$${lo}–$${hi}` },
    { label: "Max saving", value: `${cluster.maxSavingsPct}%`, hot: true },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      flexWrap: "wrap", padding: "14px 18px", background: "var(--surface)",
      border: "1px solid var(--hairline)", borderRadius: 14 }}>
      <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
        {stats.map((s) => (
          <div key={s.label} style={{ whiteSpace: "nowrap" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase",
              letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{s.label}</div>
            <div className="tnum" style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700,
              color: s.hot ? "var(--money)" : "var(--ink)", marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {retailers.map((r: any) => <RetailerBadge key={r} id={r} size="sm" />)}
      </div>
    </div>
  );
}

/* community review snippet — ecommerce social proof */
function ReviewSnippet({ review, votes, trending }: any) {
  if (!review) return null;
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 18px",
      background: "var(--accent-soft)", borderRadius: 14, border: "1px solid var(--hairline)" }}>
      <span style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 999,
        background: "var(--surface)", color: "var(--accent)", flexShrink: 0,
        border: "1px solid var(--hairline)" }}>
        <Icon name="star" size={18} style={{ color: "var(--amber)" }} />
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 14, lineHeight: 1.45, color: "var(--ink)", fontWeight: 500, fontStyle: "italic" }}>
          "{review.text}"
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)" }}>— {review.author}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--muted)" }}>
            <Icon name="bolt" size={13} stroke={2} style={{ color: "var(--money)" }} />
            <span className="tnum" style={{ fontWeight: 600 }}>{votes}</span> found this twin helpful
          </span>
        </div>
      </div>
    </div>
  );
}

/* TwinCart — Twin Triptych: the signature hero component.
   Three linked panels (Best Exact · Best Value · Best Budget) joined by a violet "seam". */

function SeamNode({ active }: any) {
  // the connecting node sitting on the seam between panels
  return (
    <div className="twin-seam" style={{
      position: "absolute", top: "50%", left: "50%",
      transform: "translate(-50%,-50%)", zIndex: 3, pointerEvents: "none",
      width: 18, height: 18, borderRadius: 999,
      background: "var(--canvas)", border: "2px solid var(--accent)",
      display: "grid", placeItems: "center",
      boxShadow: "0 0 0 4px var(--accent-soft)",
      opacity: active ? 1 : 0, transition: "opacity .4s .5s ease",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent)" }} />
    </div>
  );
}

function TwinPanel({ p, icon, slotKind, elevated, onPick, animate, idx }: any) {
  const [h, setH] = useState(false);
  const [why, setWhy] = useState(false);
  const tone = matchTone(p.matchType);
  const isStop = /NOT COMPARABLE/.test(p.matchType);
  const slotColor = slotKind === "value" ? "var(--accent)" : slotKind === "budget"
    ? (isStop ? "var(--risk)" : "var(--amber)") : "var(--ink)";

  return (
    <div
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      onClick={onPick}
      className={animate ? "anim-fadeup" : undefined}
      style={{
        position: "relative", zIndex: elevated ? 2 : 1,
        boxSizing: "border-box",
        background: "var(--surface)",
        border: `1px solid ${elevated ? "var(--accent)" : "var(--hairline-2)"}`,
        borderRadius: 18, padding: "20px 18px 18px",
        boxShadow: elevated ? "var(--shadow-lg), inset 0 0 0 1px var(--accent)" : (h ? "var(--shadow-md)" : "var(--shadow-sm)"),
        transform: h ? "translateY(-3px)" : "none",
        transition: "transform .18s ease, box-shadow .18s ease",
        cursor: "pointer", display: "flex", flexDirection: "column", gap: 14,
        animationDelay: animate ? `${idx * 0.07}s` : undefined,
      }}
    >
      {/* Best Value ribbon */}
      {elevated && (
        <div style={{
          position: "absolute", top: -12, left: 20,
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 999, background: "var(--accent)", color: "#fff",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.03em", boxShadow: "var(--shadow-accent)",
          whiteSpace: "nowrap",
        }}>
          <Icon name="bolt" size={13} stroke={2.4} /> BEST VALUE
        </div>
      )}

      {/* product image with overlays */}
      <ProductImage icon={icon} img={p.image} tint={p.tint} height={172}>
        <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex",
          alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
            color: "#fff", background: slotColor, padding: "4px 9px", borderRadius: 999, whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>{p.slot}</span>
          <span style={{ background: "rgba(255,255,255,0.94)", borderRadius: 999, padding: "1px 2px" }}>
            <RetailerBadge id={p.retailer} size="sm" />
          </span>
        </div>
        {p.savingsAmt != null && (
          <div style={{ position: "absolute", bottom: 10, left: 10 }}>
            <SavingsPill amt={p.savingsAmt} pct={p.savingsPct} muted={isStop} size="sm" />
          </div>
        )}
      </ProductImage>

      {/* name + rating */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.name}</div>
        <div style={{ marginTop: 6 }}><Rating value={p.rating} count={p.reviews} /></div>
      </div>

      {/* price */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <div className="tnum" style={{ fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: 38, lineHeight: 0.95, color: "var(--ink)", letterSpacing: "-0.03em" }}>
          ${p.price}
        </div>
        {p.savingsAmt != null
          ? <SavingsPill amt={p.savingsAmt} pct={p.savingsPct} muted={isStop} />
          : <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", paddingBottom: 4 }}>reference price</span>}
      </div>

      {/* parity meter + similarity "why?" tooltip */}
      <div style={{ position: "relative" }} onMouseEnter={() => setWhy(true)} onMouseLeave={() => setWhy(false)}>
        <ParityMeter value={p.parity} matchType={p.matchType} animate={animate} delay={idx * 90} compact />
        <span style={{ position: "absolute", top: 0, right: 0, fontSize: 11, fontWeight: 600,
          color: "var(--accent)", cursor: "help" }}>why?</span>
        {why && (
          <div style={{ position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: 8, zIndex: 20,
            background: "var(--surface)", border: "1px solid var(--hairline-2)", borderRadius: 12,
            boxShadow: "var(--shadow-lg)", padding: "12px 14px", fontSize: 12.5, color: "var(--ink-soft)",
            pointerEvents: "none" }}>
            <div style={{ fontWeight: 700, color: "var(--ink)" }}>{p.parity}% {p.matchType}</div>
            {p.anchorKey && <div style={{ marginTop: 4 }}>How we matched: {p.anchorKey}</div>}
            {p.take && <div style={{ marginTop: 4, color: "var(--muted)" }}>{p.take}</div>}
            <div style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 6 }}>Functional parity = shared core specs &amp; use, scored by TwinCart AI.</div>
          </div>
        )}
      </div>

      {/* take */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", paddingTop: 2,
        borderTop: "1px solid var(--hairline)", marginTop: 2 }}>
        <span style={{ marginTop: 9, width: 14, flexShrink: 0, color: isStop ? "var(--risk)" : "var(--muted-2)" }}>
          <Icon name={isStop ? "alert" : "spark"} size={14} stroke={2} />
        </span>
        <p style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--ink-soft)", paddingTop: 6 }}>{p.take}</p>
      </div>

      {/* match chip */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600,
        color: tone === "risk" ? "var(--risk)" : tone === "amber" ? "var(--amber)" : tone === "accent" ? "var(--accent)" : "var(--muted)" }}>
        <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.03em", padding: "2px 7px", borderRadius: 6,
          background: tone === "risk" ? "var(--risk-soft)" : tone === "amber" ? "var(--amber-soft)" : tone === "accent" ? "var(--accent-soft)" : "var(--surface-3)" }}>
          {p.matchType}
        </span>
        <span style={{ color: "var(--muted-2)", fontWeight: 500, fontSize: 10.5, whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis" }}>{p.anchorKey}</span>
      </div>

      {/* retailer deep link */}
      {p.url && <div style={{ marginTop: 2 }}><RetailerLink url={p.url} retailer={p.retailer} full /></div>}
    </div>
  );
}

function TwinTriptych({ cluster, animate = true, onPick, picked }: any) {
  const [seam, setSeam] = useState(!animate);
  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => setSeam(true), 120);
    return () => clearTimeout(t);
  }, [animate]);

  const { exact, value, budget } = cluster.products;
  // If the user clicked a price that isn't one of the 3 picks, it REPLACES the budget slot.
  const isOneOf3 = picked && [exact, value, budget].some((p: any) => p && p.name === picked.name && p.retailer === picked.retailer);
  const budgetSlot = picked && !isOneOf3
    ? { ...picked, slot: "Your Pick", savingsAmt: picked.savingsAmt ?? Math.max(0, Math.round(exact.price - picked.price)) }
    : budget;
  const slots = [
    { key: "exact", p: exact, kind: "exact" },
    { key: "value", p: value, kind: "value" },
    { key: "budget", p: budgetSlot, kind: picked && !isOneOf3 ? "picked" : "budget" },
  ];

  return (
    <div style={{ position: "relative" }}>
      {/* the twin seam — draws in horizontally */}
      <div className="twin-seam" style={{
        position: "absolute", top: "50%", left: "8%", right: "8%", height: 3, zIndex: 0,
        background: "linear-gradient(90deg, var(--hairline-2), var(--accent), var(--hairline-2))",
        transform: seam ? "scaleX(1)" : "scaleX(0)", transformOrigin: "center",
        transition: "transform .7s cubic-bezier(.6,.05,.2,1)", borderRadius: 2,
      }} />
      <SeamNode active={seam} />

      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 14, zIndex: 1, alignItems: "stretch" }} className="triptych-grid">
        {slots.map((s, i) => (
          <TwinPanel key={s.key} p={s.p} icon={cluster.icon} slotKind={s.kind}
            elevated={s.kind === "value"} animate={animate} idx={i}
            onPick={() => onPick && onPick(cluster)} />
        ))}
      </div>
    </div>
  );
}

/* TwinCart — Screen 1 (Home) + Screen 2 (Results) */

/* ───────────────── Search bar ───────────────── */
function SearchBar({ value, onChange, onSubmit, size = "lg", autoFocus }: any) {
  const ref = useRef<any>(null);
  useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, [autoFocus]);
  const lg = size === "lg";
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
        background: "var(--surface)", border: "1.5px solid var(--hairline-2)", borderRadius: 999,
        padding: lg ? "8px 8px 8px 22px" : "6px 6px 6px 16px", boxShadow: "var(--shadow-md)",
        transition: "border-color .15s" }}
      onFocusCapture={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onBlurCapture={(e) => (e.currentTarget.style.borderColor = "var(--hairline-2)")}>
      <Icon name="search" size={lg ? 22 : 18} stroke={2} style={{ color: "var(--muted)" }} />
      <input ref={ref} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="Search a product — find its smartest cheaper twin"
        style={{ flex: 1, border: "none", outline: "none", background: "transparent",
          fontFamily: "var(--font-body)", fontSize: lg ? 17 : 15, fontWeight: 500, color: "var(--ink)",
          minWidth: 0 }} />
      <Btn variant="primary" size={lg ? "md" : "sm"} iconRight="arrow"
        onClick={() => onSubmit(value)} style={{ flexShrink: 0 }}>Find twins</Btn>
    </form>
  );
}

/* ───────────────── Query chips ───────────────── */
function QueryChips({ onPick, active }: any) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
      {CHIPS.map((c) => {
        const live = QUERIES.includes(c);
        const isActive = active === c;
        return (
          <button key={c} onClick={() => live && onPick(c)} disabled={!live}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px",
              borderRadius: 999, fontSize: 13.5, fontWeight: 600,
              background: isActive ? "var(--ink)" : "var(--surface)",
              color: isActive ? "#fff" : live ? "var(--ink-soft)" : "var(--muted-2)",
              border: `1px solid ${isActive ? "var(--ink)" : "var(--hairline-2)"}`,
              cursor: live ? "pointer" : "not-allowed", transition: "all .14s ease",
              opacity: live ? 1 : 0.7 }}
            onMouseEnter={(e) => { if (live && !isActive) e.currentTarget.style.borderColor = "var(--accent)"; }}
            onMouseLeave={(e) => { if (live && !isActive) e.currentTarget.style.borderColor = "var(--hairline-2)"; }}>
            {live && <span style={{ width: 6, height: 6, borderRadius: 999,
              background: isActive ? "var(--accent)" : "var(--money)" }} />}
            {c}
          </button>
        );
      })}
    </div>
  );
}

function TrustStrap({ center }: any) {
  const items = [
    { icon: "shield", label: "UCP-compatible" },
    { icon: "seal", label: "AP2-signed checkout" },
    { icon: "twins", label: "5 retailers" },
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: center ? "center" : "flex-start" }}>
      {items.map((it) => (
        <span key={it.label} style={{ display: "inline-flex", alignItems: "center", gap: 7,
          fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>
          <Icon name={it.icon} size={15} stroke={1.9} style={{ color: "var(--trust)" }} /> {it.label}
        </span>
      ))}
    </div>
  );
}

/* ───────────────── Screen 1 — Home ───────────────── */
/* Compact trending chips — a few high-signal categories under the search bar (not a 24-pill wall) */
function TrendingChips({ onPick }: any) {
  const top = QUERIES.slice(0, 6);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted-2)" }}>Trending</span>
      {top.map((c: any) => (
        <button key={c} onClick={() => onPick(c)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px",
            borderRadius: 999, fontSize: 13, fontWeight: 600, background: "var(--surface)",
            color: "var(--ink-soft)", border: "1px solid var(--hairline-2)", cursor: "pointer",
            transition: "border-color .14s ease", textTransform: "capitalize" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--hairline-2)")}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--money)" }} />{c}
        </button>
      ))}
    </div>
  );
}

/* One browse tile: AI studio image + category + savings + retailer count. Click → results. */
function CategoryTile({ cat, onPick, idx }: any) {
  const [h, setH] = useState(false);
  return (
    <button onClick={() => onPick(cat.query)} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className="anim-fadeup"
      style={{ display: "flex", flexDirection: "column", textAlign: "left", overflow: "hidden",
        background: "var(--surface)", border: `1px solid ${h ? "var(--accent)" : "var(--hairline-2)"}`,
        borderRadius: 16, cursor: "pointer", boxShadow: h ? "var(--shadow-md)" : "var(--shadow-sm)",
        transform: h ? "translateY(-3px)" : "none", transition: "all .16s ease",
        animationDelay: `${(idx % 12) * 0.03}s` }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "var(--surface-3)" }}>
        {cat.img
          ? <img src={px(cat.img)} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--muted-2)" }}><Icon name="box" size={34} stroke={1.4} /></div>}
        {cat.maxSavingsPct > 0 && (
          <span className="tnum" style={{ position: "absolute", top: 9, left: 9, fontSize: 11.5, fontWeight: 700,
            color: "#fff", background: "var(--accent)", padding: "3px 9px", borderRadius: 999,
            boxShadow: "var(--shadow-accent)" }}>up to {cat.maxSavingsPct}% off</span>
        )}
      </div>
      <div style={{ padding: "12px 13px 14px" }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)", textTransform: "capitalize",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat.query}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
          {cat.listings} listings · {cat.retailers} retailers
        </div>
      </div>
    </button>
  );
}

function HomeScreen({ onSearch }: any) {
  const [q, setQ] = useState("");
  // Rotating cinematic hero banners (Gemini). Fall back to the single banner, then to nothing.
  const banners: string[] = ((HERO_IMAGES as any).__banners && (HERO_IMAGES as any).__banners.length)
    ? (HERO_IMAGES as any).__banners
    : ((HERO_IMAGES as any).__banner ? [(HERO_IMAGES as any).__banner] : []);
  const topSave = CATEGORY_CARDS.reduce((m: number, c: any) => Math.max(m, c.maxSavingsPct || 0), 0) || 90;
  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % banners.length), 3800);
    return () => clearInterval(t);
  }, [banners.length]);
  return (
    <div className="anim-fadein" style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "0 28px" }}>
      {/* hero — text + search on the left, savings mosaic on the right */}
      <section style={{ display: "grid", gridTemplateColumns: banners.length ? "minmax(0,1.05fr) minmax(0,0.95fr)" : "1fr",
        gap: 40, alignItems: "center", paddingTop: 44, paddingBottom: 40 }} className="home-hero">
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 13px",
            borderRadius: 999, background: "var(--accent-soft)", color: "var(--accent-deep)",
            fontSize: 12.5, fontWeight: 600, marginBottom: 20, whiteSpace: "nowrap" }}>
            <Icon name="twins" size={15} stroke={2.2} /> The cross-marketplace twin-finder
          </div>
          <h1 style={{ fontSize: "clamp(34px, 4.6vw, 56px)", fontWeight: 700, lineHeight: 1.03, color: "var(--ink)" }}>
            Find the twin.<br /><span style={{ color: "var(--accent)" }}>Pay the smart price.</span>
          </h1>
          <p style={{ fontSize: "clamp(15px, 1.6vw, 18px)", lineHeight: 1.5, color: "var(--muted)",
            maxWidth: 520, marginTop: 16 }}>
            The same product — or its smartest cheaper twin — across Amazon, Temu, SHEIN, Walmart &amp; Target,
            with the proof of <em style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>why</em> they're equivalent.
          </p>
          <div style={{ marginTop: 24 }}>
            <SearchBar value={q} onChange={setQ} onSubmit={(v: any) => onSearch(v || QUERIES[0])} autoFocus />
          </div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            <TrendingChips onPick={onSearch} />
            <TrustStrap />
          </div>
        </div>

        {banners.length > 0 && (
          <div className="home-hero-img" style={{ position: "relative", borderRadius: 22, overflow: "hidden",
            boxShadow: "var(--shadow-lg)", aspectRatio: "16 / 11", background: "var(--surface-3)" }}>
            {/* cross-fading rotating banners */}
            {banners.map((src: string, i: number) => (
              <img key={src} src={src} alt="" draggable={false}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
                  opacity: i === heroIdx ? 1 : 0, transition: "opacity .9s ease" }} />
            ))}
            {/* value-prop pill */}
            <div style={{ position: "absolute", left: 14, bottom: 14, display: "inline-flex", alignItems: "center", gap: 7,
              fontSize: 12, fontWeight: 700, color: "var(--ink)", background: "rgba(255,255,255,0.92)",
              padding: "6px 12px", borderRadius: 999, boxShadow: "var(--shadow-sm)", backdropFilter: "blur(4px)" }}>
              <Icon name="twins" size={14} stroke={2.2} style={{ color: "var(--accent)" }} /> Same product · up to {topSave}% less
            </div>
            {/* dots */}
            {banners.length > 1 && (
              <div style={{ position: "absolute", right: 14, bottom: 16, display: "flex", gap: 6 }}>
                {banners.map((_: string, i: number) => (
                  <button key={i} onClick={() => setHeroIdx(i)} aria-label={`Hero ${i + 1}`}
                    style={{ width: i === heroIdx ? 18 : 7, height: 7, borderRadius: 999, border: "none", cursor: "pointer",
                      background: i === heroIdx ? "var(--accent)" : "rgba(255,255,255,0.8)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)", transition: "all .25s" }} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* category browse grid — every real category, one click away */}
      <section style={{ paddingBottom: 72 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between",
          gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>Browse every twin</h2>
          <span className="tnum" style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 500 }}>
            {CATEGORY_CARDS.length} categories · {CATEGORY_CARDS.reduce((n: number, c: any) => n + c.listings, 0)} listings · 5 retailers
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 16 }}>
          {CATEGORY_CARDS.map((cat: any, i: number) => (
            <CategoryTile key={cat.query} cat={cat} onPick={onSearch} idx={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ───────────────── Results filters ───────────────── */
function FilterBar({ filters, setFilters }: any) {
  const groups = [
    { key: "match", label: "Match", opts: ["All", "Exact", "Twin", "Budget"] },
    { key: "retailer", label: "Retailer", opts: ["All", "Amazon", "Walmart", "Target", "SHEIN", "Temu"] },
    { key: "sort", label: "Sort", opts: ["Best value", "Biggest savings", "Lowest price"] },
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13,
        fontWeight: 600, color: "var(--muted)" }}>
        <Icon name="filter" size={16} stroke={2} /> Filter
      </span>
      {groups.map((g) => (
        <div key={g.key} style={{ display: "flex", gap: 5, padding: 4, borderRadius: 999,
          background: "var(--surface-3)", border: "1px solid var(--hairline)" }}>
          {g.opts.map((o) => {
            const on = (filters[g.key] || g.opts[0]) === o;
            return (
              <button key={o} onClick={() => setFilters({ ...filters, [g.key]: o })}
                style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                  background: on ? "var(--surface)" : "transparent",
                  color: on ? "var(--ink)" : "var(--muted)",
                  boxShadow: on ? "var(--shadow-sm)" : "none", transition: "all .12s" }}>
                {o}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ───────────────── Results cluster card ───────────────── */
function ClusterCard({ cluster, onOpenCluster, onCheckout, onReport, onAdd, onWish, wishlist, lead }: any) {
  const [showAll, setShowAll] = useState(!!lead);
  const [activeImg, setActiveImg] = useState(0);
  const [picked, setPicked] = useState<any>(null);
  const captions = cluster.offers.map((o: any) => `${RETAILERS[o.retailer]?.name ?? o.retailer} · ${o.name}`);
  // one image per offer, aligned 1:1 with captions & spectrum nodes so clicking a price swaps the image
  // One image per offer, 1:1 with captions & spectrum nodes so clicking a price swaps to THAT
  // offer's image. Offers missing an image fall back to a hero, never collapsing the alignment.
  const heroPool = (cluster.heroImages && cluster.heroImages.length ? cluster.heroImages : []);
  const carouselImgs = cluster.offers.map((o: any, k: number) => o.image || heroPool[k % (heroPool.length || 1)] || heroPool[0]).filter(Boolean);
  const prices = cluster.offers.map((o: any) => o.price);
  const lo = Math.min(...prices), hi = Math.max(...prices);
  const retailers = new Set(cluster.offers.map((o: any) => o.retailer)).size;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--hairline-2)",
      borderRadius: 24, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>

      {/* ── CLUSTER IDENTITY BAND — one product, many sources ── */}
      <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0,1fr)", gap: 24,
        padding: 22, background: "var(--surface-2)", borderBottom: "1px solid var(--hairline)" }}
        className="cluster-identity">
        {/* carousel */}
        <div style={{ position: "relative" }}>
          <ImageCarousel icon={cluster.icon} images={carouselImgs} captions={captions}
            index={activeImg} setIndex={setActiveImg} height={300}>
            {cluster.trending && (
              <span style={{ position: "absolute", top: 12, left: 12, zIndex: 5, display: "inline-flex",
                alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#fff",
                background: "var(--accent)", padding: "4px 10px", borderRadius: 999,
                boxShadow: "var(--shadow-accent)" }}>
                <Icon name="bolt" size={12} stroke={2.4} /> {cluster.trending}
              </span>
            )}
          </ImageCarousel>
        </div>

        {/* identity + spectrum */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5,
                fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--accent)",
                marginBottom: 8 }}>
                <Icon name="twins" size={14} stroke={2.2} /> One product · {cluster.offers.length} sources
              </div>
              <h3 style={{ fontSize: 25, fontWeight: 700, color: "var(--ink)", lineHeight: 1.1 }}>{cluster.title}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>{cluster.category}</span>
                <span style={{ width: 3, height: 3, borderRadius: 999, background: "var(--muted-2)" }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Rating value={cluster.products.value.rating} />
                </span>
                <span style={{ width: 3, height: 3, borderRadius: 999, background: "var(--muted-2)" }} />
                <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                  ${lo}–${hi}
                </span>
                <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: "var(--money)" }}>
                  · up to {cluster.maxSavingsPct}% off
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn variant="ghost" size="sm" icon="scale" onClick={() => onOpenCluster(cluster)}>Compare</Btn>
              <Btn variant="primary" size="sm" icon="shield" onClick={() => onCheckout(cluster)}>Prepare checkout</Btn>
            </div>
          </div>

          {/* the twin spectrum — the cluster aha */}
          <TwinSpectrum cluster={cluster} onPick={onOpenCluster} onAdd={onAdd}
            onSelectImage={setActiveImg} onPickOffer={(o: any) => setPicked(o)} />
        </div>
      </div>

      {/* ── body ── */}
      <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Smart picks — the triptych */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Icon name="spark" size={15} stroke={2} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
              color: "var(--ink-soft)" }}>TwinCart's smart picks</span>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>· the 3 we'd buy</span>
          </div>
          <TwinTriptych cluster={cluster} onPick={onOpenCluster} picked={picked} />
        </div>

        {/* Aggregated offers */}
        <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 18 }}>
          <button onClick={() => setShowAll((s) => !s)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, marginBottom: showAll ? 16 : 0 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: 8,
                background: "var(--surface-3)", color: "var(--ink-soft)" }}><Icon name="filter" size={16} stroke={2} /></span>
              <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>
                Every offer · {cluster.offers.length} listings across {retailers} retailers
              </span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600,
              color: "var(--accent)" }}>
              {showAll ? "Hide" : "Show all"}
              <span style={{ transform: showAll ? "rotate(180deg)" : "none", transition: "transform .2s", display: "grid" }}>
                <Icon name="chevdown" size={16} stroke={2.2} />
              </span>
            </span>
          </button>

          {showAll && (
            <div className="anim-fadein" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <OffersGrid cluster={cluster} onAdd={onAdd} onWish={onWish} wishlist={wishlist} />
              <ReviewSnippet review={cluster.review} votes={cluster.votes} trending={cluster.trending} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Screen 2 — Results ───────────────── */
function ResultsScreen({ query, onSearch, onOpenCluster, onCheckout, onReport, onAdd, onWish, wishlist }: any) {
  const [q, setQ] = useState(query);
  const [filters, setFilters] = useState<any>({});
  const [layout, setLayout] = useState("cards");
  useEffect(() => { setQ(query); }, [query]);
  const clusters = CLUSTERS.filter((c) => c.query === query);
  const totalListings = clusters.reduce((n, c) => n + c.offers.length, 0);

  // No matches — show a friendly empty state with suggested searches (don't silently fake a result)
  if (clusters.length === 0) {
    return (
      <div className="anim-fadein" style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "28px 28px 80px" }}>
        <div style={{ maxWidth: 680, marginBottom: 28 }}>
          <SearchBar value={q} onChange={setQ} onSubmit={(v: any) => onSearch(v || query)} size="md" />
        </div>
        <div style={{ textAlign: "center", padding: "70px 20px" }}>
          <div style={{ display: "inline-grid", placeItems: "center", width: 64, height: 64, borderRadius: 18,
            background: "var(--surface-3)", color: "var(--muted-2)", marginBottom: 18 }}>
            <Icon name="search" size={30} stroke={1.6} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>
            No twins found for "<span style={{ color: "var(--accent)" }}>{query}</span>"
          </h1>
          <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 26 }}>
            We aggregate {QUERIES.length}+ live product categories. Try one of these:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 620, margin: "0 auto" }}>
            {CHIPS.slice(0, 10).map((c: any) => (
              <button key={c} onClick={() => onSearch(c)} style={{
                padding: "9px 16px", borderRadius: 999, border: "1px solid var(--hairline-2)",
                background: "var(--surface)", fontSize: 13.5, fontWeight: 600, color: "var(--ink)",
                cursor: "pointer", textTransform: "capitalize" }}>{c}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="anim-fadein" style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "28px 28px 80px" }}>
      <div style={{ maxWidth: 680, marginBottom: 22 }}>
        <SearchBar value={q} onChange={setQ} onSubmit={(v: any) => onSearch(v || query)} size="md" />
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: "var(--ink)" }}>
          Twins for <span style={{ color: "var(--accent)" }}>"{query}"</span>
        </h1>
        <span className="tnum" style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500 }}>
          {clusters.length} product clusters · {totalListings} listings aggregated across 5 retailers
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        marginBottom: 26, flexWrap: "wrap" }}>
        <FilterBar filters={filters} setFilters={setFilters} />
        {/* Cards / List layout toggle */}
        <div style={{ display: "flex", gap: 5, padding: 4, borderRadius: 999,
          background: "var(--surface-3)", border: "1px solid var(--hairline)" }}>
          {[["cards", "scale"], ["list", "filter"]].map(([mode, ic]) => {
            const on = layout === mode;
            return (
              <button key={mode} onClick={() => setLayout(mode)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999,
                  fontSize: 12.5, fontWeight: 600, textTransform: "capitalize",
                  background: on ? "var(--surface)" : "transparent", color: on ? "var(--ink)" : "var(--muted)",
                  boxShadow: on ? "var(--shadow-sm)" : "none", transition: "all .12s" }}>
                <Icon name={ic} size={15} stroke={2} /> {mode}
              </button>
            );
          })}
        </div>
      </div>

      {layout === "cards" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {clusters.map((c, i) => (
            <div key={c.id} className="anim-fadeup" style={{ animationDelay: `${i * 0.06}s` }}>
              <ClusterCard cluster={c} onOpenCluster={onOpenCluster} lead={i === 0}
                onCheckout={onCheckout} onReport={onReport}
                onAdd={onAdd} onWish={onWish} wishlist={wishlist} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {clusters.map((c, i) => (
            <ClusterList key={c.id} cluster={c} onOpenCluster={onOpenCluster}
              onCheckout={onCheckout} onAdd={onAdd} onWish={onWish} wishlist={wishlist} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────── List layout: one product per row (vertical column) ───────────────── */
function ListRow({ p, icon, onAdd }: any) {
  const [h, setH] = useState(false);
  const stop = /NOT COMPARABLE/.test(p.matchType || "");
  const tone = matchTone(p.matchType || "");
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px",
        background: "var(--surface)", border: `1px solid ${p.tag === "value" ? "var(--accent)" : "var(--hairline-2)"}`,
        borderRadius: 14, boxShadow: h ? "var(--shadow-md)" : "var(--shadow-sm)", transition: "box-shadow .15s" }}>
      <Thumb icon={icon} img={p.image} retailer={p.retailer} size={64} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          {p.tag && <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
            color: "#fff", background: p.tag === "value" ? "var(--accent)" : p.tag === "budget" ? "var(--amber)" : "var(--ink)",
            padding: "2px 7px", borderRadius: 999 }}>{p.slot || p.tag}</span>}
          <RetailerBadge id={p.retailer} size="sm" />
          <span className="mono" style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 5,
            color: stop ? "var(--risk)" : tone === "amber" ? "var(--amber)" : "var(--accent)",
            background: stop ? "var(--risk-soft)" : tone === "amber" ? "var(--amber-soft)" : "var(--accent-soft)" }}>
            {p.parity}% {stop ? "· not a twin" : "twin"}
          </span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.name}</div>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Rating value={p.rating} count={p.reviews} />
          <ShippingLine text={p.shipping} tone={p.shippingTone} />
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div className="tnum" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24,
          color: "var(--ink)", lineHeight: 1 }}>${p.price}</div>
        {p.savingsAmt != null
          ? <div className="tnum" style={{ fontSize: 12, fontWeight: 700, color: stop ? "var(--muted)" : "var(--money)", marginTop: 4 }}>
              Save ${p.savingsAmt} ({p.savingsPct}%)</div>
          : <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginTop: 4 }}>reference</div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, flexShrink: 0, width: 132 }}>
        <RetailerLink url={p.url} retailer={p.retailer} compact full />
        <Btn variant={p.tag === "value" ? "primary" : "soft"} size="sm" icon="cart" full
          onClick={() => onAdd && onAdd(p)}>Add</Btn>
      </div>
    </div>
  );
}

function ClusterList({ cluster, onOpenCluster, onCheckout, onAdd }: any) {
  const prices = cluster.offers.map((o: any) => o.price);
  const lo = Math.min(...prices), hi = Math.max(...prices);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Thumb icon={cluster.icon} img={cluster.heroImages?.[0]} size={44} tone="var(--accent)" />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", lineHeight: 1.15 }}>{cluster.title}</div>
            <div className="tnum" style={{ fontSize: 12.5, color: "var(--muted)" }}>
              {cluster.offers.length} listings · ${lo}–${hi} ·
              <span style={{ color: "var(--money)", fontWeight: 700 }}> up to {cluster.maxSavingsPct}% off</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" size="sm" icon="scale" onClick={() => onOpenCluster(cluster)}>Compare</Btn>
          <Btn variant="primary" size="sm" icon="shield" onClick={() => onCheckout(cluster)}>Prepare checkout</Btn>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {cluster.offers.map((o: any, i: number) => (
          <ListRow key={(o.retailer || "") + (o.name || "") + i} p={o} icon={cluster.icon} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
}

/* TwinCart — Screen 3: Cluster Detail / Compare */

function cellTone(tone: any) {
  return tone === "good" ? "var(--money)" : tone === "warn" ? "var(--amber)"
    : tone === "stop" ? "var(--risk)" : "var(--ink-soft)";
}

/* compare table row */
function CompareRow({ row, expanded }: any) {
  const cols = ["exact", "value", "budget"];
  const cellStyle = (i: any, highlight?: any): any => ({
    padding: "14px 18px", fontSize: 14, fontWeight: row.kind === "price" ? 700 : 500,
    fontFamily: row.kind === "price" ? "var(--font-display)" : "var(--font-body)",
    textAlign: "left", verticalAlign: "middle",
    background: i === 1 ? "var(--accent-soft)" : "transparent",
    borderLeft: i === 1 ? "1px solid var(--accent)" : "none",
    borderRight: i === 1 ? "1px solid var(--accent)" : "none",
  });
  return (
    <tr style={{ borderTop: "1px solid var(--hairline)" }}>
      <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 600, color: "var(--muted)",
        whiteSpace: "nowrap" }}>{row.label}</td>
      {cols.map((c, i) => {
        const v = row[c];
        const matched = row.match ? row.match[i] : null;
        const tone = row.tone ? cellTone(row.tone[i]) : "var(--ink-soft)";
        return (
          <td key={c} className={row.kind === "price" || row.kind === "parity" ? "tnum" : ""}
            style={{ ...cellStyle(i), color: row.kind === "price" ? "var(--ink)" : tone }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              {matched === true && <Icon name="check" size={15} stroke={2.6} style={{ color: "var(--money)" }} />}
              {matched === false && <Icon name="x" size={14} stroke={2.6} style={{ color: "var(--muted-2)" }} />}
              {v}
            </span>
          </td>
        );
      })}
    </tr>
  );
}

function ColHead({ p, kind, icon }: any) {
  const elevated = kind === "value";
  const isStop = /NOT COMPARABLE/.test(p.matchType);
  return (
    <th style={{ padding: "16px 18px", textAlign: "left", verticalAlign: "top",
      background: elevated ? "var(--accent-soft)" : "transparent",
      borderLeft: elevated ? "1px solid var(--accent)" : "none",
      borderRight: elevated ? "1px solid var(--accent)" : "none",
      borderTopLeftRadius: elevated ? 12 : 0, borderTopRightRadius: elevated ? 12 : 0 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
          color: elevated ? "var(--accent-deep)" : isStop ? "var(--risk)" : "var(--ink)" }}>{p.slot}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Thumb icon={icon} img={p.image} retailer={p.retailer} size={40} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.25 }}>{p.name}</div>
            <div style={{ marginTop: 4 }}><RetailerBadge id={p.retailer} size="sm" /></div>
          </div>
        </div>
      </div>
    </th>
  );
}

/* AI verdict block — the emotional payload */
function VerdictBlock({ text }: any) {
  return (
    <div style={{ position: "relative", paddingLeft: 24 }}>
      <div style={{ position: "absolute", left: 0, top: 4, bottom: 4, width: 4, borderRadius: 4,
        background: "linear-gradient(var(--accent), var(--trust))" }} />
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: 999,
          background: "var(--ink)", color: "#fff" }}><Icon name="spark" size={16} stroke={2} /></span>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
          color: "var(--ink)" }}>TwinCart's verdict</span>
      </div>
      <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(20px, 2.4vw, 26px)", fontWeight: 500,
        lineHeight: 1.4, color: "var(--ink)", letterSpacing: "-0.01em", textWrap: "pretty", maxWidth: 760 }}>
        {text}
      </p>
    </div>
  );
}

/* matched-attributes chips */
function MatchedAttrs({ attrs, parity }: any) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: 16,
      padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Why it's a twin</span>
        <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{parity}% parity</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, lineHeight: 1.4 }}>
        Matched attributes powering the Value Score — every point is defensible, not a black box.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {attrs.map((a: any) => (
          <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 11px",
            borderRadius: 999, background: "var(--accent-soft)", color: "var(--accent-deep)",
            fontSize: 12, fontWeight: 600 }}>
            <Icon name="check" size={13} stroke={2.6} /> {a}
          </span>
        ))}
      </div>
    </div>
  );
}

/* price-history sparkline */
function Sparkline({ seed = 1 }: any) {
  const pts = [62, 58, 60, 54, 49, 52, 47, 45, 46, 44, 41, 40];
  const w = 240, h = 56, max = Math.max(...pts), min = Math.min(...pts);
  const path = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * (h - 8) - 4;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: 16, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Best-value price history</span>
        <span className="tnum" style={{ fontSize: 12, fontWeight: 600, color: "var(--money)" }}>↓ 35% / 90d</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
        <path d={`${path} L${w},${h} L0,${h} Z`} fill="var(--accent-soft)" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={w} cy={h - 4} r="3.5" fill="var(--accent)" />
      </svg>
    </div>
  );
}

/* Screen 3 */
function CompareScreen({ cluster, onBack, onCheckout, onReport, onAdd, onWish, wishlist }: any) {
  const [watch, setWatch] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const captions = cluster.offers.map((o: any) => `${RETAILERS[o.retailer]?.name ?? o.retailer} · ${o.name}`);
  // one image per offer, aligned 1:1 with captions & spectrum nodes so clicking a price swaps the image
  // One image per offer, 1:1 with captions & spectrum nodes so clicking a price swaps to THAT
  // offer's image. Offers missing an image fall back to a hero, never collapsing the alignment.
  const heroPool = (cluster.heroImages && cluster.heroImages.length ? cluster.heroImages : []);
  const carouselImgs = cluster.offers.map((o: any, k: number) => o.image || heroPool[k % (heroPool.length || 1)] || heroPool[0]).filter(Boolean);
  const { exact, value, budget } = cluster.products;
  const rows = cluster.compareRows || [];

  return (
    <div className="anim-fadein" style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "22px 28px 80px" }}>
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 7,
        fontSize: 13.5, fontWeight: 600, color: "var(--muted)", marginBottom: 18 }}>
        <Icon name="back" size={17} stroke={2} /> Back to results
      </button>

      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 20, flexWrap: "wrap", marginBottom: 26 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Thumb icon={cluster.icon} img={cluster.heroImages?.[0]} size={60} tone="var(--accent)" />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)", marginBottom: 5 }}>
              {cluster.category}
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--ink)", lineHeight: 1.05 }}>{cluster.title}</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          <Btn variant={watch ? "soft" : "ghost"} size="md" icon={watch ? "check" : "star"}
            onClick={() => setWatch(!watch)}>{watch ? "Watching" : "Watch price"}</Btn>
          <Btn variant="ghost" size="md" icon="doc" onClick={() => onReport(cluster)}>Save report</Btn>
          <Btn variant="primary" size="md" icon="shield" onClick={() => onCheckout(cluster)}>Prepare checkout</Btn>
        </div>
      </div>

      {/* cluster identity band — carousel + spectrum */}
      <div style={{ display: "grid", gridTemplateColumns: "360px minmax(0,1fr)", gap: 24,
        marginBottom: 28, alignItems: "stretch" }} className="cluster-identity">
        <ImageCarousel icon={cluster.icon} images={carouselImgs} captions={captions}
          index={activeImg} setIndex={setActiveImg} height={262} />
        <TwinSpectrum cluster={cluster} onPick={() => {}} onAdd={onAdd} onSelectImage={setActiveImg} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 28,
        alignItems: "start" }} className="compare-grid">
        {/* main column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* comparison table */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--hairline-2)",
            borderRadius: 20, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead><tr>
                  <th style={{ padding: "16px 18px", textAlign: "left", width: 120 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>Attribute</span>
                  </th>
                  <ColHead p={exact} kind="exact" icon={cluster.icon} />
                  <ColHead p={value} kind="value" icon={cluster.icon} />
                  <ColHead p={budget} kind="budget" icon={cluster.icon} />
                </tr></thead>
                <tbody>
                  {rows.map((r: any) => <CompareRow key={r.label} row={r} />)}
                </tbody>
              </table>
            </div>
          </div>

          {/* All offers in this cluster */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--hairline-2)",
            borderRadius: 20, padding: "22px 22px 24px", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Icon name="filter" size={17} stroke={2} style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
                  All {cluster.offers.length} offers in this cluster
                </span>
              </div>
              <span style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>
                Sorted by Value Score
              </span>
            </div>
            <OffersGrid cluster={cluster} onAdd={onAdd} onWish={onWish} wishlist={wishlist} columns={2} />
          </div>

          {/* AI verdict */}
          <div style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)",
            borderRadius: 20, padding: "28px 28px 30px" }}>
            <VerdictBlock text={cluster.verdict} />
            <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
              <Btn variant="primary" icon="shield" onClick={() => onCheckout(cluster)}>
                Prepare agent checkout
              </Btn>
              <Btn variant="ghost" icon="doc" onClick={() => onReport(cluster)}>Save savings report</Btn>
            </div>
          </div>
        </div>

        {/* sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <MatchedAttrs attrs={cluster.matchedAttrs} parity={value.parity} />
          <Sparkline />
          <div style={{ background: "var(--trust-soft)", border: "1px solid #cfe0fd", borderRadius: 16,
            padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
              <Icon name="shield" size={18} stroke={2} style={{ color: "var(--trust)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--trust)" }}>Safe to check out</span>
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-soft)" }}>
              Checkout runs on a UCP-conformant session with an AP2-signed mandate and your guardrails.
              Final payment always needs your approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* TwinCart — Screen 4 (Agent Checkout) + Screen 5 (Saved Report) */

/* mandate snippet generator */
function buildMandate(p: any, cluster: any) {
  return {
    vct: "mandate.checkout.1",
    alg: "ES256",
    iss: "twincart.platform",
    checkout: {
      allowed_merchants: [p.retailer + ".ucp"],
      line_items: [{ name: p.name, qty: 1, unit_price: p.price, currency: "USD" }],
    },
    payment: {
      vct: "mandate.payment.1",
      amount_range: { max: Math.ceil(p.price + 1), currency: "USD" },
      allowed_payees: [p.retailer + ".ucp"],
      reference: "chk_" + cluster.id.slice(0, 6),
    },
    constraints: { requires_final_approval: true },
    iat: 1780000000,
  };
}

/* guardrail chip */
function Guard({ icon, label, value, tone }: any) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 13px",
      borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)" }}>
      <Icon name={icon} size={16} stroke={2} style={{ color: tone || "#fff", opacity: 0.9, flexShrink: 0 }} />
      <div style={{ minWidth: 0, overflow: "hidden" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)",
          textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{label}</div>
        <div className="tnum" style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>{value}</div>
      </div>
    </div>
  );
}

/* UCP/AP2 trust panel — the digital passport */
function TrustPanel({ p, cluster }: any) {
  const mandate = buildMandate(p, cluster);
  const json = JSON.stringify(mandate, null, 2);
  return (
    <div style={{ background: "linear-gradient(160deg, #18213b, #0e1325)", borderRadius: 20,
      padding: 22, color: "#fff", position: "relative", overflow: "hidden",
      border: "1px solid rgba(43,89,195,0.4)" }}>
      {/* perforated passport edge */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2,
        background: "repeating-linear-gradient(#fff 0 6px, transparent 6px 14px)", opacity: 0.18 }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 10,
            background: "rgba(43,89,195,0.3)", border: "1px solid rgba(120,160,255,0.4)" }}>
            <Icon name="seal" size={19} stroke={1.8} style={{ color: "#9DBBFF" }} />
          </span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>AP2 Checkout Mandate</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>ES256 signed · UCP-conformant</div>
          </div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px",
          borderRadius: 999, background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.4)",
          fontSize: 11.5, fontWeight: 700, color: "#5ee08e" }}>
          <Icon name="check-circle" size={14} stroke={2.2} /> Verified
        </span>
      </div>

      {/* guardrail chips */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 16 }}>
        <Guard icon="tag" label="Brand" value={p.name.split(" ").slice(0, 2).join(" ")} />
        <Guard icon="bolt" label="Max spend" value={`$${Math.ceil(p.price + 1)}`} tone="#5ee08e" />
        <Guard icon="cart" label="Merchant" value={RETAILERS[p.retailer].name} />
        <Guard icon="lock" label="Approval" value="Required" tone="#FFCB6B" />
      </div>

      {/* mandate snippet */}
      <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: 12, padding: "12px 14px",
        border: "1px solid rgba(255,255,255,0.1)", maxHeight: 168, overflow: "auto" }}>
        <pre className="mono" style={{ margin: 0, fontSize: 10.5, lineHeight: 1.55,
          color: "#A9C2FF", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{json}</pre>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12,
        fontSize: 11.5, color: "rgba(255,255,255,0.6)" }}>
        <Icon name="link" size={14} stroke={2} style={{ color: "#9DBBFF" }} />
        Verified against a live UCP merchant · <span style={{ color: "#9DBBFF" }}>puddingheroes.com</span>
      </div>
    </div>
  );
}

const STEPS = [
  { label: "Opening merchant", sub: "Establishing UCP session", icon: "link" },
  { label: "Verifying product", sub: "Matching listing to your twin", icon: "check-circle" },
  { label: "Checking price", sub: "Confirming against mandate cap", icon: "bolt" },
  { label: "Adding to cart", sub: "UCP: ready_for_complete", icon: "cart" },
  { label: "Ready for your approval", sub: "We never auto-pay", icon: "shield" },
];

function AgentStepper({ running, done, onApprove, price }: any) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!running) return;
    if (step >= STEPS.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), 1100);
    return () => clearTimeout(t);
  }, [running, step]);
  const atEnd = step >= STEPS.length - 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {STEPS.map((s, i) => {
        const state = i < step ? "done" : i === step ? (atEnd && i === STEPS.length - 1 ? "ready" : "active") : "idle";
        const last = i === STEPS.length - 1;
        return (
          <div key={s.label} style={{ display: "flex", gap: 14, position: "relative" }}>
            {/* rail */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 999,
                flexShrink: 0, transition: "all .3s ease",
                background: state === "done" ? "var(--money)" : state === "ready" ? "var(--accent)"
                  : state === "active" ? "var(--accent-soft)" : "var(--surface-3)",
                color: state === "done" || state === "ready" ? "#fff" : state === "active" ? "var(--accent)" : "var(--muted-2)",
                border: state === "active" ? "2px solid var(--accent)" : "2px solid transparent" }}>
                {state === "done" ? <Icon name="check" size={17} stroke={3} />
                  : state === "active" ? <span style={{ width: 16, height: 16, borderRadius: 999,
                      border: "2.5px solid var(--accent)", borderTopColor: "transparent", animation: "spin .7s linear infinite" }} />
                  : <Icon name={s.icon} size={16} stroke={2} />}
              </span>
              {!last && <span style={{ width: 2, flex: 1, minHeight: 26,
                background: i < step ? "var(--money)" : "var(--hairline-2)", transition: "background .4s" }} />}
            </div>
            {/* label */}
            <div style={{ paddingBottom: last ? 0 : 18, paddingTop: 5, flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600,
                color: state === "idle" ? "var(--muted-2)" : "var(--ink)" }}>{s.label}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.sub}</div>
              {state === "ready" && (
                <div className="anim-fadeup" style={{ marginTop: 14 }}>
                  <Btn variant="money" size="lg" icon="check" onClick={onApprove}>
                    Approve &amp; complete · ${price}
                  </Btn>
                  <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 9 }}>
                    TwinCart prepares the cart; you press the final button. Always.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Deterministic fake UPC (12 digits) from a product name — stable per item, never random. */
function fakeUpc(name: string): string {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  let s = String(h);
  while (s.length < 12) s = s + String((h >> (s.length % 24)) & 7);
  return s.slice(0, 12);
}

/* Cart-mode agent panel — simulates an agentic add-to-cart across EVERY cart item,
   stepping through them one at a time with retailer logo + matched UPC. All simulated; never pays. */
function CartCheckoutPanel({ items, onApprove }: any) {
  const [done, setDone] = useState(0); // number of items confirmed in cart
  useEffect(() => {
    if (done >= items.length) return;
    const t = setTimeout(() => setDone((d) => d + 1), 550);
    return () => clearTimeout(t);
  }, [done, items.length]);
  const allDone = done >= items.length;
  const total = items.reduce((s: number, it: any) => s + (Number(it.price) || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((it: any, i: number) => {
        const state = i < done ? "done" : i === done ? "active" : "idle";
        const r = RETAILERS[it.retailer];
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 12,
            background: state === "idle" ? "transparent" : "var(--surface)",
            border: `1px solid ${state === "done" ? "var(--accent)" : "var(--hairline)"}`,
            opacity: state === "idle" ? 0.5 : 1, transition: "all .25s ease" }}>
            {r?.logo
              ? <img src={r.logo} width={22} height={22} style={{ borderRadius: 5, flexShrink: 0 }} alt="" />
              : <span style={{ width: 22, height: 22, borderRadius: 5, background: r?.color ?? "var(--muted-2)", flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</div>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 1 }}>
                UPC {fakeUpc(it.name)} · {r?.name ?? it.retailer}
              </div>
            </div>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>${it.price}</span>
              <span style={{ display: "grid", placeItems: "center", width: 26, height: 26, borderRadius: 999,
                background: state === "done" ? "var(--money)" : state === "active" ? "var(--accent-soft)" : "var(--surface-3)",
                color: state === "done" ? "#fff" : "var(--accent)" }}>
                {state === "done" ? <Icon name="check" size={15} stroke={3} />
                  : state === "active" ? <span style={{ width: 13, height: 13, borderRadius: 999,
                      border: "2.5px solid var(--accent)", borderTopColor: "transparent", animation: "spin .7s linear infinite" }} />
                  : <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--muted-2)" }} />}
              </span>
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted)" }}>
        {allDone ? "All items staged in cart across retailers."
          : `Adding ${done}/${items.length} — agent is opening each retailer and matching by UPC…`}
      </div>

      {allDone && (
        <div className="anim-fadeup" style={{ marginTop: 8 }}>
          <Btn variant="money" size="lg" icon="check" onClick={onApprove}>
            Approve &amp; complete · ${total}
          </Btn>
          <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 9 }}>
            TwinCart prepares each cart; you press the final button. Always.
          </p>
        </div>
      )}
    </div>
  );
}

/* Screen 4 — Agent Checkout modal (single product OR whole cart via { __cart: [...] }) */
function CheckoutModal({ cluster, onClose, onComplete }: any) {
  const cartMode = Array.isArray(cluster?.__cart);
  const items = cartMode ? cluster.__cart : null;
  const p = cartMode ? null : cluster.products.value;
  const [running, setRunning] = useState(false);
  useEffect(() => { const t = setTimeout(() => setRunning(true), 400); return () => clearTimeout(t); }, []);

  const retailers = cartMode ? new Set(items.map((it: any) => it.retailer)).size : 1;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(14,15,19,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "40px 20px", overflowY: "auto", animation: "fadeIn .2s ease" }}>
      <div onClick={(e) => e.stopPropagation()} className="anim-fadeup"
        style={{ width: "100%", maxWidth: 880, background: "var(--surface)", borderRadius: 26,
          boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, padding: "20px 26px", borderBottom: "1px solid var(--hairline)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 11,
              background: "var(--ink)", color: "#fff" }}><Icon name="twins" size={20} stroke={2} /></span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>TwinCart Agent</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                {cartMode
                  ? `${items.length} item${items.length === 1 ? "" : "s"} · ${retailers} retailer${retailers === 1 ? "" : "s"}`
                  : `${p.name} · ${RETAILERS[p.retailer].name}`}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ display: "grid", placeItems: "center", width: 36, height: 36,
            borderRadius: 999, background: "var(--surface-3)", color: "var(--muted)" }}>
            <Icon name="x" size={18} stroke={2.2} />
          </button>
        </div>

        {/* body */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, padding: 26 }}
          className="checkout-grid">
          <div>
            <SectionLabel n="01" title="Your guardrails" />
            {cartMode ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {["UCP-conformant session", "AP2-signed mandate · ES256", "You approve the final payment", "We never auto-pay"].map((g) => (
                  <div key={g} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--ink-soft)", fontWeight: 500 }}>
                    <span style={{ display: "grid", placeItems: "center", width: 24, height: 24, borderRadius: 999,
                      background: "var(--accent-soft)", color: "var(--accent)", flexShrink: 0 }}>
                      <Icon name="shield" size={14} stroke={2} />
                    </span>
                    {g}
                  </div>
                ))}
              </div>
            ) : (
              <TrustPanel p={p} cluster={cluster} />
            )}
          </div>
          <div>
            <SectionLabel n="02" title="Agent progress" />
            <div style={{ background: "var(--surface-2)", border: "1px solid var(--hairline)",
              borderRadius: 20, padding: "22px 22px 22px" }}>
              {cartMode
                ? <CartCheckoutPanel items={items} onApprove={() => onComplete(cluster)} />
                : <AgentStepper running={running} onApprove={() => onComplete(cluster)} price={p.price} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ n, title }: any) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 13 }}>
      <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)",
        background: "var(--accent-soft)", padding: "2px 7px", borderRadius: 6 }}>{n}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{title}</span>
    </div>
  );
}

/* ───────────────── Screen 5 — Saved report ───────────────── */
function ReportScreen({ cluster, onBack, onHome }: any) {
  const [copied, setCopied] = useState(false);
  const p = cluster.products.value;
  const link = cluster.boxReport || `https://app.box.com/s/tc-${cluster.id}-${(p.savingsPct || 40)}off`;
  const contents = [
    { icon: "twins", label: "Exact match + functional twins", val: "3 listings" },
    { icon: "scale", label: "Cross-retailer price comparison", val: `Save $${p.savingsAmt}` },
    { icon: "spark", label: "TwinCart AI verdict", val: "Included" },
    { icon: "seal", label: "AP2 signed-mandate audit", val: "ES256" },
    { icon: "truck", label: "Shipping & return-risk notes", val: "Per item" },
  ];

  const copy = () => {
    navigator.clipboard && navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="anim-fadein" style={{ maxWidth: 740, margin: "0 auto", padding: "40px 28px 80px" }}>
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 7,
        fontSize: 13.5, fontWeight: 600, color: "var(--muted)", marginBottom: 26 }}>
        <Icon name="back" size={17} stroke={2} /> Back
      </button>

      {/* success */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        marginBottom: 30 }}>
        <span style={{ display: "grid", placeItems: "center", width: 64, height: 64, borderRadius: 999,
          background: "var(--money-soft)", color: "var(--money)", marginBottom: 18,
          animation: "pop .4s cubic-bezier(.2,.7,.2,1) both" }}>
          <Icon name="check" size={32} stroke={2.6} />
        </span>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: "var(--ink)", lineHeight: 1.1, maxWidth: 480 }}>
          Your {cluster.query.replace(/\b\w/g, (m: any) => m.toUpperCase())} Savings Report is saved to Box.
        </h1>
        <p style={{ fontSize: 15.5, color: "var(--muted)", marginTop: 12, maxWidth: 440 }}>
          You've got the receipt — twins, prices, the verdict and the signed mandate audit, all in one shareable doc.
        </p>
      </div>

      {/* receipt card */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--hairline-2)", borderRadius: 22,
        boxShadow: "var(--shadow-md)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 22px",
          background: "var(--surface-2)", borderBottom: "1px solid var(--hairline)" }}>
          <span style={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 11,
            background: "#0061D5", color: "#fff" }}><Icon name="box" size={21} stroke={1.9} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>
              TwinCart_{cluster.id}_Savings.pdf
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Box · just now · 1.2 MB · PDF + JSON sidecar</div>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12,
            fontWeight: 700, color: "var(--money)" }}>
            <Icon name="check-circle" size={15} stroke={2.2} /> Uploaded
          </span>
        </div>

        <div style={{ padding: "8px 22px" }}>
          {contents.map((c, i) => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0",
              borderTop: i ? "1px solid var(--hairline)" : "none" }}>
              <Icon name={c.icon} size={17} stroke={2} style={{ color: "var(--accent)" }} />
              <span style={{ flex: 1, fontSize: 13.5, color: "var(--ink-soft)", fontWeight: 500 }}>{c.label}</span>
              <span className="tnum" style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>{c.val}</span>
            </div>
          ))}
        </div>

        {/* share link */}
        <div style={{ padding: "16px 22px 22px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 9 }}>Shareable Box link</div>
          <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
            <a className="mono" href={link} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, fontSize: 12.5, color: "var(--trust)", padding: "11px 14px",
              background: "var(--trust-soft)", border: "1px solid #cfe0fd", borderRadius: 11,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link}</a>
            <Btn variant="trust" icon="arrow" onClick={() => window.open(link, "_blank")}>Open</Btn>
            <Btn variant={copied ? "money" : "soft"} icon={copied ? "check" : "copy"} onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </Btn>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 26 }}>
        <Btn variant="ghost" icon="back" onClick={onBack}>Back to compare</Btn>
        <Btn variant="ink" icon="search" onClick={onHome}>New search</Btn>
      </div>
    </div>
  );
}

/* TwinCart — app shell, routing, top nav */

/* ───────────────── Top nav ───────────────── */
function TopNav({ onHome, screen, cartCount, wishCount, onCart }: any) {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(255,255,255,0.82)",
      backdropFilter: "blur(12px)", borderBottom: "1px solid var(--hairline)" }}>
      <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "0 28px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <button onClick={onHome} style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 10,
            background: "var(--ink)", color: "#fff" }}>
            <Icon name="twins" size={20} stroke={2.2} />
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700,
            letterSpacing: "-0.02em", color: "var(--ink)" }}>
            Twin<span style={{ color: "var(--accent)" }}>Cart</span>
          </span>
        </button>

        <nav style={{ display: "flex", alignItems: "center", gap: 22 }} className="topnav-links">
          {QUERIES.slice(0, 3).map((q) => (
            <button key={q} onClick={() => onHome(q)} style={{ fontSize: 13.5, fontWeight: 600,
              color: "var(--muted)", textTransform: "capitalize" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>{q}</button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px",
            borderRadius: 999, background: "var(--trust-soft)", border: "1px solid #cfe0fd",
            fontSize: 12, fontWeight: 600, color: "var(--trust)" }} className="nav-trust">
            <Icon name="seal" size={14} stroke={2} /> UCP · AP2
          </span>
          <button title="Wishlist" className="nav-icon" style={{ position: "relative", width: 38, height: 38,
            borderRadius: 999, display: "grid", placeItems: "center", background: "var(--surface-3)",
            color: "var(--ink-soft)", border: "1px solid var(--hairline)" }}>
            <Icon name="star" size={18} stroke={2} />
            {wishCount > 0 && <Badge n={wishCount} bg="var(--amber)" />}
          </button>
          <button onClick={onCart} title="Cart" style={{ position: "relative", width: 38, height: 38,
            borderRadius: 999, display: "grid", placeItems: "center", background: "var(--ink)", color: "#fff" }}>
            <Icon name="cart" size={18} stroke={2} />
            {cartCount > 0 && <Badge n={cartCount} bg="var(--accent)" />}
          </button>
        </div>
      </div>
    </header>
  );
}

function Badge({ n, bg }: any) {
  return (
    <span className="tnum" style={{ position: "absolute", top: -5, right: -5, minWidth: 18, height: 18,
      padding: "0 5px", borderRadius: 999, background: bg, color: "#fff", fontSize: 11, fontWeight: 700,
      display: "grid", placeItems: "center", border: "2px solid var(--canvas)" }}>{n}</span>
  );
}

let toastTimer: any;

function Toast({ msg }: any) {
  if (!msg) return null;
  return (
    <div className="anim-fadeup" style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 60, display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 18px",
      background: "var(--ink)", color: "#fff", borderRadius: 999, boxShadow: "var(--shadow-lg)",
      fontSize: 13.5, fontWeight: 600 }}>
      <span style={{ display: "grid", placeItems: "center", width: 20, height: 20, borderRadius: 999,
        background: "var(--money)", color: "#fff" }}><Icon name="check" size={13} stroke={3} /></span>
      {msg}
    </div>
  );
}

/* ───────────────── App ───────────────── */
function App() {
  const [screen, setScreen] = useState("home");
  const [query, setQuery] = useState(QUERIES[0]);
  const [cluster, setCluster] = useState<any>(null);
  const [checkout, setCheckout] = useState<any>(null);
  const [cart, setCart] = useState<any>([]);
  const [wishlist, setWishlist] = useState<any>(() => new Set());
  const [toast, setToast] = useState<any>(null);

  const flash = (msg: any) => { setToast(msg); clearTimeout(toastTimer); toastTimer = setTimeout(() => setToast(null), 1900); };
  const addToCart = (offer: any) => {
    // Normalize any added offer/product into a uniform cart row (with a reference "amazon" price + savings%).
    const price = Number(offer.price) || 0;
    const savingsPct = offer.savingsPct != null ? offer.savingsPct
      : (offer.savingsAmt && price + offer.savingsAmt > 0 ? Math.round((offer.savingsAmt / (price + offer.savingsAmt)) * 100) : 0);
    const amazon = offer.amazon != null ? offer.amazon
      : (savingsPct > 0 && savingsPct < 100 ? Math.round(price / (1 - savingsPct / 100))
        : (offer.savingsAmt ? price + offer.savingsAmt : price));
    const row = {
      name: offer.name, twinName: offer.twinName ?? offer.name, retailer: offer.retailer,
      price, image: offer.image, parity: offer.parity, matchType: offer.matchType,
      icon: offer.icon ?? "box", amazon, savingsPct,
    };
    setCart((c: any) => [...c, row]);
    flash(`Added to cart · $${price} from ${RETAILERS[offer.retailer]?.name ?? offer.retailer}`);
  };
  const toggleWish = (offer: any) => {
    const key = offer.retailer + offer.name;
    setWishlist((w: any) => { const n = new Set(w); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  const goHome = (q?: any) => {
    if (typeof q === "string") { setQuery(q); setScreen("results"); setHash("#/s/" + slugify(q)); }
    else { setScreen("home"); setHash("#/"); }
    window.scrollTo({ top: 0 });
  };
  const search = (q: any) => {
    const ql = (q || "").toLowerCase().trim();
    let match = QUERIES.find((x) => x.toLowerCase() === ql)
      || (ql && QUERIES.find((x) => x.toLowerCase().includes(ql) || ql.includes(x.toLowerCase())));
    if (!match && ql) {
      const hit = CLUSTERS.find((c: any) =>
        (c.title && c.title.toLowerCase().includes(ql)) ||
        (c.offers || []).some((o: any) => o.name && o.name.toLowerCase().includes(ql)));
      if (hit) match = hit.query;
    }
    // genuinely no match -> pass the raw query so ResultsScreen shows its "No twins found" empty state
    setQuery(match || q || QUERIES[0]); setScreen("results"); window.scrollTo({ top: 0 });
    setHash("#/s/" + slugify(match || q || QUERIES[0]));
  };
  const openCluster = (c: any) => { setCluster(c); setScreen("compare"); window.scrollTo({ top: 0 }); setHash("#/twin/" + slugify(c.query)); };
  const openReport = (c: any) => { setCluster(c); setScreen("report"); window.scrollTo({ top: 0 }); setHash("#/report/" + slugify(c.query)); };
  const openCheckout = (c: any) => setCheckout(c);

  const setHash = (h: string) => { if (typeof window !== "undefined" && window.location.hash !== (h || "#/")) history.replaceState(null, "", h || "#/"); };
  useEffect(() => {
    const applyHash = () => {
      const h = (typeof window !== "undefined" ? window.location.hash : "") || "";
      const [route, slug] = h.replace(/^#\/?/, "").split("/");
      if (route === "s" && slug) { setQuery(clusterBySlug(slug)?.query || decodeURIComponent(slug).replace(/-/g, " ")); setScreen("results"); }
      else if (route === "twin" && slug) { const c = clusterBySlug(slug); if (c) { setCluster(c); setScreen("compare"); } else { setScreen("home"); } }
      else if (route === "report" && slug) { const c = clusterBySlug(slug); if (c) { setCluster(c); setScreen("report"); } else { setScreen("home"); } }
      else if (route === "cart") { setScreen("cart"); }
      else { setScreen("home"); }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopNav onHome={goHome} screen={screen} cartCount={cart.length} wishCount={wishlist.size}
        onCart={() => { setScreen("cart"); setHash("#/cart"); window.scrollTo({ top: 0 }); }} />

      <main style={{ flex: 1 }}>
        {screen === "home" && <HomeScreen onSearch={search} />}
        {screen === "results" && <ResultsScreen query={query} onSearch={search}
          onOpenCluster={openCluster} onCheckout={openCheckout} onReport={openReport}
          onAdd={addToCart} onWish={toggleWish} wishlist={wishlist} />}
        {screen === "compare" && cluster && <CompareScreen cluster={cluster}
          onBack={() => goHome(cluster.query)} onCheckout={openCheckout} onReport={openReport}
          onAdd={addToCart} onWish={toggleWish} wishlist={wishlist} />}
        {screen === "report" && cluster && <ReportScreen cluster={cluster}
          onBack={() => openCluster(cluster)} onHome={() => goHome()} />}
        {screen === "cart" && <CartScreen items={cart} onBack={() => goHome()} onCheckout={() => cart.length && openCheckout({ __cart: cart })} />}
      </main>

      <footer style={{ borderTop: "1px solid var(--hairline)", background: "var(--surface-2)",
        padding: "28px 28px", marginTop: 20 }}>
        <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", display: "flex",
          alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
            TwinCart — a UCP-compatible discovery &amp; twin layer. Demo data; not affiliated with listed retailers.
          </span>
          <div style={{ display: "flex", gap: 16 }}>
            {["Amazon", "Walmart", "Target", "SHEIN", "Temu"].map((r) => (
              <span key={r} style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-2)" }}>{r}</span>
            ))}
          </div>
        </div>
      </footer>

      {checkout && <CheckoutModal cluster={checkout} onClose={() => setCheckout(null)}
        onComplete={(c: any) => { setCheckout(null); if (c && c.__cart) { flash("Order approved · agent placing carts"); goHome(); } else { openReport(c); } }} />}

      <Toast msg={toast} />
    </div>
  );
}

export default App;
