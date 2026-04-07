import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type UpdatePasswordBody = {
  newPassword?: string;
  confirmPassword?: string;
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = typeof session?.user?.id === "string" ? session.user.id : "";

    if (!userId) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = (await req.json()) as UpdatePasswordBody;
    const newPassword = typeof body.newPassword === "string" ? body.newPassword.trim() : "";
    const confirmPassword =
      typeof body.confirmPassword === "string" ? body.confirmPassword.trim() : "";

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "La nueva contraseña y su confirmación son obligatorias." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Las contraseñas no coinciden." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
