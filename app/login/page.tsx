import { LoginForm } from "@/components/LoginForm";
import { loginAction } from "@/app/actions/login";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="mb-2 text-center text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Portal BI · Korpia2
          </h1>
          <p className="mb-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Inicia sesión para continuar
          </p>
          <LoginForm action={loginAction} />
        </div>
      </div>
    </div>
  );
}
