import Link from "next/link";
import { Folder, FolderLock, Star } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardCard } from "@/components/folder/DashboardCard";

export default async function DashboardEntryPage() {
  const session = await auth();
  const userId = typeof session?.user?.id === "string" ? session.user.id : "";
  const userRole = typeof session?.user?.role === "string" ? session.user.role : "USER";

  if (!userId) {
    redirect("/login");
  }

  const isAdmin = userRole === "ADMIN";

  const rootFolders = await prisma.folder.findMany({
    where: isAdmin
      ? { parentId: null }
      : {
          parentId: null,
          folderAccess: {
            some: {
              userId,
            },
          },
        },
    orderBy: { order: "asc" },
  });

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      favoriteDashboards: {
        include: {
          folder: {
            select: { id: true, name: true },
          },
        },
        orderBy: { title: "asc" },
      },
    },
  });

  const favoriteDashboards = currentUser?.favoriteDashboards ?? [];

  return (
    <div className="space-y-8 p-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Mis Indicadores Favoritos
          </h1>
        </div>

        {favoriteDashboards.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
            Aún no tienes favoritos. Explora tus carpetas y marca indicadores con el icono de
            corazón para verlos aquí.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {favoriteDashboards.map((dashboard) => (
              <DashboardCard key={dashboard.id} link={dashboard} initialIsFavorite />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center gap-2">
          <Folder className="h-5 w-5 text-zinc-500" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Carpetas principales
          </h2>
        </div>

        {rootFolders.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center px-4 text-center">
            <FolderLock className="mb-4 h-14 w-14 text-gray-400" />
            <p className="max-w-md text-sm text-gray-500 dark:text-zinc-400">
              Actualmente no tienes carpetas asignadas. Contacta con tu administrador para obtener
              acceso.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rootFolders.map((folder) => (
              <Link
                key={folder.id}
                href={`/folder/${folder.id}`}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-medium text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700"
              >
                {folder.name}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
