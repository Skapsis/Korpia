import { TableroDetailView } from '@/components/dashboard/enterprise/TableroDetailView';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nombre?: string }>;
}

/** Vista detalle del indicador: lienzo Power BI para diseñar el visual. */
export default async function TableroPage(props: PageProps) {
  const { id } = await props.params;
  const { nombre } = await props.searchParams;
  return <TableroDetailView tableroId={id} tableroNombre={nombre ?? 'Indicador'} />;
}
