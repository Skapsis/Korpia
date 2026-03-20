import { prisma } from "@/lib/prisma";
import { createFolder, deleteFolder } from "@/app/actions/folder";
import { createDashboardLink, deleteDashboardLink } from "@/app/actions/dashboard";
import { createUser, deleteUser, updateUserAccess } from "@/app/actions/user";
import { createGroup, deleteGroup, updateGroupDashboards, assignUserToGroup } from "@/app/actions/group";
import { FolderOpen, Trash2, Plus, LayoutDashboard, UserPlus, Users } from "lucide-react";

export default async function AdminPage() {
  const [folders, users, groups, allDashboards] = await Promise.all([
    prisma.folder.findMany({
      orderBy: { name: "asc" },
      include: {
        dashboardLinks: { orderBy: { title: "asc" } },
      },
    }),
    prisma.user.findMany({
      include: { folderAccess: true, group: true },
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
        {/* ——— Gestión de Carpetas ——— */}
        <section>
          <h2 className="mb-6 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Gestión de Carpetas
          </h2>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-base font-medium text-zinc-900 dark:text-zinc-100">
                Crear carpeta
              </h3>
              <form action={createFolder} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Ej. Ventas"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="description"
                    className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={2}
                    placeholder="Descripción opcional"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-fit rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Crear carpeta
                </button>
              </form>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-base font-medium text-zinc-900 dark:text-zinc-100">
                Carpetas existentes
              </h3>
              {folders.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No hay carpetas. Crea una desde el formulario.
                </p>
              ) : (
                <ul className="space-y-4">
                  {folders.map((folder: any) => (
                    <li
                      key={folder.id}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <FolderOpen className="h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400" />
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {folder.name}
                            </p>
                            {folder.description && (
                              <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                                {folder.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <form
                          action={deleteFolder.bind(null, folder.id)}
                          className="shrink-0"
                        >
                          <button
                            type="submit"
                            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                            title="Eliminar carpeta"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        </form>
                      </div>

                      <div className="border-t border-zinc-200 px-4 pb-3 pt-2 dark:border-zinc-700">
                        {folder.dashboardLinks.length === 0 ? (
                          <p className="mb-2 text-xs text-zinc-400 dark:text-zinc-500">
                            Sin dashboards
                          </p>
                        ) : (
                          <ul className="mb-3 space-y-1.5">
                            {folder.dashboardLinks.map((dash: any) => (
                              <li
                                key={dash.id}
                                className="flex items-center justify-between gap-2 rounded-md bg-white py-1.5 pl-2 pr-1 dark:bg-zinc-900"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                                  <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">
                                    {dash.title}
                                  </span>
                                  {dash.description && (
                                    <span className="hidden truncate text-xs text-zinc-500 sm:inline dark:text-zinc-400">
                                      — {dash.description}
                                    </span>
                                  )}
                                </div>
                                <form
                                  action={deleteDashboardLink.bind(null, dash.id)}
                                  className="shrink-0"
                                >
                                  <button
                                    type="submit"
                                    className="rounded p-1 text-red-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                                    title="Eliminar dashboard"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </form>
                              </li>
                            ))}
                          </ul>
                        )}

                        <details className="group">
                          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                            <Plus className="h-4 w-4" />
                            Añadir Dashboard
                          </summary>
                          <form
                            action={createDashboardLink}
                            className="mt-3 flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-600 dark:bg-zinc-900"
                          >
                            <input type="hidden" name="folderId" value={folder.id} />
                            <input
                              name="title"
                              type="text"
                              required
                              placeholder="Título del dashboard"
                              className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                            <input
                              name="description"
                              type="text"
                              placeholder="Descripción (opcional)"
                              className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                            <input
                              name="supersetDashboardId"
                              type="text"
                              placeholder="UUID del dashboard en Superset"
                              className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                            <input
                              name="kpiValue"
                              type="text"
                              placeholder="KPI valor (ej. $1.2M)"
                              className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                            <input
                              name="kpiTrend"
                              type="text"
                              placeholder="KPI tendencia (ej. +15% o -3%)"
                              className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                            <button
                              type="submit"
                              className="w-fit rounded bg-zinc-800 px-3 py-1.5 text-sm text-white transition hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
                            >
                              Guardar
                            </button>
                          </form>
                        </details>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* ——— Gestión de Grupos ——— */}
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
              <form
                action={createGroup}
                className="flex flex-col gap-4 border-t border-zinc-200 p-4 dark:border-zinc-700"
              >
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
                <div>
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
            {groups.map((group: any) => (
              <div
                key={group.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{group.name}</p>
                    {}
                  </div>
                  <form action={deleteGroup.bind(null, group.id)} className="shrink-0">
                    <button
                      type="submit"
                      className="rounded-lg px-2 py-1.5 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                      title="Eliminar grupo"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
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
                      {folders.map((folder: any) => {
                        const dashboardsInFolder = allDashboards.filter((d) => d.folderId === folder.id);
                        if (dashboardsInFolder.length === 0) return null;
                        return (
                          <div key={folder.id} className="space-y-1">
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{folder.name}</p>
                            {dashboardsInFolder.map((dash: any) => (
                              <label
                                key={dash.id}
                                className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                              >
                                <input
                                  type="checkbox"
                                  name="dashboardIds"
                                  value={dash.id}
                                  defaultChecked={group.dashboardAccess.some((a) => a.dashboardId === dash.id)}
                                  className="rounded border-zinc-300 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800"
                                />
                                {dash.title}
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

        {/* ——— Gestión de Usuarios ——— */}
        <section>
          <h2 className="mb-6 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Gestión de Usuarios
          </h2>

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
                    {groups.map((g: any) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user: any) => (
              <div
                key={user.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {user.email}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {user.role}
                    </p>
                  </div>
                  <form action={deleteUser.bind(null, user.id)} className="shrink-0">
                    <button
                      type="submit"
                      className="rounded-lg px-2 py-1.5 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  </form>
                </div>
                <form action={assignUserToGroup} className="mt-2 flex items-center gap-2">
                  <input type="hidden" name="userId" value={user.id} />
                  <label className="text-xs text-zinc-500 dark:text-zinc-400">Grupo:</label>
                  <select
                    name="groupId"
                    className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    defaultValue={user.groupId ?? ""}
                  >
                    <option value="">Sin grupo</option>
                    {groups.map((g: any) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded bg-zinc-700 px-2 py-1 text-xs text-white transition hover:bg-zinc-600 dark:bg-zinc-300 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Guardar
                  </button>
                </form>

                {user.role === "USER" && (
                  <details className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
                    <summary className="cursor-pointer list-none text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                      Gestionar Accesos
                    </summary>
                    <form
                      action={updateUserAccess}
                      className="mt-3 flex flex-col gap-2"
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <div className="max-h-40 space-y-1.5 overflow-y-auto">
                        {folders.map((folder: any) => (
                          <label
                            key={folder.id}
                            className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                          >
                            <input
                              type="checkbox"
                              name="folderIds"
                              value={folder.id}
                              defaultChecked={user.folderAccess.some(
                                (a) => a.folderId === folder.id
                              )}
                              className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
                            />
                            {folder.name}
                          </label>
                        ))}
                      </div>
                      <button
                        type="submit"
                        className="mt-2 w-fit rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-white transition hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
                      >
                        Guardar Accesos
                      </button>
                    </form>
                  </details>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
