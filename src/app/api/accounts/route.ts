import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const accounts = await prisma.socialAccount.findMany({
    where: { userId },
    select: {
      id: true,
      platform: true,
      displayName: true,
      connectedAt: true,
    },
    orderBy: { connectedAt: "desc" },
  });

  return NextResponse.json({ accounts });
}
