"use client";

import { useState } from "react";

type Slot = { id: string; hour: number; minute: number; active: boolean };

const TIMEZONES =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : ["UTC"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function ScheduleClient({
  initialSlots,
  timezone,
}: {
  initialSlots: Slot[];
  timezone: string;
}) {
  const [slots, setSlots] = useState(initialSlots);
  const [tz, setTz] = useState(timezone);
  const [time, setTime] = useState("09:00");
  const [error, setError] = useState<string | null>(null);
  const [savingTz, setSavingTz] = useState(false);

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const [hour, minute] = time.split(":").map(Number);
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hour, minute }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to add slot");
      return;
    }
    setSlots((prev) =>
      [...prev, json.slot].sort((a, b) => a.hour - b.hour || a.minute - b.minute)
    );
  }

  async function removeSlot(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/schedule/${id}`, { method: "DELETE" });
  }

  async function saveTimezone(next: string) {
    setTz(next);
    setSavingTz(true);
    await fetch("/api/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: next }),
    });
    setSavingTz(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Posting Schedule</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Choose up to 3 times a day. When a slot&apos;s time passes, the oldest
        ready video in your queue is posted to every connected account.
      </p>

      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
        <label className="text-sm font-medium text-neutral-300">
          Timezone
          <select
            value={tz}
            onChange={(e) => saveTimezone(e.target.value)}
            className="mt-1 block w-full max-w-sm rounded-md border border-neutral-800 bg-neutral-950 p-2.5 text-sm text-neutral-100 outline-none focus:border-neutral-600"
          >
            {TIMEZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </label>
        {savingTz && <p className="mt-1 text-xs text-neutral-500">Saving...</p>}
      </div>

      <form
        onSubmit={addSlot}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-5"
      >
        <label className="text-sm font-medium text-neutral-300">
          Time
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 block rounded-md border border-neutral-800 bg-neutral-950 p-2.5 text-sm text-neutral-100 outline-none focus:border-neutral-600"
          />
        </label>
        <button
          type="submit"
          disabled={slots.length >= 3}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
        >
          Add slot
        </button>
        {slots.length >= 3 && (
          <span className="text-xs text-neutral-500">Limit is 3 slots per day</span>
        )}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </form>

      <div className="mt-6 flex flex-col gap-2">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3"
          >
            <span className="text-sm font-medium">
              {pad(slot.hour)}:{pad(slot.minute)} ({tz})
            </span>
            <button
              onClick={() => removeSlot(slot.id)}
              className="text-xs text-neutral-500 hover:text-red-400"
            >
              Remove
            </button>
          </div>
        ))}
        {slots.length === 0 && (
          <p className="text-sm text-neutral-500">No posting slots yet.</p>
        )}
      </div>
    </div>
  );
}
