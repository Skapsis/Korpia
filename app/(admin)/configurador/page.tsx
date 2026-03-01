import { prisma } from '@/lib/prisma';
import { ConfiguradorForms } from '@/components/admin/ConfiguradorForms';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';

export const dynamic = 'force-dynamic';

export default async function ConfiguradorPage() {
  const [companies, tableros, indicadores, fuentesDatos] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: 'asc' } }),
    prisma.tablero.findMany({
      orderBy: [{ empresaId: 'asc' }, { orden: 'asc' }],
      include: {
        empresa: true,
        _count: { select: { indicadores: true } },
      },
    }),
    prisma.indicador.findMany({
      orderBy: [{ tableroId: 'asc' }, { orden: 'asc' }],
      include: {
        tablero: { select: { nombre: true, icono: true } },
        fuenteDatos: { select: { id: true, nombre: true } },
      },
    }),
    prisma.fuenteDatos.findMany({
      orderBy: { nombre: 'asc' },
      include: { empresa: { select: { name: true } } },
    }),
  ]);

  const tablerosForForms = tableros.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    icono: t.icono,
    empresaId: t.empresaId,
    _count: t._count,
  }));

  const indicadoresForForm = indicadores.map((ind) => ({
    id: ind.id,
    titulo: ind.titulo,
    tableroNombre: ind.tablero.nombre,
    tableroIcono: ind.tablero.icono,
    fuenteDatosId: ind.fuenteDatosId ?? null,
    consultaSql: ind.consultaSql ?? '',
  }));

  const fuentesForForm = fuentesDatos.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    tipo: f.tipo,
    empresaNombre: f.empresa.name,
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Panel de Control BI</h1>
            <p className="text-slate-500 text-sm mt-1">
              Gestiona tableros e indicadores para el dashboard dinámico.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Ir al Dashboard →
          </Link>
        </header>

        <ConfiguradorForms
          companies={companies}
          tableros={tablerosForForms}
          indicadores={indicadoresForForm}
          fuentesDatos={fuentesForForm}
        />

        {/* Listado de tableros existentes */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold text-slate-800 p-6 pb-0">Tableros existentes</h2>
          {tableros.length === 0 ? (
            <p className="p-6 text-slate-500 text-sm">Aún no hay tableros. Crea uno arriba.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {tableros.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden>{t.icono}</span>
                    <div>
                      <p className="font-medium text-slate-800">{t.nombre}</p>
                      <p className="text-xs text-slate-400">{t.empresa.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500">
                      {t._count.indicadores} indicador{t._count.indicadores !== 1 ? 'es' : ''}
                    </span>
                    <Link
                      href={`/${t.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Ver gráficos →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
