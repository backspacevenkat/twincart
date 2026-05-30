import { AbsoluteFill, Sequence, Img, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { CaptureClip } from "../components/CaptureClip";
import { KenBurns } from "../components/KenBurns";
import { SavingsCounter } from "../components/SavingsCounter";
import { Logo } from "../components/Logo";
import { HAS_FOOTAGE, SHOTS } from "../data/shots";

// Real robot-vacuum cluster data (src/lib/live-clusters.json, query "robot vacuum", 97%).
const PRODUCTS = [
  { tag: "Best Exact", retailer: "amazon", price: "$469", img: "https://m.media-amazon.com/images/I/71m1NqgtcRL._AC_UY218_.jpg" },
  { tag: "Best Value", retailer: "temu", price: "$72", img: "https://img.kwcdn.com/product/fancy/3b4edf62-2122-4aef-b589-490ab6159993.jpg" },
  { tag: "Best Budget", retailer: "shein", price: "$15", img: "https://img.kwcdn.com/product/fancy/a11d69e9-ca73-4fe2-8d7a-5e3868f18754.jpg" },
];

const SavingsBadge: React.FC = () => (
  <div style={{ position: "absolute", right: 70, top: 60, textAlign: "right", fontFamily: "Inter, sans-serif",
    textShadow: "0 6px 30px rgba(0,0,0,0.85)" }}>
    <div style={{ color: "#fff", fontSize: 34, fontWeight: 700 }}>save up to</div>
    <div style={{ color: "#7CF6C8", fontSize: 150, fontWeight: 900, lineHeight: 1 }}><SavingsCounter to={97} /></div>
    <div style={{ color: "#fff", fontSize: 30, opacity: 0.85 }}>Shark $469 → twin $15 · proven</div>
  </div>
);

export const S4_TwinPayoff: React.FC<{ dur: number }> = ({ dur }) => {
  const t = SHOTS.take1;
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#06120f" }}>
      {HAS_FOOTAGE ? (
        <>
          <KenBurns from={1.0} to={1.12}><CaptureClip src={t.src} from={t.compare[0]} to={t.report[1]} fill={dur} /></KenBurns>
          <Sequence from={25}><SavingsBadge /></Sequence>
        </>
      ) : (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
          <div style={{ color: "#fff", fontSize: 40, fontWeight: 800, marginBottom: 30 }}>Shark AV2501S Robot Vacuum <span style={{ color: "#7CF6C8" }}>&amp; its twins</span></div>
          <div style={{ display: "flex", gap: 40 }}>
            {PRODUCTS.map((p, i) => {
              const a = spring({ frame: f - 10 - i * 14, fps, config: { damping: 200 } });
              return (
                <div key={p.tag} style={{ width: 360, opacity: a, transform: `translateY(${(1 - a) * 36}px)`,
                  background: "rgba(255,255,255,0.05)", border: "2px solid rgba(124,246,200,0.4)", borderRadius: 22, padding: 24, textAlign: "center" }}>
                  <Img src={p.img} style={{ width: 240, height: 240, objectFit: "contain", margin: "0 auto", borderRadius: 12, background: "#fff" }} />
                  <div style={{ marginTop: 16 }}><Logo name={p.retailer} size={34} /></div>
                  <div style={{ color: "#fff", fontSize: 56, fontWeight: 900 }}>{p.price}</div>
                  <div style={{ color: "#7CF6C8", fontSize: 24, fontWeight: 700 }}>{p.tag}</div>
                </div>
              );
            })}
          </div>
          <SavingsBadge />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
