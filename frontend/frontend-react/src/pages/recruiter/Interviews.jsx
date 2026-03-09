import React from 'react';

const INTERVIEWS = [
    { time: '10:00 AM', status: 'Starting soon', statusColor: 'amber', name: 'Sarah Jenkins', role: 'Senior Product Designer', round: '2nd Round', type: 'Google Meet', icon: 'videocam' },
    { time: '1:30 PM', duration: '45 mins', name: 'Mike Ross', role: 'Frontend Engineer', round: 'Technical Screen', type: 'Zoom', icon: 'videocam' },
    { time: '3:00 PM', duration: '30 mins', name: 'Jessica Lee', role: 'Marketing Manager', round: 'Initial Call', type: 'Phone: +1 555-1234', icon: 'call' },
];

export default function Interviews() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
            {/* Left Sidebar: Calendar & Filters */}
            <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
                <button className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold shadow-sm transition-colors">
                    <span className="material-symbols-outlined text-[20px]">add</span> Schedule Interview
                </button>

                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold">October 2026</h3>
                        <div className="flex gap-1">
                            <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><span className="material-symbols-outlined text-[20px]">chevron_left</span></button>
                            <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><span className="material-symbols-outlined text-[20px]">chevron_right</span></button>
                        </div>
                    </div>
                    {/* Simple Mock Calendar */}
                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-text-muted mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <div key={day} className={`p-2 rounded-lg cursor-pointer ${day === 24 ? 'bg-primary text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800 relative'}`}>
                                {day}
                                {[11, 25, 26].includes(day) && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"></span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Content: Schedule List */}
            <div className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-slate-50 dark:bg-surface-dark/50">
                    <div>
                        <h3 className="font-bold text-lg">Upcoming Interviews</h3>
                        <p className="text-sm text-text-muted">Tuesday, October 24th</p>
                    </div>
                    <div className="flex space-x-2">
                        <button className="px-4 py-1.5 text-sm font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-md shadow-sm border border-border-light dark:border-border-dark">Today</button>
                        <button className="px-4 py-1.5 text-sm font-medium text-text-muted hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors">Tomorrow</button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="relative pl-6 border-l-2 border-border-light dark:border-border-dark space-y-8">
                        {INTERVIEWS.map((interview, i) => (
                            <div key={i} className="relative bg-white dark:bg-slate-800/50 p-5 rounded-lg border border-border-light dark:border-border-dark shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center group hover:border-primary transition-colors">
                                <div className="absolute -left-[35px] top-6 size-4 rounded-full bg-primary ring-4 ring-white dark:ring-surface-dark"></div>

                                <div className="md:w-32 shrink-0 text-left w-full">
                                    <p className="font-bold text-lg">{interview.time}</p>
                                    {interview.status ? (
                                        <span className={`text-xs font-bold text-${interview.statusColor}-600 bg-${interview.statusColor}-50 dark:bg-${interview.statusColor}-900/30 px-2 py-0.5 rounded mt-1 inline-block`}>{interview.status}</span>
                                    ) : (
                                        <p className="text-xs text-text-muted mt-1">{interview.duration}</p>
                                    )}
                                </div>

                                <div className="flex-1 w-full">
                                    <h4 className="font-bold text-base">{interview.name}</h4>
                                    <p className="text-sm text-text-muted">{interview.role} • <span className="font-medium text-slate-600 dark:text-slate-300">{interview.round}</span></p>
                                </div>

                                <div className="md:text-right shrink-0 w-full md:w-auto">
                                    <button className="w-full md:w-auto bg-primary hover:bg-primary-dark text-white text-sm font-bold px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">{interview.icon}</span> Action
                                    </button>
                                    <p className="text-xs text-text-muted mt-2 text-center md:text-right">{interview.type}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}