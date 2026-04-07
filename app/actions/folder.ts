"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/app/actions/user";

export async function createFolder(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = (formData.get("name") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const parentId = (formData.get("parentId") as string | null)?.trim() || null;

  if (!name) {
    return { success: false, error: "El nombre de la carpeta es obligatorio." };
  }

  try {
    if (parentId) {
      const parentFolder = await prisma.folder.findUnique({
        where: { id: parentId },
        select: { id: true },
      });
      if (!parentFolder) {
        return { success: false, error: "La carpeta padre no existe." };
      }
    }

    const maxOrder = await prisma.folder.aggregate({
      where: { parentId },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    await prisma.folder.create({
      data: {
        name,
        description,
        parentId,
        order: nextOrder,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/folder");
    if (parentId) {
      revalidatePath(`/folder/${parentId}`);
    }
    return { success: true, message: "Carpeta creada correctamente.", error: null };
  } catch {
    return { success: false, error: "No se pudo crear la carpeta." };
  }
}

export async function deleteFolder(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const folderId = (formData.get("folderId") as string | null)?.trim();

  if (!folderId) {
    return { success: false, error: "Falta folderId para eliminar." };
  }

  try {
    await prisma.folder.delete({ where: { id: folderId } });
    revalidatePath("/admin");
    return { success: true, message: "Carpeta eliminada.", error: null };
  } catch {
    return { success: false, error: "No se pudo eliminar la carpeta." };
  }
}
