import { AbsoluteFill, Sequence, Audio, staticFile } from "remotion";
import { MANIFEST, sceneFrames } from "./lib/manifest";
import { S1_Hook } from "./scenes/S1_Hook";
import { S2_TwinIdea } from "./scenes/S2_TwinIdea";
import { S3_HowTwinsFound } from "./scenes/S3_HowTwinsFound";
import { S4_TwinPayoff } from "./scenes/S4_TwinPayoff";
import { S5_AgentCheckout } from "./scenes/S5_AgentCheckout";
import { S6_Close } from "./scenes/S6_Close";

const BODY: Record<string, React.FC<{ dur: number }>> = {
  s1: S1_Hook, s2: S2_TwinIdea, s3: S3_HowTwinsFound, s4: S4_TwinPayoff, s5: S5_AgentCheckout, s6: S6_Close,
};

export const TwinCartVideo: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1220" }}>
      {MANIFEST.map((s) => {
        const dur = sceneFrames(s);
        const Body = BODY[s.scene] ?? (() => null);
        const seq = (
          <Sequence key={s.scene} from={from} durationInFrames={dur} name={s.scene}>
            <Body dur={s.durationSeconds} />
            {s.audioFile ? <Audio src={staticFile(s.audioFile)} /> : null}
          </Sequence>
        );
        from += dur;
        return seq;
      })}
    </AbsoluteFill>
  );
};
