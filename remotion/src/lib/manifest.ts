import manifest from "../data/manifest.json";

export type Word = { word: string; start: number; end: number };
export type SceneClip = { scene: string; audioFile: string | null; durationSeconds: number; words: Word[] };
export const MANIFEST = manifest as SceneClip[];
export const FPS = 30;

export const sceneFrames = (s: SceneClip) => Math.round(s.durationSeconds * FPS);
export const totalFrames = () => MANIFEST.reduce((n, s) => n + sceneFrames(s), 0);
export const sceneStartFrame = (i: number) =>
  MANIFEST.slice(0, i).reduce((n, s) => n + sceneFrames(s), 0);
