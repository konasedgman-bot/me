import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/queue", label: "Content Queue" },
  { href: "/dashboard/schedule", label: "Schedule" },
  { href: "/dashboard/accounts", label: "Connected Accounts" },
  { href: "/dashboard/history", label: "Post History" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex max-w-6xl">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-neutral-800 p-6 md:flex">
          <Link href="/" className="mb-8 text-lg font-semibold tracking-tight">
            Reelforge
          </Link>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3 border-t border-neutral-800 pt-4">
            <span className="truncate text-xs text-neutral-500">{user.email}</span>
            <LogoutButton />
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
