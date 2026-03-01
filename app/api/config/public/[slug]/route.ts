/**
 * GET /api/config/public/:slug
 * Config pública por slug de empresa (login simulado / demo).
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const company = await prisma.company.findFirst({
      where: { slug: slug ?? '' },
    });
    if (!company) {
      return NextResponse.json(
        { success: false, message: 'Empresa no encontrada.' },
        { status: 404 }
      );
    }

    const tableros = await prisma.tablero.findMany({
      where: { empresaId: company.id },
      orderBy: { orden: 'asc' },
      include: {
        indicadores: {
          orderBy: { orden: 'asc' },
          include: { datos: { orderBy: { periodo: 'asc' } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      empresa: { id: company.id, nombre: company.name, slug: company.slug, logo: company.logo ?? undefined },
      tableros,
    });
  } catch (error) {
    console.error('GET /api/config/public/[slug] error:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener configuración.' },
      { status: 500 }
    );
  }
}
