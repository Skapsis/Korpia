/**
 * POST /api/datos  —  body: DatoInput | DatoInput[]
 * Upsert datos KPI (indicadorId, periodo, valorLogrado, valorMetaEspecifica?).
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const arr = Array.isArray(body) ? body : [body];

    const results: { id: string; indicadorId: string; periodo: string; valorLogrado: number; valorMetaEspecifica: number | null; createdAt: string }[] = [];

    for (const row of arr) {
      const indicadorId = typeof row.indicadorId === 'string' ? row.indicadorId.trim() : '';
      const periodo = typeof row.periodo === 'string' ? row.periodo.trim() : '';
      const valorLogrado = Number(row.valorLogrado);
      const valorMetaEspecifica =
        row.valorMetaEspecifica != null && row.valorMetaEspecifica !== ''
          ? Number(row.valorMetaEspecifica)
          : null;

      if (!indicadorId || !periodo) continue;

      const dato = await prisma.datoKPI.upsert({
        where: {
          indicadorId_periodo: { indicadorId, periodo },
        },
        create: {
          indicadorId,
          periodo,
          valorLogrado: Number.isNaN(valorLogrado) ? 0 : valorLogrado,
          valorMetaEspecifica: valorMetaEspecifica != null && !Number.isNaN(valorMetaEspecifica) ? valorMetaEspecifica : null,
        },
        update: {
          valorLogrado: Number.isNaN(valorLogrado) ? 0 : valorLogrado,
          valorMetaEspecifica: valorMetaEspecifica != null && !Number.isNaN(valorMetaEspecifica) ? valorMetaEspecifica : null,
        },
      });
      results.push({
        id: dato.id,
        indicadorId: dato.indicadorId,
        periodo: dato.periodo,
        valorLogrado: dato.valorLogrado,
        valorMetaEspecifica: dato.valorMetaEspecifica,
        createdAt: dato.createdAt.toISOString(),
      });
    }

    return NextResponse.json({ success: true, datos: results });
  } catch (e) {
    console.error('POST /api/datos error:', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Error al guardar datos.' },
      { status: 500 }
    );
  }
}
