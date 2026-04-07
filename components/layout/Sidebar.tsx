import Link from "next/link";
import { Folder, LayoutDashboard, LogOut, Settings, User } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/app/actions/logout";
import { getVisibleRootFoldersForUser } from "@/lib/folderAccess";

export async function Sidebar() {
  const session = await auth();
  const userId = typeof session?.user?.id === "string" ? session.user.id : undefined;
  const role = typeof session?.user?.role === "string" ? session.user.role : undefined;
  const isAdmin = role === "ADMIN";

  if (!userId) {
    redirect("/login");
  }

  const folders = isAdmin
    ? await prisma.folder.findMany({
        where: { parentId: null },
        orderBy: { order: "asc" },
      })
    : await getVisibleRootFoldersForUser(userId);

  const userDisplayName =
    (typeof session?.user?.name === "string" && session.user.name.trim().length > 0
      ? session.user.name
      : undefined) ??
    (typeof session?.user?.email === "string" ? session.user.email : "Invitado");
  const userEmail = typeof session?.user?.email === "string" ? session.user.email : "";

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-5 dark:border-zinc-800">
        <LayoutDashboard className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Korpia2</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {folders.map((folder) => (
          <Link
            key={folder.id}
            href={`/folder/${folder.id}`}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <Folder className="h-4 w-4 shrink-0" />
            <span className="truncate">{folder.name}</span>
          </Link>
        ))}
      </nav>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        {isAdmin && (
          <Link
            href="/admin"
            className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <Settings className="h-4 w-4 shrink-0" />
            Administración
          </Link>
        )}

        <Link
          href="/profile"
          className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <User className="h-4 w-4 shrink-0" />
          Perfil
        </Link>

        <div className="mb-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
          <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">{userDisplayName}</p>
          {userEmail ? (
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{userEmail}</p>
          ) : null}
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
