import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Logo } from "../components/Logo";

const FONT = "'Hanken Grotesk','Plus Jakarta Sans',system-ui,sans-serif";

export const S1_Hook: React.FC<{ dur: number }> = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const a = (d: number) => spring({ frame: f - d, fps, config: { damping: 200 } });
  const brand = spring({ frame: f - 8, fps, config: { damping: 13, stiffness: 110 } });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg,#FFFFFF 0%,#F6F8FB 55%,#F0F4F8 100%)", fontFamily: FONT }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#16A34A", letterSpacing: 6, fontSize: 24, fontWeight: 800, opacity: a(0), marginBottom: 18 }}>
          THE CROSS-MARKETPLACE TWIN-FINDER
        </div>
        <div style={{ fontSize: 168, fontWeight: 900, letterSpacing: -5, color: "#0B1220",
          transform: `scale(${0.85 + brand * 0.15})`, opacity: brand }}>
          Twin<span style={{ color: "#16A34A" }}>Cart</span>
        </div>
        <div style={{ marginTop: 26, fontSize: 52, fontWeight: 800, color: "#1E293B", opacity: a(28) }}>
          Find the twin. <span style={{ color: "#16A34A" }}>Pay the smart price.</span>
        </div>
        <div style={{ display: "flex", gap: 40, marginTop: 60, opacity: a(48), transform: `translateY(${(1 - a(48)) * 20}px)` }}>
          {["amazon", "walmart", "target", "temu", "shein"].map((n) => <Logo key={n} name={n} size={34} />)}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
