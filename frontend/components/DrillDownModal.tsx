'use client';

import React from 'react';
import { X } from 'lucide-react';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  columns: { header: string; accessor?: string; key?: string; format?: string }[];
}

export default function DrillDownModal({ isOpen, onClose, title, data, columns }: DrillDownModalProps) {
  if (!isOpen) return null;

  const formatValue = (value: any, format?: string) => {
    if (format === 'currency' && typeof value === 'number') {
      return new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP', 
        maximumFractionDigits: 0 
      }).format(value);
    }
    return value;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Table) */}
        <div className="p-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  {columns.map((col, index) => (
                    <th key={index} className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {data.length > 0 ? (
                  data.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-slate-50 transition-colors">
                      {columns.map((col, colIndex) => {
                        const cellKey = col.key || col.accessor || '';
                        return (
                          <td key={colIndex} className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                            {formatValue(row[cellKey], col.format)}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                      No hay datos disponibles para esta selección.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
