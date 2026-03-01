/**
 * GET /api/companies
 * Lista todas las empresas (Company) para selector superadmin.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
    return NextResponse.json({
      success: true,
      companies: companies.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    });
  } catch (e) {
    console.error('GET /api/companies error:', e);
    return NextResponse.json(
      { success: false, message: 'Error al listar empresas.' },
      { status: 500 }
    );
  }
}
