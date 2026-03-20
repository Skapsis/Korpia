import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SupersetDashboard } from "@/components/SupersetDashboard";

export default async function DashboardDetailPage({
  params,
}: {
  params: Promise<{ linkId: string }>;
}) {
  const { linkId } = await params;

  const dashboard = await prisma.dashboardLink.findUnique({
    where: { id: linkId },
  });

  if (!dashboard) {
    notFound();
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-0px)] flex-col">
      <header className="shrink-0 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-3">
          <Link
            href={`/folder/${dashboard.folderId}`}
            className="flex w-fit items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {dashboard.title}
          </h1>
          {dashboard.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {dashboard.description}
            </p>
          )}
        </div>
      </header>
      <div className="min-h-0 flex-1 p-6">
        <SupersetDashboard dashboardId={dashboard.url} />
      </div>
    </div>
  );
}
