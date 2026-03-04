import { redirect } from 'next/navigation';

/** El Studio es ahora la vista principal en /dashboard. Redirigir para no duplicar. */
export default function StudioPage() {
  redirect('/dashboard');
}
