"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function createUser(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim();
  const password = formData.get("password") as string | null;
  const role = (formData.get("role") as string | null)?.trim() || "USER";
  const groupId = (formData.get("groupId") as string | null)?.trim() || null;

  if (!email || !password) {
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role === "ADMIN" ? "ADMIN" : "USER",
      groupId,
    },
  });

  revalidatePath("/", "layout");
}

export async function deleteUser(id: string) {
  await prisma.user.delete({
    where: { id },
  });

  revalidatePath("/", "layout");
}

export async function updateUserAccess(formData: FormData) {
  const userId = (formData.get("userId") as string | null)?.trim();
  const folderIds = formData.getAll("folderIds") as string[];

  if (!userId) {
    return;
  }

  await prisma.folderAccess.deleteMany({
    where: { userId },
  });

  if (folderIds.length > 0) {
    await prisma.folderAccess.createMany({
      data: folderIds.map((folderId) => ({
        userId,
        folderId,
        role: "viewer",
      })),
    });
  }

  revalidatePath("/", "layout");
}
