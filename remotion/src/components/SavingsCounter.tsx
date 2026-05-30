import { useCurrentFrame, interpolate } from "remotion";

export const SavingsCounter: React.FC<{ to: number; suffix?: string; durationFrames?: number }> =
  ({ to, suffix = "%", durationFrames = 45 }) => {
    const f = useCurrentFrame();
    const v = Math.round(interpolate(f, [0, durationFrames], [0, to], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }));
    return <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 900 }}>{v}{suffix}</span>;
  };
