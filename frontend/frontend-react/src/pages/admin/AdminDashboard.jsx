import React from 'react';

const STATS = [
    { title: 'Total Users', value: '12,450', trend: '+5.2%', icon: 'group', up: true },
    { title: 'Active Jobs', value: '856', trend: '+12%', icon: 'work', up: true },
    { title: 'Approvals', value: '24', trend: '+2 today', icon: 'pending_actions', up: true },
    { title: 'Uptime', value: '99.9%', trend: '-0.1%', icon: 'dns', up: false },
];

export default function AdminDashboard() {
    return (
        <div className="w-full max-w-[1440px] mx-auto p-6">
            <div className="flex justify-between items-end mb-8 pb-6 border-b border-border-light dark:border-border-dark">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Platform Overview</h2>
                    <p className="text-sm text-text-muted">System health is normal. Last updated: <span className="font-mono text-xs">14:02:45 UTC</span></p>
                </div>
                <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">add</span> New Category
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {STATS.map(stat => (
                    <div key={stat.title} className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-text-muted text-xs font-bold uppercase tracking-wider">{stat.title}</h3>
                            <span className="material-symbols-outlined text-text-muted">{stat.icon}</span>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                            <span className={`flex items-center text-xs font-bold ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                                <span className="material-symbols-outlined text-[14px]">
                                    {stat.up ? 'arrow_upward' : 'arrow_downward'}
                                </span>
                                {stat.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden">
                <div className="px-6 py-5 border-b border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="text-base font-bold">Pending Job Approvals</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="text-text-muted border-b border-border-light dark:border-border-dark">
                        <tr>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Job Title</th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Company</th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light dark:divide-border-dark">
                        {['Senior Product Designer', 'Frontend Developer', 'Marketing Manager'].map((job, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <td className="px-6 py-4 font-medium">{job}</td>
                                <td className="px-6 py-4 text-text-muted">TechFlow Inc.</td>
                                <td className="px-6 py-4">
                                    <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide">Review</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Approve">
                                            <span className="material-symbols-outlined text-[20px]">check</span>
                                        </button>
                                        <button className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Reject">
                                            <span className="material-symbols-outlined text-[20px]">close</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}