import React from 'react';

export default function Analytics() {
    // Dữ liệu giả lập biểu đồ
    const chartData = [
        { label: 'JAN', app: 35, hire: 15 }, { label: 'FEB', app: 42, hire: 18 },
        { label: 'MAR', app: 55, hire: 22 }, { label: 'APR', app: 48, hire: 20 },
        { label: 'MAY', app: 60, hire: 25 }, { label: 'JUN', app: 68, hire: 28 },
        { label: 'JUL', app: 75, hire: 32 }, { label: 'AUG', app: 62, hire: 28 },
        { label: 'SEP', app: 70, hire: 30 }, { label: 'OCT', app: 82, hire: 35 },
        { label: 'NOV', app: 90, hire: 38 }, { label: 'DEC', app: 65, hire: 25 },
    ];

    return (
        <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Avg. Time to Hire</h3>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-bold">18 Days</span>
                        <span className="text-sm font-bold text-green-600 mb-1 flex items-center"><span className="material-symbols-outlined text-[16px]">trending_down</span> 2 days faster</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Offer Acceptance Rate</h3>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-bold">88%</span>
                        <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-2 overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '88%' }}></div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Top Source</h3>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-bold">LinkedIn</span>
                        <span className="text-sm font-bold text-text-muted mb-1">45% of hires</span>
                    </div>
                </div>
            </div>

            {/* Bar Chart Container */}
            <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-lg font-bold">Recruitment Trends</h3>
                        <p className="text-sm text-text-muted">Applications vs Hires over last 12 months</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="flex gap-3 text-xs font-bold text-text-muted">
                            <span className="flex items-center gap-1"><span className="size-3 bg-primary rounded-sm"></span> APPS</span>
                            <span className="flex items-center gap-1"><span className="size-3 bg-slate-300 dark:bg-slate-600 rounded-sm"></span> HIRED</span>
                        </div>
                        <button className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md text-sm font-bold border border-border-light dark:border-border-dark flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">download</span> Export
                        </button>
                    </div>
                </div>

                {/* Pure CSS React Chart */}
                <div className="h-64 flex items-end justify-between gap-2 px-2 border-b border-border-light dark:border-border-dark pb-2">
                    {chartData.map((data, index) => (
                        <div key={index} className="flex flex-col items-center gap-2 flex-1 group relative">
                            <div className="flex items-end gap-1 h-52 w-full justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                                {/* Ứng tuyển */}
                                <div className="w-3 sm:w-5 bg-primary rounded-t-sm transition-all duration-500" style={{ height: `${data.app}%` }}></div>
                                {/* Trúng tuyển */}
                                <div className="w-3 sm:w-5 bg-slate-300 dark:bg-slate-600 rounded-t-sm transition-all duration-500" style={{ height: `${data.hire}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-text-muted">{data.label}</span>

                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded py-1 px-2 z-10 whitespace-nowrap shadow-lg">
                                Apps: {data.app * 10} | Hired: {data.hire * 2}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}