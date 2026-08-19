import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.videoProject.findUnique({ where: { id } });
  if (!project || project.userId !== userId || !project.videoData) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(project.videoData), {
    headers: {
      "Content-Type": project.videoMime ?? "video/mp4",
      "Content-Length": String(project.videoData.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
