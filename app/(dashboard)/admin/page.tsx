import { prisma } from "@/lib/prisma";
import { createUser } from "@/app/actions/user";
import { createGroup, deleteGroup, updateGroupDashboards } from "@/app/actions/group";
import { UserPlus, Users, Trash2 } from "lucide-react";
import { FolderManager } from "@/components/admin/FolderManager";
import { UserAccessManager, type UserAccessRow } from "@/components/admin/UserAccessManager";
import { UserTable, type UserTableRow } from "@/components/admin/UserTable";
import { CsvSync } from "@/components/admin/CsvSync";

export default async function AdminPage() {
  const [folders, users, groups, allDashboards] = await Promise.all([
    prisma.folder.findMany({
      include: { dashboardLinks: true },
      orderBy: { order: "asc" },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        groupId: true,
        folderAccess: { select: { folderId: true, isDenied: true } },
      },
      orderBy: { email: "asc" },
    }),
    prisma.group.findMany({
      include: { dashboardAccess: true },
      orderBy: { name: "asc" },
    }),
    prisma.dashboardLink.findMany({
      include: { folder: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <div className="p-6">
      <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        Administración
      </h1>

      <div className="space-y-12">
        <section>
          <h2 className="mb-6 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Gestión de Carpetas
          </h2>
          <FolderManager folders={folders} />
        </section>

        <section>
          <h2 className="mb-6 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Gestión de Grupos
          </h2>

          <div className="mb-6">
            <details className="group rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                <Users className="h-4 w-4" />
                Crear grupo
              </summary>
              <form action={createGroup} className="flex flex-col gap-4 border-t border-zinc-200 p-4 dark:border-zinc-700">
                <div>
                  <label htmlFor="group-name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="group-name"
                    name="name"
                    type="text"
                    required
                    placeholder="Ej. Equipo Norte"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <button
                  type="submit"
                  className="w-fit rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Crear grupo
                </button>
              </form>
            </details>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{group.name}</p>
                  <form action={deleteGroup.bind(null, group.id)} className="shrink-0">
                    <button
                      type="submit"
                      className="rounded-lg px-2 py-1.5 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                      title="Eliminar grupo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>

                <details className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                  <summary className="cursor-pointer list-none text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                    Gestionar Indicadores
                  </summary>
                  <form action={updateGroupDashboards} className="mt-3 flex flex-col gap-2">
                    <input type="hidden" name="groupId" value={group.id} />
                    <div className="max-h-48 space-y-1.5 overflow-y-auto">
                      {folders.map((folder) => {
                        const dashboardsInFolder = allDashboards.filter((dashboard) => dashboard.folderId === folder.id);
                        if (dashboardsInFolder.length === 0) {
                          return null;
                        }
                        return (
                          <div key={folder.id} className="space-y-1">
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{folder.name}</p>
                            {dashboardsInFolder.map((dashboard) => (
                              <label
                                key={dashboard.id}
                                className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                              >
                                <input
                                  type="checkbox"
                                  name="dashboardIds"
                                  value={dashboard.id}
                                  defaultChecked={group.dashboardAccess.some(
                                    (access) => access.dashboardId === dashboard.id
                                  )}
                                  className="rounded border-zinc-300 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800"
                                />
                                {dashboard.title}
                              </label>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="submit"
                      className="mt-2 w-fit rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-white transition hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
                    >
                      Guardar Indicadores
                    </button>
                  </form>
                </details>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-6 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Gestión de Usuarios
          </h2>

          <div className="mb-6">
            <CsvSync />
          </div>

          <div className="mb-6">
            <details className="group rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                <UserPlus className="h-4 w-4" />
                Añadir Usuario
              </summary>
              <form
                action={createUser}
                className="flex flex-col gap-4 border-t border-zinc-200 p-4 dark:border-zinc-700"
              >
                <div>
                  <label
                    htmlFor="user-name"
                    className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Nombre
                  </label>
                  <input
                    id="user-name"
                    name="name"
                    type="text"
                    placeholder="Nombre del usuario"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="user-email"
                    className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="user-email"
                    name="email"
                    type="email"
                    required
                    placeholder="usuario@ejemplo.com"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="user-password"
                    className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="user-password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="user-role"
                    className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Rol
                  </label>
                  <select
                    id="user-role"
                    name="role"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="user-group" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Grupo (opcional)
                  </label>
                  <select
                    id="user-group"
                    name="groupId"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">Sin grupo</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-fit rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Crear usuario
                </button>
              </form>
            </details>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <UserTable users={users as UserTableRow[]} groups={groups.map((group) => ({ id: group.id, name: group.name }))} />
          </div>
        </section>

        <UserAccessManager users={users as UserAccessRow[]} folders={folders} />
      </div>
    </div>
  );
}
