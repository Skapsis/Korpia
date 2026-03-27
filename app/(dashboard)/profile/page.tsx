import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { PasswordForm } from "@/components/profile/PasswordForm";

function getInitial(name: string | undefined, email: string | undefined): string {
  if (name && name.trim().length > 0) {
    return name.trim().charAt(0).toUpperCase();
  }
  if (email && email.trim().length > 0) {
    return email.trim().charAt(0).toUpperCase();
  }
  return "U";
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userName = typeof session.user.name === "string" ? session.user.name : "Usuario";
  const userEmail = typeof session.user.email === "string" ? session.user.email : "Sin email";
  const userRole = typeof session.user.role === "string" ? session.user.role : "USER";
  const initial = getInitial(session.user.name ?? undefined, session.user.email ?? undefined);

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Mi Perfil</h1>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-2xl font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
            {initial}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Información personal</p>
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{userName}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{userEmail}</p>
            <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Rol: {userRole}
            </span>
          </div>
        </div>
      </div>

      <PasswordForm />
    </div>
  );
}
