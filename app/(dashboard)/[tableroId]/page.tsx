import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { TableroViewWithToolbar } from '@/components/dashboard/TableroViewWithToolbar';
import type { IndicadorConGrid } from '@/components/dashboard/DraggableCanvas';

interface PageProps {
  params: Promise<{ tableroId: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function VisualizadorTableroPage({ params, searchParams }: PageProps) {
  const { tableroId } = await params;
  const { start, end } = await searchParams;

  const tablero = await prisma.tablero.findUnique({
    where: { id: tableroId },
    include: {
      empresa: true,
      indicadores: {
        orderBy: { orden: 'asc' },
        include: {
          datos: { orderBy: { periodo: 'asc' } },
        },
      },
    },
  });

  if (!tablero) notFound();

  // Serializar para pasar a Client Components (fechas → string + grid + motor SQL)
  const indicadores: IndicadorConGrid[] = tablero.indicadores.map((ind) => ({
    id: ind.id,
    tableroId: ind.tableroId,
    titulo: ind.titulo,
    descripcion: ind.descripcion ?? undefined,
    tipoGrafico: (ind.tipoGrafico || 'bar') as 'bar' | 'line' | 'combo' | 'pie' | 'area' | 'gauge' | 'scorecard' | 'table',
    unidad: ind.unidad || 'num',
    metaGlobal: ind.metaGlobal,
    colorPrincipal: ind.colorPrincipal || '#6366f1',
    esMejorMayor: ind.esMejorMayor,
    orden: ind.orden,
    gridX: ind.gridX ?? 0,
    gridY: ind.gridY ?? 0,
    gridW: ind.gridW ?? 4,
    gridH: ind.gridH ?? 3,
    usaDatosDinamicos: ind.usaDatosDinamicos ?? false,
    cadenaConexion: ind.cadenaConexion ?? null,
    consultaSql: ind.consultaSql ?? null,
    datos: ind.datos.map((d) => ({
      id: d.id,
      indicadorId: d.indicadorId,
      periodo: d.periodo,
      valorLogrado: d.valorLogrado,
      valorMetaEspecifica: d.valorMetaEspecifica,
      createdAt: d.createdAt.toISOString(),
    })),
    createdAt: ind.createdAt.toISOString(),
  }));

  return (
    <TableroViewWithToolbar
      tablero={{
        id: tablero.id,
        nombre: tablero.nombre,
        icono: tablero.icono,
        descripcion: tablero.descripcion,
        empresa: tablero.empresa,
      }}
      indicadores={indicadores}
      start={start ?? undefined}
      end={end ?? undefined}
    />
  );
}
