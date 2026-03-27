"use client";

import { useActionState, useMemo, useState } from "react";
import type { Prisma } from "@prisma/client";
import { FolderSearch, Key, Lock, ShieldCheck, Unlock, Users } from "lucide-react";
import { toggleFolderAccess } from "@/app/actions/access";
import type { ActionState } from "@/app/actions/user";

export type UserAccessRow = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    folderAccess: { select: { folderId: true } };
  };
}>;

export type AccessFolderRow = Prisma.FolderGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
  };
}>;

type UserAccessManagerProps = {
  users: UserAccessRow[];
  folders: AccessFolderRow[];
};

const INITIAL_STATE: ActionState = {
  success: false,
  message: "",
  error: null,
};

export function UserAccessManager({ users, folders }: UserAccessManagerProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [state, action] = useActionState(toggleFolderAccess, INITIAL_STATE);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [users, selectedUserId]
  );

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center gap-2">
        <Key className="h-4 w-4 text-zinc-500" />
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Permisos por Carpeta (FolderAccess)
        </h3>
      </div>

      {(state.error || state.message) && (
        <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className={state.error ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
            {state.error ?? state.message}
          </p>
        </div>
      )}

      {users.length === 0 || folders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-950">
          <div className="mb-3 flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
            {users.length === 0 ? (
              <Users className="h-5 w-5" />
            ) : (
              <FolderSearch className="h-5 w-5" />
            )}
            <p className="text-sm font-medium">Faltan datos para configurar permisos</p>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Para asignar permisos, primero debes crear al menos un usuario y una carpeta en las
            secciones anteriores.
          </p>
        </div>
      ) : (
        <>
      <div className="mb-4 max-w-md">
        <label
          htmlFor="selected-user"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Seleccionar usuario
        </label>
        <select
          id="selected-user"
          value={selectedUserId}
          onChange={(event) => setSelectedUserId(event.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="" disabled>
            👤 Selecciona un usuario para gestionar sus accesos...
          </option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {(user.name && user.name.trim().length > 0 ? user.name : "Sin nombre") + " - " + user.email}
            </option>
          ))}
        </select>
      </div>

      {!selectedUserId || !selectedUser ? (
        <div className="flex min-h-44 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-950">
          <div className="space-y-2">
            <ShieldCheck className="mx-auto h-12 w-12 text-zinc-400 opacity-60 dark:text-zinc-500" />
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Selecciona un usuario del menú desplegable para ver y modificar las carpetas a las
              que tiene acceso.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {folders.map((folder) => {
            const hasAccess = selectedUser.folderAccess.some((access) => access.folderId === folder.id);

            return (
              <div
                key={folder.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{folder.name}</p>
                  {folder.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{folder.description}</p>
                  )}
                </div>

                <form action={action}>
                  <input type="hidden" name="userId" value={selectedUser.id} />
                  <input type="hidden" name="folderId" value={folder.id} />
                  <input type="hidden" name="hasAccess" value={hasAccess ? "false" : "true"} />
                  <button
                    type="submit"
                    className={
                      hasAccess
                        ? "inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                    }
                  >
                    {hasAccess ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    {hasAccess ? "Permitido" : "Denegado"}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </section>
  );
}
