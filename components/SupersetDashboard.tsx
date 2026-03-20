"use client";

import { useEffect, useRef, useState } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import { AlertCircle, ChevronLeft } from "lucide-react";

type SupersetDashboardProps = { dashboardId: string };

type EmbeddedInstance = {
  unmount?: () => void;
  destroy?: () => void;
};

export function SupersetDashboard({ dashboardId }: SupersetDashboardProps) {
  const mountPointRef = useRef<HTMLDivElement>(null);
  const embeddedRef = useRef<EmbeddedInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  useEffect(() => {
    if (!dashboardId?.trim()) {
      setError("Dashboard ID invalido.");
      return;
    }

    const supersetDomain =
      process.env.NEXT_PUBLIC_SUPERSET_URL?.replace(/\/$/, "") ||
      "http://localhost:8088";

    let cancelled = false;

    const embed = async () => {
      if (!mountPointRef.current) return;

      setError(null);
      mountPointRef.current.innerHTML = "";

      try {
        const instance = (await embedDashboard({
          id: dashboardId,
          supersetDomain,
          mountPoint: mountPointRef.current,
          fetchGuestToken: async () => {
            const res = await fetch("/api/superset/token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dashboardId }),
            });
            const data = (await res.json()) as { token?: string; error?: string };
            if (!res.ok) throw new Error(data.error || "Error al obtener token");
            if (!data.token) throw new Error("Token vacio en respuesta del backend");
            return data.token;
          },
          dashboardUiConfig: {
            hideTitle: true,
            hideChartControls: false,
            hideTab: false,
            filters: {
              visible: isFilterPanelOpen,
              expanded: true,
            },
          },
        })) as EmbeddedInstance;

        if (!cancelled) {
          embeddedRef.current = instance;
        }
      } catch (err) {
        console.error("[SupersetDashboard] Error al incrustar:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al incrustar dashboard");
        }
      }
    };

    embed();

    return () => {
      cancelled = true;
      embeddedRef.current?.unmount?.();
      embeddedRef.current?.destroy?.();
      embeddedRef.current = null;
      if (mountPointRef.current) {
        mountPointRef.current.innerHTML = "";
      }
    };
  }, [dashboardId, isFilterPanelOpen]);

  if (error) {
    return (
      <div className="flex min-h-[200px] items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span>Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="relative flex w-full">
      <button
        type="button"
        onClick={() => setIsFilterPanelOpen((prev) => !prev)}
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-zinc-200 bg-white/90 p-1.5 shadow transition hover:bg-zinc-50"
        title={isFilterPanelOpen ? "Ocultar filtros" : "Mostrar filtros"}
        aria-label={isFilterPanelOpen ? "Ocultar filtros" : "Mostrar filtros"}
      >
        <ChevronLeft
          className={`h-4 w-4 text-zinc-700 transition-transform ${isFilterPanelOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        ref={mountPointRef}
        className="flex-1 w-full h-[80vh] lg:h-[85vh] flex flex-col [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-none [&>iframe]:flex-1"
      />
    </div>
  );
}
