import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { KenBurns } from "../components/KenBurns";

export const S2_TwinIdea: React.FC<{ dur: number }> = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const left = spring({ frame: f - 10, fps, config: { damping: 200 } });
  const right = spring({ frame: f - 40, fps, config: { damping: 200 } });
  const Card: React.FC<{ price: string; tag: string; p: number; dim?: boolean }> = ({ price, tag, p, dim }) => (
    <div style={{ width: 360, height: 360, borderRadius: 28, background: dim ? "rgba(124,246,200,0.12)" : "rgba(255,255,255,0.06)",
      border: "2px solid rgba(124,246,200,0.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>
      <div style={{ fontSize: 120 }}>📦</div>
      <div style={{ color: "#fff", fontSize: 64, fontWeight: 900, marginTop: 16 }}>{price}</div>
      <div style={{ color: "#7CF6C8", fontSize: 26, fontWeight: 700 }}>{tag}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: "#06151a" }}>
      <KenBurns from={1.04} to={1.12}>
        <Img src={staticFile("bg/idea.png")} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
      </KenBurns>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ display: "flex", gap: 90, alignItems: "center", marginTop: -60 }}>
          <Card price="$40" tag="brand name" p={left} />
          <div style={{ color: "#7CF6C8", fontSize: 70, fontWeight: 900, opacity: right }}>=</div>
          <Card price="$12" tag="its twin" p={right} dim />
        </div>
        <div style={{ position: "absolute", bottom: 170, color: "rgba(255,255,255,0.85)", fontSize: 32, fontWeight: 600 }}>
          same job · different brand · <span style={{ color: "#7CF6C8" }}>no shared barcode</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
