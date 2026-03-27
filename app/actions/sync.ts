"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/app/actions/user";

function normalizeRole(value: string): "ADMIN" | "USER" {
  return value === "ADMIN" ? "ADMIN" : "USER";
}

export async function syncUsersCsv(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const file = formData.get("csvFile") as File | null;

  if (!(file instanceof File)) {
    return {
      success: false,
      error: "Debes seleccionar un archivo CSV válido.",
    };
  }

  try {
    const text = await file.text();
    const rows = text
      .split("\n")
      .map((line) => line.replace(/\r/g, "").trim())
      .filter((line) => line.length > 0);

    if (rows.length <= 1) {
      return {
        success: false,
        error: "El CSV no contiene filas de datos para sincronizar.",
      };
    }

    const headerRow = rows[0] ?? "";
    const delimiter = headerRow.includes(";") ? ";" : ",";
    const headers = headerRow
      .split(delimiter)
      .map((header) => header.trim().toLowerCase());

    const hasRequiredHeaders =
      headers.includes("name") &&
      headers.includes("email") &&
      headers.includes("role");

    if (!hasRequiredHeaders) {
      return {
        success: false,
        error: "Formato inválido. El CSV debe incluir las cabeceras: name, email, role.",
      };
    }

    const dataRows = rows.slice(1);

    await prisma.$transaction(
      dataRows
        .map((row) => row.split(delimiter).map((cell) => cell.trim()))
        .filter((columns) => columns.length >= 2)
        .map((columns) => {
          const name = columns[0] ?? "";
          const email = (columns[1] ?? "").toLowerCase();
          const role = normalizeRole(columns[2] ?? "USER");

          if (!email) {
            return null;
          }

          return prisma.user.upsert({
            where: { email },
            update: {
              name: name || null,
              role,
            },
            create: {
              name: name || null,
              email,
              role,
              password: "Password123!",
            },
          });
        })
        .filter((operation): operation is ReturnType<typeof prisma.user.upsert> => operation !== null)
    );

    revalidatePath("/admin");

    return {
      success: true,
      message: "Usuarios sincronizados correctamente.",
      error: null,
    };
  } catch {
    return {
      success: false,
      error: "Ocurrió un error al procesar el CSV.",
    };
  }
}
