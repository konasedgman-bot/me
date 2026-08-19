import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";

export default async function OverviewPage() {
  const userId = await requireUserId();

  const [accounts, slots, readyProjects, posted, pending] = await Promise.all([
    prisma.socialAccount.count({ where: { userId } }),
    prisma.scheduleSlot.count({ where: { userId, active: true } }),
    prisma.videoProject.count({ where: { userId, status: "READY", scheduledPosts: { none: {} } } }),
    prisma.scheduledPost.count({ where: { userId, status: "POSTED" } }),
    prisma.scheduledPost.count({ where: { userId, status: "PENDING" } }),
  ]);

  const stats = [
    { label: "Connected accounts", value: accounts, href: "/dashboard/accounts" },
    { label: "Posting slots / day", value: slots, href: "/dashboard/schedule" },
    { label: "Videos ready to post", value: readyProjects, href: "/dashboard/queue" },
    { label: "Posts published", value: posted, href: "/dashboard/history" },
    { label: "Posts pending", value: pending, href: "/dashboard/history" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Overview</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Reelforge generates short videos and posts them to your connected
        accounts on schedule.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 transition hover:border-neutral-700"
          >
            <div className="text-3xl font-semibold">{s.value}</div>
            <div className="mt-1 text-sm text-neutral-400">{s.label}</div>
          </Link>
        ))}
      </div>

      {accounts === 0 && (
        <div className="mt-8 rounded-xl border border-amber-900/50 bg-amber-950/30 p-5 text-sm text-amber-200">
          Connect a YouTube or TikTok account to start posting.{" "}
          <Link href="/dashboard/accounts" className="underline">
            Connect now
          </Link>
        </div>
      )}
      {accounts > 0 && slots === 0 && (
        <div className="mt-8 rounded-xl border border-amber-900/50 bg-amber-950/30 p-5 text-sm text-amber-200">
          Set up posting times so Reelforge knows when to publish.{" "}
          <Link href="/dashboard/schedule" className="underline">
            Set schedule
          </Link>
        </div>
      )}
      {accounts > 0 && slots > 0 && readyProjects === 0 && (
        <div className="mt-8 rounded-xl border border-amber-900/50 bg-amber-950/30 p-5 text-sm text-amber-200">
          Your queue is empty. Add a prompt so there is a video ready for the
          next slot.{" "}
          <Link href="/dashboard/queue" className="underline">
            Add to queue
          </Link>
        </div>
      )}
    </div>
  );
}
