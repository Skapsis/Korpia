import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 10);

  let ventas = await prisma.folder.findFirst({ where: { name: "Ventas" } });
  if (!ventas) {
    ventas = await prisma.folder.create({
      data: {
        name: "Ventas",
        description: "Dashboards de ventas y facturación",
        order: 0,
      },
    });
  }

  let logistica = await prisma.folder.findFirst({ where: { name: "Logística" } });
  if (!logistica) {
    logistica = await prisma.folder.create({
      data: {
        name: "Logística",
        description: "Inventario, envíos y almacén",
        order: 1,
      },
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@korpia.com" },
    update: { password: hashedPassword, role: "ADMIN" },
    create: {
      email: "admin@korpia.com",
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@korpia.com" },
    update: { password: hashedPassword, role: "USER" },
    create: {
      email: "user@korpia.com",
      name: "User",
      password: hashedPassword,
      role: "USER",
    },
  });

  const existingAccess = await prisma.folderAccess.findUnique({
    where: {
      userId_folderId: { userId: user.id, folderId: ventas.id },
    },
  });
  if (!existingAccess) {
    await prisma.folderAccess.create({
      data: {
        userId: user.id,
        folderId: ventas.id,
        role: "viewer",
      },
    });
  }

  const existingVentasLink = await prisma.dashboardLink.findFirst({
    where: { folderId: ventas.id, title: "Resumen Ventas" },
  });
  if (!existingVentasLink) {
    await prisma.dashboardLink.create({
      data: {
        folderId: ventas.id,
        title: "Resumen Ventas",
        description: "Ventas por período y canal",
        url: "",
        order: 0,
      },
    });
  }

  const existingLogisticaLink = await prisma.dashboardLink.findFirst({
    where: { folderId: logistica.id, title: "Estado de Envíos" },
  });
  if (!existingLogisticaLink) {
    await prisma.dashboardLink.create({
      data: {
        folderId: logistica.id,
        title: "Estado de Envíos",
        description: "Seguimiento de pedidos y stock",
        url: "",
        order: 0,
      },
    });
  }

  console.log("Seed OK: Carpetas, Admin, User y FolderAccess (Ventas) creados.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
