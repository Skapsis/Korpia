"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createGroup(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim();

  if (!name) return;

  await prisma.group.create({
    data: { name },
  });

  revalidatePath("/", "layout");
}

export async function deleteGroup(id: string) {
  await prisma.group.delete({ where: { id } });
  revalidatePath("/", "layout");
}

export async function assignUserToGroup(formData: FormData) {
  const userId = (formData.get("userId") as string | null)?.trim();
  const groupId = (formData.get("groupId") as string | null)?.trim() || null;

  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { groupId },
  });

  revalidatePath("/", "layout");
}

export async function updateGroupDashboards(formData: FormData) {
  const groupId = (formData.get("groupId") as string | null)?.trim();
  const dashboardIds = formData.getAll("dashboardIds") as string[];

  if (!groupId) return;

  await prisma.groupDashboardAccess.deleteMany({ where: { groupId } });

  if (dashboardIds.length > 0) {
    await prisma.groupDashboardAccess.createMany({
      data: dashboardIds.map((dashboardId) => ({ groupId, dashboardId })),
    });
  }

  revalidatePath("/", "layout");
}
