import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { Logo } from "../components/Logo";
import { SavingsCounter } from "../components/SavingsCounter";

const FONT = "'Hanken Grotesk','Plus Jakarta Sans',system-ui,sans-serif";

// Real demo basket from the deck brief: $996 (Amazon) -> $118 (TwinCart) = 88% off.
const ITEMS = [
  { name: "Robot vacuum twin", retailer: "temu", ref: "$469", price: "$72" },
  { name: "Massage gun twin", retailer: "temu", ref: "$399", price: "$30" },
  { name: "LED strip lights twin", retailer: "shein", ref: "$128", price: "$16" },
];

export const S5_AgentCheckout: React.FC<{ dur: number }> = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const a = (d: number) => spring({ frame: f - d, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg,#FFFFFF,#F6F8FB)", fontFamily: FONT, padding: "70px 120px" }}>
      <div style={{ fontSize: 44, fontWeight: 900, color: "#0B1220", opacity: a(0) }}>
        Your <span style={{ color: "#16A34A" }}>TwinCart</span> basket — 3 items
      </div>
      <div style={{ display: "flex", gap: 50, marginTop: 36 }}>
        <div style={{ flex: 1.3 }}>
          {ITEMS.map((it, i) => (
            <div key={it.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#fff", border: "1px solid #E6EAF0", borderRadius: 16, padding: "20px 26px", marginBottom: 16,
              opacity: a(8 + i * 10), transform: `translateX(${(1 - a(8 + i * 10)) * -24}px)` }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#0B1220" }}>{it.name}</div>
                <div style={{ marginTop: 4 }}><Logo name={it.retailer} size={22} /></div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, color: "#94A3B8", textDecoration: "line-through" }}>{it.ref}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#16A34A" }}>{it.price}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, background: "#0B1220", borderRadius: 22, padding: 36, color: "#fff", opacity: a(30) }}>
          <div style={{ fontSize: 24, color: "#94A3B8" }}>Reference (Amazon)</div>
          <div style={{ fontSize: 46, fontWeight: 800, textDecoration: "line-through", opacity: 0.7 }}>$996</div>
          <div style={{ fontSize: 24, color: "#6ee7a8", marginTop: 18 }}>With TwinCart</div>
          <div style={{ fontSize: 84, fontWeight: 900, color: "#fff", lineHeight: 1 }}>$118</div>
          <div style={{ marginTop: 14, fontSize: 30, fontWeight: 800, color: "#16A34A" }}>
            <SavingsCounter to={88} /> less · 8.4× cheaper
          </div>
        </div>
      </div>
      <div style={{ marginTop: 30, textAlign: "center", opacity: a(46) }}>
        <span style={{ background: "#16A34A", color: "#fff", fontWeight: 900, fontSize: 30, padding: "16px 30px", borderRadius: 14 }}>
          Agent checks out all 3 · stops at your approval · never auto-pays
        </span>
      </div>
    </AbsoluteFill>
  );
};
