'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export interface CreateKPIFormData {
  name: string;
  description: string;
  category: string;
  unitType: string;
  trendDirection: 'up' | 'down';
  dataSource?: string;
  folderId?: string | null;
}

export async function createKpi(formData: CreateKPIFormData) {
  try {
    await prisma.kPI.create({
      data: {
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        unitType: formData.unitType,
        trendDirection: formData.trendDirection,
        folderId: formData.folderId || null,
      },
    });
    revalidatePath('/dashboard', 'layout');
    return { success: true };
  } catch (error) {
    console.error('createKpi error:', error);
    return { error: error instanceof Error ? error.message : 'Error al crear el KPI' };
  }
}

export async function deleteKpi(id: string) {
  try {
    await prisma.kPI.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error('deleteKpi error:', error);
    return { error: error instanceof Error ? error.message : 'Error al eliminar el KPI' };
  }
}

export async function deleteIndicador(id: string) {
  try {
    await prisma.datoKPI.deleteMany({ where: { indicadorId: id } });
    await prisma.indicador.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error('deleteIndicador error:', error);
    return { error: error instanceof Error ? error.message : 'Error al eliminar el indicador' };
  }
}
