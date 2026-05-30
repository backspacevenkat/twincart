import { useCurrentFrame } from "remotion";
import type { Word } from "../lib/manifest";
import { FPS } from "../lib/manifest";

export const Caption: React.FC<{ words: Word[] }> = ({ words }) => {
  const t = useCurrentFrame() / FPS; // seconds since scene start
  if (!words?.length) return null;
  return (
    <div style={{ position: "absolute", bottom: 64, width: "100%", textAlign: "center",
      padding: "0 140px", fontFamily: "Inter, system-ui, sans-serif", fontWeight: 800, fontSize: 44, lineHeight: 1.28 }}>
      {words.map((w, i) => {
        const active = t >= w.start && t <= w.end;
        const spoken = t > w.end;
        return (
          <span key={i} style={{
            color: active ? "#7CF6C8" : spoken ? "#ffffff" : "rgba(255,255,255,0.42)",
            textShadow: "0 2px 22px rgba(0,0,0,0.9)", marginRight: 12 }}>
            {w.word}{" "}
          </span>
        );
      })}
    </div>
  );
};
