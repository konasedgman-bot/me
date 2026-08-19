import { mockProvider } from "./mock";
import type { VideoProvider } from "./types";

export type { GeneratedVideo, VideoProvider } from "./types";

// To use a real generator (Runway, Luma, Pika, Kling, HeyGen, etc.), add a
// provider module implementing VideoProvider and return it here based on
// env vars, e.g. process.env.VIDEO_PROVIDER === "runway".
export function getVideoProvider(): VideoProvider {
  return mockProvider;
}
