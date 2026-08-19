import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import ScheduleClient from "./ScheduleClient";

export default async function SchedulePage() {
  const userId = await requireUserId();
  const [slots, user] = await Promise.all([
    prisma.scheduleSlot.findMany({
      where: { userId },
      orderBy: [{ hour: "asc" }, { minute: "asc" }],
    }),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);

  return (
    <ScheduleClient
      initialSlots={slots.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))}
      timezone={user.timezone}
    />
  );
}
