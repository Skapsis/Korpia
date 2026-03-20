import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 px-4 dark:bg-zinc-950">
      <h1 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Portal BI · Korpia2
      </h1>
      <p className="max-w-md text-center text-zinc-600 dark:text-zinc-400">
        Accede a tus carpetas y dashboards de negocio desde un solo lugar.
      </p>
      <Link
        href="/folder"
        className="flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        <LayoutDashboard className="h-5 w-5" />
        Ir al dashboard
      </Link>
    </div>
  );
}
