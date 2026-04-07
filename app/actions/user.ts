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
  const name = (formData.get("name") as string | null)?.trim() || null;
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
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role === "ADMIN" ? "ADMIN" : "USER",
      groupId,
    },
  });

  revalidatePath("/", "layout");
}

export async function updateUserProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = (formData.get("userId") as string | null)?.trim();
  const name = (formData.get("name") as string | null)?.trim() || null;
  const role = (formData.get("role") as string | null)?.trim();
  const groupId = (formData.get("groupId") as string | null)?.trim() || null;

  if (!userId || !role || (role !== "ADMIN" && role !== "USER")) {
    return {
      success: false,
      message: "",
      error: "Datos inválidos para actualizar usuario.",
    };
  }

  try {
    if (groupId) {
      const groupExists = await prisma.group.findUnique({
        where: { id: groupId },
        select: { id: true },
      });
      if (!groupExists) {
        return {
          success: false,
          message: "",
          error: "El grupo seleccionado no existe.",
        };
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { name, role, groupId },
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: "Usuario actualizado correctamente.",
      error: null,
    };
  } catch {
    return {
      success: false,
      message: "",
      error: "No se pudo actualizar el usuario.",
    };
  }
}

export async function resetUserPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = (formData.get("userId") as string | null)?.trim();
  const newPassword = (formData.get("newPassword") as string | null)?.trim();

  if (!userId || !newPassword || newPassword.length < 8) {
    return {
      success: false,
      message: "",
      error: "La nueva contraseña debe tener al menos 8 caracteres.",
    };
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      },
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: "Contraseña reseteada correctamente.",
      error: null,
    };
  } catch {
    return {
      success: false,
      message: "",
      error: "No se pudo resetear la contraseña.",
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

export async function deleteUsersBulk(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userIds = formData
    .getAll("userIds")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (userIds.length === 0) {
    return {
      success: false,
      message: "",
      error: "Selecciona al menos un usuario para borrar.",
    };
  }

  try {
    const result = await prisma.user.deleteMany({
      where: {
        id: { in: userIds },
      },
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: `${result.count} usuario(s) eliminados.`,
      error: null,
    };
  } catch {
    return {
      success: false,
      message: "",
      error: "No se pudieron eliminar los usuarios seleccionados.",
    };
  }
}
