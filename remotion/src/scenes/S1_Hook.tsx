import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { KenBurns } from "../components/KenBurns";
import { Logo } from "../components/Logo";

export const S1_Hook: React.FC<{ dur: number }> = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoIn = (delay: number) => spring({ frame: f - delay, fps, config: { damping: 200 } });
  const brandPop = spring({ frame: f - 165, fps, config: { damping: 12, stiffness: 120 } });
  return (
    <AbsoluteFill style={{ backgroundColor: "#06101c" }}>
      <KenBurns from={1.05} to={1.18}>
        <Img src={staticFile("bg/hook.png")} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} />
      </KenBurns>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(6,16,28,0.35), rgba(6,16,28,0.85))" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
        <Sequence from={10} durationInFrames={130}>
          <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 30, letterSpacing: 4, marginBottom: 26 }}>MAY 19 · GOOGLE ANNOUNCES UNIVERSAL CART</div>
            <div style={{ display: "flex", gap: 44, justifyContent: "center", opacity: 0.95 }}>
              {["google", "amazon", "target", "walmart"].map((n, i) => (
                <span key={n} style={{ opacity: logoIn(20 + i * 8) }}><Logo name={n} size={52} /></span>
              ))}
            </div>
          </div>
        </Sequence>
        <div style={{ transform: `scale(${0.6 + brandPop * 0.4})`, opacity: brandPop, textAlign: "center" }}>
          <div style={{ color: "#7CF6C8", fontSize: 132, fontWeight: 900, letterSpacing: -3 }}>TwinCart</div>
          <div style={{ color: "#fff", fontSize: 34, fontWeight: 600, opacity: 0.85 }}>the twin it can't find</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
