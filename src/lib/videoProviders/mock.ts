import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import type { GeneratedVideo, VideoProvider } from "./types";

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

const DURATION_SEC = 6;
const WIDTH = 720;
const HEIGHT = 1280;

function seedFromPrompt(prompt: string) {
  return crypto.createHash("sha256").update(prompt).digest().readUInt32BE(0);
}

// Placeholder generator: renders an animated gradient clip so the full
// generate -> schedule -> post pipeline is exercisable end to end without
// a paid video-generation API. Swap this out for a real provider in index.ts.
export const mockProvider: VideoProvider = {
  name: "mock",
  async generate(prompt: string): Promise<GeneratedVideo> {
    const seed = seedFromPrompt(prompt);
    const speed = 0.15 + (seed % 100) / 400;
    const hue = seed % 360;
    const tone = 180 + (seed % 300);

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vid-"));
    const outPath = path.join(tmpDir, "out.mp4");

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(
            `gradients=s=${WIDTH}x${HEIGHT}:d=${DURATION_SEC}:speed=${speed}:seed=${seed % 10000}`
          )
          .inputFormat("lavfi")
          .input(`sine=frequency=${tone}:duration=${DURATION_SEC}`)
          .inputFormat("lavfi")
          .videoFilters([`hue=h=${hue}`])
          .outputOptions([
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-shortest",
            "-movflags",
            "+faststart",
          ])
          .output(outPath)
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .run();
      });

      const data = await fs.readFile(outPath);
      return { data, mime: "video/mp4", durationSec: DURATION_SEC };
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  },
};
