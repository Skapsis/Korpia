import Link from 'next/link';

/** Página placeholder para Reports hasta que el módulo esté listo. */
export default function ReportsPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-zinc-950 px-6 py-12">
      <div className="flex flex-col items-center text-center max-w-md">
        <span
          className="material-symbols-outlined text-7xl text-zinc-600 dark:text-zinc-500 mb-4"
          aria-hidden
        >
          description
        </span>
        <h1 className="text-xl font-bold text-zinc-100">Reports</h1>
        <p className="mt-2 text-sm text-zinc-400">Módulo en desarrollo</p>
        <p className="mt-1 text-xs text-zinc-500">
          Los reportes guardados y plantillas estarán disponibles próximamente.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}
