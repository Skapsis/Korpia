'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/appContext';
import { fetchConfigDynamic, Indicador, Tablero } from '@/lib/configDrivenApi';
import { EnterpriseSidebar } from './EnterpriseSidebar';
import { MainHeader } from './MainHeader';
import { DashboardContent, IndicadorCard } from './DashboardContent';

export function EnterpriseMainLayout() {
  const { auth } = useApp();
  const pathname = usePathname();
  const [indicadores, setIndicadores] = useState<IndicadorCard[]>([]);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    fetchConfigDynamic()
      .then((res) => {
        const all: IndicadorCard[] = [];
        (res.tableros ?? []).forEach((t: Tablero) => {
          (t.indicadores ?? []).forEach((i: Indicador) => {
            const lastDato = i.datos?.[i.datos.length - 1];
            const valor = lastDato
              ? i.unidad === '$' || i.unidad === 'USD'
                ? `$${lastDato.valorLogrado.toLocaleString()}`
                : i.unidad === '%' || i.unidad === 'pct'
                  ? `${lastDato.valorLogrado}%`
                  : String(lastDato.valorLogrado)
              : undefined;
            all.push({
              id: i.id,
              titulo: i.titulo,
              valor,
              tendencia: undefined,
              tendenciaUp: i.esMejorMayor,
              tipoGrafico: i.tipoGrafico,
            });
          });
        });
        setIndicadores(all);
      })
      .catch(() => setIndicadores([]));
  }, [auth.isAuthenticated, pathname]);

  const isEmpty = indicadores.length === 0;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100 antialiased">
      <EnterpriseSidebar isEmpty={isEmpty} />
      <main className="relative flex h-full flex-1 flex-col overflow-hidden bg-zinc-950">
        <MainHeader />
        <DashboardContent indicadores={indicadores} />
      </main>
    </div>
  );
}
