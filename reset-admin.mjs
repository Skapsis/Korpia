import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@korpia.com";
  const plainPassword = "Admin123!";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
      role: "ADMIN",
    },
    select: { id: true, email: true },
  });

  if (!updatedUser) {
    throw new Error("No se encontró el usuario administrador.");
  }

  console.log("Contraseña reseteada con éxito");
}

main()
  .catch((error) => {
    console.error("Error al resetear contraseña de admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
