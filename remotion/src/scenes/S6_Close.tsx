import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { KenBurns } from "../components/KenBurns";
import { Logo } from "../components/Logo";

export const S6_Close: React.FC<{ dur: number }> = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const cols = spring({ frame: f - 10, fps, config: { damping: 200 } });
  const tag = spring({ frame: f - 90, fps, config: { damping: 14, stiffness: 110 } });
  return (
    <AbsoluteFill style={{ backgroundColor: "#06101c" }}>
      <KenBurns from={1.05} to={1.12}>
        <Img src={staticFile("bg/close.png")} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
      </KenBurns>
      <AbsoluteFill style={{ fontFamily: "Inter, sans-serif" }}>
        <div style={{ display: "flex", height: "62%" }}>
          <div style={{ flex: 1, opacity: cols, transform: `translateX(${(1 - cols) * -40}px)`, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 18, borderRight: "1px solid rgba(255,255,255,0.12)" }}>
            <Logo name="google" size={56} />
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 30, textAlign: "center", padding: "0 60px" }}>checks you out<br />at the <b>brand</b><br /><span style={{ opacity: 0.6, fontSize: 24 }}>same SKU only</span></div>
          </div>
          <div style={{ flex: 1, opacity: cols, transform: `translateX(${(1 - cols) * 40}px)`, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 18 }}>
            <div style={{ color: "#7CF6C8", fontSize: 56, fontWeight: 900 }}>TwinCart</div>
            <div style={{ color: "#fff", fontSize: 30, textAlign: "center", padding: "0 50px" }}>finds the <b>cross-marketplace twin</b><br />Google won't index</div>
            <div style={{ display: "flex", gap: 18, marginTop: 6 }}>{["amazon", "temu", "shein", "walmart", "target"].map((n) => <Logo key={n} name={n} size={24} />)}</div>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 90, width: "100%", textAlign: "center", opacity: tag, transform: `scale(${0.85 + tag * 0.15})` }}>
          <div style={{ color: "#fff", fontSize: 44, fontWeight: 800 }}>Find the same product — or its smarter, cheaper twin.</div>
          <div style={{ color: "#7CF6C8", fontSize: 30, fontWeight: 700, marginTop: 12 }}>main.d2lad0772pqd8l.amplifyapp.com · UCP-compatible · live today</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
