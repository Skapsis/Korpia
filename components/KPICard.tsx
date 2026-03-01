import { memo } from 'react';
import Link from 'next/link';

interface KPICardProps {
    title: string;
    value: string | number;
    unit?: string;
    trend?: number;
    icon: React.ReactNode;
    color?: 'blue' | 'emerald' | 'violet' | 'amber';
    href?: string;
}

const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', value: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', value: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600', value: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', value: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
};

function KPICardComponent({ title, value, unit, trend, icon, color = 'blue', href }: KPICardProps) {
    const c = colorMap[color];
    const trendPositive = trend !== undefined && trend >= 0;

    const Content = (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group h-full">
            <div className="flex items-start justify-between mb-4">
                <div className={`${c.bg} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                    <span className={c.icon}>{icon}</span>
                </div>
                {trend !== undefined && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trendPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {trendPositive ? '↑' : '↓'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium mb-1 group-hover:text-slate-700 transition-colors">{title}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">{value}</span>
                    {unit && <span className="text-slate-400 text-sm">{unit}</span>}
                </div>
                {href && (
                    <div className="mt-4 flex items-center text-[10px] font-bold text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver detalles →
                    </div>
                )}
            </div>
        </div>
    );

    if (href) {
        return <Link href={href}>{Content}</Link>;
    }

    return Content;
}

// Memoize to prevent unnecessary re-renders when parent updates
export const KPICard = memo(KPICardComponent);
