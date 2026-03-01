/**
 * GET /api/indicadores/:id  —  PUT /api/indicadores/:id  —  DELETE /api/indicadores/:id
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function serializeIndicador(i: {
  id: string;
  tableroId: string;
  titulo: string;
  descripcion: string | null;
  tipoGrafico: string;
  unidad: string;
  metaGlobal: number;
  colorPrincipal: string;
  esMejorMayor: boolean;
  orden: number;
  datos: { id: string; indicadorId: string; periodo: string; valorLogrado: number; valorMetaEspecifica: number | null; createdAt: Date }[];
  createdAt: Date;
}) {
  return {
    id: i.id,
    tableroId: i.tableroId,
    titulo: i.titulo,
    descripcion: i.descripcion ?? null,
    tipoGrafico: i.tipoGrafico,
    unidad: i.unidad,
    metaGlobal: i.metaGlobal,
    colorPrincipal: i.colorPrincipal,
    esMejorMayor: i.esMejorMayor,
    orden: i.orden,
    datos: i.datos.map((d) => ({
      id: d.id,
      indicadorId: d.indicadorId,
      periodo: d.periodo,
      valorLogrado: d.valorLogrado,
      valorMetaEspecifica: d.valorMetaEspecifica,
      createdAt: d.createdAt.toISOString(),
    })),
    createdAt: i.createdAt.toISOString(),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const indicador = await prisma.indicador.findUnique({
      where: { id },
      include: { datos: { orderBy: { periodo: 'asc' } } },
    });
    if (!indicador) {
      return NextResponse.json(
        { success: false, message: 'Indicador no encontrado.' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      indicador: serializeIndicador(indicador),
    });
  } catch (e) {
    console.error('GET /api/indicadores/[id] error:', e);
    return NextResponse.json(
      { success: false, message: 'Error al obtener indicador.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (typeof body.titulo === 'string') data.titulo = body.titulo.trim();
    if (typeof body.tipoGrafico === 'string') data.tipoGrafico = body.tipoGrafico;
    if (typeof body.unidad === 'string') data.unidad = body.unidad;
    if (typeof body.metaGlobal === 'number') data.metaGlobal = body.metaGlobal;
    else if (body.metaGlobal != null) data.metaGlobal = Number(body.metaGlobal);
    if (typeof body.colorPrincipal === 'string') data.colorPrincipal = body.colorPrincipal;
    if (typeof body.esMejorMayor === 'boolean') data.esMejorMayor = body.esMejorMayor;
    if (typeof body.orden === 'number') data.orden = body.orden;
    else if (body.orden != null) data.orden = Number(body.orden);
    if (typeof body.tableroId === 'string') data.tableroId = body.tableroId.trim();

    const indicador = await prisma.indicador.update({
      where: { id },
      data,
      include: { datos: true },
    });
    return NextResponse.json({
      success: true,
      indicador: serializeIndicador(indicador),
    });
  } catch (e) {
    console.error('PUT /api/indicadores/[id] error:', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Error al actualizar.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.indicador.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/indicadores/[id] error:', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Error al eliminar.' },
      { status: 500 }
    );
  }
}
