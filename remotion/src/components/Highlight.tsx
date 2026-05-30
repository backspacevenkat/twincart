import { useCurrentFrame, spring, useVideoConfig } from "remotion";

// box in % of frame: {x,y,w,h}; pops in at appearAtFrame with an optional label.
export const Highlight: React.FC<{ box: { x: number; y: number; w: number; h: number }; appearAtFrame?: number; label?: string }> =
  ({ box, appearAtFrame = 0, label }) => {
    const f = useCurrentFrame();
    const { fps } = useVideoConfig();
    const p = spring({ frame: f - appearAtFrame, fps, config: { damping: 200 } });
    return (
      <div style={{ position: "absolute", left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`,
        border: "4px solid #16A34A", borderRadius: 16, opacity: p, transform: `scale(${0.96 + p * 0.04})`,
        boxShadow: "0 0 40px rgba(124,246,200,0.35)" }}>
        {label && (
          <div style={{ position: "absolute", top: -52, left: 0, background: "#16A34A", color: "#ffffff",
            fontWeight: 800, padding: "6px 16px", borderRadius: 10, fontSize: 26, fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
            {label}
          </div>
        )}
      </div>
    );
  };
