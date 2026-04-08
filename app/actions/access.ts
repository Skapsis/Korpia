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

export async function setUserFolderAccess(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = (formData.get("userId") as string | null)?.trim();
  const allowFolderIds = formData
    .getAll("allowFolderIds")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  const denyFolderIds = formData
    .getAll("denyFolderIds")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (!userId) {
    return {
      success: false,
      error: "Usuario inválido para actualizar permisos.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.folderAccess.deleteMany({
        where: { userId },
      });

      if (allowFolderIds.length > 0 || denyFolderIds.length > 0) {
        const allowIds = Array.from(new Set(allowFolderIds.filter((id) => !denyFolderIds.includes(id))));
        const denyIds = Array.from(new Set(denyFolderIds));
        await tx.folderAccess.createMany({
          data: [
            ...allowIds.map((folderId) => ({
              userId,
              folderId,
              role: "viewer",
              isDenied: false,
            })),
            ...denyIds.map((folderId) => ({
              userId,
              folderId,
              role: "viewer",
              isDenied: true,
            })),
          ],
        });
      }
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: "Permisos actualizados correctamente.",
      error: null,
    };
  } catch {
    return {
      success: false,
      error: "No se pudieron actualizar los permisos de carpeta.",
    };
  }
}
