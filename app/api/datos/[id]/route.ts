/**
 * PUT /api/datos/:id  —  DELETE /api/datos/:id
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: { periodo?: string; valorLogrado?: number; valorMetaEspecifica?: number | null } = {};
    if (typeof body.periodo === 'string') data.periodo = body.periodo.trim();
    if (typeof body.valorLogrado === 'number') data.valorLogrado = body.valorLogrado;
    else if (body.valorLogrado != null) data.valorLogrado = Number(body.valorLogrado);
    if (body.valorMetaEspecifica != null && body.valorMetaEspecifica !== '')
      data.valorMetaEspecifica = Number(body.valorMetaEspecifica);
    else if (body.valorMetaEspecifica === null || body.valorMetaEspecifica === '')
      data.valorMetaEspecifica = null;

    const dato = await prisma.datoKPI.update({
      where: { id },
      data,
    });
    return NextResponse.json({
      success: true,
      dato: {
        id: dato.id,
        indicadorId: dato.indicadorId,
        periodo: dato.periodo,
        valorLogrado: dato.valorLogrado,
        valorMetaEspecifica: dato.valorMetaEspecifica,
        createdAt: dato.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error('PUT /api/datos/[id] error:', e);
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
    await prisma.datoKPI.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/datos/[id] error:', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Error al eliminar.' },
      { status: 500 }
    );
  }
}
