import { youtubePoster } from "./youtube";
import { tiktokPoster } from "./tiktok";
import type { Poster } from "./types";

export type { Poster, PostVideoInput, PostVideoResult } from "./types";

export function getPoster(platform: "YOUTUBE" | "TIKTOK"): Poster {
  if (platform === "YOUTUBE") return youtubePoster;
  return tiktokPoster;
}
