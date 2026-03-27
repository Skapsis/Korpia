"use client";

import { useActionState, useState } from "react";
import { UploadCloud } from "lucide-react";
import { syncUsersCsv } from "@/app/actions/sync";
import type { ActionState } from "@/app/actions/user";

const INITIAL_STATE: ActionState = {
  success: false,
  message: "",
  error: null,
};

export function CsvSync() {
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [state, action, isPending] = useActionState(syncUsersCsv, INITIAL_STATE);

  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
      <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Sincronización masiva por CSV
      </h3>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Sube un archivo CSV con columnas `name,email,role` para crear o actualizar usuarios.
      </p>

      <form action={action} className="space-y-3">
        <input
          id="csv-upload"
          name="csvFile"
          type="file"
          accept=".csv"
          required
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setSelectedFileName(file ? file.name : "");
          }}
        />

        <label
          htmlFor="csv-upload"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <UploadCloud className="h-4 w-4" />
          {selectedFileName ? "Cambiar archivo CSV" : "Seleccionar archivo CSV"}
        </label>

        {selectedFileName ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Archivo: {selectedFileName}</p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? "Sincronizando..." : "Sincronizar"}
        </button>
      </form>

      {(state.error || state.message) && (
        <div className="mt-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950">
          <p className={state.error ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
            {state.error ?? state.message}
          </p>
        </div>
      )}
    </div>
  );
}
