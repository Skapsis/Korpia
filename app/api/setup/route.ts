import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Ruta de rescate: GET /api/setup
 * Crea o actualiza el usuario admin@korpia.com con contraseña 123456.
 * Útil si el seed falló o la BD se perdió.
 */
export async function GET() {
  try {
    const hashedPassword = await bcrypt.hash("123456", 10);
    await prisma.user.upsert({
      where: { email: "admin@korpia.com" },
      update: { password: hashedPassword, role: "ADMIN", name: "Admin" },
      create: {
        email: "admin@korpia.com",
        name: "Admin",
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Setup error:", e);
    return NextResponse.json(
      { success: false, error: String(e) },
      { status: 500 }
    );
  }
}
