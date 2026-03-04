import { getFolders } from '@/app/actions/folderActions';
import { KPIWizardPage } from '@/components/dashboard/enterprise/KPIWizardPage';

/** Lienzo del detalle: wizard Create New KPI. Pasa carpetas para el select opcional. */
export default async function NewKPIPage() {
  const { folders } = await getFolders();
  return <KPIWizardPage folders={folders ?? []} />;
}
