import { AbsoluteFill, Sequence } from "remotion";
import { MANIFEST, sceneFrames } from "./lib/manifest";

const COLORS: Record<string, string> = {
  s1: "#0b1020", s2: "#10213a", s3: "#0f2e2a", s4: "#13351c", s5: "#2a1530", s6: "#0b1020",
};

export const TwinCartVideo: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {MANIFEST.map((s) => {
        const dur = sceneFrames(s);
        const seq = (
          <Sequence key={s.scene} from={from} durationInFrames={dur} name={s.scene}>
            <AbsoluteFill style={{ backgroundColor: COLORS[s.scene], alignItems: "center", justifyContent: "center" }}>
              <div style={{ color: "#fff", fontSize: 64, fontFamily: "sans-serif" }}>{s.scene.toUpperCase()}</div>
            </AbsoluteFill>
          </Sequence>
        );
        from += dur;
        return seq;
      })}
    </AbsoluteFill>
  );
};
