"use client";

import { useActionState } from "react";
import { Shield, Trash2, User as UserIcon } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { deleteUser, updateUserRole, type ActionState } from "@/app/actions/user";

export type UserTableRow = Prisma.UserGetPayload<{
  select: { id: true; name: true; email: true; role: true };
}>;

type UserTableProps = {
  users: UserTableRow[];
};

const INITIAL_STATE: ActionState = {
  success: false,
  message: "",
  error: null as string | null,
};

export function UserTable({ users }: UserTableProps) {
  const [roleState, roleAction] = useActionState(updateUserRole, INITIAL_STATE);
  const [deleteState, deleteAction] = useActionState(deleteUser, INITIAL_STATE);

  return (
    <div className="space-y-3">
      {(roleState.error || roleState.message || deleteState.error || deleteState.message) && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          {roleState.error || deleteState.error ? (
            <p className="text-red-600 dark:text-red-400">
              {roleState.error ?? deleteState.error}
            </p>
          ) : (
            <p className="text-emerald-600 dark:text-emerald-400">
              {roleState.message || deleteState.message}
            </p>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Nombre / Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Rol actual
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {user.name || "Sin nombre"}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <form action={roleAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {user.role === "ADMIN" ? (
                        <Shield className="h-3.5 w-3.5" />
                      ) : (
                        <UserIcon className="h-3.5 w-3.5" />
                      )}
                      Guardar
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-right">
                  <form
                    action={deleteAction}
                    onSubmit={(e) => !confirm("¿Seguro?") && e.preventDefault()}
                    className="inline-flex"
                  >
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
