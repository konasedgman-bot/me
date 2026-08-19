import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { getVideoProvider } from "@/lib/videoProviders";
import { serializeProject } from "@/lib/serialize";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const projects = await prisma.videoProject.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ projects: projects.map(serializeProject) });
}

const schema = z.object({
  prompt: z.string().min(1).max(500),
  caption: z.string().max(2000).optional().default(""),
  hashtags: z.string().max(500).optional().default(""),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { prompt, caption, hashtags } = parsed.data;

  let project = await prisma.videoProject.create({
    data: { userId, prompt, caption, hashtags, status: "GENERATING" },
  });

  const provider = getVideoProvider();
  try {
    const video = await provider.generate(prompt);
    project = await prisma.videoProject.update({
      where: { id: project.id },
      data: {
        status: "READY",
        videoData: new Uint8Array(video.data),
        videoMime: video.mime,
        durationSec: video.durationSec,
        provider: provider.name,
      },
    });
  } catch (err) {
    project = await prisma.videoProject.update({
      where: { id: project.id },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    });
  }

  return NextResponse.json({ project: serializeProject(project) });
}
