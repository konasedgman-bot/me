"use client";

import { useRouter } from "next/navigation";

export default function DisconnectButton({ id }: { id: string }) {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await fetch(`/api/accounts/${id}`, { method: "DELETE" });
        router.refresh();
      }}
      className="text-xs text-neutral-500 hover:text-red-400"
    >
      Disconnect
    </button>
  );
}
