import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type ToggleFavoriteBody = {
  dashboardId?: string;
};

export async function POST(req: Request) {
  const session = await auth();
  const userId = typeof session?.user?.id === "string" ? session.user.id : "";

  if (!userId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = (await req.json()) as ToggleFavoriteBody;
  const dashboardId = typeof body.dashboardId === "string" ? body.dashboardId.trim() : "";

  if (!dashboardId) {
    return NextResponse.json({ error: "dashboardId es obligatorio." }, { status: 400 });
  }

  const dashboard = await prisma.dashboardLink.findUnique({
    where: { id: dashboardId },
    select: { id: true },
  });

  if (!dashboard) {
    return NextResponse.json({ error: "Indicador no encontrado." }, { status: 404 });
  }

  const existing = await prisma.user.findFirst({
    where: {
      id: userId,
      favoriteDashboards: {
        some: {
          id: dashboardId,
        },
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        favoriteDashboards: {
          disconnect: { id: dashboardId },
        },
      },
    });
    return NextResponse.json({ success: true, isFavorite: false });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      favoriteDashboards: {
        connect: { id: dashboardId },
      },
    },
  });

  return NextResponse.json({ success: true, isFavorite: true });
}
