import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { ForcePasswordChangeModal } from "@/components/auth/ForcePasswordChangeModal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthSessionProvider>
      <div className="flex min-h-screen bg-gray-50 dark:bg-zinc-950">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <DashboardHeader />
          <main className="min-h-0 flex-1 overflow-auto">{children}</main>
        </div>
      </div>
      <ForcePasswordChangeModal />
    </AuthSessionProvider>
  );
}
