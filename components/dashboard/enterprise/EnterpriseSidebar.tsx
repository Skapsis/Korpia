'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getFolders, createFolder } from '@/app/actions/folderActions';
import toast from 'react-hot-toast';

interface EnterpriseSidebarProps {
  isEmpty?: boolean;
}

interface Folder {
  id: string;
  name: string;
  createdAt: Date | string;
}

function NavLink({
  href,
  icon,
  label,
  isActive,
}: {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
        isActive
          ? 'bg-blue-600/20 text-blue-600 hover:bg-blue-600/30 dark:text-blue-500'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
      }`}
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

export function EnterpriseSidebar({ isEmpty = false }: EnterpriseSidebarProps) {
  const pathname = usePathname();
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    getFolders().then((res) => {
      if (res.folders?.length) setFolders(res.folders);
    });
  }, []);

  const handleCreateFolder = async () => {
    const name = window.prompt('Nombre de la carpeta');
    if (!name?.trim()) return;
    const result = await createFolder(name.trim());
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Carpeta creada');
    getFolders().then((res) => res.folders && setFolders(res.folders));
  };

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-200 dark:border-zinc-800">
        <div
          className="aspect-square h-8 w-8 rounded-full bg-slate-200 ring-1 ring-slate-300 dark:bg-zinc-700 dark:ring-zinc-600"
          aria-hidden
        />
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold leading-tight tracking-tight text-slate-900 dark:text-zinc-100">Acme Corp</h1>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-400">Enterprise</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-6">
        <nav className="flex flex-col gap-1">
          <NavLink href="/dashboard" icon="grid_view" label="Dashboard" isActive={pathname === '/dashboard'} />
          <NavLink href="/dashboard/reports" icon="description" label="Reports" isActive={pathname === '/dashboard/reports'} />
          <NavLink href="/dashboard/team" icon="group" label="Team" isActive={pathname === '/dashboard/team'} />
        </nav>
        <div className="border-t border-slate-200 pt-4 mt-4 dark:border-zinc-800">
          <div className="flex items-center justify-between px-3 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Workspaces</p>
            <button
              type="button"
              onClick={handleCreateFolder}
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label="Crear carpeta"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>
          {folders.length > 0 && (
            <nav className="flex flex-col gap-0.5">
              {folders.map((folder) => (
                <NavLink
                  key={folder.id}
                  href={`/dashboard/folder/${folder.id}`}
                  icon="folder"
                  label={folder.name}
                  isActive={pathname === `/dashboard/folder/${folder.id}`}
                />
              ))}
            </nav>
          )}
        </div>
        <nav className="flex flex-col gap-1 border-t border-slate-200 pt-4 mt-4 dark:border-zinc-800">
          <div className="px-3 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500">System</p>
          </div>
          <NavLink href="/dashboard/settings" icon="settings" label="Settings" isActive={pathname === '/dashboard/settings'} />
          <NavLink
            href="/dashboard/create-kpi"
            icon="add_circle"
            label="Create KPI"
            isActive={pathname === '/dashboard/create-kpi' || isEmpty}
          />
          <NavLink href="/support" icon="help" label="Support" isActive={pathname === '/support'} />
        </nav>
      </div>
    </aside>
  );
}
