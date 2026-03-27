"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type ActionState = {
  success: boolean;
  message?: string;
  error?: string | null;
};

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

export async function updateUserRole(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = (formData.get("userId") as string | null)?.trim();
  const role = (formData.get("role") as string | null)?.trim();

  if (!userId || !role || (role !== "ADMIN" && role !== "USER")) {
    return {
      success: false,
      message: "",
      error: "Datos inválidos para actualizar rol.",
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: "Rol actualizado correctamente.",
      error: null,
    };
  } catch {
    return {
      success: false,
      message: "",
      error: "No se pudo actualizar el rol del usuario.",
    };
  }
}

export async function deleteUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = (formData.get("userId") as string | null)?.trim();

  if (!userId) {
    return {
      success: false,
      message: "",
      error: "Falta userId para eliminar.",
    };
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: "Usuario eliminado correctamente.",
      error: null,
    };
  } catch {
    return {
      success: false,
      message: "",
      error: "No se pudo eliminar el usuario.",
    };
  }
}
