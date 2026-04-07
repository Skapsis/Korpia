import Link from "next/link";
import { ChevronDown, User } from "lucide-react";
import { auth } from "@/auth";
import ThemeToggle from "@/components/layout/ThemeToggle";

function userInitial(name: string | null | undefined, email: string | null | undefined): string {
  if (name && name.trim().length > 0) {
    return name.trim().charAt(0).toUpperCase();
  }
  if (email && email.trim().length > 0) {
    return email.trim().charAt(0).toUpperCase();
  }
  return "U";
}

export async function DashboardHeader() {
  const session = await auth();
  const displayName =
    typeof session?.user?.name === "string" && session.user.name.trim().length > 0
      ? session.user.name.trim()
      : typeof session?.user?.email === "string"
        ? session.user.email
        : "Usuario";
  const email = typeof session?.user?.email === "string" ? session.user.email : "";
  const initial = userInitial(session?.user?.name ?? undefined, session?.user?.email ?? undefined);

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-end border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95 sm:px-6">
      <div className="flex items-center gap-4">
        <ThemeToggle />

        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-zinc-100 dark:hover:bg-zinc-800 [&::-webkit-details-marker]:hidden">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              aria-hidden
            >
              {initial}
            </span>
            <span className="hidden max-w-[140px] truncate text-sm font-medium text-zinc-800 dark:text-zinc-100 sm:inline">
              {displayName}
            </span>
            <ChevronDown className="h-4 w-4 text-zinc-500 transition group-open:rotate-180 dark:text-zinc-400" />
          </summary>
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{displayName}</p>
              {email ? (
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{email}</p>
              ) : null}
            </div>
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <User className="h-4 w-4 shrink-0" />
              Mi perfil
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
