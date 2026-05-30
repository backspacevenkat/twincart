import { Composition } from "remotion";
import { TwinCartVideo } from "./Video";
import { FPS, totalFrames } from "./lib/manifest";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="TwinCartDemo"
    component={TwinCartVideo}
    durationInFrames={totalFrames()}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
