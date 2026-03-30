"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <div className="relative group flex items-center justify-center">
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="p-2 rounded-md bg-gray-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors"
        aria-label="Cambiar tema"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <span className="absolute bottom-full mb-2 hidden group-hover:block whitespace-nowrap bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
      </span>
    </div>
  );
}
