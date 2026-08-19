import Link from "next/link";

const STEPS = [
  {
    title: "Drop in a prompt",
    body: "Describe the video you want. Reelforge renders it and adds it to your queue.",
  },
  {
    title: "Connect your accounts",
    body: "Link YouTube and TikTok once. Reelforge posts to every account you connect.",
  },
  {
    title: "Set your schedule",
    body: "Pick up to 3 times a day. Reelforge posts the next ready video automatically.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">Reelforge</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-neutral-300 hover:text-white">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-white px-4 py-2 font-medium text-black hover:bg-neutral-200"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-20 text-center sm:py-28">
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            AI-generated video, posted on autopilot
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-400">
            Queue up prompts, connect YouTube and TikTok, and let Reelforge
            publish 2–3 times a day without you touching an editor.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-white px-6 py-3 text-sm font-medium text-black hover:bg-neutral-200"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-neutral-800 px-6 py-3 text-sm font-medium text-neutral-200 hover:bg-neutral-900"
            >
              I have an account
            </Link>
          </div>
        </section>

        <section className="grid gap-6 pb-24 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6"
            >
              <span className="text-sm font-medium text-neutral-500">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-2 text-lg font-medium">{step.title}</h2>
              <p className="mt-2 text-sm text-neutral-400">{step.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-neutral-900 py-8 text-center text-sm text-neutral-600">
        Reelforge
      </footer>
    </div>
  );
}
