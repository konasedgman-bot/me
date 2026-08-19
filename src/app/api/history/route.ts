import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const posts = await prisma.scheduledPost.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      project: { select: { prompt: true } },
      socialAccount: { select: { platform: true, displayName: true } },
    },
  });

  return NextResponse.json({ posts });
}
