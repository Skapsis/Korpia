"use client";

import { useActionState, useMemo, useState } from "react";
import type { Prisma } from "@prisma/client";
import { FolderSearch, Key, Lock, ShieldCheck, Unlock, Users } from "lucide-react";
import { setUserFolderAccess } from "@/app/actions/access";
import type { ActionState } from "@/app/actions/user";

export type UserAccessRow = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    folderAccess: { select: { folderId: true; isDenied: true } };
  };
}>;

export type AccessFolderRow = Prisma.FolderGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    parentId: true;
    order: true;
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
  const [folderRules, setFolderRules] = useState<Record<string, "allow" | "deny">>({});
  const [state, action] = useActionState(setUserFolderAccess, INITIAL_STATE);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [users, selectedUserId]
  );

  const treeData = useMemo(() => {
    const childrenByParent = new Map<string | null, AccessFolderRow[]>();
    for (const folder of folders) {
      const list = childrenByParent.get(folder.parentId ?? null) ?? [];
      list.push(folder);
      childrenByParent.set(folder.parentId ?? null, list);
    }
    for (const [, list] of childrenByParent.entries()) {
      list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    }

    const rows: { folder: AccessFolderRow; depth: number; ancestorIds: string[] }[] = [];
    const walk = (parentId: string | null, depth: number, ancestorIds: string[]) => {
      const children = childrenByParent.get(parentId) ?? [];
      for (const child of children) {
        rows.push({ folder: child, depth, ancestorIds });
        walk(child.id, depth + 1, [...ancestorIds, child.id]);
      }
    };
    walk(null, 0, []);
    return { rows, childrenByParent };
  }, [folders]);

  const onSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find((item) => item.id === userId);
    const initialRules: Record<string, "allow" | "deny"> = {};
    if (user) {
      user.folderAccess.forEach((access) => {
        initialRules[access.folderId] = access.isDenied ? "deny" : "allow";
      });
    }
    setFolderRules(initialRules);
  };

  const effectiveStatusMap = useMemo(() => {
    const effective = new Map<string, "allow" | "deny" | "none">();
    for (const { folder, ancestorIds } of treeData.rows) {
      const explicit = folderRules[folder.id];
      if (explicit === "deny") {
        effective.set(folder.id, "deny");
        continue;
      }
      if (explicit === "allow") {
        effective.set(folder.id, "allow");
        continue;
      }

      const parentDenied = ancestorIds.some((ancestorId) => effective.get(ancestorId) === "deny");
      if (parentDenied) {
        effective.set(folder.id, "deny");
        continue;
      }
      const parentAllowed = ancestorIds.some((ancestorId) => effective.get(ancestorId) === "allow");
      effective.set(folder.id, parentAllowed ? "allow" : "none");
    }
    return effective;
  }, [treeData.rows, folderRules]);

  const toggleFolderSelection = (folderId: string) => {
    const explicit = folderRules[folderId];
    const effective = effectiveStatusMap.get(folderId) ?? "none";
    setFolderRules((previous) => {
      const next = { ...previous };
      if (!explicit && effective === "allow") {
        next[folderId] = "deny";
        return next;
      }
      if (!explicit) {
        next[folderId] = "allow";
        return next;
      }
      if (explicit === "allow") {
        next[folderId] = "deny";
        return next;
      }
      delete next[folderId];
      return next;
    });
  };

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
          onChange={(event) => onSelectUser(event.target.value)}
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
        <form action={action} className="space-y-3">
          <input type="hidden" name="userId" value={selectedUser.id} />
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
            {treeData.rows.map(({ folder, depth, ancestorIds }) => {
              const explicitRule = folderRules[folder.id];
              const effectiveStatus = effectiveStatusMap.get(folder.id) ?? "none";
              const inheritedAllowed =
                effectiveStatus === "allow" &&
                explicitRule !== "allow" &&
                ancestorIds.some((ancestorId) => effectiveStatusMap.get(ancestorId) === "allow");
              const inheritedDenied =
                effectiveStatus === "deny" &&
                explicitRule !== "deny" &&
                ancestorIds.some((ancestorId) => effectiveStatusMap.get(ancestorId) === "deny");

              return (
                <button
                  type="button"
                  onClick={() => toggleFolderSelection(folder.id)}
                  key={folder.id}
                  className="flex w-full items-center justify-between gap-3 border-b border-zinc-200 px-3 py-2 text-left transition hover:bg-zinc-50 last:border-b-0 dark:border-zinc-800 dark:hover:bg-zinc-900/60"
                  style={{ paddingLeft: `${12 + depth * 20}px` }}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{folder.name}</p>
                    {folder.description ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{folder.description}</p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    {inheritedAllowed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        <Unlock className="h-3 w-3" />
                        Heredado
                      </span>
                    ) : null}
                    {inheritedDenied ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                        <Lock className="h-3 w-3" />
                        Bloqueado por herencia
                      </span>
                    ) : null}
                    <span
                      className={
                        effectiveStatus === "allow"
                          ? "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : effectiveStatus === "deny"
                            ? "inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                          : "inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }
                    >
                      {effectiveStatus === "allow" ? (
                        <Unlock className="h-3 w-3" />
                      ) : effectiveStatus === "deny" ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                      {effectiveStatus === "allow"
                        ? "Permitido"
                        : effectiveStatus === "deny"
                          ? "Denegado"
                          : "Sin acceso"}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {explicitRule === "allow"
                        ? "Explícito: permitido"
                        : explicitRule === "deny"
                          ? "Explícito: denegado"
                          : "Tocar para alternar"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {Object.entries(folderRules)
            .filter(([, rule]) => rule === "allow")
            .map(([folderId]) => (
              <input key={`allow-${folderId}`} type="hidden" name="allowFolderIds" value={folderId} />
            ))}
          {Object.entries(folderRules)
            .filter(([, rule]) => rule === "deny")
            .map(([folderId]) => (
              <input key={`deny-${folderId}`} type="hidden" name="denyFolderIds" value={folderId} />
            ))}

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            Clic en una fila: sin regla - permitido - denegado explícito - sin regla. Una
            denegación explícita en una subcarpeta anula la herencia del padre.
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Guardar permisos
            </button>
          </div>
        </form>
      )}
        </>
      )}
    </section>
  );
}
