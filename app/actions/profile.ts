"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/app/actions/user";

export async function updatePassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  const userId = typeof session?.user?.id === "string" ? session.user.id : "";

  if (!userId) {
    return {
      success: false,
      error: "401 Unauthorized. Debes iniciar sesión.",
    };
  }

  const currentPassword = (formData.get("currentPassword") as string | null)?.trim() ?? "";
  const newPassword = (formData.get("newPassword") as string | null)?.trim() ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string | null)?.trim() ?? "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return {
      success: false,
      error: "Todos los campos de contraseña son obligatorios.",
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      success: false,
      error: "La nueva contraseña y la confirmación no coinciden.",
    };
  }

  if (newPassword.length < 8) {
    return {
      success: false,
      error: "La nueva contraseña debe tener al menos 8 caracteres.",
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });

  if (!dbUser) {
    return {
      success: false,
      error: "Usuario no encontrado.",
    };
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, dbUser.password);
  if (!isCurrentValid) {
    return {
      success: false,
      error: "La contraseña actual es incorrecta.",
    };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return {
    success: true,
    message: "Contraseña actualizada correctamente.",
    error: null,
  };
}
