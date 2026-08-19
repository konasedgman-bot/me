"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      className="rounded-md border border-neutral-800 px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-900 hover:text-white"
    >
      Sign out
    </button>
  );
}
