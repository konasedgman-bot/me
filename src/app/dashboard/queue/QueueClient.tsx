"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SerializedProject } from "@/lib/serialize";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-neutral-800 text-neutral-300",
  GENERATING: "bg-blue-950 text-blue-300",
  READY: "bg-emerald-950 text-emerald-300",
  FAILED: "bg-red-950 text-red-300",
  QUEUED: "bg-neutral-800 text-neutral-300",
};

export default function QueueClient({
  initialProjects,
}: {
  initialProjects: SerializedProject[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [prompt, setPrompt] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, caption, hashtags }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create video");
      setProjects((prev) => [json.project, ...prev]);
      setPrompt("");
      setCaption("");
      setHashtags("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Content Queue</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Add a prompt and Reelforge renders a video for it right away. Ready
        videos are consumed automatically by your posting schedule, oldest
        first.
      </p>

      <form
        onSubmit={handleCreate}
        className="mt-6 flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-5"
      >
        <label className="text-sm font-medium text-neutral-300">
          Prompt
          <textarea
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A fast-paced recap of 3 productivity tips for developers"
            rows={2}
            className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-100 outline-none focus:border-neutral-600"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-neutral-300">
            Caption
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Post caption"
              className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-100 outline-none focus:border-neutral-600"
            />
          </label>
          <label className="text-sm font-medium text-neutral-300">
            Hashtags
            <input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#shorts #ai"
              className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-100 outline-none focus:border-neutral-600"
            />
          </label>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
        >
          {submitting ? "Generating..." : "Generate video"}
        </button>
      </form>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50"
          >
            {project.playbackUrl ? (
              <video
                src={project.playbackUrl}
                controls
                muted
                className="aspect-[9/16] w-full bg-black object-cover"
              />
            ) : (
              <div className="flex aspect-[9/16] w-full items-center justify-center bg-neutral-950 text-sm text-neutral-500">
                {project.status === "GENERATING" ? "Rendering..." : "No preview"}
              </div>
            )}
            <div className="p-4">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[project.status] ?? ""}`}
              >
                {project.status}
              </span>
              <p className="mt-2 line-clamp-2 text-sm text-neutral-200">
                {project.prompt}
              </p>
              {project.errorMessage && (
                <p className="mt-1 text-xs text-red-400">{project.errorMessage}</p>
              )}
              <button
                onClick={() => handleDelete(project.id)}
                className="mt-3 text-xs text-neutral-500 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <p className="mt-8 text-sm text-neutral-500">
          No videos yet. Add your first prompt above.
        </p>
      )}
    </div>
  );
}
