'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';

const MOCK_USERS = [
  { id: '1', name: 'María García', email: 'maria@acme.com', role: 'Admin' },
  { id: '2', name: 'Carlos López', email: 'carlos@acme.com', role: 'Editor' },
  { id: '3', name: 'Ana Martínez', email: 'ana@acme.com', role: 'Viewer' },
  { id: '4', name: 'Pedro Sánchez', email: 'pedro@acme.com', role: 'Viewer' },
];

type TabId = 'profile' | 'users' | 'preferences';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [users, setUsers] = useState(MOCK_USERS);
  const [language, setLanguage] = useState('es');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleDeleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'users', label: 'User Management' },
    { id: 'preferences', label: 'Preferences' },
  ];

  return (
    <div className="flex h-full flex-col bg-slate-50 p-6 dark:bg-zinc-950">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Manage your account and application preferences.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200 dark:border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-500'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 rounded-lg border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Profile</h2>
            <div className="grid max-w-md gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-400">Name</label>
                <input
                  type="text"
                  defaultValue="Acme Corp"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-400">Email</label>
                <input
                  type="email"
                  defaultValue="admin@acme.com"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              <button type="button" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">User Management</h2>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 dark:bg-zinc-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-zinc-300">User</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-zinc-300">Email</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-zinc-300">Role</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 dark:text-zinc-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100">{user.name}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-zinc-400">{user.email}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-zinc-300">{user.role}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="mr-2 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-500/10 dark:text-blue-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.id)}
                          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Preferences</h2>
            <div className="max-w-md space-y-6">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-400">Tema</label>
                <div className="flex gap-2">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                        theme === t
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {t === 'light' ? 'Light Mode' : t === 'dark' ? 'Dark Mode' : 'System'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-400">Idioma</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                </select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">Notificaciones</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Recibir alertas por email y en la app</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationsEnabled}
                  onClick={() => setNotificationsEnabled((v) => !v)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    notificationsEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
