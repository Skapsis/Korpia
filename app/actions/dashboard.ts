"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/app/actions/user";

export async function createDashboardLink(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const folderId = (formData.get("folderId") as string | null)?.trim();
  const title = (formData.get("title") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const url = (formData.get("url") as string | null)?.trim() || "";
  const kpiValue = (formData.get("kpiValue") as string | null)?.trim() || null;
  const kpiTrend = (formData.get("kpiTrend") as string | null)?.trim() || null;

  if (!folderId || !title) {
    return { success: false, error: "Folder y título son obligatorios." };
  }

  try {
    const maxOrder = await prisma.dashboardLink.aggregate({
      where: { folderId },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    await prisma.dashboardLink.create({
      data: {
        folderId,
        title,
        description,
        url,
        kpiValue,
        kpiTrend,
        order: nextOrder,
      },
    });

    revalidatePath("/admin");
    return { success: true, message: "Dashboard agregado.", error: null };
  } catch {
    return { success: false, error: "No se pudo crear el dashboard." };
  }
}

export async function deleteDashboardLink(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const dashboardLinkId = (formData.get("dashboardLinkId") as string | null)?.trim();

  if (!dashboardLinkId) {
    return { success: false, error: "Falta dashboardLinkId para eliminar." };
  }

  try {
    await prisma.dashboardLink.delete({ where: { id: dashboardLinkId } });
    revalidatePath("/admin");
    return { success: true, message: "Dashboard eliminado.", error: null };
  } catch {
    return { success: false, error: "No se pudo eliminar el dashboard." };
  }
}
