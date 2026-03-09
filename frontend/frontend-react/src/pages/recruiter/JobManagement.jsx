import React from 'react';

const STATS = [
    { title: 'Active Jobs', value: '12', trend: '+2 this week', icon: 'work', color: 'text-green-600' },
    { title: 'Total Applicants', value: '1,248', trend: '+12% vs last month', icon: 'people', color: 'text-green-600' },
    { title: 'Pending Review', value: '45', trend: 'Requires attention', icon: 'pending_actions', color: 'text-slate-500' },
    { title: 'Avg Time to Hire', value: '18 Days', trend: '2 days faster', icon: 'timer', color: 'text-green-600' },
];

const JOBS = [
    { title: 'Senior Frontend Engineer', dept: 'Engineering', type: 'Full-time', location: 'Remote', status: 'Open', applicants: 124, score: 85, match: 'Strong Match' },
    { title: 'Product Designer', dept: 'Design', type: 'Contract', location: 'San Francisco', status: 'Open', applicants: 42, score: 62, match: 'Moderate Match' },
    { title: 'Marketing Manager', dept: 'Marketing', type: 'Full-time', location: 'New York', status: 'Draft', applicants: 0, score: 0, match: 'Not applicable' },
    { title: 'Data Scientist', dept: 'Product', type: 'Full-time', location: 'Remote', status: 'Closed', applicants: 215, score: 92, match: 'Excellent Match' },
];

export default function JobManagement() {
    return (
        <>
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <select className="px-3 py-2 text-sm bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md focus:ring-primary focus:border-primary">
                        <option>All Departments</option>
                        <option>Engineering</option>
                        <option>Design</option>
                    </select>
                    <select className="px-3 py-2 text-sm bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md focus:ring-primary focus:border-primary">
                        <option>All Locations</option>
                        <option>Remote</option>
                        <option>On-site</option>
                    </select>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">
                    <span className="material-symbols-outlined text-[18px]">add</span> Post New Job
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-2">
                {STATS.map((stat, i) => (
                    <div key={i} className="p-5 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-surface-dark shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-text-muted text-xs uppercase font-bold tracking-wide">{stat.title}</span>
                            <span className="material-symbols-outlined text-primary bg-primary/10 p-1 rounded">{stat.icon}</span>
                        </div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <span className={`text-xs flex items-center gap-1 mt-1 font-medium ${stat.color}`}>
                            {stat.trend}
                        </span>
                    </div>
                ))}
            </div>

            {/* Jobs Table */}
            <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark">
                            <tr>
                                <th className="py-4 px-6 font-semibold text-text-muted uppercase tracking-wider">Job Details</th>
                                <th className="py-4 px-6 font-semibold text-text-muted uppercase tracking-wider">Status</th>
                                <th className="py-4 px-6 font-semibold text-text-muted uppercase tracking-wider text-center">Applicants</th>
                                <th className="py-4 px-6 font-semibold text-text-muted uppercase tracking-wider">AI Score Avg</th>
                                <th className="py-4 px-6 font-semibold text-text-muted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light dark:divide-border-dark">
                            {JOBS.map((job, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="font-semibold text-base mb-1">{job.title}</div>
                                        <div className="text-xs text-text-muted flex items-center gap-2">
                                            {job.dept} • {job.location} • {job.type}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${job.status === 'Open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                                                job.status === 'Draft' ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900/30'
                                            }`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-center font-semibold">{job.applicants || '-'}</td>
                                    <td className="py-4 px-6">
                                        {job.score > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${job.score}%` }}></div>
                                                    </div>
                                                    <span className="text-xs font-bold">{job.score}%</span>
                                                </div>
                                                <span className="text-[10px] text-text-muted">{job.match}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-text-muted italic">N/A</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <button className="text-text-muted hover:text-primary transition-colors px-1"><span className="material-symbols-outlined text-[20px]">visibility</span></button>
                                        <button className="text-text-muted hover:text-primary transition-colors px-1"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}