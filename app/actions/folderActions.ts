'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function getFolders() {
  try {
    const folders = await prisma.folder.findMany({
      orderBy: { name: 'asc' },
    });
    return { folders };
  } catch (error) {
    console.error('getFolders error:', error);
    return { folders: [], error: error instanceof Error ? error.message : 'Error al cargar carpetas' };
  }
}

export async function createFolder(name: string) {
  const trimmed = name?.trim();
  if (!trimmed) return { error: 'El nombre es obligatorio' };
  try {
    await prisma.folder.create({
      data: { name: trimmed },
    });
    revalidatePath('/dashboard', 'layout');
    return { success: true };
  } catch (error) {
    console.error('createFolder error:', error);
    return { error: error instanceof Error ? error.message : 'Error al crear la carpeta' };
  }
}
