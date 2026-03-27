import { FolderLock } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardEntryPage() {
  const session = await auth();
  const userId = typeof session?.user?.id === "string" ? session.user.id : "";
  const userRole = typeof session?.user?.role === "string" ? session.user.role : "USER";

  if (!userId) {
    redirect("/login");
  }

  const isAdmin = userRole === "ADMIN";

  const firstFolder = await prisma.folder.findFirst({
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
  });

  if (firstFolder) {
    redirect(`/folder/${firstFolder.id}`);
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <FolderLock className="mb-4 h-16 w-16 text-gray-400" />
      <h1 className="text-2xl font-bold text-gray-900">Bienvenido a Korpia2</h1>
      <p className="mt-2 max-w-md text-gray-500">
        Actualmente no tienes carpetas ni dashboards asignados. Por favor, contacta con tu
        administrador para solicitar acceso.
      </p>
    </div>
  );
}
