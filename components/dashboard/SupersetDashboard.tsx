"use client";

import { useEffect, useRef, useState } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import { BarChart4, Loader2 } from "lucide-react";

type SupersetDashboardProps = {
  dashboardId: string;
};

type EmbeddedDashboardInstance = {
  unmount?: () => void;
  destroy?: () => void;
};

type GuestTokenApiResponse = {
  token?: string;
  guestToken?: string;
  error?: string;
};

function isValidDashboardId(value: string): boolean {
  return value.trim().length > 0;
}

function DashboardPlaceholder() {
  return (
    <div className="flex min-h-[600px] w-full items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-gradient-to-br from-zinc-50 via-white to-zinc-100 p-8 text-center dark:border-zinc-700 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
      <div className="space-y-3">
        <BarChart4 className="mx-auto h-16 w-16 text-zinc-400 dark:text-zinc-500" />
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          Dashboard en construcción
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Esperando conexión con Superset...
        </p>
      </div>
    </div>
  );
}

export function SupersetDashboard({ dashboardId }: SupersetDashboardProps) {
  const mountPointRef = useRef<HTMLDivElement>(null);
  const embeddedRef = useRef<EmbeddedDashboardInstance | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const validDashboardId = isValidDashboardId(dashboardId);

  useEffect(() => {
    if (!validDashboardId || !mountPointRef.current) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      mountPointRef.current!.innerHTML = "";

      try {
        const supersetDomain =
          process.env.NEXT_PUBLIC_SUPERSET_URL?.replace(/\/$/, "") || "http://localhost:8088";

        const instance = (await embedDashboard({
          id: dashboardId,
          supersetDomain,
          mountPoint: mountPointRef.current as HTMLDivElement,
          fetchGuestToken: async () => {
            const response = await fetch("/api/superset/token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dashboardId }),
            });

            const data = (await response.json()) as GuestTokenApiResponse;
            if (!response.ok) {
              throw new Error(data.error ?? "No se pudo obtener el guest token");
            }

            const token = data.guestToken ?? data.token;
            if (!token) {
              throw new Error("La API no devolvió token de Superset");
            }

            return token;
          },
          dashboardUiConfig: {
            hideTitle: true,
            hideChartControls: false,
          },
        })) as EmbeddedDashboardInstance;

        if (!cancelled) {
          embeddedRef.current = instance;
        }
      } catch (embedError) {
        if (!cancelled) {
          setError(embedError instanceof Error ? embedError.message : "Error cargando dashboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
      embeddedRef.current?.unmount?.();
      embeddedRef.current?.destroy?.();
      embeddedRef.current = null;
      if (mountPointRef.current) {
        mountPointRef.current.innerHTML = "";
      }
    };
  }, [dashboardId, validDashboardId]);

  if (!validDashboardId) {
    return <DashboardPlaceholder />;
  }

  return (
    <div className="relative w-full h-full min-h-[600px]">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm dark:bg-zinc-900/70">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando dashboard...
          </div>
        </div>
      )}

      {error ? (
        <div className="flex min-h-[600px] w-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/40 dark:bg-red-950/20">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      ) : (
        <div
          ref={mountPointRef}
          className="h-full min-h-[600px] w-full [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-none"
        />
      )}
    </div>
  );
}
