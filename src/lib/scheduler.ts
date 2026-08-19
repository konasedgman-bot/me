import { toZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/db";
import { getPoster } from "@/lib/posters";

function slotDateKey(now: Date, timezone: string) {
  const zoned = toZonedTime(now, timezone);
  return zoned.toISOString().slice(0, 10);
}

function slotHasPassed(now: Date, timezone: string, hour: number, minute: number) {
  const zoned = toZonedTime(now, timezone);
  return (
    zoned.getHours() > hour ||
    (zoned.getHours() === hour && zoned.getMinutes() >= minute)
  );
}

// Turns due schedule slots into ScheduledPost rows, one per connected
// account, consuming the oldest READY video project that hasn't been used.
export async function fillDueSlots(now = new Date()) {
  const users = await prisma.user.findMany({
    include: {
      scheduleSlots: { where: { active: true } },
      socialAccounts: true,
    },
  });

  let created = 0;

  for (const user of users) {
    if (user.socialAccounts.length === 0) continue;
    const dateKey = slotDateKey(now, user.timezone);

    for (const slot of user.scheduleSlots) {
      if (!slotHasPassed(now, user.timezone, slot.hour, slot.minute)) continue;

      const existing = await prisma.scheduledPost.findFirst({
        where: { scheduleSlotId: slot.id, slotDate: dateKey },
      });
      if (existing) continue;

      const project = await prisma.videoProject.findFirst({
        where: { userId: user.id, status: "READY", scheduledPosts: { none: {} } },
        orderBy: { createdAt: "asc" },
      });
      if (!project) continue;

      await prisma.$transaction(
        user.socialAccounts.map((account) =>
          prisma.scheduledPost.create({
            data: {
              userId: user.id,
              projectId: project.id,
              socialAccountId: account.id,
              scheduleSlotId: slot.id,
              slotDate: dateKey,
              scheduledAt: now,
              status: "PENDING",
            },
          })
        )
      );
      created += user.socialAccounts.length;
    }
  }

  return { created };
}

export async function postDuePosts(now = new Date()) {
  const due = await prisma.scheduledPost.findMany({
    where: { status: "PENDING", scheduledAt: { lte: now } },
    include: { project: true, socialAccount: true },
  });

  let posted = 0;
  let failed = 0;

  for (const post of due) {
    await prisma.scheduledPost.update({
      where: { id: post.id },
      data: { status: "POSTING" },
    });

    try {
      if (!post.project.videoData) {
        throw new Error("Video project has no rendered video data");
      }
      const poster = getPoster(post.socialAccount.platform);
      const result = await poster.post({
        accessToken: post.socialAccount.accessToken,
        refreshToken: post.socialAccount.refreshToken,
        videoBytes: Buffer.from(post.project.videoData),
        mime: post.project.videoMime ?? "video/mp4",
        title: post.project.prompt,
        caption: post.project.caption || post.project.prompt,
      });

      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: {
          status: "POSTED",
          platformPostId: result.platformPostId,
          postedAt: new Date(),
        },
      });
      posted += 1;
    } catch (err) {
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: {
          status: "FAILED",
          errorMessage: err instanceof Error ? err.message : String(err),
        },
      });
      failed += 1;
    }
  }

  return { posted, failed };
}

export async function runSchedulerCycle(now = new Date()) {
  const fill = await fillDueSlots(now);
  const post = await postDuePosts(now);
  return { ...fill, ...post };
}
