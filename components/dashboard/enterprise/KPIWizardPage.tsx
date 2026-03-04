'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { createKpi } from '@/app/actions/kpiActions';

type FormData = {
  name: string;
  description: string;
  category: string;
  unitType: string;
  trendDirection: 'up' | 'down';
  dataSource: string;
  folderId: string;
};

const INITIAL_FORM: FormData = {
  name: '',
  description: '',
  category: 'Financial',
  unitType: 'Currency (USD)',
  trendDirection: 'up',
  dataSource: 'FinancialRecord',
  folderId: '',
};

interface Folder {
  id: string;
  name: string;
  createdAt: Date | string;
}

/** Lienzo del detalle: wizard Create New KPI (Analytics Pro header + stepper + form). */
export function KPIWizardPage({ folders = [] }: { folders?: Folder[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof FormData, value: string | 'up' | 'down') => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    const result = await createKpi({
      name: formData.name,
      description: formData.description,
      category: formData.category,
      unitType: formData.unitType,
      trendDirection: formData.trendDirection,
      dataSource: formData.dataSource,
      folderId: formData.folderId || null,
    });
    if (result?.error) {
      setIsSubmitting(false);
      toast.error(result.error);
      return;
    }
    if (result?.success) {
      toast.success('KPI creado correctamente');
      router.push('/dashboard');
      return;
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-sans text-zinc-100">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-10 py-3">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-4">
            <span className="material-symbols-outlined text-[32px] text-blue-500" aria-hidden>analytics</span>
            <h2 className="text-lg font-bold tracking-tight text-zinc-100">Analytics Pro</h2>
          </Link>
          <label className="hidden h-10 min-w-40 max-w-64 flex-col lg:flex">
            <div className="flex h-full w-full flex-1 items-stretch rounded-lg ring-1 ring-zinc-700 transition-all focus-within:ring-2 focus-within:ring-blue-500">
              <div className="flex items-center justify-center rounded-l-lg bg-zinc-800 pl-4 text-zinc-400">
                <span className="material-symbols-outlined text-[20px]" aria-hidden>search</span>
              </div>
              <input type="text" className="flex min-w-0 flex-1 rounded-r-lg border-none bg-zinc-800 px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-0" placeholder="Search resources..." />
            </div>
          </label>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#" className="text-sm font-medium text-zinc-400 transition-opacity hover:opacity-80">Dashboards</Link>
          <Link href="#" className="text-sm font-medium text-zinc-400 transition-opacity hover:opacity-80">Reports</Link>
          <Link href="#" className="text-sm font-medium text-zinc-400 transition-opacity hover:opacity-80">Data Sources</Link>
          <Link href="/dashboard/config" className="text-sm font-medium text-zinc-400 transition-opacity hover:opacity-80">Settings</Link>
          <div className="flex items-center gap-4">
            <button type="button" className="relative text-zinc-400 transition-colors hover:text-zinc-100">
              <span className="material-symbols-outlined" aria-hidden>notifications</span>
              <span className="absolute top-0 right-0 size-2 rounded-full border-2 border-zinc-900 bg-red-500" />
            </button>
            <div className="h-8 w-px bg-zinc-700" />
            <div className="h-9 w-9 rounded-full bg-zinc-700 ring-2 ring-zinc-600" />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex w-full items-center gap-2 text-sm">
          <Link href="/dashboard" className="text-zinc-400 transition-colors hover:text-zinc-100">Home</Link>
          <span className="text-zinc-500">/</span>
          <Link href="/dashboard/config" className="text-zinc-400 transition-colors hover:text-zinc-100">KPIs</Link>
          <span className="text-zinc-500">/</span>
          <span className="font-medium text-zinc-100">Create New</span>
        </div>

        <div className="w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg">
          <div className="border-b border-zinc-800 p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h1 className="mb-2 text-2xl font-bold text-zinc-100">Create New KPI</h1>
                <p className="text-sm text-zinc-400">Define the core metrics for your new Key Performance Indicator.</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/30">Draft</span>
            </div>

            {/* Progress Stepper */}
            <div className="relative">
              <div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 rounded-full bg-zinc-800 -z-0" />
              <div
                className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 rounded-full bg-blue-600 -z-0 transition-all duration-500"
                style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
              />
              <div className="flex justify-between relative z-10">
                {[
                  { num: 1, label: 'Basic Info' },
                  { num: 2, label: 'Data Source' },
                  { num: 3, label: 'Review' },
                ].map(({ num, label }) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setStep(num)}
                    className="flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <div
                      className={`flex size-8 items-center justify-center rounded-full text-sm font-bold shadow-sm ring-4 ring-zinc-900 ${
                        step >= num ? 'bg-blue-600 text-white' : 'border-2 border-zinc-600 bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {num}
                    </div>
                    <span className={`absolute top-10 whitespace-nowrap text-xs ${step >= num ? 'font-semibold text-blue-500' : 'font-medium text-zinc-400'}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Paso 1: Basic Info */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-4">
                    <h3 className="text-sm font-semibold text-zinc-100">KPI Identity</h3>
                    <p className="mt-1 text-xs text-zinc-400">Give your KPI a recognizable name and description.</p>
                  </div>
                  <div className="md:col-span-8 space-y-6">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2" htmlFor="kpi-name">KPI Name</label>
                      <input
                        id="kpi-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => update('name', e.target.value)}
                        className="block w-full rounded-lg border border-zinc-600 bg-zinc-800 py-2.5 px-3 text-sm text-zinc-100 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="e.g. Monthly Recurring Revenue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2" htmlFor="kpi-desc">Description <span className="text-slate-400 lowercase font-normal">(optional)</span></label>
                      <textarea
                        id="kpi-desc"
                        value={formData.description}
                        onChange={(e) => update('description', e.target.value)}
                        className="block w-full resize-none rounded-lg border border-zinc-600 bg-zinc-800 py-2.5 px-3 text-sm text-zinc-100 shadow-sm"
                        rows={3}
                        placeholder="Briefly describe what this metric tracks..."
                      />
                    </div>
                  </div>
                </div>
                <hr className="border-slate-100 dark:border-slate-800" />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-4">
                    <h3 className="text-sm font-semibold text-zinc-100">Display Configuration</h3>
                    <p className="mt-1 text-xs text-zinc-400">Choose how this metric is formatted and categorized.</p>
                  </div>
                  <div className="md:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2" htmlFor="category">Category</label>
                        <select
                          id="category"
                          value={formData.category}
                          onChange={(e) => update('category', e.target.value)}
                          className="block w-full rounded-lg border border-zinc-600 bg-zinc-800 py-2.5 px-3 text-sm text-zinc-100 shadow-sm"
                        >
                          <option>Financial</option>
                          <option>Operational</option>
                          <option>Marketing</option>
                          <option>Sales</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2" htmlFor="unit">Unit Type</label>
                        <select
                          id="unit"
                          value={formData.unitType}
                          onChange={(e) => update('unitType', e.target.value)}
                          className="block w-full rounded-lg border border-zinc-600 bg-zinc-800 py-2.5 px-3 text-sm text-zinc-100 shadow-sm"
                        >
                          <option>Currency (USD)</option>
                          <option>Percentage (%)</option>
                          <option>Number (#)</option>
                          <option>Duration (h:m)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Trend Direction</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-all ${formData.trendDirection === 'up' ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500' : 'border-zinc-700 hover:border-emerald-500'}`}>
                          <input type="radio" name="trend-direction" value="up" checked={formData.trendDirection === 'up'} onChange={() => update('trendDirection', 'up')} className="sr-only" />
                          <span className="flex flex-col">
                            <span className="block text-sm font-medium text-zinc-100">Up is Good</span>
                            <span className="mt-1 flex items-center text-xs text-zinc-400">
                              <span className="material-symbols-outlined text-base mr-1 text-emerald-500">trending_up</span>
                              e.g. Revenue, Users
                            </span>
                          </span>
                        </label>
                        <label className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm transition-all ${formData.trendDirection === 'down' ? 'border-red-500 bg-red-500/10 ring-1 ring-red-500' : 'border-zinc-700 hover:border-red-500'}`}>
                          <input type="radio" name="trend-direction" value="down" checked={formData.trendDirection === 'down'} onChange={() => update('trendDirection', 'down')} className="sr-only" />
                          <span className="flex flex-col">
                            <span className="block text-sm font-medium text-zinc-100">Down is Good</span>
                            <span className="mt-1 flex items-center text-xs text-zinc-400">
                              <span className="material-symbols-outlined text-base mr-1 text-red-500">trending_down</span>
                              e.g. Churn, Bugs
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>
                    {folders.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2" htmlFor="folder">Carpeta <span className="text-slate-400 lowercase font-normal">(opcional)</span></label>
                        <select
                          id="folder"
                          value={formData.folderId}
                          onChange={(e) => update('folderId', e.target.value)}
                          className="block w-full rounded-lg border border-zinc-600 bg-zinc-800 py-2.5 px-3 text-sm text-zinc-100 shadow-sm"
                        >
                          <option value="">Sin carpeta (Dashboard principal)</option>
                          {folders.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Paso 2: Data Source */}
            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-4">
                  <h3 className="text-sm font-semibold text-zinc-100">Data Source</h3>
                  <p className="mt-1 text-xs text-zinc-400">Select where this KPI will pull its data from.</p>
                </div>
                <div className="md:col-span-8">
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2" htmlFor="data-source">Source</label>
                  <select
                    id="data-source"
                    value={formData.dataSource}
                    onChange={(e) => update('dataSource', e.target.value)}
                    className="block w-full rounded-lg border border-zinc-600 bg-zinc-800 py-2.5 px-3 text-sm text-zinc-100 shadow-sm"
                  >
                    <option value="FinancialRecord">FinancialRecord</option>
                    <option value="Sales_Data">Sales_Data</option>
                    <option value="Calendar">Calendar</option>
                  </select>
                  <p className="mt-2 text-xs text-zinc-500">FinancialRecord contains revenue, target, region, product, and date fields.</p>
                </div>
              </div>
            )}

            {/* Paso 3: Review */}
            {step === 3 && (
              <div className="space-y-6 rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
                <h3 className="text-sm font-semibold text-zinc-100">Review Summary</h3>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-zinc-400">KPI Name</dt>
                    <dd className="mt-1 text-sm text-zinc-100">{formData.name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-400">Description</dt>
                    <dd className="mt-1 text-sm text-zinc-100">{formData.description || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-400">Category</dt>
                    <dd className="mt-1 text-sm text-zinc-100">{formData.category}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-400">Unit Type</dt>
                    <dd className="mt-1 text-sm text-zinc-100">{formData.unitType}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-400">Trend Direction</dt>
                    <dd className="mt-1 text-sm text-zinc-100">{formData.trendDirection === 'up' ? 'Up is Good' : 'Down is Good'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-zinc-400">Data Source</dt>
                    <dd className="mt-1 text-sm text-zinc-100">{formData.dataSource}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-800/50 px-8 py-5">
            <div className="flex gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="inline-flex justify-center rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200 shadow-sm transition-colors hover:bg-zinc-700"
                >
                  Back
                </button>
              ) : (
                <Link href="/dashboard/config" className="inline-flex justify-center rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200 shadow-sm transition-colors hover:bg-zinc-700">
                  Cancel
                </Link>
              )}
            </div>
            <div className="flex gap-4">
              <button type="button" className="inline-flex justify-center rounded-lg border border-transparent bg-transparent px-4 py-2.5 text-sm font-semibold text-zinc-400 transition-colors hover:text-zinc-100">
                Save as Draft
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="inline-flex justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSubmitting || !formData.name.trim()}
                  className="inline-flex justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save KPI'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
