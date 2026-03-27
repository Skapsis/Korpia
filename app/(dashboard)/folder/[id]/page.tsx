import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { LayoutDashboard } from "lucide-react";
import { DashboardCard } from "@/components/folder/DashboardCard";

export default async function FolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = typeof session?.user?.id === "string" ? session.user.id : "";
  const role = typeof session?.user?.role === "string" ? session.user.role : "USER";
  const isAdmin = role === "ADMIN";

  if (!userId) {
    redirect("/login");
  }

  const { id } = await params;

  const folder = await prisma.folder.findUnique({
    where: { id },
    include: { dashboardLinks: { orderBy: { order: "asc" } } },
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

  return (
    <div className="p-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">{folder.name}</h1>
        {folder.description ? (
          <p className="mt-2 text-sm text-gray-500">{folder.description}</p>
        ) : null}
      </header>

      {folder.dashboardLinks.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <LayoutDashboard className="mx-auto h-12 w-12 text-zinc-400" />
          <p className="mt-2 text-sm text-zinc-500">Aún no hay dashboards en esta carpeta.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {folder.dashboardLinks.map((link) => (
            <DashboardCard key={link.id} link={link} />
          ))}
        </div>
      )}
    </div>
  );
}
