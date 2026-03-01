/**
 * GET /api/tableros?empresaId=slug|id
 * POST /api/tableros { empresaId, nombre, icono?, orden? }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaIdOrSlug = searchParams.get('empresaId');

    const where = empresaIdOrSlug
      ? {
          empresa: {
            OR: [{ id: empresaIdOrSlug }, { slug: empresaIdOrSlug }],
          },
        }
      : {};

    const tableros = await prisma.tablero.findMany({
      where,
      orderBy: [{ empresaId: 'asc' }, { orden: 'asc' }],
      include: {
        empresa: { select: { id: true, name: true, slug: true } },
        indicadores: {
          orderBy: { orden: 'asc' },
          include: {
            datos: { orderBy: { periodo: 'asc' } },
          },
        },
        _count: { select: { indicadores: true } },
      },
    });

    const serialized = tableros.map((t) => ({
      id: t.id,
      empresaId: t.empresaId,
      nombre: t.nombre,
      descripcion: t.descripcion ?? null,
      icono: t.icono,
      orden: t.orden,
      indicadores: t.indicadores.map((i) => ({
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
      })),
      _count: t._count,
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, tableros: serialized });
  } catch (e) {
    console.error('GET /api/tableros error:', e);
    return NextResponse.json(
      { success: false, message: 'Error al listar tableros.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const empresaId = typeof body.empresaId === 'string' ? body.empresaId.trim() : '';
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    const icono = typeof body.icono === 'string' ? body.icono.trim() || '📊' : '📊';
    const orden = typeof body.orden === 'number' ? body.orden : Number(body.orden) || 0;

    if (!nombre) {
      return NextResponse.json(
        { success: false, message: 'Nombre del tablero es obligatorio.' },
        { status: 400 }
      );
    }

    let companyId = empresaId;
    if (empresaId && !empresaId.startsWith('c')) {
      const company = await prisma.company.findFirst({
        where: { OR: [{ id: empresaId }, { slug: empresaId }] },
      });
      if (!company) {
        return NextResponse.json(
          { success: false, message: 'Empresa no encontrada.' },
          { status: 404 }
        );
      }
      companyId = company.id;
    }
    if (!companyId) {
      const first = await prisma.company.findFirst({ orderBy: { name: 'asc' } });
      if (!first) {
        return NextResponse.json(
          { success: false, message: 'No hay empresa configurada.' },
          { status: 400 }
        );
      }
      companyId = first.id;
    }

    const tablero = await prisma.tablero.create({
      data: { empresaId: companyId, nombre, icono, orden },
      include: {
        indicadores: true,
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
          datos: [],
          createdAt: i.createdAt.toISOString(),
        })),
        _count: tablero._count,
        createdAt: tablero.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error('POST /api/tableros error:', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Error al crear tablero.' },
      { status: 500 }
    );
  }
}
