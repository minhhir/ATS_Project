import React from 'react';

export default function AIEvaluation() {
    const matchedSkills = ['Figma & FigJam', 'User Research', 'Wireframing', 'Adobe CC', 'Agile/Scrum'];
    const missingSkills = [
        { name: 'Team Management', note: 'Required: 2+ Years', icon: 'close', color: 'text-red-500' },
        { name: 'HTML/CSS Basics', note: 'Bonus Skill', icon: 'remove', color: 'text-amber-500' }
    ];

    return (
        <div className="max-w-[1280px] w-full mx-auto p-6 md:p-10 flex flex-col gap-10">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-border-light dark:border-border-dark pb-8">
                <div>
                    <div className="flex items-baseline gap-4 mb-2">
                        <h1 className="text-4xl font-semibold tracking-tight">Jane Doe</h1>
                        <span className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold px-2 py-1 rounded border border-green-200 dark:border-green-800/50">Top Match</span>
                    </div>
                    <p className="text-text-muted text-base">Applying for <span className="font-semibold text-text-main dark:text-white">Senior UX Designer</span></p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 rounded font-medium text-sm transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">close</span> Reject
                    </button>
                    <button className="px-5 py-2 bg-primary text-white hover:bg-primary-dark rounded font-medium text-sm transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">check</span> Invite to Interview
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: AI Score */}
                <div className="lg:col-span-8 flex flex-col gap-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        <div className="md:col-span-1">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 block">AI Match Score</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-7xl font-bold tracking-tighter text-primary">85</span>
                                <span className="text-3xl font-light text-text-muted">%</span>
                            </div>
                        </div>
                        <div className="md:col-span-2 flex flex-col gap-6 pt-2">
                            {[
                                { label: 'Skill Match', score: '92%', width: '92%', opacity: 'bg-primary' },
                                { label: 'Experience Relevance', score: '78%', width: '78%', opacity: 'bg-primary/70' },
                                { label: 'Education Fit', score: '100%', width: '100%', opacity: 'bg-primary/40' },
                            ].map(bar => (
                                <div key={bar.label}>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-medium text-text-muted">{bar.label}</span>
                                        <span className="text-sm font-semibold">{bar.score}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${bar.opacity}`} style={{ width: bar.width }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-surface-light dark:bg-surface-dark p-6 md:p-8 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-primary">
                            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                            <h3 className="text-base font-bold text-text-main dark:text-white">AI Evaluation Summary</h3>
                        </div>
                        <p className="text-text-muted text-sm md:text-base leading-relaxed mb-4">
                            Jane demonstrates an <strong className="text-text-main dark:text-white">exceptional alignment</strong> with the Senior UX Designer role. Her proficiency in Figma and User Research stands out. While her direct experience in SaaS products is slightly less than requested, her rapid career progression suggests high adaptability.
                        </p>
                        <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Recommendation</h4>
                            <p className="font-medium text-sm">Strongly recommended for technical interview. Focus questions on leadership scenarios.</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Skills Gap */}
                <div className="lg:col-span-4 pl-0 lg:pl-8 border-t pt-8 lg:pt-0 lg:border-t-0 lg:border-l border-border-light dark:border-border-dark">
                    <h3 className="text-base font-bold mb-6">Skills Gap Analysis</h3>

                    <div className="space-y-6">
                        <div>
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Matched Skills</h4>
                            <div className="space-y-2">
                                {matchedSkills.map(skill => (
                                    <div key={skill} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                                        <span className="text-sm text-text-muted">{skill}</span>
                                        <span className="material-symbols-outlined text-green-600 text-[18px]">check</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Missing/Weak</h4>
                            <div className="space-y-2">
                                {missingSkills.map(skill => (
                                    <div key={skill.name} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-text-muted">{skill.name}</span>
                                            <span className="text-[10px] text-slate-400">{skill.note}</span>
                                        </div>
                                        <span className={`material-symbols-outlined text-[18px] ${skill.color}`}>{skill.icon}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}