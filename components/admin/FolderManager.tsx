"use client";

import { useActionState } from "react";
import type { Prisma } from "@prisma/client";
import { Folder, LayoutDashboard, Plus, Trash2 } from "lucide-react";
import { createFolder, deleteFolder } from "@/app/actions/folder";
import { createDashboardLink, deleteDashboardLink } from "@/app/actions/dashboard";
import type { ActionState } from "@/app/actions/user";

const INITIAL_STATE: ActionState = {
  success: false,
  message: "",
  error: null,
};

export type FolderWithDashboards = Prisma.FolderGetPayload<{
  include: { dashboardLinks: true };
}>;

type FolderManagerProps = {
  folders: FolderWithDashboards[];
};

export function FolderManager({ folders }: FolderManagerProps) {
  const [createFolderState, createFolderAction] = useActionState(createFolder, INITIAL_STATE);
  const [deleteFolderState, deleteFolderAction] = useActionState(deleteFolder, INITIAL_STATE);
  const [createDashState, createDashAction] = useActionState(createDashboardLink, INITIAL_STATE);
  const [deleteDashState, deleteDashAction] = useActionState(deleteDashboardLink, INITIAL_STATE);

  const feedback =
    createFolderState.error ||
    deleteFolderState.error ||
    createDashState.error ||
    deleteDashState.error ||
    createFolderState.message ||
    deleteFolderState.message ||
    createDashState.message ||
    deleteDashState.message;

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-700 dark:text-zinc-300">{feedback}</p>
        </div>
      )}

      <div className="space-y-4">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-zinc-500" />
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{folder.name}</h3>
                </div>
                {folder.description && (
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{folder.description}</p>
                )}
              </div>

              <form
                action={deleteFolderAction}
                onSubmit={(e) => !confirm("¿Seguro?") && e.preventDefault()}
              >
                <input type="hidden" name="folderId" value={folder.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar carpeta
                </button>
              </form>
            </div>

            <div className="mb-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-zinc-500">Dashboard</th>
                    <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-zinc-500">UUID</th>
                    <th className="px-3 py-2 text-right text-xs uppercase tracking-wide text-zinc-500">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {folder.dashboardLinks.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-3 text-zinc-500">
                        Sin dashboards en esta carpeta.
                      </td>
                    </tr>
                  ) : (
                    folder.dashboardLinks.map((dashboard) => (
                      <tr key={dashboard.id} className="border-t border-zinc-200 dark:border-zinc-800">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <LayoutDashboard className="h-4 w-4 text-zinc-500" />
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{dashboard.title}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-zinc-500">{dashboard.url || "-"}</td>
                        <td className="px-3 py-2 text-right">
                          <form
                            action={deleteDashAction}
                            onSubmit={(e) => !confirm("¿Seguro?") && e.preventDefault()}
                            className="inline-flex"
                          >
                            <input type="hidden" name="dashboardLinkId" value={dashboard.id} />
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Eliminar
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <form action={createDashAction} className="grid gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-6">
              <input type="hidden" name="folderId" value={folder.id} />
              <input
                name="title"
                required
                placeholder="Título"
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                name="description"
                placeholder="Descripción"
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                name="url"
                placeholder="UUID Superset"
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                name="kpiValue"
                placeholder="KPI Value"
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                name="kpiTrend"
                placeholder="KPI Trend"
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
              >
                <Plus className="h-4 w-4" />
                Añadir
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Crear nueva carpeta
        </h3>
        <form action={createFolderAction} className="grid gap-2 sm:grid-cols-3">
          <input
            name="name"
            required
            placeholder="Nombre"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            name="description"
            placeholder="Descripción"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Plus className="h-4 w-4" />
            Crear carpeta
          </button>
        </form>
      </div>
    </div>
  );
}
