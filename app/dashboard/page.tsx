import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

/**
 * Pantalla principal del dashboard: Resumen de Tableros.
 * Muestra una cuadrícula de tarjetas; cada una enlaza al tablero (drill-down).
 */
export default async function DashboardPage() {
  const tableros = await prisma.tablero.findMany({
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    include: {
      empresa: { select: { name: true } },
      _count: { select: { indicadores: true } },
    },
  });

  if (tableros.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] text-center px-8 py-12">
        <span className="text-5xl">📊</span>
        <h2 className="section-title mt-6">Sin tableros configurados</h2>
        <p className="text-slate-500 text-sm mt-3 max-w-sm">
          Configura tableros e indicadores en Administración para ver el dashboard dinámico.
        </p>
        <Link
          href="/dashboard/config"
          className="mt-8 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
        >
          Ir a Administración
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-10">
      <header className="mb-10">
        <h1 className="section-title">Tableros</h1>
        <p className="label-mini mt-2">Selecciona un tablero para ver sus indicadores</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {tableros.map((tablero) => (
          <Link
            key={tablero.id}
            href={`/dashboard/tablero/${tablero.id}`}
            className="block p-8 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300/80 hover:-translate-y-0.5 transition-all text-left"
          >
            <span className="text-4xl" aria-hidden>{tablero.icono}</span>
            <h2 className="section-title mt-4">{tablero.nombre}</h2>
            {tablero.descripcion && (
              <p className="text-slate-500 text-sm mt-2 line-clamp-2">{tablero.descripcion}</p>
            )}
            <p className="label-mini mt-4">
              {tablero.empresa.name} · {tablero._count.indicadores} indicador{tablero._count.indicadores !== 1 ? 'es' : ''}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
