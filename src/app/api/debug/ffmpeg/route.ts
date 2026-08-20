import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export async function GET() {
  const info: Record<string, unknown> = {
    cwd: process.cwd(),
    dirname: __dirname,
  };

  try {
    info.ffmpegStaticResolved = require.resolve("ffmpeg-static");
  } catch (err) {
    info.ffmpegStaticResolveError = String(err);
  }

  try {
    const ffmpegPath = require("ffmpeg-static");
    info.ffmpegPathExport = ffmpegPath;
    info.ffmpegPathExists = ffmpegPath ? fs.existsSync(ffmpegPath) : null;
  } catch (err) {
    info.ffmpegImportError = String(err);
  }

  for (const candidate of [
    path.join(process.cwd(), "node_modules", "ffmpeg-static"),
    "/ROOT/node_modules/ffmpeg-static",
    "/opt/render/project/src/node_modules/ffmpeg-static",
  ]) {
    try {
      info[`listing:${candidate}`] = fs.readdirSync(candidate);
    } catch (err) {
      info[`listing:${candidate}`] = String(err);
    }
  }

  return NextResponse.json(info);
}
