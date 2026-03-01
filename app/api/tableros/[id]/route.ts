/**
 * PUT /api/tableros/:id  —  DELETE /api/tableros/:id
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : undefined;
    const icono = typeof body.icono === 'string' ? body.icono : undefined;
    const orden = typeof body.orden === 'number' ? body.orden : body.orden != null ? Number(body.orden) : undefined;

    const data: { nombre?: string; icono?: string; orden?: number } = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (icono !== undefined) data.icono = icono;
    if (orden !== undefined && !Number.isNaN(orden)) data.orden = orden;

    const tablero = await prisma.tablero.update({
      where: { id },
      data,
      include: {
        indicadores: { include: { datos: true } },
        _count: { select: { indicadores: true } },
      },
    });

    return NextResponse.json({
      success: true,
      tablero: {
        id: tablero.id,
        empresaId: tablero.empresaId,
        nombre: tablero.nombre,
        descripcion: tablero.descripcion ?? null,
        icono: tablero.icono,
        orden: tablero.orden,
        indicadores: tablero.indicadores.map((i) => ({
          ...i,
          descripcion: i.descripcion ?? null,
          datos: i.datos,
          createdAt: i.createdAt.toISOString(),
        })),
        _count: tablero._count,
        createdAt: tablero.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error('PUT /api/tableros/[id] error:', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Error al actualizar.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await prisma.tablero.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/tableros/[id] error:', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Error al eliminar.' },
      { status: 500 }
    );
  }
}
