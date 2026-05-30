'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { RETAILERS, DEMO_BASKET } from '@/lib/twincart-data';

const money = (n: number) => '$' + n.toLocaleString();

function RBadge({ id }: any) {
  const r = RETAILERS[id];
  if (!r) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 999,
      background: 'var(--surface-3)', border: '1px solid var(--hairline)', fontSize: 11, fontWeight: 600, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: r.color }} /> {r.name}
    </span>
  );
}

function Thumb({ retailer }: any) {
  const r = RETAILERS[retailer];
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

export default function CartScreen({ onBack, onCheckout }: any) {
  const amazon = DEMO_BASKET.reduce((s: number, i: any) => s + i.amazon, 0);
  const twin = DEMO_BASKET.reduce((s: number, i: any) => s + i.price, 0);
  const save = amazon - twin;
  const pct = Math.round((save / amazon) * 100);
  const retailers = new Set(DEMO_BASKET.map((i: any) => i.retailer)).size;

  return (
    <div className="anim-fadein" style={{ maxWidth: 'var(--maxw)', margin: '0 auto', padding: '24px 28px 90px' }}>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 18 }}>
        ← Back
      </button>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--accent)' }} /> Your TwinCart Basket
      </div>
      <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.05, maxWidth: 760 }}>
        {DEMO_BASKET.length} items. Same job, <span style={{ color: 'var(--accent)' }}>{pct}% less.</span>
      </h1>
      <p style={{ fontSize: 16, color: 'var(--muted)', marginTop: 12, maxWidth: 620 }}>
        The exact branded versions on Amazon cost <strong style={{ color: 'var(--ink-soft)' }}>{money(amazon)}</strong>. TwinCart found feature-rich twins across {retailers} marketplaces for a fraction.
      </p>

      {/* hero comparison band */}
      <div style={{ marginTop: 26, padding: '28px 28px', borderRadius: 22, background: 'var(--surface)',
        border: '1px solid var(--hairline-2)', boxShadow: 'var(--shadow-md)', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Stat label="On Amazon" value={money(amazon)} tone="amazon" sub="exact branded items" />
        <div style={{ fontSize: 30, color: 'var(--muted-2)', paddingBottom: 18 }}>→</div>
        <Stat label="With TwinCart" value={money(twin)} tone="twin" sub="feature-rich twins" />
        <Stat label="You save" value={money(save)} tone="save" sub={`${pct}% off · ${(amazon / twin).toFixed(1)}× cheaper`} big />
      </div>

      {/* line items */}
      <div style={{ marginTop: 24, background: 'var(--surface)', border: '1px solid var(--hairline-2)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {DEMO_BASKET.map((it: any, i: number) => {
          const s = it.amazon - it.price;
          const p = Math.round((s / it.amazon) * 100);
          const stop = /NOT COMPARABLE/.test(it.matchType);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: i ? '1px solid var(--hairline)' : 'none' }}>
              <Thumb retailer={it.retailer} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.25 }}>{it.twinName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 6, flexWrap: 'wrap' }}>
                  <RBadge id={it.retailer} />
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>vs Amazon <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>{it.name}</span></span>
                  <span className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: stop ? 'var(--risk)' : 'var(--accent)', background: stop ? 'var(--risk-soft)' : 'var(--accent-soft)', padding: '2px 7px', borderRadius: 6 }}>
                    {it.parity}% twin
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="tnum" style={{ fontSize: 12.5, color: 'var(--muted-2)', textDecoration: 'line-through' }}>{money(it.amazon)}</div>
                <div className="tnum" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--ink)', lineHeight: 1.1 }}>{money(it.price)}</div>
                <div className="tnum" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--money)' }}>save {money(s)} ({p}%)</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* checkout CTA */}
      <div style={{ marginTop: 24, padding: '22px 24px', borderRadius: 20, background: 'var(--accent-soft)', border: '1px solid #bfe6cd',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Check out all {DEMO_BASKET.length} with the TwinCart Agent</div>
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
