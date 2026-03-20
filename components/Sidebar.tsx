import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/app/actions/logout";
import { FolderOpen, LayoutDashboard, Settings, LogOut } from "lucide-react";

export async function Sidebar() {
  const session = await auth();

  if (!session?.user) {
    return (
      <aside className="flex w-56 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-800">
          <LayoutDashboard className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Portal BI
          </span>
        </div>
      </aside>
    );
  }

  const role = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id;

  const folders =
    role === "ADMIN"
      ? await prisma.folder.findMany({
          select: { id: true, name: true, order: true },
          orderBy: { order: "asc" },
        })
      : userId
        ? await prisma.folder.findMany({
            where: {
              folderAccess: {
                some: { userId },
              },
            },
            select: { id: true, name: true, order: true },
            orderBy: { order: "asc" },
          })
        : [];

  const sorted = [...folders].sort((a, b) => a.order - b.order);

  return (
    <aside className="flex w-56 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-800">
        <LayoutDashboard className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          Portal BI
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        <Link
          href="/"
          className="rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          Inicio
        </Link>
        {sorted.map((folder) => (
          <Link
            key={folder.id}
            href={`/folder/${folder.id}`}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <FolderOpen className="h-4 w-4 shrink-0" />
            {folder.name}
          </Link>
        ))}
        <div className="mt-auto border-t border-zinc-200 pt-2 dark:border-zinc-800">
          {role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <Settings className="h-4 w-4 shrink-0" />
              Administración
            </Link>
          )}
          <form action={logoutAction} className="mt-1">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </nav>
    </aside>
  );
}
