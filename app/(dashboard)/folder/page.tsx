import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FolderOpen } from "lucide-react";

export default async function FolderListPage() {
  const folders = await prisma.folder.findMany({
    select: { id: true, name: true, description: true, order: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        Carpetas
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => (
          <Link
            key={folder.id}
            href={`/folder/${folder.id}`}
            className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <FolderOpen className="mt-0.5 h-6 w-6 shrink-0 text-zinc-500 dark:text-zinc-400" />
            <div>
              <h2 className="font-medium text-zinc-900 dark:text-zinc-100">
                {folder.name}
              </h2>
              {folder.description && (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {folder.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
