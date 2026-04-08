"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";
import { BarChart4, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { resolveSupersetEmbedDashboardId } from "@/lib/supersetEmbed";

/** Suele ser `dashboard.url` desde Prisma: UUID o URL que contenga el UUID. */
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

type LayerKey = "A" | "B";

type LayerMeta = {
  dashboardId: string | null;
  theme: "light" | "dark" | null;
};

function isValidDashboardId(value: string): boolean {
  return value.trim().length > 0;
}

function parseJwtExpMs(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
    };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function waitForIframeReady(mountPoint: HTMLDivElement, timeoutMs = 20000): Promise<void> {
  const iframe = mountPoint.querySelector("iframe");
  if (!iframe) {
    return;
  }

  iframe.setAttribute("width", "100%");
  iframe.setAttribute("height", "100%");
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.backgroundColor = "transparent";

  if (iframe.dataset.loaded === "true") {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Tiempo de espera agotado al cargar iframe de Superset"));
    }, timeoutMs);

    const onLoad = () => {
      iframe.dataset.loaded = "true";
      window.clearTimeout(timer);
      iframe.removeEventListener("load", onLoad);
      resolve();
    };

    iframe.addEventListener("load", onLoad, { once: true });
  });
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

function MissingSupersetUrlMessage() {
  return (
    <div className="flex min-h-[600px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900/50 dark:bg-amber-950/30">
      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Superset no está configurado en el cliente</p>
      <p className="max-w-md text-sm text-amber-800/90 dark:text-amber-200/90">
        Falta la variable de entorno <code className="rounded bg-amber-100 px-1 py-0.5 text-xs dark:bg-amber-900/60">NEXT_PUBLIC_SUPERSET_URL</code> con la URL pública
        de tu instancia pública. Defínela en el entorno de build/despliegue y vuelve a desplegar (Next.js inlinéa las variables NEXT_PUBLIC en el cliente).
      </p>
    </div>
  );
}

