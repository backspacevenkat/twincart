import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { Logo } from "../components/Logo";

const FONT = "'Hanken Grotesk','Plus Jakarta Sans',system-ui,sans-serif";

const Card: React.FC<{ price: string; tag: string; sub: string; p: number; twin?: boolean }> = ({ price, tag, sub, p, twin }) => (
  <div style={{ width: 380, padding: 34, borderRadius: 26, background: "#FFFFFF",
    border: `2px solid ${twin ? "#16A34A" : "#E6EAF0"}`, boxShadow: "0 18px 50px rgba(11,18,32,0.08)",
    textAlign: "center", opacity: p, transform: `translateY(${(1 - p) * 36}px)` }}>
    <div style={{ fontSize: 96 }}>{twin ? "🛒" : "📦"}</div>
    <div style={{ fontSize: 72, fontWeight: 900, color: "#0B1220", marginTop: 10 }}>{price}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: twin ? "#16A34A" : "#64748B" }}>{tag}</div>
    <div style={{ fontSize: 20, color: "#94A3B8", marginTop: 4 }}>{sub}</div>
  </div>
);

export const S2_TwinIdea: React.FC<{ dur: number }> = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const a = (d: number) => spring({ frame: f - d, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg,#FFFFFF,#F0F4F8)", fontFamily: FONT }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 54, fontWeight: 900, color: "#0B1220", textAlign: "center", maxWidth: 1300, opacity: a(0), marginBottom: 56 }}>
          Comparison sites match barcodes. <span style={{ color: "#16A34A" }}>We match the job.</span>
        </div>
        <div style={{ display: "flex", gap: 70, alignItems: "center" }}>
          <Card price="$40" tag="brand name" sub="the premium SKU" p={a(14)} />
          <div style={{ color: "#16A34A", fontSize: 80, fontWeight: 900, opacity: a(34) }}>≈</div>
          <Card price="$12" tag="its twin" sub="same job, far less" p={a(34)} twin />
        </div>
        <div style={{ marginTop: 54, fontSize: 30, fontWeight: 700, color: "#475569", opacity: a(56) }}>
          same job · different brand · <span style={{ color: "#16A34A" }}>no shared barcode</span>
        </div>
        <div style={{ display: "flex", gap: 34, marginTop: 30, opacity: a(64) }}>
          {["amazon", "walmart", "target", "temu", "shein"].map((n) => <Logo key={n} name={n} size={26} />)}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
