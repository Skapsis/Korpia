"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createDashboardLink(formData: FormData) {
  const title = formData.get("title") as string | null;
  const description = (formData.get("description") as string | null) ?? "";
  const supersetDashboardId = formData.get("supersetDashboardId") as string | null;
  const folderId = formData.get("folderId") as string | null;
  const kpiValue = (formData.get("kpiValue") as string | null)?.trim() || null;
  const kpiTrend = (formData.get("kpiTrend") as string | null)?.trim() || null;

  if (!title?.trim() || !folderId?.trim()) {
    return;
  }

  await prisma.dashboardLink.create({
    data: {
      folderId: folderId.trim(),
      title: title.trim(),
      description: description?.trim() || null,
      url: supersetDashboardId?.trim() ?? "",
      order: 0,
      kpiValue,
      kpiTrend,
    },
  });

  revalidatePath("/", "layout");
}

export async function deleteDashboardLink(id: string) {
  await prisma.dashboardLink.delete({
    where: { id },
  });

  revalidatePath("/", "layout");
}
