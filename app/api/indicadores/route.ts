/**
 * POST /api/indicadores { tableroId, titulo, tipoGrafico?, unidad?, metaGlobal?, colorPrincipal?, esMejorMayor?, orden? }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tableroId = typeof body.tableroId === 'string' ? body.tableroId.trim() : '';
    const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : '';

    if (!tableroId || !titulo) {
      return NextResponse.json(
        { success: false, message: 'tableroId y titulo son obligatorios.' },
        { status: 400 }
      );
    }

    const tipoGrafico = typeof body.tipoGrafico === 'string' ? body.tipoGrafico : 'bar';
    const unidad = typeof body.unidad === 'string' ? body.unidad : 'num';
    const metaGlobal = Number(body.metaGlobal);
    const colorPrincipal = typeof body.colorPrincipal === 'string' ? body.colorPrincipal : '#6366f1';
    const esMejorMayor = body.esMejorMayor !== false;
    const orden = typeof body.orden === 'number' ? body.orden : Number(body.orden) || 0;

    const indicador = await prisma.indicador.create({
      data: {
        tableroId,
        titulo,
        tipoGrafico: tipoGrafico || 'bar',
        unidad: unidad || 'num',
        metaGlobal: Number.isNaN(metaGlobal) ? 0 : metaGlobal,
        colorPrincipal: colorPrincipal || '#6366f1',
        esMejorMayor,
        orden,
      },
      include: {
        datos: true,
      },
    });

    return NextResponse.json({
      success: true,
      indicador: {
        id: indicador.id,
        tableroId: indicador.tableroId,
        titulo: indicador.titulo,
        descripcion: indicador.descripcion ?? null,
        tipoGrafico: indicador.tipoGrafico,
        unidad: indicador.unidad,
        metaGlobal: indicador.metaGlobal,
        colorPrincipal: indicador.colorPrincipal,
        esMejorMayor: indicador.esMejorMayor,
        orden: indicador.orden,
        datos: indicador.datos.map((d) => ({
          id: d.id,
          indicadorId: d.indicadorId,
          periodo: d.periodo,
          valorLogrado: d.valorLogrado,
          valorMetaEspecifica: d.valorMetaEspecifica,
          createdAt: d.createdAt.toISOString(),
        })),
        createdAt: indicador.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error('POST /api/indicadores error:', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Error al crear indicador.' },
      { status: 500 }
    );
  }
}
