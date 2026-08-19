import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import DisconnectButton from "./DisconnectButton";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const userId = await requireUserId();
  const { connected, error } = await searchParams;

  const accounts = await prisma.socialAccount.findMany({
    where: { userId },
    orderBy: { connectedAt: "desc" },
  });

  const hasYoutube = accounts.some((a) => a.platform === "YOUTUBE");
  const hasTiktok = accounts.some((a) => a.platform === "TIKTOK");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Connected Accounts</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Connect the accounts you want Reelforge to post to. Every ready video
        is posted to all connected accounts at each scheduled slot.
      </p>

      {connected && (
        <div className="mt-4 rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-3 text-sm text-emerald-200">
          Connected {connected} successfully.
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">
          {decodeURIComponent(error)}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
          <h2 className="font-medium">YouTube</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Uploads as public Shorts by default via the YouTube Data API.
          </p>
          {!hasYoutube && (
            // eslint-disable-next-line @next/next/no-html-link-for-pages -- full navigation into an OAuth redirect, not a Next page
            <a
              href="/api/accounts/youtube/connect"
              className="mt-4 inline-block rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
            >
              Connect YouTube
            </a>
          )}
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
          <h2 className="font-medium">TikTok</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Posts via TikTok&apos;s Content Posting API. Unaudited apps can only
            post as private / self-view.
          </p>
          {!hasTiktok && (
            // eslint-disable-next-line @next/next/no-html-link-for-pages -- full navigation into an OAuth redirect, not a Next page
            <a
              href="/api/accounts/tiktok/connect"
              className="mt-4 inline-block rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
            >
              Connect TikTok
            </a>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3"
          >
            <div>
              <span className="text-xs uppercase tracking-wide text-neutral-500">
                {account.platform}
              </span>
              <p className="text-sm font-medium">{account.displayName}</p>
            </div>
            <DisconnectButton id={account.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
