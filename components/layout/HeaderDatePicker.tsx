"use client";

import { useMemo, useState } from "react";
import { Calendar } from "lucide-react";

function formatDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function HeaderDatePicker() {
  const today = useMemo(() => formatDateInput(new Date()), []);
  const [value, setValue] = useState(today);

  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800">
      <Calendar className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden />
      <input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border-0 bg-transparent p-0 text-zinc-800 outline-none dark:text-zinc-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60"
        aria-label="Seleccionar fecha"
      />
    </label>
  );
}
