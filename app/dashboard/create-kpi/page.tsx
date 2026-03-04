import { redirect } from 'next/navigation';

/** Create KPI redirige al flujo existente de creación de indicadores. */
export default function CreateKPIPage() {
  redirect('/dashboard/kpi/new');
}
