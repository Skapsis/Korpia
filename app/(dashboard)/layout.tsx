import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tableros = await prisma.tablero.findMany({
    orderBy: { orden: 'asc' },
  });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="flex flex-col w-64 flex-shrink-0 bg-white border-r border-slate-200">
        <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-200">
          <div className="flex justify-center items-center w-10 h-10 rounded-xl bg-indigo-600 text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm13 2a3 3 0 110 6 3 3 0 010-6z" />
            </svg>
          </div>
          <div>
            <h1 className="text-slate-900 font-bold text-lg leading-none">BI</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
              Tableros
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          {tableros.length === 0 ? (
            <p className="text-xs text-slate-400 px-2 py-3 italic">Sin tableros configurados</p>
          ) : (
            tableros.map((t) => (
              <Link
                key={t.id}
                href={`/${t.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <span className="text-lg" aria-hidden>{t.icono}</span>
                <span className="truncate">{t.nombre}</span>
              </Link>
            ))
          )}

          <div className="pt-4 mt-4 border-t border-slate-200">
            <Link
              href="/configurador"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <span className="text-lg" aria-hidden>⚙️</span>
              <span>Administración</span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
