import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { ChevronRight, Folder, LayoutDashboard } from "lucide-react";
import { DashboardCard } from "@/components/folder/DashboardCard";

export default async function FolderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ favorites?: string }>;
}) {
  const session = await auth();
  const userId = typeof session?.user?.id === "string" ? session.user.id : "";
  const role = typeof session?.user?.role === "string" ? session.user.role : "USER";
  const isAdmin = role === "ADMIN";

  if (!userId) {
    redirect("/login");
  }

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const showOnlyFavorites = resolvedSearchParams?.favorites === "1";

  const folder = await prisma.folder.findUnique({
    where: { id },
    include: {
      dashboardLinks: { orderBy: { order: "asc" } },
      children: {
        where: isAdmin
          ? {}
          : {
              folderAccess: {
                some: {
                  userId,
                },
              },
            },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!folder) {
    notFound();
  }

  if (!isAdmin) {
    const hasFolderAccess = await prisma.folderAccess.findFirst({
      where: {
        userId,
        folderId: folder.id,
      },
      select: { id: true },
    });

    if (!hasFolderAccess) {
      redirect("/folder");
    }
  }

  const userWithFavorites = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      favoriteDashboards: {
        select: { id: true },
      },
    },
  });
  const favoriteDashboardIds = new Set(
    userWithFavorites?.favoriteDashboards.map((dashboard) => dashboard.id) ?? []
  );
  const visibleDashboards = showOnlyFavorites
    ? folder.dashboardLinks.filter((dashboard) => favoriteDashboardIds.has(dashboard.id))
    : folder.dashboardLinks;

  const breadcrumbChain: { id: string; name: string }[] = [];
  let currentParentId = folder.parentId;

  while (currentParentId) {
    const parentFolder = await prisma.folder.findUnique({
      where: { id: currentParentId },
      select: { id: true, name: true, parentId: true },
    });

    if (!parentFolder) {
      break;
    }

    breadcrumbChain.unshift({ id: parentFolder.id, name: parentFolder.name });
    currentParentId = parentFolder.parentId;
  }

  return (
    <div className="p-6">
      <header>
        <div className="mb-3 flex items-center justify-between gap-2">
          <nav className="flex flex-wrap items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/folder" className="rounded px-1 py-0.5 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
              Inicio
            </Link>
            {breadcrumbChain.map((item) => (
              <div key={item.id} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" />
                <Link
                  href={`/folder/${item.id}`}
                  className="rounded px-1 py-0.5 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  {item.name}
                </Link>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="rounded bg-zinc-100 px-1 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {folder.name}
              </span>
            </div>
          </nav>

          <Link
            href={showOnlyFavorites ? `/folder/${folder.id}` : `/folder/${folder.id}?favorites=1`}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {showOnlyFavorites ? "Ver todos" : "Solo favoritos"}
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{folder.name}</h1>
        {folder.description ? (
          <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">{folder.description}</p>
        ) : null}
      </header>

      {folder.children.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Subcarpetas
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {folder.children.map((child) => (
              <Link
                key={child.id}
                href={`/folder/${child.id}`}
                className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-zinc-500" />
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{child.name}</h3>
                </div>
                {child.description ? (
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{child.description}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {visibleDashboards.length === 0 && folder.children.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <LayoutDashboard className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" />
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {showOnlyFavorites
              ? "No tienes indicadores favoritos en esta carpeta."
              : "Esta carpeta no tiene subcarpetas ni dashboards."}
          </p>
        </div>
      ) : visibleDashboards.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleDashboards.map((link) => (
            <DashboardCard
              key={link.id}
              link={link}
              initialIsFavorite={favoriteDashboardIds.has(link.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
