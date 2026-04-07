import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type CreateFolderBody = {
  name?: string;
  description?: string;
  parentId?: string | null;
};

export async function GET(req: Request) {
  const session = await auth();
  const userId = typeof session?.user?.id === "string" ? session.user.id : "";
  const role = typeof session?.user?.role === "string" ? session.user.role : "USER";

  if (!userId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parentIdParam = searchParams.get("parentId");
  const parentId = parentIdParam ? parentIdParam.trim() : null;

  const where = {
    parentId,
    ...(role === "ADMIN"
      ? {}
      : {
          folderAccess: {
            some: {
              userId,
            },
          },
        }),
  };

  const folders = await prisma.folder.findMany({
    where,
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: {
          children: true,
          dashboardLinks: true,
        },
      },
    },
  });

  return NextResponse.json({ folders });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = typeof session?.user?.id === "string" ? session.user.id : "";
  const role = typeof session?.user?.role === "string" ? session.user.role : "USER";

  if (!userId || role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = (await req.json()) as CreateFolderBody;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description =
    typeof body.description === "string" && body.description.trim().length > 0
      ? body.description.trim()
      : null;
  const parentId =
    typeof body.parentId === "string" && body.parentId.trim().length > 0
      ? body.parentId.trim()
      : null;

  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  if (parentId) {
    const parent = await prisma.folder.findUnique({
      where: { id: parentId },
      select: { id: true },
    });
    if (!parent) {
      return NextResponse.json({ error: "La carpeta padre no existe." }, { status: 400 });
    }
  }

  const maxOrder = await prisma.folder.aggregate({
    where: { parentId },
    _max: { order: true },
  });
  const nextOrder = (maxOrder._max.order ?? -1) + 1;

  const folder = await prisma.folder.create({
    data: {
      name,
      description,
      parentId,
      order: nextOrder,
    },
  });

  return NextResponse.json({ folder }, { status: 201 });
}
