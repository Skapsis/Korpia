"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createFolder(formData: FormData) {
  const name = formData.get("name") as string | null;
  const description = (formData.get("description") as string | null) ?? "";

  if (!name?.trim()) {
    return;
  }

  await prisma.folder.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      order: 0,
    },
  });

  revalidatePath("/", "layout");
}

export async function deleteFolder(id: string) {
  await prisma.folder.delete({
    where: { id },
  });

  revalidatePath("/", "layout");
}
