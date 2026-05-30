import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { CaptureClip } from "../components/CaptureClip";
import { KenBurns } from "../components/KenBurns";
import { Highlight } from "../components/Highlight";
import { Logo } from "../components/Logo";
import { HAS_FOOTAGE, SHOTS } from "../data/shots";

const StepCard: React.FC<{ title: string; body: React.ReactNode; appear: number }> = ({ title, body, appear }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = spring({ frame: f - appear, fps, config: { damping: 200 } });
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 30}px)`, background: "rgba(255,255,255,0.05)",
      border: "2px solid rgba(124,246,200,0.45)", borderRadius: 20, padding: "26px 34px", maxWidth: 1200 }}>
      <div style={{ color: "#16A34A", fontSize: 30, fontWeight: 800, marginBottom: 8 }}>{title}</div>
      <div style={{ color: "#fff", fontSize: 34, fontWeight: 600, lineHeight: 1.3 }}>{body}</div>
    </div>
  );
};

export const S3_HowTwinsFound: React.FC<{ dur: number }> = ({ dur }) => {
  const t = SHOTS.take1;
  return (
    <AbsoluteFill style={{ backgroundColor: "#06120f" }}>
      {HAS_FOOTAGE ? (
        <>
          <KenBurns from={1.03} to={1.16} oy={0.42}>
            <CaptureClip src={t.src} from={t.search[0]} to={t.results[1]} fill={dur} />
          </KenBurns>
          <Sequence from={20} durationInFrames={130}><Highlight box={{ x: 6, y: 26, w: 88, h: 20 }} label="Tier 1 · shared GTIN = exact match" /></Sequence>
          <Sequence from={150} durationInFrames={170}><Highlight box={{ x: 6, y: 50, w: 88, h: 22 }} label="Tier 2 · Claude functional-parity verdict" /></Sequence>
          <Sequence from={320}><Highlight box={{ x: 18, y: 40, w: 64, h: 16 }} label="Value Score = parity × savings × confidence" /></Sequence>
        </>
      ) : (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 28, fontFamily: "Inter, sans-serif", padding: 80 }}>
          <div style={{ display: "flex", gap: 30, marginBottom: 10 }}>{["amazon", "walmart", "target"].map((n) => <Logo key={n} name={n} size={42} />)}</div>
          <StepCard title="TIER 1 · DETERMINISTIC" body={<>Shared <b>GTIN</b> barcode → locked <b>exact match</b> across Amazon, Walmart &amp; Target.</>} appear={10} />
          <StepCard title="TIER 2 · CROSS-BRAND" body={<>No barcode? <b>Claude</b> scores <b>functional parity</b> — “does it do the same job?” — and writes a verdict.</>} appear={70} />
          <StepCard title="RANKING" body={<><b>Value Score = parity × savings × confidence</b> — best value &amp; best budget, not just lowest price.</>} appear={150} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
