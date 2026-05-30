import { OffthreadVideo, staticFile } from "remotion";
import { FPS } from "../lib/manifest";

// Plays a [from,to] (seconds) segment of a take, stretched to fill `fill` seconds.
export const CaptureClip: React.FC<{ src: string; from: number; to: number; fill: number; style?: React.CSSProperties }> =
  ({ src, from, to, fill, style }) => {
    const clipSec = Math.max(0.5, to - from);
    const playbackRate = Math.min(1.1, Math.max(0.22, clipSec / Math.max(1, fill)));
    return (
      <OffthreadVideo
        src={staticFile(src)}
        trimBefore={Math.round(from * FPS)}
        playbackRate={playbackRate}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", ...style }}
      />
    );
  };
