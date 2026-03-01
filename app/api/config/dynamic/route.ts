/**
 * GET /api/config/dynamic
 * Configuración dinámica del dashboard desde Prisma (BI).
 * Devuelve empresa + tableros con indicadores y datos.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Por ahora: primera empresa. En Paso 3 se reemplazará por sesión/auth.
    const company = await prisma.company.findFirst({
      orderBy: { name: 'asc' },
    });
    if (!company) {
      return NextResponse.json(
        { success: false, message: 'No hay empresa configurada.' },
        { status: 404 }
      );
    }

    const tableros = await prisma.tablero.findMany({
      where: { empresaId: company.id },
      orderBy: { orden: 'asc' },
      include: {
        indicadores: {
          orderBy: { orden: 'asc' },
          include: {
            datos: { orderBy: { periodo: 'asc' } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      empresa: {
        id: company.id,
        nombre: company.name,
        slug: company.slug,
        logo: company.logo ?? undefined,
      },
      tableros,
    });
  } catch (error) {
    console.error('GET /api/config/dynamic error:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener configuración dinámica.' },
      { status: 500 }
    );
  }
}
