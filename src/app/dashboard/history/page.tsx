import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-neutral-800 text-neutral-300",
  POSTING: "bg-blue-950 text-blue-300",
  POSTED: "bg-emerald-950 text-emerald-300",
  FAILED: "bg-red-950 text-red-300",
  SKIPPED: "bg-neutral-800 text-neutral-400",
};

export default async function HistoryPage() {
  const userId = await requireUserId();
  const posts = await prisma.scheduledPost.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      project: { select: { prompt: true } },
      socialAccount: { select: { platform: true, displayName: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Post History</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Every post Reelforge has attempted, newest first.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-neutral-900/70 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Video</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Scheduled</th>
              <th className="px-4 py-3">Posted</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-t border-neutral-800">
                <td className="max-w-xs truncate px-4 py-3 text-neutral-200">
                  {post.project.prompt}
                </td>
                <td className="px-4 py-3 text-neutral-400">
                  {post.socialAccount.platform} · {post.socialAccount.displayName}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[post.status] ?? ""}`}
                  >
                    {post.status}
                  </span>
                  {post.errorMessage && (
                    <p className="mt-1 max-w-xs truncate text-xs text-red-400">
                      {post.errorMessage}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {post.scheduledAt.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {post.postedAt ? post.postedAt.toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <p className="p-6 text-sm text-neutral-500">Nothing posted yet.</p>
        )}
      </div>
    </div>
  );
}
