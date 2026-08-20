import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import type { GeneratedVideo, VideoProvider } from "./types";

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

const DURATION_SEC = 4;
const WIDTH = 480;
const HEIGHT = 854;

function seedFromPrompt(prompt: string) {
  return crypto.createHash("sha256").update(prompt).digest().readUInt32BE(0);
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function buildGradientPpm(hue: number): Buffer {
  const header = Buffer.from(`P6\n${WIDTH} ${HEIGHT}\n255\n`, "ascii");
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);
  const [r1, g1, b1] = hslToRgb(hue, 0.65, 0.35);
  const [r2, g2, b2] = hslToRgb((hue + 70) % 360, 0.65, 0.55);
  for (let y = 0; y < HEIGHT; y++) {
    const t = y / (HEIGHT - 1);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    const row = Buffer.alloc(WIDTH * 3);
    for (let x = 0; x < WIDTH; x++) {
      row[x * 3] = r;
      row[x * 3 + 1] = g;
      row[x * 3 + 2] = b;
    }
    pixels.set(row, y * WIDTH * 3);
  }
  return Buffer.concat([header, pixels]);
}

// Placeholder generator: animates a hashed-color gradient frame so the full
// generate -> schedule -> post pipeline is exercisable end to end without a
// paid video-generation API. Swap this out for a real provider in index.ts.
// Deliberately avoids ffmpeg's lavfi virtual sources: some static ffmpeg
// builds (e.g. the Linux one fetched by ffmpeg-static) ship without
// libavdevice, which lavfi depends on, so a plain image input is used
// instead and animated purely through -vf.
export const mockProvider: VideoProvider = {
  name: "mock",
  async generate(prompt: string): Promise<GeneratedVideo> {
    const seed = seedFromPrompt(prompt);
    const hue = seed % 360;

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "vid-"));
    const framePath = path.join(tmpDir, "frame.ppm");
    const outPath = path.join(tmpDir, "out.mp4");

    try {
      await fs.writeFile(framePath, buildGradientPpm(hue));

      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(framePath)
          .inputOptions(["-loop", "1"])
          .videoFilters([`hue=h='360*t/${DURATION_SEC}':s=1.15`])
          .outputOptions([
            "-t",
            String(DURATION_SEC),
            "-r",
            "15",
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-pix_fmt",
            "yuv420p",
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
