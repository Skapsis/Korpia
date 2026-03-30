import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardDetailLoading() {
  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 px-6 py-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-72" />
        <Skeleton className="mt-2 h-4 w-1/2" />
      </header>

      <main className="bg-gray-50 p-6 dark:bg-zinc-950">
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </main>
    </div>
  );
}
