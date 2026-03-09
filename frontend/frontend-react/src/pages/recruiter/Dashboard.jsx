import React from 'react';

export default function Dashboard() {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stat Card 1 */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-md text-text-muted border border-border-light dark:border-border-dark">
                            <span className="material-symbols-outlined">folder_open</span>
                        </div>
                        <span className="flex items-center text-xs font-bold text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded">
                            <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span>
                            +12%
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Total Applications</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">1,248</h3>
                    </div>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-md text-text-muted border border-border-light dark:border-border-dark">
                            <span className="material-symbols-outlined">work_outline</span>
                        </div>
                        <span className="flex items-center text-xs font-bold text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded">
                            <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span>
                            +2%
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Active Jobs</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">12</h3>
                    </div>
                </div>

                {/* Stat Card 3 */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-md text-text-muted border border-border-light dark:border-border-dark">
                            <span className="material-symbols-outlined">pending_actions</span>
                        </div>
                        <span className="flex items-center text-xs font-bold text-orange-700 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded">
                            <span className="material-symbols-outlined text-[14px] mr-1">trending_flat</span>
                            +5%
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Pending Reviews</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">45</h3>
                    </div>
                </div>
            </div>

            {/* Chỗ trống cho Biểu đồ sẽ ghép sau */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6 h-64 flex flex-col items-center justify-center text-text-muted border-dashed mt-4 gap-2">
                <span className="material-symbols-outlined text-4xl opacity-50">bar_chart</span>
                <p>Biểu đồ tổng quan sẽ được hiển thị tại đây</p>
            </div>
        </>
    );
}