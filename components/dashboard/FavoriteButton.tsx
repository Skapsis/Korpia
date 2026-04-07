"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

type FavoriteButtonProps = {
  dashboardId: string;
  initialIsFavorite?: boolean;
  className?: string;
};

export function FavoriteButton({
  dashboardId,
  initialIsFavorite = false,
  className = "",
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isToggling, setIsToggling] = useState(false);

  async function toggleFavorite() {
    if (isToggling) {
      return;
    }

    setIsToggling(true);
    try {
      const response = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardId }),
      });
      const payload = (await response.json()) as { isFavorite?: boolean };
      if (response.ok && typeof payload.isFavorite === "boolean") {
        setIsFavorite(payload.isFavorite);
      }
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={isToggling}
      aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      className={`rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-zinc-800 ${className}`}
    >
      <Heart className={`h-5 w-5 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
    </button>
  );
}
