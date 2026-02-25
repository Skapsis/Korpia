export function SkeletonKPI() {
    return (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 animate-pulse">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="h-4 w-24 bg-slate-700 rounded mb-2"></div>
                    <div className="h-8 w-32 bg-slate-700 rounded"></div>
                </div>
                <div className="h-10 w-10 bg-slate-700 rounded-lg"></div>
            </div>
            <div className="h-3 w-20 bg-slate-700 rounded"></div>
        </div>
    );
}

export function SkeletonChart() {
    return (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 animate-pulse">
            <div className="h-6 w-48 bg-slate-700 rounded mb-6"></div>
            <div className="h-64 bg-slate-700/30 rounded"></div>
        </div>
    );
}

export function SkeletonTable() {
    return (
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 animate-pulse">
            <div className="h-6 w-48 bg-slate-700 rounded mb-6"></div>
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-slate-700/30 rounded"></div>
                ))}
            </div>
        </div>
    );
}

export function SkeletonDashboard() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="animate-pulse">
                <div className="h-8 w-64 bg-slate-700 rounded mb-2"></div>
                <div className="h-4 w-96 bg-slate-700 rounded"></div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SkeletonKPI />
                <SkeletonKPI />
                <SkeletonKPI />
                <SkeletonKPI />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkeletonChart />
                <SkeletonChart />
            </div>
        </div>
    );
}
