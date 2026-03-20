import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { LayoutDashboard, ArrowLeft, TrendingUp, BarChart2 } from "lucide-react";

export default async function FolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const folder = await prisma.folder.findUnique({
    where: { id },
    include: {
      dashboardLinks: { orderBy: { order: "asc" } },
    },
  });

  if (!folder) {
    notFound();
  }

  let dashboardLinks = folder.dashboardLinks;

  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    const userId = (session.user as { id?: string }).id;

    if (role === "ADMIN") {
      dashboardLinks = folder.dashboardLinks;
    } else if (role === "USER" && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { groupId: true },
      });
      if (user?.groupId) {
        const allowedIds = new Set(
          (
            await prisma.groupDashboardAccess.findMany({
              where: { groupId: user.groupId },
              select: { dashboardId: true },
            })
          ).map((a) => a.dashboardId)
        );
        dashboardLinks = folder.dashboardLinks.filter((link) => allowedIds.has(link.id));
      } else {
        dashboardLinks = [];
      }
    }
  } else {
    dashboardLinks = [];
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/folder"
          className="flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Carpetas
        </Link>
      </div>
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        {folder.name}
      </h1>
      {folder.description && (
        <p className="mb-6 text-zinc-500 dark:text-zinc-400">
          {folder.description}
        </p>
      )}

      {dashboardLinks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <LayoutDashboard className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" />
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            No hay dashboards en esta carpeta.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {dashboardLinks.map((link) => {
            const trendUp = link.kpiTrend?.startsWith("+");
            const trendDown = link.kpiTrend?.startsWith("-");
            return (
              <Link
                key={link.id}
                href={`/dashboard/${link.id}`}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                    {link.kpiValue || link.kpiTrend ? (
                      <TrendingUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <BarChart2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    )}
                  </div>
                </div>
                <h2 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">
                  {link.title}
                </h2>
                {link.description && (
                  <p className="mb-3 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                    {link.description}
                  </p>
                )}
                {link.kpiValue && (
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {link.kpiValue}
                  </p>
                )}
                {link.kpiTrend && (
                  <p
                    className={
                      trendUp
                        ? "text-sm font-medium text-emerald-600 dark:text-emerald-400"
                        : trendDown
                          ? "text-sm font-medium text-red-600 dark:text-red-400"
                          : "text-sm font-medium text-slate-500 dark:text-slate-400"
                    }
                  >
                    {link.kpiTrend}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
