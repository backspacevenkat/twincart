'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { RETAILERS } from '@/lib/twincart-data';

const money = (n: number) => '$' + Math.round(n).toLocaleString();

function RBadge({ id }: any) {
  const r = RETAILERS[id];
  if (!r) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 999,
      background: 'var(--surface-3)', border: '1px solid var(--hairline)', fontSize: 11, fontWeight: 600, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
      {r.logo
        ? <img src={r.logo} width={14} height={14} style={{ borderRadius: 3 }} alt="" />
        : <span style={{ width: 7, height: 7, borderRadius: 999, background: r.color }} />}
      {r.name}
    </span>
  );
}

function Thumb({ retailer, image }: any) {
  const r = RETAILERS[retailer];
  if (image) {
    return (
      <div style={{ position: 'relative', width: 52, height: 52, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
        border: '1px solid var(--hairline)', background: 'var(--surface-3)' }}>
        <img src={image} width={52} height={52} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
        <span style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: 3, background: r ? r.color : 'var(--accent)', opacity: 0.9 }} />
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', width: 52, height: 52, borderRadius: 12, flexShrink: 0,
      background: 'var(--surface-3)', border: '1px solid var(--hairline)', display: 'grid', placeItems: 'center', color: 'var(--muted-2)' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 8 9-5 9 5v8l-9 5-9-5z" /><path d="m3 8 9 5 9-5M12 13v8" />
      </svg>
      <span style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: 3, background: r ? r.color : 'var(--accent)', opacity: 0.9 }} />
    </div>
  );
}

function Stat({ label, value, sub, tone, big }: any) {
  return (
    <div style={{ flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</div>
      <div className="tnum" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1, marginTop: 8,
        fontSize: big ? 'clamp(40px, 6vw, 60px)' : 'clamp(30px, 4vw, 42px)',
        color: tone === 'amazon' ? 'var(--muted-2)' : tone === 'save' ? 'var(--money)' : 'var(--ink)',
        textDecoration: tone === 'amazon' ? 'line-through' : 'none', letterSpacing: '-0.03em' }}>{value}</div>
      {sub && <div style={{ fontSize: 13, fontWeight: 600, color: tone === 'save' ? 'var(--money)' : 'var(--muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function CartScreen({ items = [], onBack, onCheckout }: any) {
  // Empty state — the cart reflects ONLY what the shopper actually added.
  if (!items || items.length === 0) {
    return (
      <div className="anim-fadein" style={{ maxWidth: 'var(--maxw)', margin: '0 auto', padding: '24px 28px 90px' }}>
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 18 }}>
          ← Back
        </button>
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ display: 'inline-grid', placeItems: 'center', width: 72, height: 72, borderRadius: 20,
            background: 'var(--surface-3)', color: 'var(--muted-2)', marginBottom: 20 }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>
            Your TwinCart basket is empty
          </h1>
          <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 26, maxWidth: 440, margin: '0 auto 26px' }}>
            Add twins from any product and watch your savings stack up here.
          </p>
          <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 26px', borderRadius: 999,
            background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 15, boxShadow: 'var(--shadow-accent)' }}>
            Browse twins
          </button>
        </div>
      </div>
    );
  }

  const amazon = items.reduce((s: number, i: any) => s + (i.amazon || i.price), 0);
  const twin = items.reduce((s: number, i: any) => s + i.price, 0);
  const save = amazon - twin;
  const pct = amazon > 0 ? Math.round((save / amazon) * 100) : 0;
  const retailers = new Set(items.map((i: any) => i.retailer)).size;

  return (
    <div className="anim-fadein" style={{ maxWidth: 'var(--maxw)', margin: '0 auto', padding: '24px 28px 90px' }}>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 18 }}>
        ← Back
      </button>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--accent)' }} /> Your TwinCart Basket
      </div>
      <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.05, maxWidth: 760 }}>
        {items.length} item{items.length === 1 ? '' : 's'}. Same job, <span style={{ color: 'var(--accent)' }}>{pct}% less.</span>
      </h1>
      <p style={{ fontSize: 16, color: 'var(--muted)', marginTop: 12, maxWidth: 620 }}>
        The exact branded versions cost <strong style={{ color: 'var(--ink-soft)' }}>{money(amazon)}</strong>. TwinCart found feature-rich twins across {retailers} marketplace{retailers === 1 ? '' : 's'} for a fraction.
      </p>

      {/* hero comparison band */}
      <div style={{ marginTop: 26, padding: '28px 28px', borderRadius: 22, background: 'var(--surface)',
        border: '1px solid var(--hairline-2)', boxShadow: 'var(--shadow-md)', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Stat label="Reference price" value={money(amazon)} tone="amazon" sub="exact branded items" />
        <div style={{ fontSize: 30, color: 'var(--muted-2)', paddingBottom: 18 }}>→</div>
        <Stat label="With TwinCart" value={money(twin)} tone="twin" sub="feature-rich twins" />
        <Stat label="You save" value={money(save)} tone="save" sub={`${pct}% off · ${twin > 0 ? (amazon / twin).toFixed(1) : '0'}× cheaper`} big />
      </div>

      {/* line items */}
      <div style={{ marginTop: 24, background: 'var(--surface)', border: '1px solid var(--hairline-2)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {items.map((it: any, i: number) => {
          const ref = it.amazon || it.price;
          const s = ref - it.price;
          const p = ref > 0 ? Math.round((s / ref) * 100) : 0;
          const stop = /NOT COMPARABLE/.test(it.matchType || '');
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: i ? '1px solid var(--hairline)' : 'none' }}>
              <Thumb retailer={it.retailer} image={it.image} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.25,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{it.twinName || it.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 6, flexWrap: 'wrap' }}>
                  <RBadge id={it.retailer} />
                  {it.parity != null && (
                    <span className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: stop ? 'var(--risk)' : 'var(--accent)', background: stop ? 'var(--risk-soft)' : 'var(--accent-soft)', padding: '2px 7px', borderRadius: 6 }}>
                      {it.parity}% twin
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {s > 0 && <div className="tnum" style={{ fontSize: 12.5, color: 'var(--muted-2)', textDecoration: 'line-through' }}>{money(ref)}</div>}
                <div className="tnum" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--ink)', lineHeight: 1.1 }}>{money(it.price)}</div>
                {s > 0 && <div className="tnum" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--money)' }}>save {money(s)} ({p}%)</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* checkout CTA */}
      <div style={{ marginTop: 24, padding: '22px 24px', borderRadius: 20, background: 'var(--accent-soft)', border: '1px solid #bfe6cd',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Check out all {items.length} with the TwinCart Agent</div>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>UCP-conformant sessions · AP2-signed mandates · you approve the final payment. We never auto-pay.</div>
        </div>
        <button onClick={onCheckout} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '14px 26px', borderRadius: 999,
          background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: 15.5, boxShadow: 'var(--shadow-accent)', whiteSpace: 'nowrap' }}>
          Prepare checkout · save {money(save)}
        </button>
      </div>
    </div>
  );
}
