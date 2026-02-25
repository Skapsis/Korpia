'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadCSV, downloadTemplate } from '@/lib/queries';
import { useAuth } from '@/lib/useAuth';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/errorHandling';

const COMPANY_OPTIONS = [
    { value: 'solvex', label: 'SOLVEX' },
    { value: 'el-mejor', label: 'EL MEJOR' },
];

const TYPE_OPTIONS = [
    { value: 'commercial', label: '📊 Datos Comerciales', desc: 'Potenciales, presupuestos, montos' },
    { value: 'operation', label: '⚙️ Datos de Operación', desc: 'Tiempo efectivo, órdenes, cancelaciones' },
    { value: 'quality', label: '⭐ Datos de Calidad', desc: 'NPS, cancelaciones técnicas, deficiencias' },
];

export default function UploadPage() {
    const { companySlug: defaultSlug } = useAuth();
    const queryClient = useQueryClient();
    const [companySlug, setCompanySlug] = useState(defaultSlug || 'solvex');
    const [type, setType] = useState('commercial');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const mutation = useMutation({
        mutationFn: () => uploadCSV(uploadedFile!, companySlug, type),
        onSuccess: (data) => {
            const label = COMPANY_OPTIONS.find(c => c.value === companySlug)?.label || companySlug.toUpperCase();
            toast.success(data.message || `Datos de ${label} actualizados correctamente.`);
            // Invalidate the KPI cache so dashboard re-fetches
            queryClient.invalidateQueries({ queryKey: ['kpis', companySlug] });
            setUploadedFile(null);
        },
        onError: (err: any) => {
            toast.error(getErrorMessage(err, 'Error al cargar el archivo. Verifica el formato y vuelve a intentar.'));
        },
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setUploadedFile(acceptedFiles[0]);
            toast.success(`Archivo "${acceptedFiles[0].name}" listo para subir.`);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.xls', '.xlsx'] },
        maxFiles: 1,
    });

    function handleSubmit() {
        if (!uploadedFile) {
            toast.error('Por favor selecciona un archivo primero.');
            return;
        }
        mutation.mutate();
    }

    return (
        <div className="p-8 max-w-3xl">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900">Carga de Datos</h1>
                <p className="text-slate-400 text-sm mt-1">Importa archivos CSV o Excel para actualizar los KPIs</p>
            </div>

            {/* Step 1: Select company */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-5">
                <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-black">1</span>
                    Selecciona la empresa
                </h2>
                <div className="flex gap-3 flex-wrap">
                    {COMPANY_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setCompanySlug(opt.value)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all
                                ${companySlug === opt.value
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 2: Select type */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-5">
                <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-black">2</span>
                    Selecciona el tipo de datos
                </h2>
                <div className="space-y-2">
                    {TYPE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setType(opt.value)}
                            className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all
                                ${type === opt.value
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                        >
                            <div>
                                <p className={`text-sm font-bold ${type === opt.value ? 'text-blue-700' : 'text-slate-700'}`}>{opt.label}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => downloadTemplate(type)}
                    className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium"
                >
                    ⬇️ Descargar plantilla CSV para "{TYPE_OPTIONS.find(t => t.value === type)?.label}"
                </button>
            </div>

            {/* Step 3: Upload */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
                <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-black">3</span>
                    Sube el archivo
                </h2>
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
                        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}
                        ${uploadedFile ? 'border-emerald-400 bg-emerald-50' : ''}
                    `}
                >
                    <input {...getInputProps()} />
                    {uploadedFile ? (
                        <div>
                            <div className="text-4xl mb-3">✅</div>
                            <p className="font-bold text-emerald-700 text-sm">{uploadedFile.name}</p>
                            <p className="text-slate-400 text-xs mt-1">{(uploadedFile.size / 1024).toFixed(1)} KB · Listo para subir</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                                className="mt-3 text-xs text-red-400 hover:text-red-600 underline"
                            >
                                Cambiar archivo
                            </button>
                        </div>
                    ) : isDragActive ? (
                        <div>
                            <div className="text-4xl mb-3">📂</div>
                            <p className="text-blue-600 font-bold text-sm">Suelta el archivo aquí</p>
                        </div>
                    ) : (
                        <div>
                            <div className="text-4xl mb-3">📤</div>
                            <p className="text-slate-600 font-medium text-sm">Arrastra tu archivo CSV/Excel aquí</p>
                            <p className="text-slate-400 text-xs mt-1">o haz click para seleccionar</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Submit */}
            <button
                onClick={handleSubmit}
                disabled={!uploadedFile || mutation.isPending}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3"
            >
                {mutation.isPending ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Procesando...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Subir y Procesar
                    </>
                )}
            </button>
        </div>
    );
}
