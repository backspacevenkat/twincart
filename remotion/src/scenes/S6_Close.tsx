import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { Logo } from "../components/Logo";

const FONT = "'Hanken Grotesk','Plus Jakarta Sans',system-ui,sans-serif";

export const S6_Close: React.FC<{ dur: number }> = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const a = (d: number) => spring({ frame: f - d, fps, config: { damping: 200 } });
  const brand = spring({ frame: f - 60, fps, config: { damping: 13, stiffness: 110 } });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg,#FFFFFF,#F0F4F8)", fontFamily: FONT }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 50, fontWeight: 900, color: "#0B1220", opacity: a(0), textAlign: "center" }}>
          Five marketplaces, <span style={{ color: "#16A34A" }}>one ranked answer.</span>
        </div>
        <div style={{ display: "flex", gap: 40, marginTop: 34, opacity: a(16) }}>
          {["amazon", "walmart", "target", "temu", "shein"].map((n) => <Logo key={n} name={n} size={34} />)}
        </div>
        <div style={{ marginTop: 36, fontSize: 26, color: "#475569", fontWeight: 700, opacity: a(30) }}>
          5,468 real products · built on AWS · Box · Apify · the twins are already live
        </div>
        <div style={{ marginTop: 60, transform: `scale(${0.85 + brand * 0.15})`, opacity: brand, textAlign: "center" }}>
          <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -3, color: "#0B1220" }}>
            Twin<span style={{ color: "#16A34A" }}>Cart</span>
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, color: "#1E293B", marginTop: 4 }}>
            Find the twin. <span style={{ color: "#16A34A" }}>Pay the smart price.</span>
          </div>
          <div style={{ fontSize: 24, color: "#64748B", marginTop: 18 }}>main.d2lad0772pqd8l.amplifyapp.com</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
