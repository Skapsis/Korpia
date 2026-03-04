'use client';

const MOCK_TEAM = [
  { id: '1', name: 'María García', email: 'maria@acme.com', role: 'Admin' as const, status: 'active' as const },
  { id: '2', name: 'Carlos López', email: 'carlos@acme.com', role: 'Editor' as const, status: 'active' as const },
  { id: '3', name: 'Ana Martínez', email: 'ana@acme.com', role: 'Viewer' as const, status: 'offline' as const },
  { id: '4', name: 'Pedro Sánchez', email: 'pedro@acme.com', role: 'Viewer' as const, status: 'active' as const },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function TeamPage() {
  return (
    <div className="flex h-full flex-col bg-zinc-950 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Team</h1>
          <p className="mt-1 text-sm text-zinc-400">Manage your team members and their roles.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:bg-blue-700"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>person_add</span>
          Invite Member
        </button>
      </div>

      <div className="flex-1 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-300">Avatar / Nombre</th>
                <th className="px-4 py-3 font-semibold text-zinc-300">Email</th>
                <th className="px-4 py-3 font-semibold text-zinc-300">Rol</th>
                <th className="px-4 py-3 font-semibold text-zinc-300">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {MOCK_TEAM.map((member) => (
                <tr key={member.id} className="hover:bg-zinc-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-200">
                        {getInitials(member.name)}
                      </div>
                      <span className="font-medium text-zinc-100">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{member.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        member.role === 'Admin'
                          ? 'bg-blue-500/20 text-blue-400'
                          : member.role === 'Editor'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-zinc-600 text-zinc-300'
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          member.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-500'
                        }`}
                        aria-hidden
                      />
                      <span className={member.status === 'active' ? 'text-zinc-300' : 'text-zinc-500'}>
                        {member.status === 'active' ? 'Active' : 'Offline'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
