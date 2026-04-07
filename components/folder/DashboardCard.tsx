"use client";

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import { BarChart2, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { FavoriteButton } from "@/components/dashboard/FavoriteButton";

type DashboardCardProps = {
  link: Prisma.DashboardLinkGetPayload<{}>;
  initialIsFavorite?: boolean;
};

function getTrendType(trend: string): "up" | "down" | "neutral" {
  if (trend.startsWith("+") || trend.startsWith("↑")) {
    return "up";
  }
  if (trend.startsWith("-") || trend.startsWith("↓")) {
    return "down";
  }
  return "neutral";
}

type TrendConfig = {
  TrendIcon: LucideIcon;
  classes: string;
  text: string;
};

function getTrendConfig(trend: string): TrendConfig {
  const trendType = getTrendType(trend);
  if (trendType === "up") {
    return {
      TrendIcon: TrendingUp,
      classes: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
      text: trend,
    };
  }
  if (trendType === "down") {
    return {
      TrendIcon: TrendingDown,
      classes: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300",
      text: trend,
    };
  }
  return {
    TrendIcon: Minus,
    classes: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300",
    text: trend,
  };
}

export function DashboardCard({ link, initialIsFavorite = false }: DashboardCardProps) {
  const trendConfig = link.kpiTrend ? getTrendConfig(link.kpiTrend) : null;

  return (
    <article className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
          <Link href={`/dashboard/${link.id}`} className="hover:underline">
            {link.title}
          </Link>
        </h3>
        <div className="flex items-center gap-2">
          <FavoriteButton dashboardId={link.id} initialIsFavorite={initialIsFavorite} />
          <BarChart2 className="h-5 w-5 shrink-0 text-gray-500 dark:text-zinc-400" />
        </div>
      </div>

      <p className="line-clamp-2 text-sm text-gray-500 dark:text-zinc-400">
        <Link href={`/dashboard/${link.id}`} className="hover:underline">
          {link.description ?? "Sin descripción."}
        </Link>
      </p>

      {link.kpiValue ? (
        <div className="mt-auto pt-6">
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-zinc-100">
              <Link href={`/dashboard/${link.id}`} className="hover:underline">
                {link.kpiValue}
              </Link>
            </p>
            {link.kpiTrend ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium ${trendConfig?.classes ?? ""}`}
              >
                {trendConfig ? <trendConfig.TrendIcon className="h-4 w-4" /> : null}
                {trendConfig?.text ?? link.kpiTrend}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
