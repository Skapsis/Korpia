import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SupersetDashboard } from "@/components/dashboard/SupersetDashboard";
import { FavoriteButton } from "@/components/dashboard/FavoriteButton";
import { getVisibleFolderIdSet } from "@/lib/folderAccess";

type PageProps = {
  params: Promise<{ linkId: string }>;
};

export default async function DashboardDetailPage({ params }: PageProps) {
  const session = await auth();
  const userId = typeof session?.user?.id === "string" ? session.user.id : "";
  const role = typeof session?.user?.role === "string" ? session.user.role : "USER";

  if (!userId) {
    redirect("/login");
  }

  const { linkId } = await params;

  const dashboard = await prisma.dashboardLink.findUnique({
    where: { id: linkId },
    include: {
      folder: {
        select: { id: true, name: true },
      },
    },
  });

  if (!dashboard) {
    notFound();
  }

  if (role !== "ADMIN") {
    const visibleFolderIds = await getVisibleFolderIdSet(userId);
    if (!visibleFolderIds.has(dashboard.folderId)) {
      redirect("/folder");
    }
  }

  const favoriteRecord = await prisma.user.findFirst({
    where: {
      id: userId,
      favoriteDashboards: {
        some: {
          id: dashboard.id,
        },
      },
    },
    select: { id: true },
  });

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="shrink-0 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-3">
          <Link
            href={`/folder/${dashboard.folderId}`}
            className="flex w-fit items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a {dashboard.folder?.name ?? "la carpeta"}
          </Link>

          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {dashboard.title}
            </h1>
            <FavoriteButton dashboardId={dashboard.id} initialIsFavorite={Boolean(favoriteRecord)} />
          </div>

          {dashboard.description ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{dashboard.description}</p>
          ) : null}
        </div>
      </header>

      <main className="min-h-0 flex-1 p-0">
        <SupersetDashboard dashboardId={dashboard.url} />
      </main>
    </div>
  );
}
