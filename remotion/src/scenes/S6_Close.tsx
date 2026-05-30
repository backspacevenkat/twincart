import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { Logo } from "../components/Logo";

const FONT = "'Hanken Grotesk','Plus Jakarta Sans',system-ui,sans-serif";

const Pill: React.FC<{ name: string }> = ({ name }) => (
  <div style={{ background: "#fff", border: "1px solid #E6EAF0", borderRadius: 999, padding: "12px 22px",
    boxShadow: "0 6px 18px rgba(11,18,32,0.05)", display: "flex", alignItems: "center" }}>
    <Logo name={name} size={28} />
  </div>
);

export const S6_Close: React.FC<{ dur: number }> = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const a = (d: number) => spring({ frame: f - d, fps, config: { damping: 200 } });
  const brand = spring({ frame: f - 6, fps, config: { damping: 13, stiffness: 110 } });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(1200px 700px at 50% 0%, #FFFFFF 0%, #F0F4F8 100%)", fontFamily: FONT }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* brand lockup */}
        <div style={{ transform: `scale(${0.86 + brand * 0.14})`, opacity: brand, textAlign: "center" }}>
          <div style={{ fontSize: 132, fontWeight: 900, letterSpacing: -4, color: "#0B1220" }}>
            Twin<span style={{ color: "#16A34A" }}>Cart</span>
          </div>
          <div style={{ fontSize: 46, fontWeight: 800, color: "#1E293B", marginTop: 2 }}>
            Find the twin. <span style={{ color: "#16A34A" }}>Pay the smart price.</span>
          </div>
        </div>

        {/* accent rule */}
        <div style={{ width: interpAccent(a(26)), height: 5, background: "#16A34A", borderRadius: 4, margin: "34px 0 30px" }} />

        {/* marketplaces */}
        <div style={{ display: "flex", gap: 18, opacity: a(30), transform: `translateY(${(1 - a(30)) * 18}px)` }}>
          {["amazon", "walmart", "target", "temu", "shein"].map((n) => <Pill key={n} name={n} />)}
        </div>

        {/* proof stats */}
        <div style={{ display: "flex", gap: 56, marginTop: 40, opacity: a(44) }}>
          {[["5,468", "real products live"], ["up to 97%", "cheaper twins found"], ["AWS · Box · Apify", "built on"]].map(([big, sub]) => (
            <div key={sub} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: "#0B1220" }}>{big}</div>
              <div style={{ fontSize: 20, color: "#64748B", fontWeight: 600 }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{ position: "absolute", bottom: 70, fontSize: 24, color: "#64748B", fontWeight: 600, opacity: a(56) }}>
          main.d2lad0772pqd8l.amplifyapp.com
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// grows the accent rule from 0 -> 220px
function interpAccent(p: number) { return `${Math.round(p * 220)}px`; }
