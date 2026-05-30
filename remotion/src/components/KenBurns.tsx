import { useCurrentFrame, useVideoConfig, interpolate, AbsoluteFill } from "remotion";

export const KenBurns: React.FC<{ children: React.ReactNode; from?: number; to?: number; ox?: number; oy?: number; frames?: number }> =
  ({ children, from = 1, to = 1.16, ox = 0.5, oy = 0.5, frames }) => {
    const f = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();
    const span = frames ?? durationInFrames;
    const scale = interpolate(f, [0, span], [from, to], { extrapolateRight: "clamp" });
    return (
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: `${ox * 100}% ${oy * 100}%` }}>
        {children}
      </AbsoluteFill>
    );
  };
