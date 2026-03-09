import React from 'react';

const NOTIFICATIONS = [
    { id: 1, type: 'new_app', icon: 'person_add', color: 'primary', title: 'New Application: Senior React Developer', time: '2m ago', desc: 'Sarah Jenkins applied for the Senior React Developer position. Resume highlights: 5 years React experience.', unread: true },
    { id: 2, type: 'ai_score', icon: 'psychology', color: 'purple-500', title: 'AI Score Ready: Product Manager', time: '15m ago', desc: 'AI analysis completed for Michael Chen. Candidate Match Score: 92%.', unread: true },
    { id: 3, type: 'interview', icon: 'calendar_month', color: 'orange-500', title: 'Interview Scheduled: UX Designer', time: '1h ago', desc: 'Confirmed interview with Emily Davis for tomorrow at 2:00 PM EST.', unread: false },
    { id: 4, type: 'system', icon: 'dns', color: 'slate-500', title: 'System Maintenance Completed', time: '3h ago', desc: 'The scheduled maintenance for the matching engine has been completed successfully.', unread: false },
];

export default function Notifications() {
    return (
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black tracking-tight mb-1">Notifications</h2>
                    <p className="text-text-muted text-sm">Stay updated on candidate activities, AI insights, and system alerts.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark text-sm font-bold shadow-sm transition-colors">
                    <span className="material-symbols-outlined text-[20px]">done_all</span> Mark all as read
                </button>
            </header>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <button className="px-4 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold">All</button>
                <button className="px-4 py-1.5 rounded-full border border-border-light dark:border-border-dark text-text-muted hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold transition-colors">
                    New Applications <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-full">3</span>
                </button>
                <button className="px-4 py-1.5 rounded-full border border-border-light dark:border-border-dark text-text-muted hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold transition-colors">AI Score Ready</button>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden shadow-sm flex flex-col">
                {NOTIFICATIONS.map(note => (
                    <div key={note.id} className="group flex items-start gap-4 p-5 border-b border-border-light dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative last:border-0">
                        {note.unread && <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${note.color.includes('-') ? note.color : 'primary'}`}></div>}

                        <div className="shrink-0 mt-1">
                            <div className={`size-10 rounded-full flex items-center justify-center bg-${note.color.includes('-') ? note.color.split('-')[0] : 'blue'}-50 dark:bg-slate-800 text-${note.color}`}>
                                <span className="material-symbols-outlined">{note.icon}</span>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <p className={`text-sm truncate pr-4 ${note.unread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-text-muted'}`}>{note.title}</p>
                                <span className={`text-xs whitespace-nowrap font-bold ${note.unread ? 'text-primary' : 'text-slate-400'}`}>{note.time}</span>
                            </div>
                            <p className="text-sm text-text-muted line-clamp-2">{note.desc}</p>
                        </div>

                        {note.unread && (
                            <div className="shrink-0 self-center">
                                <div className="size-2.5 rounded-full bg-primary"></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
