import { TableroDetailView } from '@/components/dashboard/enterprise/TableroDetailView';

/** Carga de datos: misma vista Analytics Studio que el detalle del tablero. */
export default function UploadPage() {
  return <TableroDetailView tableroId="upload" tableroNombre="Carga de datos" />;
}
