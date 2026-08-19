import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const [slots, user] = await Promise.all([
    prisma.scheduleSlot.findMany({
      where: { userId },
      orderBy: [{ hour: "asc" }, { minute: "asc" }],
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
  ]);

  return NextResponse.json({ slots, timezone: user?.timezone ?? "UTC" });
}

const schema = z.object({
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existingCount = await prisma.scheduleSlot.count({ where: { userId, active: true } });
  if (existingCount >= 3) {
    return NextResponse.json(
      { error: "Limit is 3 posting slots per day" },
      { status: 400 }
    );
  }

  const slot = await prisma.scheduleSlot.create({
    data: { userId, hour: parsed.data.hour, minute: parsed.data.minute },
  });

  return NextResponse.json({ slot });
}

const timezoneSchema = z.object({ timezone: z.string().min(1).max(100) });

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = timezoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: parsed.data.timezone });
  } catch {
    return NextResponse.json({ error: "Unknown timezone" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { timezone: parsed.data.timezone },
  });

  return NextResponse.json({ ok: true });
}
