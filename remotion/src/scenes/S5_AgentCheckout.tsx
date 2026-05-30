import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { CaptureClip } from "../components/CaptureClip";
import { KenBurns } from "../components/KenBurns";
import { HAS_FOOTAGE, SHOTS } from "../data/shots";

const STEPS = ["Opening retailer", "Locating product", "Adding to cart", "Awaiting your approval"];

const Badge: React.FC = () => (
  <div style={{ position: "absolute", bottom: 150, width: "100%", textAlign: "center" }}>
    <span style={{ background: "#7CF6C8", color: "#06231b", fontWeight: 900, fontSize: 32, padding: "12px 24px",
      borderRadius: 12, fontFamily: "Inter, sans-serif", boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
      Stops at your approval · never auto-pays · AP2-signed
    </span>
  </div>
);

export const S5_AgentCheckout: React.FC<{ dur: number }> = ({ dur }) => {
  const t = SHOTS.take2;
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  // take2 capture failed (empty webm) -> always use the animated stepper recreation.
  const useFootage = false && HAS_FOOTAGE;
  return (
    <AbsoluteFill style={{ backgroundColor: "#160a1a" }}>
      {useFootage ? (
        <><KenBurns from={1.04} to={1.14}><CaptureClip src={t.src} from={t.stepper[0]} to={t.stepper[1]} fill={dur} /></KenBurns><Badge /></>
      ) : (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
          <div style={{ width: 760 }}>
            {STEPS.map((s, i) => {
              const a = spring({ frame: f - 10 - i * 30, fps, config: { damping: 200 } });
              const last = i === STEPS.length - 1;
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 22, padding: "18px 26px", marginBottom: 16,
                  borderRadius: 16, background: last ? "rgba(124,246,200,0.16)" : "rgba(255,255,255,0.05)",
                  border: `2px solid ${last ? "#7CF6C8" : "rgba(255,255,255,0.15)"}`, opacity: a, transform: `translateX(${(1 - a) * -30}px)` }}>
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: last ? "#7CF6C8" : "#2e3b46", color: last ? "#06231b" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22 }}>{last ? "✋" : i + 1}</div>
                  <div style={{ color: "#fff", fontSize: 34, fontWeight: last ? 800 : 600 }}>{s}</div>
                </div>
              );
            })}
          </div>
          <Badge />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
