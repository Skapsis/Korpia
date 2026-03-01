'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function crearTablero(
  empresaId: string,
  nombre: string,
  icono: string = '📊'
) {
  try {
    await prisma.tablero.create({
      data: {
        empresaId,
        nombre,
        icono: icono || '📊',
        orden: 0,
      },
    });
    revalidatePath('/');
    revalidatePath('/configurador');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al crear el tablero';
    return { error: message };
  }
}

export async function crearIndicador(
  tableroId: string,
  titulo: string,
  tipoGrafico: string = 'bar',
  unidad: string = 'num',
  metaGlobal: number = 0,
  fuenteDatosId?: string | null,
  consultaSql?: string | null,
  usaDatosDinamicos?: boolean,
  cadenaConexion?: string | null
) {
  const payload = {
    tableroId,
    titulo,
    tipoGrafico: tipoGrafico || 'bar',
    unidad: unidad || 'num',
    metaGlobal: Number(metaGlobal) ?? 0,
    orden: 0,
    gridX: 0,
    gridY: 999,
    gridW: 4,
    gridH: 3,
    fuenteDatosId: fuenteDatosId && String(fuenteDatosId).trim() ? fuenteDatosId : null,
    consultaSql: consultaSql?.trim() || null,
    usaDatosDinamicos: usaDatosDinamicos ?? false,
    cadenaConexion: cadenaConexion?.trim() || null,
  };
  console.log('PAYLOAD RECIBIDO crearIndicador:', JSON.stringify(payload, null, 2));

  try {
    const indicador = await prisma.indicador.create({
      data: payload,
    });
    revalidatePath('/');
    revalidatePath('/configurador');
    revalidatePath('/dashboard');
    return { success: true, indicadorId: indicador.id };
  } catch (e: unknown) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Error desconocido al crear el indicador';
    console.error('crearIndicador error:', e);
    return { error: message };
  }
}

export async function agregarDatosKPI(
  indicadorId: string,
  periodo: string,
  valorLogrado: number,
  valorMeta?: number | null
) {
  try {
    await prisma.datoKPI.upsert({
      where: {
        indicadorId_periodo: { indicadorId, periodo },
      },
      create: {
        indicadorId,
        periodo,
        valorLogrado: Number(valorLogrado),
        valorMetaEspecifica: valorMeta != null ? Number(valorMeta) : null,
      },
      update: {
        valorLogrado: Number(valorLogrado),
        valorMetaEspecifica: valorMeta != null ? Number(valorMeta) : null,
      },
    });
    revalidatePath('/');
    revalidatePath('/configurador');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al agregar el dato KPI';
    return { error: message };
  }
}

/** Layout del canvas: cada item tiene i (indicadorId), x, y, w, h */
export async function guardarLayoutCanvas(
  layout: { i: string; x: number; y: number; w: number; h: number }[]
): Promise<{ success: true } | { error: string }> {
  try {
    for (const item of layout) {
      await prisma.indicador.update({
        where: { id: item.i },
        data: {
          gridX: item.x,
          gridY: item.y,
          gridW: item.w,
          gridH: item.h,
        },
      });
    }
    revalidatePath('/');
    revalidatePath('/configurador');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al guardar el layout';
    return { error: message };
  }
}