export function SupersetDashboard({ dashboardId }: SupersetDashboardProps) {
  const mountARef = useRef<HTMLDivElement>(null);
  const mountBRef = useRef<HTMLDivElement>(null);
  const instancesRef = useRef<Record<LayerKey, EmbeddedDashboardInstance | null>>({
    A: null,
    B: null,
  });
  const layerMetaRef = useRef<Record<LayerKey, LayerMeta>>({
    A: { dashboardId: null, theme: null },
    B: { dashboardId: null, theme: null },
  });
  const tokenCacheRef = useRef<{ token: string | null; expMs: number | null; dashboardId: string | null }>({
    token: null,
    expMs: null,
    dashboardId: null,
  });
  const tokenRequestRef = useRef<Promise<string> | null>(null);
  const loadSequenceRef = useRef(0);
  const { resolvedTheme } = useTheme();
  const [activeLayer, setActiveLayer] = useState<LayerKey>("A");
  const [transitioningLayer, setTransitioningLayer] = useState<LayerKey | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const embedDashboardId = useMemo(
    () => resolveSupersetEmbedDashboardId(dashboardId),
    [dashboardId]
  );
  const validDashboardId = isValidDashboardId(embedDashboardId);
  const supersetPublicUrl = process.env.NEXT_PUBLIC_SUPERSET_URL?.trim() ?? "";
  const supersetDomain = supersetPublicUrl.replace(/\/$/, "");
  const hasSupersetUrl = supersetDomain.length > 0;
  const effectiveTheme = resolvedTheme === "dark" ? "dark" : "light";
  const activeMeta = layerMetaRef.current[activeLayer];
  const hasVisibleDashboard = Boolean(instancesRef.current[activeLayer]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      (["A", "B"] as LayerKey[]).forEach((layer) => {
        instancesRef.current[layer]?.unmount?.();
        instancesRef.current[layer]?.destroy?.();
        instancesRef.current[layer] = null;
        const mountPoint = layer === "A" ? mountARef.current : mountBRef.current;
        if (mountPoint) {
          mountPoint.innerHTML = "";
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!mounted || !hasSupersetUrl || !validDashboardId) {
      setLoading(false);
      return;
    }

    const activeMount = activeLayer === "A" ? mountARef.current : mountBRef.current;
    const nextLayer: LayerKey = activeLayer === "A" ? "B" : "A";
    const nextMount = nextLayer === "A" ? mountARef.current : mountBRef.current;
    if (!activeMount || !nextMount) {
      return;
    }

    const isInitialLoad = !instancesRef.current[activeLayer];
    const activeLayerMatches =
      activeMeta.dashboardId === embedDashboardId && activeMeta.theme === effectiveTheme;

    if (!isInitialLoad && activeLayerMatches) {
      return;
    }

    const sequence = ++loadSequenceRef.current;
    let cancelled = false;

    const getGuestToken = async () => {
      const now = Date.now();
      const cached = tokenCacheRef.current;
      if (
        cached.token &&
        cached.dashboardId === embedDashboardId &&
        cached.expMs &&
        cached.expMs > now + 30_000
      ) {
        return cached.token;
      }

      if (tokenRequestRef.current) {
        return tokenRequestRef.current;
      }

      tokenRequestRef.current = (async () => {
        const response = await fetch("/api/superset/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dashboardId: embedDashboardId }),
        });

        const data = (await response.json()) as GuestTokenApiResponse;
        if (!response.ok) {
          throw new Error(data.error ?? "No se pudo obtener el guest token");
        }

        const token = data.guestToken ?? data.token;
        if (!token) {
          throw new Error("La API no devolvió token de Superset");
        }

        tokenCacheRef.current = {
          token,
          expMs: parseJwtExpMs(token),
          dashboardId: embedDashboardId,
        };
        return token;
      })();

      try {
        return await tokenRequestRef.current;
      } finally {
        tokenRequestRef.current = null;
      }
    };

    const loadDashboard = async (targetLayer: LayerKey, targetMount: HTMLDivElement) => {
      setError(null);
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setTransitioningLayer(targetLayer);
      }

      targetMount.innerHTML = "";
      instancesRef.current[targetLayer]?.unmount?.();
      instancesRef.current[targetLayer]?.destroy?.();
      instancesRef.current[targetLayer] = null;

      let instance: EmbeddedDashboardInstance | null = null;
      try {
        instance = (await embedDashboard({
          id: embedDashboardId,
          supersetDomain,
          mountPoint: targetMount,
          fetchGuestToken: getGuestToken,
          // Pass explicit theme hints so Superset can render dark internals (filters, panels).
          urlParams: {
            theme: effectiveTheme,
            superset_theme: effectiveTheme,
          },
          dashboardUiConfig: {
            hideTitle: true,
            hideChartControls: false,
          },
        })) as EmbeddedDashboardInstance;

        await waitForIframeReady(targetMount);

        if (cancelled || loadSequenceRef.current !== sequence) {
          instance.unmount?.();
          instance.destroy?.();
          return;
        }

        const previousLayer = activeLayer;
        instancesRef.current[targetLayer] = instance;
        layerMetaRef.current[targetLayer] = {
          dashboardId: embedDashboardId,
          theme: effectiveTheme,
        };

        setActiveLayer(targetLayer);
        setTransitioningLayer(null);

        window.setTimeout(() => {
          instancesRef.current[previousLayer]?.unmount?.();
          instancesRef.current[previousLayer]?.destroy?.();
          instancesRef.current[previousLayer] = null;
          layerMetaRef.current[previousLayer] = { dashboardId: null, theme: null };
          const previousMount = previousLayer === "A" ? mountARef.current : mountBRef.current;
          if (previousMount) {
            previousMount.innerHTML = "";
          }
        }, 220);
      } catch (embedError) {
        instance?.unmount?.();
        instance?.destroy?.();
        if (!cancelled) {
          setError(embedError instanceof Error ? embedError.message : "Error cargando dashboard");
          setTransitioningLayer(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (isInitialLoad) {
      void loadDashboard(activeLayer, activeMount);
    } else {
      void loadDashboard(nextLayer, nextMount);
    }

    return () => {
      cancelled = true;
    };
  }, [
    embedDashboardId,
    validDashboardId,
    hasSupersetUrl,
    supersetDomain,
    effectiveTheme,
    mounted,
    activeLayer,
    activeMeta.dashboardId,
    activeMeta.theme,
  ]);

  if (!validDashboardId) {
    return <DashboardPlaceholder />;
  }

  if (!hasSupersetUrl) {
    return <MissingSupersetUrlMessage />;
  }

  return (
    <div className="relative flex h-full min-h-[calc(100vh-9rem)] w-full flex-1">
      {loading && !hasVisibleDashboard && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm dark:bg-zinc-900/70">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando dashboard...
          </div>
        </div>
      )}
      {transitioningLayer ? (
        <div className="absolute right-3 top-3 z-20 rounded-full bg-zinc-900/80 px-3 py-1 text-xs text-white dark:bg-zinc-100/90 dark:text-zinc-900">
          Sincronizando tema...
        </div>
      ) : null}

      {error ? (
        <div className="flex min-h-[600px] w-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/40 dark:bg-red-950/20">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      ) : (
        <>
          <div
            data-theme={effectiveTheme}
            className={`absolute inset-0 h-full w-full rounded-2xl bg-white transition-opacity duration-200 dark:bg-zinc-900 [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-none ${
              activeLayer === "A" ? "z-10 opacity-100" : "z-0 opacity-0"
            }`}
          >
            <div
              ref={mountARef}
              className="h-full w-full [--superset-bg:#ffffff] dark:[--superset-bg:#18181b]"
            />
          </div>
          <div
            data-theme={effectiveTheme}
            className={`absolute inset-0 h-full w-full rounded-2xl bg-white transition-opacity duration-200 dark:bg-zinc-900 [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-none ${
              activeLayer === "B" ? "z-10 opacity-100" : "z-0 opacity-0"
            }`}
          >
            <div
              ref={mountBRef}
              className="h-full w-full [--superset-bg:#ffffff] dark:[--superset-bg:#18181b]"
            />
          </div>
          <div className="h-full w-full" />
        </>
      )}
    </div>
  );
}
