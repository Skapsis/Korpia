"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/app/actions/user";

export async function toggleFolderAccess(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = (formData.get("userId") as string | null)?.trim();
  const folderId = (formData.get("folderId") as string | null)?.trim();
  const hasAccess = (formData.get("hasAccess") as string | null)?.trim();

  if (!userId || !folderId || (hasAccess !== "true" && hasAccess !== "false")) {
    return {
      success: false,
      error: "Datos inválidos para actualizar permisos.",
    };
  }

  try {
    if (hasAccess === "true") {
      await prisma.folderAccess.upsert({
        where: {
          userId_folderId: {
            userId,
            folderId,
          },
        },
        update: {},
        create: {
          userId,
          folderId,
          role: "viewer",
        },
      });
    } else {
      await prisma.folderAccess.deleteMany({
        where: {
          userId,
          folderId,
        },
      });
    }

    revalidatePath("/admin");
    return { success: true, error: null };
  } catch {
    return {
      success: false,
      error: "No se pudo actualizar el permiso de carpeta.",
    };
  }
}
