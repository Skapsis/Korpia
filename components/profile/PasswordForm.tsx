"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/actions/profile";
import type { ActionState } from "@/app/actions/user";

const INITIAL_STATE: ActionState = {
  success: false,
  message: "",
  error: null,
};

export function PasswordForm() {
  const [state, action, isPending] = useActionState(updatePassword, INITIAL_STATE);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Seguridad
      </h2>

      <form action={action} className="space-y-4">
        <div>
          <label
            htmlFor="currentPassword"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Contraseña actual
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Nueva contraseña
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Confirmar nueva contraseña
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? "Cargando..." : "Actualizar contraseña"}
        </button>
      </form>

      {(state.error || state.message) && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className={state.error ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
            {state.error ?? state.message}
          </p>
        </div>
      )}
    </div>
  );
}
